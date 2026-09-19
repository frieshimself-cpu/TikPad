/**
 * One-off real launch from the treasury itself (no launcher payment step).
 * Proves the pump.fun path end to end. Spends ~0.02 SOL + dev buy from the treasury.
 *
 *   npx tsx scripts/test-launch.ts --name "FansPad Test" --symbol FPTEST --uri https://.../meta.json --devbuy 0.005
 */
import "dotenv/config";
import { createToken } from "../src/lib/server/pumpportal";
import { insertToken } from "../src/lib/server/db";
import { treasuryKeypair, treasuryBalance } from "../src/lib/server/solana";

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  if (v === undefined && fallback === undefined) throw new Error(`missing --${name}`);
  return v ?? fallback!;
}

async function main() {
  const name = arg("name");
  const symbol = arg("symbol").toUpperCase();
  const uri = arg("uri");
  const devBuySol = Number(arg("devbuy", "0"));
  const kp = treasuryKeypair();
  const bal = await treasuryBalance();
  console.log(`treasury ${kp.publicKey.toBase58()} balance ${bal / 1e9} SOL`);
  const need = 0.025 + devBuySol;
  if (bal / 1e9 < need) throw new Error(`need at least ${need} SOL in the treasury for this launch`);
  console.log(`creating ${name} ($${symbol}) with dev buy ${devBuySol} SOL, metadata ${uri}`);
  const { mint, signature } = await createToken({ name, symbol, metadataUri: uri, devBuySol });
  await insertToken({
    mint, name, symbol, description: "", image_url: null, metadata_uri: uri,
    launcher_wallet: kp.publicKey.toBase58(), dev_buy_lamports: Math.round(devBuySol * 1e9), create_sig: signature, sweep_sig: null,
  });
  console.log(`mint: ${mint}`);
  console.log(`tx:   https://solscan.io/tx/${signature}`);
  console.log(`pump: https://pump.fun/coin/${mint}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("test launch failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
