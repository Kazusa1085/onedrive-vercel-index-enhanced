# Configuration Guide

All configuration lives in the `config/` directory. Changes take effect after a redeploy.

> 中文版本：[配置文档](configuration.md)

## Environment Variables (Vercel Project Settings)

| Variable | Required | Description |
| --- | --- | --- |
| `REDIS_URL` | Yes | [Upstash](https://vercel.com/integrations/upstash) Redis connection URL, used to persist tokens |
| `CLIENT_ID` | Yes | Azure App Registration Application (client) ID |
| `SECRET_KEY` | Yes | Obfuscated client secret (see below) |
| `USER_PRINCIPAL_NAME` | Yes | Your Microsoft account email, **must exactly match the OneDrive account** (used for server-side identity verification) |
| `BASE_DIRECTORY` | No | Shared root directory, default `/` for the whole drive |
| `KV_PREFIX` | No | Redis key prefix for multi-instance isolation, default empty |

> `SECRET_KEY` must not be the plain client secret; it has to be encrypted with the project's built-in obfuscation algorithm (AES, built-in key) first.

> When `CLIENT_ID` / `SECRET_KEY` are not set, the OneManager shared application is used as a public fallback (for personal testing only).

## `config/site.config.js`

| Key | Purpose | Default |
| --- | --- | --- |
| `userPrincipalName` | Site owner account (or env `USER_PRINCIPAL_NAME`) | empty |
| `title` | Site title (shown in the navbar) | — |
| `icon` | Site icon (path under `/public`) | `/icons/128.png` |
| `baseDirectory` | Shared root directory (or env `BASE_DIRECTORY`) | `/` |
| `maxItems` | Items per page (max 200) | `100` |
| `searchEnabled` | Enable global search (requires working Graph search) | `false` |
| `backgroundImage` | Page background image (direct URL; empty uses the built-in aurora background) | empty |
| `randomBackgrounds` | Pool of random background images (one picked per visit) | `[]` |
| `footer` | Footer HTML | — |
| `email` | Navbar email link | empty |
| `links` | Navbar social links array (icons matched by FontAwesome brand name) | `[]` |
| `protectedRoutes` | Protected folder path array | `[]` |
| `googleFontSans` / `googleFontMono` / `googleFontLinks` | Font settings | Roboto / JetBrains Mono |
| `datetimeFormat` | Time display format (day.js syntax) | `YYYY-MM-DD HH:mm:ss` |
| `allowRawHtmlInMarkdown` | Render allowlisted raw HTML in Markdown | `true` |

## `config/api.config.js`

| Key | Purpose | Default |
| --- | --- | --- |
| `clientId` | Azure app ID (or env `CLIENT_ID`) | Public fallback (OneManager) |
| `obfuscatedClientSecret` | Obfuscated client secret (or env `SECRET_KEY`) | Public fallback (OneManager) |
| `redirectUri` | OAuth redirect URI | `http://localhost` |
| `authApi` / `driveApi` | API endpoints (change for 世纪互联; keep defaults for international) | Microsoft international |
| `scope` | OAuth requested scopes | `openid profile email https://graph.microsoft.com/Files.ReadWrite.All offline_access` |
| `cacheControlHeader` | Edge cache policy | `max-age=0, s-maxage=60, stale-while-revalidate` |

## Protected Folders

1. Place a `.password` file in the OneDrive folder; its content is the folder password;
2. Add the folder path to the `protectedRoutes` array in `config/site.config.js`;
3. After redeploying, visiting the folder requires the password (SHA-256 hashed, stored in the browser); files inside are protected too.

> Path matching is case-insensitive, matching OneDrive behavior.

## FAQ

**What happens after I edit the config?** Redeploy for the changes to take effect.

**Why didn't my change apply?** Check whether a Vercel environment variable overrides the `config/` value (env vars take precedence), and whether the deployment reused a stale build cache.

---

[Back to README](../README.md) · [Markdown Rendering Guide](markdown.en.md)
