"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function PDFChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = sessionStorage.getItem("pdfUrl");
    if (url) {
      setPdfUrl(url);
    }
  }, []);

  async function sendMessage() {
    const text = question.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text,
      },
    ]);

    setQuestion("");
    setLoading(true);

    let pdfBase64 = null;
    if (pdfUrl) {
      try {
        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error("Blob fetch failed");
        const blob = await res.blob();
        pdfBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Failed to read PDF blob", e);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: "I can't read the PDF right now (it may have been cleared if the page reloaded). Please go back and upload the PDF again.",
          },
        ]);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/pdf-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: text, pdfBase64 }),
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error("The PDF file is too large to process. Please try a smaller PDF.");
        }
        
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          throw new Error("Server error occurred while connecting to the assistant.");
        }
        throw new Error(errorData.answer || "Unable to contact the PDF assistant right now.");
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.answer || "No response received.",
        },
      ]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: error?.message || "Unable to contact the PDF assistant right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-screen flex flex-col bg-[#09090B] text-white">
      <nav className="shrink-0 flex justify-between items-center px-8 py-5 border-b border-gray-800">
        <Link href="/pdf-chat" className="text-blue-400">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold">
          📄 Chat with PDF
        </h1>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: PDF Viewer */}
        <div className="flex-1 border-r border-gray-800 p-4 hidden md:flex flex-col">
          {pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full rounded-2xl bg-white border border-gray-800" 
              title="PDF Viewer"
            />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-[#13131A] rounded-2xl border border-gray-800">
               <p className="text-gray-400">No PDF loaded. Please go back and upload a PDF.</p>
             </div>
          )}
        </div>

        {/* Right Side: Chat */}
        <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col p-4">
          <div className="flex-1 bg-[#13131A] rounded-2xl border border-gray-800 overflow-y-auto p-6 mb-4">
            {messages.length === 0 ? (
              <div className="text-center mt-20">
                <h2 className="text-3xl font-bold text-blue-400">
                  Ask anything from your PDF
                </h2>

                <p className="text-gray-400 mt-3">
                  PDF AI will answer your questions here.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-5 flex ${
                    msg.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xl px-5 py-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-blue-600"
                        : "bg-gray-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="text-gray-400 mt-4">PDF assistant is thinking...</div>
            )}
          </div>

          <div className="flex gap-4 shrink-0">
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-[#13131A] border border-gray-700 rounded-xl p-4 resize-none outline-none"
            />

            <button
              onClick={() => void sendMessage()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl disabled:opacity-50 shrink-0"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}