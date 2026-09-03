import { chmodSync } from "node:fs";

if (process.platform !== "win32") {
  chmodSync("android/gradlew", 0o755);
}

console.log("Android Gradle wrapper is ready");
