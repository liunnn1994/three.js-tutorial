import fs from 'node:fs';
import path from 'node:path';

// 本地文件与 CDN URL 都取同一个已安装版本，并拒绝过期的 node_modules。
export function getThreeVersion(projectRoot) {
  const declared = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')).dependencies.three;
  const installed = JSON.parse(fs.readFileSync(path.join(projectRoot, 'node_modules/three/package.json'), 'utf8')).version;
  if (installed !== declared) {
    throw new Error(`Three.js 版本不一致：package.json 为 ${declared}，已安装 ${installed}。请先运行 pnpm install。`);
  }
  return installed;
}
