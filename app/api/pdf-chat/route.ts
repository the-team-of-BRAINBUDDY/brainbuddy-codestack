
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import axios from "axios";

const pdfParse = require("pdf-parse/lib/pdf-parse");

function getConfiguredGeminiClients() {
  const rawKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_ALT,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEYS,
  ];

  const apiKeys = rawKeys
    .flatMap((value) =>
      (value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
    .filter((key, index, array) => array.indexOf(key) === index);

  return apiKeys.map((apiKey) => new GoogleGenAI({ apiKey }));
}

function getErrorMessage(error: any): string {
  const apiMessage = error?.response?.data?.error?.message;
  const message =
    apiMessage ||
    error?.response?.data?.message ||
    error?.message ||
    "Unknown provider error";

  return String(message).slice(0, 1000);
}

async function extractPdfText(pdfBase64: string): Promise<string> {
  const cleanBase64 = pdfBase64.replace(
    /^data:application\/pdf;base64,/i,
    ""
  );

  const buffer = Buffer.from(cleanBase64, "base64");
  const data = await pdfParse(buffer);
  const text = (data.text || "").trim();

  if (!text) {
    throw new Error(
      "No selectable text was found. This PDF may be scanned or image-based."
    );
  }

  return text;
}

async function tryGroq(prompt: string, pdfBase64: string | null) {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  let pdfText = "";

  if (pdfBase64) {
    try {
      pdfText = await extractPdfText(pdfBase64);
    } catch (error: any) {
      throw new Error(
        `Could not extract readable text from the PDF: ${getErrorMessage(error)}`
      );
    }
  }

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  const response = await axios.post(
    `${process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"}/chat/completions`,
    {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are BrainBuddy, a helpful study assistant. Answer questions accurately using the supplied PDF content. Explain difficult topics in simple language. If no PDF content is supplied, answer the user's general question.",
        },
        {
          role: "user",
          content: `PDF Content:\n${pdfText.slice(0, 40000) || "[No PDF text supplied]"}\n\nUser Question: ${prompt}`,
        },
      ],
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  return typeof content === "string"
    ? content
    : JSON.stringify(content);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = body?.prompt;
    let pdfBase64: string | null = body?.pdfBase64 || null;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { answer: "Please enter a question about your PDF." },
        { status: 400 }
      );
    }

    if (pdfBase64 !== null && typeof pdfBase64 !== "string") {
      return NextResponse.json(
        {
          answer:
            "The uploaded PDF data is invalid. Please upload it again.",
        },
        { status: 400 }
      );
    }

    if (pdfBase64) {
      pdfBase64 = pdfBase64.replace(
        /^data:application\/pdf;base64,/i,
        ""
      );
    }

    const geminiClients = getConfiguredGeminiClients();
    const errors: string[] = [];

    const model =
      process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Try Gemini first.
    for (let i = 0; i < geminiClients.length; i++) {
      try {
        const parts: any[] = [
          {
            text:
              "You are BrainBuddy, a helpful study assistant. " +
              "Answer the user's question clearly, using the supplied PDF when available. " +
              "Explain difficult concepts in simple language.\n\n" +
              `User Question: ${prompt.trim()}`,
          },
        ];

        if (pdfBase64) {
          parts.push({
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          });
        }

        const result = await geminiClients[i].models.generateContent({
          model,
          contents: [{ role: "user", parts }],
        });

        const answer = result.text?.trim();

        if (answer) {
          return NextResponse.json({ answer });
        }

        errors.push(
          `Gemini key ${i + 1}: Empty response from ${model}.`
        );
      } catch (error: any) {
        const message = getErrorMessage(error);

        console.error(
          `PDF Chat Gemini attempt ${i + 1} failed:`,
          message
        );

        errors.push(`Gemini key ${i + 1}: ${message}`);
      }
    }

    if (geminiClients.length === 0) {
      errors.push("No Gemini API key is configured.");
    }

    // Try Groq if Gemini is unavailable.
    if (process.env.GROQ_API_KEY) {
      try {
        console.log("PDF Chat: trying Groq fallback.");

        const answer = await tryGroq(prompt.trim(), pdfBase64);

        return NextResponse.json({ answer });
      } catch (error: any) {
        const message = getErrorMessage(error);

        console.error("PDF Chat Groq fallback failed:", message);
        errors.push(`Groq: ${message}`);
      }
    } else {
      errors.push("GROQ_API_KEY is not configured.");
    }

    const details = errors.join(" | ");

    console.error("All PDF Chat providers failed:", details);

    return NextResponse.json(
      {
        answer:
          "PDF Chat could not generate an answer. Please check your API configuration and try again.\n\n" +
          details,
      },
      { status: 502 }
    );
  } catch (error: any) {
    const details = getErrorMessage(error);

    console.error("PDF Chat route error:", details);

    return NextResponse.json(
      {
        answer: `PDF Chat request failed: ${details}`,
      },
      { status: 500 }
    );
  }
}
