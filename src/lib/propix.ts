/**
 * Contrato compartilhado entre o frontend, as Netlify Functions e as rotas
 * de servidor. Não contém credenciais.
 */
export const PROPIX_BASE_URL = "https://api.propixbr.com";

export type CreatePixResponse = {
  transactionId: string;
  copyPaste: string;
  qrcodeUrl: string;
  status: string;
};

export type PixStatusResponse = {
  transactionId: string;
  transactionState: string;
  paid: boolean;
};

export type ApiError = { error: string };

export function normalizeAmount(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return null;
  const rounded = Math.round(amount * 100) / 100;
  if (rounded < 5 || rounded > 7000) return null;
  return rounded;
}
