import { NextResponse } from "next/server";
import { getMetadata } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Token metadata JSON (Metaplex format) for coins whose metadata FansPad hosts itself. */
export async function GET(_req: Request, { params }: RouteContext<"/api/meta/[id]">) {
  const { id } = await params;
  const json = await getMetadata(id);
  if (!json) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(json, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000, immutable", "Access-Control-Allow-Origin": "*" } });
}
