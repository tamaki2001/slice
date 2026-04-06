"use client";

import { useState } from "react";
import type { Book, Slice } from "@/lib/types";
import { BookMiniHeader } from "./book-mini-header";
import { SliceThread } from "./slice-thread";
import { BookDetailSheet } from "./book-detail-sheet";

export function ReflectionPage({
  book,
  slices,
}: {
  book: Book;
  slices: Slice[];
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className="min-h-full bg-background flex flex-col">
      <BookMiniHeader book={book} onInfoTap={() => setDetailOpen(true)} />

      <main className="flex-1 pb-20">
        <SliceThread slices={slices} />
      </main>

      <BookDetailSheet
        book={book}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
