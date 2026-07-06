import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const astroBin = join(root, "node_modules", "astro", "bin", "astro.mjs");

const fixtures = ["starlight-starter", "starlight-headless"];

function buildFixture(name) {
  const fixture = join(root, "fixtures", name);
  const scopeDir = join(fixture, "node_modules", "@mano8");
  const packageLink = join(scopeDir, "astro-reparto-m8");

  mkdirSync(scopeDir, { recursive: true });
  if (existsSync(packageLink)) {
    rmSync(packageLink, { force: true, recursive: true });
  }
  symlinkSync(root, packageLink, "junction");

  const result = spawnSync(process.execPath, [astroBin, "build", "--root", fixture], {
    cwd: root,
    stdio: "inherit"
  });

  rmSync(packageLink, { force: true, recursive: true });

  return result.status ?? 1;
}

for (const fixture of fixtures) {
  try {
    const status = buildFixture(fixture);
    if (status !== 0) {
      process.exit(status);
    }
  } catch (error) {
    console.error(`Failed to build ${fixture}:`, error);
    process.exit(1);
  }
}
