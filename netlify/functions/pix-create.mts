import { createPix } from "../../src/lib/propix.server";

export default async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405 });
  }

  let payload: any = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  try {
    const result = await createPix(payload, process.env as Record<string, string | undefined>);
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    console.error("pix-create", error);
    return Response.json(
      { error: "Falha ao gerar o Pix. Tente novamente em instantes." },
      { status: 500 },
    );
  }
};
