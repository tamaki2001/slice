"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, Pencil } from "lucide-react";
import type { Slice } from "@/lib/types";
import { DeleteSliceDialog } from "./delete-slice-dialog";

/* ── アクションボタン（44x44 hitbox） ── */

function ActionButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="
        size-11 flex items-center justify-center
        opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
        text-stone-300 hover:text-stone-500 active:text-stone-500
        transition-opacity shrink-0
      "
    >
      {children}
    </button>
  );
}

/* ── インライン編集テキストエリア ── */

function InlineEditor({
  value,
  onSave,
  onCancel,
  className,
}: {
  value: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.focus();
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (text.trim()) onSave(text.trim());
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="flex-1">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        className={`w-full resize-none bg-stone-100/50 rounded px-2 py-1 focus:outline-none ${className ?? ""}`}
      />
      <div className="flex gap-3 mt-1">
        <button
          type="button"
          onClick={() => { if (text.trim()) onSave(text.trim()); }}
          className="font-sans text-xs tracking-widest text-stone-400 active:text-stone-600"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-sans text-xs tracking-widest text-stone-300 active:text-stone-500"
        >
          取消
        </button>
      </div>
    </div>
  );
}

/* ── ブロックコンポーネント ── */

function QuoteBlock({
  slice,
  onAddReflection,
  onDelete,
  onEdit,
}: {
  slice: Slice;
  onAddReflection: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="group border-l-2 border-stone-200 pl-6">
      <div className="flex items-start gap-1">
        {editing ? (
          <InlineEditor
            value={slice.body}
            onSave={(t) => { onEdit(t); setEditing(false); }}
            onCancel={() => setEditing(false)}
            className="font-serif text-stone-600 text-lg leading-loose italic"
          />
        ) : (
          <>
            <p className="font-serif text-stone-600 text-lg leading-loose italic flex-1">
              {slice.body}
            </p>
            <ActionButton onClick={() => setEditing(true)} label="編集">
              <Pencil size={13} strokeWidth={1.5} />
            </ActionButton>
            <ActionButton onClick={onDelete} label="削除">
              <Trash2 size={13} strokeWidth={1.5} />
            </ActionButton>
          </>
        )}
      </div>
      {!editing && (
        <div className="flex items-center justify-between mt-2">
          {slice.reference ? (
            <span className="font-sans text-stone-500 text-xs tracking-widest">
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
            +
          </button>
        </div>
      )}
    </div>
  );
}

function ReflectionBlock({
  slice,
  onDelete,
  onEdit,
  indented,
}: {
  slice: Slice;
  onDelete: () => void;
  onEdit: (text: string) => void;
  indented: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className={`group ${indented ? "pl-8" : ""}`}>
      <div className="flex items-start gap-1">
        {editing ? (
          <InlineEditor
            value={slice.body}
            onSave={(t) => { onEdit(t); setEditing(false); }}
            onCancel={() => setEditing(false)}
            className="font-serif text-stone-800 text-lg leading-loose font-medium"
          />
        ) : (
          <>
            <p className="font-serif text-stone-800 text-lg leading-loose font-medium flex-1">
              {slice.body}
            </p>
            <ActionButton onClick={() => setEditing(true)} label="編集">
              <Pencil size={13} strokeWidth={1.5} />
            </ActionButton>
            <ActionButton onClick={onDelete} label="削除">
              <Trash2 size={13} strokeWidth={1.5} />
            </ActionButton>
          </>
        )}
      </div>
      {!editing && (
        <span className="font-sans text-stone-500 text-xs tracking-widest mt-2 block text-right">
          {formatTime(slice.createdAt)}
        </span>
      )}
    </div>
  );
}

/* ── ユーティリティ ── */

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

/* ── メインコンポーネント ── */

export function SliceThread({
  slices,
  onReplyToQuote,
  onDelete,
  onEdit,
}: {
  slices: Slice[];
  onReplyToQuote?: (quoteId: string) => void;
  onDelete?: (sliceId: string) => void;
  onEdit?: (sliceId: string, body: string) => void;
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
      <div className="px-8 py-8 space-y-16">
        {threads.map((item) => {
          if (item.kind === "quote-thread") {
            return (
              <div key={item.quote.id} className="space-y-8">
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
                  onEdit={(text) => onEdit?.(item.quote.id, text)}
                />
                {item.reflections.map((r) => (
                  <ReflectionBlock
                    key={r.id}
                    slice={r}
                    indented
                    onDelete={() =>
                      setDeleteTarget({
                        id: r.id,
                        isQuote: false,
                        childCount: 0,
                      })
                    }
                    onEdit={(text) => onEdit?.(r.id, text)}
                  />
                ))}
              </div>
            );
          }
          return (
            <ReflectionBlock
              key={item.slice.id}
              slice={item.slice}
              indented={false}
              onDelete={() =>
                setDeleteTarget({
                  id: item.slice.id,
                  isQuote: false,
                  childCount: 0,
                })
              }
              onEdit={(text) => onEdit?.(item.slice.id, text)}
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
