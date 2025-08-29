export class MagnusService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    this.model = process.env.SKETCH_MODEL || "heavylildude/magnus-frontend:latest";
  }

  async sketchToPrompt(sketchBase64: string, userInput = ""): Promise<string> {
    const messages: Array<{ role: "system" | "user"; content: string; images?: string[] }> = [
      { role: "system", content: "You are Magnus Frontend. Analyze the sketch and produce a detailed UI prompt for Gemini. Output only the prompt text, no code." },
      { role: "user", content: userInput || "Analyze and describe the UI in this sketch to generate a high-quality prompt.", images: [sketchBase64] },
    ];

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, stream: false, messages }),
    });
    if (!res.ok) throw new Error(`Magnus error: ${res.status}`);
    const data = await res.json();
    const content: string = data?.message?.content || "";
    return content.trim();
  }
}

