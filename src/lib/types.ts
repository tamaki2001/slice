export type Book = {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  translator?: string;
  coverUrl: string;
  synopsis?: string;
  tags: string[];
};

export type BookWithPreview = Book & {
  sliceCount: number;
  latestSlice?: { body: string; createdAt: string };
};

export type BookCandidate = {
  googleBooksId: string;
  title: string;
  author: string;
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
  createdAt: string;
};
