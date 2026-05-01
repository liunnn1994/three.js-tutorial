## ADDED Requirements

### Requirement: 所有章节 MDX 引用 LessonPreview 组件

系统 SHALL 确保每个教程章节的 MDX 文件都包含 `LessonPreview` 组件引用。纯文字章节（01, 02, 53, 67）除外。

#### Scenario: 已有 LessonPreview 的章节保持不变

- **WHEN** MDX 文件中已存在 `<LessonPreview lesson="xx-name" />`
- **THEN** 该引用 SHALL 保持不变

#### Scenario: 缺失 LessonPreview 的章节添加引用

- **WHEN** MDX 文件中未包含 `LessonPreview` 组件（如 03, 13, 23, 26, 46, 51, 52）
- **THEN** 系统 SHALL 在适当位置添加 `<LessonPreview lesson="<chapter>" />` 引用

### Requirement: 有最终版的章节展示双版本示例

对于拥有 `-final` 版本 lesson-code 的章节，系统 SHALL 在 MDX 中同时展示工作版和最终版的 `LessonPreview`。

#### Scenario: 双版本展示

- **WHEN** 章节 10-textures 同时有 `src/lesson-code/10-textures/` 和 `src/lesson-code/10-textures-final/`
- **THEN** MDX 中 SHALL 包含两个 `LessonPreview` 引用：`<LessonPreview lesson="10-textures" />` 和 `<LessonPreview lesson="10-textures-final" />`

#### Scenario: 双版本标签区分

- **WHEN** MDX 中展示双版本
- **THEN** 工作版 SHALL 标注为"工作版"（跟随教程一步步写的版本），最终版 SHALL 标注为"最终版"（完整完成后的版本）

### Requirement: 有可下载资源的章节添加下载区块

对于 Blender 源文件等可下载资源涉及的章节（23, 32, 40, 42, 43），系统 SHALL 在 MDX 末尾添加下载资源区块。

#### Scenario: Blender 章节下载区块

- **WHEN** 章节 23 的 MDX 文档被更新
- **THEN** SHALL 在文档中添加"下载资源"区块，包含 `.blend` 文件的下载链接及文件大小标注

### Requirement: 更新 LessonPreview 组件支持 static 资源

`LessonPreview.astro` 组件 SHALL 在显示源码时也能展示该章节相关的静态资源文件列表（可选展示）。

#### Scenario: LessonPreview 无需修改即可工作

- **WHEN** 现有的 `LessonPreview` 组件通过 `src/lesson-code/<lesson>/src/` 读取源码
- **THEN** 组件 SHALL 继续正常工作，不需要修改组件本身来处理 static/ 资源（资源由 preview HTML 的 iframe 直接加载）
