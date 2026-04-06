"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Quote, PenLine, Loader2 } from "lucide-react";
import { imageFileToBase64 } from "@/lib/ocr";
import type { Slice } from "@/lib/types";

type Mode = "quote" | "reflection";

function haptic(style: "light" | "medium") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(style === "light" ? 10 : 20);
}

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
  const [ocrLoading, setOcrLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeQuoteId) {
      setMode("reflection");
    }
  }, [activeQuoteId]);

  useEffect(() => {
    if (expanded) {
      haptic("light");
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

    haptic("medium");
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

  // ── 引用OCR ──
  const handleOcrCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // inputをリセット（同じファイルを再選択可能にする）
    e.target.value = "";

    setOcrLoading(true);
    haptic("light");

    try {
      const base64 = await imageFileToBase64(file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) throw new Error("OCR失敗");

      const { text } = await res.json();
      if (text) {
        setBody((prev) => (prev ? prev + "\n" + text : text));
        haptic("medium");
      }
    } catch {
      // エラー時は何もしない（ユーザーは手動入力にフォールバック）
    } finally {
      setOcrLoading(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, []);

  if (!expanded) {
    return (
      <div className="border-t border-stone-200 bg-background pb-[env(safe-area-inset-bottom,0.5rem)]">
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
    <div ref={composerRef} className="border-t border-stone-200 bg-background pb-[env(safe-area-inset-bottom,0.5rem)]">
      {/* 非表示のファイル入力（カメラ撮影用） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

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
            {/* OCR中のインジケーター */}
            {ocrLoading && (
              <div className="flex items-center gap-2 py-3">
                <Loader2 size={14} className="animate-spin text-stone-400" />
                <span className="font-serif text-sm text-stone-400 animate-pulse">
                  テキストを抽出中...
                </span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!body.trim() && !ocrLoading) {
                  setTimeout(() => {
                    if (composerRef.current?.contains(document.activeElement)) return;
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
                  tabIndex={-1}
                  aria-label="カメラで引用を取り込む"
                  className="size-8 flex items-center justify-center text-stone-400 active:text-stone-600"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleOcrCapture}
                  disabled={ocrLoading}
                >
                  <Camera size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!body.trim() || ocrLoading}
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
      onMouseDown={(e) => e.preventDefault()}
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
