import { type NextRequest } from "next/server";

export async function GET(_req: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const label = name.replace(/\.[a-zA-Z0-9]+$/, "");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill="#fafafa"/>
      <path d="M24 0H0V24" fill="none" stroke="#e5e7eb" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#grid)"/>
  <g fill="#9ca3af" font-family="system-ui, -apple-system, Segoe UI, Roboto" font-size="36">
    <text x="50%" y="50%" text-anchor="middle">${label}</text>
  </g>
</svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000, immutable" } });
}

