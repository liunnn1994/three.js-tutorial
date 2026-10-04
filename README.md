# Three.js 教程

基于 Three.js 的交互式中文教程平台，支持网页文档和 Android/iOS 移动应用。

## 技术栈

| 层级        | 技术                                                                      | 用途                   |
| ----------- | ------------------------------------------------------------------------- | ---------------------- |
| 文档框架    | [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) | 静态站点生成、文档主题 |
| 样式        | [Tailwind CSS](https://tailwindcss.com) v4                                | 自定义样式             |
| 代码高亮    | [Shiki](https://shiki.style)                                              | 语法高亮               |
| 移动端      | [Capacitor](https://capacitorjs.com/docs) v8                              | Android/iOS 原生容器   |
| 3D 渲染     | [Three.js](https://threejs.org)                                           | 教程核心内容           |
| 动画        | [GSAP](https://gsap.com)                                                  | 动画示例               |
| 物理        | [Cannon-ES](https://github.com/pmndrs/cannon-es)                          | 物理引擎示例           |

## 项目结构

```
.
├── .github/workflows/
│   └── build.yml              # Android 移动端构建流水线
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
│   └── generate-icons.mjs     # 生成网页及移动端图标
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
├── android/                   # Capacitor Android 原生工程
├── ios/                       # Capacitor iOS 原生工程
├── capacitor.config.ts        # Capacitor 应用与 Web 目录配置
├── astro.config.mjs           # Astro 配置（Starlight + Tailwind）
├── package.json               # Node.js 依赖和脚本
└── tsconfig.json              # TypeScript 配置
```

## 教程内容

共 **83 节课**，从入门到实战，覆盖 Three.js 全部核心知识：

| 分类     | 内容                                                           |
| -------- | -------------------------------------------------------------- |
| 基础入门 | 环境搭建、变换、动画、相机、几何体、材质、纹理、3D 文字        |
| 技术技巧 | 光照、阴影、粒子系统、物理引擎、模型导入、光线投射、环境贴图   |
| 着色器   | GLSL 基础、Shader Patterns、海面、星系、烟雾、全息、烟花、地形 |
| 高级主题 | 后期处理、性能优化、加载进度、HTML 与 WebGL 混合               |
| 场景创建 | Blender 建模、烘焙导出、导入优化、细节添加                     |
| TresJS | Vue 3D 应用、模型、物理、后处理等 10 节课程 |
| WebGPU & TSL | 节点语法到烟雾、护盾、银河、GPU compute、草地与雪地，共 21 节 |

## 开发

### 环境要求

- [Node.js](https://nodejs.org/) LTS
- [pnpm](https://pnpm.io/) 12+
- Android：[Android Studio](https://developer.android.com/studio)（Android SDK 36）与 Java 21
- iOS：macOS 与最新版 Xcode

仓库通过 `.mise.toml` 固定以上工具链版本，可运行 `mise install` 一次性安装。

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
| `pnpm icons`   | 从 `public/logo.png` 生成网页及移动端图标 |
| `pnpm mobile:sync` | 构建网页并同步到 Android/iOS 原生工程 |

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

## Capacitor 移动端开发

`android/` 和 `ios/` 已提交到仓库，首次拉取后不需要再次执行 `cap add`。修改网页内容、Capacitor 配置或插件后，先同步原生工程：

```bash
pnpm mobile:sync
```

### Android

环境要求：Android Studio（Android SDK 36）和 Java 21。

```bash
pnpm android:open          # 使用 Android Studio 打开原生工程
pnpm android:run           # 同步后运行到设备或模拟器
pnpm android:build         # 使用下述签名环境变量构建 release APK
```

### iOS

环境要求：macOS 和最新版 Xcode。发布证书、Provisioning Profile 与开发团队需要在 Xcode 中配置。

```bash
pnpm ios:open              # 使用 Xcode 打开原生工程
pnpm ios:run               # 同步后运行到设备或模拟器
pnpm ios:build             # 使用当前 Xcode 签名配置构建 IPA
```

应用标识为 `com.threejstutorial.app`，Web 构建目录由 `capacitor.config.ts` 固定为 `dist/`。`pnpm sync-version` 会把 `package.json` 版本同步到 Android 和 iOS 工程。

Android release 构建需要设置 `ANDROID_KEYSTORE_PATH`、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS` 和 `ANDROID_KEY_PASSWORD`。签名信息只从环境变量读取，不写入仓库。

## 图标生成

网页图标、移动端 App 图标和启动图均从 `public/logo.png` 生成：

```bash
pnpm icons
```

生成的图标覆盖：

- **文档站**：favicon.ico、多尺寸 PNG、Apple Touch Icon、PWA 图标
- **Android**：mdpi / hdpi / xhdpi / xxhdpi / xxxhdpi
- **iOS**：1024x1024 AppIcon，自动合成不透明背景
- **启动图**：Android 横竖屏密度资源与 iOS Universal Splash

## CI/CD

GitHub Actions 仅构建并发布移动端 Android APK，配置文件为 `.github/workflows/build.yml`。桌面端不再构建；iOS 保留原生工程，由 macOS/Xcode 完成签名发布。

### 触发方式

- **自动触发**：`Release` 工作流成功创建 GitHub Release 后触发
- **手动触发**：在 Actions 页面运行 `Build and Release`，可指定已有 Release tag

### 构建矩阵

| 平台    | 运行环境     | 产物          |
| ------- | ------------ | ------------- |
| Android | ubuntu-22.04 | 签名的 `.apk` |

自动签名需要配置 `ANDROID_KEYSTORE_BASE64`、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS` 和 `ANDROID_KEY_PASSWORD` 四个 GitHub Actions Secrets。

### 发布流程

1. 按 Conventional Commits 提交到 `main`
2. `semantic-release` 更新 `package.json`、创建 tag 和 GitHub Release
3. `Build and Release` 使用 Capacitor 构建签名 APK
4. 工作流将 APK 上传到对应的 GitHub Release
