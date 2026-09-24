// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Fixa o destino do build: sem isso a Netlify detecta o ambiente e move o
  // servidor para .netlify/, quebrando a pré-renderização das páginas.
  nitro: { preset: "cloudflare-module" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Gera HTML estático das páginas públicas. Assim a Netlify pode publicar
    // dist/client direto e as chamadas /api/public/* ficam nas Netlify Functions.
    prerender: {
      enabled: true,
      autoStaticPathsDiscovery: false,
      filter: ({ path }: { path: string }) => path === "/" || path === "/pagamento",
    },
    pages: [{ path: "/", prerender: { enabled: true } }, { path: "/pagamento", prerender: { enabled: true } }],
  },
});
