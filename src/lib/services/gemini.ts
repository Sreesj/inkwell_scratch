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
      "\n🚨 CRITICAL REQUIREMENTS - MUST FOLLOW ALL:",
      "\n1. COMPLETE APPLICATION STRUCTURE:",
      "- Generate a FULL, COMPLETE web application that uses the ENTIRE viewport",
      "- Include header/navigation, main content area, and footer",
      "- Use min-height: 100vh on the main container to fill full screen",
      "- Create multiple sections with substantial content",
      "- This should look like a real, professional website/application",
      "\n2. VISUAL & STYLING REQUIREMENTS:",
      "- Use a professional color scheme with good contrast",
      "- Ensure text is ALWAYS readable (dark text on light backgrounds, or light text on dark)",
      "- Include hero sections, feature sections, content grids, testimonials, etc.",
      "- Use modern typography, proper spacing, and visual hierarchy",
      "- Add images using /images/[descriptive-name] format",
      "\n3. LAYOUT REQUIREMENTS:",
      "- Main container MUST use: min-height: 100vh; width: 100%;",
      "- All sections should have substantial content and proper padding",
      "- Use CSS Grid or Flexbox for responsive layouts",
      "- Ensure content fills the viewport vertically and horizontally",
      "- No empty space or half-filled screens",
      "\n4. TECHNOLOGY CHOICE:",
      "- For simple sites: Use HTML + inline CSS + vanilla JavaScript",
      "- For complex apps: Use React with Tailwind CSS",
      "- Choose based on the complexity of the request",
      "- Always include responsive design",
    ];

    if (options.imageUrl) lines.push(`\n5. IMAGE REFERENCE:\n- Use this reference: ${options.imageUrl}`);
    
    lines.push(
      "\n🎯 SPECIFIC EXAMPLES FOR DIFFERENT REQUESTS:",
      "\nE-COMMERCE SITE:",
      "- Header with logo, navigation, search, cart",
      "- Hero banner with main product/offer",
      "- Product grid (6-12 products) with images, names, prices", 
      "- Features section (shipping, returns, support)",
      "- Testimonials or reviews section",
      "- Newsletter signup",
      "- Footer with links, social media, contact",
      "\nDASHBOARD:",
      "- Sidebar navigation with menu items",
      "- Top header with user info, notifications",
      "- Main content area with stats cards, charts, tables",
      "- Multiple sections showing different data",
      "- Footer or status bar",
      "\nLANDING PAGE:",
      "- Navigation header",
      "- Hero section with headline, subtitle, CTA buttons",
      "- Features section with icons and descriptions",
      "- Benefits or how-it-works section",
      "- Pricing section or product showcase",
      "- Testimonials",
      "- Final CTA section",
      "- Footer",
      "\n📝 OUTPUT FORMAT:",
      "- Return ONLY the complete application code",
      "- For HTML: Complete <!DOCTYPE html> document with all styles inline",
      "- For React: Complete component with all imports and exports",
      "- NO markdown blocks (```), NO explanations, NO comments about the code",
      "- Code should be ready to run immediately",
      "\n⚠️ COMMON MISTAKES TO AVOID:",
      "- Don't create partial/incomplete applications",
      "- Don't use placeholder content like 'Lorem ipsum'",
      "- Don't forget to fill the full viewport height",
      "- Don't use poor color contrast",
      "- Don't create single-section pages",
      "- Don't forget responsive design",
    );
    
    if (options.isIteration) {
      lines.push(
        "\n🔄 ITERATION CONTEXT:",
        `- Modifying existing code: ${options.baseCode ? "Yes" : "No"}`,
        "- Keep the full-application structure",
        "- Apply requested changes while maintaining completeness",
        "- Ensure all requirements above are still met",
      );
    }
    
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
