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

export type Slice = {
  id: string;
  bookId: string;
  type: "quote" | "reflection";
  body: string;
  /** 引用時のページ番号等 */
  reference?: string;
  createdAt: string;
};
