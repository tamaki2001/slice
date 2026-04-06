"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { searchGoogleBooks, searchGoogleBooksByISBN } from "@/lib/google-books";
import { createBook } from "@/lib/db";
import { captureFrameAsBase64 } from "@/lib/ocr";
import { startBarcodeScanner } from "@/lib/barcode";
import type { BookCandidate } from "@/lib/types";
import { CandidateList } from "./candidate-list";

type Phase = "camera" | "analyzing" | "candidates" | "manual";

const STEPS = [
  "本の魂（ISBN）を探索中...",
  "書影から記憶を辿り中...",
  "書籍を照合中...",
];

export function CaptureHub() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("camera");
  const [stepLabel, setStepLabel] = useState(STEPS[0]);
  const [candidates, setCandidates] = useState<BookCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<{ stop: () => void } | null>(null);
  const barcodeFoundRef = useRef(false);

  // カメラ自動起動
  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = useCallback(async () => {
    barcodeFoundRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);

        // バーコードスキャン開始（常時バックグラウンド）
        scannerRef.current = startBarcodeScanner(
          videoRef.current,
          handleBarcodeDetect
        );
      }
    } catch {
      setPhase("manual");
    }
  }, []);

  const stopCamera = useCallback(() => {
    scannerRef.current?.stop();
    scannerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const showResults = useCallback((results: BookCandidate[]) => {
    setCandidates(results);
    setPhase(results.length > 0 ? "candidates" : "manual");
  }, []);

  // ── ①バーコード検知（最速ルート） ──
  const handleBarcodeDetect = useCallback(
    async (isbn: string) => {
      if (barcodeFoundRef.current) return;
      barcodeFoundRef.current = true;

      stopCamera();
      setPhase("analyzing");
      setStepLabel(STEPS[0]);

      try {
        setStepLabel(STEPS[2]);
        const results = await searchGoogleBooksByISBN(isbn);
        showResults(results);
      } catch {
        showResults([]);
      }
    },
    [stopCamera, showResults]
  );

  // ── ②撮影→Gemini画像解析 ──
  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;

    const base64 = captureFrameAsBase64(videoRef.current);
    stopCamera();
    setPhase("analyzing");
    setStepLabel(STEPS[1]);

    // Geminiサーバー側画像認識
    try {
      const res = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (res.ok) {
        const { title, author, isbn } = await res.json();

        // ISBNがあればISBN検索優先
        if (isbn && /^97[89]/.test(isbn)) {
          setStepLabel(STEPS[2]);
          const results = await searchGoogleBooksByISBN(isbn);
          if (results.length > 0) {
            showResults(results);
            return;
          }
        }

        // タイトル/著者で検索
        const query = [title, author].filter(Boolean).join(" ");
        if (query.length > 1) {
          setStepLabel(STEPS[2]);
          const results = await searchGoogleBooks(query);
          if (results.length > 0) {
            showResults(results);
            return;
          }
        }
      }
    } catch {
      // Gemini失敗
    }

    showResults([]);
  }, [stopCamera, showResults]);

  // ── 手動検索 ──
  const handleManualSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setPhase("analyzing");
    setStepLabel(STEPS[2]);

    try {
      const results = await searchGoogleBooks(query);
      showResults(results);
    } catch {
      showResults([]);
    }
  }, [searchQuery, showResults]);

  // ── 書籍選択 ──
  const handleSelectExisting = useCallback(
    (bookId: string) => router.push(`/book/${bookId}`),
    [router]
  );

  const handleSelectNew = useCallback(
    async (candidate: BookCandidate) => {
      try {
        const book = await createBook({
          title: candidate.title,
          author: candidate.author,
          coverUrl: candidate.coverUrl ?? "",
          tags: [],
        });
        router.push(`/book/${book.id}`);
      } catch {
        router.push("/");
      }
    },
    [router]
  );

  const handleRetry = useCallback(() => {
    setPhase("camera");
    setCandidates([]);
    setSearchQuery("");
    barcodeFoundRef.current = false;
    startCamera();
  }, [startCamera]);

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center px-6 pt-6 pb-4">
        <button
          type="button"
          onClick={() => { stopCamera(); router.back(); }}
          className="size-11 flex items-center justify-center text-stone-400 active:text-stone-600"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── カメラ画面 ── */}
      {phase === "camera" && (
        <div className="flex-1 flex flex-col px-8 gap-6">
          <div className="aspect-[3/4] bg-stone-200 overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* バーコード読み取り枠ガイド */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-16 border border-stone-400/40 rounded-sm" />
            </div>
            {/* ヒント */}
            <div className="absolute bottom-4 inset-x-0 text-center pointer-events-none">
              <span className="font-sans text-xs tracking-widest text-stone-100/70 bg-stone-800/30 px-3 py-1">
                バーコードまたは表紙をかざす
              </span>
            </div>
          </div>

          {/* シャッターボタン */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleCapture}
              disabled={!cameraReady}
              aria-label="撮影"
              className="
                size-16 rounded-full
                bg-stone-100 border-2 border-stone-300
                active:bg-stone-200 active:scale-95
                disabled:opacity-30
                transition-transform duration-100
              "
            />
          </div>

          <button
            type="button"
            onClick={() => setPhase("manual")}
            className="font-sans text-xs tracking-widest text-stone-400 active:text-stone-600 text-center"
          >
            タイトルで検索する
          </button>
        </div>
      )}

      {/* ── 解析中 ── */}
      {phase === "analyzing" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="size-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          <p className="font-serif text-base text-stone-400 animate-pulse">
            {stepLabel}
          </p>
        </div>
      )}

      {/* ── 手動検索 ── */}
      {phase === "manual" && (
        <div className="flex-1 flex flex-col px-8 gap-6 pt-8">
          <p className="font-serif text-sm text-stone-400 leading-relaxed">
            自動認識できませんでした。タイトルを入力してください。
          </p>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleManualSearch(); }}
            placeholder="書籍タイトル..."
            autoFocus
            className="
              w-full bg-transparent
              font-sans text-lg
              text-stone-800 placeholder:text-stone-300
              border-b border-stone-200 focus:border-stone-400
              focus:outline-none
              py-3
            "
          />
          <button
            type="button"
            onClick={handleManualSearch}
            disabled={!searchQuery.trim()}
            className="
              w-full py-4
              font-sans text-sm tracking-widest
              text-stone-500 disabled:text-stone-200
              active:text-stone-700
              transition-colors
            "
          >
            検索
          </button>
          <button
            type="button"
            onClick={handleRetry}
            className="font-sans text-xs tracking-widest text-stone-400 active:text-stone-600 text-center"
          >
            もう一度撮影する
          </button>
        </div>
      )}

      {/* ── 候補リスト ── */}
      {phase === "candidates" && (
        <CandidateList
          candidates={candidates}
          onSelectExisting={handleSelectExisting}
          onSelectNew={handleSelectNew}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
