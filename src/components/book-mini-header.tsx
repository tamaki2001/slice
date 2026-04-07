"use client";

import Link from "next/link";
import { Info, ChevronLeft } from "lucide-react";
import type { Book } from "@/lib/types";

export function BookMiniHeader({
  book,
  onInfoTap,
}: {
  book: Book;
  onInfoTap: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-4">
        <Link
          href="/"
          className="size-11 flex items-center justify-center text-stone-400 active:text-stone-600 flex-shrink-0"
          aria-label="タイムラインに戻る"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </Link>
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt=""
            className="w-16 aspect-[2/3] object-contain flex-shrink-0 shadow-md"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-16 aspect-[2/3] bg-stone-200 flex-shrink-0" />
        )}
        <span className="font-sans text-sm text-stone-800 flex-1 line-clamp-2 leading-snug">
          {book.title}
        </span>
        <button
          type="button"
          onClick={onInfoTap}
          aria-label="書籍の詳細情報"
          className="size-11 flex items-center justify-center text-stone-400 active:text-stone-600 flex-shrink-0"
        >
          <Info size={18} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
