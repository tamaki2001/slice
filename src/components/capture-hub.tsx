"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, ArrowLeft } from "lucide-react";
import { searchGoogleBooks } from "@/lib/google-books";
import { searchBooksByTitle, createBook } from "@/lib/db";
import type { BookCandidate } from "@/lib/types";
import { CandidateList } from "./candidate-list";

type Phase = "camera" | "searching" | "candidates";

export function CaptureHub() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("camera");
  const [candidates, setCandidates] = useState<BookCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      // カメラ非対応: 手動検索にフォールバック
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleCapture = useCallback(async () => {
    stopCamera();
    // プロトタイプ: 撮影後は手動でタイトル入力
    // 将来的にはOCR/画像認識でタイトルを抽出
    const query = searchQuery.trim();
    if (!query) return;

    setPhase("searching");

    try {
      const results = await searchGoogleBooks(query);
      setCandidates(results);
    } catch {
      setCandidates([]);
    }

    setPhase("candidates");
  }, [searchQuery, stopCamera]);

  const handleSelectExisting = useCallback(
    (bookId: string) => {
      router.push(`/book/${bookId}`);
    },
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
        // エラー時はタイムラインへ
        router.push("/");
      }
    },
    [router]
  );

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center px-6 pt-6 pb-4">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            router.back();
          }}
          className="size-11 flex items-center justify-center text-stone-400 active:text-stone-600"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
      </div>

      {phase === "camera" && (
        <div className="flex-1 flex flex-col px-8 gap-6">
          {/* カメラプレビュー */}
          <div className="aspect-[3/4] bg-stone-200 rounded overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => videoRef.current?.play()}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={startCamera}
              className="absolute inset-0 flex items-center justify-center text-stone-400"
            >
              <Camera size={32} strokeWidth={1} />
            </button>
          </div>

          {/* 手動検索 */}
          <div className="space-y-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCapture();
              }}
              placeholder="書籍タイトルで検索..."
              className="
                w-full bg-transparent
                font-sans text-base
                text-stone-800 placeholder:text-stone-300
                border-b border-stone-200 focus:border-stone-400
                focus:outline-none
                py-3
              "
            />
            <button
              type="button"
              onClick={handleCapture}
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
          </div>
        </div>
      )}

      {phase === "searching" && (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-serif text-lg text-stone-300 animate-pulse">
            思索を検索中...
          </p>
        </div>
      )}

      {phase === "candidates" && (
        <CandidateList
          candidates={candidates}
          onSelectExisting={handleSelectExisting}
          onSelectNew={handleSelectNew}
          onRetry={() => setPhase("camera")}
        />
      )}
    </div>
  );
}
