"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { addHistoryItem } from "@/lib/history";

interface Slide {
  slideNumber: number;
  type: "title" | "content" | "closing";
  title: string;
  subtitle?: string;
  bullets?: string[];
  speakerNotes?: string;
}

interface Presentation {
  title: string;
  theme: string;
  slides: Slide[];
}

const STYLES = ["Professional", "Academic", "Creative", "Minimal", "Corporate", "Startup"];
const SLIDE_COUNTS = [5, 6, 7, 8, 10, 12, 15];

const THEME_CONFIGS: Record<string, { bg: string; accent: string; card: string; text: string; sub: string }> = {
  Professional: { bg: "#0a0f1e", accent: "#6366f1", card: "rgba(99,102,241,0.08)", text: "#818cf8", sub: "#334155" },
  Academic:     { bg: "#05100a", accent: "#10b981", card: "rgba(16,185,129,0.08)",  text: "#6ee7b7", sub: "#1e3a2f" },
  Creative:     { bg: "#120a1e", accent: "#a855f7", card: "rgba(168,85,247,0.08)",  text: "#c084fc", sub: "#3b1f5e" },
  Minimal:      { bg: "#0d0d0d", accent: "#e5e7eb", card: "rgba(229,231,235,0.06)", text: "#9ca3af", sub: "#1f2937" },
  Corporate:    { bg: "#071020", accent: "#3b82f6", card: "rgba(59,130,246,0.08)",  text: "#60a5fa", sub: "#1e3a5f" },
  Startup:      { bg: "#150a07", accent: "#f97316", card: "rgba(249,115,22,0.08)",  text: "#fb923c", sub: "#431407" },
};

export default function PresentationPage() {
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(8);
  const [style, setStyle] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState("English");
  const [copied, setCopied] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lang = localStorage.getItem("brainbuddy_language");
    if (lang) setActiveLanguage(lang);
  }, []);

  const theme = THEME_CONFIGS[style] || THEME_CONFIGS.Professional;

  const generatePresentation = async () => {
    if (!topic.trim()) { setError("Please enter a topic."); return; }
    setLoading(true);
    setError("");
    setPresentation(null);
    setCurrentSlide(0);

    try {
      const res = await fetch("/api/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), slideCount, style, language: activeLanguage }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to generate");

      setPresentation(data.presentation);
      addHistoryItem(
        "Presentation",
        `Generated: "${data.presentation.title}"`,
        `${data.presentation.slides.length} slides · ${style} style`
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportAsText = () => {
    if (!presentation) return;
    const lines: string[] = [`# ${presentation.title}`, `Theme: ${presentation.theme}`, ""];
    presentation.slides.forEach((s) => {
      lines.push(`--- Slide ${s.slideNumber}: ${s.title} ---`);
      if (s.subtitle) lines.push(`  ${s.subtitle}`);
      if (s.bullets) s.bullets.forEach((b) => lines.push(`  • ${b}`));
      if (s.speakerNotes) lines.push(`  [Notes] ${s.speakerNotes}`);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${presentation.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAll = async () => {
    if (!presentation) return;
    const lines: string[] = [`${presentation.title}`, ""];
    presentation.slides.forEach((s) => {
      lines.push(`Slide ${s.slideNumber}: ${s.title}`);
      if (s.subtitle) lines.push(s.subtitle);
      if (s.bullets) s.bullets.forEach((b) => lines.push(`• ${b}`));
      lines.push("");
    });
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goNext = () => presentation && setCurrentSlide((p) => Math.min(p + 1, presentation.slides.length - 1));
  const goPrev = () => setCurrentSlide((p) => Math.max(p - 1, 0));

  const slide = presentation?.slides[currentSlide];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
        @keyframes fade-up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fade-up 0.3s ease-out forwards; }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 1s linear infinite; }
        @keyframes slide-in { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        .slide-in { animation: slide-in 0.25s ease-out forwards; }
      `}</style>

      <main style={{ background: "#04060f", minHeight: "100vh" }} className="text-white">

        {/* Nav */}
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "#6b7280" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(168,85,247,0.15)" }}>
              <span className="text-sm">🎨</span>
            </div>
            <span className="text-sm font-semibold text-white">AI Presentation Generator</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium"
            style={{ borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)", color: "#c084fc" }}>
            🌐 {activeLanguage}
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.2),rgba(99,102,241,0.2))", border: "1px solid rgba(168,85,247,0.3)" }}>
              <span className="text-3xl">🎨</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">AI Presentation Generator</h1>
            <p className="mt-2 text-sm" style={{ color: "#6b7280" }}>Generate professional slide decks on any topic in seconds</p>
          </div>

          {/* Config Card */}
          <div className="mb-8 overflow-hidden rounded-2xl border"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)" }}>
            <div className="p-6">
              <div className="grid gap-5 md:grid-cols-3">
                {/* Topic */}
                <div className="md:col-span-3">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Presentation Topic *
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generatePresentation()}
                    placeholder="e.g. Climate Change and Renewable Energy, Machine Learning Basics, History of India..."
                    className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)" }}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.5)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(168,85,247,0.08)"; }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                  />
                </div>

                {/* Style */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Presentation Style</label>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((s) => (
                      <button key={s} onClick={() => setStyle(s)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                        style={style === s
                          ? { background: "linear-gradient(135deg,#a855f7,#6366f1)", color: "#fff", boxShadow: "0 4px 12px rgba(168,85,247,0.3)" }
                          : { background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slide Count */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Number of Slides</label>
                  <div className="flex flex-wrap gap-2">
                    {SLIDE_COUNTS.map((n) => (
                      <button key={n} onClick={() => setSlideCount(n)}
                        className="h-9 w-9 rounded-lg text-xs font-bold transition-all"
                        style={slideCount === n
                          ? { background: "linear-gradient(135deg,#a855f7,#6366f1)", color: "#fff" }
                          : { background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex items-end">
                  <button
                    onClick={generatePresentation}
                    disabled={loading || !topic.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)", boxShadow: "0 8px 24px rgba(168,85,247,0.3)" }}
                    onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  >
                    {loading ? (
                      <>
                        <svg className="spin-slow h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <span>✨</span> Generate Presentation
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
                  style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#fca5a5" }}>
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="mb-8 flex flex-col items-center justify-center rounded-2xl border py-16"
              style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <svg className="spin-slow h-8 w-8" style={{ color: "#a855f7" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-base font-semibold text-white">Building your presentation…</p>
              <p className="mt-1 text-sm" style={{ color: "#4b5563" }}>Creating {slideCount} slides on "{topic}"</p>
            </div>
          )}

          {/* Presentation Viewer */}
          {presentation && !loading && (
            <div className="fade-up">
              {/* Title bar */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{presentation.title}</h2>
                  <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>
                    {presentation.slides.length} slides · {presentation.theme} style
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowNotes(!showNotes)}
                    className="rounded-xl border px-3 py-2 text-xs font-semibold transition-all"
                    style={showNotes
                      ? { borderColor: "rgba(168,85,247,0.5)", background: "rgba(168,85,247,0.15)", color: "#c084fc" }
                      : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#6b7280" }}>
                    📝 Speaker Notes
                  </button>
                  <button onClick={copyAll}
                    className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#6b7280" }}>
                    {copied ? "✅ Copied!" : "📋 Copy All"}
                  </button>
                  <button onClick={exportAsText}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-80"
                    style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)" }}>
                    ⬇️ Export
                  </button>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-4">
                {/* Slide thumbnails sidebar */}
                <div className="hidden lg:block">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Slides</p>
                  <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 520 }}>
                    {presentation.slides.map((s, i) => (
                      <button key={i} onClick={() => setCurrentSlide(i)}
                        className="w-full rounded-xl border p-2.5 text-left transition-all"
                        style={i === currentSlide
                          ? { borderColor: theme.accent, background: theme.card }
                          : { borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: i === currentSlide ? theme.text : "#4b5563" }}>
                          {s.slideNumber}
                        </p>
                        <p className="truncate text-xs font-medium" style={{ color: i === currentSlide ? "#fff" : "#6b7280" }}>
                          {s.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main slide canvas */}
                <div className="lg:col-span-3">
                  {slide && (
                    <div ref={slideRef} key={currentSlide} className="slide-in overflow-hidden rounded-2xl border"
                      style={{ borderColor: "rgba(255,255,255,0.08)", background: theme.bg, minHeight: 400, aspectRatio: "16/9", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>

                      {/* Decorative orb */}
                      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                        <div style={{ background: `radial-gradient(circle at 15% 20%, ${theme.accent}18 0%, transparent 55%)`, position: "absolute", inset: 0 }} />
                        <div style={{ background: `radial-gradient(circle at 85% 80%, ${theme.accent}10 0%, transparent 50%)`, position: "absolute", inset: 0 }} />
                      </div>

                      {/* Slide number badge */}
                      <div className="absolute top-4 right-4 rounded-lg px-2 py-1 text-[11px] font-bold"
                        style={{ background: `${theme.accent}20`, color: theme.text }}>
                        {slide.slideNumber} / {presentation.slides.length}
                      </div>

                      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
                        {(slide.type === "title" || slide.type === "closing") ? (
                          <>
                            <div className="mb-4 h-1 w-12 rounded-full" style={{ background: `linear-gradient(90deg,${theme.accent},transparent)` }} />
                            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{slide.title}</h2>
                            {slide.subtitle && (
                              <p className="mt-3 max-w-md text-base" style={{ color: theme.text }}>{slide.subtitle}</p>
                            )}
                            <div className="mt-4 h-1 w-12 rounded-full" style={{ background: `linear-gradient(90deg,transparent,${theme.accent})` }} />
                          </>
                        ) : (
                          <div className="w-full text-left">
                            <div className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: theme.text }}>
                              Slide {slide.slideNumber}
                            </div>
                            <h2 className="mb-5 text-2xl font-bold text-white">{slide.title}</h2>
                            <ul className="space-y-2.5">
                              {slide.bullets?.map((b, bi) => (
                                <li key={bi} className="flex items-start gap-3">
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />
                                  <span className="text-sm font-medium leading-relaxed" style={{ color: "#d1d5db" }}>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Speaker Notes */}
                  {showNotes && slide?.speakerNotes && (
                    <div className="mt-3 rounded-xl border p-4"
                      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Speaker Notes</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>{slide.speakerNotes}</p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="mt-4 flex items-center justify-between">
                    <button onClick={goPrev} disabled={currentSlide === 0}
                      className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-30"
                      style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#9ca3af" }}
                      onMouseEnter={e => { if (currentSlide > 0) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                    >
                      ← Previous
                    </button>

                    {/* Dots */}
                    <div className="flex items-center gap-1.5">
                      {presentation.slides.map((_, i) => (
                        <button key={i} onClick={() => setCurrentSlide(i)}
                          className="rounded-full transition-all"
                          style={{
                            width: i === currentSlide ? 20 : 6,
                            height: 6,
                            background: i === currentSlide ? theme.accent : "rgba(255,255,255,0.15)"
                          }} />
                      ))}
                    </div>

                    <button onClick={goNext} disabled={currentSlide === presentation.slides.length - 1}
                      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-30"
                      style={{ background: `linear-gradient(135deg,${theme.accent},#6366f1)` }}
                      onMouseEnter={e => { if (currentSlide < presentation.slides.length - 1) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    >
                      Next →
                    </button>
                  </div>

                  {/* Mobile slide strip */}
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                    {presentation.slides.map((s, i) => (
                      <button key={i} onClick={() => setCurrentSlide(i)}
                        className="shrink-0 rounded-lg border p-2 text-left"
                        style={{
                          minWidth: 80,
                          borderColor: i === currentSlide ? theme.accent : "rgba(255,255,255,0.06)",
                          background: i === currentSlide ? theme.card : "rgba(255,255,255,0.02)"
                        }}>
                        <p className="text-[9px] font-bold" style={{ color: i === currentSlide ? theme.text : "#4b5563" }}>{s.slideNumber}</p>
                        <p className="truncate text-[10px]" style={{ color: i === currentSlide ? "#fff" : "#6b7280" }}>{s.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
