export type AssetClass =
  | "criptomoedas"
  | "acoes"
  | "fundos-imobiliarios"
  | "eua"
  | "renda-fixa"
  | "alternativos";

export const CLASS_LABELS: Record<AssetClass, string> = {
  criptomoedas: "Criptomoedas",
  acoes: "Ações",
  "fundos-imobiliarios": "Fundos Imobiliários",
  eua: "EUA",
  "renda-fixa": "Renda Fixa",
  alternativos: "Alternativos",
};

export const CLASS_COLORS: Record<AssetClass, string> = {
  criptomoedas: "#F59E0B",
  acoes: "#3B82F6",
  "fundos-imobiliarios": "#10B981",
  eua: "#8B5CF6",
  "renda-fixa": "#06B6D4",
  alternativos: "#F97316",
};

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  class: AssetClass;
  current_price: number;
  created_at: string;
  total_quantity: number;
  total_invested: number;
  avg_cost: number;
  current_value: number;
  gain_loss: number;
  gain_loss_pct: number;
}

export interface Purchase {
  id: string;
  asset_id: string;
  quantity: number;
  price_per_unit: number;
  date: string;
  created_at: string;
}
