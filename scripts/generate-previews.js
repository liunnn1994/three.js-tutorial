import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const codeRoot = path.join(projectRoot, 'src/lesson-code');
const outputRoot = path.join(projectRoot, 'public/previews');

const lessons = [
  '03-first-threejs-project', '04-transform-objects', '05-animations', '06-cameras',
  '07-fullscreen-and-resizing', '08-geometries', '09-debug-ui',
  '10-textures', '11-materials', '12-3d-text', '13-go-live',
  '14-lights', '15-shadows', '16-haunted-house', '17-particles',
  '18-galaxy-generator', '19-scroll-based-animation', '20-physics',
  '21-imported-models', '22-raycaster-and-mouse-events',
  '23-custom-models-with-blender', '24-environment-map', '25-realistic-render',
  '26-code-structuring-for-bigger-projects',
  '27-shaders', '28-shader-patterns', '29-raging-sea', '30-animated-galaxy',
  '31-modified-materials', '32-coffee-smoke-shader', '33-hologram-shader',
  '34-fireworks-shaders', '35-lights-shading-shaders', '36-raging-sea-shading-shaders',
  '37-halftone-shading-shaders', '38-earth-shaders',
  '39-particles-cursor-animation-shader', '40-particles-morphing-shader',
  '41-gpgpu-flow-field-particles-shaders', '42-wobbly-sphere-shader',
  '43-sliced-model-shader', '44-procedural-terrain-shader',
  '45-post-processing', '46-performance-tips',
  '47-intro-and-loading-progress', '48-mixing-html-and-webgl',
  '51-importing-and-optimizing-the-scene', '52-adding-details-to-the-scene',
];

function resolveGlslIncludes(glslContent, filePath, glslFiles) {
  const visited = new Set();
  function resolve(content, currentPath) {
    if (visited.has(currentPath)) return content;
    visited.add(currentPath);
    return content.replace(
      /#include\s+([^\n<][^\n]*)/g,
      (_match, includePath) => {
        const fileDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const resolved = path.posix.normalize(fileDir + '/' + includePath.trim());
        const included = glslFiles.get(resolved);
        if (included !== undefined) {
          return resolve(included, resolved);
        }
        return _match;
      }
    );
  }
  return resolve(glslContent, filePath);
}

function inlineGlslImports(jsContent, filePath, glslFiles) {
  return jsContent.replace(
    /import\s+(\w+)\s+from\s+['"]([^'"]+\.(?:glsl|vert|frag))['"]/g,
    (_match, varName, importPath) => {
      const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
      const resolved = path.posix.normalize(fileDir + '/' + importPath);
      let glslContent = glslFiles.get(resolved);
      if (glslContent !== undefined) {
        glslContent = resolveGlslIncludes(glslContent, resolved, glslFiles);
        return `const ${varName} = ${JSON.stringify(glslContent)}`;
      }
      return _match;
    }
  );
}

function resolveAndInlineJs(entryPath, jsFiles, glslFiles) {
  function resolvePath(importerPath, importPath) {
    const dir = importerPath.substring(0, importerPath.lastIndexOf('/'));
    return path.posix.normalize(dir + '/' + importPath);
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
        const firstName = m[1].split(',')[0].trim().split(/\s+as\s+/).pop().trim();
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
  const externalImportRe = /import\s+(?:\*\s+as\s+\w+|\{[^}]+\}|\w+)\s+from\s+['"](?!\.\.?\/)[^'"]+['"]\s*;?/g;
  for (const [, content] of jsFiles) {
    let m;
    externalImportRe.lastIndex = 0;
    while ((m = externalImportRe.exec(content)) !== null) {
      externalImports.add(m[0].replace(/\s*;?\s*$/, ''));
    }
  }

  // Concatenate files with local imports/exports stripped
  let result = '';
  for (const filePath of ordered) {
    let content = jsFiles.get(filePath);
    content = inlineGlslImports(content, filePath, glslFiles);
    content = content.replace(/import\s+\w+\s+from\s+['"]\.\.?\/[^'"]+['"]\s*;?\s*\n?/g, '');
    content = content.replace(/import\s*\{[^}]+\}\s*from\s+['"]\.\.?\/[^'"]+['"]\s*;?\s*\n?/g, '');
    content = content.replace(/import\s+(?:\*\s+as\s+\w+|\{[^}]+\}|\w+)\s+from\s+['"](?!\.\.?\/)[^'"]+['"]\s*;?\s*\n?/g, '');
    content = content.replace(/export default\s+(class|function)\s+/g, '$1 ');
    content = content.replace(/export default\s+/, () => {
      const name = exportNameMap.get(filePath);
      return name ? `const ${name} = ` : '';
    });
    result += content.trim() + '\n\n';
  }
  return [...externalImports].join('\n') + '\n\n' + result;
}

const importMap = JSON.stringify({
  imports: {
    "three": "/vendor/three.module.js",
    "three/": "/vendor/three/",
    "lil-gui": "/vendor/lil-gui.esm.js",
    "gsap": "/vendor/gsap.esm.js",
    "stats.js": "/vendor/stats.esm.js",
    "cannon-es": "/vendor/cannon-es.esm.js",
    "three-custom-shader-material/vanilla": "/vendor/three-custom-shader-material-vanilla.esm.js",
    "three-bvh-csg": "/vendor/three-bvh-csg.esm.js",
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
  let srcDir = path.join(codeRoot, lesson + '-final', 'src');
  if (!fs.existsSync(srcDir)) {
    srcDir = path.join(codeRoot, lesson, 'src');
  }
  if (!fs.existsSync(srcDir)) {
    console.log(`SKIP: ${lesson}`);
    continue;
  }

  const { glslFiles, jsFiles, otherFiles } = collectFiles(srcDir);

  const rawHtml = otherFiles.get('/index.html') || '<!DOCTYPE html><html><body><canvas class="webgl"></canvas></body></html>';
  const rawCss = otherFiles.get('/style.css') || '';

  let combinedJs = '';
  for (const [fp, content] of jsFiles) {
    if (fp === '/script.js' || fp === '/script.ts') {
      const hasLocalImports = /import\s+(?:\w+\s+from\s+)?['"]\.\.?\/[^'"]+['"]/.test(content);
      if (hasLocalImports) {
        combinedJs = toCDN(resolveAndInlineJs(fp, jsFiles, glslFiles));
      } else {
        combinedJs = toCDN(inlineGlslImports(content, fp, glslFiles));
      }
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

  let finalHtml = previewHtml;

  if (!finalHtml.includes('type="importmap"')) {
    finalHtml = finalHtml.replace('<head>', `<head><script type="importmap">${importMap}</script>`);
  }
  if (!finalHtml.includes('type="importmap"')) {
    finalHtml = finalHtml.replace('<html>', `<html><head><script type="importmap">${importMap}</script></head>`);
  }
  if (!finalHtml.includes('type="importmap"')) {
    finalHtml = `<!DOCTYPE html><html><head><script type="importmap">${importMap}</script></head><body></body></html>`;
  }

  if (!finalHtml.includes('type="module"')) {
    finalHtml = finalHtml.replace('</body>', `<script type="module">\n${combinedJs}\n</script></body>`);
  }
  if (!finalHtml.includes('type="module"')) {
    finalHtml = finalHtml.replace('</html>', `<script type="module">\n${combinedJs}\n</script></html>`);
  }

  fs.writeFileSync(path.join(outputRoot, `${lesson}.html`), finalHtml, 'utf-8');
  generated++;
}

console.log(`Generated ${generated} preview HTML files in public/previews/`);
