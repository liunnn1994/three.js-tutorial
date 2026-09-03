import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile, mkdir, cp } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WEB_INPUT = join(ROOT, "public/logo.png");
const PUBLIC = join(ROOT, "public");
const ANDROID_RES = join(ROOT, "android/app/src/main/res");
const IOS_APP_ICONSET = join(ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset");
const IOS_SPLASHSET = join(ROOT, "ios/App/App/Assets.xcassets/Splash.imageset");
const APP_BACKGROUND = { r: 9, g: 17, b: 34, alpha: 1 };

async function resizeSquare(input, size, output) {
  await sharp(input).resize(size, size).png().toFile(output);
}

async function resizeWithPadding(
  input,
  size,
  scale,
  output,
  background = { r: 0, g: 0, b: 0, alpha: 0 },
) {
  const innerSize = Math.max(1, Math.round(size * scale));
  const iconBuf = await sharp(input).resize(innerSize, innerSize).png().toBuffer();
  const outputImage = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  }).composite([{ input: iconBuf, gravity: "center" }]);

  if (background.alpha === 1) {
    outputImage.removeAlpha();
  }

  await outputImage.png().toFile(output);
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
    await resizeSquare(WEB_INPUT, size, out);
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

// ── Capacitor Android icons ────────────────────────────────────────
// The shared artwork is a rounded-corner tile with its border baked in.
// Crop the border off so launcher masks crop uniform background instead of
// showing a border arc on circular masks, and so the launcher, splash, and
// iOS icon all carry the same mark with no size or border mismatch.
const TILE_BORDER_INSET = 0.1;

async function loadBorderlessArtwork() {
  const meta = await sharp(WEB_INPUT).metadata();
  const inset = Math.round(Math.min(meta.width, meta.height) * TILE_BORDER_INSET);
  return sharp(WEB_INPUT)
    .extract({
      left: inset,
      top: inset,
      width: meta.width - inset * 2,
      height: meta.height - inset * 2,
    })
    .png()
    .toBuffer();
}

async function generateAndroidIcons() {
  console.log("\n📱 Generating Android icons...");

  // The salient Three.js mark is already centered inside the adaptive safe zone.
  // Keep the full canvas so the mark is not inset a second time; launcher masks
  // may crop the decorative full-bleed background, which is intentional and
  // keeps the center mark at the user-approved larger size.
  const SAFE_ZONE_SCALE = 1;
  const artwork = await loadBorderlessArtwork();

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

    await resizeSquare(artwork, launcher, join(dirPath, "ic_launcher.png"));
    await resizeSquare(artwork, launcher, join(dirPath, "ic_launcher_round.png"));
    await resizeWithPadding(
      artwork,
      foreground,
      SAFE_ZONE_SCALE,
      join(dirPath, "ic_launcher_foreground.png"),
    );
  }

  console.log("   ✓ mdpi / hdpi / xhdpi / xxhdpi / xxxhdpi");
}

// ── Capacitor iOS icon ─────────────────────────────────────────────
async function generateIOSIcons() {
  await mkdir(IOS_APP_ICONSET, { recursive: true });
  console.log("\n🍎 Generating opaque iOS icon...");
  await resizeWithPadding(
    WEB_INPUT,
    1024,
    1,
    join(IOS_APP_ICONSET, "AppIcon-512@2x.png"),
    APP_BACKGROUND,
  );
  console.log("   ✓ AppIcon-512@2x.png (1024x1024)");
}

async function generateSplash(input, width, height, output) {
  const iconSize = Math.round(Math.min(width, height) * 0.32);
  const icon = await sharp(input).resize(iconSize, iconSize).png().toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: APP_BACKGROUND,
    },
  })
    .composite([{ input: icon, gravity: "center" }])
    .png()
    .toFile(output);
}

async function generateSplashScreens() {
  console.log("\n🌅 Generating branded splash screens...");

  const androidSplashes = [
    ["drawable", 480, 320],
    ["drawable-port-mdpi", 320, 480],
    ["drawable-port-hdpi", 480, 800],
    ["drawable-port-xhdpi", 720, 1280],
    ["drawable-port-xxhdpi", 960, 1600],
    ["drawable-port-xxxhdpi", 1280, 1920],
    ["drawable-land-mdpi", 480, 320],
    ["drawable-land-hdpi", 800, 480],
    ["drawable-land-xhdpi", 1280, 720],
    ["drawable-land-xxhdpi", 1600, 960],
    ["drawable-land-xxxhdpi", 1920, 1280],
  ];

  for (const [dir, width, height] of androidSplashes) {
    const dirPath = join(ANDROID_RES, dir);
    await mkdir(dirPath, { recursive: true });
    await generateSplash(WEB_INPUT, width, height, join(dirPath, "splash.png"));
  }

  await mkdir(IOS_SPLASHSET, { recursive: true });
  const iosSplash = join(IOS_SPLASHSET, "splash-2732x2732.png");
  await generateSplash(WEB_INPUT, 2732, 2732, iosSplash);
  await cp(iosSplash, join(IOS_SPLASHSET, "splash-2732x2732-1.png"));
  await cp(iosSplash, join(IOS_SPLASHSET, "splash-2732x2732-2.png"));

  console.log("   ✓ Android portrait/landscape splash screens");
  console.log("   ✓ iOS universal splash screens");
}

// ── Main ────────────────────────────────────────────────────────────
console.log("🎨 Asset Generator");
const meta = await sharp(WEB_INPUT).metadata();
console.log(`   Source: public/logo.png ${meta.width}x${meta.height} ${meta.channels}ch ${meta.format}`);
if ((meta.width ?? 0) < 1024 || (meta.height ?? 0) < 1024) {
  throw new Error("Source logo artwork (public/logo.png) must be at least 1024x1024");
}

await generateFavicons();
await generateAndroidIcons();
await generateIOSIcons();
await generateSplashScreens();

console.log("\n✅ All app assets generated!");
