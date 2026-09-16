import { NextResponse } from "next/server";
import { ready } from "@/lib/bootstrap";
import { isTikTokConfigured } from "@/lib/config";
import { upsertCreator } from "@/lib/db";
import { setSession } from "@/lib/session";
import { normalizeHandle } from "@/lib/tiktok";

/** Demo sign-in: only available when TikTok Login Kit is not configured. */
export async function POST(req: Request) {
  await ready();
  if (isTikTokConfigured()) return NextResponse.json({ error: "Demo sign-in is disabled when TikTok login is configured." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { handle?: string };
  const handle = normalizeHandle(body.handle ?? "");
  if (!handle) return NextResponse.json({ error: "Enter a valid TikTok handle." }, { status: 400 });
  const creator = await upsertCreator({ handle, display_name: handle });
  await setSession({ creatorId: creator.id, handle });
  return NextResponse.json({ ok: true, handle });
}
