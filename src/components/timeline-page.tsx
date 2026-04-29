"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { deleteBook } from "@/lib/db";
import { DeleteSliceDialog } from "./delete-slice-dialog";
import { isMonologueBook } from "@/lib/types";
import type { BookWithPreview, TimelineEntry } from "@/lib/types";

const SESSION_GAP_MS = 6 * 60 * 60 * 1000; // 6時間

function formatTime(iso: string): string {
  const now = Date.now();
  const d = new Date(iso);
  const diff = now - d.getTime();
  const hours = Math.floor(diff / 3600000);

  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  if (days < 7) {
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${weekday} ${h}:${m}`;
  }

  const y = d.getFullYear();
  const mo = (d.getMonth() + 1).toString().padStart(2, "0");
  const da = d.getDate().toString().padStart(2, "0");
  return `${y}/${mo}/${da}`;
}

function shouldShowHeader(
  entry: TimelineEntry,
  prevEntry: TimelineEntry | null
): boolean {
  if (!prevEntry) return true;
  // ケースC: 異なる書籍
  if (entry.book.id !== prevEntry.book.id) return true;
  // ケースB: 同一書籍だが6時間以上経過
  const gap =
    new Date(prevEntry.slice.createdAt).getTime() -
    new Date(entry.slice.createdAt).getTime();
  if (Math.abs(gap) >= SESSION_GAP_MS) return true;
  // ケースA: 連続した投稿
  return false;
}

/* ── BookHeader（削除ボタン付き） ── */

function BookHeader({
  entry,
  onDelete,
}: {
  entry: TimelineEntry;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-start gap-5 px-8 pt-8 pb-2 relative">
      <Link href={`/book/${entry.book.id}`} className="flex items-start gap-5 flex-1">
        {entry.book.coverUrl ? (
          <img
            src={entry.book.coverUrl}
            alt=""
            className="w-12 h-18 object-contain flex-shrink-0 opacity-80"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-12 h-18 bg-stone-200 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-sans text-lg font-medium text-stone-800">
            {entry.book.title}
          </h2>
          <span className="font-sans text-xs tracking-widest text-stone-500 block mt-0.5">
            {entry.book.author}
          </span>
        </div>
      </Link>

      {/* PC: ホバー削除 */}
      <button
        type="button"
        onClick={onDelete}
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

/* ── SliceRow ── */

function SliceRow({
  entry,
  scrolling,
}: {
  entry: TimelineEntry;
  scrolling: boolean;
}) {
  const isQuote = entry.slice.type === "quote";
  const isLinkedReflection = entry.slice.type === "reflection" && entry.slice.quoteId;

  return (
    <div className="group relative px-8 py-3">
      <Link
        href={`/book/${entry.book.id}`}
        className={`block ${isLinkedReflection ? "pl-6" : ""}`}
      >
        <p
          className={`
            font-serif text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap
            ${isQuote ? "italic text-stone-400" : "text-stone-600"}
          `}
        >
          {entry.slice.body}
        </p>
      </Link>

      {/* 隠された時間 */}
      <span
        className={`
          absolute bottom-1 right-6
          font-sans text-xs text-stone-400
          transition-opacity duration-500
          pointer-events-none
          ${scrolling ? "opacity-60" : "opacity-0 group-hover:opacity-60"}
        `}
      >
        {formatTime(entry.slice.createdAt)}
      </span>
    </div>
  );
}

/* ── 独語ピン（常時表示） ── */

function MonologuePin({ book }: { book: BookWithPreview }) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="flex items-center gap-5 px-8 pt-8 pb-4"
    >
      <img
        src={book.coverUrl}
        alt=""
        className="w-12 h-18 object-contain flex-shrink-0 opacity-80"
      />
      <div className="flex-1 min-w-0">
        <h2 className="font-sans text-lg font-medium text-stone-800">
          {book.title}
        </h2>
        <span className="font-sans text-xs tracking-widest text-stone-400 block mt-0.5">
          {book.sliceCount > 0 ? `${book.sliceCount}件` : ""}
        </span>
      </div>
    </Link>
  );
}

/* ── メインコンポーネント ── */

export function TimelinePage({
  feed,
  books: initialBooks,
}: {
  feed: TimelineEntry[];
  books: BookWithPreview[];
}) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [deleteTarget, setDeleteTarget] = useState<BookWithPreview | null>(null);
  const monologueBook = books.find((b) => isMonologueBook(b));
  const [scrolling, setScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setScrolling(false), 3000);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

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

  const findBookPreview = (bookId: string) =>
    books.find((b) => b.id === bookId);

  const isEmpty = feed.length === 0;

  return (
    <div className="min-h-full bg-background relative">
      <div className="pt-10 pb-32">
        {/* 独語ピン: 常にタイムライン先頭に表示 */}
        {monologueBook && <MonologuePin book={monologueBook} />}

        {isEmpty ? (
          <div className="px-8 pt-16 text-center">
            <p className="font-serif text-lg text-stone-300">
              まだ本がありません
            </p>
          </div>
        ) : (
          feed.map((entry, i) => {
            const prev = i > 0 ? feed[i - 1] : null;
            const showHeader = shouldShowHeader(entry, prev);
            const isContinuation = !showHeader;

            return (
              <div key={`${entry.book.id}-${entry.slice.createdAt}-${i}`}>
                {showHeader && (
                  <>
                    {i > 0 && <div className="h-6" />}
                    <BookHeader
                      entry={entry}
                      onDelete={() => {
                        const bp = findBookPreview(entry.book.id);
                        if (bp) setDeleteTarget(bp);
                      }}
                    />
                  </>
                )}

                {/* ケースA: 連続投稿の左ボーダー */}
                <div className={isContinuation ? "ml-8 border-l border-stone-100 pl-0" : ""}>
                  <SliceRow entry={entry} scrolling={scrolling} />
                </div>
              </div>
            );
          })
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
