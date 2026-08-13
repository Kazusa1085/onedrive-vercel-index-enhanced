// Match GitHub-style `> [!NOTE]` / `> [!WARNING]` first line inside a blockquote.
// GFM merges adjacent quote lines into one paragraph, so the marker may be
// followed by `\n` and more content; match until the line break (or line end).
const GITHUB_ADMONITION_RE = /^\s*\[!([a-zA-Z]+)\][ \t]*(?=\n|$)/

const KNOWN_TYPES = ['note', 'tip', 'important', 'warning', 'caution']

interface MdastText {
  type: 'text'
  value: string
}
interface MdastParagraph {
  type: 'paragraph'
  children: MdastText[]
  data?: Record<string, unknown>
}
interface MdastBlockquote {
  type: 'blockquote'
  children: MdastParagraph[]
  data?: Record<string, unknown>
}

function visitBlockquotes(node: unknown, callback: (blockquote: MdastBlockquote) => void): void {
  if (!node || typeof node !== 'object') return
  const tree = node as { type?: string; children?: unknown[] }
  if (tree.type === 'blockquote') {
    callback(tree as MdastBlockquote)
    return
  }
  tree.children?.forEach(child => visitBlockquotes(child, callback))
}

/**
 * Convert GitHub-style admonition blockquotes (`> [!NOTE]` etc.) into the
 * same `div.admonition` structure produced by `:::note` container directives.
 */
export function remarkGithubAdmonitions() {
  return (tree: unknown) => {
    visitBlockquotes(tree, node => {
      const firstParagraph = node.children?.find((c: unknown) => (c as MdastParagraph)?.type === 'paragraph') as
        | MdastParagraph
        | undefined
      const firstText = firstParagraph?.children?.find((c: unknown) => (c as MdastText)?.type === 'text') as
        | MdastText
        | undefined
      const match = GITHUB_ADMONITION_RE.exec(firstText?.value ?? '')
      if (!match || !firstText) return

      const type = match[1].toLowerCase()
      if (!KNOWN_TYPES.includes(type)) return

      // Drop the `[!TYPE]` marker line from the content.
      firstText.value = firstText.value.replace(GITHUB_ADMONITION_RE, '')
      if (firstText.value.trim() === '') {
        node.children = node.children.filter((c: unknown) => c !== firstParagraph)
      }

      node.data = {
        hName: 'div',
        hProperties: { className: ['admonition', `admonition-${type}`] },
      }
      node.children = [
        {
          type: 'paragraph',
          data: {
            hName: 'div',
            hProperties: { className: ['admonition-title'] },
          },
          children: [{ type: 'text', value: match[1].toUpperCase() }],
        },
        ...node.children,
      ]
    })
  }
}