import { NextResponse } from "next/server";
import { checkImage, gateReady, signVerdict } from "@/lib/server/aiDetect";
import { insertGateCheck } from "@/lib/server/db";
import { readImage } from "@/lib/server/image";

export const maxDuration = 120;

/**
 * Instant verdict for the launch form. Returns the verdict plus a signed token
 * the launch step can present so the detectors do not have to run twice.
 */
export async function POST(req: Request) {
  if (!gateReady()) return NextResponse.json({ error: "Image verification is not configured on this server." }, { status: 503 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  const img = await readImage(form);
  if (typeof img === "string") return NextResponse.json({ error: img }, { status: 400 });
  try {
    const verdict = await checkImage(img.bytes, img.type);
    insertGateCheck(verdict.hash, verdict.allowed, verdict.aiProbability, verdict.summary).catch(() => {});
    return NextResponse.json({ verdict, token: signVerdict(verdict) });
  } catch (e) {
    console.error("image check failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not verify the image. Try again." }, { status: 502 });
  }
}
