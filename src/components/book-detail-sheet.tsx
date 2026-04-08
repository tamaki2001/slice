"use client";

import { useState } from "react";
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
  if (!open) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-50 bg-black/10"
        onClick={() => onOpenChange(false)}
      />

      {/* モバイル: ボトムシート / PC: サイドパネル */}
      <div className="fixed z-50 sm:inset-y-0 sm:right-0 sm:w-96 inset-x-0 bottom-0 sm:bottom-auto">
        <div className="bg-background rounded-t-2xl sm:rounded-none sm:h-full max-h-[85vh] sm:max-h-full overflow-y-auto pb-[env(safe-area-inset-bottom,1rem)] sm:border-l sm:border-stone-200">
          <DetailContent
            book={book}
            onRefetch={onRefetch}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </div>
    </>
  );
}

function DetailContent({
  book,
  onRefetch,
  onClose,
}: {
  book: Book;
  onRefetch?: () => void;
  onClose: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefetch = async () => {
    if (refreshing || !onRefetch) return;
    setRefreshing(true);
    try { navigator?.vibrate?.(10); } catch {}
    onRefetch();
    setTimeout(() => setRefreshing(false), 2000);
  };

  return (
    <div className="px-6 py-4">
      {/* ドラッグハンドル（モバイル）/ 閉じるボタン */}
      <div className="flex justify-center mb-6 sm:hidden">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-1 rounded-full bg-stone-300"
          aria-label="閉じる"
        />
      </div>
      <div className="hidden sm:flex sm:justify-end sm:mb-4">
        <button
          type="button"
          onClick={onClose}
          className="font-sans text-xs tracking-widest text-stone-400 active:text-stone-600"
        >
          閉じる
        </button>
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

      {/* 書誌情報 */}
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

      {/* 書誌データ更新ボタン */}
      {onRefetch && (
        <button
          type="button"
          onClick={handleRefetch}
          disabled={refreshing}
          className="
            w-full py-3
            font-sans text-xs tracking-widest
            text-stone-400 active:text-stone-600
            disabled:text-stone-300
            transition-colors
          "
        >
          {refreshing ? "更新中..." : "書誌データを更新"}
        </button>
      )}
    </div>
  );
}
