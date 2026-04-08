import { supabase } from "./supabase";
import type { Book, BookWithPreview, Slice, TimelineEntry } from "./types";

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
    publisher: (row.publisher as string) ?? undefined,
    publishedYear: (row.published_year as string) ?? undefined,
    isbn: (row.isbn as string) ?? undefined,
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

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase
    .from("sl_books")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function findBookByTitle(title: string): Promise<Book | null> {
  const { data } = await supabase
    .from("sl_books")
    .select("*")
    .ilike("title", title)
    .limit(1)
    .single();

  if (!data) return null;
  return toBook(data);
}

export async function fetchBooksWithPreview(): Promise<BookWithPreview[]> {
  // 全書籍を取得
  const { data: books, error: bErr } = await supabase
    .from("sl_books")
    .select("*");

  if (bErr || !books) return [];

  // 全スライスを取得（最新順）
  const { data: slices } = await supabase
    .from("sl_slices")
    .select("book_id, body, created_at, type")
    .order("created_at", { ascending: false });

  const sliceList = slices ?? [];

  return books
    .map((row) => {
      const book = toBook(row);
      const bookSlices = sliceList.filter(
        (s) => (s as Record<string, unknown>).book_id === book.id
      );
      const latest = bookSlices[0] as Record<string, unknown> | undefined;
      return {
        ...book,
        sliceCount: bookSlices.length,
        latestSlice: latest
          ? { body: latest.body as string, createdAt: latest.created_at as string }
          : undefined,
      };
    })
    .sort((a, b) => {
      const aTime = a.latestSlice ? new Date(a.latestSlice.createdAt).getTime() : 0;
      const bTime = b.latestSlice ? new Date(b.latestSlice.createdAt).getTime() : 0;
      return bTime - aTime;
    });
}

export async function fetchTimelineFeed(): Promise<TimelineEntry[]> {
  const { data: slices } = await supabase
    .from("sl_slices")
    .select("book_id, body, type, quote_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!slices || slices.length === 0) return [];

  const bookIds = [...new Set(slices.map((s) => (s as Record<string, unknown>).book_id as string))];
  const { data: books } = await supabase
    .from("sl_books")
    .select("*")
    .in("id", bookIds);

  const bookMap = new Map<string, Book>();
  for (const row of books ?? []) {
    const b = toBook(row as Record<string, unknown>);
    bookMap.set(b.id, b);
  }

  const entries: TimelineEntry[] = [];
  for (const s of slices) {
    const r = s as Record<string, unknown>;
    const book = bookMap.get(r.book_id as string);
    if (!book) continue;
    entries.push({
      book,
      slice: {
        body: r.body as string,
        type: r.type as string,
        quoteId: (r.quote_id as string) || undefined,
        createdAt: r.created_at as string,
      },
    });
  }
  return entries;
}

export async function searchBooksByTitle(query: string): Promise<BookWithPreview[]> {
  const { data: books } = await supabase
    .from("sl_books")
    .select("*")
    .ilike("title", `%${query}%`);

  if (!books || books.length === 0) return [];

  const ids = books.map((b) => (b as Record<string, unknown>).id as string);
  const { data: slices } = await supabase
    .from("sl_slices")
    .select("book_id, body, created_at")
    .in("book_id", ids)
    .order("created_at", { ascending: false });

  const sliceList = slices ?? [];

  return books.map((row) => {
    const book = toBook(row);
    const bookSlices = sliceList.filter(
      (s) => (s as Record<string, unknown>).book_id === book.id
    );
    const latest = bookSlices[0] as Record<string, unknown> | undefined;
    return {
      ...book,
      sliceCount: bookSlices.length,
      latestSlice: latest
        ? { body: latest.body as string, createdAt: latest.created_at as string }
        : undefined,
    };
  });
}

export async function createBook(
  book: Omit<Book, "id">
): Promise<Book> {
  const { data, error } = await supabase
    .from("sl_books")
    .insert({
      title: book.title,
      subtitle: book.subtitle ?? null,
      author: book.author,
      translator: book.translator ?? null,
      publisher: book.publisher ?? null,
      published_year: book.publishedYear ?? null,
      isbn: book.isbn ?? null,
      cover_url: book.coverUrl || null,
      synopsis: book.synopsis ?? null,
      tags: book.tags,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "書籍の登録に失敗しました");
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
  body: string,
  reference?: string
): Promise<void> {
  const update: Record<string, unknown> = { body };
  if (reference !== undefined) update.reference = reference || null;

  const { error } = await supabase
    .from("sl_slices")
    .update(update)
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
