import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import siteConfig from '../../../config/site.config'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { LoadingIcon } from '../../components/Loading'
import { extractAuthCodeFromRedirected, generateAuthorisationUrl } from '../../utils/oAuthHandler'

export async function getServerSideProps() {
  // dynamic import keeps server-only deps like ioredis out of the client bundle
  const { getAccessToken } = await import('../api');
  // Get accessToken using getAccessToken function
  const accessToken = await getAccessToken();
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
    },
  };
}

export default function OAuthStep2() {
  const router = useRouter()

  const [oAuthRedirectedUrl, setOAuthRedirectedUrl] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [buttonLoading, setButtonLoading] = useState(false)

  // const oAuthUrl = generateAuthorisationUrl()

  const [oAuthUrl, setOAuthUrl] = useState<string | null>(null)

  useEffect(() => {
    generateAuthorisationUrl().then(url => setOAuthUrl(url))
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>{`OAuth Step 2 - ${siteConfig.title}`}</title>
      </Head>

      <main className="flex w-full flex-1 flex-col">
        <Navbar />

        <div className="mx-auto w-full max-w-5xl p-4">
          <div className="card-base p-3 text-(--content-main)">
            <div className="mx-auto w-52">
              <Image
                src="/images/fabulous-come-back-later.png"
                width={912}
                height={912}
                alt="fabulous come back later"
                priority
              />
            </div>
            <h3 className="mb-4 text-center text-xl font-medium">Welcome to your new onedrive-vercel-index 🎉</h3>

            <h3 className="mt-4 mb-2 text-lg font-medium">{'Step 2/3: Get authorisation code'}</h3>

            <p className="py-1 text-sm font-medium text-red-400">
                <FontAwesomeIcon icon="exclamation-circle" className="mr-1" /> If you are not the owner of this website,
                stop now, as continuing with this process may expose your personal files in OneDrive.
            </p>

            <div
              className="relative my-2 cursor-pointer rounded-xl border border-(--line-divider) bg-(--btn-plain-bg-hover) font-mono text-sm hover:opacity-80"
              role="button"
              tabIndex={0}
              onClick={() => {
                if (oAuthUrl) {
                  window.open(oAuthUrl)
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (oAuthUrl) {
                    window.open(oAuthUrl)
                  }
                }
              }}
            >
              <div className="absolute top-0 right-0 p-1 opacity-60">
                <FontAwesomeIcon icon="external-link-alt" />
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap p-2">
                <code>{oAuthUrl}</code>
              </pre>
            </div>

            <p className="py-1">
              The OAuth link for getting the authorisation code has been created. Click on the link above to get the{' '}
              <b className="underline decoration-yellow-400 decoration-wavy">authorisation code</b>. Your browser will
              open a new tab to Microsoft&apos;s account login page. After logging in and authenticating with your
              Microsoft account, you will be redirected to a blank page on localhost. Paste{' '}
              <b className="underline decoration-teal-500 decoration-wavy">the entire redirected URL</b> down below.
            </p>

            <div className="my-4 mx-auto w-2/3 overflow-hidden rounded-sm">
              <Image src="/images/step-2-screenshot.png" width={1466} height={607} alt="step 2 screenshot" />
            </div>

            <input
              className={`my-2 w-full flex-1 rounded border bg-(--card-bg-transparent) p-2 font-mono text-sm font-medium text-(--content-main) focus:outline-hidden focus:ring-3 ${
                authCode
                  ? 'border-green-500/50 focus:ring-green-500/30 dark:focus:ring-green-500/40'
                  : 'border-red-500/50 focus:ring-red-500/30 dark:focus:ring-red-500/40'
              }`}
              autoFocus
              type="text"
              placeholder="http://localhost/?code=M.R3_BAY.c0..."
              value={oAuthRedirectedUrl}
              onChange={e => {
                setOAuthRedirectedUrl(e.target.value)
                setAuthCode(extractAuthCodeFromRedirected(e.target.value))
              }}
            />

            <p className="py-1">The authorisation code extracted is:</p>
            <p className="my-2 overflow-hidden truncate rounded-sm border border-(--line-divider) bg-(--btn-plain-bg-hover) p-2 font-mono text-sm opacity-80">
              {authCode ?? <span className="animate-pulse">Waiting for code...</span>}
            </p>

            <p>
              {authCode
                ? '✅ You can now proceed onto the next step: requesting your access token and refresh token.'
                : '❌ No valid code extracted.'}
            </p>

            <div className="mb-2 mt-6 text-right">
              <button
                className="btn-regular rounded-lg px-4 py-2.5 text-center text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                disabled={authCode === ''}
                onClick={() => {
                  setButtonLoading(true)
                  router.push({ pathname: '/onedrive-vercel-index-oauth/step-3', query: { authCode } })
                }}
              >
                {buttonLoading ? (
                  <>
                    <span>Requesting tokens</span> <LoadingIcon className="ml-1 inline h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Get tokens</span> <FontAwesomeIcon icon="arrow-right" />
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
