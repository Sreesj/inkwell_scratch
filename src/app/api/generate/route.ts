import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt: string = body?.prompt ?? "";

  // Stub: create a simple UI based on prompt keywords
  const wantsForm = /form|input|field/i.test(prompt);
  const wantsCards = /card|list|items?/i.test(prompt);

  const ui = wantsForm
    ? {
        root: {
          type: "container",
          className: "mx-auto max-w-xl flex flex-col gap-4",
          children: [
            { type: "text", className: "text-2xl font-semibold", text: "Generated Form" },
            { type: "input", placeholder: "Name" },
            { type: "input", placeholder: "Email" },
            { type: "button", text: "Submit" },
          ],
        },
      }
    : wantsCards
    ? {
        root: {
          type: "container",
          className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
          children: Array.from({ length: 6 }).map((_, i) => ({
            type: "card",
            children: [
              { type: "text", className: "text-lg font-medium", text: `Card ${i + 1}` },
              { type: "text", className: "text-sm text-gray-500", text: "This is a generated card." },
              { type: "button", text: "Open" },
            ],
          })),
        },
      }
    : {
        root: {
          type: "container",
          className: "flex flex-col items-center gap-4",
          children: [
            { type: "text", className: "text-3xl font-bold", text: "Generated UI" },
            { type: "text", className: "text-sm text-gray-500", text: "Describe what you want on the left and regenerate." },
            { type: "button", text: "Primary action" },
          ],
        },
      };

  return NextResponse.json({ ui });
}

