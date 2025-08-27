import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // In a real implementation, you would parse the sketch image + prompt
  // and call your model to update the UI. Here we just tweak the buttons.
  const formData = await req.formData();
  const prompt = String(formData.get("prompt") ?? "");
  const image = formData.get("image");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _hasImage = image instanceof Blob;

  const emphasized = /highlight|emphasize|bigger|bold/i.test(prompt);

  const ui = {
    root: {
      type: "container",
      className: "mx-auto max-w-2xl flex flex-col gap-4",
      children: [
        { type: "text", className: "text-2xl font-semibold", text: "Updated UI from Sketch" },
        { type: "input", placeholder: "Search..." },
        {
          type: "container",
          className: "grid grid-cols-2 gap-3",
          children: [
            { type: "button", text: emphasized ? "Primary (Large)" : "Primary" },
            { type: "button", text: emphasized ? "Secondary (Large)" : "Secondary" },
          ],
        },
        {
          type: "card",
          children: [
            { type: "text", className: "text-lg font-medium", text: "Card title" },
            { type: "text", className: "text-sm text-gray-500", text: "Tweaked from your sketch overlay." },
            { type: "button", text: "Continue" },
          ],
        },
      ],
    },
  } as const;

  return NextResponse.json({ ui });
}

