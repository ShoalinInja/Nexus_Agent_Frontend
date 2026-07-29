import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";

// Hardcoded per spec — not admin-editable in this pass.
const ITEMS = [
  {
    id: "pitch_vas",
    title: "Pitch VAS",
    subtext: "Ask every student — value-added services close deals.",
  },
  {
    id: "stack_cashback",
    title: "Stack the cashback",
    subtext: "Property + [company] cashback — mention both, together.",
  },
  {
    id: "referral_cashback",
    title: "Offer referral cashback",
    subtext: "Every student is a lead source — pitch it before they hang up.",
  },
  {
    id: "log_potentials",
    title: "Log to potentials",
    subtext: "Lined-up but not booked? Add them to your potentials list now.",
  },
];

const DEFAULT_ITEM_STATE = { checked: false, excepted: false, reason: null };

const RING_RADIUS = 18;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const PitchRail = () => {
  const { pitchChecklist, updatePitchChecklistItem } = useAppContext();
  const [exceptionOpenFor, setExceptionOpenFor] = useState(null);
  const [reasonDraft, setReasonDraft] = useState("");

  const items = pitchChecklist?.items || {};
  const completedCount = pitchChecklist?.completed_count ?? 0;
  const isComplete = completedCount >= ITEMS.length;

  const ringOffset =
    RING_CIRCUMFERENCE * (1 - completedCount / ITEMS.length);
  const ringColor = isComplete ? "#34D399" : "#FBBF24";

  const openException = (itemId, currentReason) => {
    setExceptionOpenFor(itemId);
    setReasonDraft(currentReason || "");
  };

  const cancelException = () => {
    setExceptionOpenFor(null);
    setReasonDraft("");
  };

  const submitException = (itemId) => {
    if (!reasonDraft.trim()) return;
    updatePitchChecklistItem(itemId, "except", reasonDraft.trim());
    setExceptionOpenFor(null);
    setReasonDraft("");
  };

  const toggleChecked = (itemId, currentState) => {
    updatePitchChecklistItem(itemId, currentState.checked ? "uncheck" : "check");
  };

  const handleCheckboxKeyDown = (e, itemId, currentState) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleChecked(itemId, currentState);
    }
  };

  return (
    <div
      className="h-full flex flex-col text-[#e5e7eb] border-l border-[#80609F]/30
      bg-gradient-to-b from-[#1a1626] to-[#0a0810] overflow-y-auto"
    >
      {/* Header */}
      <div className="p-4 flex-shrink-0 border-b border-[#80609F]/20">
        <div className="flex items-center gap-3">
          <svg width="44" height="44" viewBox="0 0 44 44" className="flex-shrink-0">
            <circle
              cx="22"
              cy="22"
              r={RING_RADIUS}
              fill="none"
              stroke="#3a2f4d"
              strokeWidth="4"
            />
            <circle
              cx="22"
              cy="22"
              r={RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="4"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
              className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
            />
            <text
              x="22"
              y="26"
              textAnchor="middle"
              fontSize="13"
              fontWeight="500"
              fill="#e5e7eb"
            >
              {completedCount}/{ITEMS.length}
            </text>
          </svg>
          <div className="min-w-0">
            <div className="text-sm font-medium text-[#e5e7eb]">Pitch rail</div>
          </div>
        </div>
        <p
          aria-live="polite"
          className={`text-xs mt-2 ${isComplete ? "text-[#34D399]" : "text-[#FBBF24]"}`}
        >
          {isComplete
            ? "All required pitches complete"
            : `${ITEMS.length - completedCount} pitches remaining — required before closing`}
        </p>
      </div>

      {/* Checklist items */}
      <div className="p-2 flex flex-col gap-1.5">
        {ITEMS.map((item, index) => {
          const state = items[item.id] || DEFAULT_ITEM_STATE;
          const isExceptionOpen = exceptionOpenFor === item.id;

          return (
            <div
              key={item.id}
              className="rounded-lg bg-[#1a1626] p-2.5 flex flex-col gap-2"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#80609F] text-white text-[11px] font-medium flex items-center justify-center flex-shrink-0 mt-px">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#e5e7eb]">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                    {item.subtext}
                  </div>
                  {state.excepted && (
                    <div className="text-[10px] text-[#9CA3AF] mt-1 inline-flex items-center gap-1 bg-[#2a2a2e] px-1.5 py-0.5 rounded">
                      Excepted{state.reason ? ` — ${state.reason}` : ""}
                    </div>
                  )}
                  {!state.checked && (
                    <button
                      type="button"
                      onClick={() =>
                        isExceptionOpen
                          ? cancelException()
                          : openException(item.id, state.reason)
                      }
                      className="block text-[11px] text-[#80609F] hover:text-[#9d84b8] underline mt-1
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#80609F] rounded"
                    >
                      {state.excepted
                        ? "Change exception reason"
                        : "Doesn't apply — log an exception"}
                    </button>
                  )}
                </div>
                <div
                  role="checkbox"
                  aria-checked={state.checked}
                  aria-label={`${item.title} — ${state.checked ? "checked" : "not checked"}`}
                  tabIndex={0}
                  onClick={() => toggleChecked(item.id, state)}
                  onKeyDown={(e) => handleCheckboxKeyDown(e, item.id, state)}
                  className={`w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 mt-px cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#80609F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1626]
                  ${
                    state.checked
                      ? "bg-[#34D399]"
                      : state.excepted
                        ? "bg-[#6b6875]"
                        : "border-[1.5px] border-[#6b6875]"
                  }`}
                >
                  {state.checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path
                        d="M2 6l3 3 5-6"
                        fill="none"
                        stroke="#04342C"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {!state.checked && state.excepted && (
                    <svg width="10" height="2" viewBox="0 0 10 2" aria-hidden="true">
                      <rect width="10" height="2" fill="#1a1a1a" />
                    </svg>
                  )}
                </div>
              </div>

              {isExceptionOpen && (
                <div className="pl-[30px] flex flex-col gap-1.5">
                  <label htmlFor={`reason-${item.id}`} className="sr-only">
                    Reason this item doesn't apply
                  </label>
                  <textarea
                    id={`reason-${item.id}`}
                    value={reasonDraft}
                    onChange={(e) => setReasonDraft(e.target.value)}
                    placeholder="Why doesn't this apply?"
                    rows={2}
                    className="w-full text-xs bg-[#0a0810] border border-[#80609F]/30 rounded p-2 text-[#e5e7eb]
                    placeholder:text-[#6b6875] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#80609F]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => submitException(item.id)}
                      disabled={!reasonDraft.trim()}
                      className="text-[11px] px-2 py-1 rounded bg-[#80609F] text-white disabled:opacity-40 disabled:cursor-not-allowed
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#80609F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1626]"
                    >
                      Log exception
                    </button>
                    <button
                      type="button"
                      onClick={cancelException}
                      className="text-[11px] px-2 py-1 rounded text-[#9CA3AF] hover:text-[#e5e7eb]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#80609F] rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PitchRail;
