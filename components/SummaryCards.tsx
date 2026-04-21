"use client";

import type { Asset } from "@/lib/types";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  assets: Asset[];
}

export default function SummaryCards({ assets }: Props) {
  const totalInvested = assets.reduce((s, a) => s + a.total_invested, 0);
  const currentValue = assets.reduce((s, a) => s + a.current_value, 0);
  const gainLoss = currentValue - totalInvested;
  const gainLossPct = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
  const positive = gainLoss >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">
          Investido
        </p>
        <p className="text-xl font-bold mt-1.5 text-zinc-900 dark:text-zinc-100 tabular-nums">
          {fmt.format(totalInvested)}
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide">
          Valor Atual
        </p>
        <p className="text-xl font-bold mt-1.5 text-zinc-900 dark:text-zinc-100 tabular-nums">
          {fmt.format(currentValue)}
        </p>
      </div>

      <div
        className={`col-span-2 sm:col-span-1 rounded-2xl p-4 border ${
          positive
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50"
            : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50"
        }`}
      >
        <p
          className={`text-xs font-medium uppercase tracking-wide ${
            positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          Ganho / Perda
        </p>
        <p
          className={`text-xl font-bold mt-1.5 tabular-nums ${
            positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          {positive ? "+" : ""}
          {fmt.format(gainLoss)}
        </p>
        <p
          className={`text-sm font-semibold tabular-nums ${
            positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          {positive ? "+" : ""}
          {gainLossPct.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
