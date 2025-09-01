import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export type GenerateOptions = {
  imageUrl?: string;
  isIteration?: boolean;
  baseCode?: string;
};

export class GeminiService {
  private genAI: GoogleGenerativeAI | null;
  private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null;

  constructor() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    const modelId = process.env.GENAI_MODEL || "gemini-2.5-pro";
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    this.model = this.genAI
      ? this.genAI.getGenerativeModel({
          model: modelId,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        })
      : null;
  }

  async generateUI(userPrompt: string, options: GenerateOptions = {}): Promise<GeminiUIResult> {
    try {
      if (!this.model) {
        return this.processUIResponse(
          `<div class="min-h-screen p-8"><h1 class="text-2xl font-semibold mb-2">Inkwell</h1><p class="text-gray-600">${escapeHtml(
            userPrompt
          )}</p></div>`,
          options
        );
      }

      const enhancedPrompt = this.buildUIPrompt(userPrompt, options);
      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();
      return this.processUIResponse(text, options);
    } catch (error: unknown) {
      const err = error as { message?: string } | string;
      const msg = typeof err === "string" ? err : String(err?.message || err);
      if (/quota|429/i.test(msg)) throw new Error("QUOTA_EXCEEDED");
      if (/invalid api key|INVALID_API_KEY/i.test(msg)) throw new Error("INVALID_API_KEY");
      throw new Error("GENERATION_FAILED");
    }
  }

  async generateIteration(originalUI: { description?: string; code?: string }, changes: string, context: { iteration?: number } = {}) {
    const iterationPrompt = [
      "TASK: Modify existing UI based on user requirements",
      "\nORIGINAL UI CONTEXT:",
      originalUI?.description || "",
      "\nREQUESTED CHANGES:",
      changes,
      `\nCURRENT ITERATION: ${context.iteration || 1}`,
      "\nGenerate updated, high-quality React/HTML code that applies these changes. Maintain existing functionality while implementing requested modifications. Use Tailwind CSS and responsive design.",
    ].join("\n");
    return this.generateUI(iterationPrompt, { ...context, isIteration: true, baseCode: originalUI?.code });
  }

  private buildUIPrompt(userPrompt: string, options: GenerateOptions = {}) {
    const lines = [
      "ROLE: You are an expert frontend developer creating production-ready UI components.",
      `\nTASK: ${userPrompt}`,
      "\nREQUIREMENTS:",
      "- Generate clean, modern, responsive code",
      "- Use React/JSX syntax with TypeScript",
      "- Use Tailwind CSS for styling",
      "- Include proper accessibility (ARIA labels)",
      "- Add smooth animations and hover effects",
      "- Ensure mobile-first responsive design",
      "- Use semantic HTML elements",
    ];
    if (options.imageUrl) lines.push(`- Use this reference image where appropriate: ${options.imageUrl}`);
    if (options.isIteration) {
      lines.push(
        "\nITERATION CONTEXT:",
        `- This is modifying existing code: ${options.baseCode ? "Yes" : "No"}`,
        "- Preserve existing functionality",
        "- Focus on requested changes only",
      );
    }
    lines.push(
      "\nOUTPUT FORMAT:",
      "- Return only the complete, working code",
      "- Include necessary imports",
      "- Use TypeScript interfaces where appropriate",
      "- Add brief comments only for complex logic",
    );
    return lines.join("\n");
  }

  private processUIResponse(text: string, options: GenerateOptions = {}): GeminiUIResult {
    const cleanedCode = this.stripCodeFences(text);
    return {
      code: cleanedCode,
      language: this.detectLanguage(cleanedCode),
      framework: this.detectFramework(cleanedCode),
      hasStyles: cleanedCode.includes("className") || cleanedCode.includes("style"),
      isComplete: this.validateCompleteness(cleanedCode),
      timestamp: new Date(),
      options,
    };
  }

  private stripCodeFences(text: string) {
    return text.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim();
  }

  private detectLanguage(code: string) {
    if (code.includes("interface ") || code.includes(": React.FC")) return "typescript";
    if (code.includes("jsx") || code.includes("React")) return "javascript";
    if (code.includes("<html>")) return "html";
    return "unknown";
  }

  private detectFramework(code: string) {
    if (code.includes("React") || code.includes("useState")) return "react";
    if (code.includes("Vue") || code.includes("v-")) return "vue";
    if (code.includes("<html>")) return "vanilla";
    return "unknown";
  }

  private validateCompleteness(code: string) {
    const hasOpeningTags = code.includes("<");
    const hasClosingTags = code.includes(">");
    const hasContent = code.length > 100;
    return hasOpeningTags && hasClosingTags && hasContent;
  }
}

export type GeminiUIResult = {
  code: string;
  language: string;
  framework: string;
  hasStyles: boolean;
  isComplete: boolean;
  timestamp: Date;
  options: GenerateOptions;
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

