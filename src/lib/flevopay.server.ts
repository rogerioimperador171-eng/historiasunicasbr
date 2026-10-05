/**
 * Integração FlevoPay (uso exclusivo no servidor).
 * A chave FLEVOPAY_API_KEY nunca é enviada ao navegador nem registrada em logs.
 */
export const FLEVOPAY_BASE_URL = "https://app.flevopay.com.br";
export const MIN_AMOUNT = 10;
export const MAX_AMOUNT = 7004.99;

type Env = Record<string, string | undefined>;

/** Converte reais em centavos inteiros (R$ 65,67 → 6567). */
export function toCents(value: number): number {
  return Math.round(value * 100);
}

function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

function isValidCnpj(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number) => {
    const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cnpj[i]) * w[i]!;
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

function fail(status: number, error: string) {
  return { status, body: { error } };
}

export async function createFlevoPix(input: Record<string, unknown>, env: Env) {
  const raw = typeof input["amount"] === "number" ? input["amount"] : Number(input["amount"]);
  if (!Number.isFinite(raw)) return fail(400, "Valor da doação inválido.");
  const amountReais = Math.round(raw * 100) / 100;
  if (amountReais < MIN_AMOUNT) return fail(400, "O valor mínimo para gerar o Pix é R$ 10,00.");
  if (amountReais > MAX_AMOUNT) return fail(400, "O valor máximo por Pix é R$ 7.000,00.");

  const name = typeof input["name"] === "string" ? input["name"].trim().slice(0, 100) : "";
  const email = typeof input["email"] === "string" ? input["email"].trim().slice(0, 150) : "";
  const document = typeof input["document"] === "string" ? input["document"].replace(/\D/g, "") : "";
  const phone = typeof input["phone"] === "string" ? input["phone"].replace(/\D/g, "") : "";

  if (name.length < 2) return fail(400, "Informe seu nome.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "Informe um e-mail válido.");
  if (!isValidCpf(document) && !isValidCnpj(document)) return fail(400, "Informe um CPF ou CNPJ válido.");
  if (phone.length < 10 || phone.length > 11) return fail(400, "Informe um telefone válido com DDD.");

  const apiKey = env["FLEVOPAY_API_KEY"];
  if (!apiKey) {
    console.error("flevopay: FLEVOPAY_API_KEY não configurada");
    return fail(500, "Pagamento indisponível no momento. Tente novamente mais tarde.");
  }

  const reference = `HU-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const amount = toCents(amountReais);
  const payload = {
    amount,
    description: "Doacao - Campanha Kaue - Historias Unicas",
    reference,
    source: "api_externa",
    customer: { name, email, document, phone },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response: Response;
  try {
    response = await fetch(`${FLEVOPAY_BASE_URL}/api/v1/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    console.error("flevopay: falha de conexão", aborted ? "timeout" : String(error));
    return fail(504, aborted
      ? "O pagamento demorou para responder. Tente novamente."
      : "Não conseguimos falar com o sistema de pagamento. Tente novamente.");
  } finally {
    clearTimeout(timeout);
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401 || response.status === 403) {
    console.error("flevopay: autenticação recusada", response.status);
    return fail(502, "Pagamento indisponível no momento. Tente novamente mais tarde.");
  }
  if (!response.ok) {
    console.error("flevopay: erro HTTP", response.status, data?.error ?? data?.message ?? "");
    const message = typeof data?.message === "string" && response.status < 500 ? data.message : null;
    return fail(response.status >= 500 ? 502 : 400, message ?? "Não foi possível gerar o Pix agora. Tente novamente.");
  }

  const qrCode = typeof data?.qr_code === "string" ? data.qr_code : "";
  if (!qrCode) {
    console.error("flevopay: resposta sem qr_code");
    return fail(502, "O sistema de pagamento não retornou o código Pix. Tente novamente.");
  }

  return {
    status: 200,
    body: {
      transactionId: String(data.transaction_id ?? ""),
      reference,
      copyPaste: qrCode,
      qrCodeBase64: typeof data.qr_code_base64 === "string" ? data.qr_code_base64 : null,
      amount: typeof data.amount === "number" ? data.amount / 100 : amountReais,
      expiresAt: typeof data.expires_at === "string" ? data.expires_at : null,
      // Criar o Pix não confirma o pagamento: o status exibido é sempre pendente.
      status: "pending",
    },
  };
}
