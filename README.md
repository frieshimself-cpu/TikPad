# FansPad

Route pump.fun token creator fees to OnlyFans creators.

Launch a token, point its creator fees at any OnlyFans `@handle`, and FansPad pays the creator out automatically. The creator does not need an account, a wallet, or to know the token exists until they want to collect. It is the OnlyFans counterpart of [UsePaid](https://usepaid.app), which does this for X handles. Formerly TikPad.

## How it works

1. **Launch.** A launcher fills in name, ticker, image and the OnlyFans handle, then pays the dev buy plus a small network reserve to the FansPad treasury in one wallet transaction. The treasury creates the token on pump.fun (via PumpPortal) as the on-chain *creator*, buys the dev allocation, and transfers those tokens to the launcher. The description carries `Fees to @handle via FansPad` so the routing is visible.
2. **Fees accrue.** Every pump.fun trade pays a creator fee. Because the treasury is the creator, every fee lands with FansPad.
3. **Attribution.** The fee router streams trades for all registered tokens, periodically claims creator fees, and splits each claim across tokens pro-rata by traded volume since the last claim. 80% of a token's share is credited to its OnlyFans handle, 20% stays with FansPad.
4. **Payout.** The creator signs in with OnlyFans (Login Kit), which returns the verified username, then links any Solana address. Their unpaid balance is sent in SOL when lifetime earnings cross $5, $10, $20, $50, $100, $250, $500, $1,000 and every $1,000 after.

## Current status

**Launching is real.** The launch page creates coins on pump.fun through PumpPortal. The FansPad treasury (`aCKyUCgUMfeScz1M9AsMzGZcJxB2EikTGgaftromUz1`) signs as the on-chain creator, so 100% of every coin's creator rewards accrue to it with no way for a launcher to redirect them. Launchers choose name, ticker, description, image, links and a dev-buy amount; they pay dev buy + a 0.03 SOL creation reserve to the treasury in one transaction, the server creates the coin, and the dev-buy tokens are swept to the launcher's wallet.

**Claiming is automatic.** `/api/cron/claim` (Vercel Cron, every 2 minutes on Pro) or `npm run claimer` (any always-on host) calls PumpPortal's `collectCreatorFee` for the treasury. One transaction claims across every coin the treasury created.

**Everything else on the site** (feed, leaderboard, creator dashboard) is still the browser-side preview from `src/lib/store.ts`, to be replaced by the real backend.

## Configuration

| Variable | Purpose |
| --- | --- |
| `TREASURY_SECRET_KEY` | Secret key of the treasury. The server refuses to launch if it belongs to any other wallet. |
| `PINATA_JWT` | IPFS uploads for image + metadata (pump.fun requires a metadata URI). |
| `SOLANA_RPC_URL` | Use a dedicated RPC; the public endpoint rate-limits confirmations. |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Persistent database for quotes, tokens and claims. Required on Vercel. |
| `CRON_SECRET` | Bearer token Vercel sends to `/api/cron/claim`. |

```bash
npm install
cp .env.example .env    # fill in the values above
npm run dev             # site + API
npm run claimer         # 2-minute claim loop (if not using Vercel Cron)
```

## Deploy to Vercel

Import the repo, add the environment variables above, deploy. Vercel Cron runs the claim every 2 minutes on Pro plans; Hobby allows only daily crons, so run `npm run claimer` elsewhere in that case.

## Layout

```
src/app             pages (App Router)
src/components      UI (landing feed, launch form, creator dashboard, token + creator views)
src/lib/server/     launch orchestration, PumpPortal + Pinata, treasury wallet, libsql, claim cycle
src/app/api/        launch/quote, launch, cron/claim, tokens, status
scripts/claimer.ts  2-minute claim loop
src/lib/store.ts    browser-side preview state for the feed / creator pages (to be replaced)
src/lib/economics.ts  split and milestone constants
src/lib/handle.ts   OnlyFans handle normalisation
backend/            parked server code: database, launch orchestration, fee router, OnlyFans OAuth, worker
```

## Known limits

- Attribution by traded volume estimates what each token contributed to a pooled claim; pump.fun pools creator fees per creator wallet, not per mint.
- Payouts are in SOL. There is no OnlyFans equivalent of X Money, so creators receive on-chain to a wallet they link.
- The treasury is a hot wallet. Anyone can launch a token naming any handle; the description tag makes the routing visible, nothing more.
- Not affiliated with OnlyFans or pump.fun.
