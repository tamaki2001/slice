import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript がありません" }, { status: 400 });
    }

    if (!GEMINI_KEY) {
      return NextResponse.json({ error: "API KEY が未設定です" }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`;

    const prompt = buildPrompt(transcript);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log("[clean-speech] Gemini error:", err);
      return NextResponse.json({ error: "Gemini API エラー" }, { status: 502 });
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const cleaned = parts
      .filter((p: Record<string, unknown>) => typeof p.text === "string" && !p.thought)
      .map((p: Record<string, unknown>) => p.text as string)
      .join("")
      .trim();

    return NextResponse.json({ text: cleaned });
  } catch (e) {
    console.log("[clean-speech] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "整形に失敗しました" },
      { status: 500 }
    );
  }
}

function buildPrompt(transcript: string): string {
  return `あなたは日本語の発話テキストの編集者です。以下は音声認識による発話の書き起こしです。

【厳守事項】
- フィラー（えー、あのー、えっと、まあ、あの、うーん、そのー、なんか、ほら、ま、えーっと等）のみ除去する
- 要約・言い換え・整理は一切しない
- 思考の流れ、言い淀み、繰り返し（「でも...でも」「やっぱり」等）は保持する
- 話し言葉の温度感をそのまま残す（口語体を整文しない）
- 句読点を自然に補完し、文章として読める形にする
- 余計な改行は入れず、意味の切れ目で適度に改行する
- 説明や前置きは不要。整形後のテキストのみ出力。

【発話】
${transcript}

【整形後】`;
}
