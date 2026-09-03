import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const { version } = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);

if (!match) {
  throw new Error(`Unsupported package version: ${version}`);
}

const [, major, minor, patch] = match.map(Number);
const buildNumber = major * 10000 + minor * 100 + patch;

const androidPath = resolve(root, "android/app/build.gradle");
let android = readFileSync(androidPath, "utf8");
android = android
  .replace(/^\s*versionCode\s+\d+/m, `        versionCode ${buildNumber}`)
  .replace(/^\s*versionName\s+"[^"]+"/m, `        versionName "${version}"`);
writeFileSync(androidPath, android);

const iosPath = resolve(root, "ios/App/App.xcodeproj/project.pbxproj");
let ios = readFileSync(iosPath, "utf8");
ios = ios
  .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${buildNumber};`)
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);
writeFileSync(iosPath, ios);

console.log(`Mobile version synced: ${version} (${buildNumber})`);
