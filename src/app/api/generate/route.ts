import { NextRequest, NextResponse } from "next/server";
import { generateUISchemaWithAI } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt ?? "";
    if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    const ui = await generateUISchemaWithAI(prompt);
    return NextResponse.json({ ui });
  } catch (err: unknown) {
    console.error("/api/generate error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

