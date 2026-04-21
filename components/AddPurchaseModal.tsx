"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { Asset } from "@/lib/types";

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

interface Props {
  assets: Asset[];
  defaultAssetId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPurchaseModal({
  assets,
  defaultAssetId,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState({
    asset_id: defaultAssetId ?? assets[0]?.id ?? "",
    quantity: "",
    price_per_unit: "",
    date: new Date().toISOString().split("T")[0],
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
        price_per_unit: Number(form.price_per_unit),
      }),
    });
    onSuccess();
    onClose();
  };

  return (
    <Modal title="Registrar Compra" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Ativo
          </label>
          <select
            value={form.asset_id}
            onChange={(e) => set("asset_id", e.target.value)}
            className={inputCls}
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.ticker} — {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Quantidade
          </label>
          <input
            required
            type="number"
            step="any"
            min="0.000001"
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            className={inputCls}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Preço Pago por Unidade (R$)
          </label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={form.price_per_unit}
            onChange={(e) => set("price_per_unit", e.target.value)}
            className={inputCls}
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Data
          </label>
          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className={inputCls}
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
            Registrar
          </button>
        </div>
      </form>
    </Modal>
  );
}
