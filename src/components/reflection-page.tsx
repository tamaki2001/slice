"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Book, Slice } from "@/lib/types";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(
    (data: Omit<Slice, "id" | "createdAt">) => {
      const newSlice: Slice = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setSlices((prev) => [...prev, newSlice]);

      if (data.type === "quote") {
        setActiveQuoteId(newSlice.id);
      }

      // TODO: Supabase永続化
    },
    []
  );

  const handleDelete = useCallback((sliceId: string) => {
    setSlices((prev) => {
      const target = prev.find((s) => s.id === sliceId);
      if (!target) return prev;

      if (target.type === "quote") {
        // ON DELETE SET NULL: 引用を削除、紐づく内省はquoteIdをnullに
        return prev
          .filter((s) => s.id !== sliceId)
          .map((s) =>
            s.quoteId === sliceId ? { ...s, quoteId: undefined } : s
          );
      }
      return prev.filter((s) => s.id !== sliceId);
    });

    // TODO: Supabase削除（DBはON DELETE SET NULLで自動処理）
  }, []);

  const handleEdit = useCallback((sliceId: string, body: string) => {
    setSlices((prev) =>
      prev.map((s) => (s.id === sliceId ? { ...s, body } : s))
    );

    // TODO: Supabase更新
  }, []);

  const handleReplyToQuote = useCallback((quoteId: string) => {
    setActiveQuoteId(quoteId);
    setComposerOpen(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [slices.length]);

  return (
    <div className="h-full bg-background flex flex-col">
      <BookMiniHeader book={book} onInfoTap={() => setDetailOpen(true)} />

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
