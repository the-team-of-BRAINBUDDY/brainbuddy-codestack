"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getHistory, addHistoryItem, clearHistory, HistoryItem } from "@/lib/history";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filterType, setFilterType] = useState<string>("All");
  const [user, setUser] = useState<User | null>(null);
  const [activeLanguage, setActiveLanguage] = useState("English");
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistoryItems(getHistory());
    const savedLang = localStorage.getItem("brainbuddy_language");
    if (savedLang) setActiveLanguage(savedLang);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    addHistoryItem("Search", `Searched: "${query}"`, "Direct query from dashboard");
    setHistoryItems(getHistory());
    router.push(`/ai-tutor?prompt=${encodeURIComponent(query)}`);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      clearHistory();
      setHistoryItems([]);
    }
  };

  const userInitial = user?.email
    ? user.email.charAt(0).toUpperCase()
    : user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : "S";

  const cards = [
    {
      title: "🎓 Student Scholarships",
      desc: "Match scholarships by Category (OBC, SC, ST, Open, EWS, PwD).",
      link: "/scholarships",
      accent: "from-emerald-500/20 via-teal-500/10 to-transparent",
      border: "hover:border-emerald-400/60",
      badge: "Featured",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: "🎓",
    },
    {
      title: "🤖 Personal AI Tutor",
      desc: "Ask questions and get interactive step-by-step explanations.",
      link: "/ai-tutor",
      accent: "from-blue-500/20 via-indigo-500/10 to-transparent",
      border: "hover:border-blue-400/60",
      icon: "🤖",
    },
    {
      title: "📄 PDF Chat",
      desc: "Upload PDFs, extract insights, and chat with your documents.",
      link: "/pdf-chat",
      accent: "from-violet-500/20 via-purple-500/10 to-transparent",
      border: "hover:border-violet-400/60",
      icon: "📄",
    },
    {
      title: "🎬 AI Video Summarizer",
      desc: "Summarize YouTube videos & lectures into instant key notes.",
      link: "/video-summarizer",
      accent: "from-rose-500/20 via-pink-500/10 to-transparent",
      border: "hover:border-rose-400/60",
      icon: "🎬",
    },
    {
      title: "🎤 Voice Assistant",
      desc: "Speak naturally and listen to voice-guided AI study answers.",
      link: "/voice-assistant",
      accent: "from-cyan-500/20 via-sky-500/10 to-transparent",
      border: "hover:border-cyan-400/60",
      icon: "🎤",
    },
    {
      title: "📝 Quiz Generator",
      desc: "Generate practice quizzes & test your knowledge instantly.",
      link: "/quiz",
      accent: "from-amber-500/20 via-yellow-500/10 to-transparent",
      border: "hover:border-amber-400/60",
      icon: "📝",
    },
    {
      title: "🖊 AI Whiteboard",
      desc: "Draw math problems, sketch diagrams, and get AI solutions.",
      link: "/whiteboard",
      accent: "from-teal-500/20 via-emerald-500/10 to-transparent",
      border: "hover:border-teal-400/60",
      icon: "🖊",
    },
    {
      title: "📚 Notes Generator",
      desc: "Turn complex topics into clean, structured study revision notes.",
      link: "/notes",
      accent: "from-lime-500/20 via-green-500/10 to-transparent",
      border: "hover:border-lime-400/60",
      icon: "📚",
    },
    {
      title: "📅 Study Planner",
      desc: "Organize your study routine and stay on top of exams.",
      link: "/planner",
      accent: "from-sky-500/20 via-blue-500/10 to-transparent",
      border: "hover:border-sky-400/60",
      icon: "📅",
    },
    {
      title: "📊 Study Progress",
      desc: "Track learning goals, streaks, and subject completion.",
      link: "/progress",
      accent: "from-fuchsia-500/20 via-pink-500/10 to-transparent",
      border: "hover:border-fuchsia-400/60",
      icon: "📊",
    },
    {
      title: "🎨 AI Presentation",
      desc: "Generate professional slide decks and presentations instantly.",
      link: "/presentation",
      accent: "from-purple-500/20 via-indigo-500/10 to-transparent",
      border: "hover:border-purple-400/60",
      icon: "🎨",
    },
  ];

  const filteredHistory =
    filterType === "All"
      ? historyItems
      : historyItems.filter((item) => item.type === filterType);

  const historyTypes = [
    "All",
    "Scholarships",
    "AI Tutor",
    "PDF Chat",
    "Voice Assistant",
    "Quiz",
    "Whiteboard",
    "Notes",
    "Planner",
    "Presentation",
    "Search",
  ];

  const quickPrompts = [
    { label: "🎓 OBC Scholarships", query: "Show top OBC scholarships for students" },
    { label: "⚡ Physics Formulae", query: "Explain Ohm's Law and key electricity equations" },
    { label: "📝 Generate Quiz", href: "/quiz" },
    { label: "🎬 Summarize Lecture", href: "/video-summarizer" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {/* ── TOP NAVIGATION ── */}
      <nav className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10 border-b border-white/5">
        {/* Left Welcome Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-lg shadow-md shadow-indigo-500/20">
            🧠
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              BrainBuddy Workspace
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">AI-Powered Learning Companion</p>
          </div>
        </div>

        {/* Navigation Right Items */}
        <div className="flex items-center gap-3">
          {/* History Button */}
          <button
            onClick={() => {
              setHistoryItems(getHistory());
              setShowHistoryModal(true);
            }}
            className="group flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20 hover:border-indigo-500/50 active:scale-95"
          >
            <span className="text-sm">📜</span>
            <span>History</span>
          </button>

          {/* User Profile Menu */}
          <div className="relative" ref={accountMenuRef}>
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 pr-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:border-white/20"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 font-bold text-white text-xs">
                {userInitial}
              </div>
              <span className="max-w-[100px] truncate">{user?.displayName || "Student"}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>

            {/* Dropdown Menu */}
            {showAccountMenu && (
              <div className="glass-panel absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-white/15 p-2 shadow-2xl z-50 animate-fade-in">
                <div className="border-b border-white/10 p-3 mb-1">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.email || "Student Account"}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                    ● Always Learning
                  </p>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/scholarships"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <span>🎓</span>
                    <span>Scholarship Matcher</span>
                  </Link>

                  <Link
                    href="/progress"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <span>📊</span>
                    <span>Study Progress</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <span>⚙️</span>
                    <span>Language & Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      setShowHistoryModal(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <span>📜</span>
                    <span>Learning History</span>
                  </button>
                </div>

                <div className="border-t border-white/10 mt-2 pt-2">
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <span>🚪</span>
                    <span>Logout Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO BANNER & SEARCH ── */}
      <section className="relative mx-auto max-w-7xl px-6 pt-6 pb-4 lg:px-10">
        <div className="glass-panel relative overflow-hidden rounded-3xl p-8 lg:p-10 border border-white/10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI Powered Study Companion</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Welcome Back, Learner 👋
              </h2>
              <p className="mt-2.5 text-sm text-slate-300 leading-relaxed">
                What would you like to master today? Ask any academic question, find eligible scholarships, or generate instant revision notes.
              </p>

              {/* Quick Prompt Recommendation Chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {quickPrompts.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (chip.href) {
                        router.push(chip.href);
                      } else if (chip.query) {
                        setSearchQuery(chip.query);
                      }
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/15 hover:text-white transition"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Search Bar */}
            <form onSubmit={handleSearchSubmit} className="w-full max-w-md">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask AI Tutor anything..."
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/90 py-4 pl-12 pr-24 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:brightness-110 active:scale-95"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS GRID ── */}
      <section className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🚀 Study Tools & Features</span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-400 font-medium">
              11 Modules
            </span>
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link href={card.link} key={card.title}>
              <div
                className={`glass-panel glass-panel-hover group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-6 border border-white/10 ${card.border}`}
              >
                {/* Subtle card background accent gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-40 transition group-hover:opacity-70`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/80 text-xl border border-white/10 shadow-sm transition group-hover:scale-110">
                      {card.icon}
                    </span>
                    {card.badge && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${card.badgeColor}`}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {card.title}
                  </h4>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                  <span>Open Tool</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TODAY'S STUDY GOALS & PROGRESS WIDGET ── */}
      <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-10">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Progress Widget */}
          <div className="glass-panel relative overflow-hidden rounded-3xl p-6 md:col-span-2 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📊 Today's Learning Goal</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">3 of 4 study modules completed</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
                75% Target Met
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900 border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 transition-all duration-1000"
                style={{ width: "75%" }}
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-900/60 p-3 border border-white/5">
                <p className="text-xs text-slate-400">Study Time</p>
                <p className="text-base font-bold text-white mt-0.5">2.5 Hours</p>
              </div>
              <div className="rounded-2xl bg-slate-900/60 p-3 border border-white/5">
                <p className="text-xs text-slate-400">Learning Streak</p>
                <p className="text-base font-bold text-amber-300 mt-0.5">🔥 5 Days</p>
              </div>
              <div className="rounded-2xl bg-slate-900/60 p-3 border border-white/5">
                <p className="text-xs text-slate-400">Quizzes Solved</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">12 Passed</p>
              </div>
            </div>
          </div>

          {/* Quick Scholarship Highlight Card */}
          <div className="glass-panel relative overflow-hidden rounded-3xl p-6 border border-emerald-500/30 bg-emerald-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  SCHOLARSHIP HUB
                </span>
                <span className="text-lg">🎓</span>
              </div>
              <h4 className="text-base font-bold text-white">Find Your Category Grants</h4>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Filter eligible scholarships for OBC, SC, ST, OPEN, EWS, & PwD with instant match scores.
              </p>
            </div>

            <Link
              href="/scholarships"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:brightness-110"
            >
              <span>Explore Scholarships</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── LEARNING HISTORY MODAL ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 border border-white/15 text-slate-100 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 text-xl font-bold">
                📜
              </span>
              <div>
                <h3 className="text-xl font-bold text-white">Learning Activity History</h3>
                <p className="text-xs text-slate-400">View your recent queries, quizzes, and study history.</p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-5 pb-3 border-b border-white/10">
              {historyTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    filterType === type
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* History List */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl">📭</p>
                <p className="text-xs text-slate-400 mt-2">No history logs found for this filter.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {filteredHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/5 bg-slate-900/60 p-3.5 transition hover:border-white/15"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-indigo-400">{item.type}</span>
                      <span className="text-[10px] text-slate-500">
                        {item.formattedDate || new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">{item.title}</p>
                    {item.detail && <p className="text-[11px] text-slate-400 mt-1">{item.detail}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Footer Clear Action */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs text-slate-400">{historyItems.length} Total Logs Saved</span>
              <button
                onClick={handleClearHistory}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}