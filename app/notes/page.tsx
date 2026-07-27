"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { addHistoryItem } from "@/lib/history";

export default function NotesPage() {
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState("Medium");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState("English");

  useEffect(() => {
    const saved = localStorage.getItem("brainbuddy_language");
    if (saved) {
      setActiveLanguage(saved);
    }
  }, []);

  async function generateNotes() {
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    setLoading(true);
    setNotes(`Generating notes in ${activeLanguage}...`);

    try {
      const langInstruction = activeLanguage && activeLanguage !== "English"
        ? `[Language Instruction: Write the study notes entirely in ${activeLanguage}]\n\n`
        : "";

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `${langInstruction}Generate study notes for topic: ${topic}, length: ${length}. Structure the notes clearly with an Introduction, Key Points, Advantages/Examples, and a Summary.`,
        }),
      });

      const data = await res.json();
      setNotes(data.answer || "No response received from the AI tutor.");
      addHistoryItem("Notes", `Generated Notes: ${topic}`, `Length: ${length} | Language: ${activeLanguage}`);
    } catch (error) {
      setNotes("Failed to generate notes. Please check that your AI server is running and configured correctly.");
    } finally {
      setLoading(false);
    }
  }

  function copyNotes() {
    navigator.clipboard.writeText(notes);
    alert("Notes copied successfully!");
  }
  
  function downloadNotes() {
    if (!notes) return;
    const element = document.createElement("a");
    const file = new Blob([notes], { type: "text/plain" });

    element.href = URL.createObjectURL(file);
    element.download = `${topic || "BrainBuddy-Notes"}.txt`;

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-gray-800">
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          ← Dashboard
        </Link>

        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">
            📚 Notes Generator
          </h1>
          <Link
            href="/settings"
            className="flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300 hover:bg-blue-500/20"
          >
            🌐 {activeLanguage}
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-8">

        {/* Input Card */}
        <div className="bg-[#13131A] rounded-2xl border border-gray-800 p-8">

          <h2 className="text-2xl font-bold mb-6">
            Generate Smart Notes
          </h2>

          <input
            type="text"
            placeholder={`Enter Topic (notes will be generated in ${activeLanguage})...`}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-4 rounded-xl bg-[#09090B] border border-gray-700 outline-none mb-5"
          />

          <select
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="w-full p-4 rounded-xl bg-[#09090B] border border-gray-700"
          >
            <option>Short</option>
            <option>Medium</option>
            <option>Detailed</option>
          </select>

          <button
            onClick={generateNotes}
            disabled={loading}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-4 rounded-xl text-lg font-semibold"
          >
            {loading ? "🤖 Generating..." : `🤖 Generate Notes (${activeLanguage})`}
          </button>

        </div>

        {/* Output */}

        {notes && (

          <div className="mt-8 bg-[#13131A] rounded-2xl border border-gray-800 p-8">

            <div className="flex justify-between items-center">

              <h2 className="text-2xl font-bold text-green-400">
                Generated Notes ({activeLanguage})
              </h2>

              <div className="flex gap-3">
                <button
                  onClick={copyNotes}
                  className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl"
                >
                  📋 Copy
                </button>
                <button
                  onClick={downloadNotes}
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl"
                >
                  📥 Download
                </button>
              </div>

            </div>

            <pre className="mt-6 whitespace-pre-wrap text-gray-300 leading-8">
              {notes}
            </pre>

          </div>

        )}

      </div>

    </main>
  );
}