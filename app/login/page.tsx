"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {   
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError("Invalid email or password");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-black flex items-center justify-center px-6">

      {/* Background Glow */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl"></div>

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">

        <div className="text-center">

          <div className="text-6xl">🧠</div>

          <h1 className="mt-3 text-4xl font-bold text-white">
            BrainBuddy
          </h1>

          <p className="mt-2 text-gray-300">
            Learn Smarter with AI
          </p>

        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">

          <div>
            <label className="text-gray-300 text-sm">
              Email
            </label>

            <div className="mt-2 flex items-center rounded-xl bg-gray-900/80 border border-gray-700 px-4">
              <span className="text-xl">📧</span>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent p-4 text-white outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm">
              Password
            </label>

            <div className="mt-2 flex items-center rounded-xl bg-gray-900/80 border border-gray-700 px-4">

              <span className="text-xl">🔒</span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full bg-transparent p-4 text-white outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>

            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 text-lg font-bold text-white transition duration-300 hover:scale-105"
          >
            🚀 Login
          </button>

        </form>

        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-gray-700"></div>
          <span className="px-4 text-gray-400 text-sm">OR</span>
          <div className="h-px flex-1 bg-gray-700"></div>
        </div>

        <button className="w-full rounded-xl border border-gray-600 bg-gray-900 py-3 text-white hover:bg-gray-800 transition">
          Continue with Google
        </button>

        <p className="mt-6 text-center text-gray-300">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue-400 hover:text-cyan-400"
          >
            Sign Up
          </Link>
        </p>

        <div className="mt-8 rounded-2xl bg-black/30 p-4 text-center">
          <p className="text-sm text-gray-300">
            🤖 AI Tutor • 📄 PDF Chat • 🖊 Whiteboard
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Powered by Artificial Intelligence
          </p>
        </div>

      </div>

    </main>
  );
}