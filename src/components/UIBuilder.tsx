"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import GeneratedUIRenderer from "./GeneratedUIRenderer";
import type { GeneratedUISchema } from "@/types/ui";
import SketchOverlay from "./SketchOverlay";

type GenerateResponse = {
  ui: GeneratedUISchema;
};

export default function UIBuilder() {
  const [prompt, setPrompt] = useState<string>("");
  const [ui, setUi] = useState<GeneratedUISchema | null>(null);
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
      const data: GenerateResponse = await res.json();
      setUi(data.ui);
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
      const data: GenerateResponse = await res.json();
      setUi(data.ui);
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

      <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-4 p-4 sm:p-6 md:p-8">
        {/* Left: Prompting */}
        <div className="flex flex-col rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-4 gap-3">
          <div className="text-sm font-medium">Prompt</div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[160px] flex-1 resize-none rounded-md border border-black/10 dark:border-white/15 bg-transparent p-3 text-sm"
            placeholder="Describe the UI you want to generate..."
          />
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
            <div className="text-xs text-gray-500">The right panel updates with the generated UI.</div>
          </div>
          <div className="rounded-md border border-black/10 dark:border-white/15 p-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-1">How to use</div>
            <ol className="list-inside list-decimal space-y-1">
              <li>Describe your UI and click Generate.</li>
              <li>After it renders, click ✏️ Pen to sketch changes.</li>
              <li>Click Export to apply your sketch and regenerate.</li>
            </ol>
          </div>
        </div>

        {/* Right: Preview with overlay */}
        <div className="relative rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-950 overflow-hidden" ref={containerRef}>
          {/* Toolbar */}
          {canReprompt && (
            <div className="absolute right-2 top-2 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsSketchMode((v) => !v)}
                className={`rounded-full border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/60 backdrop-blur px-3 py-1 text-sm ${
                  isSketchMode ? "ring-2 ring-blue-500" : ""
                }`}
                title="Sketch overlay"
                aria-label="Sketch overlay"
              >
                ✏️ Pen
              </button>
            </div>
          )}

          {/* Rendered UI */}
          <div className="absolute inset-0 overflow-auto p-6">
            <GeneratedUIRenderer ui={ui} />
          </div>

          {/* Sketch overlay */}
          <SketchOverlay enabled={isSketchMode} onExport={handleExportSketch} />
        </div>
      </div>
    </div>
  );
}

