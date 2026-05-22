import { pricesQueue } from "@/lib/queue";

export async function GET() {
  try {
    const [counts, lastCompleted] = await Promise.all([
      pricesQueue.getJobCounts("waiting", "delayed", "active", "completed", "failed"),
      pricesQueue.getJobs(["completed"], 0, 0),
    ]);

    const last = lastCompleted[0];

    return Response.json({
      counts,
      lastRun: last?.finishedOn ? new Date(last.finishedOn).toISOString() : null,
      lastResult: last?.returnvalue ?? null,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
