/**
 * ISBNと各APIのサムネイルURLから最適な書影URLを決定する。
 * HEADリクエストは行わず、URLの優先順位で即座に返す。
 */
export function getBookCover(isbn?: string, googleThumbnail?: string): string {
  // 1. OpenBD直リンク（日本の本に強い、ISBNさえあれば確実）
  if (isbn && /^\d{13}$/.test(isbn)) {
    return `https://cover.openbd.jp/${isbn}.jpg`;
  }

  // 2. Google Booksサムネイル（http→https変換）
  if (googleThumbnail) {
    return googleThumbnail.replace("http://", "https://");
  }

  // 3. フォールバック
  return "";
}
