"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [language, setLanguage] = useState("English");
  const [testPrompt, setTestPrompt] = useState("");
  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("brainbuddy_language");
    if (saved) {
      setLanguage(saved);
    }
  }, []);

  function saveLanguage(lang: string) {
    setLanguage(lang);
    localStorage.setItem("brainbuddy_language", lang);
  }

  async function testLanguageResponse() {
    const query = testPrompt.trim() || "Explain how learning works";
    setLoading(true);
    setTestResult(`Asking in ${language}...`);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `[Language Instruction: Respond entirely in ${language}]\n\n${query}`,
        }),
      });

      const data = await res.json();
      setTestResult(data.answer || "No response received.");
    } catch (e) {
      setTestResult("Error communicating with AI tutor.");
    } finally {
      setLoading(false);
    }
  }

  const languages = [
    { name: "English", flag: "🇬🇧" },
    { name: "Hindi", flag: "🇮🇳" },
    { name: "Marathi", flag: "🇮🇳" },
    { name: "Gujarati", flag: "🇮🇳" },
    { name: "Tamil", flag: "🇮🇳" },
    { name: "Telugu", flag: "🇮🇳" },
    { name: "Kannada", flag: "🇮🇳" },
    { name: "Malayalam", flag: "🇮🇳" },
    { name: "Punjabi", flag: "🇮🇳" },
    { name: "Bengali", flag: "🇮🇳" },
    { name: "Spanish", flag: "🇪🇸" },
    { name: "French", flag: "🇫🇷" },
    { name: "German", flag: "🇩🇪" },
    { name: "Japanese", flag: "🇯🇵" },
    { name: "Chinese", flag: "🇨🇳" },
    { name: "Korean", flag: "🇰🇷" },
  ];

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-gray-800">
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          ← Dashboard
        </Link>

        <h1 className="text-3xl font-bold">🌐 Multi Language Settings</h1>
      </nav>

      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-[#13131A] rounded-2xl border border-gray-800 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Choose AI Response Language</h2>
            <p className="text-sm text-gray-400 mt-1">
              Select your preferred language. All AI features (AI Tutor, Notes Generator, Quizzes, PDF Chat) will answer in this language!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {languages.map((lang) => (
              <button
                key={lang.name}
                onClick={() => saveLanguage(lang.name)}
                className={`p-4 rounded-2xl border transition flex items-center justify-between font-medium ${
                  language === lang.name
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30"
                    : "bg-[#09090B] border-gray-700 text-gray-300 hover:border-blue-500 hover:text-white"
                }`}
              >
                <span>{lang.name}</span>
                <span className="text-lg">{lang.flag}</span>
              </button>
            ))}
          </div>

          {/* Current Selection Confirmation */}
          <div className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-300 font-semibold">Active App Language</span>
              <h3 className="text-2xl font-bold text-white mt-1">
                🌍 {language}
              </h3>
              <p className="text-xs text-gray-300 mt-1">
                AI Tutor, Notes, Quizzes and Assistants will automatically answer in <strong>{language}</strong>.
              </p>
            </div>

            <Link
              href="/ai-tutor"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition text-center"
            >
              Try in AI Tutor →
            </Link>
          </div>

          {/* Interactive Test Panel */}
          <div className="mt-8 rounded-2xl border border-gray-800 bg-[#09090B] p-6">
            <h3 className="text-lg font-bold text-gray-200 mb-2">🧪 Test Language Response</h3>
            <p className="text-xs text-gray-400 mb-4">
              Type a sample question below to test how BrainBuddy responds in <strong>{language}</strong>:
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder={`Ask a question to test ${language}...`}
                className="flex-1 rounded-xl border border-gray-700 bg-[#13131A] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
              <button
                onClick={testLanguageResponse}
                disabled={loading}
                className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
              >
                {loading ? "Testing..." : `Test in ${language}`}
              </button>
            </div>

            {testResult && (
              <div className="mt-4 rounded-xl border border-gray-800 bg-[#13131A] p-4 text-sm text-gray-200 whitespace-pre-wrap">
                {testResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}