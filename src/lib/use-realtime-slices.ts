"use client";

import { useEffect } from "react";
import { supabase } from "./supabase";
import type { Slice } from "./types";

function toSlice(row: Record<string, unknown>): Slice {
  return {
    id: row.id as string,
    bookId: row.book_id as string,
    type: row.type as "quote" | "reflection",
    body: row.body as string,
    reference: (row.reference as string) ?? undefined,
    quoteId: (row.quote_id as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export function useRealtimeSlices(
  bookId: string,
  setSlices: React.Dispatch<React.SetStateAction<Slice[]>>
) {
  useEffect(() => {
    const channel = supabase
      .channel(`sl_slices:${bookId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sl_slices",
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const newSlice = toSlice(payload.new);
          setSlices((prev) => {
            // 楽観的アップデートで既に追加済みならスキップ
            if (prev.some((s) => s.id === newSlice.id)) return prev;
            return [...prev, newSlice];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sl_slices",
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const updated = toSlice(payload.new);
          setSlices((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "sl_slices",
        },
        (payload) => {
          const deletedId = (payload.old as { id?: string }).id;
          if (!deletedId) return;
          setSlices((prev) => {
            // SET NULL: 引用が削除されたら紐づく内省のquoteIdをクリア
            return prev
              .filter((s) => s.id !== deletedId)
              .map((s) =>
                s.quoteId === deletedId ? { ...s, quoteId: undefined } : s
              );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookId, setSlices]);
}
