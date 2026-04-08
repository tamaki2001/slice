"use client";

import { useState } from "react";
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
  const [refreshing, setRefreshing] = useState(false);

  const handleRefetch = async () => {
    if (refreshing || !onRefetch) return;
    setRefreshing(true);
    try { navigator?.vibrate?.(10); } catch {}
    onRefetch();
    setTimeout(() => setRefreshing(false), 2000);
  };

  return (
    <div className="px-6 py-4 overflow-y-auto">
      {/* ドラッグハンドル（モバイル） */}
      <div className="flex justify-center mb-6 sm:hidden">
        <div className="w-10 h-1 rounded-full bg-stone-300" />
      </div>

      {/* 書影（中央配置） */}
      {book.coverUrl && (
        <div className="flex justify-center mb-6">
          <img
            src={book.coverUrl}
            alt=""
            className="h-40 object-contain shadow-sm"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* 書誌情報（縦積み） */}
      <div className="space-y-2 mb-6">
        <h2 className="font-sans text-lg font-bold text-stone-800 leading-snug">
          {book.title}
        </h2>
        {book.subtitle && (
          <p className="font-sans text-xs text-stone-400">{book.subtitle}</p>
        )}
        <div className="space-y-1 text-sm text-stone-600">
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

      {book.synopsis && (
        <div className="mb-6">
          <p className="font-serif text-sm text-stone-600 leading-relaxed">
            {book.synopsis}
          </p>
        </div>
      )}

      {book.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
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

      {/* 書誌データ更新ボタン（インビジブル・トリガー） */}
      {book.isbn && onRefetch && (
        <button
          type="button"
          onClick={handleRefetch}
          disabled={refreshing}
          className="
            w-full py-3
            font-sans text-xs tracking-widest
            text-stone-300 active:text-stone-500
            transition-colors
          "
        >
          {refreshing ? "更新中..." : "書誌データを更新"}
        </button>
      )}
    </div>
  );
}
