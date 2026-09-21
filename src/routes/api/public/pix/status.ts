import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pix/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkPix } = await import("@/lib/propix.server");
        let payload: any = {};
        try {
          payload = await request.json();
        } catch {
          payload = {};
        }
        try {
          const result = await checkPix(payload, process.env as Record<string, string | undefined>);
          return Response.json(result.body, { status: result.status });
        } catch (error) {
          console.error("pix/status", error);
          return Response.json(
            { error: "Falha ao consultar o pagamento." },
            { status: 500 },
          );
        }
      },
    },
  },
});
