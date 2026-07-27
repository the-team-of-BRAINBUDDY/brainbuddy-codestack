"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  SCHOLARSHIPS_DATA,
  Scholarship,
  Category,
  EducationLevel,
  Gender,
  StudentProfile,
  calculateMatchScore,
  ScholarshipMatch,
} from "@/lib/scholarshipsData";

const CATEGORIES: { label: string; value: Category; icon: string }[] = [
  { label: "All Categories", value: "ALL", icon: "🌐" },
  { label: "OBC", value: "OBC", icon: "🏷️" },
  { label: "SC", value: "SC", icon: "⚖️" },
  { label: "ST", value: "ST", icon: "🏹" },
  { label: "OPEN / General", value: "OPEN", icon: "🌟" },
  { label: "EWS", value: "EWS", icon: "📊" },
  { label: "Minority", value: "MINORITY", icon: "🌙" },
  { label: "PwD", value: "PWD", icon: "♿" },
];

const EDUCATION_LEVELS: EducationLevel[] = [
  "School (9-10th)",
  "Higher Secondary (11-12th)",
  "Diploma",
  "Undergraduate",
  "Postgraduate",
  "PhD / Research",
];

export default function ScholarshipsPage() {
  const [activeTab, setActiveTab] = useState<"explore" | "recommender" | "ai-advisor" | "saved">("explore");
  const [selectedCategory, setSelectedCategory] = useState<Category>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [incomeFilter, setIncomeFilter] = useState<number | "All">("All");

  // Profile Recommender Form state
  const [profile, setProfile] = useState<StudentProfile>({
    category: "OBC",
    educationLevel: "Undergraduate",
    annualIncome: 250000,
    marksPercent: 75,
    gender: "All",
    state: "All India",
  });
  const [hasCalculatedMatches, setHasCalculatedMatches] = useState(false);

  // Selected scholarship for details modal
  const [activeScholarship, setActiveScholarship] = useState<ScholarshipMatch | Scholarship | null>(null);

  // Saved / Bookmarked IDs
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  // AI Advisor state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("brainbuddy_saved_scholarships");
      if (stored) {
        setSavedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (savedIds.includes(id)) {
      updated = savedIds.filter((item) => item !== id);
    } else {
      updated = [...savedIds, id];
    }
    setSavedIds(updated);
    localStorage.setItem("brainbuddy_saved_scholarships", JSON.stringify(updated));
  };

  const handleDocumentCheck = (docName: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [docName]: !prev[docName],
    }));
  };

  // Calculate matched list if profile calculations applied
  const getMatchedScholarships = (): ScholarshipMatch[] => {
    return SCHOLARSHIPS_DATA.map((sch) => calculateMatchScore(profile, sch)).sort(
      (a, b) => b.matchScore - a.matchScore
    );
  };

  const matchedList = getMatchedScholarships();

  // Filtered scholarships for Explore Tab
  const filteredScholarships = SCHOLARSHIPS_DATA.filter((sch) => {
    const matchesCat =
      selectedCategory === "ALL" ||
      sch.categories.includes(selectedCategory) ||
      sch.categories.includes("ALL");

    const matchesSearch =
      searchQuery.trim() === "" ||
      sch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel =
      selectedLevel === "All" || sch.educationLevels.includes(selectedLevel as EducationLevel);

    const matchesIncome =
      incomeFilter === "All" ||
      sch.maxIncomeLimit === null ||
      sch.maxIncomeLimit >= incomeFilter;

    return matchesCat && matchesSearch && matchesLevel && matchesIncome;
  });

  const savedScholarshipsList = SCHOLARSHIPS_DATA.filter((sch) => savedIds.includes(sch.id));

  const handleAskAiAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() && !hasCalculatedMatches) return;
    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch("/api/scholarships/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt || "Give me custom scholarship advice for my category.",
          studentProfile: profile,
        }),
      });
      const data = await res.json();
      setAiResponse(data.advice || "No response received.");
    } catch (err) {
      console.error(err);
      setAiResponse("Failed to connect to AI Advisor. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
        .glass-panel {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>

      <main className="min-h-screen bg-slate-950 text-slate-100 pb-16">
        {/* Background glow effects */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            style={{
              background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)",
              width: 700,
              height: 700,
              top: -150,
              left: -150,
            }}
            className="absolute rounded-full"
          />
          <div
            style={{
              background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 65%)",
              width: 600,
              height: 600,
              top: 100,
              right: -200,
            }}
            className="absolute rounded-full"
          />
        </div>

        {/* Top Header Navigation */}
        <header className="relative z-20 border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-md lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
              >
                ←
              </Link>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-amber-500 text-lg shadow-md shadow-emerald-500/20">
                  🎓
                </span>
                <div>
                  <h1 className="text-lg font-bold text-white leading-none">Scholarship Finder</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Match & recommend scholarships by Category (OBC, SC, ST, OPEN, EWS, etc.)
                  </p>
                </div>
              </div>
            </div>

            {/* Saved Counter */}
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === "saved"
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>⭐ Saved</span>
              <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-emerald-300">
                {savedIds.length}
              </span>
            </button>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-6 lg:px-10">
          {/* Hero Banner */}
          <div className="glass-panel relative overflow-hidden rounded-3xl p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>100% Free Scholarship Assistant for Students</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                  Find Every Scholarship You Are Eligible For
                </h2>
                <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                  Filter government & private grants by your reservation category (**OBC, SC, ST, OPEN/General, EWS, Minority, PwD**), academic marks, and annual income ceiling.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab("recommender")}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-95"
                >
                  ⚡ Check My Eligibility %
                </button>
                <button
                  onClick={() => setActiveTab("ai-advisor")}
                  className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-xs sm:text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 active:scale-95"
                >
                  🤖 Ask AI Counselor
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
            {[
              { id: "explore", label: "🔍 All Scholarships", count: SCHOLARSHIPS_DATA.length },
              { id: "recommender", label: "🎯 Eligibility Matcher", highlight: true },
              { id: "ai-advisor", label: "🤖 AI Scholarship Advisor" },
              { id: "saved", label: `⭐ Saved (${savedIds.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs text-slate-300">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: EXPLORE SCHOLARSHIPS */}
          {activeTab === "explore" && (
            <div className="mt-6 space-y-6">
              {/* Category Quick Filter Pills */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Filter by Category:
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                        selectedCategory === cat.value
                          ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold"
                          : "bg-slate-900/80 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Filters Bar */}
              <div className="glass-panel flex flex-col gap-4 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
                {/* Search box */}
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, provider, or keyword..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Level Dropdown */}
                <div className="flex flex-wrap gap-3">
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-950 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                  >
                    <option value="All">🎓 All Education Levels</option>
                    {EDUCATION_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>

                  {/* Income Dropdown */}
                  <select
                    value={incomeFilter.toString()}
                    onChange={(e) =>
                      setIncomeFilter(
                        e.target.value === "All" ? "All" : Number(e.target.value)
                      )
                    }
                    className="rounded-xl border border-white/10 bg-slate-950 py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                  >
                    <option value="All">💰 All Income Limits</option>
                    <option value="250000">Below ₹2.5 Lakhs</option>
                    <option value="450000">Below ₹4.5 Lakhs</option>
                    <option value="800000">Below ₹8.0 Lakhs</option>
                  </select>
                </div>
              </div>

              {/* Scholarship Cards Grid */}
              {filteredScholarships.length === 0 ? (
                <div className="glass-panel text-center py-12 rounded-2xl">
                  <p className="text-3xl">🔎</p>
                  <p className="mt-2 text-sm font-semibold text-slate-300">
                    No scholarships found for selected filters.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try clearing search or switching category filter to "All Categories".
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("ALL");
                      setSearchQuery("");
                      setSelectedLevel("All");
                      setIncomeFilter("All");
                    }}
                    className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredScholarships.map((sch) => {
                    const isSaved = savedIds.includes(sch.id);
                    return (
                      <div
                        key={sch.id}
                        onClick={() => setActiveScholarship(sch)}
                        className="glass-panel group relative flex flex-col justify-between rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer"
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex flex-wrap gap-1.5">
                              {sch.categories.map((cat) => (
                                <span
                                  key={cat}
                                  className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 tracking-wider uppercase"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                            <button
                              onClick={(e) => toggleSave(sch.id, e)}
                              className={`text-base transition transform active:scale-125 ${
                                isSaved ? "text-amber-400" : "text-slate-600 hover:text-amber-400"
                              }`}
                              title={isSaved ? "Remove bookmark" : "Bookmark scholarship"}
                            >
                              ★
                            </button>
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                            {sch.title}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                            🏛️ {sch.provider}
                          </p>

                          <p className="mt-3 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {sch.description}
                          </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Award / Benefit:</span>
                            <span className="font-semibold text-amber-300 text-right line-clamp-1">
                              {sch.amount}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Deadline:</span>
                            <span
                              className={`font-semibold ${
                                sch.status === "Closing Soon"
                                  ? "text-rose-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {sch.deadline}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-400">
                              🎯 Min Marks: {sch.minMarksPercent}%
                            </span>
                            <span className="text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                              View Details →
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ELIGIBILITY RECOMMENDER FORM & MATCH SCORES */}
          {activeTab === "recommender" && (
            <div className="mt-6 space-y-8">
              {/* Form card */}
              <div className="glass-panel rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 text-xl font-bold">
                    🎯
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Student Eligibility Matcher</h3>
                    <p className="text-xs text-slate-400">
                      Enter your category, income, and marks to calculate exact eligibility % for all scholarships.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Reservation Category <span className="text-emerald-400">*</span>
                    </label>
                    <select
                      value={profile.category}
                      onChange={(e) =>
                        setProfile({ ...profile, category: e.target.value as Category })
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="OBC">OBC (Other Backward Classes)</option>
                      <option value="SC">SC (Scheduled Castes)</option>
                      <option value="ST">ST (Scheduled Tribes)</option>
                      <option value="OPEN">OPEN / General</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                      <option value="MINORITY">Minority (Muslim, Christian, Sikh, etc.)</option>
                      <option value="PWD">PwD (Persons with Disability)</option>
                    </select>
                  </div>

                  {/* Education Level */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Education Level
                    </label>
                    <select
                      value={profile.educationLevel}
                      onChange={(e) =>
                        setProfile({ ...profile, educationLevel: e.target.value as EducationLevel })
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      {EDUCATION_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Gender</label>
                    <select
                      value={profile.gender}
                      onChange={(e) =>
                        setProfile({ ...profile, gender: e.target.value as Gender })
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="All">All / Prefer not to say</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>

                  {/* Annual Income Slider / Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Annual Family Income:{" "}
                      <span className="text-emerald-400 font-bold">
                        ₹{profile.annualIncome.toLocaleString("en-IN")}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="50000"
                      max="1500000"
                      step="25000"
                      value={profile.annualIncome}
                      onChange={(e) =>
                        setProfile({ ...profile, annualIncome: Number(e.target.value) })
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>₹50,000</span>
                      <span>₹2.5L</span>
                      <span>₹8.0L</span>
                      <span>₹15L+</span>
                    </div>
                  </div>

                  {/* Marks % Slider */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Academic Score (% Marks):{" "}
                      <span className="text-emerald-400 font-bold">{profile.marksPercent}%</span>
                    </label>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="1"
                      value={profile.marksPercent}
                      onChange={(e) =>
                        setProfile({ ...profile, marksPercent: Number(e.target.value) })
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>40%</span>
                      <span>60%</span>
                      <span>80%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Calculate Button */}
                  <div className="flex items-end">
                    <button
                      onClick={() => setHasCalculatedMatches(true)}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 active:scale-95"
                    >
                      ⚡ Calculate Matched Scholarships
                    </button>
                  </div>
                </div>
              </div>

              {/* Match Results */}
              {hasCalculatedMatches && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Matched Scholarships for</span>
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-emerald-300 text-sm border border-emerald-500/40">
                        {profile.category} Category
                      </span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      Sorted by highest eligibility match
                    </span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {matchedList.map((item) => {
                      const isHighMatch = item.matchScore >= 80;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setActiveScholarship(item)}
                          className="glass-panel group rounded-2xl p-5 cursor-pointer transition-all hover:border-emerald-500/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                                  isHighMatch
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                                    : item.matchScore >= 50
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                                }`}
                              >
                                {item.matchScore}% Match Rate
                              </span>
                              <h4 className="mt-2 text-base font-bold text-white group-hover:text-emerald-300 transition">
                                {item.title}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5">{item.provider}</p>
                            </div>
                            <span className="text-xl">
                              {isHighMatch ? "✅" : item.matchScore >= 50 ? "⚠️" : "❌"}
                            </span>
                          </div>

                          {/* Match Reasons / Issues */}
                          <div className="mt-4 rounded-xl bg-slate-950/60 p-3 space-y-1.5 text-xs">
                            {item.matchReasons.map((reason, idx) => (
                              <p key={idx} className="text-emerald-400 flex items-center gap-1.5">
                                <span>✓</span> <span>{reason}</span>
                              </p>
                            ))}
                            {item.eligibilityIssues.map((issue, idx) => (
                              <p key={idx} className="text-rose-400 flex items-center gap-1.5">
                                <span>✕</span> <span>{issue}</span>
                              </p>
                            ))}
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                            <span className="text-slate-300 font-semibold">{item.amount}</span>
                            <span className="text-emerald-400 font-semibold">View Full Criteria →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI SCHOLARSHIP ADVISOR */}
          {activeTab === "ai-advisor" && (
            <div className="mt-6 space-y-6">
              <div className="glass-panel rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 text-xl font-bold">
                    🤖
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Scholarship Counselor</h3>
                    <p className="text-xs text-slate-400">
                      Ask any question regarding documents, application deadlines, category quotas, or essay writing!
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAskAiAdvisor} className="space-y-4">
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. I am an OBC student studying B.Tech 2nd year with family income 2 LPA. What documents do I need for NSP Post-Matric scholarship and how to write a strong statement?"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/50"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span>Quick prompts:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setAiPrompt(
                            "What are top OBC scholarships for engineering students with family income under 2.5 LPA?"
                          )
                        }
                        className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-300 hover:bg-white/10"
                      >
                        OBC Engineering
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAiPrompt("List all documents needed for Post-Matric SC/ST scholarship.")
                        }
                        className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-300 hover:bg-white/10"
                      >
                        SC/ST Checklist
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isAiLoading}
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                      {isAiLoading ? "Consulting AI..." : "Ask AI Counselor ✨"}
                    </button>
                  </div>
                </form>

                {aiResponse && (
                  <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-slate-200">
                    <h4 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
                      <span>✨ AI Counselor Advice:</span>
                    </h4>
                    <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {aiResponse}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SAVED SCHOLARSHIPS */}
          {activeTab === "saved" && (
            <div className="mt-6 space-y-6">
              {savedScholarshipsList.length === 0 ? (
                <div className="glass-panel text-center py-12 rounded-2xl">
                  <p className="text-3xl">⭐</p>
                  <p className="mt-2 text-sm font-semibold text-slate-300">
                    No scholarships bookmarked yet.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click the star (★) icon on any scholarship card to save it for quick access.
                  </p>
                  <button
                    onClick={() => setActiveTab("explore")}
                    className="mt-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Browse Scholarships
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {savedScholarshipsList.map((sch) => (
                    <div
                      key={sch.id}
                      onClick={() => setActiveScholarship(sch)}
                      className="glass-panel group relative flex flex-col justify-between rounded-2xl p-5 cursor-pointer hover:border-emerald-500/50"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            {sch.categories.join(", ")}
                          </span>
                          <button
                            onClick={(e) => toggleSave(sch.id, e)}
                            className="text-amber-400 text-base"
                            title="Remove bookmark"
                          >
                            ★
                          </button>
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300">
                          {sch.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">{sch.provider}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-amber-300 font-semibold">{sch.amount}</span>
                        <span className="text-emerald-400 font-semibold">View →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DETAILED SCHOLARSHIP POPUP MODAL */}
        {activeScholarship && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="glass-panel relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6 sm:p-8 border border-white/15 text-slate-100 shadow-2xl">
              {/* Close Button */}
              <button
                onClick={() => setActiveScholarship(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
              >
                ✕
              </button>

              {/* Modal Content */}
              <div className="space-y-6">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {activeScholarship.categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-bold text-emerald-300"
                      >
                        {cat}
                      </span>
                    ))}
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-xs font-bold text-amber-300">
                      {activeScholarship.status}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-white">{activeScholarship.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">🏛️ {activeScholarship.provider}</p>
                </div>

                {/* Key Summary Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-slate-900/80 p-4 border border-white/10">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      Award Amount
                    </p>
                    <p className="text-xs font-bold text-amber-300 mt-0.5">
                      {activeScholarship.amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Deadline</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">
                      {activeScholarship.deadline}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      Max Income Limit
                    </p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">
                      {activeScholarship.maxIncomeLimit
                        ? `≤ ₹${activeScholarship.maxIncomeLimit.toLocaleString("en-IN")}`
                        : "No Income Cap"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Min Marks</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">
                      {activeScholarship.minMarksPercent}%
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    About Scheme
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeScholarship.description}
                  </p>
                </div>

                {/* Eligibility Criteria */}
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    Eligibility Requirements
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {activeScholarship.eligibilityCriteria.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                    Benefits & Financial Grant
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {activeScholarship.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">★</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Documents Checklist */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Required Documents Checklist (Check off what you have):
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeScholarship.documentsRequired.map((doc, idx) => {
                      const isChecked = !!checkedDocs[doc];
                      return (
                        <label
                          key={idx}
                          onClick={() => handleDocumentCheck(doc)}
                          className={`flex items-start gap-2.5 rounded-xl p-2.5 text-xs cursor-pointer transition border ${
                            isChecked
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                              : "bg-slate-900/60 border-white/5 text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 accent-emerald-500"
                          />
                          <span>{doc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Application Steps */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    How to Apply (Step-by-Step)
                  </h4>
                  <ol className="space-y-2 text-xs text-slate-300">
                    {activeScholarship.applySteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                          {idx + 1}
                        </span>
                        <span className="mt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Official Link Button */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap gap-3 items-center justify-between">
                  <button
                    onClick={(e) => toggleSave(activeScholarship.id, e)}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                      savedIds.includes(activeScholarship.id)
                        ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {savedIds.includes(activeScholarship.id)
                      ? "★ Saved in Bookmarks"
                      : "☆ Save for Later"}
                  </button>

                  <a
                    href={activeScholarship.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 flex items-center gap-2"
                  >
                    <span>Apply on Official Portal</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
