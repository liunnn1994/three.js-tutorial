## Why

当前教程文档（Astro + Starlight）中，已有 41 个章节通过 `LessonPreview` 组件集成了代码示例，但存在两个关键缺陷：(1) **无静态资源** — 所有 `src/lesson-code/` 目录只有源代码文件，缺少运行示例所需的纹理、模型、HDR 等静态资产，导致 iframe 预览无法加载资源；(2) **大量章节缺失** — 共 54 个教程章节，其中 13 个完全没有代码示例，另有章节的示例代码过于简单，未能充分展示章节内容。

**关键约束**：`code/` 目录中的所有文件仅供迁移参考，实现完成后 `code/` 目录将被删除。所有代码、资源、预览文件必须迁移到 Astro 文档系统内部（`src/lesson-code/`、`public/previews/`、`public/assets/` 等），不允许在文档中引用 `code/` 路径。

## What Changes

- 将 `code/` 目录中所有章节的源码和静态资源**完整迁移**到 `src/lesson-code/<chapter>/` 中（包括 `src/` 和 `static/`）
- 将 `code/` 中的 HTML 预览文件迁移到 `public/previews/` 中
- 将 `code/` 中的 Blender 源文件、HDR 等可下载资源迁移到 `public/downloads/` 并在章节文档中添加下载链接
- 为缺少代码示例的章节（03, 13, 23, 26, 46, 51, 52）根据章节内容创建增强的 lesson-code
- 对代码过于简单的章节，根据章节教学目标补充完整示例
- 更新 MDX 文档，确保每个章节引用 `LessonPreview` 并展示工作版和最终版示例

## Capabilities

### New Capabilities

- `lesson-static-assets`: 将所有章节的静态资源（纹理、模型、HDR、着色器、字体等）从 `code/` 复制到 `src/lesson-code/` 对应目录，确保 iframe 预览能正确加载资源
- `missing-lesson-code`: 为 13 个缺失代码示例的章节创建增强的 lesson-code 目录（03-first-threejs-project, 13-go-live, 23-custom-models-with-blender, 26-code-structuring, 46-performance-tips, 51-importing-optimizing, 52-adding-details）
- `final-version-lessons`: 为所有章节的 `-final` 版本创建独立的 lesson-code 和 preview 文件，展示每节课的最终完成效果
- `downloadable-resources`: 整理 Blender 源文件（.blend）、HDR 环境贴图等资源，在对应章节文档中添加下载链接（涉及章节 23, 32, 40, 42, 43, 49, 50）
- `lesson-mdx-updates`: 更新所有 MDX 文档文件，为缺失 `LessonPreview` 的章节添加组件引用，为有最终版的章节添加双版本展示

### Modified Capabilities

（无需修改已有规范）

## Impact

- **文件系统**: `src/lesson-code/` 将新增约 60+ 个目录，包含大量静态资源文件（总计约 500MB+）
- **`public/previews/`**: 将新增约 60+ 个预览 HTML 文件
- **文档文件**: 54 个 MDX 文件中约 20 个需要更新以添加 `LessonPreview` 引用
- **构建时间**: 大量新增静态资源可能导致 Astro 构建时间增加
- **Git 仓库体积**: 大量二进制资源（纹理、模型）会显著增加仓库体积，建议考虑 Git LFS
- **无需 API 或依赖变更**: 使用现有的 Vite + Astro + Starlight 技术栈
