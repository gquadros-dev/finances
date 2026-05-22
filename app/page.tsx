"use client";

import { useCallback, useEffect, useState } from "react";
import SummaryCards from "@/components/SummaryCards";
import AllocationChart from "@/components/AllocationChart";
import AssetTable from "@/components/AssetTable";
import AddAssetModal from "@/components/AddAssetModal";
import AddPurchaseModal from "@/components/AddPurchaseModal";
import UpdatePriceModal from "@/components/UpdatePriceModal";
import PurchasesModal from "@/components/PurchasesModal";
import type { Asset } from "@/lib/types";

type ActiveModal =
  | { type: "addAsset" }
  | { type: "addPurchase"; asset?: Asset }
  | { type: "updatePrice"; asset: Asset }
  | { type: "purchases"; asset: Asset };

interface QueueStatus {
  counts: { waiting: number; delayed: number; active: number; completed: number; failed: number };
  lastRun: string | null;
}

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [modal, setModal] = useState<ActiveModal | null>(null);
  const [hideValues, setHideValues] = useState(false);
  const [queue, setQueue] = useState<QueueStatus | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/assets");
      setAssets(await res.json());
    } catch {}
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/queue");
      if (res.ok) setQueue(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    load();
    loadQueue();
    const interval = setInterval(() => { load(); loadQueue(); }, 30000);
    return () => clearInterval(interval);
  }, [load, loadQueue]);

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Remover ${asset.ticker}? Todas as compras serão apagadas.`)) return;
    await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
    load();
  };

  const close = () => setModal(null);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Minhas Finanças
          </h1>
          <div className="flex items-center gap-2">
            {queue && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    queue.counts.active > 0
                      ? "bg-green-500 animate-pulse"
                      : queue.counts.failed > 0
                      ? "bg-red-500"
                      : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
                {queue.counts.active > 0
                  ? "atualizando"
                  : queue.lastRun
                  ? new Date(queue.lastRun).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                  : "aguardando"}
              </div>
            )}
            <button
              onClick={() => setHideValues((v) => !v)}
              className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              title={hideValues ? "Mostrar valores" : "Ocultar valores"}
            >
              {hideValues ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setModal({ type: "addPurchase" })}
              disabled={assets.length === 0}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Compra
            </button>
            <button
              onClick={() => setModal({ type: "addAsset" })}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
            >
              + Ativo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <SummaryCards assets={assets} hideValues={hideValues} />

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Alocação por Classe
          </h2>
          <AllocationChart assets={assets} hideValues={hideValues} />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Ativos {assets.length > 0 && <span className="text-zinc-400 font-normal normal-case">({assets.length})</span>}
            </h2>
          </div>
          <AssetTable
            assets={assets}
            hideValues={hideValues}
            onAddPurchase={(a) => setModal({ type: "addPurchase", asset: a })}
            onUpdatePrice={(a) => setModal({ type: "updatePrice", asset: a })}
            onViewPurchases={(a) => setModal({ type: "purchases", asset: a })}
            onDelete={handleDelete}
          />
        </div>
      </main>

      {modal?.type === "addAsset" && (
        <AddAssetModal onClose={close} onSuccess={load} />
      )}
      {modal?.type === "addPurchase" && (
        <AddPurchaseModal
          assets={assets}
          defaultAssetId={modal.asset?.id}
          onClose={close}
          onSuccess={load}
        />
      )}
      {modal?.type === "updatePrice" && (
        <UpdatePriceModal asset={modal.asset} onClose={close} onSuccess={load} />
      )}
      {modal?.type === "purchases" && (
        <PurchasesModal asset={modal.asset} onClose={close} onSuccess={load} />
      )}
    </div>
  );
}
