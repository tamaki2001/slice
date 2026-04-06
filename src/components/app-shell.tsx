"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaptureScreen } from "./capture-screen";
import { ThoughtScreen } from "./thought-screen";
import { ArchiveScreen } from "./archive-screen";

type Screen = "capture" | "thought" | "archive";

const order: Screen[] = ["archive", "capture", "thought"];

function directionOf(from: Screen, to: Screen): number {
  return order.indexOf(to) - order.indexOf(from);
}

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
      setDirection(directionOf(screen, target));
      setScreen(target);
    },
    [screen]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number } }) => {
      const threshold = 80;
      if (info.offset.x > threshold) {
        // 右スワイプ: 左の画面へ
        const idx = order.indexOf(screen);
        if (idx > 0) goTo(order[idx - 1]);
      } else if (info.offset.x < -threshold) {
        // 左スワイプ: 右の画面へ
        const idx = order.indexOf(screen);
        if (idx < order.length - 1) goTo(order[idx + 1]);
      }
    },
    [screen, goTo]
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
          onDragEnd={handleDragEnd}
        >
          {screen === "capture" && (
            <CaptureScreen onCapture={() => goTo("thought")} />
          )}
          {screen === "thought" && (
            <ThoughtScreen onSave={() => goTo("archive")} />
          )}
          {screen === "archive" && <ArchiveScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
