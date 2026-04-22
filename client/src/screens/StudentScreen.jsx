import React, { useEffect, useState, useRef } from "react";
import socket from "../socket";

const CASES = [
  {
    title: "Case 1: Climate Justice",
    side1: { name: "Team Claimants", short: "Claimants" },
    side2: { name: "Team Province", short: "Province" },
  },
  {
    title: "Case 2: Sovereignty Clash",
    side1: { name: "Team Defenders", short: "Defenders" },
    side2: { name: "Team Company", short: "Company" },
  },
  {
    title: "Case 3: AI & Arrest",
    side1: { name: "Team Plaintiff", short: "Plaintiff" },
    side2: { name: "Team City", short: "City" },
  },
];

const STAGE_LABELS = {
  intro: "Pre-Court Vote Open",
  "pre-results": "Viewing Pre-Vote Results",
  side1: "Side 1 Presenting",
  side2: "Side 2 Presenting",
  debate: "Open Debate",
  "post-vote": "Post-Court Vote Open",
  "post-results": "Viewing Post-Vote Results",
};

// Deterministic student ID stored in localStorage
function getStudentId() {
  let id = localStorage.getItem("court_student_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("court_student_id", id);
  }
  return id;
}

// Returns whether a vote slot is currently active
function isVoteActive(serverState, caseIdx, voteType) {
  if (!serverState) return false;
  if (serverState.finished) return false;
  if (serverState.currentCase !== caseIdx) return false;
  if (voteType === "pre" && serverState.currentStage === "intro") return true;
  if (voteType === "post" && serverState.currentStage === "post-vote") return true;
  return false;
}

// Returns whether a vote slot is permanently locked (stage already passed)
function isVoteLocked(serverState, caseIdx, voteType) {
  if (!serverState) return true;
  if (serverState.finished) return true;

  const caseOrder = serverState.currentCase;
  if (caseIdx < caseOrder) return true; // Past case
  if (caseIdx > caseOrder) return false; // Future case — not locked, just not active

  // Same case
  const stage = serverState.currentStage;
  const prePassed = ["pre-results", "side1", "side2", "debate", "post-vote", "post-results"];
  const postPassed = ["post-results"];

  if (voteType === "pre" && prePassed.includes(stage)) return true;
  if (voteType === "post" && postPassed.includes(stage)) return true;
  return false;
}

// Returns whether a slot is upcoming (future case or future vote in same case)
function isUpcoming(serverState, caseIdx, voteType) {
  if (!serverState) return true;
  if (serverState.currentCase > caseIdx) return false;
  if (serverState.currentCase < caseIdx) return true;
  // Same case
  const stage = serverState.currentStage;
  const preStages = ["intro"];
  const postStages = ["post-vote"];
  const preUpcoming = !["intro", "pre-results", "side1", "side2", "debate", "post-vote", "post-results"].includes(stage);
  if (voteType === "pre") return false; // pre-vote is always at intro, never upcoming within same case
  if (voteType === "post") {
    return ["intro", "pre-results", "side1", "side2", "debate"].includes(stage);
  }
  return false;
}

function VoteButton({ label, color, onClick, selected, disabled, upcoming }) {
  const base = "flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 border";

  if (upcoming || (disabled && !selected)) {
    return (
      <button disabled className={`${base} border-slate-800 bg-slate-900 text-slate-700 cursor-not-allowed`}>
        {label}
      </button>
    );
  }

  if (selected) {
    const colors = {
      blue: "border-blue-500 bg-blue-500/20 text-blue-300",
      amber: "border-amber-500 bg-amber-500/20 text-amber-300",
    };
    return (
      <button disabled className={`${base} ${colors[color]} cursor-default`}>
        ✓ {label}
      </button>
    );
  }

  const colors = {
    blue: "border-blue-600 bg-blue-600 text-white hover:bg-blue-500",
    amber: "border-amber-500 bg-amber-500 text-slate-900 hover:bg-amber-400",
  };
  return (
    <button onClick={onClick} className={`${base} ${colors[color]}`}>
      {label}
    </button>
  );
}

export default function StudentScreen() {
  const studentId = useRef(getStudentId()).current;
  const [serverState, setServerState] = useState(null);
  const [myVotes, setMyVotes] = useState({}); // { "0_pre": "side1", "1_post": "side2", ... }

  useEffect(() => {
    socket.on("connect", () => {
      socket.emit("register", studentId);
    });

    socket.on("state", (s) => setServerState(s));

    socket.on("my_votes", (votes) => {
      setMyVotes(votes);
      // Sync to localStorage
      localStorage.setItem("court_my_votes", JSON.stringify(votes));
    });

    // Restore from localStorage immediately while waiting for server
    const cached = localStorage.getItem("court_my_votes");
    if (cached) {
      try { setMyVotes(JSON.parse(cached)); } catch {}
    }

    // If already connected, register immediately
    if (socket.connected) {
      socket.emit("register", studentId);
    }

    return () => {
      socket.off("connect");
      socket.off("state");
      socket.off("my_votes");
    };
  }, []);

  function handleVote(caseIdx, voteType, side) {
    socket.emit("vote", { studentId, caseIdx, voteType, side });
    // Optimistic update
    setMyVotes((prev) => ({ ...prev, [`${caseIdx}_${voteType}`]: side }));
  }

  const currentStageLabel = serverState
    ? serverState.finished
      ? "Simulation Complete"
      : STAGE_LABELS[serverState.currentStage] || serverState.currentStage
    : "Connecting...";

  const currentCaseLabel = serverState && !serverState.finished
    ? CASES[serverState.currentCase]?.title
    : null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚖️</span>
          <div>
            <h1 className="text-white font-serif font-semibold text-base leading-none">
              Court Simulation
            </h1>
            <p className="text-amber-400 text-xs mt-1 font-medium">{currentStageLabel}</p>
          </div>
        </div>
        {currentCaseLabel && (
          <p className="text-slate-500 text-xs mt-2 pl-9">{currentCaseLabel}</p>
        )}
      </div>

      {/* Vote cards */}
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg mx-auto w-full">
        <p className="text-slate-600 text-xs uppercase tracking-widest px-1">Your Votes</p>

        {CASES.map((c, caseIdx) => (
          <div key={caseIdx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Case header */}
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
              <p className="text-white text-sm font-semibold">{c.title}</p>
            </div>

            {/* Pre-vote row */}
            {(["pre", "post"]).map((voteType) => {
              const key = `${caseIdx}_${voteType}`;
              const myVote = myVotes[key];
              const active = isVoteActive(serverState, caseIdx, voteType);
              const locked = isVoteLocked(serverState, caseIdx, voteType);
              const upcoming = isUpcoming(serverState, caseIdx, voteType);

              const rowLabel = voteType === "pre" ? "Pre-Court Vote" : "Post-Court Vote";
              const statusText = active
                ? "Vote now"
                : locked && myVote
                ? "Voted"
                : locked
                ? "Closed"
                : upcoming
                ? "Coming up"
                : myVote
                ? "Voted"
                : "";

              const statusColor = active
                ? "text-green-400"
                : locked && myVote
                ? "text-slate-400"
                : locked
                ? "text-slate-700"
                : upcoming
                ? "text-slate-600"
                : "text-slate-500";

              return (
                <div
                  key={voteType}
                  className={`px-4 py-3 ${voteType === "pre" ? "border-b border-slate-800/50" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-400 text-xs">{rowLabel}</p>
                    <span className={`text-xs font-medium ${statusColor}`}>
                      {active && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-1.5 mb-0.5" />
                      )}
                      {statusText}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <VoteButton
                      label={c.side1.name}
                      color="blue"
                      selected={myVote === "side1"}
                      disabled={!active}
                      upcoming={upcoming && !myVote}
                      onClick={() => handleVote(caseIdx, voteType, "side1")}
                    />
                    <VoteButton
                      label={c.side2.name}
                      color="amber"
                      selected={myVote === "side2"}
                      disabled={!active}
                      upcoming={upcoming && !myVote}
                      onClick={() => handleVote(caseIdx, voteType, "side2")}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {serverState?.finished && (
          <div className="text-center text-slate-600 text-sm py-6">
            The simulation has concluded. Thank you for participating.
          </div>
        )}
      </div>
    </div>
  );
}
