"use client";

import { useEffect, useState } from "react";
import { CLASS_LABELS, CLASS_COLORS, type AssetClass, type Asset } from "@/lib/types";

const CLASSES = Object.keys(CLASS_LABELS) as AssetClass[];
const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type Targets = Record<AssetClass, number>;

const emptyTargets = () =>
  Object.fromEntries(CLASSES.map((c) => [c, 0])) as Targets;

interface Props {
  assets: Asset[];
  hideValues?: boolean;
}

export default function TargetAllocation({ assets, hideValues }: Props) {
  const [targets, setTargets] = useState<Targets>(emptyTargets);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<AssetClass, string>>(
    Object.fromEntries(CLASSES.map((c) => [c, "0"])) as Record<AssetClass, string>
  );

  useEffect(() => {
    fetch("/api/targets")
      .then((r) => r.json())
      .then((data: Partial<Targets>) => {
        const merged = { ...emptyTargets(), ...data } as Targets;
        setTargets(merged);
        setDraft(
          Object.fromEntries(CLASSES.map((c) => [c, String(merged[c] ?? 0)])) as Record<
            AssetClass,
            string
          >
        );
      });
  }, []);

  const totalValue = assets.reduce((s, a) => s + a.current_value, 0);
  const totalTarget = CLASSES.reduce((s, c) => s + (targets[c] ?? 0), 0);
  const draftTotal = CLASSES.reduce((s, c) => s + (Number(draft[c]) || 0), 0);

  const startEdit = () => {
    setDraft(
      Object.fromEntries(CLASSES.map((c) => [c, String(targets[c] ?? 0)])) as Record<
        AssetClass,
        string
      >
    );
    setEditing(true);
  };

  const handleSave = async () => {
    const parsed = Object.fromEntries(
      CLASSES.map((c) => [c, Math.max(0, Number(draft[c]) || 0)])
    ) as Targets;
    await fetch("/api/targets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    setTargets(parsed);
    setEditing(false);
  };

  const rows = CLASSES.map((cls) => {
    const currentValue = assets
      .filter((a) => a.class === cls)
      .reduce((s, a) => s + a.current_value, 0);
    const currentPct = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    const targetPct = targets[cls] ?? 0;
    const diff = totalValue * (targetPct / 100) - currentValue;
    return { cls, currentValue, currentPct, targetPct, diff };
  });

  const draftTotalCls =
    draftTotal === 100
      ? "text-emerald-600"
      : draftTotal > 100
      ? "text-red-500"
      : "text-amber-500";

  const draftTotalMsg =
    draftTotal === 100
      ? "✓"
      : draftTotal > 100
      ? `excedeu em ${draftTotal - 100}%`
      : `faltam ${100 - draftTotal}%`;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Monte sua Carteira
        </h2>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              Salvar
            </button>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Editar Metas
          </button>
        )}
      </div>

      <div className="p-6">
        {editing ? (
          /* ── Edit mode ── */
          <div className="space-y-3">
            {CLASSES.map((cls) => (
              <div key={cls} className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CLASS_COLORS[cls] }}
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">
                  {CLASS_LABELS[cls]}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={draft[cls]}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [cls]: e.target.value }))
                    }
                    className="w-16 px-2 py-1.5 text-sm text-right rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-400">%</span>
                </div>
              </div>
            ))}

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Total</span>
              <span className={`text-sm font-semibold ${draftTotalCls}`}>
                {draftTotal}% &nbsp;{draftTotalMsg}
              </span>
            </div>
          </div>
        ) : totalTarget === 0 ? (
          /* ── Empty state ── */
          <p className="text-zinc-400 text-sm text-center py-6">
            Nenhuma meta definida.{" "}
            <button
              onClick={startEdit}
              className="text-blue-500 hover:underline"
            >
              Clique aqui para começar.
            </button>
          </p>
        ) : (
          /* ── View mode ── */
          <div className="space-y-5">
            {rows.map(({ cls, currentPct, targetPct, diff }) => {
              const onTarget = Math.abs(currentPct - targetPct) < 0.5;
              const needsBuy = !onTarget && diff > 0;
              const needsSell = !onTarget && diff < 0;

              return (
                <div key={cls} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CLASS_COLORS[cls] }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 flex-1 min-w-0">
                      {CLASS_LABELS[cls]}
                    </span>
                    <span className="text-zinc-400 text-xs shrink-0">
                      meta {targetPct}%
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 w-12 text-right shrink-0">
                      {currentPct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    {/* Current fill */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(currentPct, 100)}%`,
                        backgroundColor: CLASS_COLORS[cls],
                        opacity: 0.85,
                      }}
                    />
                  </div>

                  {/* Target marker row */}
                  <div className="relative h-1">
                    <div
                      className="absolute top-0 w-0.5 h-3 -translate-y-1/2 bg-zinc-400 dark:bg-zinc-500 rounded-full"
                      style={{ left: `calc(${Math.min(targetPct, 100)}% - 1px)` }}
                      title={`Meta: ${targetPct}%`}
                    />
                  </div>

                  {/* Action label */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">
                      {targetPct > 0 ? `meta: ${targetPct}%` : "sem meta"}
                    </span>
                    {onTarget ? (
                      <span className="text-xs font-medium text-emerald-600">OK ✓</span>
                    ) : needsBuy ? (
                      <span className="text-xs font-medium text-blue-600">
                        Comprar {hideValues ? "••••" : fmt.format(diff)}
                      </span>
                    ) : needsSell ? (
                      <span className="text-xs font-medium text-amber-600">
                        Vender {hideValues ? "••••" : fmt.format(Math.abs(diff))}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Meta total:{" "}
                <span
                  className={`font-medium ${
                    totalTarget === 100 ? "text-emerald-600" : "text-amber-500"
                  }`}
                >
                  {totalTarget}%{totalTarget === 100 ? " ✓" : ""}
                </span>
              </span>
              {totalValue > 0 && <span>Carteira: {hideValues ? "••••" : fmt.format(totalValue)}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
