"use client";

import type { BookCandidate } from "@/lib/types";

export function CandidateList({
  candidates,
  onSelectExisting,
  onSelectNew,
  onRetry,
}: {
  candidates: BookCandidate[];
  onSelectExisting: (bookId: string) => void;
  onSelectNew: (candidate: BookCandidate) => void;
  onRetry: () => void;
}) {
  if (candidates.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <p className="font-serif text-lg text-stone-300">
          該当する書籍が見つかりませんでした
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="font-sans text-sm tracking-widest text-stone-500 active:text-stone-700"
        >
          もう一度検索する
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-20">
      <div className="divide-y divide-stone-100">
        {candidates.map((c) => (
          <button
            key={c.googleBooksId}
            type="button"
            onClick={() =>
              c.existingBook
                ? onSelectExisting(c.existingBook.id)
                : onSelectNew(c)
            }
            className="w-full text-left py-6 flex items-start gap-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.coverUrl || ""}
              alt=""
              className="w-12 h-16 object-contain flex-shrink-0 bg-stone-100"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-sans text-base font-medium text-stone-800">
                {c.title}
              </h3>
              <span className="font-sans text-xs tracking-widest text-stone-500 block mt-0.5">
                {c.author}
              </span>

              {/* 既存書籍のインジケーター */}
              {c.existingBook && (
                <div className="mt-2 space-y-1">
                  <span className="font-sans text-xs tracking-widest text-stone-600 font-medium">
                    思索：{c.existingBook.sliceCount}件あり
                  </span>
                  {c.existingBook.latestSlice && (
                    <p className="font-serif text-xs text-stone-400 leading-relaxed line-clamp-1">
                      {c.existingBook.latestSlice.body}
                    </p>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
