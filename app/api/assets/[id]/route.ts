import db from "@/lib/db";

const ALLOWED = ["ticker", "name", "class", "current_price"];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const keys = Object.keys(body).filter((k) => ALLOWED.includes(k));
  if (!keys.length) return Response.json({ error: "No valid fields" }, { status: 400 });
  const set = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => body[k]);
  db.prepare(`UPDATE assets SET ${set} WHERE id = ?`).run(...values, id);
  return Response.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.prepare("DELETE FROM assets WHERE id = ?").run(id);
  return Response.json({ success: true });
}
