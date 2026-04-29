export type Book = {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  translator?: string;
  publisher?: string;
  publishedYear?: string;
  isbn?: string;
  coverUrl: string;
  synopsis?: string;
  tags: string[];
};

export type BookWithPreview = Book & {
  sliceCount: number;
  latestSlice?: { body: string; createdAt: string };
};

export type TimelineEntry = {
  book: Book;
  slice: { body: string; type: string; quoteId?: string; createdAt: string };
};

export type BookCandidate = {
  googleBooksId: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: string;
  coverUrl?: string;
  /** DB内の既存bookと一致した場合 */
  existingBook?: BookWithPreview;
};

export type Slice = {
  id: string;
  bookId: string;
  type: "quote" | "reflection";
  body: string;
  /** 引用時のページ番号等 */
  reference?: string;
  /** 内省が紐づく引用のID */
  quoteId?: string;
  /** 独語の場所メタデータ（喫茶店名・座標など、任意） */
  location?: string;
  createdAt: string;
};

/** 独語（ひとりごと）の特殊book ID。本に紐づかない断片の容器として
 *  sl_books 内に1冊だけ存在し、通常の本と並列に並ぶ。 */
export const MONOLOGUE_BOOK_ID = "00000000-0000-0000-0000-000000000001";

export function isMonologueBook(bookOrId: { id: string } | string): boolean {
  const id = typeof bookOrId === "string" ? bookOrId : bookOrId.id;
  return id === MONOLOGUE_BOOK_ID;
}
