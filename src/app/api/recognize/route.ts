import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "画像データがありません" },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY が未設定です" },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'この画像に写っている本の「タイトル」と「著者名」を特定してください。JSON形式で {"title": "...", "author": "..."} のみを返してください。特定できない場合は {"title": "", "author": ""} を返してください。',
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `OpenAI API エラー: ${err}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // JSONを抽出
    const match = content.match(/\{[\s\S]*?\}/);
    if (!match) {
      return NextResponse.json({ title: "", author: "" });
    }

    const parsed = JSON.parse(match[0]);
    return NextResponse.json({
      title: parsed.title ?? "",
      author: parsed.author ?? "",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "認識に失敗しました" },
      { status: 500 }
    );
  }
}
