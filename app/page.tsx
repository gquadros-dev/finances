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

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [modal, setModal] = useState<ActiveModal | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/assets");
    setAssets(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
          <div className="flex gap-2">
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
        <SummaryCards assets={assets} />

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Alocação por Classe
          </h2>
          <AllocationChart assets={assets} />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Ativos {assets.length > 0 && <span className="text-zinc-400 font-normal normal-case">({assets.length})</span>}
            </h2>
          </div>
          <AssetTable
            assets={assets}
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
