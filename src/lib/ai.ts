import type { GeneratedUISchema, GeneratedOutput } from "@/types/ui";
import { GeminiService } from "@/lib/services/gemini";
import { MagnusService } from "@/lib/services/magnus";

export async function generateUISchemaWithAI(prompt: string, opts?: { imageUrl?: string }): Promise<GeneratedUISchema | GeneratedOutput> {
  const gemini = new GeminiService();
  try {
    const html = await gemini.generateUI(prompt, { imageUrl: opts?.imageUrl });
    return { kind: "code", code: html };
  } catch (e) {
    console.warn("Gemini error, returning fallback HTML:", e);
    return {
      kind: "code",
      code:
        `<div class="min-h-screen p-8"><h1 class="text-2xl font-semibold mb-2">Inkwell</h1><p class="text-gray-600">${escapeHtml(
          prompt
        )}</p></div>`,
    };
  }
}

export async function repromptUISchemaWithAI(params: {
  prompt: string;
  previousUI?: GeneratedUISchema | null;
  overlayImageBase64?: string | null;
}): Promise<GeneratedUISchema | GeneratedOutput> {
  const { prompt, previousUI, overlayImageBase64 } = params;
  const gemini = new GeminiService();

  try {
    let refined = prompt;
    if (overlayImageBase64) {
      const magnus = new MagnusService();
      const sketchPrompt = await magnus.sketchToPrompt(overlayImageBase64, prompt);
      refined = `${sketchPrompt}\n\nRequirements:\n- Responsive layout\n- Semantic HTML + Tailwind\n- No external assets`;
    } else if (previousUI) {
      refined = `${prompt}\n\nImprove the following UI JSON into production HTML+Tailwind. Keep structure but polish visuals.\n${JSON.stringify(
        previousUI
      )}`;
    }
    const html = await gemini.generateUI(refined);
    return { kind: "code", code: html };
  } catch (e) {
    console.warn("Gemini reprompt error, returning fallback HTML:", e);
    return { kind: "code", code: `<div class="p-6">${escapeHtml(prompt)}</div>` };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

