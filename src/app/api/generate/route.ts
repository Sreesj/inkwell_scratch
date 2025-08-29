import { NextRequest, NextResponse } from "next/server";
import { generateUISchemaWithAI } from "@/lib/ai";
import { prisma } from "@/lib/db";
import type { GeneratedOutput, GeneratedUISchema } from "@/types/ui";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt ?? "";
    if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    const out = await generateUISchemaWithAI(prompt);
    // Anonymous user for now (null userId). Will replace with StackAuth.
    try {
      const json: GeneratedOutput = (out as GeneratedOutput).kind
        ? (out as GeneratedOutput)
        : ({ kind: "ui", ui: out as GeneratedUISchema } as GeneratedOutput);
      await prisma.generation.create({ data: { prompt, uiJson: json as unknown as object } });
    } catch (e) {
      console.warn("DB insert failed (generate)", e);
    }
    const result: GeneratedOutput = (out as GeneratedOutput).kind
      ? (out as GeneratedOutput)
      : ({ kind: "ui", ui: out as GeneratedUISchema } as GeneratedOutput);
    return NextResponse.json(result.kind === "code" ? { code: result.code } : { ui: result.ui });
  } catch (err: unknown) {
    console.error("/api/generate error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

