const VIDEO_BASE_URL = "https://historiasunicasbrasil.com/hls/kaue/";
const ALLOWED_VIDEO_FILE = /^kaue(?:_720p)?(?:_\d{5})?\.(?:m3u8|ts)$/;

export default async (request: Request) => {
  if (request.method !== "GET") {
    return new Response("Método não permitido.", { status: 405 });
  }

  const fileName = new URL(request.url).pathname.split("/").pop() ?? "";
  if (!ALLOWED_VIDEO_FILE.test(fileName)) {
    return new Response("Arquivo não encontrado.", { status: 404 });
  }

  try {
    const requestHeaders = new Headers();
    const range = request.headers.get("range");
    if (range) requestHeaders.set("Range", range);
    const upstream = await fetch(`${VIDEO_BASE_URL}${fileName}`, { headers: requestHeaders });
    if (!upstream.ok || !upstream.body) {
      return new Response("Vídeo indisponível.", { status: upstream.status || 502 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      fileName.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t",
    );
    for (const headerName of ["accept-ranges", "content-length", "content-range"]) {
      const value = upstream.headers.get(headerName);
      if (value) headers.set(headerName, value);
    }
    headers.set("Cache-Control", fileName.endsWith(".m3u8") ? "public, max-age=300" : "public, max-age=31536000, immutable");
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return new Response("Vídeo temporariamente indisponível.", { status: 502 });
  }
};