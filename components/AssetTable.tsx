"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CLASS_LABELS, CLASS_COLORS, type Asset } from "@/lib/types";
import type { Purchase } from "@/lib/types";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const fmtQty = (n: number) =>
  Number.isInteger(n) ? n.toString() : n.toLocaleString("pt-BR", { maximumFractionDigits: 6 });

interface ChartPoint {
  date: string;
  pct: number;        // % change from first purchase price
  pricePerUnit: number;
  quantity: number;
}

interface Props {
  assets: Asset[];
  onAddPurchase: (a: Asset) => void;
  onUpdatePrice: (a: Asset) => void;
  onViewPurchases: (a: Asset) => void;
  onDelete: (a: Asset) => void;
}

export default function AssetTable({
  assets,
  onAddPurchase,
  onUpdatePrice,
  onViewPurchases,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [purchasesCache, setPurchasesCache] = useState<Record<string, ChartPoint[]>>({});

  const toggle = async (a: Asset) => {
    const isOpen = expanded.has(a.id);
    setExpanded((prev) => {
      const next = new Set(prev);
      isOpen ? next.delete(a.id) : next.add(a.id);
      return next;
    });

    if (!isOpen && !purchasesCache[a.id]) {
      const res = await fetch(`/api/purchases?asset_id=${a.id}`);
      const data: Purchase[] = await res.json();
      const sorted = [...data].sort((x, y) => x.date.localeCompare(y.date));
      const base = sorted[0]?.price_per_unit ?? 1;
      const points: ChartPoint[] = sorted.map((p) => ({
        date: p.date,
        pct: ((p.price_per_unit - base) / base) * 100,
        pricePerUnit: p.price_per_unit,
        quantity: p.quantity,
      }));
      setPurchasesCache((prev) => ({ ...prev, [a.id]: points }));
    }
  };

  if (assets.length === 0) {
    return (
      <div className="py-20 text-center text-zinc-400">
        <p className="text-base">Nenhum ativo cadastrado</p>
        <p className="text-sm mt-1">Clique em &ldquo;+ Ativo&rdquo; para começar</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
      {assets.map((a) => {
        const isOpen = expanded.has(a.id);
        const gain = a.gain_loss >= 0;
        const gainCls = gain ? "text-emerald-500" : "text-red-500";
        const gainBg = gain
          ? "bg-emerald-50 dark:bg-emerald-950/40"
          : "bg-red-50 dark:bg-red-950/40";
        const color = CLASS_COLORS[a.class];
        const points = purchasesCache[a.id] ?? [];

        return (
          <div key={a.id}>
            {/* ── Main row ── */}
            <button
              onClick={() => toggle(a)}
              className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {a.ticker}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white leading-none"
                    style={{ backgroundColor: color }}
                  >
                    {CLASS_LABELS[a.class]}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  {a.name}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {fmtCompact.format(a.current_value)}
                </p>
                <p className="text-xs text-zinc-400">{fmtQty(a.total_quantity)} un.</p>
              </div>

              <div className={`shrink-0 rounded-lg px-2 py-1 text-right ${gainBg}`}>
                <p className={`text-xs font-semibold ${gainCls}`}>
                  {gain ? "+" : ""}
                  {a.gain_loss_pct.toFixed(1)}%
                </p>
              </div>

              <svg
                className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* ── Expanded panel ── */}
            {isOpen && (
              <div className="px-4 pb-5 space-y-5 bg-zinc-50/60 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-800/50">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                  <Stat label="P. Médio" value={fmt.format(a.avg_cost)} />
                  <Stat label="Preço Atual" value={fmt.format(a.current_price)} />
                  <Stat label="Investido" value={fmt.format(a.total_invested)} />
                  <Stat
                    label="Ganho / Perda"
                    value={`${gain ? "+" : ""}${fmt.format(a.gain_loss)}`}
                    valueClass={gainCls}
                  />
                </div>

                {/* Chart */}
                {points.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                      Variação de preço por aporte
                    </p>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            ...points,
                            // append current price as trailing point
                            {
                              date: "hoje",
                              pct: ((a.current_price - points[0].pricePerUnit) / points[0].pricePerUnit) * 100,
                              pricePerUnit: a.current_price,
                              quantity: 0,
                            },
                          ]}
                          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                        >
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: "#71717a" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: string) => {
                              if (v === "hoje") return "hoje";
                              const [y, m, d] = v.split("-");
                              return `${d}/${m}/${y.slice(2)}`;
                            }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#71717a" }}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                            tickFormatter={(v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`}
                          />
                          <Tooltip content={<PurchaseTooltip base={points[0].pricePerUnit} />} />
                          <ReferenceLine
                            y={0}
                            stroke="#71717a"
                            strokeDasharray="3 3"
                            strokeWidth={1}
                          />
                          <Line
                            type="monotone"
                            dataKey="pct"
                            stroke={color}
                            strokeWidth={2}
                            dot={<PurchaseDot color={color} />}
                            activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 text-center py-4">
                    Nenhuma compra registrada
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onAddPurchase(a)}
                    className="flex-1 sm:flex-none px-3 py-2 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                  >
                    + Compra
                  </button>
                  <button
                    onClick={() => onViewPurchases(a)}
                    className="flex-1 sm:flex-none px-3 py-2 text-xs rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 font-medium"
                  >
                    Ver Compras
                  </button>
                  <button
                    onClick={() => onUpdatePrice(a)}
                    className="flex-1 sm:flex-none px-3 py-2 text-xs rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 font-medium"
                  >
                    Atualizar Preço
                  </button>
                  <button
                    onClick={() => onDelete(a)}
                    className="px-3 py-2 text-xs rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 font-medium"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PurchaseDot({
  cx,
  cy,
  color,
}: {
  cx?: number;
  cy?: number;
  color: string;
  [key: string]: unknown;
}) {
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="white"
      strokeWidth={2}
    />
  );
}

function PurchaseTooltip({
  active,
  payload,
  base,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  base?: number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const isToday = p.date === "hoje";
  const dateLabel = isToday
    ? "Preço atual"
    : (() => {
        const [y, m, d] = p.date.split("-");
        return `${d}/${m}/${y}`;
      })();
  const sign = p.pct >= 0 ? "+" : "";
  const pctColor = p.pct >= 0 ? "text-emerald-500" : "text-red-500";
  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg px-3 py-2.5 text-xs space-y-1 min-w-36">
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{dateLabel}</p>
      <p className="text-zinc-500 dark:text-zinc-400">
        Preço:{" "}
        <span className="text-zinc-900 dark:text-zinc-100 font-medium">
          {fmt.format(p.pricePerUnit)}
        </span>
      </p>
      {!isToday && p.quantity > 0 && (
        <p className="text-zinc-500 dark:text-zinc-400">
          Qtd:{" "}
          <span className="text-zinc-900 dark:text-zinc-100 font-medium">
            {fmtQty(p.quantity)}
          </span>
        </p>
      )}
      <p className={`font-semibold ${pctColor}`}>
        {sign}{p.pct.toFixed(2)}% vs. 1ª compra
      </p>
      {base != null && (
        <p className="text-zinc-400 text-[10px]">
          Base: {fmt.format(base)}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = "text-zinc-900 dark:text-zinc-100",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-800/60 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700/50">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}
