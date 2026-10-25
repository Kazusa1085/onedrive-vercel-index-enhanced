# 配置文档

本站的所有配置都集中在 `config/` 目录下，修改后重新部署即可生效。

> English version: [Configuration Guide](configuration.en.md)

## 环境变量（Vercel 项目设置）

| 变量                  | 必填 | 说明                                                                                    |
| --------------------- | ---- | --------------------------------------------------------------------------------------- |
| `REDIS_URL`           | 是   | [Upstash](https://vercel.com/integrations/upstash) Redis 连接地址，用于持久化存储 token |
| `CLIENT_ID`           | 是   | Azure App Registration 的 Application (client) ID                                       |
| `SECRET_KEY`          | 是   | 混淆后的 client secret（见下方说明）                                                    |
| `USER_PRINCIPAL_NAME` | 是   | 你的微软账号邮箱，**必须与登录 OneDrive 的账号完全一致**（服务端校验身份时使用）        |
| `BASE_DIRECTORY`      | 否   | 共享的根目录，默认 `/` 表示整个网盘                                                     |
| `KV_PREFIX`           | 否   | Redis key 前缀，多实例部署时用于隔离，默认空                                            |
| `REDIRECT_URI`        | 否   | OAuth 回调地址，默认 `http://localhost`；需与 Azure 应用注册中的重定向 URI 一致         |
| `AUTH_API`            | 否   | OAuth token 端点；仅世纪互联等非国际版需要覆盖                                          |
| `DRIVE_API`           | 否   | Microsoft Graph drive 端点；仅世纪互联等非国际版需要覆盖                                |

> `SECRET_KEY` 不能用明文 client secret，需要先用项目内置的混淆算法（AES，内置密钥）加密后填入。

> 未设置 `CLIENT_ID` / `SECRET_KEY` 时，会回退到 OneManager 共享应用（公共 fallback），仅用于个人测试场景。

## `config/site.config.js`

| 配置项                                                  | 作用                                                      | 默认值                  |
| ------------------------------------------------------- | --------------------------------------------------------- | ----------------------- |
| `userPrincipalName`                                     | 站点所有者账号（也可用环境变量 `USER_PRINCIPAL_NAME`）    | 空                      |
| `title`                                                 | 站点标题（导航栏显示）                                    | —                       |
| `themeHue`                                              | 全局强调色的 OKLCH hue（345 玫瑰 / 220 蓝 / 140 绿 / 280 紫） | `345`                   |
| `icon`                                                  | 站点图标（`/public` 下的路径）                            | `/icons/128.png`        |
| `baseDirectory`                                         | 共享根目录（也可用环境变量 `BASE_DIRECTORY`）             | `/`                     |
| `maxItems`                                              | 每页条目数（上限 200）                                    | `100`                   |
| `searchEnabled`                                         | 是否启用全局搜索（需 Graph 搜索可用）                     | `false`                 |
| `backgroundImage`                                       | 页面背景图（直接图片 URL；留空使用内置极光背景）          | 空                      |
| `randomBackgrounds`                                     | 随机背景图池（每次访问随机取一张）                        | `[]`                    |
| `footer`                                                | 页脚 HTML（会原样渲染，仅使用可信内容）                   | —                       |
| `email`                                                 | 导航栏邮箱链接                                            | 空                      |
| `links`                                                 | 导航栏社交链接数组（图标按名称匹配 FontAwesome 品牌图标） | `[]`                    |
| `protectedRoutes`                                       | 受保护文件夹路径数组                                      | `[]`                    |
| `googleFontSans` / `googleFontMono` / `googleFontLinks` | 字体设置                                                  | Roboto / JetBrains Mono |
| `datetimeFormat`                                        | 时间显示格式（day.js 语法）                               | `YYYY-MM-DD HH:mm:ss`   |
| `allowRawHtmlInMarkdown`                                | Markdown 是否渲染经过白名单过滤的原始 HTML                | `true`                  |

## `config/api.config.js`

| 配置项                   | 作用                                                        | 默认值                                                                                |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `clientId`               | Azure 应用 ID（也可用环境变量 `CLIENT_ID`）                 | 公共 fallback（OneManager）                                                           |
| `obfuscatedClientSecret` | 混淆后的 client secret（也可用环境变量 `SECRET_KEY`）       | 公共 fallback（OneManager）                                                           |
| `redirectUri`            | OAuth 回调地址（也可用环境变量 `REDIRECT_URI`）             | `http://localhost`                                                                    |
| `authApi` / `driveApi`   | API 端点（也可用 `AUTH_API` / `DRIVE_API`；国际版保持默认） | 微软国际版                                                                            |
| `scope`                  | OAuth 请求权限                                              | `openid profile email https://graph.microsoft.com/Files.ReadWrite.All offline_access` |
| `cacheControlHeader`     | 边缘缓存策略                                                | `max-age=0, s-maxage=60, stale-while-revalidate`                                      |

## 受保护文件夹

1. 在 OneDrive 对应目录里放一个 `.password` 文件，内容即文件夹密码；
2. 把该目录路径加入 `config/site.config.js` 的 `protectedRoutes` 数组；
3. 重新部署后，访问该目录会要求输入密码。浏览器只保存版本化的 SHA-256 哈希，不保存明文密码；旧版本留下的明文 token 会在首次读取时自动迁移为哈希。目录内文件同样受保护。

> 路径匹配大小写不敏感，与 OneDrive 行为一致。
>
> 密码通过 `.password` 明文文件比对，请确保 OneDrive 目录权限本身可靠；受保护路径的 API 响应会使用 `private, no-store`，不会被 CDN 缓存。

## 常见问题

**修改配置后需要做什么？** 修改 `config/` 下的文件后需要重新部署才会生效。

**为什么没有生效？** 检查 Vercel 环境变量是否与 `config/` 中的配置冲突（环境变量优先级更高），以及部署时是否清除了构建缓存。

---

[返回 README](../README.md) · [Markdown 渲染说明](markdown.md)
