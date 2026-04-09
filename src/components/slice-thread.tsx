"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, Pencil } from "lucide-react";
import type { Slice } from "@/lib/types";
import { DeleteSliceDialog } from "./delete-slice-dialog";

/* ── アクションボタン（44x44 hitbox、モバイルでも微かに見える） ── */

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
        opacity-20 group-hover:opacity-100 group-focus-within:opacity-100
        text-stone-400 hover:text-stone-600 active:text-stone-600
        transition-opacity shrink-0
      "
    >
      {children}
    </button>
  );
}

/* ── インライン編集（リファレンスも編集可） ── */

function InlineEditor({
  value,
  reference,
  onSave,
  onCancel,
  className,
  showReference,
}: {
  value: string;
  reference?: string;
  onSave: (text: string, ref?: string) => void;
  onCancel: () => void;
  className?: string;
  showReference?: boolean;
}) {
  const [text, setText] = useState(value);
  const [ref, setRef] = useState(reference ?? "");
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textRef.current) return;
    textRef.current.focus();
    textRef.current.style.height = "auto";
    textRef.current.style.height = textRef.current.scrollHeight + "px";
  }, []);

  useEffect(() => {
    if (!textRef.current) return;
    textRef.current.style.height = "auto";
    textRef.current.style.height = textRef.current.scrollHeight + "px";
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (text.trim()) onSave(text.trim(), ref.trim() || undefined);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="flex-1 space-y-2">
      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        className={`w-full resize-none bg-stone-100/50 rounded px-2 py-1 focus:outline-none ${className ?? ""}`}
      />
      {showReference && (
        <input
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="p."
          className="w-24 bg-transparent font-sans text-sm tracking-widest text-stone-500 placeholder:text-stone-400 border-b border-stone-200 focus:border-stone-400 focus:outline-none py-1"
        />
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { if (text.trim()) onSave(text.trim(), ref.trim() || undefined); }}
          className="font-sans text-xs tracking-widest text-stone-500 active:text-stone-700"
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
  onEdit: (text: string, ref?: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="group bg-stone-100/60 -mx-4 px-4 py-5 border-l-2 border-stone-300 pl-6">
      <div className="flex items-start gap-1">
        {editing ? (
          <InlineEditor
            value={slice.body}
            reference={slice.reference}
            showReference
            onSave={(t, r) => { onEdit(t, r); setEditing(false); }}
            onCancel={() => setEditing(false)}
            className="font-serif text-stone-500 text-base leading-relaxed italic whitespace-pre-wrap"
          />
        ) : (
          <>
            <p className="font-serif text-stone-500 text-base leading-relaxed italic flex-1 whitespace-pre-wrap">
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
        <div className="flex items-center justify-between mt-3">
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
  scrolling,
}: {
  slice: Slice;
  onDelete: () => void;
  onEdit: (text: string) => void;
  indented: boolean;
  scrolling: boolean;
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
            className="font-serif text-stone-800 text-base leading-relaxed whitespace-pre-wrap"
          />
        ) : (
          <>
            <p className="font-serif text-stone-800 text-base leading-relaxed flex-1 whitespace-pre-wrap">
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
        <span
          className={`
            font-sans text-xs tracking-widest mt-2 block text-right
            transition-opacity duration-500
            ${scrolling ? "text-stone-400 opacity-60" : "text-stone-400 opacity-0 group-hover:opacity-60"}
          `}
        >
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
  scrolling = false,
  activeQuoteId,
  inlineComposer,
  onReplyToQuote,
  onDelete,
  onEdit,
}: {
  slices: Slice[];
  scrolling?: boolean;
  activeQuoteId?: string;
  inlineComposer?: React.ReactNode;
  onReplyToQuote?: (quoteId: string) => void;
  onDelete?: (sliceId: string) => void;
  onEdit?: (sliceId: string, body: string, reference?: string) => void;
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
                  onEdit={(text, ref) => onEdit?.(item.quote.id, text, ref)}
                />
                {item.reflections.map((r) => (
                  <ReflectionBlock
                    key={r.id}
                    slice={r}
                    indented
                    scrolling={scrolling}
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
                {/* インラインComposer: この引用に追記中 */}
                {activeQuoteId === item.quote.id && inlineComposer && (
                  <div className="pl-8">{inlineComposer}</div>
                )}
              </div>
            );
          }
          return (
            <ReflectionBlock
              key={item.slice.id}
              slice={item.slice}
              indented={false}
              scrolling={scrolling}
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
