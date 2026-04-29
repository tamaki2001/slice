"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API の型定義（Next.js 16 / TS 5 では未同梱のため最小限を自前で）
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = { error: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechRecognitionState = "idle" | "recording" | "unsupported";

/**
 * Web Speech API ラッパー。
 * - 沈黙等で onend が発火しても、ユーザーが停止していなければ自動再開する
 * - 確定済みテキストは accumulated に蓄積、暫定テキストは interim で取得
 */
export function useSpeechRecognition(lang: string = "ja-JP") {
  const [state, setState] = useState<SpeechRecognitionState>("idle");
  const [accumulated, setAccumulated] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRunningRef = useRef(false);
  const accumulatedRef = useRef("");

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setState("unsupported");
      return;
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: SpeechRecognitionEventLike) => {
      let interimText = "";
      let finalAppend = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) finalAppend += t;
        else interimText += t;
      }
      if (finalAppend) {
        accumulatedRef.current = (accumulatedRef.current + finalAppend).trim();
        setAccumulated(accumulatedRef.current);
      }
      setInterim(interimText);
    };

    rec.onerror = (e: SpeechRecognitionErrorEventLike) => {
      // no-speech / aborted は無視（沈黙時に頻発）
      if (e.error === "no-speech" || e.error === "aborted") return;
      setError(e.error);
    };

    rec.onend = () => {
      // ユーザーが止めていなければ自動再開（沈黙でのタイムアウト対策）
      if (wantRunningRef.current) {
        try {
          rec.start();
        } catch {
          // 既に start 中の例外は無視
        }
      } else {
        setState("idle");
        setInterim("");
      }
    };

    recognitionRef.current = rec;
    return () => {
      wantRunningRef.current = false;
      try {
        rec.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    setError(null);
    accumulatedRef.current = "";
    setAccumulated("");
    setInterim("");
    wantRunningRef.current = true;
    try {
      rec.start();
      setState("recording");
    } catch {
      // already started
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    wantRunningRef.current = false;
    try {
      rec.stop();
    } catch {
      // ignore
    }
  }, []);

  return { state, accumulated, interim, error, start, stop };
}
