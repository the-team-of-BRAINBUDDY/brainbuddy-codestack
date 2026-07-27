import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import OpenAI from "openai";
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

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const grokApiKey = process.env.GROK_API_KEY || "";
const grokBaseUrl = process.env.GROK_BASE_URL || "https://api.x.ai/v1";
const groqApiKey = process.env.GROQ_API_KEY || "";
const groqBaseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

function parseJsonAnswer(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isQuotaError(error: any) {
  const message = `${error?.message || ""} ${error?.status || ""}`.toLowerCase();

  return (
    error?.status === 429 ||
    error?.code === 429 ||
    error?.statusCode === 429 ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted")
  );
}

function isAuthError(error: any) {
  const message = `${error?.message || ""} ${error?.status || ""}`.toLowerCase();

  return (
    error?.status === 401 ||
    error?.status === 403 ||
    message.includes("api key") ||
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("invalid")
  );
}

function buildAnswer(text: string | string[] | undefined, fallback = "") {
  const normalizedText = typeof text === "string" ? text : (text || []).join(" ");
  const parsed = parseJsonAnswer(normalizedText);

  if (parsed && typeof parsed === "object") {
    return {
      answer: parsed.answer || parsed.explanation || normalizedText,
      diagram: parsed.diagram || null,
    };
  }

  return {
    answer: normalizedText || fallback,
    diagram: null,
  };
}

function solveSimpleEquation(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  const match = normalized.match(/([+-]?\d*)x\s*([+-])\s*(\d+)\s*=\s*(\d+)/i);

  if (!match) {
    return null;
  }

  const coefficientText = match[1] || "1";
  const coefficient = coefficientText === "-" ? -1 : Number(coefficientText);
  const operator = match[2];
  const constant = Number(match[3]);
  const result = Number(match[4]);
  const adjusted = operator === "+" ? result - constant : result + constant;
  const xValue = adjusted / coefficient;

  return `Solved locally: ${normalized}\n=> ${coefficient}x ${operator} ${constant} = ${result}\n=> ${coefficient}x = ${adjusted}\n=> x = ${xValue}`;
}

function buildLocalFallback(prompt: string, isDiagramPrompt = false) {
  const normalizedPrompt = (prompt || "").trim();
  const lowerPrompt = normalizedPrompt.toLowerCase();

  if (isDiagramPrompt || lowerPrompt.includes("diagram") || lowerPrompt.includes("flowchart")) {
    const title = normalizedPrompt || "study plan";
    const diagram = [
      "+----------------------+",
      `| ${title.slice(0, 20).padEnd(20)} |`,
      "+-----------+----------+",
      "            |",
      "            v",
      "      Learn / Review",
      "            |",
      "            v",
      "      Practice / Apply",
    ].join("\n");

    return {
      answer: "The AI service is unavailable right now, so here is a simple diagram outline you can use.",
      diagram,
    };
  }

  const equationSolution = solveSimpleEquation(normalizedPrompt);
  if (equationSolution) {
    return {
      answer: `The AI service is unavailable right now, but here is a local step-by-step solution.\n\n${equationSolution}`,
      diagram: null,
    };
  }

  if (lowerPrompt.includes("equation") || lowerPrompt.includes("solve") || lowerPrompt.includes("= ")) {
    return {
      answer: "The AI service is unavailable right now, but the equation can be solved step by step once the exact expression is shared clearly.",
      diagram: null,
    };
  }

  if (lowerPrompt.includes("explain") || lowerPrompt.includes("what is") || lowerPrompt.includes("what are") || lowerPrompt.includes("why")) {
    const topic = normalizedPrompt
      .replace(/^(explain|what is|what are|why does|why is|how does|how do|help me with|help me understand)\s+/i, "")
      .trim();

    return {
      answer: `The AI service is unavailable right now, but here is a clear study-style explanation.\n\n${topic ? `Topic: ${topic}` : "Topic: your question"}\n\n1. Start with a simple definition.\n2. Give one real-world example.\n3. Explain why it matters.\n4. End with a short memory tip.\n\nTry asking again with a more specific topic if you want a deeper explanation.`,
      diagram: null,
    };
  }

  if (lowerPrompt.includes("summarize") || lowerPrompt.includes("notes") || lowerPrompt.includes("study")) {
    return {
      answer: `The AI service is unavailable right now, but here is a helpful study summary structure.\n\n- Main idea\n- 3 key points\n- One example\n- One quick review question\n\nAsk again with the exact topic and I can turn this into a fuller note.`,
      diagram: null,
    };
  }

  if (lowerPrompt.includes("quiz") || lowerPrompt.includes("practice") || lowerPrompt.includes("test")) {
    return {
      answer: `The AI service is unavailable right now, but here is a simple practice prompt.\n\n1. Write 3 questions about the topic.\n2. Include one easy, one medium, and one hard question.\n3. Give the answer key at the end.`,
      diagram: null,
    };
  }

  const promptGuidance = normalizedPrompt
    ? `Here is a helpful response based on your prompt:\n\n${normalizedPrompt}\n\nTry breaking it into smaller steps, writing the exact equation or topic clearly, and then asking again for a deeper explanation.`
    : "Here is a helpful response based on your prompt. Try describing the topic, equation, or diagram more clearly and ask again for a deeper explanation.";

  return {
    answer: `The AI service is unavailable right now, but you can still continue using the feature.\n\n${promptGuidance}`,
    diagram: null,
  };
}

async function tryOpenAI(request: { instruction: string; userText: string; imageBase64?: string; mimeType: string }) {
  if (!openai) {
    throw new Error("OpenAI API key is not configured.");
  }

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: request.instruction,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: request.userText,
          },
          ...(request.imageBase64
            ? [
                {
                  type: "image_url" as const,
                  image_url: {
                    url: `data:${request.mimeType};base64,${request.imageBase64}`,
                  },
                },
              ]
            : []),
        ],
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content : (content || []).map((part: any) => part?.text || "").join("");

  return buildAnswer(text, "OpenAI returned no usable response.");
}

async function tryGrok(request: { instruction: string; userText: string; imageBase64?: string; mimeType: string }) {
  if (!grokApiKey) {
    throw new Error("Grok API key is not configured.");
  }

  const response = await axios.post(
    `${grokBaseUrl}/chat/completions`,
    {
      model: process.env.GROK_MODEL || "grok-2-1212",
      messages: [
        { role: "system", content: request.instruction },
        { role: "user", content: request.userText },
      ],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${grokApiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const content = response.data?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content : (content || []).join("");

  return buildAnswer(text, "Grok returned no usable response.");
}

async function tryGroq(request: { instruction: string; userText: string; imageBase64?: string; mimeType: string }) {
  if (!groqApiKey) {
    throw new Error("Groq API key is not configured.");
  }

  const response = await axios.post(
    `${groqBaseUrl}/chat/completions`,
    {
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: request.instruction },
        { role: "user", content: request.userText },
      ],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const content = response.data?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content : (content || []).join("");

  return buildAnswer(text, "Groq returned no usable response.");
}

async function tryGemini(
  request: { instruction: string; userText: string; imageBase64?: string; mimeType: string },
  client: GoogleGenAI,
  label: string,
) {
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    {
      text: `${request.instruction}\n\nUser request: ${request.userText}`,
    },
  ];

  if (request.imageBase64) {
    parts.push({
      inlineData: {
        mimeType: request.mimeType,
        data: request.imageBase64,
      },
    });
  }

  const result = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts }],
  });

  return buildAnswer(result.text || "", `${label} returned no usable response.`);
}

export async function POST(req: Request) {
  let promptText = "";
  let isDiagram = false;

  try {
    const { prompt, imageBase64, mimeType = "image/png", isDiagramPrompt = false } = await req.json();
    promptText = prompt || "";
    isDiagram = isDiagramPrompt;

    const instruction = isDiagramPrompt
      ? "You are BrainBuddy's whiteboard diagram generator. Create a simple ASCII diagram for the user's request. Return valid JSON with fields 'answer' and 'diagram'. The 'answer' should be a short explanation and the 'diagram' should contain only plain-text ASCII art with no markdown fences."
      : imageBase64
        ? "You are BrainBuddy's whiteboard assistant. Analyze the provided image of drawings, handwritten notes, equations, or diagrams. If the image contains a math equation, solve it step by step. If it contains a diagram, explain it clearly. If it contains handwriting or sketches, describe them precisely. Return a concise, helpful explanation."
        : "You are BrainBuddy's smart study companion. Answer the user's question clearly, explaining complex topics in simple terms and structured formats. If asked to generate notes, format them clearly with sections like Introduction, Key Points, Examples, and a Summary.";

    const userText = imageBase64
      ? `${instruction}\n\nUser request: ${prompt || "Analyze the whiteboard content."}`
      : prompt || "Explain the concept.";

    if (!openai && geminiClients.length === 0 && !grokApiKey && !groqApiKey) {
      return NextResponse.json(buildLocalFallback(promptText, isDiagram), { status: 200 });
    }

    const attempts = [] as Array<{ name: string; run: () => Promise<any> }>;

    if (openai) {
      attempts.push({
        name: "OpenAI",
        run: () => tryOpenAI({ instruction, userText, imageBase64, mimeType }),
      });
    }

    if (grokApiKey) {
      attempts.push({
        name: "Grok",
        run: () => tryGrok({ instruction, userText, imageBase64, mimeType }),
      });
    }

    if (groqApiKey) {
      attempts.push({
        name: "Groq",
        run: () => tryGroq({ instruction, userText, imageBase64, mimeType }),
      });
    }

    geminiClients.forEach((client, index) => {
      attempts.push({
        name: `Gemini${index === 0 ? "" : ` ${index + 1}`}`,
        run: () => tryGemini({ instruction, userText, imageBase64, mimeType }, client, `Gemini${index === 0 ? "" : ` ${index + 1}`}`),
      });
    });

    const errors: string[] = [];

    for (const attempt of attempts) {
      try {
        const result = await attempt.run();
        return NextResponse.json(result);
      } catch (error: any) {
        const reason = error?.message || "Unknown error";
        errors.push(`${attempt.name}: ${reason}`);

        if (attempts.length === 1) {
          throw error;
        }
      }
    }

    throw new Error(errors.join(" | "));
  } catch (error: any) {
    console.error("AI Error:", error);

    const quotaExceeded = isQuotaError(error);
    const authFailure = isAuthError(error);
    const fallbackResponse = buildLocalFallback(promptText, isDiagram);
    const rawMessage = error?.message || "Unknown AI error";
    const friendlyMessage = quotaExceeded
      ? `The selected AI provider is currently rate-limited. ${rawMessage}`
      : authFailure
        ? `The configured AI key appears to be invalid or unauthorized. ${rawMessage}`
        : rawMessage;

    return NextResponse.json(
      {
        answer: `${friendlyMessage}\n\n${fallbackResponse.answer}`,
        diagram: fallbackResponse.diagram,
        isQuotaError: quotaExceeded,
        isAuthError: authFailure,
        rawError: rawMessage,
      },
      { status: 200 }
    );
  }
}