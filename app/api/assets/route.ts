import { randomUUID } from "crypto";
import db from "@/lib/db";

export async function GET() {
  try {
    const rows = db
      .prepare(
        `
        SELECT
          a.*,
          COALESCE(SUM(p.quantity), 0) AS total_quantity,
          COALESCE(SUM(p.quantity * p.price_per_unit), 0) AS total_invested,
          CASE
            WHEN SUM(p.quantity) > 0
            THEN SUM(p.quantity * p.price_per_unit) / SUM(p.quantity)
            ELSE 0
          END AS avg_cost
        FROM assets a
        LEFT JOIN purchases p ON p.asset_id = a.id
        GROUP BY a.id
        ORDER BY a.created_at DESC
      `
      )
      .all() as Record<string, unknown>[];

    const assets = rows.map((a) => {
      const qty = a.total_quantity as number;
      const price = a.current_price as number;
      const invested = a.total_invested as number;
      const current_value = qty * price;
      const gain_loss = current_value - invested;
      return {
        ...a,
        current_value,
        gain_loss,
        gain_loss_pct: invested > 0 ? (gain_loss / invested) * 100 : 0,
      };
    });

    return Response.json(assets);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ticker, name, class: assetClass, current_price } = await request.json();
    const id = randomUUID();
    db.prepare(
      "INSERT INTO assets (id, ticker, name, class, current_price) VALUES (?, ?, ?, ?, ?)"
    ).run(id, (ticker as string).toUpperCase(), name, assetClass, current_price);
    return Response.json({ id }, { status: 201 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
