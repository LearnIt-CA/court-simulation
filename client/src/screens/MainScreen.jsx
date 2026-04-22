import React, { useEffect, useState } from "react";
import socket from "../socket";
import DonutChart from "../components/DonutChart";
import Timer from "../components/Timer";
import QRCodeDisplay from "../components/QRCodeDisplay";

const CASES = [
  {
    title: "Case 1: Climate Justice",
    intro:
      "Seven young Ontarians, some as young as 12 when they filed the case, are suing the provincial government for rolling back its climate targets. They argue that the weaker targets violate their constitutional rights to life, liberty, and security under the Canadian Charter. Just days before a scheduled hearing in December 2025, Ontario repealed its climate legislation entirely.",
    side1: { name: "Team Claimants", short: "Claimants" },
    side2: { name: "Team Province", short: "Province" },
  },
  {
    title: "Case 2: Sovereignty Clash",
    intro:
      "Indigenous land defenders were arrested and found guilty of criminal contempt for blocking a natural gas pipeline through their unceded territory, land the Supreme Court of Canada confirmed was never surrendered by treaty. The hereditary chiefs who govern the land never gave consent, while elected band councils did. Two legitimate legal systems, court injunctions and Indigenous sovereignty, collide head-on.",
    side1: { name: "Team Defenders", short: "Defenders" },
    side2: { name: "Team Company", short: "Company" },
  },
  {
    title: "Case 3: AI & Arrest",
    intro:
      "Robert Williams, a Black man, was arrested at his home in front of his family after a facial recognition system identified him as a match to a suspect, in what became the first widely reported AI-assisted arrest of its kind in the U.S., sparking debate over the use of emerging technology in policing.",
    side1: { name: "Team Plaintiff", short: "Plaintiff" },
    side2: { name: "Team City", short: "City" },
  },
];

const STAGE_LABELS = {
  intro: "Pre-Court Vote Open",
  "pre-results": "Pre-Court Results",
  side1: "Side 1 Presents",
  side2: "Side 2 Presents",
  debate: "Open Debate",
  "post-vote": "Post-Court Vote Open",
  "post-results": "Post-Court Results",
};

const NEXT_LABELS = {
  intro: "Show Pre-Vote Results",
  "pre-results": "Side 1 Presents →",
  side1: "Side 2 Presents →",
  side2: "Open Debate →",
  debate: "Post-Court Vote →",
  "post-vote": "Show Post-Vote Results",
  "post-results": "Next Case →",
};

function StagePill({ label, active }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
        active
          ? "bg-amber-500/20 border-amber-500 text-amber-400"
          : "bg-slate-800 border-slate-700 text-slate-500"
      }`}
    >
      {label}
    </span>
  );
}

function CaseNav({ currentCase, onJumpToCase }) {
  return (
    <div className="flex items-center gap-2">
      {CASES.map((c, i) => (
        <button
          key={i}
          onClick={() => i !== currentCase && onJumpToCase(i)}
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors ${
            i === currentCase
              ? "bg-amber-500/20 border-amber-500 text-amber-400 cursor-default"
              : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300 cursor-pointer"
          }`}
        >
          Case {i + 1}
        </button>
      ))}
    </div>
  );
}

// ── Individual stage slide components ────────────────────────────────────────

function IntroSlide({ caseData, votes, caseIdx }) {
  const pre = votes[`${caseIdx}_pre`] || { side1: 0, side2: 0 };
  const total = pre.side1 + pre.side2;

  return (
    <div className="flex flex-1 gap-8">
      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center gap-8">
        <div>
          <p className="text-amber-500 text-sm uppercase tracking-widest mb-3 font-semibold">
            Case Introduction
          </p>
          <h1 className="font-serif text-4xl font-bold text-white mb-6 leading-snug">
            {caseData.title}
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
            {caseData.intro}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl px-5 py-3">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-blue-300 font-semibold">{caseData.side1.name}</span>
          </div>
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-amber-300 font-semibold">{caseData.side2.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <span className="text-sm">
            Voting is open on student devices
            {total > 0 && (
              <span className="ml-2 text-green-400 font-semibold">· {total} vote{total !== 1 ? "s" : ""} received</span>
            )}
          </span>
        </div>
      </div>

      {/* QR code */}
      <div className="flex flex-col items-center justify-center gap-4 min-w-[180px]">
        <p className="text-slate-500 text-sm text-center">Students scan to vote</p>
        <QRCodeDisplay />
      </div>
    </div>
  );
}

function ResultsSlide({ caseData, votes, caseIdx, type }) {
  const key = `${caseIdx}_${type}`;
  const v = votes[key] || { side1: 0, side2: 0 };
  const label = type === "pre" ? "Pre-Court Vote" : "Post-Court Vote";

  // For post-results, also show pre alongside
  const preKey = `${caseIdx}_pre`;
  const preV = votes[preKey] || { side1: 0, side2: 0 };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <p className="text-amber-500 text-sm uppercase tracking-widest mb-2 font-semibold">
          {label} Results
        </p>
        <h2 className="font-serif text-3xl font-bold text-white">{caseData.title}</h2>
      </div>

      {type === "post" ? (
        <div className="flex gap-16 items-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-400 text-sm uppercase tracking-wider">Before</p>
            <DonutChart
              side1Count={preV.side1}
              side2Count={preV.side2}
              side1Name={caseData.side1.short}
              side2Name={caseData.side2.short}
              size={180}
            />
          </div>
          <div className="text-4xl text-slate-600">→</div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-400 text-sm uppercase tracking-wider">After</p>
            <DonutChart
              side1Count={v.side1}
              side2Count={v.side2}
              side1Name={caseData.side1.short}
              side2Name={caseData.side2.short}
              size={220}
            />
          </div>
        </div>
      ) : (
        <DonutChart
          side1Count={v.side1}
          side2Count={v.side2}
          side1Name={caseData.side1.short}
          side2Name={caseData.side2.short}
          size={240}
        />
      )}
    </div>
  );
}

function PresentationSlide({ caseData, side, minutes }) {
  const teamName = side === "side1" ? caseData.side1.name : caseData.side2.name;
  const color = side === "side1" ? "blue" : "amber";
  const colorClasses = {
    blue: {
      pill: "bg-blue-500/20 border-blue-500 text-blue-300",
      text: "text-blue-400",
    },
    amber: {
      pill: "bg-amber-500/20 border-amber-500 text-amber-300",
      text: "text-amber-400",
    },
  }[color];

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <span className={`inline-block px-4 py-1 rounded-full border text-sm font-semibold uppercase tracking-widest mb-4 ${colorClasses.pill}`}>
          Now Presenting
        </span>
        <h2 className={`font-serif text-5xl font-bold mb-2 ${colorClasses.text}`}>
          {teamName}
        </h2>
        <p className="text-slate-500 text-sm">Listen carefully — you will vote again after the debate</p>
      </div>
      <Timer minutes={minutes} label={`${minutes}-minute presentation`} />
    </div>
  );
}

function DebateSlide() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <span className="inline-block px-4 py-1 rounded-full border border-slate-600 text-slate-400 text-sm font-semibold uppercase tracking-widest mb-4">
          Open Debate
        </span>
        <h2 className="font-serif text-5xl font-bold text-white mb-2">
          Free Debate
        </h2>
        <p className="text-slate-500 text-sm">Both teams may respond, question, and rebut</p>
      </div>
      <Timer minutes={3} label="3-minute open debate" />
    </div>
  );
}

function PostVoteSlide({ caseData, votes, caseIdx }) {
  const post = votes[`${caseIdx}_post`] || { side1: 0, side2: 0 };
  const total = post.side1 + post.side2;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <p className="text-amber-500 text-sm uppercase tracking-widest mb-2 font-semibold">
          Post-Court Vote
        </p>
        <h2 className="font-serif text-3xl font-bold text-white mb-2">{caseData.title}</h2>
        <p className="text-slate-400">Have the arguments changed your mind?</p>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl px-5 py-3">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-blue-300 font-semibold">{caseData.side1.name}</span>
        </div>
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-amber-300 font-semibold">{caseData.side2.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-slate-400">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
        <span className="text-sm">
          Post-court voting is open
          {total > 0 && (
            <span className="ml-2 text-green-400 font-semibold">· {total} vote{total !== 1 ? "s" : ""} received</span>
          )}
        </span>
      </div>
    </div>
  );
}

function FinishedSlide({ votes }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
      <div className="text-6xl">⚖️</div>
      <h2 className="font-serif text-4xl font-bold text-white">Simulation Complete</h2>
      <p className="text-slate-400 max-w-md">
        All three cases have been heard. Thank you for participating in the court simulation.
      </p>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MainScreen() {
  const [state, setState] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    socket.on("state", (s) => setState(s));
    return () => socket.off("state");
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Connecting...
      </div>
    );
  }

  const { currentCase, currentStage, votes, finished } = state;
  const caseData = CASES[currentCase];
  const isLastCase = currentCase === CASES.length - 1;
  const isLastStage = currentStage === "post-results";

  function handleAdvance() {
    socket.emit("advance");
  }

  function handlePrev() {
    socket.emit("prev");
  }

  function handleJumpToCase(caseIdx) {
    socket.emit("jumpToCase", { caseIdx });
  }

  function handleReset() {
    if (confirmReset) {
      socket.emit("reset");
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  }

  function renderSlide() {
    if (finished) return <FinishedSlide votes={votes} />;

    switch (currentStage) {
      case "intro":
        return <IntroSlide caseData={caseData} votes={votes} caseIdx={currentCase} />;
      case "pre-results":
        return <ResultsSlide caseData={caseData} votes={votes} caseIdx={currentCase} type="pre" />;
      case "side1":
        return <PresentationSlide key={`${currentCase}-side1`} caseData={caseData} side="side1" minutes={2} />;
      case "side2":
        return <PresentationSlide key={`${currentCase}-side2`} caseData={caseData} side="side2" minutes={2} />;
      case "debate":
        return <DebateSlide key={`${currentCase}-debate`} />;
      case "post-vote":
        return <PostVoteSlide caseData={caseData} votes={votes} caseIdx={currentCase} />;
      case "post-results":
        return <ResultsSlide caseData={caseData} votes={votes} caseIdx={currentCase} type="post" />;
      default:
        return null;
    }
  }

  const nextLabel = finished
    ? null
    : isLastCase && isLastStage
    ? "Finish"
    : NEXT_LABELS[currentStage] || "Next →";

  const stageLabel = STAGE_LABELS[currentStage] || currentStage;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-8 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-2xl">⚖️</span>
          <div>
            <h1 className="text-white font-serif font-bold text-lg leading-none">
              Court Simulation
            </h1>
            {!finished && (
              <p className="text-slate-500 text-xs mt-0.5">{stageLabel}</p>
            )}
          </div>
        </div>

        {!finished && <CaseNav currentCase={currentCase} onJumpToCase={handleJumpToCase} />}

        <button
          onClick={handleReset}
          className="text-slate-700 hover:text-slate-500 text-xs transition-colors"
        >
          {confirmReset ? "Click again to confirm reset" : "Reset"}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-800" />

      {/* Slide content */}
      <div className="flex-1 flex flex-col">{renderSlide()}</div>

      {/* Footer / navigation buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
        <button
          onClick={handlePrev}
          disabled={!finished && currentCase === 0 && currentStage === "intro"}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-wider transition-all active:scale-95"
        >
          ← Back
        </button>
        {!finished ? (
          <button
            onClick={handleAdvance}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-3 rounded-xl text-sm uppercase tracking-wider transition-all active:scale-95"
          >
            {nextLabel}
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
