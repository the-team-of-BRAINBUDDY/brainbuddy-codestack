"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Tool = "pen" | "eraser" | "line" | "rect" | "circle" | "text";

type PlacedImage = {
  id: number;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const PRESET_COLORS = [
  "#ffffff", "#f87171", "#fb923c", "#fbbf24",
  "#4ade80", "#38bdf8", "#a78bfa", "#f472b6",
  "#111827", "#6b7280",
];

export default function Whiteboard() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);  // shape preview + text cursor
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const isDrawing  = useRef(false);
  const startPos   = useRef({ x: 0, y: 0 });

  // ── text-on-canvas state ───────────────────────────────────────
  const typingBuffer  = useRef("");          // what has been typed so far
  const textCursorPos = useRef<{ x: number; y: number } | null>(null);
  const isTyping      = useRef(false);
  const blinkTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursorVisible = useRef(true);
  // We need a React state to trigger re-renders for cursor blink
  const [, forceUpdate] = useState(0);

  // ── tool / style state ─────────────────────────────────────────
  const [tool,       setTool]       = useState<Tool>("pen");
  const [color,      setColor]      = useState("#ffffff");
  const [brushSize,  setBrushSize]  = useState(4);
  const [fontSize,   setFontSize]   = useState(22);
  const [filled,     setFilled]     = useState(false);
  const [aiMessage,  setAiMessage]  = useState("Draw, add text, or upload an image — then click 🤖 Solve with AI.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── image overlay state ────────────────────────────────────────
  const [placedImages, setPlacedImages] = useState<PlacedImage[]>([]);
  const [selectedImgId, setSelectedImgId] = useState<number | null>(null);
  const dragRef   = useRef<{ id: number; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ id: number; startX: number; startY: number; origW: number; origH: number } | null>(null);

  // ── helpers ────────────────────────────────────────────────────
  const getCtx     = () => canvasRef.current?.getContext("2d")  ?? null;
  const getOverlay = () => overlayRef.current?.getContext("2d") ?? null;

  // ── init canvas ────────────────────────────────────────────────
  useEffect(() => {
    const canvas  = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    canvas.width = overlay.width  = 1400;
    canvas.height = overlay.height = 680;
    const ctx = getCtx()!;
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    saveHistory();
  }, []);

  // ── history ────────────────────────────────────────────────────
  const saveHistory = () => {
    const canvas = canvasRef.current;
    const ctx    = getCtx();
    if (!canvas || !ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snap);
    if (historyRef.current.length > 50) historyRef.current.shift();
  };

  const undo = useCallback(() => {
    const ctx = getCtx();
    if (!ctx || historyRef.current.length <= 1) return;
    historyRef.current.pop();
    ctx.putImageData(historyRef.current[historyRef.current.length - 1], 0, 0);
  }, []);

  // ── keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Global undo (only when not typing on canvas)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !isTyping.current) undo();
      // Delete selected image
      if (e.key === "Delete" && selectedImgId !== null) {
        setPlacedImages((prev) => prev.filter((i) => i.id !== selectedImgId));
        setSelectedImgId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, selectedImgId]);

  // ── CANVAS COORDINATES (accounts for CSS scaling) ──────────────
  const getCanvasPos = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left)  * (canvas.width  / rect.width),
      y: (e.clientY - rect.top)   * (canvas.height / rect.height),
    };
  };

  // ══════════════════════════════════════════════════════════════
  //  TEXT-ON-CANVAS ENGINE
  // ══════════════════════════════════════════════════════════════

  /** Draw the live text + blinking cursor on the overlay canvas */
  const renderTextCursor = useCallback(() => {
    const ov      = getOverlay();
    const overlay = overlayRef.current;
    const pos     = textCursorPos.current;
    if (!ov || !overlay || !pos) return;

    ov.clearRect(0, 0, overlay.width, overlay.height);

    const text = typingBuffer.current;
    ov.font      = `${fontSize}px Inter, sans-serif`;
    ov.fillStyle = color;

    // Draw typed text
    if (text) ov.fillText(text, pos.x, pos.y);

    // Measure text width to position cursor
    const textW = ov.measureText(text).width;

    // Draw blinking cursor
    if (cursorVisible.current) {
      ov.beginPath();
      ov.strokeStyle = color;
      ov.lineWidth   = 2;
      const cx = pos.x + textW;
      const lineH = fontSize;
      ov.moveTo(cx, pos.y - lineH * 0.8);
      ov.lineTo(cx, pos.y + lineH * 0.2);
      ov.stroke();
    }
  }, [color, fontSize]);

  /** Start blinking cursor loop */
  const startBlink = useCallback(() => {
    if (blinkTimer.current) clearInterval(blinkTimer.current);
    cursorVisible.current = true;
    blinkTimer.current = setInterval(() => {
      cursorVisible.current = !cursorVisible.current;
      renderTextCursor();
    }, 530);
  }, [renderTextCursor]);

  /** Stop blinking and clear overlay */
  const stopBlink = useCallback(() => {
    if (blinkTimer.current) { clearInterval(blinkTimer.current); blinkTimer.current = null; }
    const ov = getOverlay();
    const overlay = overlayRef.current;
    if (ov && overlay) ov.clearRect(0, 0, overlay.width, overlay.height);
  }, []);

  /** Commit the typed text permanently onto the main canvas */
  const commitText = useCallback(() => {
    const ctx = getCtx();
    const pos = textCursorPos.current;
    if (!ctx || !pos || !typingBuffer.current.trim()) {
      // cancel without committing
      stopBlink();
      isTyping.current      = false;
      textCursorPos.current = null;
      typingBuffer.current  = "";
      return;
    }
    stopBlink();
    ctx.font      = `${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(typingBuffer.current, pos.x, pos.y);
    saveHistory();
    isTyping.current      = false;
    textCursorPos.current = null;
    typingBuffer.current  = "";
    forceUpdate((n) => n + 1);
  }, [color, fontSize, stopBlink]);

  /** Handle keystrokes while in text mode */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isTyping.current) return;
      e.preventDefault(); // stop page scroll etc.

      if (e.key === "Enter") {
        commitText();
        return;
      }
      if (e.key === "Escape") {
        stopBlink();
        isTyping.current      = false;
        textCursorPos.current = null;
        typingBuffer.current  = "";
        const ov = getOverlay();
        const overlay = overlayRef.current;
        if (ov && overlay) ov.clearRect(0, 0, overlay.width, overlay.height);
        return;
      }
      if (e.key === "Backspace") {
        typingBuffer.current = typingBuffer.current.slice(0, -1);
      } else if (e.key.length === 1) {
        typingBuffer.current += e.key;
      }
      renderTextCursor();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commitText, renderTextCursor, stopBlink]);

  // Clean up blink on unmount
  useEffect(() => () => stopBlink(), [stopBlink]);

  // ══════════════════════════════════════════════════════════════
  //  DRAWING HANDLERS
  // ══════════════════════════════════════════════════════════════

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setSelectedImgId(null);
    const pos = getCanvasPos(e);

    if (tool === "text") {
      // Commit any previous text first
      if (isTyping.current) commitText();

      // Start new text session at clicked position
      textCursorPos.current = pos;
      typingBuffer.current  = "";
      isTyping.current      = true;
      startBlink();
      renderTextCursor();
      return;
    }

    // If was typing and click another tool area — commit
    if (isTyping.current) commitText();

    isDrawing.current = true;
    startPos.current  = pos;

    if (tool === "pen" || tool === "eraser") {
      const ctx = getCtx()!;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? "#111827" : color;
      ctx.lineWidth   = tool === "eraser" ? brushSize * 4 : brushSize;
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const pos = getCanvasPos(e);

    if (tool === "pen" || tool === "eraser") {
      const ctx = getCtx()!;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      return;
    }

    // Shape preview
    const ov      = getOverlay();
    const overlay = overlayRef.current;
    if (!ov || !overlay) return;
    ov.clearRect(0, 0, overlay.width, overlay.height);
    ov.strokeStyle = color;
    ov.fillStyle   = color;
    ov.lineWidth   = brushSize;
    ov.lineCap     = "round";
    const { x: sx, y: sy } = startPos.current;

    if (tool === "line") {
      ov.beginPath(); ov.moveTo(sx, sy); ov.lineTo(pos.x, pos.y); ov.stroke();
    } else if (tool === "rect") {
      ov.beginPath(); ov.rect(sx, sy, pos.x - sx, pos.y - sy);
      filled ? ov.fill() : ov.stroke();
    } else if (tool === "circle") {
      const rx = Math.abs(pos.x - sx) / 2, ry = Math.abs(pos.y - sy) / 2;
      ov.beginPath();
      ov.ellipse(sx + (pos.x - sx) / 2, sy + (pos.y - sy) / 2, rx, ry, 0, 0, Math.PI * 2);
      filled ? ov.fill() : ov.stroke();
    }
  };

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const pos = getCanvasPos(e);
    const ctx = getCtx();
    const ov  = getOverlay();
    const overlay = overlayRef.current;
    if (!ctx) return;

    if (tool === "pen" || tool === "eraser") { ctx.closePath(); saveHistory(); return; }
    if (ov && overlay) ov.clearRect(0, 0, overlay.width, overlay.height);

    const { x: sx, y: sy } = startPos.current;
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = brushSize; ctx.lineCap = "round";

    if (tool === "line") {
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    } else if (tool === "rect") {
      ctx.beginPath(); ctx.rect(sx, sy, pos.x - sx, pos.y - sy);
      filled ? ctx.fill() : ctx.stroke();
    } else if (tool === "circle") {
      const rx = Math.abs(pos.x - sx) / 2, ry = Math.abs(pos.y - sy) / 2;
      ctx.beginPath();
      ctx.ellipse(sx + (pos.x - sx) / 2, sy + (pos.y - sy) / 2, rx, ry, 0, 0, Math.PI * 2);
      filled ? ctx.fill() : ctx.stroke();
    }
    saveHistory();
  };

  // ── Clear ──────────────────────────────────────────────────────
  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx    = getCtx();
    if (!canvas || !ctx) return;
    if (isTyping.current) { stopBlink(); isTyping.current = false; textCursorPos.current = null; typingBuffer.current = ""; }
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    saveHistory();
    setPlacedImages([]);
  };

  // ── Download (flatten images onto canvas) ──────────────────────
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const offscreen = document.createElement("canvas");
    offscreen.width  = canvas.width;
    offscreen.height = canvas.height;
    const ctx2 = offscreen.getContext("2d")!;
    ctx2.drawImage(canvas, 0, 0);

    // Composite placed images
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    placedImages.forEach((pi) => {
      const img = new Image(); img.src = pi.src;
      ctx2.drawImage(img, pi.x * scaleX, pi.y * scaleY, pi.w * scaleX, pi.h * scaleY);
    });

    const link = document.createElement("a");
    link.download = "BrainBuddy-Whiteboard.png";
    link.href = offscreen.toDataURL("image/png");
    link.click();
  };

  // ── Image upload (HTML overlay) ────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect  = canvas.getBoundingClientRect();
        const maxW  = rect.width * 0.45;
        const scale = Math.min(maxW / img.width, 1);
        setPlacedImages((prev) => [
          ...prev,
          { id: Date.now(), src: reader.result as string, x: 40, y: 40, w: img.width * scale, h: img.height * scale },
        ]);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Image drag / resize ────────────────────────────────────────
  const onImgMouseDown = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); e.preventDefault();
    setSelectedImgId(id);
    const img = placedImages.find((i) => i.id === id);
    if (!img) return;
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: img.x, origY: img.y };
  };

  const onResizeMouseDown = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); e.preventDefault();
    const img = placedImages.find((i) => i.id === id);
    if (!img) return;
    resizeRef.current = { id, startX: e.clientX, startY: e.clientY, origW: img.w, origH: img.h };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const { id, startX, startY, origX, origY } = dragRef.current;
        setPlacedImages((prev) =>
          prev.map((img) => img.id === id ? { ...img, x: origX + e.clientX - startX, y: origY + e.clientY - startY } : img)
        );
      }
      if (resizeRef.current) {
        const { id, startX, startY, origW, origH } = resizeRef.current;
        const newW = Math.max(60, origW + e.clientX - startX);
        setPlacedImages((prev) =>
          prev.map((img) => img.id === id ? { ...img, w: newW, h: newW * (origH / origW) } : img)
        );
      }
    };
    const onUp = () => { dragRef.current = null; resizeRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // ── AI Solve ───────────────────────────────────────────────────
  const askAI = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isTyping.current) commitText();
    setIsAnalyzing(true);
    setAiMessage("Analyzing your whiteboard with AI...");
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const res  = await fetch("/api/ai", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Analyze this whiteboard. Solve any math equations step by step, explain any diagrams, and summarize any notes.",
          imageBase64: dataUrl.split(",")[1],
          mimeType: "image/png",
        }),
      });
      const data = await res.json();
      setAiMessage(data.answer || "No response received.");
    } catch {
      setAiMessage("Unable to analyze the whiteboard right now.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const TOOLS: { id: Tool; icon: string; label: string }[] = [
    { id: "pen",    icon: "✏️", label: "Pen"    },
    { id: "eraser", icon: "🧹", label: "Eraser" },
    { id: "line",   icon: "╱",  label: "Line"   },
    { id: "rect",   icon: "▭",  label: "Rect"   },
    { id: "circle", icon: "◯",  label: "Circle" },
    { id: "text",   icon: "T",  label: "Text"   },
  ];

  const cursor = tool === "text" ? "text" : tool === "eraser" ? "cell" : "crosshair";

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <Link href="/" className="text-blue-400 hover:text-blue-300">← Dashboard</Link>
        <h1 className="text-2xl font-bold">🖊 AI Whiteboard</h1>
        <div className="flex gap-3">
          <button onClick={undo} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl text-sm">↩ Undo</button>
          <button onClick={clearBoard} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm">🗑 Clear</button>
        </div>
      </nav>

      <div className="max-w-[1480px] mx-auto px-4 py-5">

        {/* Toolbar */}
        <div className="bg-[#13131A] rounded-2xl border border-gray-800 p-4 mb-4 flex flex-wrap gap-4 items-center">

          {/* Tools */}
          <div className="flex gap-2">
            {TOOLS.map((t) => (
              <button key={t.id} onClick={() => { if (isTyping.current) commitText(); setTool(t.id); }}
                title={t.label}
                className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center transition ${
                  tool === t.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-700/40"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                }`}>
                {t.icon}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-gray-700" />

          {/* Colors */}
          <div className="flex gap-2 items-center flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                style={{ background: c }}
                className={`w-7 h-7 rounded-full border-2 transition ${color === c ? "border-white scale-110" : "border-gray-600 hover:scale-105"}`} />
            ))}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              title="Custom color"
              className="w-7 h-7 rounded-full cursor-pointer border-2 border-gray-600 bg-transparent" />
          </div>

          <div className="w-px h-8 bg-gray-700" />

          {/* Brush size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">Size: {brushSize}px</span>
            <input type="range" min="1" max="30" value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-blue-500" />
          </div>

          {/* Font size — text tool only */}
          {tool === "text" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">Font: {fontSize}px</span>
              <input type="range" min="10" max="96" value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-24 accent-blue-500" />
            </div>
          )}

          {/* Fill toggle — shapes */}
          {(tool === "rect" || tool === "circle") && (
            <button onClick={() => setFilled(!filled)}
              className={`px-3 py-1.5 rounded-xl text-sm transition ${filled ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}>
              {filled ? "Filled ●" : "Outline ○"}
            </button>
          )}

          <div className="w-px h-8 bg-gray-700" />

          <button onClick={() => fileInputRef.current?.click()}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-sm">
            🖼 Upload Image
          </button>

          <button onClick={downloadImage}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm">
            📥 Download PNG
          </button>

          <button onClick={askAI} disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-semibold">
            {isAnalyzing ? "⏳ Analyzing..." : "🤖 Solve with AI"}
          </button>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        {/* Text tool hint */}
        {tool === "text" && (
          <div className="mb-3 bg-blue-900/30 border border-blue-700/40 rounded-xl px-4 py-2 text-sm text-blue-300">
            💡 <strong>Text mode</strong> — Click anywhere on the whiteboard and start typing. Press <strong>Enter</strong> to stamp text. Press <strong>Esc</strong> to cancel.
          </div>
        )}

        {/* Canvas wrapper */}
        <div className="relative overflow-auto rounded-2xl border border-gray-700 shadow-2xl" style={{ cursor }}>

          {/* Main canvas */}
          <canvas ref={canvasRef} className="block w-full"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />

          {/* Overlay (shapes preview + live text + cursor) */}
          <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* ── Image overlays ── */}
          {placedImages.map((img) => (
            <div key={img.id}
              style={{ position: "absolute", left: img.x, top: img.y, width: img.w, height: img.h, zIndex: 10 }}
              className={`group ${selectedImgId === img.id ? "ring-2 ring-blue-500" : ""}`}
              onMouseDown={(e) => onImgMouseDown(e, img.id)}>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="placed" draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "fill", display: "block", userSelect: "none" }} />

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); setPlacedImages((p) => p.filter((i) => i.id !== img.id)); setSelectedImgId(null); }}
                className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full text-xs items-center justify-center opacity-0 group-hover:flex transition shadow">✕</button>

              {/* Resize handle */}
              <div onMouseDown={(e) => onResizeMouseDown(e, img.id)}
                className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-tl-md cursor-se-resize opacity-0 group-hover:flex items-center justify-center transition"
                style={{ zIndex: 20 }}>
                <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1 8L8 1M4 8L8 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>

              {/* Size label */}
              <span className="absolute -bottom-6 left-0 text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                {Math.round(img.w)} × {Math.round(img.h)}px · drag=move · corner=resize · ✕=delete
              </span>
            </div>
          ))}
        </div>

        {/* AI panel */}
        <div className="mt-5 bg-[#13131A] border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-blue-400 mb-3">🤖 AI Analysis</h2>
          <div className="rounded-xl bg-[#09090B] p-5 border border-gray-700 max-h-48 overflow-y-auto">
            <p className="text-gray-300 whitespace-pre-wrap text-sm leading-7">{aiMessage}</p>
          </div>
        </div>

        {/* Hint bar */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
          <span>✏️ Pen / 🧹 Eraser — freehand</span>
          <span>╱ ▭ ◯ — drag to draw shapes</span>
          <span className="text-blue-400 font-medium">T Text — click canvas → type → Enter to stamp · Esc cancel</span>
          <span className="text-purple-400 font-medium">🖼 Image — drag to move, corner to resize</span>
          <span>↩ Undo (Ctrl+Z) · Delete = remove selected image</span>
        </div>
      </div>
    </main>
  );
}