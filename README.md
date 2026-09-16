# TikPad

Route pump.fun token creator fees to TikTok creators.

Launch a token, point its creator fees at any TikTok `@handle`, and TikPad pays the creator out automatically. The creator does not need an account, a wallet, or to know the token exists until they want to collect. It is the TikTok counterpart of [UsePaid](https://usepaid.app) (which does this for X handles).

## How it works

1. **Launch.** A launcher fills in name, ticker, image and the TikTok handle, then pays the dev buy plus a small network reserve to the TikPad treasury in one wallet transaction. The treasury creates the token on pump.fun (via PumpPortal) as the on-chain *creator*, buys the dev allocation, and transfers those tokens to the launcher. The description carries `Fees to @handle via TikPad` so the routing is visible.
2. **Fees accrue.** Every pump.fun trade pays a creator fee. Because the treasury is the creator, every fee lands with TikPad.
3. **Attribution.** The fee router streams trades for all registered tokens, periodically claims creator fees, and splits each claim across tokens pro-rata by traded volume since the last claim. 80% of a token's share is credited to its TikTok handle, 20% stays with TikPad.
4. **Payout.** The creator signs in with TikTok (Login Kit), which returns the verified username, then links any Solana address. Their unpaid balance is sent in SOL when lifetime earnings cross $5, $10, $20, $50, $100, $250, $500, $1,000 and every $1,000 after.

## Current status: front end only

This deployment is the front end. Every screen works, but launches, sign-in, fee claims and payouts are simulated in the browser (localStorage) so the whole flow can be explored with no wallet, keys or database. The real backend (on-chain launch through PumpPortal, fee router, TikTok Login Kit, database) is parked in [`backend/`](backend/README.md) and is not built or deployed.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffrieshimself-cpu%2FTikPad&project-name=tikpad&repository-name=tikpad)

No environment variables, no database, no native modules. Import the repository and press Deploy.

## Running it locally

```bash
npm install
npm run dev     # http://localhost:3000
```

## Layout

```
src/app             pages (App Router)
src/components      UI (landing feed, launch form, creator dashboard, token + creator views)
src/lib/store.ts    browser-side state: seeded history, launches, sign-in, wallet, simulated claims + payouts
src/lib/economics.ts  split and milestone constants
src/lib/handle.ts   TikTok handle normalisation
backend/            parked server code: database, launch orchestration, fee router, TikTok OAuth, worker
```

## Known limits

- Attribution by traded volume estimates what each token contributed to a pooled claim; pump.fun pools creator fees per creator wallet, not per mint.
- Payouts are in SOL. There is no TikTok equivalent of X Money, so creators receive on-chain to a wallet they link.
- The treasury is a hot wallet. Anyone can launch a token naming any handle; the description tag makes the routing visible, nothing more.
- Not affiliated with TikTok or pump.fun.
