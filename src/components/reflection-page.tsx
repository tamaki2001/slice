"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Book, Slice } from "@/lib/types";
import { insertSlice, updateSliceBody, deleteSlice } from "@/lib/db";
import { useRealtimeSlices } from "@/lib/use-realtime-slices";
import { BookMiniHeader } from "./book-mini-header";
import { SliceThread } from "./slice-thread";
import { SliceComposer } from "./slice-composer";
import { BookDetailSheet } from "./book-detail-sheet";

export function ReflectionPage({
  book,
  slices: initialSlices,
}: {
  book: Book;
  slices: Slice[];
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [slices, setSlices] = useState(initialSlices);
  const [activeQuoteId, setActiveQuoteId] = useState<string | undefined>();
  const [composerOpen, setComposerOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSlices(initialSlices);
  }, [initialSlices]);

  useRealtimeSlices(book.id, setSlices);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = useCallback(
    async (data: Omit<Slice, "id" | "createdAt">) => {
      const tempId = crypto.randomUUID();
      const tempSlice: Slice = {
        ...data,
        id: tempId,
        createdAt: new Date().toISOString(),
      };
      setSlices((prev) => [...prev, tempSlice]);

      if (data.type === "quote") {
        setActiveQuoteId(tempId);
      }

      try {
        const saved = await insertSlice(data);
        setSlices((prev) =>
          prev.map((s) => (s.id === tempId ? saved : s))
        );
        if (data.type === "quote") {
          setActiveQuoteId(saved.id);
        }
      } catch (e) {
        setSlices((prev) => prev.filter((s) => s.id !== tempId));
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    },
    []
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

  const handleEdit = useCallback(async (sliceId: string, body: string) => {
    let snapshot: Slice[] = [];
    setSlices((prev) => {
      snapshot = prev;
      return prev.map((s) => (s.id === sliceId ? { ...s, body } : s));
    });

    try {
      await updateSliceBody(sliceId, body);
    } catch (e) {
      setSlices(snapshot);
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    }
  }, []);

  const handleReplyToQuote = useCallback((quoteId: string) => {
    setActiveQuoteId(quoteId);
    setComposerOpen(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [slices.length]);

  return (
    <div className="h-full bg-background flex flex-col relative">
      {/* スワイプガイド: 左端 */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="w-0.5 h-8 bg-stone-300/30 rounded-full" />
      </div>

      {/* ヘッダー: フォーカスモード時は透過 */}
      <div
        className={`transition-opacity duration-300 ${
          focusMode ? "opacity-10 pointer-events-none" : "opacity-100"
        }`}
      >
        <BookMiniHeader book={book} onInfoTap={() => setDetailOpen(true)} />
      </div>

      {error && (
        <div className="mx-6 mt-2 px-4 py-2 bg-stone-200 text-stone-600 font-sans text-xs tracking-wider rounded">
          {error}
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <SliceThread
          slices={slices}
          onReplyToQuote={handleReplyToQuote}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
        <div ref={bottomRef} />
      </main>

      <SliceComposer
        bookId={book.id}
        activeQuoteId={activeQuoteId}
        expanded={composerOpen}
        onExpandChange={setComposerOpen}
        onFocusChange={setFocusMode}
        onSubmit={handleSubmit}
      />

      <BookDetailSheet
        book={book}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
