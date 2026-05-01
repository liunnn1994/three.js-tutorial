## ADDED Requirements

### Requirement: 静态资源按章节命名空间迁移到 public/assets

系统 SHALL 将 `code/<chapter>/static/` 下的所有静态资源迁移到 `public/assets/<chapter>/` 目录下，保持原有子目录结构不变。章节名称使用 kebab-case 格式（如 `10-textures`、`16-haunted-house`）。

#### Scenario: 纹理资源迁移

- **WHEN** `code/10-textures/static/` 包含 `textures/door/color.jpg` 等文件
- **THEN** 这些文件 SHALL 被复制到 `public/assets/10-textures/textures/door/color.jpg`，路径结构保持一致

#### Scenario: 模型资源迁移

- **WHEN** `code/21-imported-models/static/` 包含 `models/Fox/glTF/Fox.gltf` 和 `draco/` 解码器
- **THEN** 这些文件 SHALL 被复制到 `public/assets/21-imported-models/models/` 和 `public/assets/21-imported-models/draco/`

#### Scenario: HDR 环境贴图迁移

- **WHEN** `code/24-environment-map/static/` 包含 `.hdr` 文件
- **THEN** 这些文件 SHALL 被复制到 `public/assets/24-environment-map/` 对应子目录

#### Scenario: 着色器文件迁移

- **WHEN** `code/27-shaders/static/` 包含 `.glsl`、`.vert`、`.frag` 文件
- **THEN** 这些文件 SHALL 被复制到 `public/assets/27-shaders/` 对应子目录

#### Scenario: 同名文件冲突避免

- **WHEN** 多个章节（如 10-textures、16-haunted-house）都有 `textures/door/color.jpg`
- **THEN** 每个文件的最终路径 SHALL 包含章节名前缀（`/assets/10-textures/textures/...` vs `/assets/16-haunted-house/textures/...`），不存在冲突

### Requirement: 覆盖所有需要静态资源的章节

系统 SHALL 为以下所有拥有 `static/` 目录的章节执行资源迁移：03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 51, 52 的 `-final` 版本以及对应的工作版本。每个章节的 `-final` 版本和工作版本可能共享相同资源，系统 SHALL 为每个版本创建独立的资源副本。

#### Scenario: 最终版资源独立

- **WHEN** 章节 10-textures 和 10-textures-final 各自有 `static/` 目录
- **THEN** 系统 SHALL 分别创建 `public/assets/10-textures/` 和 `public/assets/10-textures-final/`

#### Scenario: 仅最终版有静态资源

- **WHEN** 某章节只有 `-final` 版本有 `static/` 目录
- **THEN** 系统 SHALL 只为 `-final` 版本创建资源目录，工作版不创建空目录
