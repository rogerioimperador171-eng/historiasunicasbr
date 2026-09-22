import { createFileRoute } from "@tanstack/react-router";

const VIDEO_BASE_URL = "https://historiasunicasbrasil.com/hls/kaue/";
const ALLOWED_VIDEO_FILE = /^kaue(?:_720p)?(?:_\d{5})?\.(?:m3u8|ts)$/;

export const Route = createFileRoute("/api/public/video/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const fileName = params._splat ?? "";
        if (!ALLOWED_VIDEO_FILE.test(fileName)) {
          return new Response("Arquivo não encontrado.", { status: 404 });
        }

        try {
          const upstream = await fetch(`${VIDEO_BASE_URL}${fileName}`);
          if (!upstream.ok || !upstream.body) {
            return new Response("Vídeo indisponível.", { status: upstream.status || 502 });
          }

          const headers = new Headers();
          headers.set(
            "Content-Type",
            fileName.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t",
          );
          headers.set("Cache-Control", fileName.endsWith(".m3u8") ? "public, max-age=300" : "public, max-age=31536000, immutable");
          return new Response(upstream.body, { status: 200, headers });
        } catch {
          return new Response("Vídeo temporariamente indisponível.", { status: 502 });
        }
      },
    },
  },
});