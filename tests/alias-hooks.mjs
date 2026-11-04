// Resolve, nos testes do Node, os imports do jeito do Next: "@/x" vira
// src/x.ts e imports relativos sem extensão ganham ".ts". Usado só por testes
// que importam módulos do site (registrado com module.register).
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const src = new URL("../src/", import.meta.url);

function withExtension(url) {
  for (const candidate of [url, `${url}.ts`, `${url}.tsx`, `${url}/index.ts`]) {
    if (existsSync(fileURLToPath(candidate))) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const found = withExtension(new URL(specifier.slice(2), src).href);
    if (found) return { url: found, shortCircuit: true };
  }
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith(pathToFileURL(fileURLToPath(src)).href)
  ) {
    const found = withExtension(new URL(specifier, context.parentURL).href);
    if (found) return { url: found, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
