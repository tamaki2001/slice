import type { BookCandidate } from "./types";

type OpenBDResponse = {
  summary?: {
    title?: string;
    author?: string;
    isbn?: string;
    cover?: string;
    publisher?: string;
  };
} | null;

export async function searchOpenBD(isbn: string): Promise<BookCandidate | null> {
  try {
    const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
    if (!res.ok) return null;

    const data: OpenBDResponse[] = await res.json();
    const book = data?.[0];
    if (!book?.summary?.title) return null;

    const s = book.summary;

    // 書影: API返却値 → OpenBDカバーエンドポイント → Google Booksサムネイル
    const coverUrl =
      s.cover?.replace("http://", "https://") ||
      `https://cover.openbd.jp/${isbn}.jpg`;

    return {
      googleBooksId: `openbd-${isbn}`,
      title: s.title!,
      author: s.author ?? "",
      coverUrl,
    };
  } catch {
    return null;
  }
}
