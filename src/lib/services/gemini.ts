import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private apiKey: string | undefined;
  private modelId: string;
  private client: GoogleGenerativeAI | null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelId = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    this.client = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
  }

  async generateUI(userPrompt: string, context: { brand?: string; imageUrl?: string } = {}): Promise<string> {
    if (!this.client) {
      return `<!-- Stub: Gemini not configured -->\n<div class="min-h-screen p-8">\n  <h1 class="text-3xl font-semibold">${context.brand || "Inkwell"}</h1>\n  <p class="mt-2 text-gray-600">${userPrompt}</p>\n</div>`;
    }

    const model = this.client.getGenerativeModel({ model: this.modelId });
    const system = [
      "You generate production-ready UI as HTML with Tailwind CSS.",
      "Rules:",
      "- Output only HTML (no markdown, no code fences, no explanations).",
      "- Use semantic HTML and responsive Tailwind classes.",
      "- Do not reference external URLs; prefer provided /images/* assets.",
      context.imageUrl ? `- Use this hero or reference image when suitable: ${context.imageUrl}` : "",
    ].filter(Boolean).join("\n");

    const prompt = [
      system,
      "\nUser Requirements:\n",
      userPrompt,
    ].join("");

    const result = await model.generateContent([{ text: prompt }]);
    const text = result.response.text() || "";
    return stripCodeFences(text).trim();
  }
}

function stripCodeFences(s: string): string {
  // Remove ```html ... ``` or ``` ... ``` fences if present
  const fence = /^```[a-zA-Z]*\n([\s\S]*?)\n```$/m;
  const m = s.match(fence);
  if (m) return m[1];
  return s;
}

