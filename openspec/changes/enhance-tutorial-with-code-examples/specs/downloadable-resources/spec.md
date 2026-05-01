## ADDED Requirements

### Requirement: Blender 源文件和大型资源提供下载

系统 SHALL 将以下不可在浏览器中直接使用的资源迁移到 `public/downloads/<chapter>/` 目录下，并在对应章节的 MDX 文档中添加下载链接：

| 来源                                                       | 目标                                                         | 涉及章节 |
| ---------------------------------------------------------- | ------------------------------------------------------------ | -------- |
| `code/resources/portal.blend`                              | `public/downloads/23-custom-models-blender/portal.blend`     | 23       |
| `code/resources 2/portal.blend`                            | `public/downloads/23-custom-models-blender/portal-v2.blend`  | 23       |
| `code/model.blend`                                         | `public/downloads/23-custom-models-blender/model.blend`      | 23       |
| `code/32-coffee-smoke-shader-resources/*.webp`             | `public/downloads/32-coffee-smoke-shader/`                   | 32       |
| `code/32-coffee-smoke-shader-resources/*.hdr`              | `public/downloads/32-coffee-smoke-shader/`                   | 32       |
| `code/40-particles-morphing-shader-resources/models.blend` | `public/downloads/40-particles-morphing-shader/models.blend` | 40       |
| `code/42-wobbly-sphere-shader-resources/models.blend`      | `public/downloads/42-wobbly-sphere-shader/models.blend`      | 42       |
| `code/43-sliced-model-shader-resources/gears.blend`        | `public/downloads/43-sliced-model-shader/gears.blend`        | 43       |

#### Scenario: Blender 文件可下载

- **WHEN** 用户访问章节 23-custom-models-blender 的 MDX 页面
- **THEN** 页面中 SHALL 包含指向 `/downloads/23-custom-models-blender/portal.blend` 的下载链接

#### Scenario: HDR 环境贴图可下载

- **WHEN** 用户访问章节 32-coffee-smoke-shader 的 MDX 页面
- **THEN** 页面中 SHALL 包含指向 `/downloads/32-coffee-smoke-shader/` 下 `.hdr` 文件的下载链接

#### Scenario: 下载链接标注文件大小

- **WHEN** MDX 中包含下载链接
- **THEN** 链接文本 SHALL 包含文件名和文件大小（如 `portal.blend (1.2MB)`）

### Requirement: 跳过重复和无用资源文件

系统 SHALL 不迁移 `.DS_Store`、`.blend1`（Blender 自动备份）等非必要文件。

#### Scenario: 过滤备份文件

- **WHEN** `code/40-particles-morphing-shader-resources/` 包含 `models.blend1`
- **THEN** 该文件 SHALL 不被复制到 `public/downloads/`
