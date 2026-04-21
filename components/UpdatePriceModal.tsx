"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { Asset } from "@/lib/types";

interface Props {
  asset: Asset;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpdatePriceModal({ asset, onClose, onSuccess }: Props) {
  const [price, setPrice] = useState(String(asset.current_price));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/assets/${asset.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_price: Number(price) }),
    });
    onSuccess();
    onClose();
  };

  return (
    <Modal title={`Atualizar Preço — ${asset.ticker}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Novo Preço Atual (R$)
          </label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 text-sm"
          >
            Atualizar
          </button>
        </div>
      </form>
    </Modal>
  );
}
