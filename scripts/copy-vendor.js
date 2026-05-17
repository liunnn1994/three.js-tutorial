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

// Three.js core (ESM) - three.module.js re-exports from three.core.js, both required
fs.copyFileSync(
  path.join(nm, "three/build/three.module.js"),
  path.join(vendorDir, "three.module.js"),
);
fs.copyFileSync(
  path.join(nm, "three/build/three.core.js"),
  path.join(vendorDir, "three.core.js"),
);

// Three.js addons (full directory for relative import resolution)
// After copying, rewrite bare 'three' specifiers so the files work without importmap
copyDir(
  path.join(nm, "three/examples/jsm"),
  path.join(vendorDir, "three/examples/jsm"),
);
rewriteThreeImportsInDir(path.join(vendorDir, "three/examples/jsm"));

// lil-gui (standalone ESM, no external deps)
fs.copyFileSync(
  path.join(nm, "lil-gui/dist/lil-gui.esm.js"),
  path.join(vendorDir, "lil-gui.esm.js"),
);

// Extra ESM libs used by some lessons
fs.copyFileSync(
  path.join(nm, "three/examples/jsm/libs/stats.module.js"),
  path.join(vendorDir, "stats.esm.js"),
);
fs.copyFileSync(
  path.join(nm, "cannon-es/dist/cannon-es.js"),
  path.join(vendorDir, "cannon-es.esm.js"),
);
// three-custom-shader-material: bundle with esbuild, mark 'three' as external
execSync(
  `npx esbuild three-custom-shader-material/vanilla/three-custom-shader-material.es.js --bundle --format=esm --external:three --outfile=${JSON.stringify(path.join(vendorDir, "three-custom-shader-material-vanilla.esm.js"))}`,
  { cwd: nm, stdio: "inherit" },
);
rewriteThreeImportsInFile(
  path.join(vendorDir, "three-custom-shader-material-vanilla.esm.js"),
);

// three-bvh-csg: bundle with esbuild, mark 'three' as external (inlines three-mesh-bvh)
execSync(
  `npx esbuild three-bvh-csg/build/index.module.js --bundle --format=esm --external:three --outfile=${JSON.stringify(path.join(vendorDir, "three-bvh-csg.esm.js"))}`,
  { cwd: nm, stdio: "inherit" },
);
rewriteThreeImportsInFile(
  path.join(vendorDir, "three-bvh-csg.esm.js"),
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

// Rewrite bare 'three' imports inside jsm addon files to the vendored path
function rewriteThreeImportsInFile(filePath) {
  const original = fs.readFileSync(filePath, "utf-8");
  const rewritten = original
    .replace(/from\s+['"]three['"]/g, "from '/vendor/three.module.js'")
    .replace(
      /from\s+['"]three\/addons\/(.+?)['"]/g,
      "from '/vendor/three/examples/jsm/$1'",
    )
    .replace(
      /from\s+['"]three\/examples\/jsm\/(.+?)['"]/g,
      "from '/vendor/three/examples/jsm/$1'",
    );
  if (rewritten !== original) fs.writeFileSync(filePath, rewritten, "utf-8");
}

function rewriteThreeImportsInDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteThreeImportsInDir(fullPath);
    } else if (entry.name.endsWith(".js")) {
      rewriteThreeImportsInFile(fullPath);
    }
  }
}
