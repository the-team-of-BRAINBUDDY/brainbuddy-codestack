
import { NextResponse } from "next/server";
import { fetchTranscript } from "youtube-transcript";

export const runtime = "nodejs";
export const maxDuration = 60;

type TranscriptSegment = {
  text: string;
  offset?: number;
  duration?: number;
  lang?: string;
};

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    let id: string | null = null;

    if (host === "youtu.be") {
      id = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      id =
        parsed.searchParams.get("v") ??
        parsed.pathname.match(
          /\/(?:live|embed|shorts|v)\/([a-zA-Z0-9_-]{11})/
        )?.[1] ??
        null;
    }

    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

async function fetchYouTubeTitle(videoId: string): Promise<string> {
  try {
    const url = new URL("https://www.youtube.com/oembed");
    url.searchParams.set(
      "url",
      `https://www.youtube.com/watch?v=${videoId}`
    );
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    if (!response.ok) return "YouTube Video";

    const data = await response.json();
    return typeof data.title === "string"
      ? data.title
      : "YouTube Video";
  } catch {
    return "YouTube Video";
  }
}

async function fetchYouTubeDetails(videoId: string) {
  const segments: TranscriptSegment[] = await fetchTranscript(videoId);

  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error("YouTube returned an empty transcript.");
  }

  const validSegments = segments.filter(
    (segment) =>
      typeof segment.text === "string" &&
      segment.text.trim().length > 0
  );

  const transcript = validSegments
    .map((segment) => segment.text.trim())
    .join(" ")
    .trim();

  if (!transcript) {
    throw new Error("The retrieved transcript contains no readable text.");
  }

  const transcriptWithTimestamps = validSegments
    .map((segment) => {
      const time =
        typeof segment.offset === "number"
          ? `[${formatTime(segment.offset)}] `
          : "";

      return `${time}${segment.text.trim()}`;
    })
    .join("\n");

  const transcriptLanguage =
    validSegments.find((segment) => segment.lang)?.lang ?? "unknown";

  const title = await fetchYouTubeTitle(videoId);

  console.log(
    `[Video Summary] Retrieved ${validSegments.length} transcript segments.`
  );
  console.log(
    `[Video Summary] Transcript length: ${transcript.length} characters.`
  );
  console.log(`[Video Summary] Transcript language: ${transcriptLanguage}`);

  return {
    title,
    transcript,
    transcriptWithTimestamps,
    transcriptLanguage,
    segmentCount: validSegments.length,
  };
}

function buildPrompt(
  transcript: string,
  detailLevel: string,
  language: string,
  videoTitle: string
): string {
  const detailInstructions: Record<string, string> = {
    short: "Give a concise summary with the most important points.",
    medium:
      "Give a balanced, detailed summary with explanations and important points.",
    detailed:
      "Give a comprehensive, well-organized summary explaining the major concepts, examples, definitions, and conclusions.",
  };

  const detailInstruction =
    detailInstructions[detailLevel.toLowerCase()] ??
    detailInstructions.medium;

  return `
You are BrainBuddy, an accurate educational video summarization assistant.

VIDEO TITLE:
${videoTitle}

REQUESTED SUMMARY LANGUAGE:
${language}

DETAIL LEVEL:
${detailInstruction}

SOURCE TRANSCRIPT:
The transcript below is the source of truth. It may be in a different
language from the requested summary language.

${transcript}

INSTRUCTIONS:
1. Summarize only information supported by the supplied transcript.
2. Write the summary in the requested language.
3. Translate concepts when necessary, but preserve their meaning.
4. Explain technical terms in simple language where appropriate.
5. Include the main topic, important concepts, examples, and conclusions
   only when they are actually discussed in the transcript.
6. Include a key-points list and useful revision notes.
7. Use timestamps only when the transcript contains timestamps in [MM:SS]
   format. Copy those timestamps accurately.
8. Never invent timestamps, quotations, examples, facts, or lecture topics.
9. If a portion of the transcript is unclear, say so instead of guessing.
10. Do not claim the speaker said something that is absent from the transcript.

FORMAT THE RESPONSE IN MARKDOWN:

# Video Summary
A clear overview of the actual lecture.

# Main Concepts
Explain the important concepts discussed.

# Key Points
List the most important facts and ideas.

# Important Topics and Timestamps
Include only topics supported by the timestamped transcript.
If timestamps are unavailable, explain that exact timestamps could not
be determined. Do not make them up.

# Revision Notes
Provide useful study notes based on the transcript.

# Conclusion
Summarize the lecture's actual conclusion, if one is present.
If no conclusion is evident, say that the transcript does not contain
a clear concluding section.

Return only the summary. Do not describe these instructions.
`;
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      }),
      signal: AbortSignal.timeout(55000),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "[Video Summary] Gemini error:",
      response.status,
      data?.error?.message ?? "Unknown Gemini error"
    );

    throw new Error(
      data?.error?.message || `Gemini request failed (${response.status}).`
    );
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty summary.");
  }

  return text;
}

async function generateWithGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const model =
    process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an accurate educational summarization assistant. Never invent information absent from the supplied transcript.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 6000,
      }),
      signal: AbortSignal.timeout(55000),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "[Video Summary] Groq error:",
      response.status,
      data?.error?.message ?? "Unknown Groq error"
    );

    throw new Error(
      data?.error?.message || `Groq request failed (${response.status}).`
    );
  }

  const text = data?.choices?.[0]?.message?.content?.trim();

  if (typeof text !== "string" || !text) {
    throw new Error("Groq returned an empty summary.");
  }

  return text;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const videoUrl =
      typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";

    const transcriptText =
      typeof body.transcriptText === "string"
        ? body.transcriptText.trim()
        : "";

    const detailLevel =
      typeof body.detailLevel === "string" ? body.detailLevel : "medium";

    const requestedLanguage =
      typeof body.language === "string" && body.language.trim()
        ? body.language.trim()
        : "English";

    const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;

    if (!videoId && !transcriptText) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please provide a valid YouTube URL or paste the video transcript.",
        },
        { status: 400 }
      );
    }

    let title = "Pasted Transcript";
    let transcript = transcriptText;
    let transcriptWithTimestamps = transcriptText;
    let transcriptLanguage = "user-provided";
    let segmentCount = 0;

    if (videoId) {
      title = await fetchYouTubeTitle(videoId);
    }

    // Prefer a transcript explicitly provided by the user.
    // Otherwise, retrieve the actual captions from YouTube.
    if (!transcript && videoId) {
      try {
        const details = await fetchYouTubeDetails(videoId);

        title = details.title;
        transcript = details.transcript;
        transcriptWithTimestamps = details.transcriptWithTimestamps;
        transcriptLanguage = details.transcriptLanguage;
        segmentCount = details.segmentCount;
      } catch (error) {
        console.error(
          "[Video Summary] Could not retrieve YouTube transcript:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            videoId,
            videoTitle: title,
            transcriptAvailable: false,
            error:
              "BrainBuddy could not retrieve captions/transcript for this video. No summary was generated because doing so could produce incorrect content. Try again later, enable captions if available, or paste the video's transcript into the transcript box.",
          },
          { status: 422 }
        );
      }
    }

    if (!transcript.trim()) {
      return NextResponse.json(
        {
          success: false,
          transcriptAvailable: false,
          error: "The supplied transcript is empty.",
        },
        { status: 422 }
      );
    }

    // Keep the prompt within practical model input limits.
    const MAX_TRANSCRIPT_CHARACTERS = 60000;
    const sourceText = transcriptWithTimestamps.slice(
      0,
      MAX_TRANSCRIPT_CHARACTERS
    );

    const prompt = buildPrompt(
      sourceText,
      detailLevel,
      requestedLanguage,
      title
    );

    let summary: string;
    let provider: "Gemini" | "Groq";

    try {
      summary = await generateWithGemini(prompt);
      provider = "Gemini";
    } catch (geminiError) {
      console.error(
        "[Video Summary] Gemini failed; trying Groq:",
        geminiError
      );

      try {
        summary = await generateWithGroq(prompt);
        provider = "Groq";
      } catch (groqError) {
        console.error("[Video Summary] Groq also failed:", groqError);

        return NextResponse.json(
          {
            success: false,
            videoId,
            videoTitle: title,
            transcriptAvailable: true,
            error:
              "The actual transcript was retrieved, but both AI summary providers failed. Check your Gemini/Groq API keys and model configuration.",
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      videoId,
      videoTitle: title,
      summary,
      transcriptAvailable: true,
      transcriptLanguage,
      transcriptSegmentCount: segmentCount,
      transcriptCharacters: transcript.length,
      transcriptTruncated:
        transcriptWithTimestamps.length > MAX_TRANSCRIPT_CHARACTERS,
      provider,
      requestedLanguage,
    });
  } catch (error) {
    console.error("[Video Summary] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while generating the video summary.",
      },
      { status: 500 }
    );
  }
}
