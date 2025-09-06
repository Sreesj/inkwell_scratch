"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import GeneratedUIRenderer from "./GeneratedUIRenderer";
import CodePreview from "./CodePreview";
import type { GeneratedUISchema } from "@/types/ui";
import SketchOverlay from "./SketchOverlay";

type GenerateResponse = {
  ui: GeneratedUISchema;
};

export default function UIBuilder() {
  const [prompt, setPrompt] = useState<string>("");
  const [ui, setUi] = useState<GeneratedUISchema | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSketchMode, setIsSketchMode] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const canReprompt = useMemo(() => Boolean(ui), [ui]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("Failed to generate UI");
      const data = await res.json();
      // Normalize: if code contains JSON, parse and render as UI
      if (data.code && typeof data.code === "string") {
        const trimmed: string = data.code.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            const parsed = JSON.parse(trimmed);
            const schema: GeneratedUISchema = parsed.root ? parsed : { root: parsed };
            setUi(schema);
            setCode(null);
            return;
          } catch {
            // fall through to render as code
          }
        }
        setCode(data.code);
        setUi(null);
      } else if (data.ui) {
        const schema: GeneratedUISchema = data.ui.root ? data.ui : { root: data.ui };
        setUi(schema);
        setCode(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt]);

  const handleExportSketch = useCallback(async (blob: Blob) => {
    if (!ui) return;
    try {
      const form = new FormData();
      form.append("prompt", prompt);
      form.append("previousUI", JSON.stringify(ui));
      form.append("image", blob, "overlay.png");
      const res = await fetch("/api/reprompt", { method: "POST", body: form });
      if (!res.ok) throw new Error("Failed to reprompt with sketch");
      const data = await res.json();
      if (data.code && typeof data.code === "string") {
        const trimmed: string = data.code.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            const parsed = JSON.parse(trimmed);
            const schema: GeneratedUISchema = parsed.root ? parsed : { root: parsed };
            setUi(schema);
            setCode(null);
            setIsSketchMode(false);
            return;
          } catch {}
        }
        setCode(data.code);
        setUi(null);
      } else if (data.ui) {
        const schema: GeneratedUISchema = data.ui.root ? data.ui : { root: data.ui };
        setUi(schema);
        setCode(null);
      }
      setIsSketchMode(false);
    } catch (err) {
      console.error(err);
    }
  }, [prompt, ui]);

  return (
    <div className="grid grid-rows-[auto_1fr] h-[100dvh]">
      <header className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 border-b border-black/10 dark:border-white/15 bg-white/70 dark:bg-neutral-900/70 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black text-xs font-bold">I</span>
          <span className="text-sm font-semibold">Inkwell</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/profile" className="text-xs hover:underline">Profile</a>
          <div className="text-xs text-gray-500">Sketch-to-UI Builder</div>
        </div>
      </header>

      {/* FIXED: Force full height for the main grid */}
      <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-4 p-4 sm:p-6 md:p-8 h-full min-h-0">
        {/* Left: Prompting */}
        <div className="flex flex-col rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-4 gap-3">
          <div className="text-sm font-medium">Prompt</div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[160px] flex-1 resize-none rounded-md border border-black/10 dark:border-white/15 bg-transparent p-3 text-sm"
            placeholder="Describe the full application you want to generate..."
          />
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
            <div className="text-xs text-gray-500">Full page apps render on the right.</div>
          </div>
          <div className="rounded-md border border-black/10 dark:border-white/15 p-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-1">Examples to try</div>
            <ul className="list-inside list-disc space-y-1">
              <li>"Complete e-commerce website for selling sneakers"</li>
              <li>"Full dashboard for project management app"</li>
              <li>"Landing page for a fitness app"</li>
              <li>"Portfolio website for a web developer"</li>
            </ul>
          </div>
          <div className="rounded-md border border-black/10 dark:border-white/15 p-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-1">How to iterate</div>
            <ol className="list-inside list-decimal space-y-1">
              <li>Generate a full application above.</li>
              <li>Click ✏️ Pen to sketch changes directly on it.</li>
              <li>Click Export to apply your sketch and regenerate.</li>
            </ol>
          </div>
        </div>

        {/* Right: Full-height Preview Canvas - FIXED */}
        <div className="relative rounded-xl border border-black/10 dark:border-white/15 overflow-hidden shadow-sm h-full min-h-0" ref={containerRef}>
          {/* Floating Toolbar */}
          {(ui || code) && (
            <div className="absolute right-2 top-2 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsSketchMode((v) => !v)}
                className={`rounded-full border border-black/10 dark:border-white/15 bg-white/90 dark:bg-black/70 backdrop-blur px-3 py-1 text-sm shadow-lg ${
                  isSketchMode ? "ring-2 ring-blue-500" : ""
                }`}
                title="Sketch overlay"
                aria-label="Sketch overlay"
              >
                ✏️ Pen
              </button>
            </div>
          )}

          {/* FIXED: Full-height content container */}
          <div className="absolute inset-0 w-full h-full">
            {!ui && !code ? (
              // Empty state with subtle background
              <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-4xl mb-4">🎨</div>
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Ready to create</div>
                  <div className="text-sm text-gray-500">Enter a prompt to generate a full application</div>
                </div>
              </div>
            ) : code ? (
              // FIXED: Force full height for CodePreview
              <CodePreview code={code} className="w-full h-full block" />
            ) : (
              // FIXED: Force full height for UI renderer
              <div className="w-full h-full">
                <GeneratedUIRenderer ui={ui} />
              </div>
            )}
          </div>

          {/* Sketch overlay */}
          <SketchOverlay enabled={isSketchMode} onExport={handleExportSketch} />
        </div>
      </div>
    </div>
  );
}
