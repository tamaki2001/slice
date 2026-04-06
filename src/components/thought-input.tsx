"use client";

import { useRef, useEffect } from "react";
import { Mic } from "lucide-react";

export function ThoughtInput({
  value,
  onChange,
  onMic,
}: {
  value: string;
  onChange: (v: string) => void;
  onMic?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
  }, [value]);

  return (
    <div className="relative px-8">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="思考の断片を..."
        rows={3}
        className="
          w-full resize-none
          bg-transparent
          font-serif text-lg leading-relaxed
          text-stone-800 placeholder:text-stone-300
          border-b border-stone-200
          focus:border-stone-300 focus:outline-none
          py-4
        "
      />
      <button
        type="button"
        onClick={onMic}
        aria-label="音声入力"
        className="absolute right-10 top-5 text-stone-400 active:text-stone-600"
      >
        <Mic size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}
