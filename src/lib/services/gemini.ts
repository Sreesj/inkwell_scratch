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
      "ROLE: You are an elite UI/UX designer and frontend developer creating world-class, lovable applications that users can't stop using.",
      `\nTASK: ${userPrompt}`,
      "\n🎯 LOVABLE UI REQUIREMENTS (NON-NEGOTIABLE):",
      "\n1. EMOTIONAL DESIGN:",
      "- Create interfaces that spark joy and delight at every interaction",
      "- Use warm, inviting color palettes that feel human and approachable",
      "- Add personality through micro-copy, animations, and visual details", 
      "- Design moments of surprise and delight (Easter eggs, celebrations)",
      "- Make every click, hover, and scroll feel satisfying and responsive",
      "\n2. FLUID ANIMATIONS & MICRO-INTERACTIONS:",
      "- Smooth CSS transitions on ALL interactive elements (200-300ms duration)",
      "- Hover effects that provide immediate, satisfying feedback",
      "- Button press animations with subtle scale/shadow changes",
      "- Loading states with elegant skeleton screens or spinners",
      "- Scroll-triggered animations (fade-ins, slide-ups) using Intersection Observer",
      "- Page transitions that feel cinematic and smooth",
      "- Form interactions with floating labels and smooth validation states",
      "\n3. MODERN, PREMIUM STYLING:",
      "- Use contemporary design trends: glassmorphism, neumorphism, gradient overlays",
      "- Implement proper visual hierarchy with varying font weights and sizes",
      "- Add depth with subtle shadows, layering, and z-index management",
      "- Use rounded corners (8px-16px) and proper spacing (8px grid system)",
      "- Include beautiful typography with proper line-height and letter-spacing",
      "- Implement dark/light mode considerations with CSS custom properties",
      "\n4. INTERACTIVE ELEMENTS THAT FEEL ALIVE:",
      "- Buttons that lift on hover and depress on click",
      "- Cards that gently float upward on hover with smooth shadows",
      "- Input fields with focus states that feel magnetic and satisfying",
      "- Navigation that responds intelligently to user scroll behavior",
      "- Image galleries with smooth zoom, parallax, or ken burns effects",
      "- Progress indicators that animate smoothly and celebrate completion",
      "\n5. RESPONSIVE & PERFORMANCE-MINDED:",
      "- Mobile-first approach with touch-friendly interactions (44px+ targets)",
      "- Smooth performance using CSS transforms over position changes",
      "- Optimized animations using transform3d() for hardware acceleration",
      "- Proper loading states to maintain perceived performance",
      "- Gesture support for mobile (swipe, pinch, long-press where appropriate)",
    ];

    lines.push(
      "\n🎨 VISUAL EXCELLENCE STANDARDS:",
      "- Color harmony using proven palettes (monochromatic, complementary, triadic)",
      "- Consistent spacing using 4px/8px base unit system",
      "- Typography scale with proper hierarchy (48px/32px/24px/18px/16px/14px)",
      "- Proper contrast ratios for accessibility (4.5:1 minimum)",
      "- Consistent iconography style (outline, filled, or mixed consistently)",
      "- White space as a design element, not just absence of content",
    );

    lines.push(
      "\n⚡ ADVANCED INTERACTION PATTERNS:",
      "- Smart sticky navigation that hides/shows based on scroll direction",
      "- Infinite scroll with smooth loading and skeleton states",
      "- Drag and drop with visual feedback and smooth animations",
      "- Multi-step forms with progress indication and smooth transitions",
      "- Modal/dialog systems with backdrop blur and smooth entry/exit",
      "- Toast notifications that slide in naturally and auto-dismiss",
      "- Search with real-time filtering and highlight animations",
    );

    if (options.imageUrl) lines.push(`\n📸 VISUAL REFERENCE: ${options.imageUrl}`);
    
    lines.push(
      "\n🏆 EXAMPLES OF LOVABLE APPS TO EMULATE:",
      "- Linear: Clean, fast, with satisfying micro-interactions",
      "- Stripe: Elegant forms with smooth validation and clear feedback", 
      "- Notion: Delightful database interactions and smooth page transitions",
      "- Figma: Responsive canvas with smooth zoom and pan interactions",
      "- Framer: Beautiful landing pages with scroll-triggered animations",
      "- Apple: Consistent design language with premium feel throughout",
      "\n💻 TECHNICAL IMPLEMENTATION:",
      "- Use CSS Grid and Flexbox for robust, flexible layouts",
      "- Implement CSS custom properties for consistent theming",
      "- Add smooth scrolling: scroll-behavior: smooth",
      "- Use transform3d() for hardware-accelerated animations",
      "- Include proper focus management for keyboard navigation",
      "- Add loading='lazy' for images and proper alt text",
      "- Implement proper semantic HTML with ARIA labels",
    );
    
    lines.push(
      "\n📋 SPECIFIC CODE REQUIREMENTS:",
      "- Return complete, production-ready application code",
      "- For HTML: Include ALL CSS animations and JavaScript inline",
      "- For React: Use hooks for smooth state transitions and animations",
      "- Include realistic content, not Lorem ipsum",
      "- Add proper error states and empty states with personality",
      "- Implement proper form validation with smooth error messaging",
      "- Use proper loading states for async operations",
      "\n🚫 WHAT NOT TO DO:",
      "- No static, lifeless interfaces",
      "- No harsh, jarring transitions or animations",
      "- No poor color contrast or unreadable text",
      "- No generic, templated designs",
      "- No broken responsive layouts",
      "- No missing hover/focus states",
      "- No inconsistent spacing or typography",
    );
    
    if (options.isIteration) {
      lines.push(
        "\n🔄 ITERATION CONTEXT:",
        "- Enhance the existing design while maintaining its core structure",
        "- Add more personality and delight to interactions",
        "- Improve visual hierarchy and micro-interactions", 
        "- Ensure all new elements follow the lovable UI standards above",
      );
    }
    
    lines.push(
      "\n🎯 FINAL OUTPUT:",
      "- Create something users will screenshot and share",
      "- Every interaction should feel intentional and delightful",
      "- The result should feel like a premium, modern application",
      "- Users should WANT to spend time in this interface",
      "- Return ONLY the complete, working code - no explanations",
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
