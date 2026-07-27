import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function generateLocalPresentation(topic: string, slideCount: number = 8, style: string = "Professional") {
  const cleanTopic = topic.trim();
  const count = Math.max(3, Math.min(slideCount, 15));
  
  const slides = [];

  // Title Slide
  slides.push({
    slideNumber: 1,
    type: "title",
    title: cleanTopic,
    subtitle: `A Comprehensive ${style} Guide & Key Analysis`,
    speakerNotes: `Welcome everyone. Today we will explore ${cleanTopic} in detail, breaking down key concepts and actionable insights.`
  });

  // Topics template pool
  const topicSections = [
    {
      title: `Introduction to ${cleanTopic}`,
      bullets: [
        `Core definition and foundational principles of ${cleanTopic}`,
        `Historical background and modern significance`,
        `Primary objectives and overarching goals`,
        `Key stakeholders and target audience impact`
      ],
      speakerNotes: `Let's begin by defining ${cleanTopic} and understanding why it has become so critical today.`
    },
    {
      title: "Key Concepts & Architecture",
      bullets: [
        "Fundamental components and theoretical framework",
        "Primary methodologies and structural mechanisms",
        "Interconnected systems and data flow",
        "Essential terminology and industry standards"
      ],
      speakerNotes: "Now let's examine the core concepts and fundamental building blocks."
    },
    {
      title: "Real-World Applications & Uses",
      bullets: [
        "Practical implementation across key domains",
        "Case study insights and success metrics",
        "Efficiency improvements and performance gains",
        "Integration with existing workflows and tools"
      ],
      speakerNotes: "Here we look at practical, real-world examples and how this is applied in practice."
    },
    {
      title: "Key Advantages & Benefits",
      bullets: [
        "Enhanced productivity and streamlined operations",
        "Scalability and long-term adaptability",
        "Cost optimization and resource efficiency",
        "Improved accuracy and decision-making capabilities"
      ],
      speakerNotes: "The major advantages highlight why adopting this approach yields significant returns."
    },
    {
      title: "Challenges & Limitations",
      bullets: [
        "Current bottlenecks and technical constraints",
        "Security, compliance, and privacy considerations",
        "Resource allocation and initial setup complexity",
        "Risk mitigation strategies and best practices"
      ],
      speakerNotes: "It is equally important to acknowledge potential challenges and how to mitigate them."
    },
    {
      title: "Future Trends & Innovation",
      bullets: [
        "Emerging developments and technological evolution",
        "Next-generation tools and strategic roadmaps",
        "Long-term industry forecasts and market expansion",
        "Opportunities for growth and research"
      ],
      speakerNotes: "Looking ahead, these emerging trends will shape the future landscape of this field."
    },
    {
      title: "Strategic Recommendations",
      bullets: [
        "Step-by-step implementation roadmap",
        "Focus on continuous monitoring and evaluation",
        "Invest in knowledge sharing and team alignment",
        "Prioritize user experience and core value delivery"
      ],
      speakerNotes: "Here are actionable next steps for effectively leveraging these insights."
    },
    {
      title: "Summary & Core Takeaways",
      bullets: [
        `Clear understanding of ${cleanTopic} and its value`,
        "Balanced perspective on advantages and implementation challenges",
        "Actionable roadmap for immediate adoption",
        "Preparedness for future advancements and trends"
      ],
      speakerNotes: "To wrap up our discussion, let's review the main takeaways."
    }
  ];

  const middleCount = count - 2; // Subtract title and closing
  for (let i = 0; i < middleCount; i++) {
    const section = topicSections[i % topicSections.length];
    slides.push({
      slideNumber: i + 2,
      type: "content",
      title: section.title,
      bullets: section.bullets,
      speakerNotes: section.speakerNotes
    });
  }

  // Closing Slide
  slides.push({
    slideNumber: count,
    type: "closing",
    title: "Thank You",
    subtitle: "Questions & Open Discussion",
    speakerNotes: "Thank you for your time and attention. I am happy to take any questions or comments."
  });

  return {
    title: cleanTopic,
    theme: style,
    slides
  };
}

export async function POST(req: NextRequest) {
  try {
    const { topic, slideCount = 8, style = "Professional", language = "English" } = await req.json();

    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY || "";
    const geminiApiKey = process.env.GEMINI_API_KEY || "";

    const langInstruction =
      language && language !== "English"
        ? `IMPORTANT: Generate ALL content (titles, bullet points, speaker notes) in ${language} language.`
        : "";

    const prompt = `You are an expert presentation designer. Create a ${style} presentation about: "${topic}".
${langInstruction}

Generate exactly ${slideCount} slides. Return ONLY a valid JSON object with NO markdown code fences, NO extra text, NO explanation — just raw JSON.

Use this exact format:
{
  "title": "Presentation Title Here",
  "theme": "${style}",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "title": "Presentation Title Here",
      "subtitle": "A brief subtitle or tagline",
      "speakerNotes": "Opening remarks for this slide"
    },
    {
      "slideNumber": 2,
      "type": "content",
      "title": "First Topic Title",
      "bullets": ["Key point one", "Key point two", "Key point three", "Key point four"],
      "speakerNotes": "Speaker notes for slide 2"
    },
    {
      "slideNumber": ${slideCount},
      "type": "closing",
      "title": "Thank You",
      "subtitle": "Questions & Discussion",
      "speakerNotes": "Closing remarks and next steps"
    }
  ]
}

Rules:
- Slide 1 MUST have type "title" with title and subtitle
- Last slide MUST have type "closing" with title and subtitle
- All middle slides MUST have type "content" with title and bullets array (3-5 items each)
- Bullets must be concise, informative phrases — not full sentences
- Speaker notes should be 1-2 sentences
- Make content educational, comprehensive, and insightful
- Do NOT wrap the JSON in any markdown code block`;

    let jsonText = "";

    // 1. Try Groq (llama-3.3-70b-versatile) via fetch
    if (groqApiKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional presentation designer. You respond ONLY with valid raw JSON — no markdown, no code fences, no extra text. Your JSON must be parseable by JSON.parse().",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          jsonText = data.choices?.[0]?.message?.content?.trim() || "";
        } else {
          console.warn("Groq 70b returned non-ok status:", groqRes.status);
        }
      } catch (groqErr) {
        console.error("Groq 70b failed:", groqErr);
      }

      // 2. Try Groq (llama-3.1-8b-instant) if 70b didn't return text
      if (!jsonText) {
        try {
          const groqRes2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "system",
                  content: "You are a presentation designer. Respond ONLY with valid raw JSON, no markdown or code fences.",
                },
                { role: "user", content: prompt },
              ],
              temperature: 0.7,
              max_tokens: 3500,
            }),
          });

          if (groqRes2.ok) {
            const data2 = await groqRes2.json();
            jsonText = data2.choices?.[0]?.message?.content?.trim() || "";
          }
        } catch (groqErr2) {
          console.error("Groq 8b failed:", groqErr2);
        }
      }
    }

    // 3. Fallback to Gemini if Groq failed
    if (!jsonText && geminiApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const result = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });
        jsonText = result.text?.trim() || "";
      } catch (geminiErr) {
        console.error("Gemini fallback failed:", geminiErr);
      }
    }

    // Process and parse JSON text if received
    if (jsonText) {
      jsonText = jsonText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();

      const jsonStart = jsonText.indexOf("{");
      const jsonEnd = jsonText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
      }

      try {
        const presentation = JSON.parse(jsonText);
        if (presentation && Array.isArray(presentation.slides) && presentation.slides.length > 0) {
          return NextResponse.json({ presentation });
        }
      } catch (parseErr) {
        console.error("JSON parse failed, switching to local generator:", parseErr);
      }
    }

    // 4. Ultimate Local Fallback Generator (Always guarantees a working presentation)
    console.log("Using local presentation generator fallback for topic:", topic);
    const localPresentation = generateLocalPresentation(topic, slideCount, style);
    return NextResponse.json({ presentation: localPresentation });

  } catch (err: unknown) {
    console.error("Presentation API error:", err);
    // Even on uncaught error, fallback to local generator to avoid breaking user experience
    const fallback = generateLocalPresentation("Presentation", 8, "Professional");
    return NextResponse.json({ presentation: fallback });
  }
}
