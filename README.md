<div align="center">
  <h1>📄 onedrive-vercel-index-enhanced</h1>
  <p><a href="docs/markdown.md">Markdown 渲染</a> · <a href="docs/configuration.md">配置文档</a> · <a href="https://github.com/Kazusa1085/onedrive-vercel-index-enhanced/issues">Issues</a></p>
  <p><em>基于 OneDrive 的网盘目录站，由 Vercel 和 Next.js 驱动</em></p>

  <img src="https://img.shields.io/badge/OneDrive-2C68C3?style=flat&logo=microsoft-onedrive&logoColor=white" alt="OneDrive" />
  <img src="https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Vercel-black?style=flat&logo=Vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/MIT-License-black?style=flat" alt="License" />
</div>

## 太长不看（TL;DR）

展示、分享、预览和下载你 OneDrive 中的文件——

- 完全免费托管 💸
- 快速 ⚡ 响应灵敏 💦
- 15 分钟内完成部署 ⏱️
- 高度可定制 ⚒️

🍌 更重要的是，我们很好看 (●'◡'●)

## 快速开始

🚀 部署流程：Fork / 导入代码到 Vercel → 配置环境变量 → 完成 OAuth 授权。详细步骤见[配置文档](docs/configuration.md)。

## 功能特性

| 预览 | 布局 | 多媒体 |
| --- | --- | --- |
| 👀 **文件预览** | 💠 **列表 / 网格布局** | 🎥 **视频与音频** |
| PDF（PDF.js canvas）、EPUB、Markdown、代码、纯文本、图片 | 缩略图预览、目录分页（每页最多 200 项） | mp4、mp3、m3u8、flv 等，支持外挂字幕 |

| Markdown 增强 | 保护与下载 | 其他 |
| --- | --- | --- |
| 📝 **Markdown 扩展** | 🔒 **受保护文件夹** | 🔎 **原生搜索** |
| Admonitions 提示框、Spoiler 剧透、行号与复制按钮、数学公式 | 目录密码保护；多文件 / 文件夹打包下载（zip） | 目录名 + 文件名搜索（需 Graph 搜索可用） |

... 以及更多：

- 深色模式、站点样式自定义、直接分享原始文件链接
- Markdown 渲染说明：[docs/markdown.md](docs/markdown.md)
- 完整配置说明：[docs/configuration.md](docs/configuration.md)

> **注意**：本项目聚焦于展示和共享 OneDrive 中的文件，强调**免费**与**无服务器**。如果你有自己的服务器 / 需要 WebDAV / 使用其他云存储，可以看看 [OpenList](https://github.com/rwv/openlist)。

## 文档

- [Markdown 渲染说明（中文）](docs/markdown.md) · [Markdown Rendering Guide (English)](docs/markdown.en.md)
- [配置文档（中文）](docs/configuration.md) · [Configuration Guide (English)](docs/configuration.en.md)
- 遇到问题？请到 [Issues](https://github.com/Kazusa1085/onedrive-vercel-index-enhanced/issues) 反馈

## 无服务器（免费）？

是的！完全免费，无需任何后端服务器。（我们使用 Redis 存储 token，但它也是免费的。）

## 上游项目

本项目由 [postman1year/onedrive-vercel-index @ 892c1de](https://github.com/postman1year/onedrive-vercel-index/tree/892c1de) 修改而来，项目原作者是已归档的 [spencerwooo/onedrive-vercel-index](https://github.com/spencerwooo/onedrive-vercel-index)。感谢两位大佬。

OAuth 登录所使用的共享 App 来自 [OneManager-php](https://github.com/qkqpttgf/OneManager-php)，没有该项目的共享凭据，本项目无法完成 OneDrive 绑定（参见原项目 [issue #1057](https://github.com/spencerwooo/onedrive-vercel-index/issues/1057)）。非常感谢 [qkqpttgf](https://github.com/qkqpttgf) 大佬。

## 许可

[MIT](LICENSE)

<div align="center">
  <em>Thanks to everyone who contributed to this project 🫶</em>
</div>
