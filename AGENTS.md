# Repository Guidelines

## 项目结构与模块组织
- 核心前端资源位于 `src/main/webapp/`，包括 `js/`、`styles/`、`templates/`、`resources/`、`plugins/` 与图标/图片目录。
- Java 相关代码位于 `src/main/java/`，用于打包与服务端逻辑（如有）。
- 工具与脚本集中在 `etc/`，例如 `etc/propgen/` 与 `etc/imageResize/`。

## 构建、测试与本地运行
- 本仓库未提供统一的一键构建/测试脚本；运行方式以文档为准。
- 资源转换工具（Ant）：
  ```bash
  ant -f etc/propgen/build.xml
  ```
- 图片缩放工具（Node）：
  ```bash
  cd etc/imageResize
  npm install
  node drawImageResize.js --file=path/to/file.drawio --width=200
  ```
- 如需完整应用运行，参考 README 中的 GitHub Pages 或官方 Docker 方案。

## 编码风格与命名规范
- 未发现统一格式化/静态检查工具配置；请保持现有文件的缩进与换行风格。
- 命名遵循目录语义：资源文件放入对应子目录（如 `js/`、`styles/`、`templates/`）。
- 避免无关的大范围格式化改动，聚焦最小可读变更。

## 测试指南
- 仓库中未发现统一测试框架或覆盖率要求。
- 建议在改动后手动验证：页面加载、核心绘图流程与导出功能。

## 提交与 Pull Request 指南
- README 明确说明：该项目不接受 PR。
- 由于环境限制无法读取 Git 历史提交规范，若有内部规范请先与维护者确认。

## 安全与合规
- 安全问题请遵循 `SECURITY.md` 的上报渠道。
- 商标与品牌使用需遵循 README 的限制说明。