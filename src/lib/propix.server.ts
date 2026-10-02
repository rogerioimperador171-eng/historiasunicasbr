import { randomUUID } from "node:crypto";
import { normalizeAmount } from "./propix";

type Environment = Record<string, string | undefined>;
type PixInput = {
  amount?: unknown;
  payerName?: unknown;
  description?: unknown;
  payerDocument?: unknown;
  payerEmail?: unknown;
  payerPhone?: unknown;
};

function getApiKey(env: Environment): string {
  const apiKey = env["FLEVOPAY_API_KEY"]?.trim();
  if (!apiKey) {
    throw new Error("Credencial do Pix não configurada (FLEVOPAY_API_KEY).");
  }
  return apiKey;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function callFlevoPay(
  path: string,
  env: Environment,
  payload?: unknown,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const apiKey = getApiKey(env);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`https://app.flevopay.com.br${path}`, {
      method: payload === undefined ? "GET" : "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      signal: controller.signal,
      redirect: "error",
    });
    let data: Record<string, unknown> = {};
    try {
      const parsed: unknown = await response.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>;
      }
    } catch {
      data = {};
    }
    return { ok: response.ok, status: response.status, data };
  } catch {
    throw new Error("Falha de comunicação com o provedor Pix.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function createPix(input: PixInput | null, env: Environment) {
  const amount = normalizeAmount(input?.amount);
  if (amount === null) {
    return {
      status: 400,
      body: { error: "Valor inválido. O mínimo é R$ 5,00 e o máximo R$ 7.000,00." },
    };
  }
  const payerName =
    typeof input?.payerName === "string" && input.payerName.trim()
      ? input.payerName.trim().slice(0, 80)
      : "Doador Anonimo";
  const description =
    typeof input?.description === "string" && input.description.trim()
      ? input.description.trim().slice(0, 120)
      : "Doacao Historias Unicas";

  const document = (
    readString(input?.payerDocument) || readString(env["FLEVOPAY_DEFAULT_DOCUMENT"])
  ).replace(/\D/g, "");
  const email = readString(input?.payerEmail) || readString(env["FLEVOPAY_DEFAULT_EMAIL"]);
  const phone = (
    readString(input?.payerPhone) || readString(env["FLEVOPAY_DEFAULT_PHONE"])
  ).replace(/\D/g, "");
  if (
    !/^\d{11}(?:\d{3})?$/.test(document) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^\d{10,13}$/.test(phone)
  ) {
    return {
      status: 400,
      body: { error: "Dados do pagador incompletos ou inválidos para gerar o Pix." },
    };
  }

  const payload: Record<string, unknown> = {
    amount: Math.round(amount * 100),
    description,
    reference: randomUUID(),
    source: "api_externa",
    customer: { name: payerName, email, document, phone },
  };
  const postbackUrl = env["FLEVOPAY_POSTBACK_URL"]?.trim();
  if (postbackUrl) {
    const url = new URL(postbackUrl);
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error("FLEVOPAY_POSTBACK_URL deve ser uma URL HTTPS sem credenciais.");
    }
    payload["postback_url"] = url.href;
  }

  const { ok, status, data } = await callFlevoPay("/api/v1/transaction", env, payload);
  const transactionId =
    typeof data["transaction_id"] === "number" &&
    Number.isSafeInteger(data["transaction_id"]) &&
    data["transaction_id"] > 0
      ? String(data["transaction_id"])
      : readString(data["transaction_id"]) || readString(data["id"]);
  const copyPaste = readString(data["qr_code"]);
  if (!ok || data["status"] !== "success" || !transactionId || !copyPaste) {
    return {
      status: status >= 400 ? status : 502,
      body: { error: "Não foi possível gerar o Pix agora. Tente novamente." },
    };
  }

  return {
    status: 200,
    body: {
      transactionId,
      copyPaste,
      qrcodeUrl: /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(readString(data["qr_code_base64"]))
        ? readString(data["qr_code_base64"])
        : "",
      status: "PENDENTE",
    },
  };
}

export async function checkPix(input: { transactionId?: unknown } | null, env: Environment) {
  const transactionId = readString(input?.transactionId);
  if (!transactionId || transactionId.length > 200) {
    return { status: 400, body: { error: "transactionId obrigatório." } };
  }

  const query = new URLSearchParams({ action: "get_transaction", id: transactionId });
  const { ok, status, data } = await callFlevoPay(`/api/v1/query?${query}`, env);
  const state = readString(data["status"]).toLowerCase();
  if (!ok || !state || data["success"] === false) {
    return {
      status: status >= 400 ? status : 502,
      body: { error: "Não foi possível consultar o pagamento." },
    };
  }

  return {
    status: 200,
    body: {
      transactionId,
      transactionState: state,
      paid: state === "approved",
    },
  };
}
