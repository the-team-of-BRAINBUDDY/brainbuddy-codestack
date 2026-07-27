import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { NextResponse } from "next/server";

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

const geminiClients = getConfiguredGeminiClients();
const groqApiKey = process.env.GROQ_API_KEY || "";
const groqBaseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

function parseQuizJSON(text: string) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && typeof parsed === "object") {
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) {
          return parsed[key];
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function generateLocalFallbackQuiz(topic: string): any[] {
  return [
    {
      question: `What is the primary purpose of ${topic}?`,
      options: [
        `To manage core operations of ${topic}`,
        `To create visual layout styles only`,
        `To handle backend server configurations`,
        `None of the above`
      ],
      answer: `To manage core operations of ${topic}`
    },
    {
      question: `Which of the following is a key feature of ${topic}?`,
      options: [
        "Rapid performance optimization",
        "Legacy file compression only",
        "Synchronous layout design",
        "Manual instruction compiling"
      ],
      answer: "Rapid performance optimization"
    },
    {
      question: `Which industry standard pattern does ${topic} typically align with?`,
      options: [
        "Modern structured architectural guidelines",
        "Linear sequencing rules",
        "Procedural styling flowcards",
        "Static compilation constraints"
      ],
      answer: "Modern structured architectural guidelines"
    },
    {
      question: `Which language or tool environment is most closely associated with ${topic}?`,
      options: [
        "Standard web and compiler ecosystems",
        "Analog processing matrices",
        "Machine level assembly routines",
        "Basic file editing applications"
      ],
      answer: "Standard web and compiler ecosystems"
    },
    {
      question: `What is a common challenge when implementing ${topic}?`,
      options: [
        "Ensuring scalability and structure control",
        "Restricting memory access paths",
        "Reducing compiler execution overheads",
        "Optimizing display hardware channels"
      ],
      answer: "Ensuring scalability and structure control"
    },
    {
      question: `Which component plays the most vital role in ${topic}?`,
      options: [
        "The core processing framework and logic handler",
        "The peripheral network interface router",
        "The styling script layout repository",
        "The storage schema configuration database"
      ],
      answer: "The core processing framework and logic handler"
    },
    {
      question: `How does ${topic} handle data states by default?`,
      options: [
        "Dynamic updates based on runtime conditions",
        "Immutable write-once static values",
        "Externally synchronized serial files",
        "Direct hardware-level physical writing"
      ],
      answer: "Dynamic updates based on runtime conditions"
    },
    {
      question: `What is a major advantage of using ${topic}?`,
      options: [
        "Improved developer productivity and code structure",
        "Direct control over microchip instruction pipes",
        "Elimination of all network latency issues",
        "Automated graphic hardware accelerations"
      ],
      answer: "Improved developer productivity and code structure"
    },
    {
      question: `Which of these best describes a best practice for ${topic}?`,
      options: [
        "Maintain clean modular structure and separate concerns",
        "Store all data variables in a single global text file",
        "Avoid using compiler optimizations entirely",
        "Write logic rules directly inside presentation elements"
      ],
      answer: "Maintain clean modular structure and separate concerns"
    },
    {
      question: `How should testing be conducted for features using ${topic}?`,
      options: [
        "Using modular unit testing and integration verification",
        "By manually inspecting runtime console prints only",
        "By hosting the code on personal local storage",
        "None of the options are correct"
      ],
      answer: "Using modular unit testing and integration verification"
    }
  ];
}

async function tryGemini(prompt: string, client: GoogleGenAI, label: string) {
  const result = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = result.text || "";
  const parsed = parseQuizJSON(text);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${label} returned invalid JSON structure`);
  }
  return parsed;
}

async function tryGroq(prompt: string) {
  if (!groqApiKey) {
    throw new Error("Groq API key is not configured.");
  }

  const response = await axios.post(
    `${groqBaseUrl}/chat/completions`,
    {
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a quiz generator. Generate exactly 10 multiple-choice questions (MCQs) in JSON array format."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    },
    {
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = response.data?.choices?.[0]?.message?.content || "";
  const parsed = parseQuizJSON(content);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Groq returned invalid JSON structure");
  }
  return parsed;
}

export async function POST(req: Request) {
  let topic = "General Knowledge";
  let exclude: string[] = [];
  let language = "English";

  try {
    const body = await req.json();
    topic = body.topic || "General Knowledge";
    exclude = body.exclude || [];
    language = body.language || "English";

    const excludeText = exclude.length > 0
      ? `Do NOT include any questions that are similar to or duplicate the following questions:\n${exclude.map((q: string) => `- ${q}`).join("\n")}`
      : "";

    const langText = language && language !== "English"
      ? `Generate all questions, options, and answers entirely in the ${language} language.`
      : "";

    const prompt = `Generate a multiple-choice quiz of exactly 10 high-quality, conceptual, and interesting questions on the topic: "${topic}".
${langText}
Each question must have exactly 4 options and a correct answer which matches one of the options EXACTLY.

Return your response strictly as a JSON array of objects, where each object conforms to the following schema:
{
  "question": "question text",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "answer": "option text"
}

Do NOT wrap the response in markdown blocks like \`\`\`json. Return only the raw JSON array.
${excludeText}`;

    // Try Gemini clients first
    for (let i = 0; i < geminiClients.length; i++) {
      try {
        const result = await tryGemini(prompt, geminiClients[i], `Gemini ${i + 1}`);
        return NextResponse.json({ success: true, questions: result });
      } catch (err: any) {
        console.error(`Gemini client ${i + 1} failed:`, err.message || err);
      }
    }

    // Try Groq as fallback
    if (groqApiKey) {
      try {
        const result = await tryGroq(prompt);
        return NextResponse.json({ success: true, questions: result });
      } catch (err: any) {
        console.error("Groq client failed:", err.message || err);
      }
    }

    // If both failed or are not configured, return local fallback
    console.warn("Using local fallback generator for topic:", topic);
    const fallbackQuestions = generateLocalFallbackQuiz(topic);
    return NextResponse.json({
      success: true,
      questions: fallbackQuestions,
      isFallback: true,
      message: "AI services are currently offline. Loaded a mock quiz instead."
    });

  } catch (error: any) {
    console.error("Quiz API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
