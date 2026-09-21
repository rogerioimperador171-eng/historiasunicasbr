import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pix/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createPix } = await import("@/lib/propix.server");
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
          console.error("pix/create", error);
          return Response.json(
            { error: "Falha ao gerar o Pix. Tente novamente em instantes." },
            { status: 500 },
          );
        }
      },
    },
  },
});
