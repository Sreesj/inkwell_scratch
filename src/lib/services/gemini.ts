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
          `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inkwell</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}</style></head><body><div style="text-align:center;color:white;padding:2rem"><h1 style="font-size:2rem;margin-bottom:1rem">Inkwell</h1><p>${escapeHtml(userPrompt)}</p></div></body></html>`,
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
      "TASK: Modify existing full-page application based on user requirements",
      "\nORIGINAL APPLICATION:",
      originalUI?.description || "",
      "\nREQUESTED CHANGES:",
      changes,
      `\nCURRENT ITERATION: ${context.iteration || 1}`,
      "\nGenerate the complete, updated application code. Maintain the full-page structure while implementing requested modifications.",
      "\nIMPORTANT: Follow all full-page application requirements below.",
    ].join("\n");
    return this.generateUI(iterationPrompt, { ...context, isIteration: true, baseCode: originalUI?.code });
  }

  private buildUIPrompt(userPrompt: string, options: GenerateOptions = {}) {
    const lines = [
      "ROLE: You are an expert frontend developer creating complete, production-ready web applications.",
      `\nTASK: ${userPrompt}`,
      "\nIMPORTANT: Generate a COMPLETE, FULL-PAGE APPLICATION, not just a component.",
      "\nFULL-PAGE REQUIREMENTS:",
      "- Create a complete webpage that fills the entire viewport",
      "- Include appropriate sections: header/nav, main content, footer as needed",
      "- Use min-height: 100vh for full-height layouts",
      "- Design should look like a real website/app, not a component demo",
      "- Include navigation, hero sections, content areas as appropriate for the request",
      "- Use realistic content, proper spacing, and professional styling",
      "\nTECHNICAL REQUIREMENTS:",
      "- Choose the BEST technology for the task (React, HTML, Vue, etc.)",
      "- Use modern CSS frameworks (Tailwind CSS preferred)",
      "- Responsive design that works on mobile and desktop",
      "- Include realistic content, images (/images/[name] for placeholders), and interactions",
      "- Use semantic HTML and proper accessibility (ARIA labels, proper headings)",
      "- Add smooth animations, hover effects, and micro-interactions",
      "- Implement working interactive elements (buttons, forms, navigation)",
      "\nCANVAS CONSTRAINTS:",
      "- Must fit perfectly in preview canvas without horizontal scrollbars",
      "- Use relative units (%, vw, vh, rem) instead of large fixed pixel values",
      "- Ensure all content is contained within viewport bounds",
      "- Test responsiveness for various screen sizes (400px to 1200px+)",
    ];

    if (options.imageUrl) lines.push(`- Reference this image for design inspiration: ${options.imageUrl}`);
    
    if (options.isIteration) {
      lines.push(
        "\nITERATION CONTEXT:",
        `- This is modifying existing application code: ${options.baseCode ? "Yes" : "No"}`,
        "- Preserve existing full-page structure and functionality",
        "- Focus on requested changes while maintaining app completeness",
        "- Keep all canvas sizing and responsive requirements",
      );
    }
    
    lines.push(
      "\nEXAMPLES OF COMPLETE APPLICATIONS TO BUILD:",
      "- E-commerce: Header with nav/logo, hero banner, product grid, features, testimonials, footer",
      "- Dashboard: Sidebar navigation, header with user info, main content with stats/charts/tables",
      "- Landing page: Navigation, hero section, features, pricing, testimonials, CTA, footer",
      "- Portfolio: Header with nav, hero/about, projects grid, skills, contact, footer",
      "- Blog: Header with nav/search, featured post, article grid, sidebar, footer",
      "- SaaS App: Login/header, main dashboard view, sidebar, content panels, notifications",
      "\nOUTPUT REQUIREMENTS:",
      "- Return ONLY complete, working application code",
      "- For HTML: Complete <!DOCTYPE html> document with all CSS/JS inline",
      "- For React: Complete functional application with all necessary imports",
      "- NO markdown code blocks, NO explanations, NO incomplete components",
      "- Code should render as a complete, professional application immediately",
      "- Ensure the result looks like a real, polished web application",
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
    if (code.includes("<html>") || code.includes("<!DOCTYPE")) return "html";
    return "unknown";
  }

  private detectFramework(code: string) {
    if (code.includes("React") || code.includes("useState")) return "react";
    if (code.includes("Vue") || code.includes("v-")) return "vue";
    if (code.includes("<html>") || code.includes("<!DOCTYPE")) return "vanilla";
    return "unknown";
  }

  private validateCompleteness(code: string) {
    const hasOpeningTags = code.includes("<");
    const hasClosingTags = code.includes(">");
    const hasContent = code.length > 100;
    const looksComplete = code.includes("DOCTYPE") || code.includes("export") || code.includes("function");
    return hasOpeningTags && hasClosingTags && hasContent && looksComplete;
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
