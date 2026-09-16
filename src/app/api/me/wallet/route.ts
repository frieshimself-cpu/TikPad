import { NextResponse } from "next/server";
import { ready } from "@/lib/bootstrap";
import { getCreatorById, setPayoutWallet } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isValidPubkey } from "@/lib/solana";

export async function POST(req: Request) {
  ready();
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const creator = getCreatorById(s.creatorId);
  if (!creator) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { wallet?: string | null };
  const wallet = body.wallet?.trim() || null;
  if (wallet && !isValidPubkey(wallet)) return NextResponse.json({ error: "Invalid Solana address." }, { status: 400 });
  setPayoutWallet(creator.id, wallet);
  return NextResponse.json({ ok: true, wallet });
}
