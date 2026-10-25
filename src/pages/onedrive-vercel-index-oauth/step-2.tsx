import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useClipboard } from 'use-clipboard-copy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import siteConfig from '../../../config/site.config'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { LoadingIcon } from '../../components/Loading'
import { extractAuthCodeFromRedirected } from '../../utils/oAuthClient'

export async function getServerSideProps() {
  // dynamic import keeps server-only deps like ioredis out of the client bundle
  const { getAccessToken } = await import('../../utils/onedriveApi')
  // Get accessToken using getAccessToken function
  const accessToken = await getAccessToken()
  // If the accessToken exists, redirect to the home page
  if (accessToken) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }
  const { generateAuthorisationUrl } = await import('../../utils/oAuthServer')
  const { default: apiConfig } = await import('../../../config/api.config')
  return {
    props: {
      oAuthUrl: generateAuthorisationUrl(),
      redirectUri: apiConfig.redirectUri,
    },
  }
}

export default function OAuthStep2({ oAuthUrl, redirectUri }: { oAuthUrl: string; redirectUri: string }) {
  const router = useRouter()
  const clipboard = useClipboard({ copiedTimeout: 1200 })

  const [oAuthRedirectedUrl, setOAuthRedirectedUrl] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [buttonLoading, setButtonLoading] = useState(false)

  const inputState =
    oAuthRedirectedUrl.length === 0
      ? 'border-(--line-divider)'
      : authCode
        ? 'border-(--success-border)'
        : 'border-(--danger-border)'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>{`OAuth Step 2 - ${siteConfig.title}`}</title>
      </Head>

      <main className="flex w-full flex-1 flex-col">
        <Navbar />

        <div className="mx-auto w-full max-w-5xl p-4">
          <div className="card-base p-4 text-(--content-main) sm:p-5">
            <div className="mx-auto w-36 sm:w-44">
              <Image
                src="/images/fabulous-come-back-later.png"
                width={912}
                height={912}
                alt="fabulous come back later"
                priority
              />
            </div>

            <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-(--content-meta)">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-(--btn-regular-bg) text-[11px] text-(--btn-regular-content)">
                2
              </span>
              <span>Authorise Microsoft</span>
              <span className="h-px flex-1 bg-(--line-divider)" />
              <span>Step 2 / 3</span>
            </div>

            <h1 className="text-lg font-semibold sm:text-xl">Get the authorisation code</h1>
            <p className="mt-1 text-sm text-(--content-meta)">
              Only continue if you are the owner of this site. Signing in for a different account could expose your
              personal OneDrive files.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-regular px-4 py-2.5 text-sm font-medium"
                onClick={() => window.open(oAuthUrl, '_blank', 'noopener,noreferrer')}
              >
                <FontAwesomeIcon icon="external-link-alt" />
                <span>Open Microsoft sign-in</span>
              </button>
              <button
                type="button"
                className="btn-plain rounded-lg border border-(--line-divider) px-4 py-2.5 text-sm font-medium"
                onClick={() => clipboard.copy(oAuthUrl)}
              >
                <FontAwesomeIcon icon="copy" />
                <span>{clipboard.copied ? 'Copied' : 'Copy authorisation URL'}</span>
              </button>
            </div>

            <details className="mt-3 rounded-lg border border-(--line-divider) bg-(--surface-sunken) p-3 text-sm">
              <summary className="cursor-pointer font-medium text-(--content-meta)">Show authorisation URL</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-5 text-(--content-main)">
                {oAuthUrl}
              </pre>
            </details>

            <p className="mt-4 text-sm">
              After signing in, Microsoft redirects to a blank <code className="font-mono text-xs">localhost</code>{' '}
              page. Paste the <strong>entire redirected URL</strong> below.
            </p>

            <details className="my-3 rounded-lg border border-(--line-divider) bg-(--surface-sunken) p-3">
              <summary className="cursor-pointer text-sm font-medium text-(--content-meta)">
                How do I find the redirected URL?
              </summary>
              <div className="mt-3 overflow-hidden rounded-lg bg-(--page-bg)">
                <Image
                  src="/images/step-2-screenshot.png"
                  width={1466}
                  height={607}
                  alt="Example of a localhost redirect containing the authorisation code"
                />
              </div>
            </details>

            <label htmlFor="oauth-redirect-url" className="text-sm font-medium">
              Redirected URL
            </label>
            <input
              id="oauth-redirect-url"
              className={`my-2 w-full rounded-lg border bg-(--surface-sunken) p-2.5 font-mono text-sm text-(--content-main) focus:outline-hidden ${inputState}`}
              type="text"
              placeholder="http://localhost/?code=M.R3_BAY.c0..."
              value={oAuthRedirectedUrl}
              aria-invalid={oAuthRedirectedUrl.length > 0 && !authCode}
              onChange={e => {
                setOAuthRedirectedUrl(e.target.value)
                setAuthCode(extractAuthCodeFromRedirected(e.target.value, redirectUri))
              }}
            />

            <div className="rounded-lg border border-(--line-divider) bg-(--surface-sunken) p-2.5 font-mono text-xs">
              <span className="text-(--content-meta)">Extracted code: </span>
              <span className="break-all text-(--content-main)">
                {authCode || <span className="animate-pulse text-(--content-meta)">Waiting for code…</span>}
              </span>
            </div>

            <p
              className={`mt-2 text-sm font-medium ${authCode ? 'text-(--success-text)' : 'text-(--content-meta)'}`}
              aria-live="polite"
            >
              {authCode ? (
                <>
                  <FontAwesomeIcon icon="check" className="mr-1.5" />
                  Authorisation code extracted. You can continue.
                </>
              ) : (
                'Paste the redirected URL above to extract the code.'
              )}
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-plain rounded-lg border border-(--line-divider) px-4 py-2 text-sm font-medium"
                onClick={() => router.push('/onedrive-vercel-index-oauth/step-1')}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-regular px-4 py-2.5 text-sm font-medium"
                disabled={authCode === '' || buttonLoading}
                onClick={() => {
                  setButtonLoading(true)
                  router.push({ pathname: '/onedrive-vercel-index-oauth/step-3', query: { authCode } })
                }}
              >
                {buttonLoading ? (
                  <>
                    <span>Requesting tokens</span>
                    <LoadingIcon className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Get tokens</span>
                    <FontAwesomeIcon icon="arrow-right" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
