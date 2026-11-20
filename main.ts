// Leonida Trophy Guide — the program that hands the guide in (Node 22, standard
// library only). The guide itself is plain static files: app/ holds the tracker
// (index.html, app.js, roadmap.js, style.css, data/trophies.json) and
// screenshots/ holds four renders of it in a browser. This program copies both
// folders into the output directory and writes /output/dossier.json with the
// vendored make.fun library, so the judge can read the entry.
//
// The output directory is a mount the grader owns: this program never removes
// the directory itself, only the files inside it, then rebuilds it from scratch
// so two runs always write the same bytes. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Empty the output directory without ever deleting the directory itself:
// the grader runs as an unprivileged user on a mount it cannot remove.
function clearOutputContents(dir) {
  mkdirSync(dir, { recursive: true });
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
  }
}

function copyTree(name) {
  const source = join(repoRoot, name);
  if (existsSync(source)) cpSync(source, join(outputDir, name), { recursive: true });
}

clearOutputContents(outputDir);
copyTree("app");
copyTree("screenshots");

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest refuse
// an entry the scorer would refuse (more than 4 screenshots or one over 256 KiB;
// more than 993 files and directories in app/ or 48 MiB of app files).
writeFileSync(
  join(outputDir, "dossier.json"),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
