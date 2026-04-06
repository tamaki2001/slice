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

export async function searchGoogleBooksByISBN(isbn: string): Promise<BookCandidate[]> {
  // ISBN検索は複数の形式で試行
  for (const q of [`isbn:${isbn}`, isbn]) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`;
    const res = await fetch(url);
    if (!res.ok) continue;

    const json = await res.json();
    const items: GoogleBooksItem[] = json.items ?? [];
    if (items.length > 0) {
      return buildCandidates(items);
    }
  }
  return [];
}

export async function searchGoogleBooks(query: string): Promise<BookCandidate[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = await res.json();
  const items: GoogleBooksItem[] = json.items ?? [];

  return buildCandidates(items, query);
}

async function buildCandidates(
  items: GoogleBooksItem[],
  dbSearchQuery?: string
): Promise<BookCandidate[]> {
  // DB内の既存書籍を検索（クエリがあれば）
  let existingBooks: BookWithPreview[] = [];
  if (dbSearchQuery) {
    try {
      existingBooks = await searchBooksByTitle(dbSearchQuery);
    } catch {
      // DB検索失敗時は空で続行
    }
  }

  return items
    .filter((item) => item.volumeInfo.title)
    .map((item) => {
      const v = item.volumeInfo;
      const title = v.title ?? "";
      const author = v.authors?.join(", ") ?? "";

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
