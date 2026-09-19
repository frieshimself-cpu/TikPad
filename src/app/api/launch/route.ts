import { NextResponse } from "next/server";
import { z } from "zod";
import { executeLaunch } from "@/lib/server/launch";

export const maxDuration = 60;

const Fields = z.object({
  quoteId: z.string().min(1),
  paymentSig: z.string().min(32),
  name: z.string().trim().min(1).max(32),
  symbol: z.string().trim().min(1).max(10).regex(/^[A-Za-z0-9]+$/, "Ticker must be letters and numbers only"),
  description: z.string().trim().max(500).default(""),
  wallet: z.string().min(32).max(64),
  twitter: z.string().trim().max(200).optional(),
  telegram: z.string().trim().max(200).optional(),
  website: z.string().trim().max(200).optional(),
});

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  const raw: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = Fields.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: `${issue.path.join(".")}: ${issue.message}` }, { status: 400 });
  }
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "A token image is required." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });
  if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) return NextResponse.json({ error: "Image must be PNG, JPEG, GIF or WebP." }, { status: 400 });

  // Public origin for self-hosted metadata URLs (pump.fun fetches these).
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || `${proto}://${host}`;

  try {
    const result = await executeLaunch(parsed.data.quoteId, parsed.data.paymentSig, {
      ...parsed.data,
      symbol: parsed.data.symbol.toUpperCase(),
      image: { bytes: new Uint8Array(await file.arrayBuffer()), type: file.type, name: file.name || "image.png" },
      origin,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("launch failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Launch failed." }, { status: 400 });
  }
}
