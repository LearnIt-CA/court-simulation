const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const cases = require("./cases");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3001;
const STATE_FILE = path.join(__dirname, "state.json");

// Stage order
const STAGES = [
  "intro",
  "pre-results",
  "side1",
  "side2",
  "debate",
  "post-vote",
  "post-results",
];

// Which stages have voting open
const VOTE_STAGE = {
  intro: "pre",
  "post-vote": "post",
};

function defaultState() {
  const votes = {};
  for (let c = 0; c < 3; c++) {
    votes[`${c}_pre`] = { side1: [], side2: [] };
    votes[`${c}_post`] = { side1: [], side2: [] };
  }
  return {
    currentCase: 0,
    currentStage: "intro",
    votes,
    finished: false,
  };
}

function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return defaultState();
  }
}

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

let state = loadState();

function getPublicState() {
  // Summarise votes as counts for broadcast
  const voteSummary = {};
  for (const key of Object.keys(state.votes)) {
    voteSummary[key] = {
      side1: state.votes[key].side1.length,
      side2: state.votes[key].side2.length,
    };
  }
  return {
    currentCase: state.currentCase,
    currentStage: state.currentStage,
    finished: state.finished,
    votes: voteSummary,
  };
}

function getStudentVotes(studentId) {
  const result = {};
  for (const key of Object.keys(state.votes)) {
    if (state.votes[key].side1.includes(studentId)) result[key] = "side1";
    else if (state.votes[key].side2.includes(studentId)) result[key] = "side2";
  }
  return result;
}

function rewindStage() {
  if (state.finished) {
    state.finished = false;
    saveState();
    return;
  }
  const stageIdx = STAGES.indexOf(state.currentStage);
  if (stageIdx > 0) {
    state.currentStage = STAGES[stageIdx - 1];
  } else if (state.currentCase > 0) {
    state.currentCase -= 1;
    state.currentStage = STAGES[STAGES.length - 1];
  }
  saveState();
}

function advanceStage() {
  const stageIdx = STAGES.indexOf(state.currentStage);
  if (stageIdx < STAGES.length - 1) {
    state.currentStage = STAGES[stageIdx + 1];
  } else {
    // End of stages for this case
    if (state.currentCase < cases.length - 1) {
      state.currentCase += 1;
      state.currentStage = "intro";
    } else {
      state.finished = true;
    }
  }
  saveState();
}

function resetState() {
  state = defaultState();
  saveState();
}

// Serve built client in production
const clientDist = path.join(__dirname, "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!socket\.io).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

io.on("connection", (socket) => {
  // Send current state on connect
  socket.emit("state", getPublicState());

  // Student registers their ID to get their vote history
  socket.on("register", (studentId) => {
    socket.emit("my_votes", getStudentVotes(studentId));
  });

  // Student votes
  socket.on("vote", ({ studentId, caseIdx, voteType, side }) => {
    const key = `${caseIdx}_${voteType}`;
    if (!state.votes[key]) return;

    // Remove from both sides first (allows changing vote)
    state.votes[key].side1 = state.votes[key].side1.filter((id) => id !== studentId);
    state.votes[key].side2 = state.votes[key].side2.filter((id) => id !== studentId);

    // Add to chosen side
    if (side === "side1" || side === "side2") {
      state.votes[key][side].push(studentId);
    }

    saveState();
    // Broadcast updated vote counts to everyone
    io.emit("state", getPublicState());
    // Send personal vote record back to voter
    socket.emit("my_votes", getStudentVotes(studentId));
  });

  // Main screen: go back one stage
  socket.on("prev", () => {
    rewindStage();
    io.emit("state", getPublicState());
  });

  // Main screen: jump directly to a case
  socket.on("jumpToCase", ({ caseIdx }) => {
    if (caseIdx < 0 || caseIdx >= cases.length) return;
    state.currentCase = caseIdx;
    state.currentStage = "intro";
    state.finished = false;
    saveState();
    io.emit("state", getPublicState());
  });

  // Main screen: advance stage
  socket.on("advance", () => {
    advanceStage();
    io.emit("state", getPublicState());
  });

  // Main screen: reset everything
  socket.on("reset", () => {
    resetState();
    io.emit("state", getPublicState());
  });
});

server.listen(PORT, () => {
  console.log(`Court Simulation running on http://localhost:${PORT}`);
  console.log(`Main screen: http://localhost:${PORT}/main`);
  console.log(`Student screen: http://localhost:${PORT}/`);
});
