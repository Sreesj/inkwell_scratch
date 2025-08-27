import { NextRequest, NextResponse } from "next/server";
import { generateUISchemaWithAI } from "@/lib/ai";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt ?? "";
    if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    const ui = await generateUISchemaWithAI(prompt);
    // Anonymous user for now (null userId). Will replace with StackAuth.
    try {
      await prisma.generation.create({ data: { prompt, uiJson: ui as unknown as object } });
    } catch (e) {
      console.warn("DB insert failed (generate)", e);
    }
    return NextResponse.json({ ui });
  } catch (err: unknown) {
    console.error("/api/generate error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

