/**
 * ISBNと各APIのサムネイルURLから最適な書影URLを決定する。
 *
 * 優先順位:
 * 1. Google Books 埋め込みURL（ISBNベース、ほぼ全書籍で200を返す）
 * 2. Google Books APIサムネイル（http→https変換）
 * 3. OpenBD直リンク（日本書籍、ただし404が多い）
 */
export function getBookCover(isbn?: string, googleThumbnail?: string): string {
  // 1. Google Books埋め込みURL（ISBNがあれば最も確実）
  if (isbn && /^\d{13}$/.test(isbn)) {
    return `https://books.google.com/books/content?vid=ISBN${isbn}&printsec=frontcover&img=1&zoom=1`;
  }

  // 2. Google Booksサムネイル（http→https変換）
  if (googleThumbnail) {
    return googleThumbnail.replace("http://", "https://");
  }

  return "";
}
