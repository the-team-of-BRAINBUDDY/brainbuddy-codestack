"use client";

import { KeyboardEvent, useState, useEffect } from "react";
import Link from "next/link";
import { addHistoryItem } from "@/lib/history";

type Message = {
  role: "user" | "ai";
  text: string;
};

const starterPrompts = [
  "Explain photosynthesis in simple terms",
  "Help me study for a math quiz",
  "Summarize this topic like I'm 15",
];

export default function AITutor() {
  const [question, setQuestion] = useState("");
  const [activeLanguage, setActiveLanguage] = useState("English");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hi! I’m BrainBuddy, your study companion. Ask me to explain a topic, quiz you, or help with homework.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("brainbuddy_language");
    if (saved) {
      setActiveLanguage(saved);
    }
  }, []);

  async function askAI(promptOverride?: string) {
    const text = (promptOverride ?? question).trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const finalPrompt = activeLanguage && activeLanguage !== "English"
        ? `[Language Instruction: Please respond entirely in ${activeLanguage}]\n\n${text}`
        : text;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: finalPrompt,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(errorText);

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: "The tutor is temporarily unavailable. Please try again in a moment.",
          },
        ]);

        return;
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.answer,
        },
      ]);

      addHistoryItem("AI Tutor", `Asked: "${text}"`, `Language: ${activeLanguage}`);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Unable to connect right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void askAI();
    }
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <div className="border-b border-gray-800 px-8 py-5 flex flex-wrap justify-between items-center gap-3">
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          ← Dashboard
        </Link>

        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">BrainBuddy AI Tutor</h1>
          <Link
            href="/settings"
            className="flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300 hover:bg-blue-500/20"
          >
            🌐 {activeLanguage}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-5 flex flex-wrap gap-3">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void askAI(prompt)}
              className="rounded-full border border-gray-700 bg-[#13131A] px-4 py-2 text-sm text-gray-300 hover:border-blue-500 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="h-[65vh] overflow-y-auto rounded-3xl border border-gray-800 bg-[#13131A] p-6">
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`mb-6 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xl rounded-2xl px-5 py-4 whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-600" : "bg-gray-800"}`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && <div className="text-gray-400">BrainBuddy is thinking in {activeLanguage}...</div>}
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row">
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask any question (answering in ${activeLanguage})...`}
            className="flex-1 rounded-2xl bg-[#13131A] border border-gray-700 p-5 outline-none resize-none"
          />

          <button
            onClick={() => void askAI()}
            disabled={loading}
            className="rounded-2xl bg-blue-600 px-8 font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </main>
  );
}