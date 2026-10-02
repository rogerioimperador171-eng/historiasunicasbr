import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pix/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createPix } = await import("@/lib/flevopay.server");
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: "JSON inválido." }, { status: 400 });
        }
        try {
          const result = await createPix(
            payload,
            process.env as Record<string, string | undefined>,
          );
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
      },
    },
  },
});
