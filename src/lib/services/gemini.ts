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
      
      "\n🎪 AVAILABLE ANIMATION LIBRARIES & TOOLS:",
      "- **framer-motion**: { motion, useAnimation, AnimatePresence, useMotionValue, useTransform, useScroll }",
      "- **react-spring**: { useSpring, animated, useTransition, useChain, useSpringRef, config }",
      "- **GSAP**: timeline animations, scroll triggers, morphing SVGs",
      "- **Tailwind**: enhanced with custom liquid animations, morphing, glow effects",
      "- **Lucide Icons**: beautiful, consistent icon library",
      "- **Headless UI**: accessible component primitives",
      "- **React Hot Toast**: smooth notification system",
      
      "\n🎯 WORLD-CLASS ANIMATION REQUIREMENTS:",
      
      "\n1. 🎪 FRAMER MOTION MASTERY:",
      "- Use motion.div for ALL animated elements with buttery-smooth transitions",
      "- Implement AnimatePresence for seamless enter/exit animations", 
      "- Add gesture support: whileHover, whileTap, whileDrag with spring physics",
      "- Create orchestrated animations with staggerChildren and delayChildren",
      "- Use useMotionValue and useTransform for scroll-triggered effects",
      "- Add layout animations with layout prop for automatic repositioning",
      "- Implement shared element transitions between components",
      
      "\n2. 🌊 REACT SPRING FLUIDITY:",
      "- Use useSpring for smooth value interpolation and physics-based movement",
      "- Implement useTransition for list animations and smooth state changes",
      "- Chain complex sequences with useChain for orchestrated effects",
      "- Create organic movement with spring config (tension, friction, mass)",
      "- Use animated components for performant 60fps animations",
      
      "\n3. 🎨 LIQUID & MORPHING ANIMATIONS:",
      "- Implement CSS morphing shapes with custom border-radius animations",
      "- Create flowing, liquid-like loaders and background elements",
      "- Add breathing effects with subtle scale and opacity changes",  
      "- Use CSS backdrop-filter for glass morphism effects",
      "- Implement particle systems with floating animated elements",
      
      "\n4. 🚀 ADVANCED INTERACTION PATTERNS:",
      "- Magnetic hover effects that follow cursor position",
      "- Parallax scrolling with depth and perspective",
      "- Interactive particle systems responding to mouse movement",
      "- Gesture-driven interfaces (swipe, pinch, rotate) for mobile",
      "- Smooth page transitions with shared element animations",
      "- Loading states with skeleton screens and progressive reveals",
    ];

    if (options.imageUrl) lines.push(`\n📸 VISUAL REFERENCE: ${options.imageUrl}`);
    
    lines.push(
      "\n💻 IMPLEMENTATION EXAMPLES:",
      "",
      "```jsx",
      "// 🎪 Framer Motion Examples:",
      "import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';",
      "",
      "const LiquidButton = () => {",
      "  const { scrollYProgress } = useScroll();",
      "  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);",
      "",
      "  return (",
      "    <motion.button",
      "      style={{ scale }}",
      "      whileHover={{ ",
      "        scale: 1.05, ",
      "        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',",
      "        borderRadius: '50px'",
      "      }}",
      "      whileTap={{ scale: 0.95 }}",
      "      transition={{ type: 'spring', stiffness: 400, damping: 17 }}",
      "      className='px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500'",
      "    >",
      "      Liquid Button",
      "    </motion.button>",
      "  );",
      "};",
      "",
      "// 🌊 React Spring Examples:",
      "import { useSpring, animated, useTransition } from 'react-spring';",
      "",
      "const FloatingCard = ({ isVisible }) => {",
      "  const cardSpring = useSpring({",
      "    from: { opacity: 0, transform: 'translate3d(0,100px,0) scale(0.8)' },",
      "    to: { ",
      "      opacity: isVisible ? 1 : 0, ",
      "      transform: isVisible ? 'translate3d(0,0px,0) scale(1)' : 'translate3d(0,-50px,0) scale(0.9)'",
      "    },",
      "    config: { tension: 280, friction: 60, mass: 1 }",
      "  });",
      "",
      "  return (",
      "    <animated.div ",
      "      style={cardSpring}",
      "      className='p-8 rounded-3xl bg-white/10 backdrop-blur-lg'",
      "    >",
      "      Content with physics",
      "    </animated.div>",
      "  );",
      "};",
      "",
      "// 🎨 Liquid CSS Animations:",
      "const LiquidLoader = () => (",
      "  <div className='relative w-32 h-32'>",
      "    <div className='absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 animate-liquid opacity-80' />",
      "    <div className='absolute inset-2 bg-gradient-to-r from-purple-500 to-pink-500 animate-morph opacity-60' />",
      "  </div>",
      ");",
      "```",
      "",
      "\n🏆 PREMIUM VISUAL STANDARDS:",
      "- **Glass Morphism**: backdrop-blur-lg with rgba backgrounds",
      "- **Liquid Animations**: Custom morphing shapes with organic movement",
      "- **Depth & Layering**: Proper z-index, shadows, and perspective",
      "- **Color Harmony**: Gradients with complementary color schemes",
      "- **Typography**: Proper hierarchy with smooth font weight transitions",
      "- **Spacing**: Consistent 8px grid system with breathing room",
      "",
      "\n🎪 ADVANCED TECHNIQUES:",
      "- **Scroll Hijacking**: Smooth scrolling with section snap effects",
      "- **Magnetic Elements**: Buttons that attract cursor on approach",
      "- **Particle Fields**: Background elements that react to interaction",
      "- **Morphing Interfaces**: Shape-shifting components based on state",
      "- **Physics Simulation**: Real spring physics for natural movement",
      "- **3D Transforms**: Perspective, rotations, and depth effects",
      "",
      "\n⚡ PERFORMANCE OPTIMIZATIONS:",
      "- Use transform3d() for hardware acceleration",
      "- Implement will-change CSS property for animated elements",
      "- Debounce scroll and resize events",
      "- Use React.memo for expensive animation components",
      "- Prefer transform over position changes",
      "- Use CSS containment for isolated animation areas",
      "",
      "\n🚫 WHAT NOT TO DO:",
      "- No static, lifeless interfaces without micro-interactions",
      "- No harsh, jarring transitions or abrupt state changes", 
      "- No generic loading spinners - create custom liquid loaders",
      "- No inconsistent animation timing or easing functions",
      "- No broken responsive layouts on mobile devices",
      "- No missing hover/focus states on interactive elements",
      "- No accessibility issues - maintain keyboard navigation",
      "",
      "\n🎯 SPECIFIC CODE REQUIREMENTS:",
      "- Export as default React component: `export default function App() { ... }`",
      "- Use modern React hooks (useState, useEffect, useRef)",
      "- Include realistic content, not Lorem ipsum placeholders", 
      "- Add proper error boundaries and loading states",
      "- Implement smooth form validation with animated feedback",
      "- Use semantic HTML with proper ARIA labels",
      "- Include dark/light mode considerations",
      "",
      "\n🌟 EXAMPLES OF LOVABLE APPS TO EMULATE:",
      "- **Linear**: Clean design with satisfying micro-interactions",
      "- **Stripe**: Elegant forms with smooth validation feedback", 
      "- **Notion**: Delightful database interactions and page transitions",
      "- **Figma**: Responsive canvas with smooth zoom/pan interactions",
      "- **Framer**: Beautiful landing pages with scroll-triggered animations",
      "- **Apple**: Consistent design language with premium feel",
      "",
      "\n🏁 FINAL OUTPUT REQUIREMENTS:",
      "- Create something users will screenshot and share on social media",
      "- Every interaction should feel intentional and delightful",
      "- 60fps smooth animations that feel natural and organic",
      "- The result should rival the best modern web applications",
      "- Users should WANT to spend time exploring the interface",
      "- Return ONLY the complete, working React component code",
      "- No explanations, no markdown - just pure, executable code"
    );
    
    if (options.isIteration) {
      lines.push(
        "\n🔄 ITERATION CONTEXT:",
        "- Enhance the existing design while maintaining core structure",
        "- Add more personality and delight to user interactions", 
        "- Improve visual hierarchy and animation choreography",
        "- Ensure all new elements follow the lovable UI standards",
        "- Maintain performance while adding visual enhancements"
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
