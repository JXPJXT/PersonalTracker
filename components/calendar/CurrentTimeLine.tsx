"use client";

import { useEffect, useState } from "react";
import { minutesFromMidnight, pxFromMinutes } from "@/lib/utils";

export default function CurrentTimeLine({ dayIndex }: { dayIndex: number }) {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const mins = minutesFromMidnight(now);
      setPosition(pxFromMinutes(mins));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  if (dayIndex === -1) return null;

  // Calculate left position based on day index
  // Each day column: (100% - 52px) / 7
  const colWidth = `calc((100% - 52px) / 7)`;
  const leftOffset = `calc(52px + ${dayIndex} * (100% - 52px) / 7)`;

  return (
    <div
      className="current-time-line"
      style={{
        top: `${position}px`,
        left: leftOffset,
        width: colWidth,
      }}
    >
      <div className="current-time-dot" />
    </div>
  );
}
