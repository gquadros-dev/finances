import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const assetId = request.nextUrl.searchParams.get("asset_id");
    const rows = assetId
      ? db
          .prepare("SELECT * FROM purchases WHERE asset_id = ? ORDER BY date DESC")
          .all(assetId)
      : db.prepare("SELECT * FROM purchases ORDER BY date DESC").all();
    return Response.json(rows);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { asset_id, quantity, price_per_unit, date } = await request.json();
    const id = randomUUID();
    db.prepare(
      "INSERT INTO purchases (id, asset_id, quantity, price_per_unit, date) VALUES (?, ?, ?, ?, ?)"
    ).run(id, asset_id, quantity, price_per_unit, date);
    return Response.json({ id }, { status: 201 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
