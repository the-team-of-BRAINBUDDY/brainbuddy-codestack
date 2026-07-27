"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { addHistoryItem } from "@/lib/history";

export default function VideoSummarizerPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [detailLevel, setDetailLevel] = useState("Detailed Summary");
  const [summary, setSummary] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState("English");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("brainbuddy_language");
    if (saved) {
      setActiveLanguage(saved);
    }
  }, []);

  function extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    const id = extractYouTubeId(url);
    setVideoId(id);
  };

  const sampleVideos = [
    { title: "Quantum Physics in 10 Minutes", url: "https://www.youtube.com/watch?v=QuR969uMICM" },
    { title: "Machine Learning Basics", url: "https://www.youtube.com/watch?v=ukzFI9rgwfU" },
    { title: "How Neural Networks Work", url: "https://www.youtube.com/watch?v=aircAruvnKk" },
  ];

  async function handleSummarize() {
    if (!videoUrl.trim() && !transcriptText.trim()) {
      alert("Please enter a Video URL or Transcript / Topic.");
      return;
    }

    setLoading(true);
    setSummary("");
    setCopied(false);

    try {
      const res = await fetch("/api/video-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          transcriptText,
          detailLevel,
          language: activeLanguage,
        }),
      });

      const data = await res.json();

      if (data.success && data.summary) {
        setSummary(data.summary);
        if (data.videoId) setVideoId(data.videoId);

        addHistoryItem(
          "General",
          `Video Summary: ${videoUrl.substring(0, 40) || "Video Content"}`,
          `Level: ${detailLevel} | Language: ${activeLanguage}`
        );
      } else {
        alert(data.error || "Failed to generate video summary.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while connecting to the video summarizer server.");
    } finally {
      setLoading(false);
    }
  }

  function copySummary() {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadSummary() {
    if (!summary) return;
    const element = document.createElement("a");
    const file = new Blob([summary], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `BrainBuddy-Video-Summary.txt`;
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
          <h1 className="text-3xl font-bold">🎬 AI Video Summarizer</h1>
          <Link
            href="/settings"
            className="flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300 hover:bg-blue-500/20"
          >
            🌐 {activeLanguage}
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#13131A] rounded-2xl border border-gray-800 p-6 space-y-5">
              <h2 className="text-xl font-bold text-white">Enter Video Details</h2>

              <div>
                <label className="block text-xs text-gray-400 mb-2">YouTube / Video URL</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-4 rounded-xl bg-[#09090B] border border-gray-700 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Optional Transcript or Custom Topic</label>
                <textarea
                  rows={3}
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Paste transcript or notes here..."
                  className="w-full p-4 rounded-xl bg-[#09090B] border border-gray-700 text-sm text-white outline-none resize-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Summary Detail Level</label>
                <select
                  value={detailLevel}
                  onChange={(e) => setDetailLevel(e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#09090B] border border-gray-700 text-sm text-white outline-none"
                >
                  <option>Detailed Summary</option>
                  <option>Quick Key Highlights</option>
                  <option>Study Flashcards & Revision</option>
                </select>
              </div>

              <button
                onClick={handleSummarize}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Summarizing in {activeLanguage}...
                  </>
                ) : (
                  <>🎬 Generate AI Summary ({activeLanguage})</>
                )}
              </button>
            </div>

            {/* Quick Sample Videos */}
            <div className="bg-[#13131A] rounded-2xl border border-gray-800 p-5 space-y-3">
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Try Sample Educational Videos</p>
              {sampleVideos.map((v) => (
                <button
                  key={v.title}
                  onClick={() => handleUrlChange(v.url)}
                  className="w-full text-left p-3 rounded-xl bg-[#09090B] border border-gray-800 hover:border-blue-500 text-xs text-gray-300 hover:text-white transition flex items-center justify-between"
                >
                  <span>📺 {v.title}</span>
                  <span className="text-blue-400">Select →</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Video Preview & Summary Output */}
          <div className="lg:col-span-7 space-y-6">
            {/* Embedded Video Player if YouTube URL */}
            {videoId && (
              <div className="overflow-hidden rounded-2xl border border-gray-800 bg-[#13131A] aspect-video">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Summary Output */}
            <div className="bg-[#13131A] rounded-2xl border border-gray-800 p-6 min-h-[400px] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-800">
                  <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
                    <span>🎬 Video AI Summary</span>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-normal">
                      {activeLanguage}
                    </span>
                  </h2>

                  {summary && (
                    <div className="flex gap-2">
                      <button
                        onClick={copySummary}
                        className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-200"
                      >
                        {copied ? "✅ Copied!" : "📋 Copy"}
                      </button>
                      <button
                        onClick={downloadSummary}
                        className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      >
                        📥 Download
                      </button>
                    </div>
                  )}
                </div>

                {!summary && !loading && (
                  <div className="py-20 text-center text-gray-500 space-y-2">
                    <p className="text-4xl">🎬</p>
                    <p className="text-base font-medium text-gray-400">No Video Summary Generated Yet</p>
                    <p className="text-xs max-w-sm mx-auto">
                      Paste a YouTube URL or topic on the left and click <strong>Generate AI Summary</strong>!
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="py-20 text-center text-gray-400 space-y-3">
                    <div className="inline-block animate-bounce text-3xl">🤖</div>
                    <p className="text-sm font-medium">BrainBuddy AI is analyzing the video content...</p>
                    <p className="text-xs text-gray-500">Generating chapters, key takeaways, and revision notes in {activeLanguage}.</p>
                  </div>
                )}

                {summary && (
                  <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-4">
                    {summary}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
