# Markdown 渲染说明

本站的 Markdown 预览基于 [react-markdown](https://github.com/remarkjs/react-markdown)，并扩展了提示框、剧透、数学公式、代码块增强等能力。

> English version: [Markdown Rendering Guide](markdown.en.md)

## 基础语法

标准 GitHub Flavored Markdown（GFM）均受支持：

- 标题（H1-H6）、**粗体**、*斜体*、~~删除线~~
- 无序 / 有序列表、任务列表（`- [x]`）
- 表格（含对齐语法）、引用块、分割线、脚注（`[^1]`）
- 行内代码 `` `code` ``、代码块（``` 围栏）
- [链接](#)、![图片](#)、Emoji（🚀）、邮箱 `<someone@example.com>`、自动链接 `<https://example.com>`

> 提示：将文件命名为 `README.md` 时，它会像 GitHub 一样自动显示在文件夹列表底部。

## 代码块

代码块带**顶部语言标题栏、行号、复制按钮（桌面 hover 显示、移动端常显）、长行自动换行**。

```ts
// 支持的语言：ts、js、py、sh、json、yaml、xml、css、cpp、rust、go、java、sql 等
const greeting = (name: string): string => `Hello, ${name}!`
```

- 短语言标记（`ts`、`js`、`py`、`sh`…）与规范名（`typescript`、`javascript`…）均可识别
- 无语言标注的代码块显示为纯文本，不触发高亮
- 未识别的语言名安全降级为纯文本

## 数学公式（KaTeX）

行内公式 `$E = mc^2$` 与块级公式 `$$...$$`，支持矩阵、分式、积分等：

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

## 原始 HTML

默认允许渲染**经过安全白名单过滤**的 HTML 标签（如 `<details>`、`<summary>`、`<kbd>`、`<mark>`、`<sub>`、`<sup>`）。

脚本、事件属性、iframe、表单、危险链接与危险 SVG 特性会被移除。可通过 `siteConfig.allowRawHtmlInMarkdown` 关闭（见[配置文档](configuration.md)）。

## Admonitions 提示框

五种类型：`note`、`tip`、`important`、`warning`、`caution`，渲染为彩色色块 + 大写标题。

**容器指令语法：**

```markdown
:::warning
这是一条警告提示。
:::
```

**自定义标题：**

```markdown
:::note[我的标题]
带自定义标题的提示。
:::
```

**GitHub 引用语法（同样支持）：**

```markdown
> [!NOTE]
> 这是 GitHub 语法的提示。
```

> 只有 `[!TYPE]` 位于引用块首行时才会转换；其他类型的标记与普通引用不受影响。

提示框内支持嵌套内容（列表、代码块、公式等）：

```markdown
:::tip[示例]
提示框内的列表：
- 项目 A
- 项目 B
:::
```

## Spoiler 剧透

`:spoiler[内容]` 包裹的内容默认隐藏，点击后显示（支持键盘操作）：

```markdown
结局是 :spoiler[主角赢了]！
```

## 图片

- 远程图片（`http(s)://` 直链）直接渲染
- 相对路径图片：`![本地图片](./test-image.png)` 指向与 Markdown 同目录的文件，支持中文、空格等文件名
- 受保护目录内的图片同样受密码保护，带 token 加载

## 常见问题

**为什么我的代码块没有高亮？** 请确认语言标记写法正确（如 ` ```python `），未注册的语言不会高亮。

**提示框没有变成彩色？** 检查是否使用了 `:::note`（注意冒号数量）或 `> [!NOTE]` 位于引用首行，且类型为五种之一。

**相对图片加载失败？** 确认图片与 Markdown 文件在同一目录，文件名大小写一致。

---

[返回 README](../README.md) · [配置文档](configuration.md)
