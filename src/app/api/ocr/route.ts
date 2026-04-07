import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, userReflection, quoteAnchor } = await req.json();

    // アンカーを冒頭/末尾に分割
    // 区切り: 全角スペース、半角スペース3つ以上、タブ
    let startAnchor: string | undefined;
    let endAnchor: string | undefined;
    if (quoteAnchor) {
      const raw = (quoteAnchor as string).trim();
      // 全角スペースで分割を最優先
      if (raw.includes("　")) {
        const parts = raw.split("　").map((s: string) => s.trim()).filter(Boolean);
        startAnchor = parts[0] || undefined;
        endAnchor = parts.length > 1 ? parts[parts.length - 1] : undefined;
      } else if (/\s{3,}/.test(raw)) {
        const parts = raw.split(/\s{3,}/).map((s: string) => s.trim()).filter(Boolean);
        startAnchor = parts[0] || undefined;
        endAnchor = parts.length > 1 ? parts[parts.length - 1] : undefined;
      } else {
        // 区切りなし→冒頭アンカーのみ
        startAnchor = raw || undefined;
      }
    }

    console.log("[ocr] anchors:", { startAnchor, endAnchor, userReflection: !!userReflection });

    if (!imageBase64) {
      return NextResponse.json({ error: "画像データがありません" }, { status: 400 });
    }

    if (!GEMINI_KEY) {
      return NextResponse.json({ error: "API KEY が未設定です" }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`;

    const prompt = buildPrompt(userReflection, startAnchor, endAnchor);

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

function buildPrompt(userReflection?: string, startAnchor?: string, endAnchor?: string): string {
  const ocrRules = `【OCR共通ルール】
- 画像全体を隅々までスキャンすること。上部・下部・左右の端も見落とさない。
- ページ番号、柱（章タイトル）、脚注番号は除外。
- ルビ（振り仮名）は無視し、親文字のみ出力。
- 行末の改行は結合して一つの文章に。段落区切りのみ改行1つ。
- 縦書きは右→左の読み順。
- 説明や前置きは不要。テキストのみ出力。`;

  const hasAnchor = startAnchor || endAnchor;

  // ── アンカーあり（冒頭〜末尾の範囲抽出） ──
  if (hasAnchor) {
    const reflectionContext = userReflection
      ? `\n\n【参考：ユーザーの思索】\n${userReflection}\n（この思索は範囲特定の参考情報です。引用範囲はアンカーで厳密に決定してください）`
      : "";

    return `あなたは熟練の校正者です。この画像は日本語の書籍のページです。

【手順】
ステップ1: 画像内の本文テキストを全て正確に書き起こしてください（内部作業、出力しない）。
ステップ2: 書き起こした全文から、以下の条件に一致する範囲を切り出してください。

【範囲の特定方法】
${startAnchor ? `・開始位置: 「${startAnchor}」という語句を含む文の先頭から開始。多少の誤字があっても最も近い箇所を選ぶこと。` : "・開始位置: 指定なし。末尾アンカーの文脈から適切な開始位置を判断すること。"}
${endAnchor ? `・終了位置: 「${endAnchor}」という語句を含む文の末尾で終了。この語句の後の文章は含めないこと。` : "・終了位置: 指定なし。意味的にまとまりのある箇所で終了すること。"}

【重要】
- 開始位置より前のテキストは絶対に含めないこと。
- 終了位置より後のテキストは絶対に含めないこと。
- 出力は切り出した引用文のみ。
${reflectionContext}

${ocrRules}`;
  }

  // ── 思索のみ（関連箇所の意味的特定） ──
  if (userReflection) {
    return `あなたは熟練の校正者兼文学研究者です。この画像は日本語の書籍のページです。

【手順】
ステップ1: 画像内の本文テキストを全て正確に書き起こしてください（内部作業、出力しない）。
ステップ2: 書き起こした全文から、以下のユーザーの思索の根拠・着想源となっている一節を特定してください。

【ユーザーの思索】
${userReflection}

【出力】特定した一節のみ（数行〜一段落）。関連箇所が不明な場合はページ内の主要な段落を返すこと。

${ocrRules}`;
  }

  // ── 全文OCR ──
  return `あなたは熟練の校正者です。この画像は日本語の書籍のページです。
本文テキストのみを正確に書き起こしてください。

${ocrRules}`;
}
