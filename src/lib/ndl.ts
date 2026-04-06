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
    const isbn = knownIsbn ?? extractTag(item, "dc:identifier");

    if (!title) continue;

    const cleanTitle = title.split(" : ")[0].split(" / ")[0].trim();
    const cleanIsbn = isbn?.replace(/\D/g, "") ?? "";
    const isbn13 = cleanIsbn.length === 13 ? cleanIsbn : undefined;

    results.push({
      googleBooksId: `ndl-${cleanTitle.slice(0, 20)}`,
      title: cleanTitle,
      author: author?.replace(/[,，].*$/, "").trim() ?? "",
      isbn: isbn13,
      coverUrl: getBookCover(isbn13) || undefined,
    });
  }

  return results;
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`);
  const match = xml.match(re);
  return match?.[1]?.trim() ?? null;
}
