"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera } from "lucide-react";
import type { Slice } from "@/lib/types";

type Mode = "quote" | "reflection";

export function SliceComposer({
  bookId,
  activeQuoteId,
  onSubmit,
}: {
  bookId: string;
  /** 直前に保存された引用のID（内省モード自動遷移時に付与） */
  activeQuoteId?: string;
  onSubmit: (slice: Omit<Slice, "id" | "createdAt">) => void;
}) {
  const [mode, setMode] = useState<Mode>("quote");
  const [body, setBody] = useState("");
  const [reference, setReference] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // activeQuoteIdが変化したら内省モードに遷移
  useEffect(() => {
    if (activeQuoteId) {
      setMode("reflection");
    }
  }, [activeQuoteId]);

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

  return (
    <div className="border-t border-stone-200 bg-background pb-[env(safe-area-inset-bottom,0.5rem)]">
      {/* モード切替 */}
      <div className="flex items-center gap-1 px-6 pt-3 pb-1">
        <ModeToggle
          label="引用"
          active={mode === "quote"}
          onClick={() => setMode("quote")}
        />
        <ModeToggle
          label="内省"
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
              placeholder={
                mode === "quote"
                  ? "本文を引用..."
                  : "思考の断片を..."
              }
              rows={2}
              className="
                w-full resize-none bg-transparent
                font-serif text-sm leading-relaxed
                text-stone-800 placeholder:text-stone-300
                focus:outline-none
                py-2
              "
            />

            {/* 引用モード: ページ番号 + OCRボタン */}
            {mode === "quote" && (
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="p."
                  className="
                    w-16 bg-transparent
                    font-sans text-xs tracking-widest
                    text-stone-400 placeholder:text-stone-300
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

          {/* 送信ボタン */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!body.trim()}
            className="
              mt-2 font-sans text-xs tracking-widest
              text-stone-400 disabled:text-stone-200
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

function ModeToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        font-sans text-xs tracking-widest px-3 py-1
        transition-colors
        ${active ? "text-stone-800" : "text-stone-300 active:text-stone-500"}
      `}
    >
      {label}
    </button>
  );
}
