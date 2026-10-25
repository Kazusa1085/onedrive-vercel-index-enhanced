import { MouseEventHandler, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import toast from 'react-hot-toast'
import { useClipboard } from 'use-clipboard-copy'

import Image from 'next/image'
import { useRouter } from 'next/router'

import { buildRawUrl } from '../utils/buildRawUrl'
import CustomEmbedLinkMenu from './CustomEmbedLinkMenu'

export type DownloadButtonVariant = 'primary' | 'plain'

const variantClass: Record<DownloadButtonVariant, string> = {
  primary: 'btn-regular text-sm font-medium',
  plain:
    'btn-plain inline-flex items-center justify-center gap-2 rounded-lg border border-(--glass-border) bg-(--surface-raised) px-4 py-2 text-sm font-medium text-(--content-main) hover:bg-(--btn-plain-bg-hover)',
}

export const DownloadButton = ({
  onClickCallback,
  btnText,
  btnIcon,
  btnImage,
  btnTitle,
  variant = 'plain',
}: {
  onClickCallback: MouseEventHandler<HTMLButtonElement>
  btnText: string
  btnIcon?: IconProp
  btnImage?: string
  btnTitle?: string
  variant?: DownloadButtonVariant
}) => {
  return (
    <button type="button" className={variantClass[variant]} title={btnTitle} onClick={onClickCallback}>
      {btnIcon && <FontAwesomeIcon icon={btnIcon} />}
      {btnImage && <Image src={btnImage} alt={btnText} width={20} height={20} priority />}
      <span>{btnText}</span>
    </button>
  )
}

const DownloadButtonGroup = () => {
  const { asPath } = useRouter()

  const clipboard = useClipboard()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <CustomEmbedLinkMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} path={asPath} />
      <div className="flex flex-wrap justify-center gap-2">
        <DownloadButton
          onClickCallback={() => window.open(buildRawUrl(asPath))}
          btnText="Download"
          btnIcon="file-download"
          btnTitle="Download the file directly through OneDrive"
          variant="primary"
        />
        <DownloadButton
          onClickCallback={() => {
            clipboard.copy(buildRawUrl(asPath))
            toast.success('Copied direct link to clipboard.')
          }}
          btnText="Copy direct link"
          btnIcon="copy"
          btnTitle="Copy the permalink to the file to the clipboard"
        />
        <DownloadButton onClickCallback={() => setMenuOpen(true)} btnText={'Customise link'} btnIcon="pen" />
      </div>
    </>
  )
}

export default DownloadButtonGroup
