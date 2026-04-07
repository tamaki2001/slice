import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "画像データがありません" }, { status: 400 });
    }

    if (!GEMINI_KEY) {
      return NextResponse.json({ error: "API KEY が未設定です" }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `あなたは熟練の校正者です。この画像は日本語の書籍のページを撮影したものです。
以下のルールに厳密に従い、本文テキストのみを正確に書き起こしてください。

【抽出ルール】
1. 本文のみを抽出すること。ページ番号（ノンブル）、柱（ページ上部の章タイトル）、脚注番号は除外する。
2. ルビ（振り仮名）は無視し、親文字のみを出力する。
3. 紙面の都合による行末の改行は結合し、一つの連続した文章にする。ただし段落の区切りは改行1つで表現する。
4. 傍点や圏点が付いた文字は、そのまま文字だけを出力する。
5. 縦書きレイアウトの場合、右から左への正しい読み順でテキスト化すること。
6. 余計な説明や前置きは不要。抽出したテキストのみを出力すること。`,
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log("[ocr] Gemini error:", err);
      return NextResponse.json({ error: `Gemini API エラー` }, { status: 502 });
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
