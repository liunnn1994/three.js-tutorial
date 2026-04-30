## ADDED Requirements

### Requirement: 为缺失代码示例的章节创建 lesson-code 目录
系统 SHALL 为以下章节创建 `src/lesson-code/<chapter>/` 目录，包含 `src/script.js`、`src/style.css`、`src/index.html`：

- `03-first-threejs-project`
- `13-go-live`
- `23-custom-models-with-blender`
- `26-code-structuring-for-bigger-projects`
- `46-performance-tips`
- `51-importing-and-optimizing-the-scene`
- `52-adding-details-to-the-scene`

每个目录的源码 SHALL 基于对应 `code/<chapter>/src/` 中的文件，并根据需要进行增强。

#### Scenario: 基础章节源码迁移
- **WHEN** `code/03-first-threejs-project/src/` 包含 script.js、style.css、index.html
- **THEN** 这些文件 SHALL 被复制到 `src/lesson-code/03-first-threejs-project/src/` 中

#### Scenario: 增强过于简单的源码
- **WHEN** `code/<chapter>/src/script.js` 中的代码只包含基础 Three.js 场景设置（Scene、Camera、Renderer），未展示章节主题内容
- **THEN** 系统 SHALL 根据对应 MDX 教学文档中描述的教学目标，补充完整且与章节内容强关联的示例代码

#### Scenario: 代码与章节内容强关联
- **WHEN** 章节是 `46-performance-tips`（性能优化技巧）
- **THEN** 示例代码 SHALL 包含至少 2 个可对比的性能优化场景（如 InstancedMesh vs 普通 Mesh、draw call 优化等），让学习者能直观看到优化效果

#### Scenario: 源码文件高亮支持
- **WHEN** 章节包含 `.glsl`、`.vert`、`.frag` 等着色器文件
- **THEN** 这些文件 SHALL 存放在 `src/lesson-code/<chapter>/src/` 下，确保 `LessonPreview.astro` 能正确读取和高亮

### Requirement: 为缺失章节创建预览 HTML
系统 SHALL 为上述每个缺失章节创建 `public/previews/<chapter>.html`，预览文件 SHALL 使用 importmap 引用 `/vendor/three.module.js`，并且资源路径 SHALL 使用 `/assets/<chapter>/...` 格式。

#### Scenario: 预览 HTML 可在 iframe 中运行
- **WHEN** `public/previews/03-first-threejs-project.html` 被创建
- **THEN** 在浏览器中通过 iframe 加载该文件时 SHALL 显示一个红色立方体的 Three.js 场景

#### Scenario: 预览 HTML 资源路径正确
- **WHEN** 预览 HTML 中需要加载纹理
- **THEN** 纹理路径 SHALL 指向 `/assets/<chapter>/textures/...`，而非 `code/` 目录
