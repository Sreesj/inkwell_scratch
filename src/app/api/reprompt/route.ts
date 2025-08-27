import { NextRequest, NextResponse } from "next/server";
import { repromptUISchemaWithAI } from "@/lib/ai";
import type { GeneratedUISchema } from "@/types/ui";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = String(formData.get("prompt") ?? "");
    const previousUIString = String(formData.get("previousUI") ?? "null");
    const image = formData.get("image");

    if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

    let overlayImageBase64: string | null = null;
    if (image instanceof Blob) {
      const arrayBuffer = await image.arrayBuffer();
      overlayImageBase64 = Buffer.from(arrayBuffer).toString("base64");
    }

    const previousUI = previousUIString && previousUIString !== "null" ? (JSON.parse(previousUIString) as GeneratedUISchema) : null;
    const ui = await repromptUISchemaWithAI({ prompt, previousUI, overlayImageBase64 });
    return NextResponse.json({ ui });
  } catch (err: unknown) {
    console.error("/api/reprompt error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

