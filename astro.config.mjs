// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import templateCompilerOptions from "@tresjs/core/template-compiler-options";

// https://astro.build/config
export default defineConfig({
  // Capacitor serves bundled files without a web-server rewrite layer. Emit
  // explicit .html routes for the app so every Starlight link can be opened
  // directly by Android/iOS, while keeping clean directory URLs on the web.
  build: {
    format: process.env.BUILD_TARGET === "app" ? "file" : "directory",
  },
  integrations: [
    vue({
      ...templateCompilerOptions,
    }),
    starlight({
      title: "Three.js 教程",
      // Capacitor Android intentionally intercepts /favicon.ico with an empty
      // response, so use the generated PNG on both web and native builds.
      favicon: "/favicon-48x48.png",
      defaultLocale: "root",
      locales: {
        root: {
          label: "简体中文",
          lang: "zh-CN",
        },
      },
      sidebar: [
        {
          label: "基础入门",
          items: [{ autogenerate: { directory: "basics" } }],
        },
        {
          label: "技术技巧",
          items: [{ autogenerate: { directory: "techniques" } }],
        },
        {
          label: "着色器",
          items: [{ autogenerate: { directory: "shaders" } }],
        },
        {
          label: "高级主题",
          items: [{ autogenerate: { directory: "advanced" } }],
        },
        {
          label: "场景创建",
          items: [{ autogenerate: { directory: "scene-creation" } }],
        },
        {
          label: "TresJS (Vue)",
          items: [{ autogenerate: { directory: "tresjs" } }],
        },
        {
          label: "WebGPU & TSL (01-21)",
          items: [{ autogenerate: { directory: "webgpu-tsl" } }],
        },
      ],
      components: { Head: "./src/components/ReadingProgressHead.astro" },
      customCss: ["./src/styles/global.css"],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ["three"],
    },
    ssr: {
      noExternal: [
        "@tresjs/core",
        "@tresjs/cientos",
        "@tresjs/leches",
        "@tresjs/post-processing",
        "three-custom-shader-material",
      ],
    },
  },
});
