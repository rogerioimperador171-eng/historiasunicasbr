import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../../db";
import { pixPayments } from "../../db/schema";
import { normalizeAmount } from "./pix";

function customerSchema() {
  return z.object({
    payerName: z
      .string()
      .trim()
      .min(3)
      .max(120)
      .refine((name) => name.split(/\s+/).length >= 2),
    payerEmail: z.string().trim().email().max(254),
    payerPhone: z
      .string()
      .transform((value) => value.replace(/\D/g, ""))
      .pipe(z.string().regex(/^\d{10,11}$/)),
    payerDocument: z
      .string()
      .transform((value) => value.replace(/\D/g, ""))
      .pipe(z.string().regex(/^(?:\d{11}|\d{14})$/)),
    amount: z.union([z.number(), z.string()]),
  });
}

async function callFlevopay(
  path: string,
  env: Record<string, string | undefined>,
  payload?: unknown,
) {
  const apiKey = env["FLEVOPAY_API_KEY"];
  if (!apiKey) return { ok: false, status: 503, data: null };
  try {
    const response = await fetch(`https://app.flevopay.com.br${path}`, {
      method: payload === undefined ? "GET" : "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      signal: AbortSignal.timeout(20000),
    });
    const data: unknown = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 502, data: null };
  }
}

function providerError(status: number) {
  if (status === 503 || status === 401 || status === 403) {
    return {
      status: 503,
      body: { error: "O pagamento Pix está indisponível. Entre em contato com a campanha." },
    };
  }
  return {
    status: 502,
    body: {
      error: "Não foi possível concluir a solicitação do Pix. Tente novamente em instantes.",
    },
  };
}

export async function createPix(input: unknown, env: Record<string, string | undefined>) {
  const parsed = customerSchema().safeParse(input);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        error:
          "Informe nome completo, e-mail válido, telefone com DDD e CPF/CNPJ apenas com números.",
      },
    };
  }
  const amount = normalizeAmount(parsed.data.amount);
  if (amount === null) {
    return {
      status: 400,
      body: { error: "Valor inválido. O mínimo é R$ 5,00 e o máximo R$ 7.000,00." },
    };
  }
  if (!env["FLEVOPAY_API_KEY"]) return providerError(503);

  const database = getDatabase();
  await database.select({ id: pixPayments.id }).from(pixPayments).limit(1);
  const id = randomUUID();
  const amountCents = Math.round(amount * 100);
  const result = await callFlevopay("/api/v1/transaction", env, {
    amount: amountCents,
    description: "Doacao campanha Kaue - Historias Unicas",
    reference: id,
    source: "api_externa",
    customer: {
      name: parsed.data.payerName,
      email: parsed.data.payerEmail,
      phone: parsed.data.payerPhone,
      document: parsed.data.payerDocument,
    },
  });
  if (!result.ok) return providerError(result.status);
  const transaction = z
    .object({
      status: z.literal("success"),
      transaction_id: z.union([z.string().min(1), z.number().int().positive()]),
      qr_code: z.string().min(1),
      qr_code_base64: z.string().optional(),
    })
    .safeParse(result.data);
  if (!transaction.success) return providerError(502);
  const image = transaction.data.qr_code_base64 ?? "";
  const qrcodeUrl = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image)
    ? image
    : /^[A-Za-z0-9+/=]+$/.test(image) && image.length > 0
      ? `data:image/png;base64,${image}`
      : "";

  await database.insert(pixPayments).values({
    id,
    providerId: String(transaction.data.transaction_id),
    amountCents,
    copyPaste: transaction.data.qr_code,
    qrcodeUrl,
  });
  return {
    status: 200,
    body: {
      transactionId: id,
      copyPaste: transaction.data.qr_code,
      qrcodeUrl,
      amount,
      status: "pending",
    },
  };
}

export async function checkPix(input: unknown, env: Record<string, string | undefined>) {
  const parsed = z.object({ transactionId: z.string().uuid() }).safeParse(input);
  if (!parsed.success)
    return { status: 400, body: { error: "Identificador de pagamento inválido." } };
  if (!env["FLEVOPAY_API_KEY"]) return providerError(503);
  const [payment] = await getDatabase()
    .select()
    .from(pixPayments)
    .where(eq(pixPayments.id, parsed.data.transactionId))
    .limit(1);
  if (!payment)
    return { status: 404, body: { error: "Pagamento não encontrado. Volte para a campanha." } };
  const query = new URLSearchParams({ action: "get_transaction", id: payment.providerId });
  const result = await callFlevopay(`/api/v1/query?${query}`, env);
  if (!result.ok) return providerError(result.status);
  const transaction = z
    .object({
      status: z.enum([
        "pending",
        "approved",
        "processing",
        "under_review",
        "failed",
        "refunded",
        "chargeback",
      ]),
    })
    .safeParse(result.data);
  if (!transaction.success) return providerError(502);
  return {
    status: 200,
    body: {
      transactionId: payment.id,
      amount: payment.amountCents / 100,
      copyPaste: payment.copyPaste,
      qrcodeUrl: payment.qrcodeUrl,
      status: transaction.data.status,
      transactionState: transaction.data.status,
      paid: transaction.data.status === "approved",
    },
  };
}
