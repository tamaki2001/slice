/**
 * Slice データエクスポートスクリプト
 *
 * Supabase の sl_books と sl_slices を JSON ファイルにダンプする。
 * Swift 版 Slice への移行用。
 *
 * 実行: node --env-file=.env.local scripts/export-data.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "exports");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("環境変数が未設定です: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

console.log("Slice データをエクスポート中...");
console.log(`Supabase: ${url}`);
console.log("");

// ── books ──
const { data: books, error: bErr } = await supabase
  .from("sl_books")
  .select("*")
  .order("created_at", { ascending: true });

if (bErr) {
  console.error("sl_books の取得に失敗:", bErr);
  process.exit(1);
}

// ── slices ──
const { data: slices, error: sErr } = await supabase
  .from("sl_slices")
  .select("*")
  .order("created_at", { ascending: true });

if (sErr) {
  console.error("sl_slices の取得に失敗:", sErr);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const out = {
  exportedAt: new Date().toISOString(),
  source: "Supabase " + url,
  schema: {
    books: ["id", "title", "subtitle", "author", "translator", "publisher", "published_year", "isbn", "cover_url", "synopsis", "tags", "created_at"],
    slices: ["id", "book_id", "type", "body", "reference", "quote_id", "location", "created_at"],
  },
  counts: { books: books.length, slices: slices.length },
  books,
  slices,
};

const filename = `slice-export-${timestamp}.json`;
const filepath = resolve(OUT_DIR, filename);
writeFileSync(filepath, JSON.stringify(out, null, 2), "utf-8");

// 最新版へのシンボリックエイリアス
const latestPath = resolve(OUT_DIR, "slice-export-latest.json");
writeFileSync(latestPath, JSON.stringify(out, null, 2), "utf-8");

console.log(`✓ books: ${books.length} 件`);
console.log(`✓ slices: ${slices.length} 件`);
console.log("");
console.log(`保存先: ${filepath}`);
console.log(`       ${latestPath}`);
