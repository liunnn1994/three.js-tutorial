# Three.js 教程

基于 Three.js 的交互式中文教程平台，支持网页文档、桌面端和移动端应用。

## 技术栈

| 层级        | 技术                                                                      | 用途                   |
| ----------- | ------------------------------------------------------------------------- | ---------------------- |
| 文档框架    | [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) | 静态站点生成、文档主题 |
| 样式        | [Tailwind CSS](https://tailwindcss.com) v4                                | 自定义样式             |
| 代码高亮    | [Shiki](https://shiki.style)                                              | 语法高亮               |
| 桌面/移动端 | [Tauri](https://tauri.app) v2                                             | 跨平台原生应用         |
| 3D 渲染     | [Three.js](https://threejs.org)                                           | 教程核心内容           |
| 动画        | [GSAP](https://gsap.com)                                                  | 动画示例               |
| 物理        | [Cannon-ES](https://github.com/pmndrs/cannon-es)                          | 物理引擎示例           |

## 项目结构

```
.
├── .github/workflows/
│   └── build.yml              # CI/CD 全平台构建流水线
├── public/
│   ├── favicon.ico            # 网站图标
│   ├── logo.png               # 项目 Logo（图标生成源文件）
│   ├── previews/              # 生成的课程预览 HTML（gitignored）
│   ├── vendor/                # 离线 Three.js 依赖（gitignored）
│   │   ├── three.core.js      # Three.js 核心 ESM
│   │   ├── three.module.js    # Three.js 完整模块
│   │   ├── three/             # Three.js addons/examples
│   │   ├── gsap.esm.js        # GSAP 打包文件
│   │   ├── lil-gui.esm.js     # lil-gui 调试面板
│   │   └── ...                # 其他依赖
│   └── downloads/             # 可下载资源
├── scripts/
│   ├── generate-previews.js   # 生成课程交互预览
│   ├── copy-vendor.js         # 从 node_modules 复制离线依赖
│   └── generate-icons.mjs     # 生成全平台图标
├── src/
│   ├── components/
│   │   └── LessonPreview.astro # 课程预览组件
│   ├── content/
│   │   ├── docs/              # 教程内容
│   │   │   ├── basics/        # 基础入门
│   │   │   ├── techniques/    # 技术技巧
│   │   │   ├── shaders/       # 着色器
│   │   │   ├── advanced/      # 高级主题
│   │   │   └── scene-creation/# 场景创建
│   │   └── content.config.ts  # 内容配置
│   ├── lesson-code/           # 课程源代码
│   │   ├── XX-lesson-name/    # 课程进行中版本
│   │   └── XX-lesson-name-final/ # 课程完成版本
│   ├── styles/
│   │   └── global.css         # 全局样式（Tailwind + 预览样式）
│   └── assets/                # 静态资源
├── src-tauri/                 # Tauri 原生应用
│   ├── src/                   # Rust 后端代码
│   ├── icons/                 # 全平台应用图标
│   ├── Cargo.toml             # Rust 依赖配置
│   └── tauri.conf.json        # Tauri 应用配置
├── astro.config.mjs           # Astro 配置（Starlight + Tailwind）
├── package.json               # Node.js 依赖和脚本
└── tsconfig.json              # TypeScript 配置
```

## 教程内容

共 **53 节课**，从入门到实战，覆盖 Three.js 全部核心知识：

| 分类     | 内容                                                           |
| -------- | -------------------------------------------------------------- |
| 基础入门 | 环境搭建、变换、动画、相机、几何体、材质、纹理、3D 文字        |
| 技术技巧 | 光照、阴影、粒子系统、物理引擎、模型导入、光线投射、环境贴图   |
| 着色器   | GLSL 基础、Shader Patterns、海面、星系、烟雾、全息、烟花、地形 |
| 高级主题 | 后期处理、性能优化、加载进度、HTML 与 WebGL 混合               |
| 场景创建 | Blender 建模、烘焙导出、导入优化、细节添加                     |

## 开发

### 环境要求

- [Node.js](https://nodejs.org/) LTS
- [pnpm](https://pnpm.io/)

### 安装与启动

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:4321` 查看文档站点。

### 常用命令

| 命令           | 说明                                |
| -------------- | ----------------------------------- |
| `pnpm dev`     | 启动文档开发服务器                  |
| `pnpm build`   | 构建文档站点到 `dist/`              |
| `pnpm preview` | 预览构建产物                        |
| `pnpm icons`   | 从 `public/logo.png` 生成全平台图标 |

## 课程预览系统

每节课程内嵌可运行的 Three.js 实时预览，由以下脚本协作完成：

### 生成流程

```
src/lesson-code/          →  scripts/generate-previews.js  →  public/previews/
（课程源代码 .js/.glsl/.css）   （内联依赖、生成独立 HTML）      （可直接运行的预览文件）
```

1. **`scripts/copy-vendor.js`** — 从 `node_modules` 复制 Three.js、GSAP、lil-gui 等到 `public/vendor/`，供离线预览使用。通过 esbuild 将 GSAP 打包为单个 ESM 文件。
2. **`scripts/generate-previews.js`** — 扫描 `src/lesson-code/` 下所有课程目录，将 JavaScript 中的 import 替换为 vendor 路径，内联 GLSL 着色器代码和 CSS，生成独立的 HTML 预览文件。
3. **`src/components/LessonPreview.astro`** — Starlight 组件，在文档页面中渲染预览 iframe 和可展开的源码查看器（使用 Shiki 语法高亮）。

### 课程代码目录结构

每节课包含进行中版本和完成版本：

```
src/lesson-code/
├── 03-first-threejs-project/
│   └── src/
│       ├── script.js        # 课程编写中的代码
│       └── style.css
└── 03-first-threejs-project-final/
    └── src/
        ├── script.js        # 课程完成后的最终代码
        └── style.css
```

在 MDX 中通过 `<LessonPreview lesson="03-first-threejs-project" />` 引用，组件会优先加载 `-final` 版本。

## Tauri 桌面端开发

### 环境要求

- Node.js + pnpm
- [Rust](https://www.rust-lang.org/tools/install)

```bash
pnpm tauri:dev
```

### 平台依赖

**Windows**: Visual Studio Build Tools（C++ 工作负载）

**macOS**: Xcode Command Line Tools — `xcode-select --install`

**Linux**: `sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`

## Tauri 移动端开发

### Android

环境要求：Android Studio（SDK + NDK）、Java 17

```bash
pnpm tauri:android:init    # 初始化 Android 项目（仅需一次）
pnpm tauri:android:dev     # 启动 Android 调试
pnpm tauri:android:build   # 构建 APK
```

### iOS

环境要求：macOS、Xcode（App Store 最新版）

```bash
pnpm tauri:ios:init        # 初始化 iOS 项目（仅需一次）
pnpm tauri:ios:dev         # 启动 iOS 调试
pnpm tauri:ios:build       # 构建 IPA
```

## 图标生成

所有平台图标均从 `public/logo.png`（建议 1024x1024 RGBA PNG）自动生成：

```bash
pnpm icons
```

生成的图标覆盖：

- **文档站**：favicon.ico、多尺寸 PNG、Apple Touch Icon、PWA 图标
- **桌面端**：Windows (.ico)、macOS (.icns + PNG)、Linux (PNG)
- **Android**：mdpi / hdpi / xhdpi / xxhdpi / xxxhdpi
- **iOS**：18 种尺寸，自动去除透明度

## CI/CD

GitHub Actions 自动化构建全平台应用，配置文件：`.github/workflows/build.yml`

### 触发方式

- **Tag 推送**：`git tag v0.1.0 && git push --tags` 自动触发
- **手动触发**：GitHub Actions 页面点击 `Run workflow`

### 构建矩阵

| 平台                  | 运行环境       | 产物              |
| --------------------- | -------------- | ----------------- |
| macOS (Apple Silicon) | macos-latest   | .dmg              |
| Windows               | windows-latest | .msi, .exe (NSIS) |
| Linux                 | ubuntu-22.04   | .deb, .AppImage   |
| Android               | ubuntu-22.04   | .apk              |
| iOS                   | macos-latest   | .ipa              |

桌面端构建会自动创建 GitHub Draft Release，移动端产物作为 Workflow Artifact 上传。

### 发布流程

1. 更新 `package.json` 和 `src-tauri/tauri.conf.json` 中的版本号
2. 提交并打 Tag：`git tag v0.1.0 && git push --tags`
3. 等待 GitHub Actions 完成所有平台构建
4. 审核 Draft Release 并手动发布
