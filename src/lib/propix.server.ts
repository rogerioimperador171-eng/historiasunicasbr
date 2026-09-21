import { PROPIX_BASE_URL, normalizeAmount } from "./propix";

type Credentials = { clientId: string; clientSecret: string };

function getCredentials(env: Record<string, string | undefined>): Credentials {
  const clientId = env["PROPAY_CLIENT_ID"];
  const clientSecret = env["PROPAY_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    throw new Error("Credenciais do Pix não configuradas (PROPAY_CLIENT_ID / PROPAY_CLIENT_SECRET).");
  }
  return { clientId, clientSecret };
}

async function callPropix(
  path: string,
  payload: unknown,
  env: Record<string, string | undefined>,
): Promise<{ ok: boolean; status: number; data: any }> {
  const { clientId, clientSecret } = getCredentials(env);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${PROPIX_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

export async function createPix(
  input: { amount: unknown; payerName?: unknown; description?: unknown; payerDocument?: unknown },
  env: Record<string, string | undefined>,
) {
  const amount = normalizeAmount(input.amount);
  if (amount === null) {
    return { status: 400, body: { error: "Valor inválido. O mínimo é R$ 5,00 e o máximo R$ 7.000,00." } };
  }
  const payerName =
    typeof input.payerName === "string" && input.payerName.trim()
      ? input.payerName.trim().slice(0, 80)
      : "Doador Anonimo";
  const description =
    typeof input.description === "string" && input.description.trim()
      ? input.description.trim().slice(0, 120)
      : "Doacao Historias Unicas";

  const payload: Record<string, unknown> = { amount, description, payerName };
  if (typeof input.payerDocument === "string") {
    const doc = input.payerDocument.replace(/\D/g, "");
    if (doc.length === 11 || doc.length === 14) payload["payerDocument"] = doc;
  }

  const { ok, status, data } = await callPropix("/api/v1/deposit", payload, env);
  if (!ok || !data?.copyPaste) {
    return {
      status: status >= 400 ? status : 502,
      body: { error: data?.message || "Não foi possível gerar o Pix agora. Tente novamente." },
    };
  }

  return {
    status: 200,
    body: {
      transactionId: String(data.transactionId),
      copyPaste: String(data.copyPaste),
      qrcodeUrl: String(data.qrcodeUrl ?? ""),
      status: "PENDENTE",
    },
  };
}

export async function checkPix(
  input: { transactionId: unknown },
  env: Record<string, string | undefined>,
) {
  const transactionId = typeof input.transactionId === "string" ? input.transactionId.trim() : "";
  if (!transactionId) {
    return { status: 400, body: { error: "transactionId obrigatório." } };
  }

  const { ok, status, data } = await callPropix("/api/v1/check", { transactionId }, env);
  if (!ok) {
    return {
      status: status >= 400 ? status : 502,
      body: { error: data?.message || "Não foi possível consultar o pagamento." },
    };
  }

  const state = String(data?.transaction?.transactionState ?? data?.transactionState ?? "PENDENTE");
  return {
    status: 200,
    body: {
      transactionId,
      transactionState: state,
      paid: state.toUpperCase() === "COMPLETO",
    },
  };
}
