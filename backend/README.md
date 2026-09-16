# backend (parked)

The server side of TikPad, not part of the current build:

- `lib/` — database layer (libsql), launch orchestration (payment verification → IPFS → pump.fun create via PumpPortal → dev-buy sweep), fee router (claim → attribute → milestone payouts), TikTok Login Kit, sessions.
- `api/` — the Next.js route handlers (`/api/launch`, `/api/me`, `/api/auth/tiktok`, `/api/cron/router`, …).
- `worker.ts` — the long-running fee router with trade streaming.

To wire it back in, move `api/` to `src/app/api/`, `lib/*` to `src/lib/`, restore the `@/lib/...` imports, and switch the front end from `src/lib/store.ts` to the API. Environment variables are documented in `.env.example`.
