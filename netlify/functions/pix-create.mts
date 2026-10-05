import { createFlevoPix } from "../../src/lib/flevopay.server";

export default async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  try {
    const result = await createFlevoPix(payload, process.env as Record<string, string | undefined>);
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    console.error("pix-create", error instanceof Error ? error.message : "erro");
    return Response.json({ error: "Falha ao gerar o Pix. Tente novamente em instantes." }, { status: 500 });
  }
};
