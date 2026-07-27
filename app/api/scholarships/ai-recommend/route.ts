import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { SCHOLARSHIPS_DATA, calculateMatchScore, StudentProfile } from "@/lib/scholarshipsData";

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

const groqApiKey = process.env.GROQ_API_KEY || "";
const groqBaseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

export async function POST(req: Request) {
  try {
    const { prompt, studentProfile } = await req.json();

    // Prepare scholarship contextual data
    let profileContext = "";
    let matchedList = SCHOLARSHIPS_DATA;

    if (studentProfile) {
      const prof = studentProfile as StudentProfile;
      const matched = SCHOLARSHIPS_DATA.map((s) => calculateMatchScore(prof, s)).sort(
        (a, b) => b.matchScore - a.matchScore
      );
      matchedList = matched;
      profileContext = `
STUDENT PROFILE:
- Category: ${prof.category}
- Education Level: ${prof.educationLevel}
- Annual Family Income: ₹${prof.annualIncome.toLocaleString("en-IN")}
- Academic Score: ${prof.marksPercent}%
- Gender: ${prof.gender}
- State: ${prof.state || "All India"}

TOP MATCHED SCHOLARSHIPS IN OUR DATABASE:
${matched.slice(0, 5).map((m, i) => `${i + 1}. ${m.title} (${m.matchScore}% Match) - Amount: ${m.amount} - Deadline: ${m.deadline}`).join("\n")}
`;
    }

    const systemInstruction = `
You are BrainBuddy's Expert Student Scholarship Advisor & Counselor.
Your goal is to guide students on finding, applying for, and securing scholarships (Government, Private, Merit-based, Category-based like OBC, SC, ST, OPEN, EWS, Minority, PwD).

Provide structured, clear, empathetic, and highly actionable advice. Format your output with markdown headers, bullet points, and key highlights.

If student profile details are provided, refer directly to their category and top matched schemes.
Include:
1. Recommended Scholarships (with why they fit).
2. Key Documents required to prepare in advance.
3. Pro-tips for winning the scholarship application / essay / interview.
`;

    const userMessage = `${systemInstruction}\n\n${profileContext}\n\nUSER QUESTION/PROMPT: ${prompt || "Analyze my scholarship options and give me a step-by-step roadmap."}`;

    // Fallback response if AI APIs are offline
    const localFallbackAdvice = `
### 🎓 Scholarship Recommendations Roadmap

Based on your profile:
- **Category Focus:** Check schemes tailored for your category (${studentProfile?.category || "OBC / SC / ST / OPEN"}).
- **Top Government Portals:**
  1. **National Scholarship Portal (NSP)** - Central sector schemes, post-matric scholarships.
  2. **State Scholarship Portals** (e.g., MahaDBT, UP Scholarship, SSP Karnataka).
  3. **PM YASASVI Portal** for OBC, EBC & DNT students.

### 📋 Standard Documents Checklist:
1. Income Certificate (issued by Tehsildar / Gazetted Officer)
2. Category / Caste Certificate (OBC-NCL / SC / ST / EWS)
3. Previous Academic Year Marksheet & Passing Certificate
4. Aadhaar Card linked to Bank Account (DBT active)
5. Bonafide Student Certificate & Fee Receipt from Institution

### 💡 Winning Application Tips:
- Apply early before the server deadline rushes.
- Ensure your name on Aadhaar, Marksheet, and Bank account match exactly.
- Keep digital scans of documents under 200 KB in PDF format.
`;

    // Attempt AI calls
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [{ role: "user", content: userMessage }],
        });
        const text = response.choices[0]?.message?.content;
        if (text) return NextResponse.json({ advice: text });
      } catch (err) {
        console.error("OpenAI failed:", err);
      }
    }

    if (groqApiKey) {
      try {
        const response = await axios.post(
          `${groqBaseUrl}/chat/completions`,
          {
            model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
            messages: [{ role: "user", content: userMessage }],
          },
          { headers: { Authorization: `Bearer ${groqApiKey}` } }
        );
        const text = response.data?.choices?.[0]?.message?.content;
        if (text) return NextResponse.json({ advice: text });
      } catch (err) {
        console.error("Groq failed:", err);
      }
    }

    if (geminiClients.length > 0) {
      for (const client of geminiClients) {
        try {
          const result = await client.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
          });
          if (result.text) return NextResponse.json({ advice: result.text });
        } catch (err) {
          console.error("Gemini failed:", err);
        }
      }
    }

    return NextResponse.json({ advice: localFallbackAdvice });
  } catch (error: any) {
    console.error("Scholarship AI Route Error:", error);
    return NextResponse.json(
      { advice: "Unable to connect to AI Counselor. Please refer to the matched scholarships list below." },
      { status: 200 }
    );
  }
}
