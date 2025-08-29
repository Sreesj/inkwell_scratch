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

function coerceElement(e: any): UIElement {
  // If type is missing, infer from fields
  if (e && typeof e === "object" && !e.type) {
    if (typeof e.text === "string" && e.href) {
      return { ...e, type: "text" } as UIElement;
    }
    if (typeof e.text === "string") {
      return { ...e, type: "text" } as UIElement;
    }
    if (e.children) {
      return { ...e, type: "container" } as UIElement;
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
      const asLink = (element as any).href as string | undefined;
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
      return (
        <img
          key={key}
          src={element.src ?? ""}
          alt={element.text ?? "image"}
          className={element.className}
          style={element.style}
        />
      );
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

