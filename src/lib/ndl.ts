import type { BookCandidate } from "./types";
import { getBookCover } from "./cover";

export async function searchNDL(query: string): Promise<BookCandidate[]> {
  const url = `https://ndlsearch.ndl.go.jp/api/opensearch?cnt=5&title=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return parseNDLResponse(await res.text());
  } catch {
    return [];
  }
}

export async function searchNDLByISBN(isbn: string): Promise<BookCandidate[]> {
  const url = `https://ndlsearch.ndl.go.jp/api/opensearch?cnt=3&isbn=${isbn}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return parseNDLResponse(await res.text(), isbn);
  } catch {
    return [];
  }
}

function parseNDLResponse(xml: string, knownIsbn?: string): BookCandidate[] {
  const results: BookCandidate[] = [];
  const items = xml.split("<item>").slice(1);

  for (const item of items) {
    const title = extractTag(item, "title") ?? extractTag(item, "dc:title");
    const author = extractTag(item, "author") ?? extractTag(item, "dc:creator");
    const publisher = extractTag(item, "dc:publisher");
    const dateRaw = extractTag(item, "dc:date") ?? extractTag(item, "pubDate");
    const isbn = knownIsbn ?? extractIsbn(item);

    if (!title) continue;

    // タイトル: NDLは「タイトル : サブタイトル / 著者」形式
    const cleanTitle = title.split(" : ")[0].split(" / ")[0].trim();

    // 著者: NDLは「姓, 名, 生年-」形式。フルネームに整形
    const cleanAuthor = formatAuthor(author);

    // 出版年: 「2024.3」「2024」等から年を抽出
    const publishedYear = dateRaw?.match(/(\d{4})/)?.[1];

    const cleanIsbn = isbn?.replace(/\D/g, "") ?? "";
    const isbn13 = cleanIsbn.length === 13 ? cleanIsbn : undefined;

    results.push({
      googleBooksId: `ndl-${cleanTitle.slice(0, 20)}`,
      title: cleanTitle,
      author: cleanAuthor,
      isbn: isbn13,
      publisher: publisher?.trim(),
      publishedYear,
      coverUrl: getBookCover(isbn13) || undefined,
    });
  }

  return results;
}

function formatAuthor(raw: string | null): string {
  if (!raw) return "";
  // NDLの著者形式: "姓, 名, 生没年-" → "姓 名" に変換
  // 複数著者は " / " で区切り、最初の著者のみ使用
  const first = raw.split("/")[0].trim();
  const parts = first.split(",").map((s) => s.trim());

  // 生没年（数字で始まる部分）を除去
  const nameParts = parts.filter((p) => !/^\d/.test(p));

  if (nameParts.length >= 2) {
    // "姓, 名" → "姓 名" (日本語の場合はスペースなしで結合)
    const surname = nameParts[0];
    const given = nameParts[1];
    // 漢字・ひらがな・カタカナのみならスペースなし
    if (/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+$/u.test(surname + given)) {
      return surname + given;
    }
    return `${surname} ${given}`;
  }

  return nameParts[0] ?? "";
}

function extractIsbn(item: string): string | null {
  // dc:identifierの中からISBNを探す
  const identifiers = item.match(/<dc:identifier[^>]*>([^<]+)<\/dc:identifier>/g) ?? [];
  for (const id of identifiers) {
    const val = id.match(/>([^<]+)</)?.[1] ?? "";
    const digits = val.replace(/\D/g, "");
    if (digits.length === 13 && /^97[89]/.test(digits)) return digits;
  }
  return null;
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`);
  const match = xml.match(re);
  return match?.[1]?.trim() ?? null;
}
