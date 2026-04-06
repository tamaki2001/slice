import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "画像データがありません" },
        { status: 400 }
      );
    }

    if (!GEMINI_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY が未設定です" },
        { status: 500 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'この画像に写っている本の「タイトル」「著者名」「ISBN」を推測してください。JSON形式で {"title": "...", "author": "...", "isbn": "..."} のみを返してください。特定できない項目は空文字にしてください。',
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
          maxOutputTokens: 256,
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Gemini API エラー: ${err}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    console.log("[recognize] Gemini raw:", content);

    // JSONブロック抽出（```json...```やマークダウンコードブロック対応）
    const cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      console.log("[recognize] JSON抽出失敗");
      return NextResponse.json({ title: "", author: "", isbn: "" });
    }

    try {
      const parsed = JSON.parse(match[0]);
      const result = {
        title: String(parsed.title ?? "").trim(),
        author: String(parsed.author ?? "").trim(),
        isbn: String(parsed.isbn ?? parsed.ISBN ?? "").replace(/\D/g, ""),
      };
      console.log("[recognize] parsed:", result);
      return NextResponse.json(result);
    } catch (parseErr) {
      console.log("[recognize] JSONパース失敗:", parseErr, match[0]);
      return NextResponse.json({ title: "", author: "", isbn: "" });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "認識に失敗しました" },
      { status: 500 }
    );
  }
}
