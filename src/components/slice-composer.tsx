"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Loader2, X, RefreshCw } from "lucide-react";
import { imageFileToBase64 } from "@/lib/ocr";
import type { Slice } from "@/lib/types";

export type ComposerSubmission = {
  quote?: { body: string; reference?: string };
  reflection?: { body: string };
};

function haptic(style: "light" | "medium") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(style === "light" ? 10 : 20);
}

export function SliceComposer({
  bookId,
  expanded,
  onExpandChange,
  onFocusChange,
  onSubmitPair,
}: {
  bookId: string;
  expanded: boolean;
  onExpandChange: (open: boolean) => void;
  onFocusChange?: (focused: boolean) => void;
  onSubmitPair: (data: ComposerSubmission) => void;
}) {
  const [reflection, setReflection] = useState("");
  const [quote, setQuote] = useState("");
  const [reference, setReference] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const reflectionRef = useRef<HTMLTextAreaElement>(null);
  const quoteRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      haptic("light");
      requestAnimationFrame(() => reflectionRef.current?.focus());
    } else {
      // 閉じた時にキャッシュ破棄
      setLastCapturedImage(null);
    }
  }, [expanded]);

  useEffect(() => {
    for (const ref of [reflectionRef, quoteRef]) {
      if (!ref.current) continue;
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [reflection, quote]);

  // ── 引用のみクリア（思索は保持） ──
  const clearQuote = useCallback(() => {
    setQuote("");
    setReference("");
    requestAnimationFrame(() => quoteRef.current?.focus());
  }, []);

  // ── 一括保存 ──
  const handleSubmit = useCallback(() => {
    const hasQuote = quote.trim();
    const hasReflection = reflection.trim();
    if (!hasQuote && !hasReflection) return;

    onSubmitPair({
      quote: hasQuote ? { body: quote.trim(), reference: reference.trim() || undefined } : undefined,
      reflection: hasReflection ? { body: reflection.trim() } : undefined,
    });

    haptic("medium");
    setQuote("");
    setReflection("");
    setReference("");
    setLastCapturedImage(null);
  }, [quote, reflection, reference, onSubmitPair]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── OCR共通実行 ──
  const executeOcr = useCallback(
    async (base64: string) => {
      setOcrLoading(true);
      haptic("light");

      try {
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            userReflection: reflection.trim() || undefined,
            quoteAnchor: quote.trim() || undefined,
          }),
        });

        if (!res.ok) throw new Error("OCR失敗");

        const { text } = await res.json();
        if (text) {
          setQuote(text);
          haptic("medium");
          requestAnimationFrame(() => quoteRef.current?.focus());
        }
      } catch {
        // フォールバック: 手動入力
      } finally {
        setOcrLoading(false);
      }
    },
    [reflection, quote]
  );

  // ── 新規撮影 ──
  const handleOcrCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      const base64 = await imageFileToBase64(file);
      setLastCapturedImage(base64);
      executeOcr(base64);
    },
    [executeOcr]
  );

  // ── キャッシュ画像でリトライ ──
  const handleRetry = useCallback(() => {
    if (lastCapturedImage) {
      executeOcr(lastCapturedImage);
    }
  }, [lastCapturedImage, executeOcr]);

  // ── フォーカスモード ──
  const handleFocus = useCallback(() => {
    onFocusChange?.(true);
  }, [onFocusChange]);

  const handleBlur = useCallback(() => {
    if (ocrLoading) return;
    setTimeout(() => {
      const stillInComposer = composerRef.current?.contains(document.activeElement);
      if (!stillInComposer) {
        onFocusChange?.(false);
        if (!reflection.trim() && !quote.trim()) onExpandChange(false);
      }
    }, 200);
  }, [reflection, quote, ocrLoading, onExpandChange, onFocusChange]);

  if (!expanded) {
    return (
      <div className="border-t border-stone-200 bg-background pb-[env(safe-area-inset-bottom,0.5rem)]">
        <button
          type="button"
          onClick={() => onExpandChange(true)}
          className="w-full px-6 py-4 text-left font-serif text-base text-stone-300"
        >
          思索を書き留める...
        </button>
      </div>
    );
  }

  const canSubmit = (quote.trim() || reflection.trim()) && !ocrLoading;
  const hasQuoteText = quote.trim().length > 0;

  return (
    <div
      ref={composerRef}
      className="border-t border-stone-200 bg-background pb-[env(safe-area-inset-bottom,0.5rem)]"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="px-6 pt-4 pb-3 space-y-3">
        {/* ① 思索入力（先行） */}
        <textarea
          ref={reflectionRef}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="思索を書き留める..."
          rows={2}
          className="
            w-full resize-none bg-transparent
            font-serif text-base leading-relaxed
            text-stone-800 placeholder:text-stone-300
            focus:outline-none
          "
        />

        {/* ② 引用エリア */}
        <div className="border-l-2 border-stone-200 pl-4 relative">
          {ocrLoading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 size={14} className="animate-spin text-stone-400" />
              <span className="font-serif text-sm text-stone-400 animate-pulse">
                関連する一節を抽出中...
              </span>
            </div>
          ) : (
            <>
              <textarea
                ref={quoteRef}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="冒頭の数語　末尾の数語"
                rows={1}
                className="
                  w-full resize-none bg-transparent pr-8
                  font-serif text-sm leading-relaxed italic
                  text-stone-500 placeholder:text-stone-300
                  focus:outline-none
                "
              />

              {/* 引用クリアボタン（テキスト存在時のみ） */}
              {hasQuoteText && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="引用をクリア"
                  className="
                    absolute top-1 right-0
                    size-7 flex items-center justify-center
                    text-stone-300 hover:text-stone-500 active:text-stone-500
                    transition-opacity
                  "
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearQuote}
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
            </>
          )}

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
                focus:outline-none py-1
              "
            />
            {/* 文脈的アイコン: キャッシュあり→リトライ、なし→カメラ */}
            <button
              type="button"
              tabIndex={-1}
              aria-label={lastCapturedImage ? "アンカーを変えて再抽出" : "カメラで引用を取り込む"}
              className="size-8 flex items-center justify-center text-stone-400 active:text-stone-600"
              onMouseDown={(e) => e.preventDefault()}
              onClick={lastCapturedImage ? handleRetry : handleOcrCapture}
              disabled={ocrLoading}
            >
              {lastCapturedImage ? (
                <RefreshCw size={15} strokeWidth={1.5} />
              ) : (
                <Camera size={16} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="
              font-sans text-sm tracking-widest
              text-stone-500 disabled:text-stone-200
              active:text-stone-600 transition-colors
            "
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
