"use client";

import { useEffect, useState } from "react";
import { fetchBook, fetchSlices } from "@/lib/db";
import { ReflectionPage } from "./reflection-page";
import { mockBook, mockSlices } from "@/lib/mock-data";
import type { Book, Slice } from "@/lib/types";

export function BookLoader({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<Book | null>(null);
  const [slices, setSlices] = useState<Slice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const b = await fetchBook(bookId);

      if (!b) {
        if (bookId === "1" || bookId === "mock") {
          setBook(mockBook);
          setSlices(mockSlices);
        }
        setLoading(false);
        return;
      }

      const s = await fetchSlices(b.id);
      setBook(b);
      setSlices(s);
      setLoading(false);
    }

    load();
  }, [bookId]);

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="size-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <p className="font-serif text-lg text-stone-300">本が見つかりません</p>
      </div>
    );
  }

  return <ReflectionPage book={book} slices={slices} />;
}
