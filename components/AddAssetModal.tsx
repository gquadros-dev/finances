"use client";

import { useState } from "react";
import Modal from "./Modal";
import { CLASS_LABELS, type AssetClass } from "@/lib/types";

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAssetModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    ticker: "",
    name: "",
    class: "acoes" as AssetClass,
    current_price: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, current_price: Number(form.current_price) }),
    });
    onSuccess();
    onClose();
  };

  return (
    <Modal title="Novo Ativo" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Ticker
          </label>
          <input
            required
            value={form.ticker}
            onChange={(e) => set("ticker", e.target.value.toUpperCase())}
            className={inputCls}
            placeholder="ex: BOVA11"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Nome
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls}
            placeholder="ex: iShares Ibovespa ETF"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Classe
          </label>
          <select
            value={form.class}
            onChange={(e) => set("class", e.target.value)}
            className={inputCls}
          >
            {(Object.entries(CLASS_LABELS) as [AssetClass, string][]).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Preço Atual (R$)
          </label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={form.current_price}
            onChange={(e) => set("current_price", e.target.value)}
            className={inputCls}
            placeholder="0,00"
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
            Adicionar
          </button>
        </div>
      </form>
    </Modal>
  );
}
