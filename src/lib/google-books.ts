import type { BookCandidate, BookWithPreview } from "./types";
import { searchBooksByTitle } from "./db";

type GoogleBooksItem = {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    imageLinks?: { thumbnail?: string };
  };
};

export async function searchGoogleBooks(query: string): Promise<BookCandidate[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&langRestrict=ja`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = await res.json();
  const items: GoogleBooksItem[] = json.items ?? [];

  // DB内の既存書籍を検索
  let existingBooks: BookWithPreview[] = [];
  try {
    existingBooks = await searchBooksByTitle(query);
  } catch {
    // DB検索失敗時は空で続行
  }

  return items
    .filter((item) => item.volumeInfo.title)
    .map((item) => {
      const v = item.volumeInfo;
      const title = v.title ?? "";
      const author = v.authors?.join(", ") ?? "";

      // 既存書籍とのマッチング（タイトル部分一致）
      const existing = existingBooks.find(
        (b) =>
          b.title === title ||
          title.includes(b.title) ||
          b.title.includes(title)
      );

      return {
        googleBooksId: item.id,
        title,
        author,
        coverUrl: v.imageLinks?.thumbnail?.replace("http://", "https://"),
        existingBook: existing,
      };
    });
}
