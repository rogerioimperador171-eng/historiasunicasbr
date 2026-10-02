import { createPix } from "../../src/lib/flevopay.server";

export default async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  try {
    const result = await createPix(payload, process.env as Record<string, string | undefined>);
    return Response.json(result.body, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Falha ao gerar o Pix. Tente novamente em instantes." },
      { status: 500 },
    );
  }
};
