import { NextResponse } from "next/server";
import { getAsset } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/** Token image for coins whose metadata FansPad hosts itself. */
export async function GET(_req: Request, { params }: RouteContext<"/api/img/[id]">) {
  const { id } = await params;
  const a = await getAsset(id);
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });
  const bytes = a.bytes instanceof Uint8Array ? a.bytes : new Uint8Array(a.bytes);
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": a.content_type, "Cache-Control": "public, max-age=31536000, immutable", "Access-Control-Allow-Origin": "*" } });
}
