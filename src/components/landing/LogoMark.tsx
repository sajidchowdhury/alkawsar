"use client";

import { motion } from "framer-motion";

/**
 * The AL-KAWSAR mark — a date palm rising from the river Al-Kawthar,
 * enclosed in an open gold arc (built from the brand construction brief).
 */

const FRONDS = [
  { d: "M50 42 L50 21", w: 3.4 },
  { d: "M50 42 Q42 35 37 22", w: 3 },
  { d: "M50 42 Q58 35 63 22", w: 3 },
  { d: "M50 42 Q40 39 27 34", w: 2.6 },
  { d: "M50 42 Q60 39 73 34", w: 2.6 },
  { d: "M50 42 Q38 45 25 47", w: 2.2 },
  { d: "M50 42 Q62 45 75 47", w: 2.2 },
];

const RIVERS = [
  "M27 71 Q37 67 50 71 T73 71",
  "M31 79 Q40 75 50 79 T69 79",
  "M35 87 Q42 83 50 87 T65 87",
];

function MarkPath({
  d,
  w,
  delay,
  animated,
}: {
  d: string;
  w: number;
  delay: number;
  animated: boolean;
}) {
  if (!animated) {
    return <path d={d} stroke="#C9A961" strokeWidth={w} strokeLinecap="round" fill="none" />;
  }
  return (
    <motion.path
      d={d}
      stroke="#C9A961"
      strokeWidth={w}
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    />
  );
}

function MarkRing({ animated }: { animated: boolean }) {
  if (!animated) {
    return <circle cx="50" cy="50" r="44.5" fill="none" stroke="#C9A961" strokeWidth="2.4" />;
  }
  return (
    <motion.circle
      cx="50"
      cy="50"
      r="44.5"
      fill="none"
      stroke="#C9A961"
      strokeWidth="2.4"
      initial={{ pathLength: 0, rotate: -90 }}
      animate={{ pathLength: 1, rotate: 0 }}
      transition={{ duration: 1.1, ease: "easeInOut" }}
      style={{ transformOrigin: "50px 50px" }}
    />
  );
}

export default function LogoMark({
  size = 96,
  animated = false,
  className = "",
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="AL-KAWSAR লোগো"
    >
      <circle cx="50" cy="50" r="49" fill="#0B4D3C" />
      <MarkRing animated={animated} />
      {/* trunk */}
      <MarkPath d="M50 63 C49 56 49 49 50 43" w={3.6} delay={0.15} animated={animated} />
      {/* seven fronds */}
      {FRONDS.map((f, i) => (
        <MarkPath key={i} d={f.d} w={f.w} delay={0.3 + i * 0.09} animated={animated} />
      ))}
      {/* river Al-Kawthar */}
      {RIVERS.map((r, i) => (
        <MarkPath key={i} d={r} w={2.8} delay={0.95 + i * 0.12} animated={animated} />
      ))}
    </svg>
  );
}
