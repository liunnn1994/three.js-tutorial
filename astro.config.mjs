// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "Three.js 中文教程",
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
      ],
      customCss: ["./src/styles/global.css"],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
