"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Loader2, X, RefreshCw, Mic, Square } from "lucide-react";
import { imageFileToBase64 } from "@/lib/ocr";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import type { Slice } from "@/lib/types";

export type ComposerSubmission = {
  quote?: { body: string; reference?: string };
  reflection?: { body: string; location?: string };
};

function haptic(style: "light" | "medium") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(style === "light" ? 10 : 20);
}

export function SliceComposer({
  bookId,
  activeQuoteId,
  expanded,
  inline,
  monologueMode,
  onExpandChange,
  onFocusChange,
  onCancel,
  onSubmitPair,
}: {
  bookId: string;
  activeQuoteId?: string;
  expanded: boolean;
  inline?: boolean;
  /** 独語モード: 引用・OCR・参照ページを抑止し、場所入力に切り替える */
  monologueMode?: boolean;
  onExpandChange: (open: boolean) => void;
  onFocusChange?: (focused: boolean) => void;
  onCancel?: () => void;
  onSubmitPair: (data: ComposerSubmission) => void;
}) {
  const [reflection, setReflection] = useState("");
  const [quote, setQuote] = useState("");
  const [reference, setReference] = useState("");
  const [location, setLocation] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [cleaningSpeech, setCleaningSpeech] = useState(false);
  const reflectionRef = useRef<HTMLTextAreaElement>(null);
  const quoteRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 音声認識（独語モードのみ）
  const speech = useSpeechRecognition("ja-JP");
  const isRecording = speech.state === "recording";
  const speechSupported = speech.state !== "unsupported";

  // ── 録音停止 → フィラー除去 → reflection に流し込む ──
  const handleStopRecording = useCallback(async () => {
    speech.stop();
    const raw = (speech.accumulated + (speech.interim ? " " + speech.interim : "")).trim();
    if (!raw) return;

    setCleaningSpeech(true);
    haptic("light");
    try {
      const res = await fetch("/api/clean-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: raw }),
      });
      if (!res.ok) throw new Error("整形失敗");
      const { text } = await res.json();
      const cleaned = (text as string) || raw;
      // 既存のreflectionに追記する形（複数回録音できるように）
      setReflection((prev) => (prev ? prev + "\n\n" + cleaned : cleaned));
      onExpandChange(true);
      haptic("medium");
      requestAnimationFrame(() => reflectionRef.current?.focus());
    } catch {
      // フォールバック: 生テキストをそのまま流し込む
      setReflection((prev) => (prev ? prev + "\n\n" + raw : raw));
      onExpandChange(true);
    } finally {
      setCleaningSpeech(false);
    }
  }, [speech, onExpandChange]);

  const handleStartRecording = useCallback(() => {
    haptic("medium");
    speech.start();
  }, [speech]);

  useEffect(() => {
    if (expanded || inline) {
      haptic("light");
      requestAnimationFrame(() => {
        reflectionRef.current?.focus();
        if (inline) {
          composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    } else {
      setLastCapturedImage(null);
    }
  }, [expanded, inline]);

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
      quote:
        !monologueMode && hasQuote
          ? { body: quote.trim(), reference: reference.trim() || undefined }
          : undefined,
      reflection: hasReflection
        ? {
            body: reflection.trim(),
            location: monologueMode ? location.trim() || undefined : undefined,
          }
        : undefined,
    });

    haptic("medium");
    setQuote("");
    setReflection("");
    setReference("");
    setLocation("");
    setLastCapturedImage(null);
    onCancel?.();
    setLastCapturedImage(null);
  }, [quote, reflection, reference, location, monologueMode, onSubmitPair]);

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

  // ── 録音中・整形中の表示（独語モード時、collapsedでも展開状態でも） ──
  if (monologueMode && (isRecording || cleaningSpeech)) {
    return (
      <div className="border-t border-stone-200 bg-background pb-[env(safe-area-inset-bottom,0.5rem)]">
        <div className="px-6 py-5 space-y-3">
          {isRecording ? (
            <>
              <div className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-stone-500 animate-pulse" />
                <span className="font-sans text-xs tracking-widest text-stone-500">
                  録音中
                </span>
              </div>
              {(speech.accumulated || speech.interim) && (
                <p className="font-serif text-sm leading-relaxed text-stone-400 line-clamp-3 whitespace-pre-wrap">
                  {speech.accumulated}
                  {speech.interim && (
                    <span className="text-stone-300"> {speech.interim}</span>
                  )}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleStopRecording}
                  aria-label="録音を止める"
                  className="
                    size-11 flex items-center justify-center
                    text-stone-500 active:text-stone-700
                  "
                >
                  <Square size={16} strokeWidth={1.5} fill="currentColor" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <Loader2 size={14} className="animate-spin text-stone-400" />
              <span className="font-serif text-sm text-stone-400 animate-pulse">
                フィラーを除去中...
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!expanded && !inline) {
    return (
      <div className="border-t border-stone-200 bg-background pb-[env(safe-area-inset-bottom,0.5rem)]">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onExpandChange(true)}
            className="flex-1 px-6 py-4 text-left font-serif text-base text-stone-300"
          >
            {monologueMode ? "独語を書き留める..." : "思索を書き留める..."}
          </button>
          {monologueMode && speechSupported && (
            <button
              type="button"
              onClick={handleStartRecording}
              aria-label="録音を始める"
              className="
                size-12 mr-3 flex items-center justify-center
                text-stone-400 active:text-stone-600
              "
            >
              <Mic size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    );
  }

  const canSubmit =
    (monologueMode ? reflection.trim() : quote.trim() || reflection.trim()) &&
    !ocrLoading;
  const hasQuoteText = quote.trim().length > 0;

  return (
    <div
      ref={composerRef}
      className={
        inline
          ? "bg-background py-2"
          : "border-t border-stone-200 bg-background pb-[env(safe-area-inset-bottom,0.5rem)]"
      }
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
          placeholder={monologueMode ? "独語を書き留める..." : "思索を書き留める..."}
          rows={2}
          className="
            w-full resize-none bg-transparent
            font-serif text-base leading-relaxed
            text-stone-800 placeholder:text-stone-300
            focus:outline-none
          "
        />

        {/* 独語モード: 場所入力（任意） */}
        {monologueMode && (
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="場所"
            className="
              w-full bg-transparent
              font-sans text-sm tracking-wider
              text-stone-500 placeholder:text-stone-300
              border-b border-stone-200 focus:border-stone-400
              focus:outline-none py-1
            "
          />
        )}

        {/* ② 引用エリア（通常モードのみ） */}
        {!monologueMode && (
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
        )}

        {/* 保存 / キャンセル */}
        <div className="flex items-center justify-end gap-4">
          {monologueMode && speechSupported && (
            <button
              type="button"
              onClick={handleStartRecording}
              aria-label="録音を始める"
              className="
                size-9 mr-auto flex items-center justify-center
                text-stone-400 active:text-stone-600
              "
            >
              <Mic size={16} strokeWidth={1.5} />
            </button>
          )}
          {inline && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="font-sans text-sm tracking-widest text-stone-300 active:text-stone-500 transition-colors"
            >
              取消
            </button>
          )}
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
