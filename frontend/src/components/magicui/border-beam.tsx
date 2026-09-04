"use client";

import React from "react";
import { motion } from "framer-motion";

export function BorderBeam({
  className = "",
  duration = 8,
  colorFrom = "#8b5cf6",
  colorTo = "#06b6d4",
  borderWidth = 1.5,
}: {
  className?: string;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden ${className}`}>
      <motion.div
        className="absolute -inset-[200%] m-auto"
        animate={{ rotate: 360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 300deg, ${colorFrom} 330deg, ${colorTo} 360deg)`,
          mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: `${borderWidth}px`,
        }}
      />
    </div>
  );
}
