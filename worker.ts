import { Worker } from "bullmq";
import { connection, pricesQueue } from "./lib/queue";
import { refreshB3Prices } from "./lib/prices";

const DELAY_MS = Number(process.env.PRICE_REFRESH_MS ?? 5 * 60 * 1000);

const worker = new Worker(
  "prices",
  async () => {
    const result = await refreshB3Prices();
    const ts = new Date().toLocaleTimeString("pt-BR");
    console.log(
      `[${ts}] Preços atualizados: ${result.updated}` +
        (result.errors.length > 0 ? ` | Não encontrados: ${result.errors.join(", ")}` : "")
    );
  },
  { connection }
);

worker.on("completed", () => {
  pricesQueue.add("refresh", {}, { delay: DELAY_MS });
});

worker.on("failed", (_job, err) => {
  console.error(`Job falhou: ${err.message}`);
  pricesQueue.add("refresh", {}, { delay: DELAY_MS });
});

async function bootstrap() {
  const counts = await pricesQueue.getJobCounts("waiting", "delayed", "active");
  const total = counts.waiting + counts.delayed + counts.active;
  if (total === 0) {
    await pricesQueue.add("refresh", {}, { delay: 0 });
    console.log("Worker iniciado — primeiro job enfileirado.");
  } else {
    console.log(`Worker iniciado — ${total} job(s) já na fila.`);
  }
}

bootstrap().catch(console.error);
