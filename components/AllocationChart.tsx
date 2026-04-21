"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CLASS_LABELS, CLASS_COLORS, type AssetClass, type Asset } from "@/lib/types";

const CLASSES = Object.keys(CLASS_LABELS) as AssetClass[];
const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
type Targets = Record<AssetClass, number>;

interface Props {
  assets: Asset[];
}

export default function AllocationChart({ assets }: Props) {
  const [targets, setTargets] = useState<Targets>(
    Object.fromEntries(CLASSES.map((c) => [c, 0])) as Targets
  );

  useEffect(() => {
    fetch("/api/targets")
      .then((r) => r.json())
      .then((data: Partial<Targets>) => setTargets((t) => ({ ...t, ...data })));
  }, []);

  const saveTarget = async (cls: AssetClass, val: number) => {
    const updated = { ...targets, [cls]: val };
    setTargets(updated);
    await fetch("/api/targets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  const totalValue = assets.reduce((s, a) => s + a.current_value, 0);

  const rows = CLASSES.map((cls) => {
    const value = assets
      .filter((a) => a.class === cls)
      .reduce((s, a) => s + a.current_value, 0);
    const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
    const targetPct = targets[cls] ?? 0;
    const diff = totalValue * (targetPct / 100) - value;
    const onTarget = targetPct === 0 || Math.abs(pct - targetPct) < 0.5;
    return { cls, label: CLASS_LABELS[cls], color: CLASS_COLORS[cls], value, pct, targetPct, diff, onTarget };
  }).sort((a, b) => b.value - a.value);

  const pieData = rows.filter((d) => d.value > 0);

  if (pieData.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">
        Nenhum ativo com valor cadastrado
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Donut — centered */}
      <div className="flex justify-center">
        <div className="w-44 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={80}
                dataKey="value"
                strokeWidth={2}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.cls} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [fmt.format(v as number), "Valor"] as [string, string]}
                labelFormatter={(_, p) =>
                  (p[0]?.payload as { label?: string } | undefined)?.label ?? ""
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-4">
        {rows.map((d) => (
          <div key={d.cls} className="space-y-1.5">
            {/* Line 1: label + value + current % */}
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1 min-w-0 truncate">
                {d.label}
              </span>
              {d.value > 0 && (
                <span className="text-xs text-zinc-400 shrink-0">
                  {fmtCompact.format(d.value)}
                </span>
              )}
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 w-12 text-right shrink-0 tabular-nums">
                {d.pct.toFixed(1)}%
              </span>
            </div>

            {/* Line 2: progress bar */}
            <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{ width: `${Math.min(d.pct, 100)}%`, backgroundColor: d.color }}
              />
              {d.targetPct > 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                  style={{ left: `${Math.min(d.targetPct, 100)}%` }}
                />
              )}
            </div>

            {/* Line 3: meta input + hint */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-400">meta</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={d.targetPct || ""}
                  placeholder="—"
                  onChange={(e) =>
                    setTargets((t) => ({ ...t, [d.cls]: Number(e.target.value) || 0 }))
                  }
                  onBlur={(e) => saveTarget(d.cls, Number(e.target.value) || 0)}
                  className="w-10 px-1.5 py-0.5 text-xs text-right rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-400"
                />
                <span className="text-xs text-zinc-400">%</span>
              </div>

              <div className="text-right">
                {d.targetPct > 0 && (
                  d.onTarget ? (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500">
                      OK ✓
                    </span>
                  ) : d.diff > 0 ? (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      aportar {fmtCompact.format(d.diff)}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      rebalancear {fmtCompact.format(Math.abs(d.diff))}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
