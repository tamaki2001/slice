# Slice

純粋な読書体験の抽出と、自分自身の思考の蓄積のためのミニマリスト Web アプリ (PWA)。

外部 (AI キャラクター等) からの介入やフィードバック機能は一切実装しない。「他者の言葉 (引用)」と「自分の言葉 (思索)」を静かに並べて、読書の余白にこぼれる思考を失わないようにすることだけを目的とする。

## 特徴

- **Zero Noise** — カード型 UI、影、グラデーション、装飾的な角丸を持たない。境界は余白で表現する。
- **Thematic Grayscale** — 純白 (#FFF) と漆黒 (#000) を避けた stone 系のみで構成。
- **Spatial Typography** — 余白は通常の 1.5〜2 倍。ブロック間 `space-y-16`、スレッド内 `space-y-8`。
- **引用と思索の視覚的分離** — 引用は `font-serif italic text-stone-500`、思索は `font-sans font-medium text-stone-800`。他者の言葉は沈め、自分の言葉を浮き立たせる。
- **モバイル視認性 (老眼配慮)** — 本文は `text-lg leading-loose`。
- **アダプティブ入力** — コンポーザは初期折りたたみ。展開時は軽い振動 (10ms)、保存時はやや強い振動 (20ms)。
- **非破壊的 UI** — 思索のライフサイクルは引用と完全に分離。システム操作の巻き添えで思索を破棄しない。引用削除時は `ON DELETE SET NULL` で紐づく思索をオーファンとして残す。

## データモデル

`Slice` は `"quote"` (引用) と `"reflection"` (内省) の 2 種類のみ。feedback や persona は存在しない。

## 技術スタック

- [Next.js 16](https://nextjs.org) App Router + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) (テーブルは `sl_` プレフィックスで分離)
- [framer-motion](https://www.framer.com/motion/) — 画面遷移アニメーション
- Google Generative AI (Gemini) — OCR & 書籍認識
- [lucide-react](https://lucide.dev) — アイコン (使用は最小限)

> Note: このリポジトリの Next.js は breaking changes を含んだ新しい版です。コードを書く前に `node_modules/next/dist/docs/` のガイドを確認してください。詳細は [AGENTS.md](./AGENTS.md) を参照。

## セットアップ

```bash
npm install
cp .env.local.example .env.local   # 下記の変数を埋める
npm run dev
```

### 必要な環境変数

| 変数 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (クライアント公開可) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | 書影からの書籍認識 / OCR に使用 |

Supabase のテーブルはすべて `sl_` プレフィックス (`sl_books`, `sl_slices`, ...) で作成する前提です。

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバ起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバ起動 |
| `npm run lint` | ESLint |

## ライセンス

[MIT](./LICENSE)
