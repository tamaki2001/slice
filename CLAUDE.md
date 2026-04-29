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

- **Zero Noise**: shadow/グラデーション/角丸の乱用禁止。境界は余白で表現。カード型UIは使わない。
- **Thematic Grayscale**: 純白(#FFF)/漆黒(#000)使用禁止。stone系のみ。
- **Spatial Typography**: 余白は通常の1.5〜2倍。ブロック間 space-y-16、スレッド内 space-y-8。
- **引用と思索の視覚的分離**:
  - 引用（quote）: `font-serif italic text-stone-500` + `bg-stone-100/60` の薄い背景 + 左ボーダー。他者の言葉は控えめに沈める。
  - 思索（reflection）: `font-sans font-medium text-stone-800`。背景なし。自分の言葉が白い余白の上に浮き出る。
- **モバイル視認性（老眼配慮）**: 本文は `text-lg leading-loose`。メタ情報（ページ番号・時刻）は `text-xs text-stone-500`（小さくてもコントラスト確保）。
- **UIラベルのミニマル化**: 「内省」等の明示的テキストラベルは使わない。モード切替はアイコン（Quote/PenLine）のみ。
- **触覚フィードバック**: フォーム展開時に軽い振動(10ms)、保存完了時にやや強い振動(20ms)。`navigator.vibrate` 非対応環境ではスキップ。
- **アダプティブ入力**: SliceComposerは初期折りたたみ。「思索を書き留める...」バーをタップで展開。空欄でフォーカスを外すと自動閉じ。
- **非破壊的UIの原則**: 「思索（ユーザーの純粋な思考）」と「引用（外部データ）」のライフサイクルは完全に分離する。システム操作の巻き添えでユーザーの思索を破棄してはならない。
- **文脈的アイコン**: UI要素は可能な限り隠し、状態（テキストの有無、画像キャッシュの有無）に応じて必要な操作アイコンのみを同一座標にフェードイン/アウトさせる。

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

## 削除仕様

引用削除時は ON DELETE SET NULL。紐づく内省は `quote_id` が null になり、独立した内省（オーファンレコード）として残る。思考の蓄積を失わない設計。

## シークレット管理・リカバリ

| シークレット | 保管先 | 有効期限 | 再発行URL |
|------------|-------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` (`sb_publishable_*`) | `.env.local` + Vercel | 無期限 | Supabase > Settings > API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` (`sb_secret_*`) | `.env.local` + Vercel | 無期限 | 同上（Secret Keysタブ） |

ローテ: 再発行 → `.env.local`更新 → `printf '%s' "$KEY" \| vercel env add KEY production`（echo禁止） → `vercel --prod`
注意: 共有Supabase（`rbvvraexllrnfjmeorjb`）、テーブルは `sl_` プレフィックス。旧JWT形式 `service_role` は触らない。

## 今後の実装予定機能

### 書影撮影による自動ルーティング
- カメラで書影を撮影→画像認識で書籍を特定→該当の `/book/[id]` へ自動遷移
- **フォールバック仕様**: 認識確度が低い場合、候補書籍をリスト表示する「中間画面」を挟む
- 中間画面の候補のうち、既に Slice（引用・内省）が登録済みの書籍には、過去の内省テキスト冒頭1行をプレビュー表示するインジケーターを必ず実装する
- タイムライン画面の FAB（カメラアイコン）がこの機能のトリガーとなる

### オフラインキュー（Local Storage バックアップ）
- 通信エラーでDB保存に失敗した場合、localStorage に書き込み内容を一時保持
- ネットワーク復帰時に自動リトライで Supabase に同期
- 電波不安定な場所（地下鉄等）での読書・思索を想定した耐障害設計
