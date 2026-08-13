import { FC, CSSProperties, ReactNode, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components, ExtraProps, Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/light-async'
import { tomorrowNight } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import 'katex/dist/katex.min.css'

import siteConfig from '../../../config/site.config'
import useFileContent from '../../utils/fetchOnMount'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer, PreviewState } from './Containers'
import type { OdFolderChildren } from '../../types'

// The light-async loader table only knows canonical hljs names (e.g.
// 'typescript'), not the short tags used in markdown fences ('ts', 'js'...).
// Map them here; unknown languages simply render without highlighting.
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  sh: 'shell',
  zsh: 'shell',
  yml: 'yaml',
  htm: 'xml',
  md: 'markdown',
  txt: 'plaintext',
  text: 'plaintext',
}

const RAW_HTML_SANITIZE_PLUGINS: NonNullable<Options['rehypePlugins']> = [rehypeRaw, [rehypeSanitize, defaultSchema]]

/**
 * Fenced code block styled like the Kazusa blog's expressive-code blocks:
 * a top bar with the language name and a hover-revealed copy button, line
 * numbers, and wrap-on-long-lines over the hue-tinted dark background.
 */
const CodeBlock: FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } catch {
      // Clipboard unavailable; keep the button inert rather than failing loudly.
    }
  }

  return (
    <div className="code-block group my-4 overflow-hidden rounded-sm border border-(--line-divider)">
      <div className="flex items-center justify-between bg-(--codeblock-topbar-bg) px-4 py-1.5">
        <span className="font-mono text-xs font-medium uppercase tracking-wider text-white/60">{language}</span>
        <button
          type="button"
          aria-label="Copy code"
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-white/70 transition-opacity duration-150 hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-(--primary) md:opacity-0 md:group-hover:opacity-100"
          onClick={copyCode}
        >
          {copied ? <FontAwesomeIcon className="h-3 w-3 text-emerald-400" icon="check" /> : <FontAwesomeIcon className="h-3 w-3" icon="copy" />}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={tomorrowNight}
        showLineNumbers
        wrapLongLines
        customStyle={{
          margin: 0,
          background: 'var(--codeblock-bg)',
          padding: '0.75rem 0',
          fontSize: '0.875rem',
          lineHeight: '1.5rem',
        }}
        lineNumberStyle={{ color: 'rgba(255, 255, 255, 0.25)', minWidth: '2.5em', paddingRight: '1em', userSelect: 'none' }}
        codeTagProps={{ className: 'code-block-content' }}
        PreTag="div"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

const MarkdownPreview: FC<{
  file: OdFolderChildren
  path: string
  standalone?: boolean
}> = ({ file, path, standalone = true }) => {
  // The parent folder of the markdown file, which is also the relative image folder
  const parentPath = standalone ? path.substring(0, path.lastIndexOf('/')) : path

  const { response: content, error, validating } = useFileContent(`/api/raw/?path=${parentPath}/${file.name}`, path)

  // Check if the image is relative path instead of a absolute url
  const isUrlAbsolute = (url: string | string[]) => url.indexOf('://') > 0 || url.indexOf('//') === 0
  // Token for protected-route images (the `raw=true` endpoint only accepts the
  // token via the `odpt` query parameter).
  const imageToken = getStoredToken(parentPath)
  // Build a URL for a relative image path. `parentPath` is already
  // percent-encoded while the markdown `src` is not, so decode the parent
  // first and re-encode every path segment (this keeps spaces, CJK characters,
  // '#' and '&' inside file names intact).
  const buildRelativeImageUrl = (src: string) => {
    const decodedParent = parentPath
      .split('/')
      .map(segment => {
        try {
          return decodeURIComponent(segment)
        } catch {
          return segment
        }
      })
      .join('/')
    const encodedPath = `${decodedParent}/${src}`
      .split('/')
      .map(encodeURIComponent)
      .join('/')
    return `/api/?path=${encodedPath}&raw=true${imageToken ? `&odpt=${imageToken}` : ''}`
  }
  // Custom renderer:
  const customRenderer = {
    // react-markdown wraps fenced code in a <pre>. SyntaxHighlighter supplies
    // the actual code frame, so remove this wrapper to avoid nested backgrounds.
    pre({ children }: { children: ReactNode }) {
      return <>{children}</>
    },
    // img: to render images in markdown with relative file paths
    img: ({
      alt,
      src,
      title,
      width,
      height,
      style,
    }: {
      alt?: string
      src?: string
      title?: string
      width?: string | number
      height?: string | number
      style?: CSSProperties
    }) => {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt}
          src={isUrlAbsolute(src as string) ? src : buildRelativeImageUrl(src as string)}
          title={title}
          width={width}
          height={height}
          style={style}
        />
      )
    },
    // code: to render code blocks with react-syntax-highlighter.
    // Note: react-markdown v10 no longer passes the `inline` prop, so inline
    // code is detected by the absence of a language class and a single-line
    // node position (fenced blocks always carry `language-*` when annotated).
    code({
      className,
      children,
      node,
    }: {
      className?: string | undefined
      children: ReactNode
      node?: ExtraProps['node']
    }) {
      const match = /language-([\w+-]+)/.exec(className || '')
      const inline = !match && (!node?.position || node.position.start.line === node.position.end.line)

      if (inline) {
        return (
          <code className={className}>
            {children}
          </code>
        )
      }

      const rawLanguage = (match ? match[1] : 'text').toLowerCase()
      const language = LANGUAGE_ALIASES[rawLanguage] ?? rawLanguage
      return <CodeBlock language={language} code={String(children).replace(/\n$/, '')} />
    },
  }

  if (error || validating) {
    return (
      <PreviewState error={error ?? ''} validating={validating}>
        {standalone && (
          <DownloadBtnContainer>
            <DownloadButtonGroup />
          </DownloadBtnContainer>
        )}
      </PreviewState>
    )
  }

  return (
    <div>
      <PreviewContainer>
        <div className="markdown-body">
          {/* Using rehypeRaw to render HTML inside Markdown is potentially dangerous.
              Controlled by siteConfig.allowRawHtmlInMarkdown (see config/site.config.js. #18) */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={siteConfig.allowRawHtmlInMarkdown ? [...RAW_HTML_SANITIZE_PLUGINS, rehypeKatex] : [rehypeKatex]}
            components={customRenderer as Components}
          >
            {content}
          </ReactMarkdown>
        </div>
      </PreviewContainer>
      {standalone && (
        <DownloadBtnContainer>
          <DownloadButtonGroup />
        </DownloadBtnContainer>
      )}
    </div>
  )
}

export default MarkdownPreview