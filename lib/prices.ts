import db from "./db";

const B3_CLASSES = ["acoes", "fundos-imobiliarios"];

interface BrapiQuote {
  symbol: string;
  regularMarketPrice: number;
}

interface BrapiResponse {
  results: BrapiQuote[];
}

export async function refreshB3Prices(): Promise<{ updated: number; errors: string[] }> {
  const assets = db
    .prepare("SELECT id, ticker, class FROM assets")
    .all() as { id: string; ticker: string; class: string }[];

  const b3Assets = assets.filter((a) => B3_CLASSES.includes(a.class));
  if (b3Assets.length === 0) return { updated: 0, errors: [] };

  const token = process.env.BRAPI_TOKEN;

  const responses = await Promise.all(
    b3Assets.map((a) => {
      const url = `https://brapi.dev/api/quote/${a.ticker}${token ? `?token=${token}` : ""}`;
      return fetch(url, { cache: "no-store" })
        .then((r) => r.json() as Promise<BrapiResponse>)
        .catch(() => ({ results: [] } as BrapiResponse));
    })
  );

  const priceMap = new Map(
    responses.flatMap((d) => d.results.map((q) => [q.symbol, q.regularMarketPrice]))
  );

  const updateStmt = db.prepare("UPDATE assets SET current_price = ? WHERE id = ?");
  const errors: string[] = [];
  let updated = 0;

  const applyUpdates = db.transaction(() => {
    for (const asset of b3Assets) {
      const price = priceMap.get(asset.ticker);
      if (price !== undefined && price > 0) {
        updateStmt.run(price, asset.id);
        updated++;
      } else {
        errors.push(asset.ticker);
      }
    }
  });

  applyUpdates();

  return { updated, errors };
}
