import type { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrainBuddy | AI Study & Scholarship Workspace",
  description: "Your ultimate AI-powered study companion, scholarship finder, notes generator, and learning workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark selection:bg-indigo-500/30 selection:text-white">
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans antialiased">
        {/* Background Ambient Mesh Lighting */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
              width: 800,
              height: 800,
              top: -250,
              left: -200,
            }}
            className="absolute rounded-full"
          />
          <div
            style={{
              background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
              width: 700,
              height: 700,
              top: 150,
              right: -250,
            }}
            className="absolute rounded-full"
          />
          <div
            style={{
              background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)",
              width: 600,
              height: 600,
              bottom: -100,
              left: "30%",
            }}
            className="absolute rounded-full"
          />
        </div>

        <div className="relative z-10 flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
