@AGENTS.md

## アプリ概要

**Slice** — 純粋な読書体験の抽出と、自分自身の思考の蓄積のためのミニマリストWebアプリ（PWA）。
外部（AIキャラクター等）からの介入やフィードバック機能は一切実装しない。

## 技術スタック

- Next.js (App Router) + TypeScript
- Tailwind CSS（shadcn/ui併用）
- Supabase（共有インスタンス `rbvvraexllrnfjmeorjb`、`sl_` プレフィックスでテーブル分離）
- lucide-react（極力使用を控える）
- framer-motion（画面遷移アニメーション）

## デザイン憲法（絶対遵守）

- **Zero Noise**: shadow/グラデーション/角丸の乱用禁止。境界は余白で表現。
- **Thematic Grayscale**: 純白(#FFF)/漆黒(#000)使用禁止。stone系のみ。
- **Typography**: ユーザー入力コンテンツ→明朝体(font-serif)、システム情報→サンセリフ(font-sans text-sm tracking-widest)。
- **Spatial Typography**: 余白は通常の1.5〜2倍。

## データ構造

Slice型は `"quote"（引用）` と `"reflection"（内省）` の2種のみ。feedbackやpersonaは存在しない。

## 個別ページ（感想・内省ページ）のUI設計要件

**1. 設計思想**
Progressive Disclosure（段階的開示）を徹底し、内省のための画面領域を最大化する。

**2. 画面構成**

* **A. 極小ヘッダー（常時表示）**: 書影サムネイル、書名、ⓘアイコンのみ。
* **B. メインコンテンツ領域**: 「書籍からの引用」「ユーザー自身の内省」のスレッド表示。余白とタイポグラフィ最優先。
* **C. 詳細情報ビュー（ⓘタップで開示）**: 書誌情報をSheet（モバイル:ボトムシート、デスクトップ:サイドパネル）で表示。

**3. 技術的注意**
ボトムシートは `env(safe-area-inset-bottom)` でセーフエリア確保。
