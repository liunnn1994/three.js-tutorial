import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const codeRoot = path.join(projectRoot, 'src/lesson-code');
const outputRoot = path.join(projectRoot, 'public/previews');

const lessons = [
  '04-transform-objects', '05-animations', '06-cameras',
  '07-fullscreen-and-resizing', '08-geometries', '09-debug-ui',
  '10-textures', '11-materials', '12-3d-text',
  '14-lights', '15-shadows', '16-haunted-house', '17-particles',
  '18-galaxy-generator', '19-scroll-based-animation', '20-physics',
  '21-imported-models', '22-raycaster-and-mouse-events',
  '24-environment-map', '25-realistic-render',
  '27-shaders', '28-shader-patterns', '29-raging-sea', '30-animated-galaxy',
  '31-modified-materials', '32-coffee-smoke-shader', '33-hologram-shader',
  '34-fireworks-shaders', '35-lights-shading-shaders', '36-raging-sea-shading-shaders',
  '37-halftone-shading-shaders', '38-earth-shaders',
  '39-particles-cursor-animation-shader', '40-particles-morphing-shader',
  '41-gpgpu-flow-field-particles-shaders', '42-wobbly-sphere-shader',
  '43-sliced-model-shader', '44-procedural-terrain-shader',
  '45-post-processing', '47-intro-and-loading-progress',
  '48-mixing-html-and-webgl',
];

function inlineGlslImports(jsContent, filePath, glslFiles) {
  return jsContent.replace(
    /import\s+(\w+)\s+from\s+['"]([^'"]+\.(?:glsl|vert|frag))['"]/g,
    (_match, varName, importPath) => {
      const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
      const resolved = path.posix.normalize(fileDir + '/' + importPath);
      const glslContent = glslFiles.get(resolved);
      if (glslContent !== undefined) {
        return `const ${varName} = ${JSON.stringify(glslContent)}`;
      }
      return _match;
    }
  );
}

const isTauri = !!process.env.TAURI;

const importMap = JSON.stringify({
  imports: isTauri
    ? {
        "three": "/vendor/three.module.js",
        "three/": "/vendor/three/",
        "lil-gui": "/vendor/lil-gui.esm.js",
        "gsap": "/vendor/gsap.esm.js",
      }
    : {
        "three": "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm",
        "three/": "https://cdn.jsdelivr.net/npm/three@0.184.0/",
        "lil-gui": "https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm",
        "gsap": "https://cdn.jsdelivr.net/npm/gsap@3.12/+esm",
      }
});

function toCDN(content) {
  return content
    .replace(
      /from\s+['"]three\/addons\/(.+?)['"]/g,
      "from 'three/examples/jsm/$1'"
    );
}

function collectFiles(dir) {
  const glslFiles = new Map();
  const jsFiles = new Map();
  const otherFiles = new Map();

  function walk(d, base = '/') {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fullPath = path.join(d, entry.name);
      const relPath = base + entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relPath + '/');
      } else if (entry.name.match(/\.(glsl|vert|frag)$/)) {
        glslFiles.set(relPath, fs.readFileSync(fullPath, 'utf-8'));
      } else if (entry.name.match(/\.(js|ts)$/)) {
        jsFiles.set(relPath, fs.readFileSync(fullPath, 'utf-8'));
      } else {
        otherFiles.set(relPath, fs.readFileSync(fullPath, 'utf-8'));
      }
    }
  }

  walk(dir);
  return { glslFiles, jsFiles, otherFiles };
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

let generated = 0;

for (const lesson of lessons) {
  const srcDir = path.join(codeRoot, lesson, 'src');
  if (!fs.existsSync(srcDir)) {
    console.log(`SKIP: ${lesson}`);
    continue;
  }

  const { glslFiles, jsFiles, otherFiles } = collectFiles(srcDir);

  const rawHtml = otherFiles.get('/index.html') || '<!DOCTYPE html><html><body></body></html>';
  const rawCss = otherFiles.get('/style.css') || '';

  let combinedJs = '';
  for (const [fp, content] of jsFiles) {
    if (fp === '/script.js' || fp === '/script.ts') {
      combinedJs = toCDN(inlineGlslImports(content, fp, glslFiles));
    }
  }
  if (!combinedJs) {
    for (const [fp, content] of jsFiles) {
      combinedJs += toCDN(inlineGlslImports(content, fp, glslFiles)) + '\n';
    }
  }

  const previewHtml = rawHtml
    .replace(/<link\s+rel=['"]stylesheet['"]\s+href=['"]\.\/style\.css['"]\s*\/?>/gi, '')
    .replace(/<script\s+type=['"]module['"]\s+src=['"]\.\/script\.js['"]\s*><\/script>/gi, '')
    .replace('</head>', `<style>${rawCss}</style></head>`)
    .replace('</head>', `<script type="importmap">${importMap}</script></head>`)
    .replace('</body>', `<script type="module">\n${combinedJs}\n</script></body>`);

  fs.writeFileSync(path.join(outputRoot, `${lesson}.html`), previewHtml, 'utf-8');
  generated++;
}

console.log(`Generated ${generated} preview HTML files in public/previews/`);
