"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";

export default function PDFChatPage() { 
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file.");
        return;
      }

      setFileName(file.name);
      localStorage.setItem("uploadedPDF", file.name);
      const fileUrl = URL.createObjectURL(file);
      sessionStorage.setItem("pdfUrl", fileUrl);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      {/* Navbar */}

      <nav className="flex justify-between items-center px-8 py-5 border-b border-gray-800">

        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300"
        >
          ← Dashboard
        </Link>

        <h1 className="text-3xl font-bold">
          📄 PDF Chat
        </h1>

      </nav>

      {/* Hero */}

      <section className="max-w-5xl mx-auto px-6 py-16">

        <h2 className="text-5xl font-bold text-center">
          Chat with your PDF Notes
        </h2>

        <p className="text-center text-gray-400 mt-4 text-lg">
          Upload your study notes and ask questions instantly.
        </p>

        {/* Upload Box */}

        <div
          className="mt-12 border-2 border-dashed border-blue-500 rounded-3xl p-16 text-center bg-[#13131A]"
        >

          <div className="text-7xl">
            📄
          </div>

          <h3 className="text-2xl font-bold mt-6">
            Drag & Drop your PDF
          </h3>

          <p className="text-gray-400 mt-2">
            or choose a file from your computer
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            hidden
            onChange={handleFile}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-8 bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-lg font-semibold"
          >
            Browse PDF
          </button>

        </div>

        {/* Uploaded File */}


        {fileName && (

          <div className="mt-10 bg-[#13131A] border border-gray-800 rounded-2xl p-6">

            <h3 className="text-xl font-bold text-green-400">
              ✅ PDF Uploaded Successfully
            </h3>

            <p className="mt-3 text-gray-300">
              {fileName}
            </p>

           <button
              onClick={() => router.push("/pdf-chat/chat")}
              className="mt-6 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl"
           >
             Start Chat
           </button>

          </div>

        )}

      </section>

    </main>
  );
}