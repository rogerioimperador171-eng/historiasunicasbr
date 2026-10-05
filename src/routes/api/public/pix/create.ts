import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pix/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createFlevoPix } = await import("@/lib/flevopay.server");
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
          console.error("pix/create", error instanceof Error ? error.message : "erro");
          return Response.json({ error: "Falha ao gerar o Pix. Tente novamente em instantes." }, { status: 500 });
        }
      },
    },
  },
});
