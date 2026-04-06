"use client";

import { useState } from "react";
import { BookCover } from "./book-cover";
import { ThoughtInput } from "./thought-input";

export function ThoughtScreen() {
  const [text, setText] = useState("");

  return (
    <div className="min-h-full flex flex-col bg-background">
      <BookCover />

      <div className="flex-1 flex flex-col gap-6 px-0">
        <ThoughtInput value={text} onChange={setText} />
      </div>

      <div className="flex justify-center pb-12 pt-8">
        <button
          type="button"
          className="
            font-sans text-sm tracking-widest
            text-stone-400
            active:text-stone-600
            transition-colors
          "
        >
          保存
        </button>
      </div>
    </div>
  );
}
