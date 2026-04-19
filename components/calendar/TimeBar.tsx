"use client";

import { motion } from "framer-motion";
import { minutesFromMidnight, pxFromMinutes, formatHoursMinutes } from "@/lib/utils";

interface TimeBarProps {
  id: number;
  description: string;
  start: Date;
  stop: Date | null;
  subjectColor: string;
  subjectName: string;
  dayIndex: number;
  onClick: () => void;
}

export default function TimeBar({
  id,
  description,
  start,
  stop,
  subjectColor,
  subjectName,
  dayIndex,
  onClick,
}: TimeBarProps) {
  const startMins = minutesFromMidnight(new Date(start));
  const endMins = stop
    ? minutesFromMidnight(new Date(stop))
    : minutesFromMidnight(new Date());

  const top = pxFromMinutes(startMins);
  const height = Math.max(pxFromMinutes(endMins - startMins), 16);

  const durationSecs = stop
    ? Math.floor((new Date(stop).getTime() - new Date(start).getTime()) / 1000)
    : Math.floor((Date.now() - new Date(start).getTime()) / 1000);

  const colWidth = `calc((100% - 52px) / 7)`;
  const leftOffset = `calc(52px + ${dayIndex} * (100% - 52px) / 7 + 2px)`;
  const barWidth = `calc((100% - 52px) / 7 - 4px)`;

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.8 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="time-bar"
      style={{
        top: `${top}px`,
        left: leftOffset,
        width: barWidth,
        height: `${height}px`,
        backgroundColor: subjectColor + "cc",
        borderLeft: `3px solid ${subjectColor}`,
        transformOrigin: "top",
      }}
      onClick={onClick}
    >
      <div className="p-1.5 overflow-hidden h-full flex flex-col">
        <span className="text-[10px] font-medium text-white leading-tight truncate">
          {description || subjectName}
        </span>
        {height > 32 && (
          <span className="text-[9px] text-white/70 mt-0.5">
            {formatHoursMinutes(durationSecs)}
          </span>
        )}
        {height > 48 && subjectName && (
          <span className="text-[9px] text-white/60 mt-auto truncate">
            {subjectName}
          </span>
        )}
      </div>
      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize hover:bg-white/20"
        onMouseDown={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}
