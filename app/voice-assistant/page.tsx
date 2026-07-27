"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

const LANGUAGES = [
  { label: "English", code: "en-US" },
  { label: "Hindi", code: "hi-IN" },
  { label: "Marathi", code: "mr-IN" },
  { label: "Spanish", code: "es-ES" },
  { label: "French", code: "fr-FR" },
  { label: "German", code: "de-DE" },
  { label: "Arabic", code: "ar-SA" },
  { label: "Portuguese", code: "pt-BR" },
  { label: "Japanese", code: "ja-JP" },
  { label: "Chinese (Simplified)", code: "zh-CN" },
  { label: "Korean", code: "ko-KR" },
  { label: "Italian", code: "it-IT" },
  { label: "Russian", code: "ru-RU" },
];

export default function VoiceAssistantPage() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState("Tap the mic and ask BrainBuddy anything.");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const recognizerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Rebuild the recognizer whenever the selected language changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setResponse("Voice input is not supported in this browser. You can still type your question below.");
      return;
    }

    // Stop any existing session first
    try { recognizerRef.current?.stop(); } catch (_) {}

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang.code;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event: any) => {
      const message =
        event?.error === "not-allowed"
          ? "Microphone permission was blocked. Please allow microphone access or type your question instead."
          : "Voice input could not be started. Please type your question instead.";
      setResponse(message);
    };

    recognition.onresult = async (event: any) => {
      const resultIndex = event?.resultIndex ?? 0;
      const transcript = event?.results?.[resultIndex]?.[0]?.transcript?.trim();

      if (!transcript) {
        setResponse("I did not catch that clearly. Please try again.");
        return;
      }

      setText(transcript);
      await handleVoiceCommand(transcript);
    };

    recognizerRef.current = recognition;

    return () => recognition.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLang]);

  async function handleVoiceCommand(command: string) {
    const trimmed = command.trim();
    if (!trimmed) return;

    setLoading(true);
    setResponse("Thinking...");

    try {
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Please respond in ${selectedLang.label} language. ${trimmed}`,
        }),
      });

      const aiData = await aiRes.json();
      const answer = aiData.answer || "I could not understand that yet.";
      setResponse(answer);
      await speak(answer);
    } catch (error) {
      console.error(error);
      setResponse("Voice assistant is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function browserSpeak(textToSpeak: string, langCode: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    // Try to find a voice that matches the language
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = langCode.split("-")[0];
    const matched =
      voices.find((v) => v.lang === langCode) ||
      voices.find((v) => v.lang.startsWith(langPrefix)) ||
      null;
    if (matched) utterance.voice = matched;
    utterance.lang = langCode;
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function speak(textToSpeak: string) {
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, lang: selectedLang.code }),
      });

      // If server signals no ElevenLabs key, use browser TTS directly
      if (res.status === 503) {
        browserSpeak(textToSpeak, selectedLang.code);
        return;
      }

      if (!res.ok) {
        throw new Error("Voice output failed");
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.warn("ElevenLabs voice failed, using browser speech fallback.", error);
      browserSpeak(textToSpeak, selectedLang.code);
    }
  }

  function stopVoiceSession() {
    try {
      recognizerRef.current?.stop();
    } catch (error) {
      console.warn("Could not stop recognizer:", error);
    }

    setListening(false);
    setLoading(false);

    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  function startListening() {
    if (!recognizerRef.current) {
      setResponse("Voice input is not supported in this browser. Please type your question instead.");
      return;
    }

    try {
      stopVoiceSession();
      recognizerRef.current.lang = selectedLang.code;
      recognizerRef.current.start();
    } catch (error) {
      setResponse("Voice input could not start. Please type your question instead.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = inputValue.trim();

    if (!trimmed) return;

    setText(trimmed);
    void handleVoiceCommand(trimmed);
    setInputValue("");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_25%),linear-gradient(135deg,_#07111f_0%,_#111827_100%)] p-6 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-blue-300 hover:text-blue-200">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-semibold">🎤 Voice Assistant</h1>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-blue-950/30 backdrop-blur">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-blue-300">Hands-free learning</p>
          <h2 className="text-3xl font-bold">Speak naturally and let BrainBuddy respond.</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Use your microphone to ask questions, get explanations, or hear a spoken answer back — in any language you choose.
          </p>

          {/* Language Selector */}
          <div className="mt-6">
            <label className="mb-2 block text-sm text-slate-400">🌐 Language</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    stopVoiceSession();
                    setSelectedLang(lang);
                    setResponse(`Language set to ${lang.label}. Tap the mic to start.`);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedLang.code === lang.code
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-700/40"
                      : "border border-white/10 bg-white/10 text-slate-300 hover:bg-white/20"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {!voiceSupported && (
            <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Your browser does not support speech recognition, so typed questions are available as a fallback.
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="mb-2 text-sm text-slate-400">You said</p>
            <p className="min-h-10 text-lg text-white">{text || "Waiting for your voice input..."}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="mb-2 text-sm text-slate-400">BrainBuddy reply</p>
            <p className="min-h-16 text-lg text-slate-200">{loading ? "Thinking..." : response}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              onClick={startListening}
              disabled={listening || loading}
              className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {listening ? `Listening in ${selectedLang.label}...` : "Start Voice Chat"}
            </button>

            <button
              onClick={stopVoiceSession}
              className="rounded-full border border-white/10 bg-white/10 px-6 py-3 font-semibold text-slate-200 transition hover:bg-white/20"
            >
              Stop
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <label className="mb-2 block text-sm text-slate-400">Or type your question</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={`Ask BrainBuddy in ${selectedLang.label}...`}
                className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
              />
              <button
                type="submit"
                className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500"
              >
                Ask
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
