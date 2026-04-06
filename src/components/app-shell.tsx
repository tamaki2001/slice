"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaptureScreen } from "./capture-screen";
import { ArchiveScreen } from "./archive-screen";

type Screen = "capture" | "archive";

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export function AppShell() {
  const [screen, setScreen] = useState<Screen>("capture");
  const [direction, setDirection] = useState(0);

  const goTo = useCallback(
    (target: Screen) => {
      if (target === screen) return;
      setDirection(target === "archive" ? -1 : 1);
      setScreen(target);
    },
    [screen]
  );

  return (
    <div className="fixed inset-0 overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={screen}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute inset-0"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (screen === "capture" && info.offset.x > 80) {
              goTo("archive");
            } else if (screen === "archive" && info.offset.x < -80) {
              goTo("capture");
            }
          }}
        >
          {screen === "capture" ? (
            <CaptureScreen />
          ) : (
            <ArchiveScreen />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
