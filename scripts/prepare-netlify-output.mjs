import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const target = resolve(projectRoot, "netlify-dist");
const candidates = [
  "dist/client",
  ".output/public",
  ".netlify/dist",
  ".netlify/static",
  "dist/public",
];

async function hasIndex(relativePath) {
  try {
    return (await stat(resolve(projectRoot, relativePath, "index.html"))).isFile();
  } catch {
    return false;
  }
}

let source;
for (const candidate of candidates) {
  if (await hasIndex(candidate)) {
    source = resolve(projectRoot, candidate);
    break;
  }
}

if (!source) {
  const entries = await readdir(projectRoot, { withFileTypes: true });
  const generated = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).join(", ");
  throw new Error(
    `A compilação terminou sem gerar uma página inicial. Pastas encontradas: ${generated}`,
  );
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

if (!(await hasIndex("netlify-dist"))) {
  throw new Error("A pasta final da Netlify foi criada sem index.html.");
}

console.log(`Netlify publish output prepared from ${source} at ${target}`);
