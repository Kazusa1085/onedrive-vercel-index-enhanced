import { ReactNode } from 'react'

import FourOhFour from '../FourOhFour'
import Loading from '../Loading'

export function PreviewContainer({ children }): ReactNode {
  return (
    <div className="card-base p-3 text-(--content-main) transition-all duration-300 ease-in-out hover:shadow-(--card-shadow-hover)">
      {children}
    </div>
  )
}

export function DownloadBtnContainer({ children }): ReactNode {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 rounded-sm border-t border-(--line-divider) bg-(--card-bg-transparent) p-2 shadow-(--card-shadow) backdrop-blur-md">
      {children}
    </div>
  )
}

/**
 * Shared loading/error/empty scaffolding for file previews.
 * Renders a PreviewContainer with the matching state, or children on success.
 */
export function PreviewState({
  error,
  validating,
  empty,
  children,
}: {
  error: string
  validating: boolean
  empty?: boolean
  children: ReactNode
}): ReactNode {
  if (error) {
    return (
      <PreviewContainer>
        <FourOhFour errorMsg={error} />
      </PreviewContainer>
    )
  }
  if (validating) {
    return (
      <PreviewContainer>
        <Loading loadingText={'Loading file content...'} />
      </PreviewContainer>
    )
  }
  if (empty) {
    return (
      <PreviewContainer>
        <FourOhFour errorMsg={'File is empty.'} />
      </PreviewContainer>
    )
  }
  return <div>{children}</div>
}
