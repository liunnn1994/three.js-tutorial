import fs from "node:fs";
import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getThreeVersion } from "./three-version.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const codeRoot = path.join(projectRoot, "src/lesson-code");
const outputRoot = path.join(projectRoot, "public/previews");

// VENDOR_MODE: 'local' (default/dev/mobile) | 'cdn' (web build)
const VENDOR_MODE = process.env.VENDOR_MODE || "local";

const THREE_VERSION = getThreeVersion(projectRoot);
const LIL_GUI_VERSION = "0.21.0";
const GSAP_VERSION = "3.15.0";

const CDN_BASE = {
  three: `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}`,
  lilGui: `https://cdn.jsdelivr.net/npm/lil-gui@${LIL_GUI_VERSION}/dist/lil-gui.esm.js`,
  gsap: `https://cdn.jsdelivr.net/npm/gsap@${GSAP_VERSION}/index.js`,
};

const CDN_IMPORT_MAP = JSON.stringify({
  imports: {
    three: `${CDN_BASE.three}/build/three.module.js`,
    "three/webgpu": `${CDN_BASE.three}/build/three.webgpu.js`,
    "three/tsl": `${CDN_BASE.three}/build/three.tsl.js`,
    "three/addons/": `${CDN_BASE.three}/examples/jsm/`,
    "three/examples/jsm/": `${CDN_BASE.three}/examples/jsm/`,
  },
});

function getVendorPath(pkg, subPath = "") {
  if (VENDOR_MODE === "cdn") {
    if (pkg === "three") return `${CDN_BASE.three}${subPath}`;
    if (pkg === "lil-gui") return CDN_BASE.lilGui;
    if (pkg === "gsap") return CDN_BASE.gsap;
  }
  // Local mode layout:
  //   /vendor/three.module.js   (core, NOT under /vendor/three/)
  //   /vendor/three/examples/jsm/...  (addons)
  if (pkg === "three") {
    if (subPath.startsWith("/build/")) {
      // /build/three.module.js → /vendor/three.module.js
      return `/vendor${subPath.replace("/build/", "/")}`;
    }
    // /examples/jsm/... → /vendor/three/examples/jsm/...
    return `/vendor/three${subPath}`;
  }
  if (pkg === "lil-gui") return "/vendor/lil-gui.esm.js";
  if (pkg === "gsap") return "/vendor/gsap.esm.js";
  return `/vendor/${pkg}`;
}

const webgpuLessons = fs.readdirSync(codeRoot)
  .filter((name) => name.startsWith("webgpu-") && !name.endsWith("-final"))
  .sort();
const lessons = [
  ...webgpuLessons,
  "03-first-threejs-project",
  "04-transform-objects",
  "05-animations",
  "06-cameras",
  "07-fullscreen-and-resizing",
  "08-geometries",
  "09-debug-ui",
  "10-textures",
  "11-materials",
  "12-3d-text",
  "14-lights",
  "15-shadows",
  "16-haunted-house",
  "17-particles",
  "18-galaxy-generator",
  "19-scroll-based-animation",
  "20-physics",
  "21-imported-models",
  "22-raycaster-and-mouse-events",
  "23-custom-models-with-blender",
  "24-environment-map",
  "25-realistic-render",
  "26-code-structuring-for-bigger-projects",
  "27-shaders",
  "28-shader-patterns",
  "29-raging-sea",
  "30-animated-galaxy",
  "31-modified-materials",
  "32-coffee-smoke-shader",
  "33-hologram-shader",
  "34-fireworks-shaders",
  "35-lights-shading-shaders",
  "36-raging-sea-shading-shaders",
  "37-halftone-shading-shaders",
  "38-earth-shaders",
  "39-particles-cursor-animation-shader",
  "40-particles-morphing-shader",
  "41-gpgpu-flow-field-particles-shaders",
  "42-wobbly-sphere-shader",
  "43-sliced-model-shader",
  "44-procedural-terrain-shader",
  "45-post-processing",
  "46-performance-tips",
  "47-intro-and-loading-progress",
  "48-mixing-html-and-webgl",
  "51-importing-and-optimizing-the-scene",
  "52-adding-details-to-the-scene",
];

function resolveGlslIncludes(glslContent, filePath, glslFiles) {
  const visited = new Set();
  function resolve(content, currentPath) {
    if (visited.has(currentPath)) return content;
    visited.add(currentPath);
    return content.replace(/#include\s+([^\n<][^\n]*)/g, (_match, includePath) => {
      const fileDir = currentPath.substring(0, currentPath.lastIndexOf("/"));
      const resolved = path.posix.normalize(fileDir + "/" + includePath.trim());
      const included = glslFiles.get(resolved);
      if (included !== undefined) {
        return resolve(included, resolved);
      }
      return _match;
    });
  }
  return resolve(glslContent, filePath);
}

function inlineGlslImports(jsContent, filePath, glslFiles) {
  return jsContent.replace(
    /import\s+(\w+)\s+from\s+['"]([^'"]+\.(?:glsl|vert|frag))['"]/g,
    (_match, varName, importPath) => {
      const fileDir = filePath.substring(0, filePath.lastIndexOf("/"));
      const resolved = path.posix.normalize(fileDir + "/" + importPath);
      let glslContent = glslFiles.get(resolved);
      if (glslContent !== undefined) {
        glslContent = resolveGlslIncludes(glslContent, resolved, glslFiles);
        return `const ${varName} = ${JSON.stringify(glslContent)}`;
      }
      return _match;
    },
  );
}

function resolveAndInlineJs(entryPath, jsFiles, glslFiles) {
  function resolvePath(importerPath, importPath) {
    const dir = importerPath.substring(0, importerPath.lastIndexOf("/"));
    return path.posix.normalize(dir + "/" + importPath);
  }

  // Build export name map: resolvedPath → the default import name used by importers
  const exportNameMap = new Map();
  const defaultImportRe = /import\s+(\w+)\s+from\s+['"](\.\.?\/[^'"]+)['"]/g;
  const namedImportRe = /import\s*\{([^}]+)\}\s*from\s+['"](\.\.?\/[^'"]+)['"]/g;

  for (const [fp, content] of jsFiles) {
    let m;
    defaultImportRe.lastIndex = 0;
    while ((m = defaultImportRe.exec(content)) !== null) {
      const resolved = resolvePath(fp, m[2]);
      if (jsFiles.has(resolved) && !exportNameMap.has(resolved)) {
        exportNameMap.set(resolved, m[1]);
      }
    }
    namedImportRe.lastIndex = 0;
    while ((m = namedImportRe.exec(content)) !== null) {
      const resolved = resolvePath(fp, m[2]);
      if (jsFiles.has(resolved) && !exportNameMap.has(resolved)) {
        const firstName = m[1]
          .split(",")[0]
          .trim()
          .split(/\s+as\s+/)
          .pop()
          .trim();
        exportNameMap.set(resolved, firstName);
      }
    }
  }

  // DFS topological sort (breaks cycles via visiting set)
  const visited = new Set();
  const visiting = new Set();
  const ordered = [];

  function visit(filePath) {
    if (visited.has(filePath) || visiting.has(filePath)) return;
    visiting.add(filePath);
    const content = jsFiles.get(filePath);
    if (!content) return;
    let m;
    const re = /import\s+(?:\w+\s+from\s+)?['"](\.\.?\/[^'"]+)['"]/g;
    while ((m = re.exec(content)) !== null) {
      const resolved = resolvePath(filePath, m[1]);
      if (jsFiles.has(resolved)) visit(resolved);
    }
    visiting.delete(filePath);
    visited.add(filePath);
    ordered.push(filePath);
  }

  visit(entryPath);

  // Collect external imports from all files (deduplicated)
  const externalImports = new Set();
  const externalImportRe =
    /import\s+(?:\*\s+as\s+\w+|\{[^}]+\}|\w+)\s+from\s+['"](?!\.\.?\/)[^'"]+['"]\s*;?/g;
  for (const [, content] of jsFiles) {
    let m;
    externalImportRe.lastIndex = 0;
    while ((m = externalImportRe.exec(content)) !== null) {
      externalImports.add(m[0].replace(/\s*;?\s*$/, ""));
    }
  }

  // Concatenate files with local imports/exports stripped
  let result = "";
  for (const filePath of ordered) {
    let content = jsFiles.get(filePath);
    content = inlineGlslImports(content, filePath, glslFiles);
    content = content.replace(/import\s+\w+\s+from\s+['"]\.\.?\/[^'"]+['"]\s*;?\s*\n?/g, "");
    content = content.replace(/import\s*\{[^}]+\}\s*from\s+['"]\.\.?\/[^'"]+['"]\s*;?\s*\n?/g, "");
    content = content.replace(
      /import\s+(?:\*\s+as\s+\w+|\{[^}]+\}|\w+)\s+from\s+['"](?!\.\.?\/)[^'"]+['"]\s*;?\s*\n?/g,
      "",
    );
    content = content.replace(/export default\s+(class|function)\s+/g, "$1 ");
    content = content.replace(/export default\s+/, () => {
      const name = exportNameMap.get(filePath);
      return name ? `const ${name} = ` : "";
    });
    result += content.trim() + "\n\n";
  }
  return [...externalImports].join("\n") + "\n\n" + result;
}

function rewriteModuleSpecifiers(content) {
  const threeCore = getVendorPath("three", "/build/three.module.js");
  const threeAddons = getVendorPath("three", "/examples/jsm");
  const lilGui = getVendorPath("lil-gui");
  const gsap = getVendorPath("gsap");

  let result = content
    .replace(/from\s+['"]three\/webgpu['"]/g, `from '${getVendorPath("three", "/build/three.webgpu.js")}'`)
    .replace(/from\s+['"]three\/tsl['"]/g, `from '${getVendorPath("three", "/build/three.tsl.js")}'`)
    .replace(/from\s+['"]three\/addons\/(.+?)['"]/g, `from '${threeAddons}/$1'`)
    .replace(/from\s+['"]three\/examples\/jsm\/(.+?)['"]/g, `from '${threeAddons}/$1'`)
    .replace(/from\s+['"]three['"]/g, `from '${threeCore}'`)
    .replace(/from\s+['"]lil-gui['"]/g, `from '${lilGui}'`)
    .replace(/from\s+['"]gsap['"]/g, `from '${gsap}'`);

  result = result.replace(/import\(\s*['"]three\/addons\/(.+?)['"]\s*\)/g, `import('${threeAddons}/$1')`);

  // These don't have reliable CDN equivalents, always use local
  result = result
    .replace(/from\s+['"]stats\.js['"]/g, "from '/vendor/stats.esm.js'")
    .replace(/from\s+['"]cannon-es['"]/g, "from '/vendor/cannon-es.esm.js'")
    .replace(
      /from\s+['"]three-custom-shader-material\/vanilla['"]/g,
      "from '/vendor/three-custom-shader-material-vanilla.esm.js'",
    )
    .replace(/from\s+['"]three-bvh-csg['"]/g, "from '/vendor/three-bvh-csg.esm.js'");

  return result;
}

function injectImportMap(html) {
  if (VENDOR_MODE !== "cdn" || html.includes('type="importmap"')) {
    return html;
  }

  const importMapTag = `<script type="importmap">${CDN_IMPORT_MAP}</script>`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${importMapTag}</head>`);
  }

  if (html.includes("<body>")) {
    return html.replace("<body>", `${importMapTag}<body>`);
  }

  return `${importMapTag}${html}`;
}

function collectFiles(dir) {
  const glslFiles = new Map();
  const jsFiles = new Map();
  const otherFiles = new Map();

  function walk(d, base = "/") {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fullPath = path.join(d, entry.name);
      const relPath = base + entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relPath + "/");
      } else if (entry.name.match(/\.(glsl|vert|frag)$/)) {
        glslFiles.set(relPath, fs.readFileSync(fullPath, "utf-8"));
      } else if (entry.name.match(/\.(js|ts)$/)) {
        jsFiles.set(relPath, fs.readFileSync(fullPath, "utf-8"));
      } else {
        otherFiles.set(relPath, fs.readFileSync(fullPath, "utf-8"));
      }
    }
  }

  walk(dir);
  return { glslFiles, jsFiles, otherFiles };
}

const normalizeCss = fs.readFileSync(path.join(__dirname, "normalize.css"), "utf-8");
const webglBaseCss = fs.readFileSync(path.join(__dirname, "webgl-base.css"), "utf-8");

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

let generated = 0;

for (const lesson of lessons) {
  let srcDir = path.join(codeRoot, lesson + "-final", "src");
  if (!fs.existsSync(srcDir)) {
    srcDir = path.join(codeRoot, lesson, "src");
  }
  if (!fs.existsSync(srcDir)) {
    console.log(`SKIP: ${lesson}`);
    continue;
  }

  const { glslFiles, jsFiles, otherFiles } = collectFiles(srcDir);

  const rawHtml =
    otherFiles.get("/index.html") ||
    '<!DOCTYPE html><html><body><canvas class="webgl"></canvas></body></html>';
  const rawCss = otherFiles.get("/style.css") || "";

  let combinedJs = "";
  for (const [fp, content] of jsFiles) {
    if (fp === "/script.js" || fp === "/script.ts") {
      const hasLocalImports = /import\s+(?:\w+\s+from\s+)?['"]\.\.?\/[^'"]+['"]/.test(content);
      if (hasLocalImports) {
        combinedJs = rewriteModuleSpecifiers(resolveAndInlineJs(fp, jsFiles, glslFiles));
      } else {
        combinedJs = rewriteModuleSpecifiers(inlineGlslImports(content, fp, glslFiles));
      }
    }
  }
  if (!combinedJs) {
    for (const [fp, content] of jsFiles) {
      combinedJs += rewriteModuleSpecifiers(inlineGlslImports(content, fp, glslFiles)) + "\n";
    }
  }

  // Bundle shared teaching utilities with a real module resolver, retaining public
  // Three.js imports so WebGPU and TSL use exactly the same module instance.
  if (lesson.startsWith("webgpu-")) {
    const bundled = await build({
      entryPoints: [path.join(srcDir, "script.js")], bundle: true,
      write: false, format: "esm", target: "es2022",
      external: ["three", "three/*", "lil-gui"],
    });
    combinedJs = rewriteModuleSpecifiers(bundled.outputFiles[0].text);
  }

  const previewHtml = rawHtml
    .replace(/<link\s+rel=['"]stylesheet['"]\s+href=['"]\.\/style\.css['"]\s*\/?>/gi, "")
    .replace(/<script\s+type=['"]module['"]\s+src=['"]\.\/script\.js['"]\s*><\/script>/gi, "")
    .replace("</head>", `<style>${normalizeCss}\n${webglBaseCss}\n${rawCss}</style></head>`)
    .replace("</body>", `<script type="module">\n${combinedJs}\n</script></body>`);

  let finalHtml = previewHtml;

  if (!finalHtml.includes('type="module"')) {
    finalHtml = finalHtml.replace(
      "</body>",
      `<script type="module">\n${combinedJs}\n</script></body>`,
    );
  }
  if (!finalHtml.includes('type="module"')) {
    finalHtml = finalHtml.replace(
      "</html>",
      `<script type="module">\n${combinedJs}\n</script></html>`,
    );
  }

  // Fallback CSS injection for templates without <head>
  if (!finalHtml.includes("normalize.css")) {
    const allCss = `${normalizeCss}\n${webglBaseCss}\n${rawCss}`;
    if (finalHtml.includes("</head>")) {
      finalHtml = finalHtml.replace("</head>", `<style>${allCss}</style></head>`);
    } else {
      finalHtml = finalHtml.replace("<body>", `<head><style>${allCss}</style></head><body>`);
    }
  }

  finalHtml = injectImportMap(finalHtml);

  fs.writeFileSync(path.join(outputRoot, `${lesson}.html`), finalHtml, "utf-8");
  generated++;
}

console.log(`Generated ${generated} preview HTML files in public/previews/`);
