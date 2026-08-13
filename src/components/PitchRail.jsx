import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Hand-drawn inline SVGs — matches this codebase's existing convention
// (no icon library dependency anywhere in the project; see PitchRail's old
// checkmark, Message.jsx, SideBar.jsx). 16x16 viewBox, consistent stroke
// weight, white-on-purple to sit inside the existing badge circle.
const StarIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 1.5l1.8 3.7 4.1.6-3 2.9.7 4.1L8 10.8l-3.6 1.9.7-4.1-3-2.9 4.1-.6L8 1.5z"
      stroke="white"
      strokeWidth="1.3"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const PercentIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="5" cy="5" r="1.6" stroke="white" strokeWidth="1.3" />
    <circle cx="11" cy="11" r="1.6" stroke="white" strokeWidth="1.3" />
    <line
      x1="12"
      y1="4"
      x2="4"
      y2="12"
      stroke="white"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const ShareIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="3.8" cy="8" r="1.6" stroke="white" strokeWidth="1.2" />
    <circle cx="12.2" cy="3.6" r="1.6" stroke="white" strokeWidth="1.2" />
    <circle cx="12.2" cy="12.4" r="1.6" stroke="white" strokeWidth="1.2" />
    <line
      x1="5.2"
      y1="7.2"
      x2="10.8"
      y2="4.4"
      stroke="white"
      strokeWidth="1.1"
    />
    <line
      x1="5.2"
      y1="8.8"
      x2="10.8"
      y2="11.6"
      stroke="white"
      strokeWidth="1.1"
    />
  </svg>
);

const ClipboardPlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="2.5"
      width="10"
      height="11.5"
      rx="1.2"
      stroke="white"
      strokeWidth="1.3"
    />
    <rect
      x="5.8"
      y="1"
      width="4.4"
      height="2.4"
      rx="0.6"
      stroke="white"
      strokeWidth="1.3"
    />
    <line
      x1="8"
      y1="7"
      x2="8"
      y2="11"
      stroke="white"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <line
      x1="6"
      y1="9"
      x2="10"
      y2="9"
      stroke="white"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const CalculatorIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="1.5"
      width="10"
      height="13"
      rx="1.2"
      stroke="white"
      strokeWidth="1.3"
    />
    <line
      x1="5"
      y1="4.2"
      x2="11"
      y2="4.2"
      stroke="white"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <circle cx="5.3" cy="7.3" r="0.7" fill="white" />
    <circle cx="8" cy="7.3" r="0.7" fill="white" />
    <circle cx="10.7" cy="7.3" r="0.7" fill="white" />
    <circle cx="5.3" cy="9.8" r="0.7" fill="white" />
    <circle cx="8" cy="9.8" r="0.7" fill="white" />
    <circle cx="10.7" cy="9.8" r="0.7" fill="white" />
    <circle cx="5.3" cy="12.3" r="0.7" fill="white" />
    <circle cx="8" cy="12.3" r="0.7" fill="white" />
    <circle cx="10.7" cy="12.3" r="0.7" fill="white" />
  </svg>
);

// currentColor so it can inherit the muted-text theme color of whatever
// title/description pair it sits next to, unlike the white-on-purple icons.
const ExternalLinkIcon = ({ className = "" }) => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M6.5 3.5H3.5C2.94772 3.5 2.5 3.94772 2.5 4.5V12.5C2.5 13.0523 2.94772 13.5 3.5 13.5H11.5C12.0523 13.5 12.5 13.0523 12.5 12.5V9.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 2.5H13.5V6.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.5 2.5L7 9"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Hardcoded per spec — not admin-editable in this pass.
const ITEMS = [
  {
    id: "pitch_vas",
    title: "Pitch VAS",
    subtext: "Ask every student — value-added services close deals.",
    Icon: StarIcon,
  },
  {
    id: "stack_cashback",
    title: "Stack the cashback",
    subtext: "Property + [company] cashback — mention both, together.",
    Icon: PercentIcon,
  },
  {
    id: "referral_cashback",
    title: "Offer referral cashback",
    subtext: "Every student is a lead source — pitch it before they hang up.",
    Icon: ShareIcon,
  },
  {
    id: "log_potentials",
    title: "Log to potentials",
    subtext: "Lined-up but not booked? Add them to your potentials list now.",
    Icon: ClipboardPlusIcon,
  },
];

// Data-driven so future services are one-line additions.
const SERVICES = [
  {
    id: "uniflx-installment-calculator",
    label: "UniFlx Installment Calc",
    description: "installment calculator for bookings",
    url: "https://installment-calculator-uniflx.vercel.app/",
    Icon: CalculatorIcon,
  },
];

const GAP_PX = 6; // matches gap-1.5
const HOLD_MS = 7000;
const SHAKE_MS = 1200;
const SLIDE_MS = 800;

const PitchRail = () => {
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0); // 0..4 — 4 means "full loop reached", snaps back to 0
  const [animate, setAnimate] = useState(true);
  const [shakingSlot, setShakingSlot] = useState(null); // which of the 8 rendered slots is shaking
  const [itemHeight, setItemHeight] = useState(0);
  const measureRef = useRef(null);
  const timeoutsRef = useRef([]);

  // Measure the actual rendered card height so the marquee's translateY
  // math is exact regardless of font metrics/content — never a guessed px.
  useLayoutEffect(() => {
    if (measureRef.current) {
      const h = measureRef.current.getBoundingClientRect().height;
      if (h && Math.abs(h - itemHeight) > 0.5) setItemHeight(h);
    }
  });

  useEffect(() => {
    if (paused || !itemHeight) return undefined;

    const clear = () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };

    if (index === 4) {
      // Full loop complete — the duplicated item now showing is visually
      // identical to slot 0, so snap back instantly (no transition) here.
      const t = setTimeout(() => {
        setAnimate(false);
        setIndex(0);
      }, SLIDE_MS);
      timeoutsRef.current.push(t);
      return clear;
    }

    const holdTimer = setTimeout(() => {
      setShakingSlot(index);
      const shakeTimer = setTimeout(() => {
        setShakingSlot(null);
        setAnimate(true);
        setIndex((i) => i + 1);
      }, SHAKE_MS);
      timeoutsRef.current.push(shakeTimer);
    }, HOLD_MS);
    timeoutsRef.current.push(holdTimer);

    return clear;
  }, [index, paused, itemHeight]);

  // Re-enable the transition on the next frame after an instant snap-to-0,
  // so the *next* slide (not the snap itself) animates normally again.
  useLayoutEffect(() => {
    if (index === 0 && !animate) {
      const raf = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [index, animate]);

  const doubled = [...ITEMS, ...ITEMS];
  const step = itemHeight + GAP_PX;

  return (
    <div
      className="h-full flex flex-col text-[#1f2937] dark:text-[#e5e7eb]
      border-l border-[#80609F]/20 dark:border-[#80609F]/30
      bg-gradient-to-b from-[#faf8fd] to-[#f3eff9] dark:from-[#1a1626] dark:to-[#0a0810]"
    >
      {/* Top half — Pitch Rail */}
      <div
        className="flex-1 min-h-0 flex flex-col"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="p-4 flex-shrink-0 border-b border-[#80609F]/15 dark:border-[#80609F]/20">
          <div className="text-xl font-large text-[#1f2937] dark:text-[#e5e7eb]">
            Pitch rail
          </div>
        </div>

        <div
          className="p-2 flex-1 min-h-0 overflow-hidden"
          tabIndex={0}
          aria-label="Sales pitch reminders, auto-advancing. Focus or hover to pause."
        >
          <div
            className="flex flex-col"
            style={{
              gap: `${GAP_PX}px`,
              transform: `translateY(-${index * step}px)`,
              transition: animate
                ? `transform ${SLIDE_MS}ms ease-in-out`
                : "none",
            }}
          >
            {doubled.map((item, slot) => (
              <motion.div
                key={slot}
                ref={slot === 0 ? measureRef : undefined}
                animate={
                  shakingSlot === slot ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }
                }
                transition={{ duration: SHAKE_MS / 1000 }}
                className="rounded-lg bg-white dark:bg-[#1a1626] border border-[#80609F]/15 dark:border-transparent p-2.5 flex items-start gap-2.5 flex-shrink-0"
              >
                <div className="w-7 h-7 rounded-full bg-[#80609F] flex items-center justify-center flex-shrink-0 mt-px">
                  <item.Icon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15.5px] font-medium text-[#1f2937] dark:text-[#e5e7eb]">
                    {item.title}
                  </div>
                  <div className="text-[12.5px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.3">
                    {item.subtext}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom half — Services */}
      <div className="flex-1 min-h-0 flex flex-col border-t border-[#80609F]/15 dark:border-[#80609F]/20">
        <div className="p-4 flex-shrink-0 border-b border-[#80609F]/15 dark:border-[#80609F]/20">
          <div className="text-xl font-large text-[#1f2937] dark:text-[#e5e7eb]">
            Services
          </div>
        </div>

        <div className="p-2 flex-1 min-h-0 overflow-y-hidden">
          <div className="flex flex-col" style={{ gap: `${GAP_PX}px` }}>
            {SERVICES.map((service) => (
              <a
                key={service.id}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${service.label} in a new tab`}
                className="group rounded-lg bg-white dark:bg-[#1a1626] border border-[#80609F]/15 dark:border-transparent p-2.5 flex items-start gap-2.5 flex-shrink-0 hover:bg-[#f3eff9] dark:hover:bg-[#241d33] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#80609F] flex items-center justify-center flex-shrink-0 mt-px">
                  <service.Icon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-[15.5px] font-medium text-[#1f2937] dark:text-[#e5e7eb] truncate">
                      {service.label}
                    </div>
                    <ExternalLinkIcon className="flex-shrink-0 text-[#6B7280] dark:text-[#9CA3AF] opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="text-[12.5px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.3">
                    {service.description}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitchRail;
