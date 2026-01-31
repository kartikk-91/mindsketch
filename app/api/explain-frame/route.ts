import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Explain what is happening in this frame in simple, natural English.

Start the explanation with one of these phrases:
- "The frame contains"
- "The frame consists of"

Guidelines:
- Do not mention that this is an image or that you are seeing anything
- Avoid dramatic or exaggerated language
- Avoid abstract or vague wording
- Keep the tone neutral and clear, as if explaining inside the app
- Use everyday English

Output rules:
- Respond only in valid JSON
- Return exactly one key: "explanation"
- The explanation should be one short paragraph
- No extra text
`,
            },
            {
              inlineData: {
                mimeType: mimeType ?? "image/png",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const raw =
      response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      return NextResponse.json(
        { explanation: "Empty response from Gemini" },
        { status: 500 }
      );
    }

    return NextResponse.json(JSON.parse(raw));
  } catch (err) {
    console.error("Explain-frame error:", err);
    return NextResponse.json(
      { explanation: "Failed to explain frame" },
      { status: 500 }
    );
  }
}
