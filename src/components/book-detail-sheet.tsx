"use client";

import { useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Book } from "@/lib/types";

export function BookDetailSheet({
  book,
  open,
  onOpenChange,
  onRefetch,
}: {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch?: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="sm:hidden rounded-t-2xl max-h-[85vh] pb-[env(safe-area-inset-bottom,1rem)]"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{book.title} の詳細</SheetTitle>
          <SheetDescription>書籍の詳細情報</SheetDescription>
        </SheetHeader>
        <DetailContent book={book} onRefetch={onRefetch} />
      </SheetContent>

      <SheetContent
        side="right"
        showCloseButton
        className="hidden sm:flex sm:flex-col sm:w-96"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{book.title} の詳細</SheetTitle>
          <SheetDescription>書籍の詳細情報</SheetDescription>
        </SheetHeader>
        <DetailContent book={book} onRefetch={onRefetch} />
      </SheetContent>
    </Sheet>
  );
}

function DetailContent({ book, onRefetch }: { book: Book; onRefetch?: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      onRefetch?.();
    }, 800);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div className="px-6 py-4 overflow-y-auto">
      <div className="flex justify-center mb-6 sm:hidden">
        <div className="w-10 h-1 rounded-full bg-stone-300" />
      </div>

      <div className="flex gap-5 mb-8">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`${book.title} 書影`}
            className="w-20 h-28 object-contain flex-shrink-0 select-none"
            referrerPolicy="no-referrer"
            draggable={false}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <div className="w-20 h-28 bg-stone-200 flex-shrink-0" />
        )}
        <div className="flex flex-col justify-center">
          <h2 className="font-sans text-lg font-bold text-stone-800">
            {book.title}
          </h2>
          {book.subtitle && (
            <p className="font-sans text-xs text-stone-400 mt-0.5">
              {book.subtitle}
            </p>
          )}
          <div className="mt-3 space-y-1 text-sm text-stone-600">
            <p>{book.author}</p>
            {book.translator && (
              <p className="text-xs text-stone-400">{book.translator} 訳</p>
            )}
            {book.publisher && (
              <p className="text-xs text-stone-400">{book.publisher}</p>
            )}
            {book.publishedYear && (
              <p className="text-xs text-stone-400">{book.publishedYear}年</p>
            )}
            {book.isbn && (
              <p className="font-mono text-[10px] text-stone-300 mt-1">{book.isbn}</p>
            )}
          </div>
        </div>
      </div>

      {book.synopsis && (
        <div className="mb-8">
          <p className="font-serif text-sm text-stone-600 leading-relaxed">
            {book.synopsis}
          </p>
        </div>
      )}

      {book.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {book.tags.map((tag) => (
            <span
              key={tag}
              className="font-sans text-xs tracking-wider text-stone-500 bg-stone-100 px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
