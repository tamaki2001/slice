import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, userReflection, quoteAnchor } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "画像データがありません" }, { status: 400 });
    }

    if (!GEMINI_KEY) {
      return NextResponse.json({ error: "API KEY が未設定です" }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`;

    const prompt = buildPrompt(userReflection, quoteAnchor);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 2048, temperature: 0 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log("[ocr] Gemini error:", err);
      return NextResponse.json({ error: "Gemini API エラー" }, { status: 502 });
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p: Record<string, unknown>) => typeof p.text === "string" && !p.thought)
      .map((p: Record<string, unknown>) => p.text as string)
      .join("")
      .trim();

    return NextResponse.json({ text });
  } catch (e) {
    console.log("[ocr] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "OCRに失敗しました" },
      { status: 500 }
    );
  }
}

function buildPrompt(userReflection?: string, quoteAnchor?: string): string {
  const baseRules = `【共通抽出ルール】
- ページ番号（ノンブル）、柱（章タイトル）、脚注番号は除外する。
- ルビ（振り仮名）は無視し、親文字のみを出力する。
- 行末の改行は結合し、一つの連続した文章にする。段落区切りは改行1つ。
- 縦書きの場合、右から左への正しい読み順でテキスト化すること。
- 余計な説明や前置きは不要。抽出したテキストのみを出力すること。`;

  // モード1: アンカー + 思索 → ピンポイント拡張
  if (quoteAnchor && userReflection) {
    return `あなたは熟練の校正者兼文学研究者です。この画像は日本語の書籍のページを撮影したものです。

【タスク】
1. 画像内のテキストを正確に書き起こしてください。
2. 書き起こした全文の中から、以下の「冒頭の数文字（アンカー）」で始まる一節を探してください。アンカーが多少誤記されていても、曖昧一致で最も近い箇所を特定してください。
3. 見つかった箇所を起点として、以下の「ユーザーの思索」の文脈を補完するのに適切な長さ（通常1〜2段落）まで引用範囲を広げてください。
4. アンカーを含む完成された引用文のみを返してください。

【アンカー（引用冒頭）】
${quoteAnchor}

【ユーザーの思索】
${userReflection}

${baseRules}`;
  }

  // モード2: アンカーのみ → アンカー起点で適切な範囲を抽出
  if (quoteAnchor) {
    return `あなたは熟練の校正者です。この画像は日本語の書籍のページを撮影したものです。

【タスク】
1. 画像内のテキストを正確に書き起こしてください。
2. 書き起こした全文の中から、以下の「冒頭の数文字（アンカー）」で始まる一節を探してください。多少の誤記でも曖昧一致で特定してください。
3. 見つかった箇所から、意味的にまとまりのある範囲（1〜2文）を抽出してください。
4. アンカーを含む完成された引用文のみを返してください。

【アンカー（引用冒頭）】
${quoteAnchor}

${baseRules}`;
  }

  // モード3: 思索のみ → 関連箇所を意味的に特定
  if (userReflection) {
    return `あなたは熟練の校正者兼文学研究者です。この画像は日本語の書籍のページを撮影したものです。

【タスク】
1. 画像内のテキストを正確に書き起こしてください。
2. 書き起こした全文の中から、以下のユーザーの思索内容に直接言及している、あるいはその根拠・着想源となっている一節（数行〜一段落程度）を特定してください。
3. 特定したその一節のみを返してください。関連箇所が不明な場合はページ内の最も重要な段落を返してください。

【ユーザーの思索】
${userReflection}

${baseRules}`;
  }

  // モード4: 何も手がかりなし → 全文OCR
  return `あなたは熟練の校正者です。この画像は日本語の書籍のページを撮影したものです。
以下のルールに厳密に従い、本文テキストのみを正確に書き起こしてください。

${baseRules}`;
}
