export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import GeneratedUIRenderer from "@/components/GeneratedUIRenderer";
import CodePreview from "@/components/CodePreview";
import type { GeneratedUISchema, GeneratedOutput } from "@/types/ui";

export default async function ProfilePage() {
  const gens = await prisma.generation.findMany({ orderBy: { createdAt: "desc" }, take: 2 });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">Your recent generations</h1>
      {gens.length === 0 ? (
        <div className="text-sm text-gray-500">No generations yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gens.map((g) => (
            <div key={g.id} className="rounded-xl border border-black/10 dark:border-white/15 p-4">
              <div className="text-xs text-gray-500 mb-2">{g.createdAt.toISOString()}</div>
              {(() => {
                const j = g.uiJson as unknown as GeneratedOutput | GeneratedUISchema;
                if ((j as GeneratedOutput).kind === "code") {
                  const out = j as Extract<GeneratedOutput, { kind: "code" }>;
                  return <CodePreview code={out.code} className="w-full h-[420px]" />;
                }
                const schema: GeneratedUISchema = (j as GeneratedOutput).kind === "ui"
                  ? (j as Extract<GeneratedOutput, { kind: "ui" }>).ui
                  : (j as GeneratedUISchema);
                return <GeneratedUIRenderer ui={schema} />;
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

