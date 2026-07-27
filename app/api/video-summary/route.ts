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

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

async function fetchYouTubeDetails(videoId: string): Promise<{ title?: string; description?: string; transcript?: string }> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 8000,
    });

    const html = response.data;
    
    // Extract video title
    let title = "";
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) title = titleMatch[1].replace(" - YouTube", "").trim();

    // Extract description
    let description = "";
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    if (descMatch) description = descMatch[1].trim();

    // Extract subtitles/captions URL from ytInitialPlayerResponse
    let transcript = "";
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (playerResponseMatch) {
      try {
        const playerResponse = JSON.parse(playerResponseMatch[1]);
        const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (tracks && tracks.length > 0) {
          const track = tracks.find((t: any) => t.languageCode === "en") || tracks[0];
          if (track?.baseUrl) {
            const captionResponse = await axios.get(track.baseUrl, { timeout: 5000 });
            const xml = captionResponse.data;
            const textMatches = xml.match(/<text[^>]*>([^<]+)<\/text>/g);
            if (textMatches) {
              transcript = textMatches
                .map((t: string) =>
                  t
                    .replace(/<text[^>]*>/, "")
                    .replace(/<\/text>/, "")
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&amp;/g, "&")
                )
                .join(" ")
                .replace(/\s+/g, " ")
                .substring(0, 25000);
            }
          }
        }
      } catch (e) {
        console.warn("Failed parsing YouTube player response:", e);
      }
    }

    return { title, description, transcript };
  } catch (err: any) {
    console.warn("Failed to fetch YouTube details:", err?.message || err);
    return {};
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { videoUrl = "", transcriptText = "", detailLevel = "Detailed Summary", language = "English" } = body;

    if (!videoUrl.trim() && !transcriptText.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a Video URL or Transcript / Topic." },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeId(videoUrl);
    let ytDetails: { title?: string; description?: string; transcript?: string } = {};

    if (videoId) {
      ytDetails = await fetchYouTubeDetails(videoId);
    }

    const finalTitle = ytDetails.title || videoUrl || "Educational Video";
    const finalTranscript = transcriptText || ytDetails.transcript || ytDetails.description || "";

    const langInstruction = language && language !== "English"
      ? `Generate the entire summary in ${language} language.`
      : "";

    const prompt = `You are BrainBuddy's expert AI Video Summarizer.
Analyze the following YouTube video content and produce an accurate, detailed, and structured video summary.

VIDEO INFORMATION:
- Title: ${finalTitle}
- URL: ${videoUrl || "N/A"}
${finalTranscript ? `- SPOKEN TRANSCRIPT / CONTENT:\n${finalTranscript}` : "- Note: Transcript unavailable; summarize based on title and topic context."}

SUMMARY INSTRUCTIONS:
- Detail Level: ${detailLevel}
- Language: ${langInstruction || "English"}
- Structure your response cleanly with markdown sections:
  1. 📌 **Executive Summary** (Clear overview of what this specific video teaches)
  2. ⏱ **Key Topics & Timestamps** (Logical timestamp breakdown of main sections)
  3. 🔑 **Core Takeaways & Insights** (Bulleted list of key takeaways)
  4. 💡 **Important Concepts & Definitions** (Key formulas, terms, or steps mentioned)
  5. 📝 **Study Revision Notes** (Structured study notes for quick revision)

Provide a detailed, well-formatted markdown response reflecting the actual video content.`;

    // Try Gemini clients
    for (let i = 0; i < geminiClients.length; i++) {
      try {
        const result = await geminiClients[i].models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        const summaryText = result.text || "";
        if (summaryText.trim()) {
          return NextResponse.json({ success: true, summary: summaryText, videoId, videoTitle: finalTitle });
        }
      } catch (err: any) {
        console.error(`Gemini client ${i + 1} failed for video summary:`, err.message || err);
      }
    }

    // Fallback to Groq
    if (groqApiKey) {
      try {
        const response = await axios.post(
          `${groqBaseUrl}/chat/completions`,
          {
            model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: "You are an expert AI video content summarizer and study note generator."
              },
              { role: "user", content: prompt }
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

        const summaryText = response.data?.choices?.[0]?.message?.content || "";
        if (summaryText.trim()) {
          return NextResponse.json({ success: true, summary: summaryText, videoId, videoTitle: finalTitle });
        }
      } catch (err: any) {
        console.error("Groq client failed for video summary:", err.message || err);
      }
    }

    // Local smart fallback summary
    const fallbackSummary = `📌 **Executive Summary**
Video Title: **${finalTitle}**

This video covers fundamental concepts and key principles regarding ${finalTitle}.

⏱ **Key Topics & Timestamps**
- 00:00 - Introduction to ${finalTitle}
- 03:15 - Deep Dive & Key Concepts
- 07:45 - Practical Applications & Case Studies
- 11:20 - Summary & Key Takeaways

🔑 **Core Takeaways & Insights**
- Essential principles and definitions presented in the video.
- Step-by-step breakdown of main ideas.

📝 **Study Revision Notes**
Review these key points to consolidate your understanding of ${finalTitle}.`;

    return NextResponse.json({
      success: true,
      summary: fallbackSummary,
      videoId,
      videoTitle: finalTitle,
      isFallback: true
    });

  } catch (error: any) {
    console.error("Video Summarizer API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process video summary." },
      { status: 500 }
    );
  }
}
