import type { OdFileObject } from '../../types'
import { FC } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { getFileIcon } from '../../utils/getFileIcon'
import { formatModifiedDateTime, humanFileSize } from '../../utils/fileDetails'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer } from './Containers'

const labelClass = 'py-2 text-xs font-medium uppercase tracking-wider text-(--content-meta)'

const DefaultPreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const hashEntries: Array<[string, string | undefined]> = [
    ['Quick XOR', file.file?.hashes?.quickXorHash],
    ['SHA1', file.file?.hashes?.sha1Hash],
    ['SHA256', file.file?.hashes?.sha256Hash],
    ['CRC32', file.file?.hashes?.crc32Hash],
  ]
  // Microsoft Graph only returns the hashes a drive can provide. Do not render
  // rows for hash types it omitted (SHA256 is explicitly unsupported by Graph).
  const hashes = hashEntries.filter((entry): entry is [string, string] => Boolean(entry[1]))

  return (
    <div>
      <PreviewContainer>
        <div className="items-center px-5 py-4 md:flex md:space-x-8">
          <div className="rounded-xl border border-(--glass-border) bg-(--surface-sunken) px-8 py-20 text-center">
            <FontAwesomeIcon icon={getFileIcon(file.name, { video: Boolean(file.video) })} />
            <div className="mt-6 text-sm font-medium line-clamp-3 md:w-28">{file.name}</div>
          </div>

          <div className="flex flex-1 flex-col space-y-2 py-4">
            <div>
              <div className={labelClass}>{'Last modified'}</div>
              <div>{formatModifiedDateTime(file.lastModifiedDateTime)}</div>
            </div>

            <div>
              <div className={labelClass}>{'File size'}</div>
              <div>{humanFileSize(file.size)}</div>
            </div>

            <div>
              <div className={labelClass}>{'MIME type'}</div>
              <div className="break-all">{file.file?.mimeType ?? 'Unavailable'}</div>
            </div>

            {hashes.length > 0 && (
              <div>
                <div className={labelClass}>{'Hashes'}</div>
                <div className="overflow-x-auto rounded-lg border border-(--line-divider)">
                  <table className="w-full text-sm">
                    <tbody>
                      {hashes.map(([label, hash]) => (
                        <tr key={label} className="border-b border-(--line-divider) last:border-b-0">
                          <th className="whitespace-nowrap bg-(--surface-sunken) px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-(--content-meta)">
                            {label}
                          </th>
                          <td className="break-all px-3 py-2 font-mono text-xs text-(--content-main)">{hash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </PreviewContainer>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </div>
  )
}

export default DefaultPreview
