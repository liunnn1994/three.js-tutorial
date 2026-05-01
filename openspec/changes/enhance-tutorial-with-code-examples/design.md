## Context

当前 Astro 文档系统使用以下结构提供交互式教程示例：

- **`src/lesson-code/<chapter>/src/`** — 存放源码（script.js, style.css, index.html），由 `LessonPreview.astro` 组件读取并通过 Shiki 高亮显示
- **`public/previews/<chapter>.html`** — 预览 HTML 文件，在 iframe 中运行。引用 `/vendor/three.module.js` 和其他 vendor 库
- **`public/vendor/`** — Three.js、lil-gui、gsap 等库文件

现有问题：

1. `src/lesson-code/` 目录**只有源码文件，无 static/ 子目录**，缺少纹理、模型、HDR 等静态资产
2. `code/` 目录中的源码引用静态资产时使用 `/textures/...`、`/models/...` 等绝对路径，这些路径需要在 `public/` 下有对应文件
3. 当前 41 个已有的 preview HTML 是简化版，不包含完整的资源加载代码
4. `code/` 目录中 `*-final` 版本的脚本才是完整版，引用了所有必要的静态资产

`code/` 目录是临时参考源，迁移完成后删除。

## Goals / Non-Goals

**Goals:**

- 每个教程章节都有完整的代码示例（工作版 + 最终版），在 iframe 中可交互运行
- 静态资源（纹理、模型、HDR、着色器、字体）全部迁移到 Astro 文档系统的 `public/` 目录下
- 每个章节的源码通过 `LessonPreview` 组件正确展示
- Blender 源文件等不可在浏览器中直接使用的资源提供下载链接
- 代码过于简单的章节根据教学目标补充完整示例

**Non-Goals:**

- 不改变现有的 `LessonPreview.astro` 组件架构（iframe + Shiki 方案）
- 不升级 Astro/Starlight/Vite 版本
- 不添加新的 npm 依赖
- 不处理纯文字章节（01-introduction, 02-what-is-webgl, 53-the-end, 67-the-end）的代码示例
- 不处理 React/R3F 章节（54-66），这些需要单独迁移方案（项目结构完全不同）
- 不引入 Git LFS（体积管理后续再考虑）

## Decisions

### 1. 静态资源存放策略：按章节命名空间存入 `public/`

**选择**：将静态资源按章节组织到 `public/assets/<chapter>/` 下，例如：

```
public/assets/10-textures/textures/door/color.jpg
public/assets/10-textures/textures/minecraft.png
public/assets/21-imported-models/models/Fox/glTF/Fox.gltf
public/assets/21-imported-models/draco/draco_decoder.js
```

**替代方案**：

- 全部平铺到 `public/textures/`、`public/models/` — 不同章节可能有同名文件冲突（多个章节都使用 `door` 纹理）
- 使用 `src/assets/` — Astro 会处理这些文件（添加哈希），无法通过绝对路径引用

**理由**：按章节命名空间隔离避免冲突，保持与 `code/` 中 `static/` 目录结构的映射关系。preview HTML 中的资源路径需要从 `/textures/...` 改为 `/assets/<chapter>/textures/...`。

### 2. Preview HTML 生成策略：从 code/ 的最终版脚本重建

**选择**：基于 `code/<chapter>-final/src/script.js` 和 `code/<chapter>/src/script.js` 重建 preview HTML，将资源路径从 `/textures/...` 重写为 `/assets/<chapter>/textures/...`，并使用 importmap 引用 vendor 库。

**替代方案**：

- 直接使用 `code/` 中的 HTML 文件 — 这些文件体积巨大（10-200MB），因为内嵌了 base64 资源
- 用 Vite 构建生成 — 引入额外构建步骤，增加复杂度

**理由**：code/ 中的 HTML 文件内嵌了所有资源（base64），单个文件可达 200MB，不适合直接使用。从源码重建可控制体积，路径也可精确控制。

### 3. LessonPreview 组件适配

**选择**：修改 `LessonPreview.astro`，支持工作版和最终版切换。通过 `version` prop 区分：

```astro
<LessonPreview lesson="10-textures" />
<LessonPreview lesson="10-textures-final" />
```

两个版本使用独立的 `lesson-code` 目录和 `preview HTML` 文件。

### 4. 可下载资源策略

**选择**：将 Blender 源文件（.blend）和大型 HDR 文件放入 `public/downloads/<chapter>/`，在 MDX 中以链接形式提供下载。

涉及资源：

- `code/resources/portal.blend` → `public/downloads/23-custom-models-blender/portal.blend`
- `code/32-coffee-smoke-shader-resources/` → `public/downloads/32-coffee-smoke-shader/`
- `code/40-particles-morphing-shader-resources/` → `public/downloads/40-particles-morphing-shader/`
- `code/42-wobbly-sphere-shader-resources/` → `public/downloads/42-wobbly-sphere-shader/`
- `code/43-sliced-model-shader-resources/` → `public/downloads/43-sliced-model-shader/`
- `code/model.blend` → `public/downloads/23-custom-models-blender/model.blend`

### 5. 需要增强的章节

以下章节的 code/ 源码过于简单（只有基础 Three.js 设置，未展示章节主题内容），需要根据教学目标编写完整示例：

| 章节                     | 当前状态          | 需要补充                                   |
| ------------------------ | ----------------- | ------------------------------------------ |
| 03-first-threejs-project | 代码完整          | 无需补充，已有完整教学代码在 MDX 中        |
| 10-textures              | 源码无纹理加载    | 补充完整的纹理加载、UV、属性设置代码       |
| 21-imported-models       | 源码无模型加载    | 补充 GLTFLoader、DRACOLoader、模型动画代码 |
| 其他 41 个已有章节       | preview HTML 简化 | 从 `-final` 版本重建完整 preview           |

## Risks / Trade-offs

- **[仓库体积暴增]** → 静态资源总计约 500MB+。后续可考虑 Git LFS 或 CDN 托管。当前先完成功能迁移。
- **[Preview HTML 路径重写]** → 需要确保每个 preview 中的资源路径都正确指向 `/assets/<chapter>/...`。需要建立验证脚本。
- **[DRACOLoader 解码器]** → 多个章节使用 Draco 压缩模型，需要 `draco_decoder.js` 等文件。将这些文件放入各章节的 `public/assets/<chapter>/draco/` 中。
- **[构建时间增加]** → Astro 需要处理大量静态文件。`public/` 下的文件不会被 Astro 处理，直接复制到输出目录，影响较小。
- **[Shader 章节特殊处理]** → 着色器章节（27-44）使用 `.glsl`/`.vert`/`.frag` 文件，`LessonPreview` 已支持这些文件类型的高亮显示。
