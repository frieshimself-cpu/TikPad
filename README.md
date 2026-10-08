# Anti AI Launchpad ($AAL)

**Launch on pump.fun. No AI slop.**

Anti AI Launchpad is a pump.fun launchpad with one rule: the coin's image has to be made by a human. You fill in name, ticker, description, links, an image and a dev buy, Anti AI Launchpad checks the image, and if it passes you sign one creation transaction from your own wallet. Your wallet is the coin's on-chain creator and keeps every creator reward. If the image is AI-generated, it never deploys.

## How the gate works

Every image goes through up to three detectors before any metadata is uploaded or any transaction is built (`src/lib/server/aiDetect.ts`):

1. **File provenance** (always on). C2PA / IPTC `trainedAlgorithmicMedia` tags, Stable Diffusion `parameters`, ComfyUI workflows, and generator credits (Midjourney, DALL·E, Firefly, Imagen, FLUX, …) embedded in the file.
2. **Claude vision** (`ANTHROPIC_API_KEY`). Claude Opus 5.5 looks at the picture and returns a verdict, confidence and reasons as structured output.
3. **Sightengine** (`SIGHTENGINE_API_USER` / `SIGHTENGINE_API_SECRET`). A dedicated AI-generated-image classifier.

Each detector yields a probability that the image is AI-generated. If any reaches `AI_BLOCK_THRESHOLD` (default 0.5) the launch is refused. A configured detector that errors fails the check (the gate fails closed). With no detector key set, launching is disabled unless `AI_GATE_ALLOW_METADATA_ONLY=1`.

The form checks the image the moment it is picked (`POST /api/image-check`) and returns a signed verdict token; the launch step (`POST /api/launch/prepare`) reuses that verdict for the exact same bytes, otherwise it re-runs the detectors. The server then hosts the metadata (pump.fun's uploader, Pinata if `PINATA_JWT` is set) and asks PumpPortal for an unsigned `create` transaction for the launcher's wallet. The browser signs it with the wallet plus a freshly generated mint keypair and sends it. `POST /api/launch/confirm` verifies the transaction on chain and lists the coin.

## Run it

```bash
cp .env.example .env   # set ANTHROPIC_API_KEY at minimum
npm install
npm run dev
```

Deploys to Vercel as is. Set `ANTHROPIC_API_KEY` in the project's environment variables; `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` are optional and only make the "launched here" list persist.

## Layout

- `src/app` – pages (`/`, `/launch`, `/docs`, `/t/[mint]`) and API routes (`/api/status`, `/api/image-check`, `/api/launch/prepare`, `/api/launch/confirm`, `/api/tokens`, `/api/meta/[id]`, `/api/img/[id]`).
- `src/lib/server` – the gate (`aiDetect.ts`), PumpPortal and metadata uploads (`pumpportal.ts`), on-chain verification (`solana.ts`), optional libsql store (`db.ts`), signed tokens (`tokens.ts`).
- `src/components` – launch form, verdict card, home page, nav.

Not affiliated with pump.fun. Launching coins is risky; nothing here is financial advice.
