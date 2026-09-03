import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor Android supports this native JSON option even though the CLI's
// public TypeScript interface does not currently declare it. Keeping it in a
// separate structurally compatible object avoids an unsafe type assertion.
const serverConfig = {
  androidScheme: "https",
  html5mode: false,
};

const config: CapacitorConfig = {
  appId: "com.threejstutorial.app",
  appName: "Three.js 中文教程",
  webDir: "dist",
  server: serverConfig,
  android: {
    buildOptions: {
      releaseType: "APK",
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      keystoreAlias: process.env.ANDROID_KEY_ALIAS,
      keystoreAliasPassword: process.env.ANDROID_KEY_PASSWORD,
      signingType: "apksigner",
    },
  },
};

export default config;
