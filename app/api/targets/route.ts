import db from "@/lib/db";
import { CLASS_LABELS, type AssetClass } from "@/lib/types";

const CLASSES = Object.keys(CLASS_LABELS) as AssetClass[];

export async function GET() {
  try {
    const rows = db.prepare("SELECT * FROM targets").all() as {
      class: AssetClass;
      target_pct: number;
    }[];
    const result = Object.fromEntries(CLASSES.map((c) => [c, 0]));
    for (const row of rows) result[row.class] = row.target_pct;
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, number>;
    const upsert = db.prepare(
      "INSERT OR REPLACE INTO targets (class, target_pct) VALUES (?, ?)"
    );
    const run = db.transaction(() => {
      for (const cls of CLASSES) {
        upsert.run(cls, Math.max(0, Number(body[cls]) || 0));
      }
    });
    run();
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
