import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const nm = path.join(projectRoot, "node_modules");
const vendorDir = path.join(projectRoot, "public", "vendor");

const preservedFiles = ["normalize.css", "webgl-base.css"];
const tmpDir = path.join(projectRoot, "public", ".vendor-tmp");
if (fs.existsSync(vendorDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const f of preservedFiles) {
    const src = path.join(vendorDir, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(tmpDir, f));
  }
}

fs.rmSync(vendorDir, { recursive: true, force: true });
fs.mkdirSync(vendorDir, { recursive: true });

for (const f of preservedFiles) {
  const src = path.join(tmpDir, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(vendorDir, f));
}
fs.rmSync(tmpDir, { recursive: true, force: true });

// Three.js core (ESM)
fs.copyFileSync(
  path.join(nm, "three/build/three.module.js"),
  path.join(vendorDir, "three.module.js"),
);

// Three.js addons (full directory for relative import resolution)
copyDir(path.join(nm, "three/examples/jsm"), path.join(vendorDir, "three/examples/jsm"));

// lil-gui (standalone ESM, no external deps)
fs.copyFileSync(
  path.join(nm, "lil-gui/dist/lil-gui.esm.js"),
  path.join(vendorDir, "lil-gui.esm.js"),
);

// GSAP: bundle into a single ESM file via esbuild (npm dist is UMD)
execSync(
  `npx esbuild gsap/index.js --bundle --format=esm --outfile=${JSON.stringify(path.join(vendorDir, "gsap.esm.js"))}`,
  { cwd: nm, stdio: "inherit" },
);

console.log("Vendor files copied to public/vendor/");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
