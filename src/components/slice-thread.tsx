"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Slice } from "@/lib/types";
import { DeleteSliceDialog } from "./delete-slice-dialog";

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="削除"
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-stone-300 hover:text-stone-500 active:text-stone-500 transition-opacity"
    >
      <Trash2 size={13} strokeWidth={1.5} />
    </button>
  );
}

function QuoteBlock({
  slice,
  onAddReflection,
  onDelete,
}: {
  slice: Slice;
  onAddReflection: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group border-l-2 border-stone-200 pl-6">
      <div className="flex items-start justify-between gap-2">
        <p className="font-serif text-stone-600 text-sm leading-relaxed italic flex-1">
          {slice.body}
        </p>
        <DeleteButton onClick={onDelete} />
      </div>
      <div className="flex items-center justify-between mt-2">
        {slice.reference ? (
          <span className="font-sans text-stone-400 text-xs tracking-widest">
            {slice.reference}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onAddReflection}
          className="font-sans text-xs tracking-widest text-stone-300 active:text-stone-500 transition-colors"
        >
          + 内省
        </button>
      </div>
    </div>
  );
}

function NestedReflectionBlock({
  slice,
  onDelete,
}: {
  slice: Slice;
  onDelete: () => void;
}) {
  return (
    <div className="group pl-8">
      <div className="flex items-start justify-between gap-2">
        <p className="font-serif text-stone-800 text-sm leading-loose flex-1">
          {slice.body}
        </p>
        <DeleteButton onClick={onDelete} />
      </div>
      <span className="font-sans text-stone-400 text-xs tracking-widest mt-2 block text-right">
        {formatTime(slice.createdAt)}
      </span>
    </div>
  );
}

function StandaloneReflectionBlock({
  slice,
  onDelete,
}: {
  slice: Slice;
  onDelete: () => void;
}) {
  return (
    <div className="group">
      <div className="flex items-start justify-between gap-2">
        <p className="font-serif text-stone-800 text-sm leading-loose flex-1">
          {slice.body}
        </p>
        <DeleteButton onClick={onDelete} />
      </div>
      <span className="font-sans text-stone-400 text-xs tracking-widest mt-2 block text-right">
        {formatTime(slice.createdAt)}
      </span>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

type ThreadItem =
  | { kind: "quote-thread"; quote: Slice; reflections: Slice[] }
  | { kind: "standalone"; slice: Slice };

function buildThreads(slices: Slice[]): ThreadItem[] {
  const quotes = slices.filter((s) => s.type === "quote");
  const linkedReflections = slices.filter(
    (s) => s.type === "reflection" && s.quoteId
  );
  const standaloneReflections = slices.filter(
    (s) => s.type === "reflection" && !s.quoteId
  );

  const quoteThreads = quotes.map((q) => ({
    kind: "quote-thread" as const,
    quote: q,
    reflections: linkedReflections
      .filter((r) => r.quoteId === q.id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    sortKey: new Date(q.createdAt).getTime(),
  }));

  const standalones = standaloneReflections.map((s) => ({
    kind: "standalone" as const,
    slice: s,
    sortKey: new Date(s.createdAt).getTime(),
  }));

  return [...quoteThreads, ...standalones]
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((item) =>
      item.kind === "quote-thread"
        ? { kind: "quote-thread", quote: item.quote, reflections: item.reflections }
        : { kind: "standalone", slice: item.slice }
    );
}

export function SliceThread({
  slices,
  onReplyToQuote,
  onDelete,
}: {
  slices: Slice[];
  onReplyToQuote?: (quoteId: string) => void;
  onDelete?: (sliceId: string) => void;
}) {
  const threads = buildThreads(slices);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    isQuote: boolean;
    childCount: number;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete?.(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="px-8 py-6 space-y-12">
        {threads.map((item) => {
          if (item.kind === "quote-thread") {
            return (
              <div key={item.quote.id} className="space-y-6">
                <QuoteBlock
                  slice={item.quote}
                  onAddReflection={() => onReplyToQuote?.(item.quote.id)}
                  onDelete={() =>
                    setDeleteTarget({
                      id: item.quote.id,
                      isQuote: true,
                      childCount: item.reflections.length,
                    })
                  }
                />
                {item.reflections.map((r) => (
                  <NestedReflectionBlock
                    key={r.id}
                    slice={r}
                    onDelete={() =>
                      setDeleteTarget({
                        id: r.id,
                        isQuote: false,
                        childCount: 0,
                      })
                    }
                  />
                ))}
              </div>
            );
          }
          return (
            <StandaloneReflectionBlock
              key={item.slice.id}
              slice={item.slice}
              onDelete={() =>
                setDeleteTarget({
                  id: item.slice.id,
                  isQuote: false,
                  childCount: 0,
                })
              }
            />
          );
        })}
      </div>

      <DeleteSliceDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        isQuote={deleteTarget?.isQuote ?? false}
        childCount={deleteTarget?.childCount ?? 0}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
