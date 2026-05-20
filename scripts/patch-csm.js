import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Patch three-custom-shader-material to add proper ESM exports
// This fixes "Directory import is not supported" error with @tresjs/cientos
const pnpmDir = 'node_modules/.pnpm'

let patched = 0
for (const entry of readdirSync(pnpmDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.includes('cientos')) continue
  const pkgPath = join(pnpmDir, entry.name, 'node_modules/three-custom-shader-material/package.json')
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    if (pkg.exports) continue
    pkg.exports = {
      '.': {
        import: './dist/three-custom-shader-material.esm.js',
        require: './dist/three-custom-shader-material.cjs.js',
      },
      './vanilla': {
        import: './vanilla/dist/three-custom-shader-material-vanilla.esm.js',
        require: './vanilla/dist/three-custom-shader-material-vanilla.cjs.js',
      },
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    patched++
  } catch {}
}
console.log(`[patch-csm] Patched ${patched} package(s)`)
