"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import GeneratedUIRenderer from "./GeneratedUIRenderer";
import CodePreview from "./CodePreview";
import type { GeneratedUISchema } from "@/types/ui";

type GenerateResponse = {
  ui: GeneratedUISchema;
};

export default function UIBuilder() {
  const [prompt, setPrompt] = useState<string>("");
  const [ui, setUi] = useState<GeneratedUISchema | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewWindow, setPreviewWindow] = useState<Window | null>(null);
  const [isSketchMode, setIsSketchMode] = useState<boolean>(false);
  const [sketchData, setSketchData] = useState<Blob | null>(null);
  const [isIntegrating, setIsIntegrating] = useState<boolean>(false);

  const hasGenerated = useMemo(() => Boolean(ui || code), [ui, code]);

  // Generate UI
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

  // Open full-screen preview
  const openFullPreview = useCallback(() => {
    if (!hasGenerated) return;

    // Create the preview HTML
    const previewContent = code || generateUIHTML(ui);
    const fullHTML = createFullScreenHTML(previewContent, true); // Enable sketch mode
    
    // Open new window
    const newWindow = window.open("", "_blank", "width=1400,height=900,scrollbars=yes,resizable=yes");
    if (newWindow) {
      newWindow.document.write(fullHTML);
      newWindow.document.close();
      setPreviewWindow(newWindow);
      
      // Listen for sketch data from the preview window
      const handleMessage = (event: MessageEvent) => {
        if (event.source === newWindow && event.data.type === 'SKETCH_DATA') {
          setSketchData(event.data.blob);
          setIsSketchMode(event.data.isActive);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Clean up when window closes
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setPreviewWindow(null);
          setIsSketchMode(false);
        }
      }, 1000);
    }
  }, [code, ui, hasGenerated]);

  // Export current code
  const exportCode = useCallback(() => {
    if (!hasGenerated) return;
    
    const content = code || generateUIHTML(ui);
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-ui.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, ui, hasGenerated]);

  // Integrate sketch with Ollama
  const integrateSketch = useCallback(async () => {
    if (!sketchData || !hasGenerated) return;
    
    setIsIntegrating(true);
    try {
      const form = new FormData();
      form.append("prompt", prompt);
      form.append("previousUI", ui ? JSON.stringify(ui) : code || "");
      form.append("image", sketchData, "sketch.png");
      
      const res = await fetch("/api/reprompt", { method: "POST", body: form });
      if (!res.ok) throw new Error("Failed to integrate sketch");
      
      const data = await res.json();
      if (data.code && typeof data.code === "string") {
        const trimmed: string = data.code.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            const parsed = JSON.parse(trimmed);
            const schema: GeneratedUISchema = parsed.root ? parsed : { root: parsed };
            setUi(schema);
            setCode(null);
          } catch {
            setCode(data.code);
            setUi(null);
          }
        } else {
          setCode(data.code);
          setUi(null);
        }
      } else if (data.ui) {
        const schema: GeneratedUISchema = data.ui.root ? data.ui : { root: data.ui };
        setUi(schema);
        setCode(null);
      }
      
      setSketchData(null);
      setIsSketchMode(false);
      
      // Refresh the preview window if it's open
      if (previewWindow && !previewWindow.closed) {
        const newContent = code || generateUIHTML(ui);
        const newHTML = createFullScreenHTML(newContent, true);
        previewWindow.document.open();
        previewWindow.document.write(newHTML);
        previewWindow.document.close();
      }
      
    } catch (err) {
      console.error("Integration error:", err);
    } finally {
      setIsIntegrating(false);
    }
  }, [sketchData, hasGenerated, prompt, ui, code, previewWindow]);

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

      <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-6 p-6 h-full min-h-0">
        {/* Left: Enhanced Prompting Panel */}
        <div className="flex flex-col rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-6 gap-4">
          <div className="text-lg font-semibold">Create Your UI</div>
          
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">Describe your application</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[200px] flex-1 resize-none rounded-lg border border-black/10 dark:border-white/15 bg-transparent p-4 text-sm leading-relaxed"
              placeholder="Describe a complete, beautiful application with specific design details, animations, and user interactions..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full inline-flex items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-6 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Generate UI
                </>
              )}
            </button>

            {hasGenerated && (
              <>
                <button
                  onClick={openFullPreview}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 px-6 py-3 text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                  Open Full Preview & Sketch
                </button>

                <button
                  onClick={exportCode}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 px-6 py-3 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Export Code
                </button>
              </>
            )}

            {sketchData && (
              <button
                onClick={integrateSketch}
                disabled={isIntegrating}
                className="w-full inline-flex items-center justify-center rounded-lg bg-green-600 text-white px-6 py-3 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isIntegrating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Integrating Sketch...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                    Integrate New Sketch
                  </>
                )}
              </button>
            )}
          </div>

          {/* Status Indicators */}
          <div className="space-y-2 text-xs">
            {previewWindow && !previewWindow.closed && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Preview window active
              </div>
            )}
            {isSketchMode && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Sketch mode enabled in preview
              </div>
            )}
            {sketchData && (
              <div className="flex items-center gap-2 text-orange-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Sketch ready for integration
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 text-xs text-gray-600 dark:text-gray-400 space-y-3">
            <div className="font-medium text-gray-900 dark:text-gray-100">Enhanced Workflow:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Write a detailed prompt describing your UI vision</li>
              <li>Click "Generate UI" to create the initial version</li>
              <li>Click "Open Full Preview" to see it in a new tab</li>
              <li>Use the sketch tools in the preview tab to draw changes</li>
              <li>Return here and click "Integrate New Sketch" to apply changes</li>
              <li>Export the final code when satisfied</li>
            </ol>
          </div>
        </div>

        {/* Right: Small Preview */}
        <div className="relative rounded-xl border border-black/10 dark:border-white/15 overflow-hidden shadow-sm bg-gray-50 dark:bg-neutral-800">
          {!hasGenerated ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-4xl mb-4">🎨</div>
                <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Ready to Create</div>
                <div className="text-sm text-gray-500 mb-4">Generate a UI to see a preview here</div>
                <div className="text-xs text-gray-400">Use "Open Full Preview" for the complete experience</div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 p-4">
              <div className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                {code ? (
                  <CodePreview code={code} className="w-full h-full scale-75 origin-top-left" />
                ) : (
                  <div className="transform scale-75 origin-top-left w-[133.33%] h-[133.33%]">
                    <GeneratedUIRenderer ui={ui} />
                  </div>
                )}
              </div>
              <div className="absolute top-6 right-6 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Preview (scaled)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to generate HTML from UI schema
function generateUIHTML(ui: GeneratedUISchema | null): string {
  if (!ui) return "";
  // This would use your existing GeneratedUIRenderer logic
  // For now, return a placeholder
  return "<div>UI Schema Rendering...</div>";
}

// Helper function to create full-screen HTML with sketch overlay
function createFullScreenHTML(content: string, enableSketch: boolean = false): string {
  const sketchScript = enableSketch ? `
    <script>
      // Sketch functionality will be injected here
      let isDrawing = false;
      let canvas, ctx;
      
      window.addEventListener('load', function() {
        // Create sketch overlay
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:10000;pointer-events:none;';
        document.body.appendChild(canvas);
        
        ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Add sketch controls
        const controls = document.createElement('div');
        controls.innerHTML = \`
          <button onclick="toggleSketch()" style="position:fixed;top:20px;right:20px;z-index:10001;padding:10px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer;">✏️ Toggle Sketch</button>
          <button onclick="clearSketch()" style="position:fixed;top:20px;right:120px;z-index:10001;padding:10px;background:#dc3545;color:white;border:none;border-radius:5px;cursor:pointer;">Clear</button>
          <button onclick="exportSketch()" style="position:fixed;top:20px;right:190px;z-index:10001;padding:10px;background:#28a745;color:white;border:none;border-radius:5px;cursor:pointer;">Save Sketch</button>
        \`;
        document.body.appendChild(controls);
      });
      
      function toggleSketch() {
        canvas.style.pointerEvents = canvas.style.pointerEvents === 'none' ? 'auto' : 'none';
        window.parent.postMessage({type: 'SKETCH_DATA', isActive: canvas.style.pointerEvents === 'auto'}, '*');
      }
      
      function clearSketch() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      function exportSketch() {
        canvas.toBlob(function(blob) {
          window.parent.postMessage({type: 'SKETCH_DATA', blob: blob, isActive: true}, '*');
        });
      }
      
      // Drawing logic
      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDraw);
      
      function startDraw(e) {
        if (canvas.style.pointerEvents === 'none') return;
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
      
      function draw(e) {
        if (!isDrawing || canvas.style.pointerEvents === 'none') return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      function stopDraw() {
        isDrawing = false;
      }
    </script>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Full Preview - Inkwell</title>
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100vh; overflow: auto; }
      * { box-sizing: border-box; }
    </style>
</head>
<body>
    ${content}
    ${sketchScript}
</body>
</html>`;
}
