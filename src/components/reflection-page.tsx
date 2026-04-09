"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Book, Slice } from "@/lib/types";
import { insertSlice, updateSliceBody, deleteSlice } from "@/lib/db";
import { useRealtimeSlices } from "@/lib/use-realtime-slices";
import { BookMiniHeader } from "./book-mini-header";
import { SliceThread } from "./slice-thread";
import { SliceComposer, type ComposerSubmission } from "./slice-composer";
import { BookDetailSheet } from "./book-detail-sheet";

export function ReflectionPage({
  book,
  slices: initialSlices,
}: {
  book: Book;
  slices: Slice[];
}) {
  const [currentBook, setCurrentBook] = useState(book);
  const [detailOpen, setDetailOpen] = useState(false);
  const [slices, setSlices] = useState(initialSlices);
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState<string | undefined>();
  const [focusMode, setFocusMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrolling, setScrolling] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSlices(initialSlices);
  }, [initialSlices]);

  useRealtimeSlices(book.id, setSlices);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  // ── 引用+思索ペア保存 ──
  const handleSubmitPair = useCallback(
    async (data: ComposerSubmission) => {
      let savedQuoteId: string | undefined;

      // 引用を先に保存
      if (data.quote) {
        const tempId = crypto.randomUUID();
        const tempSlice: Slice = {
          id: tempId,
          bookId: currentBook.id,
          type: "quote",
          body: data.quote.body,
          reference: data.quote.reference,
          createdAt: new Date().toISOString(),
        };
        setSlices((prev) => [...prev, tempSlice]);

        try {
          const saved = await insertSlice({
            bookId: currentBook.id,
            type: "quote",
            body: data.quote.body,
            reference: data.quote.reference,
          });
          setSlices((prev) => prev.map((s) => (s.id === tempId ? saved : s)));
          savedQuoteId = saved.id;
        } catch (e) {
          setSlices((prev) => prev.filter((s) => s.id !== tempId));
          setError(e instanceof Error ? e.message : "引用の保存に失敗しました");
          return;
        }
      }

      // 思索を保存（引用があればquoteIdで紐付け）
      if (data.reflection) {
        // 紐付け先: 同時保存した引用ID → ＋ボタンで指定された既存引用ID → なし
        const quoteId = savedQuoteId || activeQuoteId;
        const tempId = crypto.randomUUID();
        const tempSlice: Slice = {
          id: tempId,
          bookId: currentBook.id,
          type: "reflection",
          body: data.reflection.body,
          quoteId,
          createdAt: new Date().toISOString(),
        };
        setSlices((prev) => [...prev, tempSlice]);

        try {
          const saved = await insertSlice({
            bookId: currentBook.id,
            type: "reflection",
            body: data.reflection.body,
            quoteId,
          });
          setSlices((prev) => prev.map((s) => (s.id === tempId ? saved : s)));
        } catch (e) {
          setSlices((prev) => prev.filter((s) => s.id !== tempId));
          setError(e instanceof Error ? e.message : "思索の保存に失敗しました");
        }
      }

      // 保存完了後にactiveQuoteIdをリセット
      setActiveQuoteId(undefined);
    },
    [currentBook.id, activeQuoteId]
  );

  const handleDelete = useCallback(async (sliceId: string) => {
    let snapshot: Slice[] = [];
    setSlices((prev) => {
      snapshot = prev;
      const target = prev.find((s) => s.id === sliceId);
      if (!target) return prev;

      if (target.type === "quote") {
        return prev
          .filter((s) => s.id !== sliceId)
          .map((s) =>
            s.quoteId === sliceId ? { ...s, quoteId: undefined } : s
          );
      }
      return prev.filter((s) => s.id !== sliceId);
    });

    try {
      await deleteSlice(sliceId);
    } catch (e) {
      setSlices(snapshot);
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }, []);

  const handleEdit = useCallback(async (sliceId: string, body: string, reference?: string) => {
    let snapshot: Slice[] = [];
    setSlices((prev) => {
      snapshot = prev;
      return prev.map((s) =>
        s.id === sliceId ? { ...s, body, ...(reference !== undefined ? { reference } : {}) } : s
      );
    });

    try {
      await updateSliceBody(sliceId, body, reference);
    } catch (e) {
      setSlices(snapshot);
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    }
  }, []);

  const handleReplyToQuote = useCallback((quoteId: string) => {
    setActiveQuoteId(quoteId);
    setComposerOpen(true);
  }, []);

  const handleCancelInline = useCallback(() => {
    setActiveQuoteId(undefined);
    setComposerOpen(false);
  }, []);

  // 書誌データ更新: 現在無効化中
  // 初回登録時にNDLからリッチなデータが入るため不要

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [slices.length]);

  // Composer展開時・フォーカス時に末尾へスクロール
  // モバイルのキーボード表示に時間がかかるため複数回実行
  useEffect(() => {
    if (composerOpen || focusMode) {
      const scroll = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      scroll();
      const t1 = setTimeout(scroll, 200);
      const t2 = setTimeout(scroll, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [composerOpen, focusMode]);

  return (
    <div className="h-full bg-background flex flex-col relative">
      {/* スワイプガイド */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="w-0.5 h-8 bg-stone-300/30 rounded-full" />
      </div>

      {/* ヘッダー: フォーカスモード時は透過 */}
      <div
        className={`transition-opacity duration-300 ${
          focusMode ? "opacity-10 pointer-events-none" : "opacity-100"
        }`}
      >
        <BookMiniHeader book={currentBook} onInfoTap={() => setDetailOpen(true)} />
      </div>

      {error && (
        <div className="mx-6 mt-2 px-4 py-2 bg-stone-200 text-stone-600 font-sans text-xs tracking-wider rounded">
          {error}
        </div>
      )}

      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto"
        onScroll={() => {
          setScrolling(true);
          if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
          scrollTimerRef.current = setTimeout(() => setScrolling(false), 2000);
        }}
      >
        <SliceThread
          slices={slices}
          scrolling={scrolling}
          activeQuoteId={activeQuoteId}
          inlineComposer={
            activeQuoteId && composerOpen ? (
              <SliceComposer
                bookId={currentBook.id}
                activeQuoteId={activeQuoteId}
                expanded
                inline
                onExpandChange={setComposerOpen}
                onFocusChange={setFocusMode}
                onCancel={handleCancelInline}
                onSubmitPair={handleSubmitPair}
              />
            ) : undefined
          }
          onReplyToQuote={handleReplyToQuote}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
        <div ref={bottomRef} />
      </main>

      {/* 新規モード（activeQuoteIdなし）: 画面下部 */}
      {!activeQuoteId && (
        <SliceComposer
          bookId={currentBook.id}
          expanded={composerOpen}
          onExpandChange={setComposerOpen}
          onFocusChange={setFocusMode}
          onSubmitPair={handleSubmitPair}
        />
      )}

      <BookDetailSheet
        book={currentBook}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
