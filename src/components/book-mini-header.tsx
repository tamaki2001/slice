"use client";

import Image from "next/image";
import { Info } from "lucide-react";
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
      <div className="flex items-center gap-3 px-6 py-4">
        <Image
          src={book.coverUrl}
          alt=""
          width={28}
          height={40}
          className="object-contain flex-shrink-0"
        />
        <span className="font-sans text-sm text-stone-800 truncate flex-1">
          {book.title}
        </span>
        <button
          type="button"
          onClick={onInfoTap}
          aria-label="書籍の詳細情報"
          className="text-stone-400 active:text-stone-600 flex-shrink-0"
        >
          <Info size={18} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
