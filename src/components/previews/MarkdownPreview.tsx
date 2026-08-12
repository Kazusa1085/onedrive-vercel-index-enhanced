import { FC, CSSProperties, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components, ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/light-async'
import { tomorrowNight } from 'react-syntax-highlighter/dist/cjs/styles/hljs'

import 'katex/dist/katex.min.css'

import siteConfig from '../../../config/site.config'
import useFileContent from '../../utils/fetchOnMount'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer, PreviewState } from './Containers'
import type { OdFolderChildren } from '../../types'

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
      ...props
    }: {
      className?: string | undefined
      children: ReactNode
      node?: ExtraProps['node']
    }) {
      const match = /language-(\w+)/.exec(className || '')
      const inline = !match && (!node?.position || node.position.start.line === node.position.end.line)

      if (inline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        )
      }

      return (
        <SyntaxHighlighter language={match ? match[1] : 'language-text'} style={tomorrowNight} PreTag="div" {...props}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      )
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
            rehypePlugins={[rehypeKatex, ...(siteConfig.allowRawHtmlInMarkdown ? [rehypeRaw] : [])]}
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