// Zero-dependency registry builder for @mano8/astro-reparto-m8.
//
// Mirrors the output of `shadcn build`: reads registry.json, inlines each
// declared file, and writes one registry-item JSON file per item under
// registry/r. Consumers install these generated files with `shadcn add`.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = join(ROOT, "registry.json");
const OUTPUT_DIR = join(ROOT, "registry", "r");

const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";

function buildItem(item) {
  const files = (item.files ?? []).map((file) => {
    const content = readFileSync(join(ROOT, file.path), "utf8");
    const out = { path: file.path, content, type: file.type };
    if (file.target !== undefined) out.target = file.target;
    return out;
  });

  return {
    $schema: ITEM_SCHEMA,
    name: item.name,
    type: item.type,
    ...(item.title ? { title: item.title } : {}),
    ...(item.description ? { description: item.description } : {}),
    ...(item.author ? { author: item.author } : {}),
    ...(item.dependencies ? { dependencies: item.dependencies } : {}),
    ...(item.devDependencies ? { devDependencies: item.devDependencies } : {}),
    ...(item.registryDependencies
      ? { registryDependencies: item.registryDependencies }
      : {}),
    ...(item.cssVars ? { cssVars: item.cssVars } : {}),
    ...(item.css ? { css: item.css } : {}),
    ...(item.meta ? { meta: item.meta } : {}),
    files
  };
}

function main() {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));

  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const names = [];
  for (const item of registry.items ?? []) {
    const built = buildItem(item);
    writeFileSync(
      join(OUTPUT_DIR, `${item.name}.json`),
      `${JSON.stringify(built, null, 2)}\n`
    );
    names.push(item.name);
  }

  const index = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: registry.name,
    ...(registry.homepage ? { homepage: registry.homepage } : {}),
    items: (registry.items ?? []).map((item) => ({
      name: item.name,
      type: item.type,
      ...(item.title ? { title: item.title } : {}),
      ...(item.description ? { description: item.description } : {})
    }))
  };
  writeFileSync(
    join(OUTPUT_DIR, "registry.json"),
    `${JSON.stringify(index, null, 2)}\n`
  );

  const written = readdirSync(OUTPUT_DIR).length;
  console.log(
    `[build-registry] wrote ${names.length} item(s) (${written} files) to registry/r: ${names.join(", ")}`
  );
}

main();
