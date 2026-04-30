## ADDED Requirements

### Requirement: 为每个章节的最终版创建独立 lesson-code
系统 SHALL 为以下范围中每个章节的 `-final` 版本创建 `src/lesson-code/<chapter>-final/` 目录：04-48 中已有工作版 lesson-code 的章节。每个 `-final` 目录 SHALL 包含 `src/` 子目录，其内容来源于 `code/<chapter>-final/src/`。

不包含纯文字章节（01, 02, 53, 67）和 React/R3F 章节（54-66）。

#### Scenario: 最终版源码独立
- **WHEN** `code/10-textures-final/src/script.js` 包含完整的纹理加载代码
- **THEN** 该文件 SHALL 被复制到 `src/lesson-code/10-textures-final/src/script.js`

#### Scenario: 最终版和工作版并存
- **WHEN** 章节 10-textures 同时有工作版和最终版
- **THEN** `src/lesson-code/10-textures/` 和 `src/lesson-code/10-textures-final/` SHALL 各自独立存在

### Requirement: 为最终版创建预览 HTML
系统 SHALL 为每个 `-final` 版本创建 `public/previews/<chapter>-final.html`。预览 HTML SHALL 基于 `code/<chapter>-final/src/script.js` 重建，资源路径 SHALL 重写为 `/assets/<chapter>-final/...` 格式。

#### Scenario: 预览 HTML 资源路径重写
- **WHEN** `code/10-textures-final/src/script.js` 中引用 `/textures/door/color.jpg`
- **THEN** `public/previews/10-textures-final.html` 中对应路径 SHALL 被重写为 `/assets/10-textures-final/textures/door/color.jpg`

#### Scenario: 预览 HTML 使用 vendor 库
- **WHEN** 预览 HTML 被创建
- **THEN** SHALL 使用 `<script type="importmap">` 引用 `/vendor/three.module.js`、`/vendor/lil-gui.esm.js`、`/vendor/gsap.esm.js`

#### Scenario: 预览 HTML 不内嵌资源
- **WHEN** 预览 HTML 被创建
- **THEN** 文件 SHALL 不包含 base64 内嵌资源，所有资源通过 URL 引用外部文件，单个 HTML 文件 SHALL 不超过 100KB
