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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `あなたは書籍認識の専門家です。この画像は本の表紙または裏表紙の写真です。
画像に写っている本のタイトル、著者名、ISBNを読み取ってください。
表紙に書かれている文字を注意深く読んでください。

以下のJSON形式のみで回答してください（説明文は不要）:
{"title": "本のタイトル", "author": "著者名", "isbn": "ISBN番号"}

読み取れない項目は空文字にしてください。`,
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
          maxOutputTokens: 512,
          temperature: 0,
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

    // gemini-2.5-flashはthinkingモデル。thought=trueを除外して応答テキストのみ結合
    const parts = data.candidates?.[0]?.content?.parts ?? [];

    // 応答パート（thought除外）
    const responseParts = parts
      .filter((p: Record<string, unknown>) => typeof p.text === "string" && !p.thought)
      .map((p: Record<string, unknown>) => p.text as string);

    // 応答パートが空ならthinking含め全体から
    const textSource = responseParts.length > 0
      ? responseParts.join("\n")
      : parts
          .filter((p: Record<string, unknown>) => typeof p.text === "string")
          .map((p: Record<string, unknown>) => p.text as string)
          .join("\n");

    console.log("[recognize] Gemini parts count:", parts.length, "response parts:", responseParts.length);
    console.log("[recognize] Gemini text:", textSource.slice(0, 800));

    // JSONブロック抽出（マークダウンコードブロック除去）
    const cleaned = textSource
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // 複数行JSONにも対応
    const match = cleaned.match(/\{[\s\S]*?"title"\s*:\s*"[\s\S]*?\}/);

    if (!match) {
      // フォールバック: テキストから直接タイトルっぽい文字列を抽出
      const titleMatch = textSource.match(/"title"\s*:\s*"([^"]+)"/);
      const authorMatch = textSource.match(/"author"\s*:\s*"([^"]+)"/);
      if (titleMatch) {
        const result = {
          title: titleMatch[1].trim(),
          author: authorMatch?.[1]?.trim() ?? "",
          isbn: "",
        };
        console.log("[recognize] regex fallback:", result);
        return NextResponse.json(result);
      }
      console.log("[recognize] JSON抽出完全失敗");
      return NextResponse.json({ title: "", author: "", isbn: "", raw: textSource.slice(0, 300) });
    }
    if (!match) {
      console.log("[recognize] JSON抽出失敗。応答:", textSource.slice(0, 200));
      return NextResponse.json({ title: "", author: "", isbn: "", raw: textSource.slice(0, 200) });
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
      return NextResponse.json({ title: "", author: "", isbn: "", raw: match[0] });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "認識に失敗しました" },
      { status: 500 }
    );
  }
}
