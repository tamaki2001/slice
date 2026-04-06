import type { BookCandidate, BookWithPreview } from "./types";
import { searchBooksByTitle } from "./db";
import { getBookCover } from "./cover";

type GoogleBooksItem = {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    imageLinks?: { thumbnail?: string };
    industryIdentifiers?: { type: string; identifier: string }[];
  };
};

export async function searchGoogleBooksByISBN(isbn: string): Promise<BookCandidate[]> {
  for (const q of [`isbn:${isbn}`, isbn]) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`[google-books] API error ${res.status} for "${q}"`);
      continue;
    }

    const json = await res.json();
    if (json.error) {
      console.log(`[google-books] API error:`, json.error.message);
      continue;
    }
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
  if (!res.ok) {
    console.log(`[google-books] API error ${res.status} for "${query}"`);
    return [];
  }

  const json = await res.json();
  if (json.error) {
    console.log(`[google-books] API error:`, json.error.message);
    return [];
  }
  const items: GoogleBooksItem[] = json.items ?? [];

  return buildCandidates(items, query);
}

async function buildCandidates(
  items: GoogleBooksItem[],
  dbSearchQuery?: string
): Promise<BookCandidate[]> {
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
      const isbn13 = v.industryIdentifiers?.find(
        (i) => i.type === "ISBN_13"
      )?.identifier;
      const thumbnail = v.imageLinks?.thumbnail;

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
        isbn: isbn13,
        coverUrl: getBookCover(isbn13, thumbnail) || undefined,
        existingBook: existing,
      };
    });
}
