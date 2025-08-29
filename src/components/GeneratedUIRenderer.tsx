"use client";

import React from "react";
import type { GeneratedUISchema, UIElement } from "@/types/ui";

type Props = {
  ui?: GeneratedUISchema | null;
  onAction?: (actionId: string) => void;
};

export default function GeneratedUIRenderer({ ui, onAction }: Props) {
  if (!ui) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Nothing generated yet.
      </div>
    );
  }

  return <div className="w-full h-full">{renderElement(coerceElement(ui.root), onAction)}</div>;
}

function coerceElement(e: unknown): UIElement {
  // If type is missing, infer from fields
  if (e && typeof e === "object" && !(e as UIElement).type) {
    const maybe = e as Partial<UIElement> & { [k: string]: unknown };
    if (typeof maybe.text === "string" && maybe.href) {
      return { ...(maybe as object), type: "text" } as UIElement;
    }
    if (typeof maybe.text === "string") {
      return { ...(maybe as object), type: "text" } as UIElement;
    }
    if (maybe.children) {
      return { ...(maybe as object), type: "container" } as UIElement;
    }
  }
  return e as UIElement;
}

function renderElement(element: UIElement, onAction?: (actionId: string) => void): React.ReactNode {
  const key = element.id ?? Math.random().toString(36).slice(2);

  switch (element.type) {
    case "container": {
      return (
        <div key={key} className={element.className} style={element.style}>
          {element.children?.map((child) => renderElement(coerceElement(child), onAction))}
        </div>
      );
    }
    case "card": {
      return (
        <div
          key={key}
          className={
            element.className ??
            "rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 p-6 shadow-sm"
          }
          style={element.style}
        >
          {element.children?.map((child) => renderElement(coerceElement(child), onAction))}
        </div>
      );
    }
    case "text": {
      const asLink = element.href as string | undefined;
      if (asLink) {
        return (
          <a key={key} href={asLink} className={element.className} style={element.style}>
            {element.text}
          </a>
        );
      }
      return <p key={key} className={element.className} style={element.style}>{element.text}</p>;
    }
    case "button": {
      return (
        <button
          key={key}
          className={
            element.className ??
            "inline-flex items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90"
          }
          style={element.style}
          onClick={() => onAction?.(element.id ?? "button")}
        >
          {element.text ?? "Button"}
        </button>
      );
    }
    case "image": {
      // Use standard img for flexibility; parent can place Next/Image if needed
      // Map common model outputs to working routes/assets
      const src = (() => {
        const raw = (element.src ?? "").trim();
        if (!raw) return "/images/placeholder";
        // Allow remote URLs as-is
        if (/^https?:\/\//i.test(raw)) return raw;
        // If already /images/name or /images/name.ext -> /images/name
        const m = raw.match(/\/?images\/(.+?)(\.[a-z0-9]+)?$/i);
        if (m) return `/images/${m[1]}`;
        // Otherwise take the filename (strip extension) and serve from /images/[name]
        const parts = raw.split("/").filter(Boolean);
        const fname = parts[parts.length - 1] ?? "placeholder";
        const nameOnly = fname.replace(/\.[a-z0-9]+$/i, "");
        return `/images/${nameOnly}`;
      })();
      return <img key={key} src={src} alt={element.text ?? "image"} className={element.className} style={element.style} />;
    }
    case "input": {
      return (
        <input
          key={key}
          placeholder={element.placeholder ?? ""}
          className={
            element.className ??
            "w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm"
          }
          style={element.style}
        />
      );
    }
    default: {
      return null;
    }
  }
}

