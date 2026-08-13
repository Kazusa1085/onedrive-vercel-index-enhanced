# Markdown Rendering Guide

The Markdown preview on this site is powered by [react-markdown](https://github.com/remarkjs/react-markdown), extended with admonitions, spoilers, math formulas, and enhanced code blocks.

> 中文版本：[Markdown 渲染说明](markdown.md)

## Basic Syntax

Standard GitHub Flavored Markdown (GFM) is fully supported:

- Headings (H1-H6), **bold**, *italic*, ~~strikethrough~~
- Unordered / ordered lists, task lists (`- [x]`)
- Tables (with alignment), blockquotes, horizontal rules, footnotes (`[^1]`)
- Inline code `` `code` ``, fenced code blocks (```)
- [Links](#), ![images](#), Emoji (🚀), email `<someone@example.com>`, autolinks `<https://example.com>`

> Tip: naming a file `README.md` renders it at the bottom of the folder listing, like GitHub.

## Code Blocks

Code blocks come with a **language title bar, line numbers, a copy button (revealed on hover on desktop, always visible on mobile), and line wrapping**.

```ts
// Supported: ts, js, py, sh, json, yaml, xml, css, cpp, rust, go, java, sql, ...
const greeting = (name: string): string => `Hello, ${name}!`
```

- Both short tags (`ts`, `js`, `py`, `sh`...) and canonical names (`typescript`, `javascript`...) are recognized
- Code blocks without a language annotation render as plain text without highlighting
- Unknown language names safely fall back to plain text

## Math Formulas (KaTeX)

Inline math `$E = mc^2$` and block math `$$...$$`, including matrices, fractions, and integrals:

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

## Raw HTML

By default, HTML tags that pass a **strict allowlist** are rendered (e.g. `<details>`, `<summary>`, `<kbd>`, `<mark>`, `<sub>`, `<sup>`).

Scripts, event handlers, iframes, forms, dangerous URLs, and dangerous SVG features are removed. This can be disabled via `siteConfig.allowRawHtmlInMarkdown` (see [Configuration](configuration.en.md)).

## Admonitions

Five types: `note`, `tip`, `important`, `warning`, `caution`, rendered as tinted blocks with an uppercase title.

**Container directive syntax:**

```markdown
:::warning
This is a warning.
:::
```

**Custom titles:**

```markdown
:::note[My Title]
A note with a custom title.
:::
```

**GitHub quote syntax (also supported):**

```markdown
> [!NOTE]
> This is a GitHub-style note.
```

> Only a `[!TYPE]` marker on the first line of a blockquote is converted; other markers and plain quotes are unaffected.

Admonitions support nested content (lists, code blocks, math, etc.):

```markdown
:::tip[Example]
A list inside an admonition:
- Item A
- Item B
:::
```

## Spoilers

Content wrapped in `:spoiler[...]` is hidden until clicked (keyboard accessible):

```markdown
The ending is :spoiler[the protagonist wins]!
```

## Images

- Remote images (`http(s)://` direct links) render as-is
- Relative images: `![local](./test-image.png)` resolve to files in the same directory as the Markdown file; spaces and CJK filenames are supported
- Images inside protected folders are also password-protected and load with a token

## FAQ

**Why is my code block not highlighted?** Check the language tag syntax (e.g. ` ```python `); unregistered languages do not highlight.

**Why is my admonition not tinted?** Make sure you used `:::note` (three colons) or a `> [!NOTE]` marker on the first quote line, with one of the five known types.

**Why does my relative image fail to load?** Confirm the image is in the same directory as the Markdown file and the filename case matches.

---

[Back to README](../README.md) · [Configuration](configuration.en.md)
