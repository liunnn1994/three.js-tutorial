## 1. 创建目标目录结构

- [x] 1.1 创建 `public/assets/` 目录（用于存放所有章节的静态资源）
- [x] 1.2 创建 `public/downloads/` 目录（用于存放可下载的 Blender 源文件等）
- [x] 1.3 创建缺失章节的 `src/lesson-code/` 空目录：03-first-threejs-project, 13-go-live, 23-custom-models-with-blender, 26-code-structuring-for-bigger-projects, 46-performance-tips, 51-importing-and-optimizing-the-scene, 52-adding-details-to-the-scene

## 2. 迁移静态资源到 public/assets

- [x] 2.1 迁移基础章节静态资源（03-13）：将 `code/<chapter>/static/` 和 `code/<chapter>-final/static/` 复制到 `public/assets/<chapter>/` 和 `public/assets/<chapter>-final/`
- [x] 2.2 迁移技术章节静态资源（14-25）：同上规则
- [x] 2.3 迁移着色器章节静态资源（26-44）：同上规则，包含 .glsl/.vert/.frag 文件
- [x] 2.4 迁移高级章节静态资源（45-48）：同上规则
- [x] 2.5 迁移场景创建章节静态资源（51-52）：同上规则
- [x] 2.6 验证所有章节的静态资源已正确迁移，无遗漏

## 3. 迁移可下载资源到 public/downloads

- [x] 3.1 复制 `code/resources/portal.blend` 和 `code/model.blend` 到 `public/downloads/23-custom-models-blender/`
- [x] 3.2 复制 `code/32-coffee-smoke-shader-resources/` 中的 .webp 和 .hdr 文件到 `public/downloads/32-coffee-smoke-shader/`
- [x] 3.3 复制 `code/40-particles-morphing-shader-resources/models.blend` 到 `public/downloads/40-particles-morphing-shader/`
- [x] 3.4 复制 `code/42-wobbly-sphere-shader-resources/models.blend` 到 `public/downloads/42-wobbly-sphere-shader/`
- [x] 3.5 复制 `code/43-sliced-model-shader-resources/gears.blend` 到 `public/downloads/43-sliced-model-shader/`
- [x] 3.6 清理 .DS_Store 和 .blend1 备份文件

## 4. 为缺失章节创建 lesson-code 和 preview

- [x] 4.1 创建 `03-first-threejs-project` 的 lesson-code（复制 `code/03-first-threejs-project/src/` 到 `src/lesson-code/03-first-threejs-project/src/`）
- [x] 4.2 创建 `03-first-threejs-project` 的 preview HTML（基于源码重建，资源路径指向 `/assets/03-first-threejs-project/`）
- [x] 4.3 创建 `13-go-live` 的 lesson-code 和 preview HTML
- [x] 4.4 创建 `23-custom-models-with-blender` 的 lesson-code 和 preview HTML
- [x] 4.5 创建 `26-code-structuring-for-bigger-projects` 的 lesson-code 和 preview HTML
- [x] 4.6 创建 `46-performance-tips` 的 lesson-code 和 preview HTML（需增强示例代码以展示性能对比）
- [x] 4.7 创建 `51-importing-and-optimizing-the-scene` 的 lesson-code 和 preview HTML
- [x] 4.8 创建 `52-adding-details-to-the-scene` 的 lesson-code 和 preview HTML

## 5. 为最终版创建 lesson-code 和 preview

- [x] 5.1 迁移最终版源码：将所有 `code/<chapter>-final/src/` 复制到对应的 `src/lesson-code/<chapter>-final/src/`（04-48 已有工作版的章节）
- [x] 5.2 重建最终版 preview HTML：基于 `-final/src/script.js` 生成 `public/previews/<chapter>-final.html`，资源路径重写为 `/assets/<chapter>-final/...`
- [x] 5.3 验证所有最终版 preview HTML 文件不超过 100KB 且可正常加载

## 6. 重建工作版 preview HTML（增强简化版）

- [x] 6.1 检查现有 41 个工作版 preview HTML，识别哪些是简化版（缺少资源加载代码）
- [x] 6.2 对资源依赖型章节（10-textures, 11-materials, 12-3d-text, 15-shadows, 16-haunted-house, 17-particles, 20-physics, 21-imported-models, 22-raycaster, 24-environment-map, 25-realistic-render, 31-modified-materials, 45-post-processing, 47-intro-loading, 48-mixing-html-webgl）重建完整 preview
- [x] 6.3 对着色器章节（27-44）重建包含着色器资源的 preview
- [x] 6.4 验证重建后的工作版 preview 能正确加载 `/assets/<chapter>/` 下的资源

- [x] 7.1 增强 `10-textures` 工作版 lesson-code：补充纹理加载、UV 映射、纹理属性设置代码
- [x] 7.2 增强 `21-imported-models` 工作版 lesson-code：补充 GLTFLoader、DRACOLoader、模型动画代码
- [x] 7.3 检查其他章节源码是否充分展示章节内容，对不足的进行增强

## 8. 更新 MDX 文档

- [x] 8.1 更新 `03-first-project.mdx`：添加 `<LessonPreview lesson="03-first-threejs-project" />`
- [x] 8.2 更新 `10-textures.mdx`：添加最终版 `<LessonPreview lesson="10-textures-final" />`
- [x] 8.3 更新 `13-go-live.mdx`：添加 `<LessonPreview lesson="13-go-live" />`
- [x] 8.4 更新 `23-custom-models-blender.mdx`：添加 LessonPreview 和下载资源区块
- [x] 8.5 更新 `26-code-structuring.mdx`：添加 LessonPreview
- [x] 8.6 更新 `46-performance-tips.mdx`：添加 LessonPreview
- [x] 8.7 更新 `51-importing-optimizing.mdx`：添加 LessonPreview
- [x] 8.8 更新 `52-adding-details.mdx`：添加 LessonPreview
- [x] 8.9 更新 `32-coffee-smoke.mdx`：添加下载资源区块（.blend, .hdr）
- [x] 8.10 更新 `40-particles-morphing.mdx`：添加下载资源区块（.blend）
- [x] 8.11 更新 `42-wobbly-sphere.mdx`：添加下载资源区块（.blend）
- [x] 8.12 更新 `43-sliced-model.mdx`：添加下载资源区块（.blend）
- [x] 8.13 为所有已有工作版且有最终版的章节（04-09, 11-12, 14-22, 24-25, 27-45, 47-48）添加最终版 LessonPreview 引用

## 9. 验证和收尾

- [x] 9.1 运行 `npm run dev` 验证所有 preview 在 iframe 中可正常加载
- [x] 9.2 验证所有静态资源路径在浏览器中可访问（无 404）
- [x] 9.3 验证所有 LessonPreview 组件正确显示源码高亮
- [x] 9.4 验证所有下载链接可正常下载文件
- [x] 9.5 确认文档中不存在对 `code/` 目录的引用
