import { useRouter } from 'next/router'

import { DownloadButton } from '../DownloadBtnGtoup'
import useFileContent from '../../utils/fetchOnMount'
import { DownloadBtnContainer, PreviewContainer, PreviewState } from './Containers'

const parseDotUrl = (content: string): string | undefined => {
  return content
    .split('\n')
    .find(line => line.startsWith('URL='))
    ?.split('=')[1]
}

// Only allow http(s) URLs to be opened from .url files, never javascript:/data:/etc.
const getSafeUrl = (content: string | undefined): string | undefined => {
  if (!content) return undefined
  return /^https?:\/\//i.test(content.trim()) ? content.trim() : undefined
}

const URLPreview = () => {
  const { asPath } = useRouter()
  const { response: content, error, validating } = useFileContent(`/api/raw/?path=${asPath}`, asPath)

  return (
    <PreviewState error={error} validating={validating} empty={!content}>
      <PreviewContainer>
        <pre className="overflow-x-scroll p-0 text-sm md:p-3">{content}</pre>
      </PreviewContainer>
      <DownloadBtnContainer>
        <div className="flex justify-center">
          <DownloadButton
            onClickCallback={() => {
              const url = getSafeUrl(parseDotUrl(content))
              if (url) window.open(url)
            }}
            btnColor="blue"
            btnText="Open URL"
            btnIcon="external-link-alt"
            btnTitle={`Open URL ${getSafeUrl(parseDotUrl(content)) || 'Unavailable (non-http URL)'}`}
          />
        </div>
      </DownloadBtnContainer>
    </PreviewState>
  )
}

export default URLPreview