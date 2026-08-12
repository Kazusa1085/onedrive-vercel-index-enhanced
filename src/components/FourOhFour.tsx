import Image from 'next/image'

const FourOhFour: React.FC<{
  title: string
  message?: string
  details?: string
  onRetry?: () => void
}> = ({ title, message, details, onRetry }) => {
  return (
    <div className="my-12">
      <div className="mx-auto w-1/3">
        <Image src="/images/fabulous-rip-2.png" alt="error" width={912} height={912} priority />
      </div>
      <div className="mx-auto mt-6 max-w-xl text-(--content-meta)">
        <div className="mb-2 text-center text-xl font-bold text-(--content-main)">{title}</div>
        {message && <div className="mb-4 text-center text-sm">{message}</div>}

        {details && (
          <details className="mb-4 text-center">
            <summary className="cursor-pointer text-xs opacity-60 hover:opacity-90">Technical details</summary>
            <div className="mt-2 overflow-hidden break-all rounded-sm border border-(--line-divider) bg-(--btn-plain-bg-hover) p-2 text-left font-mono text-xs">
              {details}
            </div>
          </details>
        )}

        <div className="flex items-center justify-center gap-3 text-sm">
          {onRetry && (
            <button className="btn-regular rounded-lg px-4 py-2 text-sm font-medium" onClick={onRetry}>
              Retry
            </button>
          )}
          <span>
            Need help? Check the{' '}
            <a
              className="text-(--primary) hover:underline"
              href="https://github.com/Kazusa1085/onedrive-vercel-index-enhanced/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              issues
            </a>
            .
          </span>
        </div>
      </div>
    </div>
  )
}

export default FourOhFour
