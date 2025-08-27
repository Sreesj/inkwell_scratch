export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import GeneratedUIRenderer from "@/components/GeneratedUIRenderer";
import type { GeneratedUISchema } from "@/types/ui";

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
              <GeneratedUIRenderer ui={g.uiJson as unknown as GeneratedUISchema} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

