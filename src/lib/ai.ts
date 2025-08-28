import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { GeneratedUISchema, GeneratedOutput } from "@/types/ui";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || OLLAMA_MODEL;

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";

function buildSystemPrompt() {
  return [
    "You are a UI generator that outputs a strict JSON object.",
    "Always return only valid minified JSON matching this TypeScript type:",
    "type UIElement = { id?: string; type: 'container'|'text'|'button'|'image'|'input'|'card'; className?: string; style?: Record<string,string|number>; text?: string; placeholder?: string; src?: string; children?: UIElement[] };",
    "type GeneratedUISchema = { root: UIElement };",
    "- Use tailwind utility classes in className for layout and styling.",
    "- Prefer semantic structure and concise content strings.",
  ].join("\n");
}

function toDataUrlFromBase64Png(b64: string) {
  return `data:image/png;base64,${b64}`;
}

function buildStubUISchema(prompt: string, reason: string): GeneratedUISchema {
  return {
    root: {
      type: "container",
      className: "mx-auto max-w-2xl flex flex-col gap-4",
      children: [
        { type: "text", className: "text-2xl font-semibold", text: "Inkwell (stubbed UI)" },
        { type: "text", className: "text-sm text-gray-500", text: reason },
        { type: "text", className: "text-sm", text: `Prompt: ${prompt}` },
        {
          type: "card",
          children: [
            { type: "text", className: "text-lg font-medium", text: "Sample card" },
            { type: "text", className: "text-sm text-gray-500", text: "This UI was generated locally as a fallback." },
            { type: "button", text: "Primary action" },
          ],
        },
      ],
    },
  };
}

function wantsCode(prompt: string): boolean {
  if (process.env.OLLAMA_OUTPUT === "code") return true;
  return /code|html|css|javascript|react|component/i.test(prompt);
}

export async function generateUISchemaWithAI(prompt: string): Promise<GeneratedUISchema | GeneratedOutput> {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  // Try Ollama first
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.OLLAMA_API_KEY) headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
    if (process.env.OLLAMA_HEADERS) {
      try {
        Object.assign(headers, JSON.parse(process.env.OLLAMA_HEADERS));
      } catch {}
    }
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        format: "json",
        stream: false,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: `${prompt}\nReturn only JSON for GeneratedUISchema with a useful UI.` },
        ],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const content: string | undefined = data?.message?.content;
      if (content) {
        if (wantsCode(prompt)) {
          return { kind: "code", code: content } satisfies GeneratedOutput as GeneratedOutput;
        }
        return JSON.parse(content) as GeneratedUISchema;
      }
    }
  } catch (e) {
    console.warn("Ollama error, attempting cloud providers or stub:", e);
  }

  if (!hasOpenAI && !hasAnthropic) {
    return buildStubUISchema(prompt, "No AI provider is configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
  }

  if (hasOpenAI) {
    try {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
      });
      const completion = await client.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: prompt },
          { role: "user", content: "Return only JSON for GeneratedUISchema with a useful UI." },
        ],
      });
      const content = completion.choices[0]?.message?.content || "{}";
      if (wantsCode(prompt)) return { kind: "code", code: content };
      return JSON.parse(content) as GeneratedUISchema;
    } catch (e) {
      console.warn("OpenAI error, attempting Anthropic or stub:", e);
      // fall through to Anthropic or stub
    }
  }

  // Anthropic fallback
  if (hasAnthropic) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const msg = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        system: buildSystemPrompt(),
        messages: [
          { role: "user", content: prompt + "\nReturn only JSON for GeneratedUISchema with a useful UI." },
        ],
      });
      const text = msg.content[0]?.type === "text" ? (msg.content[0].text as string) : "{}";
      if (wantsCode(prompt)) return { kind: "code", code: text };
      return JSON.parse(text) as GeneratedUISchema;
    } catch (e) {
      console.warn("Anthropic error, returning stub:", e);
    }
  }

  if (wantsCode(prompt)) return { kind: "code", code: "<div style=\"padding:16px\">Stub code output (provider unavailable)</div>" };
  return buildStubUISchema(prompt, "Provider error or rate limit. Returned local stub UI.");
}

export async function repromptUISchemaWithAI(params: {
  prompt: string;
  previousUI?: GeneratedUISchema | null;
  overlayImageBase64?: string | null;
}): Promise<GeneratedUISchema | GeneratedOutput> {
  const { prompt, previousUI, overlayImageBase64 } = params;
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  // Try Ollama first (vision model when image provided)
  try {
    const refineInstruction = [
      "Refine the previous UI based on the user's sketch and prompt.",
      "Preserve overall structure but apply the indicated changes (layout, emphasis, components).",
      previousUI ? `Previous UI JSON: ${JSON.stringify(previousUI)}` : "",
    ].join("\n");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.OLLAMA_API_KEY) headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
    if (process.env.OLLAMA_HEADERS) {
      try {
        Object.assign(headers, JSON.parse(process.env.OLLAMA_HEADERS));
      } catch {}
    }
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: overlayImageBase64 ? OLLAMA_VISION_MODEL : OLLAMA_MODEL,
        format: "json",
        stream: false,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          overlayImageBase64
            ? { role: "user", content: `${prompt}\n${refineInstruction}`, images: [overlayImageBase64] }
            : { role: "user", content: `${prompt}\n${refineInstruction}` },
          { role: "user", content: "Return only JSON for GeneratedUISchema reflecting the edits." },
        ],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const content: string | undefined = data?.message?.content;
      if (content) {
        if (wantsCode(prompt)) return { kind: "code", code: content };
        return JSON.parse(content) as GeneratedUISchema;
      }
    }
  } catch (e) {
    console.warn("Ollama reprompt error, attempting cloud providers or stub:", e);
  }

  if (!hasOpenAI && !hasAnthropic) {
    return buildStubUISchema(prompt, "No AI provider is configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
  }

  const refineInstruction = [
    "Refine the previous UI based on the user's sketch and prompt.",
    "Preserve overall structure but apply the indicated changes (layout, emphasis, components).",
    previousUI ? `Previous UI JSON: ${JSON.stringify(previousUI)}` : "",
  ].join("\n");

  if (hasOpenAI) {
    try {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
      });
      const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
        { type: "text", text: `${prompt}\n${refineInstruction}` },
      ];
      if (overlayImageBase64) {
        content.push({ type: "image_url", image_url: { url: toDataUrlFromBase64Png(overlayImageBase64) } });
      }
      const completion = await client.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content },
          { role: "user", content: "Return only JSON for GeneratedUISchema reflecting the edits." },
        ],
      });
      const contentOut = completion.choices[0]?.message?.content || "{}";
      if (wantsCode(prompt)) return { kind: "code", code: contentOut };
      return JSON.parse(contentOut) as GeneratedUISchema;
    } catch (e) {
      console.warn("OpenAI reprompt error, attempting Anthropic or stub:", e);
      // fall through
    }
  }

  if (hasAnthropic) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const anthropicContentText = `${prompt}\n${refineInstruction}` +
        (overlayImageBase64 ? `\nOverlay image (base64 PNG): data:image/png;base64,${overlayImageBase64}` : "");
      const msg = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        system: buildSystemPrompt(),
        messages: [
          { role: "user", content: anthropicContentText },
        ],
      });
      const text = msg.content[0]?.type === "text" ? (msg.content[0].text as string) : "{}";
      if (wantsCode(prompt)) return { kind: "code", code: text };
      return JSON.parse(text) as GeneratedUISchema;
    } catch (e) {
      console.warn("Anthropic reprompt error, returning stub:", e);
    }
  }

  if (wantsCode(prompt)) return { kind: "code", code: "<div>Stub code (reprompt)</div>" };
  return buildStubUISchema(prompt, "Provider error or rate limit on reprompt. Returned local stub UI.");
}

