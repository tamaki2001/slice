"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { deleteBook } from "@/lib/db";
import { DeleteSliceDialog } from "./delete-slice-dialog";
import type { BookWithPreview } from "@/lib/types";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  const months = Math.floor(days / 30);
  return `${months}ヶ月前`;
}

function BookRow({
  book,
  onLongPress,
}: {
  book: BookWithPreview;
  onLongPress: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);
  const triggeredRef = useRef(false);

  const startPress = () => {
    movedRef.current = false;
    triggeredRef.current = false;
    timerRef.current = setTimeout(() => {
      if (!movedRef.current) {
        triggeredRef.current = true;
        onLongPress();
      }
    }, 600);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div className="group relative">
      <Link
        href={`/book/${book.id}`}
        className="block px-8 py-8"
        onTouchStart={startPress}
        onTouchEnd={(e) => {
          endPress();
          if (triggeredRef.current) e.preventDefault();
        }}
        onTouchMove={() => { movedRef.current = true; }}
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
      >
        <div className="flex items-start gap-5">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt=""
              className="w-12 h-18 object-contain flex-shrink-0 opacity-80"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-18 bg-stone-200 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-sans text-lg font-medium text-stone-800">
              {book.title}
            </h2>
            <span className="font-sans text-xs tracking-widest text-stone-500 block mt-0.5">
              {book.author}
            </span>
            {book.latestSlice && (
              <p className="font-serif text-sm text-stone-500 leading-relaxed mt-3 line-clamp-2">
                {book.latestSlice.body}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {book.latestSlice && (
                <span className="font-sans text-xs tracking-widest text-stone-400">
                  {relativeTime(book.latestSlice.createdAt)}
                </span>
              )}
              {book.sliceCount > 0 && (
                <span className="font-sans text-xs tracking-widest text-stone-400">
                  {book.sliceCount}件
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* PC: ホバー時の削除ボタン */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onLongPress();
        }}
        aria-label="削除"
        className="
          absolute top-4 right-4
          size-9 flex items-center justify-center
          opacity-0 group-hover:opacity-100
          text-stone-300 hover:text-stone-500
          transition-opacity
        "
      >
        <Trash2 size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function TimelinePage({ books: initialBooks }: { books: BookWithPreview[] }) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [deleteTarget, setDeleteTarget] = useState<BookWithPreview | null>(null);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setDeleteTarget(null);

    try {
      await deleteBook(id);
    } catch {
      setBooks(initialBooks);
    }
  }, [deleteTarget, initialBooks]);

  return (
    <div className="min-h-full bg-background relative">
      <div className="pt-14 pb-32">
        <div className="divide-y divide-stone-100">
          {books.map((book) => (
            <BookRow
              key={book.id}
              book={book}
              onLongPress={() => setDeleteTarget(book)}
            />
          ))}
        </div>

        {books.length === 0 && (
          <div className="px-8 pt-32 text-center">
            <p className="font-serif text-lg text-stone-300">
              まだ本がありません
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => router.push("/capture")}
        aria-label="書影を撮影して記録を追加"
        className="
          fixed right-6 bottom-8
          size-14 rounded-full
          bg-stone-800 text-stone-100
          active:bg-stone-700
          flex items-center justify-center
          mb-[env(safe-area-inset-bottom,0px)]
        "
      >
        <Camera size={22} strokeWidth={1.5} />
      </button>

      <DeleteSliceDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        isQuote={false}
        childCount={deleteTarget?.sliceCount ?? 0}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
