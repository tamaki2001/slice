import { supabase } from "./supabase";
import type { Book, Slice } from "./types";

// ── 型変換 ──

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

function toBook(row: Record<string, unknown>): Book {
  return {
    id: row.id as string,
    title: row.title as string,
    subtitle: (row.subtitle as string) ?? undefined,
    author: row.author as string,
    translator: (row.translator as string) ?? undefined,
    coverUrl: (row.cover_url as string) ?? "",
    synopsis: (row.synopsis as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
  };
}

// ── Book ──

export async function fetchBook(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from("sl_books")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return toBook(data);
}

// ── Slices ──

export async function fetchSlices(bookId: string): Promise<Slice[]> {
  const { data, error } = await supabase
    .from("sl_slices")
    .select("*")
    .eq("book_id", bookId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map(toSlice);
}

export async function insertSlice(
  slice: Omit<Slice, "id" | "createdAt">
): Promise<Slice> {
  const { data, error } = await supabase
    .from("sl_slices")
    .insert({
      book_id: slice.bookId,
      type: slice.type,
      body: slice.body,
      reference: slice.reference ?? null,
      quote_id: slice.quoteId ?? null,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "挿入に失敗しました");
  return toSlice(data);
}

export async function updateSliceBody(
  id: string,
  body: string
): Promise<void> {
  const { error } = await supabase
    .from("sl_slices")
    .update({ body })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteSlice(id: string): Promise<void> {
  const { error } = await supabase
    .from("sl_slices")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
