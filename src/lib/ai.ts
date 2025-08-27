import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { GeneratedUISchema } from "@/types/ui";

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

export async function generateUISchemaWithAI(prompt: string): Promise<GeneratedUISchema> {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  if (!hasOpenAI && !hasAnthropic) {
    throw new Error("No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
  }

  if (hasOpenAI) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    return JSON.parse(content) as GeneratedUISchema;
  }

  // Anthropic fallback
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
  return JSON.parse(text) as GeneratedUISchema;
}

export async function repromptUISchemaWithAI(params: {
  prompt: string;
  previousUI?: GeneratedUISchema | null;
  overlayImageBase64?: string | null;
}): Promise<GeneratedUISchema> {
  const { prompt, previousUI, overlayImageBase64 } = params;
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  if (!hasOpenAI && !hasAnthropic) {
    throw new Error("No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
  }

  const refineInstruction = [
    "Refine the previous UI based on the user's sketch and prompt.",
    "Preserve overall structure but apply the indicated changes (layout, emphasis, components).",
    previousUI ? `Previous UI JSON: ${JSON.stringify(previousUI)}` : "",
  ].join("\n");

  if (hasOpenAI) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    return JSON.parse(contentOut) as GeneratedUISchema;
  }

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
  return JSON.parse(text) as GeneratedUISchema;
}

