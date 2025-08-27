"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  enabled: boolean;
  onExport: (blob: Blob) => void;
};

export default function SketchOverlay({ enabled, onExport }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState<string>("#ff3b30");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);

  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const getCtx = (): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  };

  const getRelativePoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const start = useCallback((x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const move = useCallback((x: number, y: number) => {
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }, [isDrawing, strokeColor, strokeWidth]);

  const end = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    if (!enabled) return;
    const { x, y } = getRelativePoint(e.clientX, e.clientY);
    start(x, y);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!enabled) return;
    const { x, y } = getRelativePoint(e.clientX, e.clientY);
    move(x, y);
  };
  const onMouseUp = () => {
    if (!enabled) return;
    end();
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled) return;
    const t = e.touches[0];
    if (!t) return;
    const { x, y } = getRelativePoint(t.clientX, t.clientY);
    start(x, y);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!enabled) return;
    const t = e.touches[0];
    if (!t) return;
    const { x, y } = getRelativePoint(t.clientX, t.clientY);
    move(x, y);
  };
  const onTouchEnd = () => {
    if (!enabled) return;
    end();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const exportPNG = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onExport(blob);
    }, "image/png");
  };

  return (
    <div className="absolute inset-0 pointer-events-none" ref={containerRef}>
      {/* Controls visible when enabled */}
      <div className="pointer-events-auto absolute left-2 top-2 z-20 flex items-center gap-2 rounded-full bg-white/80 dark:bg-black/60 px-2 py-1 backdrop-blur">
        <input
          type="color"
          aria-label="Stroke color"
          value={strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-full border border-black/10 dark:border-white/15"
          disabled={!enabled}
        />
        <input
          type="range"
          min={1}
          max={12}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="h-2 w-28"
          disabled={!enabled}
        />
        <button
          onClick={clear}
          disabled={!enabled}
          className="rounded-md border border-black/10 dark:border-white/15 px-2 py-1 text-sm"
        >
          Clear
        </button>
        <button
          onClick={exportPNG}
          disabled={!enabled}
          className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1 text-sm"
        >
          Export
        </button>
      </div>

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-10 ${enabled ? "pointer-events-auto" : "pointer-events-none"}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />
    </div>
  );
}

