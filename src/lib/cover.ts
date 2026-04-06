// 複数ソースからISBNベースで書影URLを取得する

const SOURCES = [
  // Google Books（埋め込み用URL、APIキー不要）
  (isbn: string) =>
    `https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=1&source=gbs_api&vid=ISBN${isbn}`,
  // 国立国会図書館サムネイル
  (isbn: string) =>
    `https://ndlsearch.ndl.go.jp/thumbnail/${isbn}.jpg`,
  // OpenBDカバー
  (isbn: string) =>
    `https://cover.openbd.jp/${isbn}.jpg`,
];

export async function fetchCoverUrl(isbn: string): Promise<string | undefined> {
  for (const buildUrl of SOURCES) {
    const url = buildUrl(isbn);
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        // 画像が返ってきた場合のみ採用（HTMLリダイレクト等を排除）
        if (contentType.startsWith("image/")) {
          return url;
        }
      }
    } catch {
      // 次のソースへ
    }
  }
  return undefined;
}
