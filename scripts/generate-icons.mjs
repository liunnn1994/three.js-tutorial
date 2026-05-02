import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile, mkdir, rm, cp } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INPUT = join(ROOT, "public/logo.png");
const PUBLIC = join(ROOT, "public");
const TAURI_ICONS = join(ROOT, "src-tauri/icons");
const ANDROID_RES = join(ROOT, "src-tauri/gen/android/app/src/main/res");
const IOS_APP_ICONSET = join(
  ROOT,
  "src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset",
);

async function resizeSquare(input, size, output) {
  await sharp(input).resize(size, size).png().toFile(output);
}

async function resizeRect(input, w, h, output) {
  await sharp(input).resize(w, h).png().toFile(output);
}

async function resizeWithPadding(input, size, scale, output) {
  const innerSize = Math.max(1, Math.round(size * scale));
  const iconBuf = await sharp(input)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: iconBuf, gravity: "center" }])
    .png()
    .toFile(output);
}

async function generateIco(inputPngs, outputPath) {
  const icoBuf = await pngToIco(inputPngs);
  await writeFile(outputPath, Buffer.from(icoBuf));
}

// ── Docs site favicons ──────────────────────────────────────────────
async function generateFavicons() {
  console.log("\n📌 Generating docs site favicons...");

  const sizes = [16, 32, 48, 180, 192, 512];
  const pngPaths = [];

  for (const size of sizes) {
    const out = join(PUBLIC, `favicon-${size}x${size}.png`);
    await resizeSquare(INPUT, size, out);
    pngPaths.push(out);
  }

  // favicon.ico (16, 32, 48)
  await generateIco(pngPaths.slice(0, 3), join(PUBLIC, "favicon.ico"));

  // apple-touch-icon (copy 180x180)
  await cp(pngPaths[3], join(PUBLIC, "apple-touch-icon.png"));

  // Android Chrome PWA icons
  await cp(pngPaths[4], join(PUBLIC, "android-chrome-192x192.png"));
  await cp(pngPaths[5], join(PUBLIC, "android-chrome-512x512.png"));

  console.log("   ✓ favicon.ico (16/32/48)");
  console.log("   ✓ favicon-16x16.png / 32x32.png / 48x48.png");
  console.log("   ✓ apple-touch-icon.png (180x180)");
  console.log("   ✓ android-chrome-192x192.png / 512x512.png");
}

// ── Tauri desktop icons (Windows / Mac / Linux) ────────────────────
async function generateTauriDesktopIcons() {
  console.log("\n🖥️  Generating Tauri desktop icons...");

  const squareIcons = [
    [32, "32x32.png"],
    [64, "64x64.png"],
    [128, "128x128.png"],
    [256, "128x128@2x.png"],
    [512, "icon.png"],
    [30, "Square30x30Logo.png"],
    [44, "Square44x44Logo.png"],
    [50, "Square50x50Logo.png"],
    [70, "Square70x70Logo.png"],
    [71, "Square71x71Logo.png"],
    [89, "Square89x89Logo.png"],
    [107, "Square107x107Logo.png"],
    [142, "Square142x142Logo.png"],
    [150, "Square150x150Logo.png"],
    [188, "Square150x150Logo.scale-125.png"],
    [225, "Square150x150Logo.scale-150.png"],
    [284, "Square284x284Logo.png"],
    [300, "Square150x150Logo.scale-200.png"],
    [310, "Square310x310Logo.png"],
    [336, "Square336x336Logo.png"],
    [50, "StoreLogo.png"],
    [600, "Square150x150Logo.scale-400.png"],
  ];

  for (const [size, name] of squareIcons) {
    await resizeSquare(INPUT, size, join(TAURI_ICONS, name));
  }

  // Wide (rectangular) logos
  await resizeRect(INPUT, 310, 150, join(TAURI_ICONS, "Wide310x150Logo.png"));
  await resizeRect(
    INPUT,
    620,
    300,
    join(TAURI_ICONS, "Wide310x150Logo.scale-200.png"),
  );

  // icon.ico (layers: 16, 24, 32, 48, 64, 256)
  const tmpDir = join(TAURI_ICONS, ".ico-tmp");
  await mkdir(tmpDir, { recursive: true });
  const icoPngs = [];
  for (const size of [16, 24, 32, 48, 64, 256]) {
    const p = join(tmpDir, `${size}.png`);
    await resizeSquare(INPUT, size, p);
    icoPngs.push(p);
  }
  await generateIco(icoPngs, join(TAURI_ICONS, "icon.ico"));
  await rm(tmpDir, { recursive: true });

  console.log("   ✓ 32x32 / 64x64 / 128x128 / 128x128@2x / icon.png");
  console.log("   ✓ icon.ico (16,24,32,48,64,256 layers)");
  console.log("   ✓ Windows Store logos (Square*/Wide*/StoreLogo)");
}

// ── Tauri Android icons ────────────────────────────────────────────
async function generateAndroidIcons() {
  console.log("\n📱 Generating Android icons...");

  // Keep icon artwork inside Android launcher safe zone to avoid mask clipping.
  const SAFE_ZONE_SCALE = 0.66;

  const dpiConfigs = [
    { dir: "mipmap-mdpi", launcher: 48, foreground: 108 },
    { dir: "mipmap-hdpi", launcher: 49, foreground: 162 },
    { dir: "mipmap-xhdpi", launcher: 96, foreground: 216 },
    { dir: "mipmap-xxhdpi", launcher: 144, foreground: 324 },
    { dir: "mipmap-xxxhdpi", launcher: 192, foreground: 432 },
  ];

  for (const { dir, launcher, foreground } of dpiConfigs) {
    const dirPath = join(ANDROID_RES, dir);
    await mkdir(dirPath, { recursive: true });

    await resizeWithPadding(
      INPUT,
      launcher,
      SAFE_ZONE_SCALE,
      join(dirPath, "ic_launcher.png"),
    );
    await resizeWithPadding(
      INPUT,
      launcher,
      SAFE_ZONE_SCALE,
      join(dirPath, "ic_launcher_round.png"),
    );
    await resizeWithPadding(
      INPUT,
      foreground,
      SAFE_ZONE_SCALE,
      join(dirPath, "ic_launcher_foreground.png"),
    );
  }

  console.log("   ✓ mdpi / hdpi / xhdpi / xxhdpi / xxxhdpi");
}

// ── Tauri iOS icons ────────────────────────────────────────────────
async function generateIOSIcons() {
  const baseDir = IOS_APP_ICONSET;
  await mkdir(baseDir, { recursive: true });

  console.log("\n🍎 Generating iOS icons (opaque, no transparency)...");

  const iosSizes = [
    ["AppIcon-20x20@1x.png", 20],
    ["AppIcon-20x20@2x.png", 40],
    ["AppIcon-20x20@2x-1.png", 40],
    ["AppIcon-20x20@3x.png", 60],
    ["AppIcon-29x29@1x.png", 29],
    ["AppIcon-29x29@2x.png", 58],
    ["AppIcon-29x29@2x-1.png", 58],
    ["AppIcon-29x29@3x.png", 87],
    ["AppIcon-40x40@1x.png", 40],
    ["AppIcon-40x40@2x.png", 80],
    ["AppIcon-40x40@2x-1.png", 80],
    ["AppIcon-40x40@3x.png", 120],
    ["AppIcon-60x60@2x.png", 120],
    ["AppIcon-60x60@3x.png", 180],
    ["AppIcon-76x76@1x.png", 76],
    ["AppIcon-76x76@2x.png", 152],
    ["AppIcon-83.5x83.5@2x.png", 167],
    ["AppIcon-512@2x.png", 1024],
  ];

  // Resize input to the largest iOS size once, then downscale for each variant
  const resizedBuf = await sharp(INPUT).resize(1024, 1024).png().toBuffer();

  for (const [filename, size] of iosSizes) {
    const iconBuf = await sharp(resizedBuf).resize(size, size).png().toBuffer();
    // iOS icons must NOT have transparency — composite onto white background
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: iconBuf, blend: "over" }])
      .png()
      .toFile(join(baseDir, filename));
  }

  console.log(`   ✓ ${iosSizes.length} iOS icon sizes`);
}

// ── Generate icon.icns via pnpm tauri icon (Apple proprietary format) ─
async function generateICNS() {
  console.log("\n🍏 Generating icon.icns via pnpm tauri icon...");

  const tmpInput = join(TAURI_ICONS, ".icon-src.png");
  await cp(INPUT, tmpInput);

  try {
    execSync(`pnpm tauri icon "${tmpInput}" -o "${TAURI_ICONS}"`, {
      cwd: ROOT,
      stdio: "inherit",
    });
    console.log("   ✓ icon.icns generated");
  } catch (err) {
    console.log("   ✗ Failed to generate icon.icns — try running manually:");
    console.log("     pnpm tauri icon public/logo.png -o src-tauri/icons");
  } finally {
    await rm(tmpInput, { force: true });
  }
}

// ── Main ────────────────────────────────────────────────────────────
console.log("🎨 Icon Generator — source: public/logo.png");

const meta = await sharp(INPUT).metadata();
console.log(
  `   Input: ${meta.width}x${meta.height} ${meta.channels}ch ${meta.format}`,
);

await generateFavicons();
await generateTauriDesktopIcons();
await generateAndroidIcons();
await generateIOSIcons();
await generateICNS();

console.log("\n✅ All icons generated!");
