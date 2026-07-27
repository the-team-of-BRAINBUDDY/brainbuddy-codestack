"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavSection {
  title: string;
  items: { href: string; label: string; icon: string; badge?: string }[];
}

const navSections: NavSection[] = [
  {
    title: "MAIN WORKSPACE",
    items: [
      { href: "/", label: "Dashboard", icon: "◈" },
      { href: "/scholarships", label: "Scholarships", icon: "🎓", badge: "New" },
    ],
  },
  {
    title: "AI LEARNING TOOLS",
    items: [
      { href: "/ai-tutor", label: "AI Tutor", icon: "✦" },
      { href: "/notes", label: "Notes Generator", icon: "📝" },
      { href: "/planner", label: "Study Planner", icon: "📅" },
      { href: "/quiz", label: "Quiz Generator", icon: "❓" },
      { href: "/whiteboard", label: "AI Whiteboard", icon: "🖼️" },
      { href: "/pdf-chat", label: "PDF Chat", icon: "📄" },
      { href: "/video-summarizer", label: "Video Summarizer", icon: "🎬" },
      { href: "/voice-assistant", label: "Voice Assistant", icon: "🎤" },
      { href: "/presentation", label: "AI Presentation", icon: "🎨" },
    ],
  },
  {
    title: "ANALYTICS & PREFERENCES",
    items: [
      { href: "/progress", label: "Study Progress", icon: "📈" },
      { href: "/settings", label: "Settings", icon: "⚙️" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hiddenRoutes = ["/login", "/signup"];
  const shouldHide = hiddenRoutes.includes(pathname || "");

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* Mobile Top Header Toggle Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-emerald-400 font-bold text-white shadow-md">
            🧠
          </div>
          <span className="text-sm font-bold text-white tracking-tight">BrainBuddy</span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Overlay backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950/95 text-slate-100 backdrop-blur-xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/5">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-3 transition hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-400 to-indigo-500 text-xl font-bold shadow-md transition group-hover:scale-105">
              🧠
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">BrainBuddy</span>
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                  v2.0
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-400">AI Study & Scholarship Hub</p>
            </div>
          </Link>
        </div>

        {/* Nav Links with Section Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mb-1.5">
                {section.title}
              </p>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/10 text-white border border-indigo-500/40 shadow-sm"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      {/* Left glowing accent bar for active item */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-indigo-400 to-blue-500 shadow-sm shadow-indigo-500" />
                      )}

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-base transition-transform duration-200 group-hover:scale-110 ${
                            isActive ? "text-indigo-400" : "text-slate-400"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="tracking-wide">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Card & Quick Action Footer */}
        <div className="border-t border-white/5 p-3 space-y-2">
          <Link
            href="/ai-tutor"
            onClick={() => setMobileOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110 active:scale-95"
          >
            <span>+ New AI Session</span>
          </Link>

          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-2.5">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-blue-600 text-xs font-bold text-white shadow-sm">
              S
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">Student Scholar</p>
              <p className="truncate text-[10px] text-emerald-400 font-medium">● Active Learner</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
