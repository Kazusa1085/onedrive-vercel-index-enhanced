import { useRouter } from 'next/router'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import useFileContent from '../../utils/fetchOnMount'
import { DownloadBtnContainer, PreviewContainer, PreviewState } from './Containers'

const TextPreview = () => {
  const { asPath } = useRouter()
  const { response: content, error, validating } = useFileContent(`/api/raw/?path=${asPath}`, asPath)

  return (
    <PreviewState error={error} validating={validating} empty={!content}>
      <PreviewContainer>
        <pre className="overflow-x-scroll p-0 text-sm md:p-3">{content}</pre>
      </PreviewContainer>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </PreviewState>
  )
}

export default TextPreview