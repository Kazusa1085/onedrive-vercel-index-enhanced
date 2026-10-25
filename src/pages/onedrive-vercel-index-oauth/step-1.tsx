import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useClipboard } from 'use-clipboard-copy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import siteConfig from '../../../config/site.config'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export async function getServerSideProps() {
  const { default: apiConfig } = await import('../../../config/api.config')
  // Get accessToken using getAccessToken function
  // (dynamic import keeps server-only deps like ioredis out of the client bundle)
  const { getAccessToken } = await import('../../utils/onedriveApi')
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
  // If the accessToken does not exist, render the page normally
  return {
    props: {
      clientId: apiConfig.clientId,
      redirectUri: apiConfig.redirectUri,
      authApi: apiConfig.authApi,
      driveApi: apiConfig.driveApi,
      scope: apiConfig.scope,
      usingFallbackCredentials: !process.env.CLIENT_ID || !process.env.SECRET_KEY,
    },
  }
}

interface OAuthStep1Props {
  clientId: string
  redirectUri: string
  authApi: string
  driveApi: string
  scope: string
  usingFallbackCredentials: boolean
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  const clipboard = useClipboard({ copiedTimeout: 1200 })

  return (
    <div className="grid gap-1 px-3 py-2.5 sm:grid-cols-[8.5rem_1fr] sm:items-start sm:gap-3">
      <div className="pt-1 text-[11px] font-medium uppercase tracking-wider text-(--content-meta)">{label}</div>
      <div className="flex min-w-0 items-start gap-2">
        <code className="min-w-0 break-all font-mono text-xs leading-5 text-(--content-main)">{value}</code>
        <button
          type="button"
          aria-label={`Copy ${label}`}
          className="btn-plain flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          onClick={() => clipboard.copy(value)}
        >
          <FontAwesomeIcon className="h-3 w-3" icon={clipboard.copied ? 'check' : 'copy'} />
        </button>
      </div>
    </div>
  )
}

export default function OAuthStep1({
  clientId,
  redirectUri,
  authApi,
  driveApi,
  scope,
  usingFallbackCredentials,
}: OAuthStep1Props) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>{`OAuth Step 1 - ${siteConfig.title}`}</title>
      </Head>

      <main className="flex w-full flex-1 flex-col">
        <Navbar />

        <div className="mx-auto w-full max-w-5xl p-4">
          <div className="card-base p-4 text-(--content-main) sm:p-5">
            <div className="mx-auto w-32 sm:w-44">
              <Image src="/images/fabulous-fireworks.png" width={912} height={912} alt="fabulous fireworks" priority />
            </div>

            <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-(--content-meta)">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-(--btn-regular-bg) text-[11px] text-(--btn-regular-content)">
                1
              </span>
              <span>Preparations</span>
              <span className="h-px flex-1 bg-(--line-divider)" />
              <span>Step 1 / 3</span>
            </div>

            <h1 className="text-lg font-semibold sm:text-xl">Set up your OneDrive index</h1>
            <p className="mt-1 text-sm text-(--content-meta)">
              These values come from your deployment environment and{' '}
              <code className="font-mono text-xs">config/api.config.js</code>. Fix anything marked below before
              authorising Microsoft access.
            </p>

            <div className="mt-4 space-y-2">
              {!siteConfig.userPrincipalName && (
                <p
                  role="alert"
                  className="rounded-lg border border-(--danger-border) bg-(--danger-bg) p-2.5 text-sm font-medium text-(--danger-text)"
                >
                  <FontAwesomeIcon icon="exclamation-triangle" className="mr-1.5" />
                  <code className="font-mono text-xs">USER_PRINCIPAL_NAME</code> is not configured. The callback will
                  refuse to store tokens without a verified owner account.
                </p>
              )}

              {usingFallbackCredentials && (
                <p className="rounded-lg border border-(--warning-border) bg-(--warning-bg) p-2.5 text-sm font-medium text-(--warning-text)">
                  <FontAwesomeIcon icon="exclamation-triangle" className="mr-1.5" />
                  Using the public OneManager fallback app. Configure{' '}
                  <code className="font-mono text-xs">CLIENT_ID</code> and{' '}
                  <code className="font-mono text-xs">SECRET_KEY</code> before sharing this site.
                </p>
              )}

              <p className="rounded-lg border border-(--warning-border) bg-(--warning-bg) p-2.5 text-sm font-medium text-(--warning-text)">
                <FontAwesomeIcon icon="exclamation-triangle" className="mr-1.5" />
                Make sure <code className="font-mono text-xs">REDIS_URL</code> is configured; see{' '}
                <a
                  href="https://docs.upstash.com/redis/howto/vercelintegration"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  the Upstash integration guide
                </a>
                .
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-(--line-divider) bg-(--surface-sunken)">
              <ConfigRow label="CLIENT_ID" value={clientId} />
              <ConfigRow label="REDIRECT_URI" value={redirectUri} />
              <ConfigRow label="Auth API URL" value={authApi} />
              <ConfigRow label="Drive API URL" value={driveApi} />
              <ConfigRow label="API Scope" value={scope} />
            </div>

            <p className="mt-3 text-xs text-(--content-meta)">
              No access token or refresh token is present on this instance yet. After these values look correct,
              continue to the Microsoft sign-in step.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Link
                href="/"
                className="btn-plain rounded-lg border border-(--line-divider) px-4 py-2 text-center text-sm font-medium"
              >
                Back home
              </Link>
              <button
                type="button"
                className="btn-regular px-4 py-2.5 text-sm font-medium"
                onClick={() => router.push('/onedrive-vercel-index-oauth/step-2')}
              >
                <span>Proceed to OAuth</span>
                <FontAwesomeIcon icon="arrow-right" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
