"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import type { Asset, Purchase } from "@/lib/types";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR");

interface Props {
  asset: Asset;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchasesModal({ asset, onClose, onSuccess }: Props) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch(`/api/purchases?asset_id=${asset.id}`);
    setPurchases(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/purchases/${id}`, { method: "DELETE" });
    onSuccess();
    load();
  };

  return (
    <Modal title={`Compras — ${asset.ticker}`} onClose={onClose}>
      {loading ? (
        <p className="text-zinc-500 text-sm py-4 text-center">Carregando...</p>
      ) : purchases.length === 0 ? (
        <p className="text-zinc-500 text-sm py-4 text-center">
          Nenhuma compra registrada.
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {purchases.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {p.quantity} × {fmt.format(p.price_per_unit)}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {fmtDate(p.date)} · Total: {fmt.format(p.quantity * p.price_per_unit)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-red-400 hover:text-red-600 text-sm ml-4 shrink-0"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
        >
          Fechar
        </button>
      </div>
    </Modal>
  );
}
