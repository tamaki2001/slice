# Slice → Swift / iOS 移植ガイド

このドキュメントは、Web版Slice（Next.js + Supabase）を、SwiftUIによるネイティブiOSアプリへ移植するための実装ガイドである。

**対象読者:** Mac版のClaude Code、および将来この移植を担当する開発者。

---

## 0. 大前提：哲学ファースト、実装セカンド

最も重要な原則：**コードを移植するのではなく、哲学を移植する。**

Slice の本質は「UIは消える」「状態がUIを召喚する」「serif=思索 / sans=操作」「stone系のみ」「余白で境界を表現」といった**設計憲法**にある。Web版のコードはその副産物にすぎない。SwiftUIで同じ哲学を実現すれば、コードは大きく異なってよい。

### 着手時に必ず読むべきドキュメント（この順）

1. **`AGENTS.md`** — プロジェクトの最上位指示
2. **`CLAUDE.md`** — デザイン憲法（絶対遵守事項）と技術スタック
3. **`CONCEPT.md`** — 独語（ひとりごと）機能の設計思想
4. **本ドキュメント `SWIFT_PORT_GUIDE.md`** — iOS移植の具体的指針

これらの内容と矛盾する判断は、必ず人間に確認してから進めること。Slice は「便利なメモアプリ」ではなく、認知的負荷ゼロの**思索の容器**であり、その美学を損なうコードは却下される。

---

## 1. アーキテクチャ決定

### 1.1 データ層：CloudKit + ローカルキャッシュ（推奨）

| 候補 | 評価 | 採否 |
|------|------|------|
| Supabase継続 | エッジ思想に反する。認証も不要なのにクラウド依存 | × |
| 完全ローカル（SwiftData / SQLite） | 同期できず複数デバイスで分断 | △ |
| **CloudKit + SwiftData** | Apple純正・無料・Apple ID自動同期・エッジ動作 | **◯** |

**SwiftData + CloudKit統合**を採用する。`@Model` クラスに `cloudKitDatabase: .private` を設定するだけでiCloud同期が走る。Apple ID未ログインでもローカルでフル機能動作。

### 1.2 AIスタック：完全オンデバイス化

Web版で外部APIに依存していた処理を、すべてiOSネイティブAPIで置換する。**これは妥協ではなく品質向上**である。

| 機能 | Web版 | iOS版 |
|------|-------|-------|
| 音声認識 | Web Speech API | **SFSpeechRecognizer**（オンデバイス、完全無料） |
| 書影OCR | Gemini Vision | **VisionKit `VNRecognizeTextRequest`** |
| ISBN認識 | @zxing/library | **VisionKit `VNDetectBarcodesRequest`** |
| フィラー除去 | Gemini API | **Foundation Models（iOS 18.4+）** または **MLX + 軽量LLM** |
| 書影画像認識 | Gemini Vision | VisionKit + 書誌API（NDL等）はネット必要 |

注：書誌メタデータ取得（NDL / Google Books / OpenBD）だけはネット必須だが、これは「特定のISBN/タイトルから情報を引く」だけのRESTコールであり、AI処理ではない。

### 1.3 認証

**不要。** 個人利用前提のためApple IDによる暗黙認証（CloudKit private DB）のみ。サインイン画面は作らない。

---

## 2. データ移行

### 2.1 エクスポートファイル

Win版から渡すファイル：`exports/slice-export-latest.json`

構造：
```json
{
  "exportedAt": "ISO8601",
  "source": "Supabase ...",
  "schema": { ... },
  "counts": { "books": 5, "slices": 38 },
  "books": [ { id, title, author, ... } ],
  "slices": [ { id, book_id, type, body, location, ... } ]
}
```

### 2.2 Mac版での取り込み手順

1. このリポジトリのルートにエクスポートJSONを配置
2. Swift プロジェクト初回起動時に、**シードインポーター**を起動：
   - JSONをパース
   - SwiftDataの `Book` / `Slice` モデルへマッピング
   - 同一UUIDが既に存在すれば skip（冪等性）
   - インポート完了フラグを `UserDefaults` に保存し、次回以降スキップ
3. インポート後、CloudKit経由で他デバイスへ同期

### 2.3 独語bookの固定UUID

**`00000000-0000-0000-0000-000000000001`** — このUUIDの本は「独語」として全アプリで共通扱い。エクスポートファイルにも含まれているので、シードインポートで自動的に登録される。新規インストール時（エクスポートなし）は、初回起動時のbootstrapで明示的に投入する。

---

## 3. デザイン憲法（iOS翻訳版）

Web版CLAUDE.mdの「デザイン憲法」をSwiftUI語彙に翻訳。

### 3.1 カラートークン

純白(#FFF)・漆黒(#000)使用禁止。**stone系のみ**。Asset Catalog にカラーセットとして定義し、ライト/ダーク両方を持つ。

```swift
// Colors.swift
extension Color {
    static let stone50  = Color("Stone50")    // #fafaf9
    static let stone100 = Color("Stone100")   // #f5f5f4
    static let stone200 = Color("Stone200")   // #e7e5e4
    static let stone300 = Color("Stone300")   // #d6d3d1
    static let stone400 = Color("Stone400")   // #a8a29e
    static let stone500 = Color("Stone500")   // #78716c
    static let stone600 = Color("Stone600")   // #57534e
    static let stone700 = Color("Stone700")   // #44403c
    static let stone800 = Color("Stone800")   // #292524

    static let appBackground = Color("AppBackground") // stone-50相当
}
```

### 3.2 タイポグラフィ

**Serif（思索・引用・コンテンツ）**: Hiragino Mincho ProN / Times New Roman
**Sans（操作・UI・メタ情報）**: San Francisco（システム）

```swift
extension Font {
    static let sliceSerif = Font.custom("HiraMinProN-W3", size: 17)
    static let sliceSerifLg = Font.custom("HiraMinProN-W3", size: 19)
    static let sliceSans = Font.system(size: 14, weight: .regular)
    static let sliceSansSm = Font.system(size: 11, weight: .medium)
}
```

老眼配慮：本文は最低17pt、`.lineSpacing(8)` 以上。

### 3.3 余白

ブロック間 `padding(.vertical, 32)`（Tailwindのspace-y-16相当）、スレッド内 `padding(.vertical, 16)`（space-y-8）。

### 3.4 引用と思索の視覚的分離

**引用（quote）**: serif italic、`.foregroundStyle(.stone500)`、`.background(.stone100.opacity(0.6))`、左に2pxボーダー
**思索（reflection）**: serif、`.foregroundStyle(.stone800)`、背景なし

### 3.5 状態がUIを召喚する

ボタンは**デフォルト `opacity(0.2)`**、フォーカス/ホバー時に `opacity(1.0)`。
SwiftUIでは `@FocusState` と `.opacity()` のアニメーション。長押しメニューは `.contextMenu` を使う。

```swift
.opacity(isFocused ? 1.0 : 0.2)
.animation(.easeInOut(duration: 0.2), value: isFocused)
```

### 3.6 触覚フィードバック

```swift
import UIKit

enum Haptic {
    static let light = UIImpactFeedbackGenerator(style: .light)
    static let medium = UIImpactFeedbackGenerator(style: .medium)

    static func prepare() {
        light.prepare()
        medium.prepare()
    }
}

// 使用
Haptic.light.impactOccurred()    // フォーム展開時（旧 navigator.vibrate(10)）
Haptic.medium.impactOccurred()   // 保存完了時（旧 navigator.vibrate(20)）
```

`prepare()` をビュー出現時に呼ばないとレイテンシが出る。**Slice の触覚は美学の核**なので雑に実装しない。

### 3.7 アニメーション

Web版の方針通り、**画面遷移とロード表示以外はアニメーションを使わない**。これによって使った箇所が際立つ。

`.transition(.opacity)`（300ms）、`.spring`は基本使わない（iOS標準のバウンド感が強すぎる）。

---

## 4. データモデル

### 4.1 SwiftData定義

```swift
import SwiftData
import Foundation

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
    var coverURL: String?       // ローカル相対パス or URL
    var synopsis: String?
    var tags: [String]
    var createdAt: Date

    @Relationship(deleteRule: .cascade, inverse: \Slice.book)
    var slices: [Slice] = []

    var isMonologue: Bool {
        id == Book.monologueID
    }

    static let monologueID = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!

    init(id: UUID = UUID(), title: String, author: String, ...) { ... }
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
    var quote: Slice?           // reflection が紐づく quote。nullable

    init(...) { ... }
}

enum SliceType: String, Codable {
    case quote, reflection
}
```

### 4.2 削除ルール

引用削除時、紐づく内省は**孤児として残す**（Web版と同じ仕様）。SwiftDataの `deleteRule` で `.nullify` を選ぶ：

```swift
@Relationship(deleteRule: .nullify) var quote: Slice?
```

これによって `quote_id ON DELETE SET NULL` 相当を実現。「思考の蓄積を失わない」原則。

---

## 5. 機能モジュール構成

```
Slice/
├── App/
│   ├── SliceApp.swift           // @main、SwiftData container
│   └── ModelContainer+Setup.swift
├── Models/
│   ├── Book.swift
│   ├── Slice.swift
│   └── SliceType.swift
├── Views/
│   ├── Timeline/
│   │   ├── TimelineView.swift
│   │   ├── BookHeaderRow.swift
│   │   └── SliceRow.swift
│   ├── Capture/
│   │   ├── CaptureView.swift
│   │   ├── CameraViewfinder.swift
│   │   └── BookCandidatesView.swift
│   ├── Reflection/
│   │   ├── ReflectionView.swift
│   │   ├── BookMiniHeader.swift
│   │   ├── SliceThread.swift
│   │   ├── SliceComposer.swift
│   │   └── BookDetailSheet.swift
│   └── Common/
│       ├── HapticButton.swift
│       └── DesignTokens.swift
├── Services/
│   ├── BookSearch/
│   │   ├── NDLClient.swift      // 国会図書館API（Web版から移植）
│   │   ├── GoogleBooksClient.swift
│   │   └── OpenBDClient.swift
│   ├── Recognition/
│   │   ├── BookCoverRecognizer.swift  // VisionKit OCR
│   │   ├── BarcodeScanner.swift       // VisionKit barcode
│   │   └── SpeechTranscriber.swift    // SFSpeechRecognizer
│   └── AI/
│       └── FillerRemover.swift        // Foundation Models or local LLM
├── Migration/
│   └── SeedImporter.swift             // exports/*.json → SwiftData
└── Resources/
    ├── Assets.xcassets/               // Stone palette + monologue-cover.svg
    └── Info.plist
```

---

## 6. 実装フェーズ

過去のWeb版開発と同じ順で進めるのが、検証しやすい。

### Phase 1: MVP（書籍と思索のCRUD）
1. SwiftData モデル定義
2. SeedImporter で既存データをインポート
3. Timeline / Reflection / SliceComposer の最小UI
4. CRUD：本の追加、引用と思索の作成・編集・削除
5. デザイン憲法の遵守確認

### Phase 2: 書影撮影と書誌取得
1. CaptureView（カメラビュー）
2. VNDetectBarcodesRequest でISBN認識
3. NDL/OpenBD/Google Books クライアント移植
4. VNRecognizeTextRequest でタイトル候補取得
5. BookCandidatesView

### Phase 3: 独語（ひとりごと）
1. 独語bookの初回シード（既にエクスポートに含まれる）
2. ReflectionViewのmonologueModeフラグ
3. SliceComposerで引用エリア抑止、場所入力切替
4. 場所メタデータ表示（タップでマップアプリ起動： `MKMapItem.openMaps(...)` または `https://maps.apple.com/?q=...` URL）

### Phase 4: 音声入力 + フィラー除去
1. SFSpeechRecognizer ラッパー
2. Foundation Models or MLX でフィラー除去
3. 録音中UI（pulse + 暫定文字起こし）
4. 沈黙対応（SFSpeechRecognizerは設定で連続録音可能）

### Phase 5: CloudKit同期の検証
1. 複数デバイスでの同期確認
2. 競合解消の挙動確認
3. オフライン→オンライン復帰時の挙動

---

## 7. iOS固有のハマりどころ

### 7.1 Info.plist の usage descriptions

これを書き忘れるとアプリが**クラッシュ**する。必須項目：

```xml
<key>NSCameraUsageDescription</key>
<string>書影とバーコードを読み取るためにカメラを使用します。</string>
<key>NSMicrophoneUsageDescription</key>
<string>独語を音声で記録するためにマイクを使用します。</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>音声を文字に変換します。処理は端末内で完結します。</string>
```

### 7.2 SFSpeechRecognizer

- `requiresOnDeviceRecognition = true` を明示的に設定（オンデバイス強制）
- `SFSpeechAudioBufferRecognitionRequest` でストリーミング処理
- **沈黙でセッションが切れる挙動**は Web Speech API と同じ。`.shouldReportPartialResults = true` でinterimを取得しつつ、終了検知時に再起動するラッパーを書く（Web版の `useSpeechRecognition` と同じ思想）

### 7.3 Foundation Models（iOS 18.4+）

```swift
import FoundationModels

let session = LanguageModelSession(instructions: """
あなたは日本語の発話テキストの編集者です。フィラー（えー、あのー、えっと、まあ等）のみを除去し、要約・言い換えは一切しないでください。
""")
let response = try await session.respond(to: transcript)
```

iOS 18.4未満をサポートする必要がある場合、または品質が不足する場合は、**MLX-Swift + 小型LLM（例: Phi-3.5-mini, Qwen2.5-1.5B）** をフォールバックに用意する。

### 7.4 CloudKit設定

- Apple Developer Programの有料アカウント必須（個人開発者なら年$99）
- Capabilitiesで「iCloud」→「CloudKit」を有効化
- SwiftDataの `ModelContainer` に `cloudKitDatabase: .private("iCloud.com.example.slice")` を渡す
- スキーマ変更時はApp Store提出前に必ず本番環境のCloudKit Schemaを更新

### 7.5 PWA → ネイティブ：失う/得るもの

| 失うもの | 補償 |
|---------|------|
| ブラウザのインストール簡便性 | App Store経由（Apple ID紐付けで使い回し可能） |
| URLでの遷移共有 | iOS Universal Links / SceneStorage |
| Service Workerオフライン | SwiftDataがそもそもオフラインファースト |

| 得るもの |
|---------|
| 完全オンデバイスAI（プライバシー、ネット不要、コストゼロ） |
| ネイティブ触覚API（Web版より精密） |
| Lock Screen Widget で独語ピン留め可能 |
| Shortcuts.app との統合（「Hey Siri、独語を始めて」） |

---

## 8. プロジェクト初動コマンド

Mac版Claude Codeに最初に投げる想定のプロンプト：

```
このリポジトリは、Web版Slice（Next.js）をネイティブiOSアプリへ移植するためのものです。

まず以下のドキュメントをこの順で読んでください：
1. AGENTS.md
2. CLAUDE.md
3. CONCEPT.md
4. SWIFT_PORT_GUIDE.md

読了後、Phase 1（SwiftData モデル定義 + SeedImporter）から着手してください。
exports/slice-export-latest.json を初回起動時にインポートする実装が最初の検証ポイントです。

設計憲法（CLAUDE.mdの該当節）は絶対遵守。stone系以外の色や、shadow/カード型UIを導入する判断が必要になったら、必ず私に確認してください。
```

---

## 9. 私（Win版Claude）からの引き継ぎメモ

Sliceの開発を通じて気づいたこと：

- **「独語」は Slice の心臓**である。普通の本としての扱いを基本としつつ、書影UI/composerモード切替/場所メタデータ/音声入力という4つの差分が必要。CONCEPT.md を必ず先に読むこと。
- **書影プレースホルダの「青空SVG」は思想の象徴**。これがあるおかげで「独語」は単なる空のbookではなく、容器として確立する。Asset Catalogへの移植時に劣化させないこと。
- **音声入力は沈黙との戦い**になる。SFSpeechRecognizerの再起動ラッパーは入念に書くべき。Web版の `useSpeechRecognition` の onend 時の自動再開ロジックを参考にすること。
- **触覚フィードバックの軽さ**。`.light`（10ms相当）と `.medium`（20ms相当）の使い分けが、Sliceの体験の3割を占める。
- **タイムラインの「6時間ギャップでヘッダー再表示」ロジック**（Web版 `timeline-page.tsx` の `SESSION_GAP_MS`）は、Slice独特の時間感覚を表現している。SwiftUIの `Section` で再現可能。

健闘を祈る。
