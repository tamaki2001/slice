import type { BookCandidate } from "./types";

// 国立国会図書館サーチAPI（完全無料・登録不要・レート制限緩い）
export async function searchNDL(query: string): Promise<BookCandidate[]> {
  const url = `https://ndlsearch.ndl.go.jp/api/opensearch?cnt=5&title=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const xml = await res.text();
    return parseNDLResponse(xml);
  } catch {
    return [];
  }
}

export async function searchNDLByISBN(isbn: string): Promise<BookCandidate[]> {
  const url = `https://ndlsearch.ndl.go.jp/api/opensearch?cnt=3&isbn=${isbn}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const xml = await res.text();
    return parseNDLResponse(xml);
  } catch {
    return [];
  }
}

function parseNDLResponse(xml: string): BookCandidate[] {
  const results: BookCandidate[] = [];

  // 簡易XMLパース（item単位で抽出）
  const items = xml.split("<item>").slice(1);

  for (const item of items) {
    const title = extractTag(item, "title") ?? extractTag(item, "dc:title");
    const author = extractTag(item, "author") ?? extractTag(item, "dc:creator");

    if (!title) continue;

    // タイトルのクリーンアップ（NDLは「タイトル : サブタイトル」形式）
    const cleanTitle = title.split(" : ")[0].split(" / ")[0].trim();

    results.push({
      googleBooksId: `ndl-${cleanTitle.slice(0, 20)}`,
      title: cleanTitle,
      author: author?.replace(/[,，].*$/, "").trim() ?? "",
      coverUrl: undefined,
    });
  }

  return results;
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`);
  const match = xml.match(re);
  return match?.[1]?.trim() ?? null;
}
