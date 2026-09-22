import { createFileRoute } from "@tanstack/react-router";

import landingHtml from "../site/landing.html?raw";

const title = "Histórias Únicas - Ajude o Kauê";
const description =
  "Kauê, 14 anos, tem AME tipo 2 e depende de um aparelho alugado para respirar com segurança. Ajude a campanha da família com uma doação via Pix.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: "/css/site.css" },
    ],
    scripts: [
      { src: "/js/fb-tracking.js", "data-pixel-id": "1421857436428378", defer: true },
      { src: "/js/latest.js", async: true, defer: true },
      { src: "https://kksapps.com.br/videos/public/embed.js?v=1", defer: true },
      { src: "/js/site.js", defer: true },
    ],
  }),
  component: Index,
});

function Index() {
  return <div dangerouslySetInnerHTML={{ __html: landingHtml }} />;
}
