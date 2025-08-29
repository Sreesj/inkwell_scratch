export const UI_GENERATION_PROMPTS = {
  ecommerce: (brand: string = "Your Brand") =>
    [
      `Build a professional e-commerce landing page for ${brand}.`,
      "Sections:",
      "- Sticky header with logo and nav (Home, Shop, About, Contact)",
      "- Hero with headline, subcopy, CTAs",
      "- Product grid (6 items) with image, name, price, and Add to Cart",
      "- Benefits (3 columns) with icons",
      "- Testimonials (2 cards)",
      "- Footer with links and copyright",
      "Constraints:",
      "- Output ONLY HTML + Tailwind (no markdown, no prose)",
      "- Semantic HTML, responsive (sm/md/lg)",
      "- No external URLs; if image not provided, use /images/[name]",
    ].join("\n"),

  productCard: () =>
    [
      "Create a modern product card component with Tailwind.",
      "Includes: image, product name, short description, price, primary CTA",
      "Constraints: output only HTML, semantic markup, hover/focus-visible states",
    ].join("\n"),

  dashboard: () =>
    [
      "Generate a clean dashboard layout with a sidebar, header, and main content area.",
      "Include: stats cards (4), recent activity list, and a simple table",
      "Constraints: output only HTML + Tailwind, responsive, keyboard-accessible",
    ].join("\n"),
} as const;

export type TemplateKey = keyof typeof UI_GENERATION_PROMPTS;

