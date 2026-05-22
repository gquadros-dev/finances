import { refreshB3Prices } from "@/lib/prices";

export async function POST() {
  try {
    const result = await refreshB3Prices();
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: `Falha ao buscar preços: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
