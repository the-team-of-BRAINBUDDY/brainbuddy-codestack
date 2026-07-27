"use client";

import { useState } from "react";

type FeatureAIHelperProps = {
  title?: string;
  placeholder?: string;
  helperText?: string;
  promptPrefix?: string;
};

export default function FeatureAIHelper({
  title = "AI Help",
  placeholder = "Ask for help with this feature...",
  helperText = "Get quick suggestions, explanations, or next steps.",
  promptPrefix = "",
}: FeatureAIHelperProps) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!input.trim()) return;

    setLoading(true);
    setResponse("Thinking...");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `${promptPrefix}${input}`.trim(),
        }),
      });

      const data = await res.json();
      setResponse(data.answer || "The AI service did not return a response.");
    } catch {
      setResponse("Unable to reach the AI service right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 bg-[#13131A] rounded-2xl border border-gray-800 p-6">
      <h3 className="text-xl font-bold text-blue-400">{title}</h3>
      <p className="text-sm text-gray-400 mt-2">{helperText}</p>

      <div className="mt-4 flex flex-col gap-3">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl bg-[#09090B] border border-gray-700 p-4 outline-none resize-none text-gray-200"
        />

        <button
          onClick={handleAsk}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </div>

      {response && (
        <div className="mt-4 rounded-xl border border-gray-700 bg-[#09090B] p-4 text-sm text-gray-300 whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  );
}
