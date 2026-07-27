import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import axios from "axios";

// Use the internal lib path to avoid pdf-parse index.js running test file code on import
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
    .flatMap((value) => (value || "").split(",").map((item) => item.trim()).filter(Boolean))
    .filter((value, index, array) => array.indexOf(value) === index);

  return apiKeys.map((apiKey) => new GoogleGenAI({ apiKey }));
}

async function tryGroq(prompt: string, pdfBase64: string | null) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error("Groq API key not configured");

  let pdfText = "";
  if (pdfBase64) {
    try {
      const buffer = Buffer.from(pdfBase64, "base64");
      const data = await pdfParse(buffer);
      pdfText = data.text || "";
    } catch (e) {
      console.error("Failed to parse PDF text:", e);
      pdfText = "[Unable to extract text from PDF]";
    }
  }

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a helpful study assistant. Analyze the provided PDF text and answer the user's question clearly." },
        { role: "user", content: `PDF Content:\n${pdfText.substring(0, 40000)}\n\nUser Question: ${prompt}` },
      ],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content received from Groq");
  return typeof content === "string" ? content : (content || []).join("");
}

export async function POST(req: Request) {
  try {
    const { prompt, pdfBase64 } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { answer: "Please provide a question about the PDF." },
        { status: 400 }
      );
    }

    const geminiClients = getConfiguredGeminiClients();
    const parts: any[] = [
      { text: `You are a helpful study assistant. Analyze the provided PDF document and answer the user's question clearly.\n\nUser Question: ${prompt}` }
    ];

    if (pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      });
    }

    const errors: string[] = [];
    let answer = "";

    // Try Gemini first
    for (let i = 0; i < geminiClients.length; i++) {
      const client = geminiClients[i];
      try {
        const result = await client.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: "user", parts }],
        });

        answer = result.text || "";
        if (answer) {
          return NextResponse.json({ answer });
        }
      } catch (error: any) {
        console.error(`PDF chat route error with Gemini key ${i}:`, error?.message || error);
        errors.push(error?.message || "Unknown error");
      }
    }

    // Fallback to Groq if all Gemini keys failed or none exist
    if (!answer && process.env.GROQ_API_KEY) {
      try {
        console.log("Falling back to Groq for PDF chat...");
        answer = await tryGroq(prompt, pdfBase64);
        return NextResponse.json({ answer });
      } catch (groqError: any) {
        console.error("Groq fallback error:", groqError?.message || groqError);
        errors.push(`Groq Error: ${groqError?.message}`);
      }
    }

    // If everything failed
    const allErrorsStr = errors.join("; ");
    let finalError = "The PDF chat backend encountered an error. Details: " + allErrorsStr;
    const allErrorsStrLower = allErrorsStr.toLowerCase();
    
    if (allErrorsStrLower.includes("quota") || allErrorsStrLower.includes("rate limit") || allErrorsStrLower.includes("429")) {
      finalError = "All AI service keys are currently rate-limited or quota exceeded. Please try again later.";
    }

    return NextResponse.json(
      { answer: finalError },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("PDF chat route final error:", error);
    return NextResponse.json(
      { answer: "The PDF chat backend encountered a critical error. Please try again." },
      { status: 500 }
    );
  }
}
