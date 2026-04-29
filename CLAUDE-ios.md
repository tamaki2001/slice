@AGENTS.md

> 本ファイルは **iOS/SwiftUI版** のSlice用ドキュメントである。Web版（`CLAUDE.md`）と並列に存在し、移植先で参照される。Web版から移植する際は本ファイルを `CLAUDE.md` にリネームすること。
> 詳細な移植指針は `SWIFT_PORT_GUIDE.md` を参照。

## アプリ概要

**Slice** — 純粋な読書体験の抽出と、自分自身の思考の蓄積のためのミニマリストiOSアプリ（SwiftUI / iPhone）。
外部（AIキャラクター等）からの介入やフィードバック機能は一切実装しない。
AI処理（音声認識・OCR・フィラー除去）はすべてオンデバイスで完結し、ネット通信は書誌メタデータ取得時のみ。

## 技術スタック

- **SwiftUI** + Swift 6 / iOS 18.4+ ターゲット
- **SwiftData**（永続化）+ **CloudKit**（プライベートDB自動同期、認証不要）
- **VisionKit**: `VNRecognizeTextRequest`（書影OCR）/ `VNDetectBarcodesRequest`（ISBN）
- **SFSpeechRecognizer**: 完全オンデバイス音声認識（`requiresOnDeviceRecognition = true`）
- **Foundation Models** (iOS 18.4+): フィラー除去。サポート外の場合は **MLX-Swift + 軽量LLM**（Phi-3.5-mini / Qwen2.5-1.5B）にフォールバック
- **書誌API**: NDL Search / OpenBD / Google Books（ネット通信が必要なのはここだけ）
- **アイコン**: SF Symbols 優先、独自アイコンは最小限
- **アニメーション**: 画面遷移とロード表示のみ。`.transition(.opacity)` 中心、`.spring` は基本使わない

## デザイン憲法（絶対遵守）

- **Zero Noise**: shadow / グラデーション / 角丸の乱用禁止。境界は余白で表現。カード型UIは使わない。`.shadow()` の使用は原則禁止、必要な場面でも `radius: 1〜2` 程度。
- **Thematic Grayscale**: 純白 (#FFF) / 漆黒 (#000) 使用禁止。**stone系のみ**。Asset Catalog にカラーセットとして定義し、ライト/ダーク両方を持つ。
- **Spatial Typography**: 余白は通常の1.5〜2倍。ブロック間 `padding(.vertical, 32)`（Tailwindのspace-y-16相当）、スレッド内 `padding(.vertical, 16)`（space-y-8相当）。
- **引用と思索の視覚的分離**:
  - 引用（quote）: `Font.custom("HiraMinProN-W3", size: 16).italic()` + `.foregroundStyle(.stone500)` + `.background(.stone100.opacity(0.6))` + 左に2pxボーダー。他者の言葉は控えめに沈める。
  - 思索（reflection）: `Font.custom("HiraMinProN-W3", size: 17)` + `.foregroundStyle(.stone800)`。背景なし。自分の言葉が余白の上に浮き出る。
- **モバイル視認性（老眼配慮）**: 本文は最低 17pt、`.lineSpacing(8)` 以上。メタ情報（ページ番号・時刻）は 11pt + `.foregroundStyle(.stone500)`（小さくてもコントラスト確保）。
- **UIラベルのミニマル化**: 「内省」等の明示的テキストラベルは使わない。モード切替はSF Symbol（`quote.bubble` / `pencil.line`）のみ。
- **触覚フィードバック**: `UIImpactFeedbackGenerator(.light)`（旧 `navigator.vibrate(10)` 相当）でフォーム展開時、`.medium`（旧 20ms 相当）で保存完了時。`prepare()` をビュー出現時に呼ぶこと（レイテンシ削減）。
- **アダプティブ入力**: SliceComposer は初期折りたたみ。「思索を書き留める...」バーをタップで展開。空欄でフォーカスを外すと自動閉じ。`@FocusState` で制御。
- **非破壊的UIの原則**: 「思索（ユーザーの純粋な思考）」と「引用（外部データ）」のライフサイクルは完全に分離する。システム操作の巻き添えでユーザーの思索を破棄してはならない。
- **文脈的アイコン**: UI要素は可能な限り隠し、状態（テキストの有無、画像キャッシュの有無）に応じて必要な操作アイコンのみを `.opacity()` でフェードイン/アウトさせる。デフォルト `opacity(0.2)`、フォーカス時 `opacity(1.0)`、`.animation(.easeInOut(duration: 0.2), value: isFocused)`。

## データ構造

```swift
@Model
final class Book {
    @Attribute(.unique) var id: UUID
    var title: String
    var subtitle: String?
    var author: String
    var translator: String?
    var publisher: String?
    var publishedYear: String?
    var isbn: String?
    var coverURL: String?
    var synopsis: String?
    var tags: [String]
    var createdAt: Date

    @Relationship(deleteRule: .cascade, inverse: \Slice.book)
    var slices: [Slice] = []

    var isMonologue: Bool { id == Book.monologueID }
    static let monologueID = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!
}

@Model
final class Slice {
    @Attribute(.unique) var id: UUID
    var type: SliceType         // .quote / .reflection
    var body: String
    var reference: String?
    var location: String?
    var createdAt: Date
    var book: Book?

    @Relationship(deleteRule: .nullify) var quote: Slice?  // reflection が紐づくquote
}

enum SliceType: String, Codable { case quote, reflection }
```

`Slice` 型は `.quote` と `.reflection` の2種のみ。feedbackやpersonaは存在しない。

## 個別ページ（感想・内省ページ）のUI設計要件

**1. 設計思想**
Progressive Disclosure（段階的開示）を徹底し、内省のための画面領域を最大化する。

**2. 画面構成**

* **A. 極小ヘッダー（常時表示）**: 書影サムネイル、書名、`info.circle` アイコンのみ。
* **B. メインコンテンツ領域**: 「書籍からの引用」「ユーザー自身の内省」のスレッド表示。余白とタイポグラフィ最優先。`ScrollView` + `LazyVStack`。
* **C. 詳細情報ビュー**: 書誌情報を `.sheet` で表示。`.presentationDetents([.medium, .large])` でモバイル時にボトムシート風に。

**3. 技術的注意**
セーフエリアはSwiftUIが自動処理。`.safeAreaInset(edge: .bottom)` でcomposerを下部固定。

## 削除仕様

引用削除時は `@Relationship(deleteRule: .nullify)`。紐づく内省は `quote` プロパティが nil になり、独立した内省（オーファンレコード）として残る。思考の蓄積を失わない設計。

## 独語（ひとりごと）

固定UUIDの特殊な `Book` として並列に存在する。詳細は `CONCEPT.md` 参照。

- **判定**: `book.isMonologue` または `book.id == Book.monologueID`
- **書影**: 青空モチーフのSVG（Asset Catalog に `MonologueCover` として登録）
- **入力UI**: SliceComposer の `monologueMode` フラグで引用エリア・OCRを抑止し、場所入力に切り替え
- **音声入力**: 独語モードのみマイクアイコンを表示。SFSpeechRecognizer + Foundation Models によるフィラー除去
- **場所メタデータ**: `slice.location` フィールド（任意）。タップで `MKMapItem.openMaps(...)` または `https://maps.apple.com/?q=...` URL を起動

## CloudKit設定

- Apple Developer Program 必須
- Xcode Capabilities: 「iCloud」→「CloudKit」を有効化
- `ModelContainer` 初期化時に `cloudKitDatabase: .private("iCloud.com.tamaki2001.slice")` を渡す
- スキーマ変更時は **App Store提出前に必ず本番環境のCloudKit Schemaを更新**（Xcode > CloudKit Console から Deploy）

## Info.plist 必須項目

これを書き忘れるとアプリがクラッシュする：

```xml
<key>NSCameraUsageDescription</key>
<string>書影とバーコードを読み取るためにカメラを使用します。</string>
<key>NSMicrophoneUsageDescription</key>
<string>独語を音声で記録するためにマイクを使用します。</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>音声を文字に変換します。処理は端末内で完結します。</string>
```

## データ移行（初回起動時）

`exports/slice-export-latest.json` をシードインポートする。`SeedImporter` が以下を行う：

1. JSONをパース（書籍・sliceのスキーマは `SWIFT_PORT_GUIDE.md` §2 参照）
2. SwiftDataの `Book` / `Slice` モデルへマッピング
3. 同一UUIDが既存なら skip（冪等性）
4. インポート完了フラグを `UserDefaults` に保存し、次回以降スキップ
5. CloudKit経由で他デバイスへ自動同期

新規インストール（エクスポートなし）の場合は、Bootstrap で独語bookのみ投入。

## シークレット管理

- **AI関連APIキー: 不要**（すべてオンデバイス）
- **書誌APIキー: 不要**（NDL/OpenBDは認証不要、Google Booksも閲覧用途では不要）
- **Apple Developer証明書 / プロビジョニングプロファイル**: Xcode のチームに紐付け、`*.p12` は1Password等で管理
- **CloudKit コンテナ識別子**: ハードコードしてよい（Bundle IDに連動）

Web版が依存していたSupabase / Gemini API キーはすべて不要。これがエッジ化の最大の利点。

## 今後の実装予定機能

### 書影撮影による自動ルーティング
- カメラで書影を撮影 → `VNDetectBarcodesRequest` でISBN取得 → 該当の書籍ページへ自動遷移
- ISBN取得失敗時は `VNRecognizeTextRequest` でタイトルOCR → NDL検索
- 認識確度が低い場合、候補書籍をリスト表示する「中間画面」を挟む
- 中間画面の候補のうち、既にSliceが登録済みの書籍には、過去の内省テキスト冒頭1行をプレビュー表示する

### Lock Screen Widget / Live Activity
- ロック画面から1タップで独語ページに遷移するウィジェット
- 録音中は Live Activity で状態表示

### Shortcuts.app 統合
- 「Hey Siri、独語を始めて」で録音を開始するショートカット
- App Intents で実装

### iPad / Mac (Catalyst) 対応
- iPhone優先で実装するが、SwiftUIの素直な書き方をしていればiPadでも動く
- Stage Managerでの2画面表示時のレイアウト検証は別タスク

## 開発ワークフロー

- **ビルド**: Xcode > Product > Run（`⌘R`）
- **テスト**: `XCTest` を最小限。UIロジックは `@Observable` ViewModelに切り出してユニットテスト可能に
- **CIなし**（個人利用前提）。リリースはApp Store Connectから手動アップロード
- **コミットメッセージ**: 日本語、Web版と同じスタイル（feat / fix / refactor / docs）
