import db from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.prepare("DELETE FROM purchases WHERE id = ?").run(id);
  return Response.json({ success: true });
}
