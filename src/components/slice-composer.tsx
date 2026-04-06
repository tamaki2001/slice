"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Quote, PenLine } from "lucide-react";
import type { Slice } from "@/lib/types";

type Mode = "quote" | "reflection";

export function SliceComposer({
  bookId,
  activeQuoteId,
  expanded,
  onExpandChange,
  onSubmit,
}: {
  bookId: string;
  activeQuoteId?: string;
  expanded: boolean;
  onExpandChange: (open: boolean) => void;
  onSubmit: (slice: Omit<Slice, "id" | "createdAt">) => void;
}) {
  const [mode, setMode] = useState<Mode>("quote");
  const [body, setBody] = useState("");
  const [reference, setReference] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeQuoteId) {
      setMode("reflection");
    }
  }, [activeQuoteId]);

  useEffect(() => {
    if (expanded) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [expanded]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [body]);

  const handleSubmit = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed) return;

    onSubmit({
      bookId,
      type: mode,
      body: trimmed,
      reference: mode === "quote" && reference.trim() ? reference.trim() : undefined,
      quoteId: mode === "reflection" && activeQuoteId ? activeQuoteId : undefined,
    });

    setBody("");
    setReference("");

    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [body, reference, mode, bookId, activeQuoteId, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!expanded) {
    return (
      <div
        className="border-t border-stone-200 bg-background pb-[env(safe-area-inset-bottom,0.5rem)]"
      >
        <button
          type="button"
          onClick={() => onExpandChange(true)}
          className="
            w-full px-6 py-4 text-left
            font-serif text-base text-stone-300
          "
        >
          思索を書き留める...
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-stone-200 bg-background pb-[env(safe-area-inset-bottom,0.5rem)]">
      {/* モード切替 */}
      <div className="flex items-center gap-1 px-6 pt-3 pb-1">
        <ModeIconToggle
          icon={<Quote size={14} strokeWidth={1.5} />}
          label="引用モード"
          active={mode === "quote"}
          onClick={() => setMode("quote")}
        />
        <ModeIconToggle
          icon={<PenLine size={14} strokeWidth={1.5} />}
          label="記述モード"
          active={mode === "reflection"}
          onClick={() => setMode("reflection")}
        />
      </div>

      {/* 入力エリア */}
      <div className="px-6 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!body.trim()) {
                  // テキストが空のときフォーカスを外したら折りたたむ
                  // 少し遅延させてボタンクリックが先に処理されるようにする
                  setTimeout(() => {
                    if (!body.trim()) onExpandChange(false);
                  }, 200);
                }
              }}
              placeholder={
                mode === "quote"
                  ? "本文を引用..."
                  : "思索を書き留める..."
              }
              rows={2}
              className="
                w-full resize-none bg-transparent
                font-serif text-base leading-relaxed
                text-stone-800 placeholder:text-stone-300
                focus:outline-none
                py-2
              "
            />

            {mode === "quote" && (
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="p."
                  className="
                    w-20 bg-transparent
                    font-sans text-sm tracking-widest
                    text-stone-500 placeholder:text-stone-400
                    border-b border-stone-200 focus:border-stone-400
                    focus:outline-none
                    py-1
                  "
                />
                <button
                  type="button"
                  aria-label="カメラで引用を取り込む（準備中）"
                  className="text-stone-300 active:text-stone-500"
                >
                  <Camera size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!body.trim()}
            className="
              mt-2 font-sans text-sm tracking-widest
              text-stone-500 disabled:text-stone-200
              active:text-stone-600
              transition-colors
            "
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeIconToggle({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`
        size-8 flex items-center justify-center
        transition-colors
        ${active ? "text-stone-800" : "text-stone-300 active:text-stone-500"}
      `}
    >
      {icon}
    </button>
  );
}
