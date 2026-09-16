# TikPad

Route pump.fun token creator fees to TikTok creators.

Launch a token, point its creator fees at any TikTok `@handle`, and TikPad pays the creator out automatically. The creator does not need an account, a wallet, or to know the token exists until they want to collect. It is the TikTok counterpart of [UsePaid](https://usepaid.app) (which does this for X handles).

## How it works

1. **Launch.** A launcher fills in name, ticker, image and the TikTok handle, then pays the dev buy plus a small network reserve to the TikPad treasury in one wallet transaction. The treasury creates the token on pump.fun (via PumpPortal) as the on-chain *creator*, buys the dev allocation, and transfers those tokens to the launcher. The description carries `Fees to @handle via TikPad` so the routing is visible.
2. **Fees accrue.** Every pump.fun trade pays a creator fee. Because the treasury is the creator, every fee lands with TikPad.
3. **Attribution.** The fee router streams trades for all registered tokens, periodically claims creator fees, and splits each claim across tokens pro-rata by traded volume since the last claim. 80% of a token's share is credited to its TikTok handle, 20% stays with TikPad.
4. **Payout.** The creator signs in with TikTok (Login Kit), which returns the verified username, then links any Solana address. Their unpaid balance is sent in SOL when lifetime earnings cross $5, $10, $20, $50, $100, $250, $500, $1,000 and every $1,000 after.

## Running it

```bash
npm install
cp .env.example .env      # fill in what you have (see below)
npm run dev               # web app + API on http://localhost:3000
npm run worker            # fee router: streams trades, claims fees, attributes, pays
```

Without `TREASURY_SECRET_KEY` the app runs in **demo mode**: sample data is seeded, launches and payouts are simulated and flagged as demo, and nothing touches the chain. The worker fakes fee claims in demo mode so the UI stays alive.

### Going live

| Variable | Purpose |
| --- | --- |
| `TREASURY_SECRET_KEY` | Hot wallet that creates tokens and pays creators. Base58 or JSON byte array. Keep it funded with a little SOL for fees. |
| `PINATA_JWT` | Uploads token images and metadata to IPFS (pump.fun no longer hosts metadata). |
| `SOLANA_RPC_URL` | A dedicated RPC is strongly recommended over the public endpoint. |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | TikTok Login Kit app with scopes `user.info.basic` and `user.info.profile`; redirect URL `$NEXT_PUBLIC_APP_URL/api/auth/tiktok/callback`. Until set, a demo sign-in that does not verify ownership is used. |
| `SESSION_SECRET` | Signs session cookies. |

Economics knobs (`CREATOR_SHARE_BPS`, `LAUNCH_FEE_LAMPORTS`, `LAUNCH_NETWORK_LAMPORTS`, milestones) are documented in `.env.example` and `src/lib/config.ts`.

## Layout

```
src/app            pages + API routes (App Router)
src/components     UI (landing feed, launch form, creator dashboard)
src/lib/config.ts  env + constants, demo-mode switch
src/lib/db.ts      SQLite schema and queries (better-sqlite3)
src/lib/launch.ts  quote → payment verification → IPFS → pump.fun create → dev-buy sweep
src/lib/router.ts  fee attribution + milestone payouts
src/lib/pumpportal.ts  PumpPortal trade-local (create, collectCreatorFee) + Pinata uploads
src/lib/tiktok.ts  handle normalisation + Login Kit OAuth
scripts/worker.ts  the fee router process
```

## Known limits

- Attribution by traded volume estimates what each token contributed to a pooled claim; pump.fun pools creator fees per creator wallet, not per mint.
- Payouts are in SOL. There is no TikTok equivalent of X Money, so creators receive on-chain to a wallet they link.
- The treasury is a hot wallet. Anyone can launch a token naming any handle; the description tag makes the routing visible, nothing more.
- Not affiliated with TikTok or pump.fun.
