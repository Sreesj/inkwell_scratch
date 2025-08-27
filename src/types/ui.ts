import type React from "react";

export type UIElement = {
  id?: string;
  type: "container" | "text" | "button" | "image" | "input" | "card";
  className?: string;
  style?: React.CSSProperties;
  text?: string;
  placeholder?: string;
  src?: string;
  children?: UIElement[];
};

export type GeneratedUISchema = {
  root: UIElement;
};

export type GeneratedOutput =
  | { kind: "ui"; ui: GeneratedUISchema }
  | { kind: "code"; code: string };

