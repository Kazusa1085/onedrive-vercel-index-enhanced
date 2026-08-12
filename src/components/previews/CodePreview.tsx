import { FC } from 'react'
import useSystemTheme from 'react-use-system-theme'
import { useRouter } from 'next/router'

import SyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/light-async'
import { tomorrowNightEighties, tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/hljs'

import useFileContent from '../../utils/fetchOnMount'
import { getLanguageByFileName } from '../../utils/getPreviewType'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer, PreviewState } from './Containers'

const CodePreview: FC<{ file: { name: string } }> = ({ file }) => {
  const { asPath } = useRouter()
  const { response: content, error, validating } = useFileContent(`/api/raw/?path=${asPath}`, asPath)

  const theme = useSystemTheme('dark')

  return (
    <PreviewState error={error} validating={validating}>
      <PreviewContainer>
        <SyntaxHighlighter
          language={getLanguageByFileName(file.name)}
          style={theme === 'dark' ? tomorrowNightEighties : tomorrow}
        >
          {content}
        </SyntaxHighlighter>
      </PreviewContainer>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </PreviewState>
  )
}

export default CodePreview