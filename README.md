# onedrive-vercel-index-enhanced

基于微软 **OneDrive** + **Vercel** + **Next.js** 的网盘目录站：展示、分享、预览和下载 OneDrive 中的文件。

- 适配 **OneDrive 国际个人版**（商业版 E5 同样适用），完全免费托管，无后端服务器
- Next.js 16（Turbopack）+ React 19 + TypeScript 6 + Tailwind CSS 4
- PDF 预览基于 pdf.js（pdfjs-dist 6），不依赖浏览器原生 PDF 插件
- 支持 Node 24 LTS（Vercel 已支持）

## 功能特性

- 文件预览：PDF、EPUB、Markdown、代码、纯文本、图片、音视频（mp4、mp3、m3u8、flv 等，支持外挂字幕）
- Office 文档预览：docx、pptx、xlsx（经由 Office 在线查看器）
- 列表 / 网格两种目录布局，目录分页（每页最多 200 项，默认 100）
- 「受保护文件夹」：目录密码保护（原生 HTML）
- 多文件 / 文件夹打包下载（压缩为 zip）
- 原生全局搜索（目录名 + 文件名）
- 深色模式、站点样式自定义、直接分享原始文件链接

## 快速部署

1. **Fork / 导入代码**到 [Vercel](https://vercel.com/)，Node 版本选 **24.x**（`package.json` 中已声明）。
2. **配置环境变量**（Vercel 项目 Settings → Environment Variables）：

   | 变量 | 必填 | 说明 |
   | --- | --- | --- |
   | `REDIS_URL` | 是 | [Upstash](https://vercel.com/integrations/upstash) Redis 连接地址，用于持久化存储 token |
   | `CLIENT_ID` | 是 | Azure App Registration 的 Application (client) ID |
   | `SECRET_KEY` | 是 | 混淆后的 client secret（见下方说明） |
   | `USER_PRINCIPAL_NAME` | 是 | 你的微软账号邮箱，**必须与登录 OneDrive 的账号完全一致**（服务端校验身份时使用） |
   | `BASE_DIRECTORY` | 否 | 共享的根目录，默认 `/` 表示整个网盘 |
   | `KV_PREFIX` | 否 | Redis key 前缀，多实例部署时用于隔离，默认空 |

   > `SECRET_KEY` 不能用明文 client secret，需要先用项目内置的混淆算法（AES，内置密钥）加密后填入。具体步骤可参考[官方文档（使用你自己的 client id 与 secret）](https://ovi.swo.moe/zh/docs/advanced)。

3. **初始化授权**：部署完成后访问 `/onedrive-vercel-index-oauth/step-1`，按三步完成 OAuth：
   - Step 1：打开生成的授权链接，用你的微软账号登录并授权；
   - Step 2：把浏览器跳转到的 `localhost` 页面完整 URL 粘贴回页面，自动提取授权码；
   - Step 3：服务器校验身份并自动存储 token，随后自动返回首页。
   - 整个过程 token 不会经过浏览器明文展示，全部由服务端处理。
4. 回到首页即可看到你的 OneDrive 目录。

## 自定义配置

### `config/site.config.js`

| 配置项 | 作用 | 默认值 | 如何隐藏 |
| --- | --- | --- | --- |
| `userPrincipalName` | 站点所有者账号（也可用环境变量 `USER_PRINCIPAL_NAME`） | 空 | — |
| `title` | 站点标题（导航栏显示） | — | 修改为自己标题 |
| `icon` | 站点图标（`/public` 下的路径） | `/icons/128.png` | — |
| `baseDirectory` | 共享根目录（也可用环境变量 `BASE_DIRECTORY`） | `/` | — |
| `maxItems` | 每页条目数（上限 200） | `100` | — |
| `footer` | 页脚 HTML | — | `footer: ''` |
| `email` | 导航栏邮箱链接 | — | `email: ''` |
| `links` | 导航栏社交链接数组 | — | `links: []` |
| `protectedRoutes` | 受保护文件夹路径数组 | — | `protectedRoutes: []` |
| `googleFontSans` / `googleFontMono` / `googleFontLinks` | 字体设置 | — | — |
| `datetimeFormat` | 时间显示格式（day.js 语法） | `YYYY-MM-DD HH:mm:ss` | — |
| `allowRawHtmlInMarkdown` | Markdown 是否渲染原始 HTML | `true` | 改为 `false`（见下文开关说明） |

### `config/api.config.js`

| 配置项 | 作用 | 默认值 |
| --- | --- | --- |
| `clientId` | Azure 应用 ID（也可用环境变量 `CLIENT_ID`） | 空 |
| `obfuscatedClientSecret` | 混淆后的 client secret（也可用环境变量 `SECRET_KEY`） | 空 |
| `redirectUri` | OAuth 回调地址 | `http://localhost` |
| `authApi` / `driveApi` | API 端点（世纪互联需自行修改，国际版保持默认） | 微软国际版 |
| `scope` | OAuth 请求权限 | `user.read files.read.all offline_access` |
| `cacheControlHeader` | 边缘缓存策略 | `max-age=0, s-maxage=60, stale-while-revalidate` |

## 受保护文件夹

1. 在 OneDrive 对应目录里放一个 `.password` 文件，内容即文件夹密码；
2. 把该目录路径加入 `config/site.config.js` 的 `protectedRoutes` 数组；
3. 重新部署后，访问该目录会要求输入密码（本地 SHA256 哈希存储于浏览器），目录内文件同样受保护。

## Markdown 原始 HTML 渲染开关

Markdown 预览（README.md 等 `.md` 文件）默认允许渲染一组安全的原始 HTML 标签（例如 `details`、`summary`、`kbd`），这是为了保证与旧版行为一致。
开启时 HTML 会经过严格白名单过滤；脚本、事件属性、iframe、表单、危险链接和危险 SVG 特性都会被移除。即使如此，若不需要 HTML，关闭此开关仍是最保守的选择。

关闭方法：编辑 `config/site.config.js`，将 `allowRawHtmlInMarkdown` 改为 `false`，重新部署即可。

## 更多文档

- 官方文档（含获取你自己的 client id / secret 的完整教程）：[ovi.swo.moe](https://ovi.swo.moe/)
- 维护者仓库：[Kazusa1085/onedrive-vercel-index-enhanced](https://github.com/Kazusa1085/onedrive-vercel-index-enhanced)

## 许可

本项目代码基于 [MIT](LICENSE) 许可。
