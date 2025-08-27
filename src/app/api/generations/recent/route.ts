import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const gens = await prisma.generation.findMany({
    orderBy: { createdAt: "desc" },
    take: 2,
  });
  return NextResponse.json({ generations: gens });
}

