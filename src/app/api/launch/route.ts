import { NextResponse } from "next/server";
import { z } from "zod";
import { ready } from "@/lib/bootstrap";
import { config } from "@/lib/config";
import { executeLaunch } from "@/lib/launch";
import { normalizeHandle } from "@/lib/tiktok";

export const maxDuration = 120;

const Fields = z.object({
  quoteId: z.string().min(1),
  paymentSig: z.string().optional(),
  name: z.string().trim().min(1).max(32),
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .regex(/^[A-Za-z0-9]+$/, "Ticker must be letters and numbers only"),
  description: z.string().trim().max(500).default(""),
  handle: z.string().min(1),
  devBuySol: z.coerce.number().min(0).max(config.maxDevBuySol),
  wallet: z.string().min(32).max(64),
  twitter: z.string().trim().max(200).optional(),
  telegram: z.string().trim().max(200).optional(),
  website: z.string().trim().max(200).optional(),
});

export async function POST(req: Request) {
  await ready();
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
  const handle = normalizeHandle(parsed.data.handle);
  if (!handle) return NextResponse.json({ error: "That does not look like a TikTok handle." }, { status: 400 });

  const file = form.get("image");
  let image: { bytes: Uint8Array; type: string; name: string } | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });
    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) return NextResponse.json({ error: "Image must be PNG, JPEG, GIF or WebP." }, { status: 400 });
    image = { bytes: new Uint8Array(await file.arrayBuffer()), type: file.type, name: file.name || "image.png" };
  }

  try {
    const result = await executeLaunch(parsed.data.quoteId, parsed.data.paymentSig ?? null, {
      ...parsed.data,
      symbol: parsed.data.symbol.toUpperCase(),
      handle,
      image,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Launch failed.";
    console.error("launch failed:", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
