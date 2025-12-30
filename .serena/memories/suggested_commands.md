Windows 常用命令：
- 查看目录：Get-ChildItem
- 搜索文件：Get-ChildItem -Recurse -Filter <pattern>

项目相关命令：
- 资源转换（Ant）：ant -f etc/propgen/build.xml
- 图片缩放工具：
  cd etc/imageResize
  npm install
  node drawImageResize.js --file=path/to/file.drawio --width=200

运行方式：参考 README（GitHub Pages 或官方 Docker 项目）。