import type { OdFileObject } from '../../types'

import { FC } from 'react'
import { useRouter } from 'next/router'

import { PreviewContainer, DownloadBtnContainer } from './Containers'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { buildRawUrl } from '../../utils/buildRawUrl'

const ImagePreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()

  return (
    <>
      <PreviewContainer>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="mx-auto h-auto max-w-full"
          src={buildRawUrl(asPath)}
          alt={file.name}
          width={file.image?.width}
          height={file.image?.height}
        />
      </PreviewContainer>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </>
  )
}

export default ImagePreview
