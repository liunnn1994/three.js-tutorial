// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import templateCompilerOptions from "@tresjs/core/template-compiler-options";

// https://astro.build/config
export default defineConfig({
  integrations: [
    vue({
      ...templateCompilerOptions,
    }),
    starlight({
      title: "Three.js 教程",
      favicon: "./public/favicon.ico",
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
          autogenerate: { directory: "basics" },
        },
        {
          label: "技术技巧",
          autogenerate: { directory: "techniques" },
        },
        {
          label: "着色器",
          autogenerate: { directory: "shaders" },
        },
        {
          label: "高级主题",
          autogenerate: { directory: "advanced" },
        },
        {
          label: "场景创建",
          autogenerate: { directory: "scene-creation" },
        },
        {
          label: "TresJS (Vue)",
          autogenerate: { directory: "tresjs" },
        },
      ],
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
