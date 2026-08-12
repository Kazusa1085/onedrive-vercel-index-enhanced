import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import apiConfig from '../../../config/api.config'
import siteConfig from '../../../config/site.config'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

import { getUserPrincipalNameFromToken, requestTokenWithAuthCode } from '../../utils/oAuthHandler'

export async function getServerSideProps({ query }) {
  const { authCode } = query
  const clientId = apiConfig.clientId
  const clientSecret = apiConfig.obfuscatedClientSecret
  const userPrincipalName = siteConfig.userPrincipalName

  // dynamic imports keep server-only deps like ioredis out of the client bundle
  const [{ getAccessToken }, { storeOdAuthTokens }] = await Promise.all([import('../api'), import('../../utils/odAuthTokenStore')])

  // Check if OAuth authentication has been completed
  const existingAccessToken = await getAccessToken()
  if (existingAccessToken) {
    // If OAuth authentication has been completed, redirect to the homepage
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  if (!authCode) {
    return {
      props: {
        error: 'No auth code present',
        description: 'Where is the auth code? Did you follow step 2 you silly donut?',
      },
    }
  }

  const config = { clientId, clientSecret, userPrincipalName }
  const response = await requestTokenWithAuthCode(authCode, config)

  // If error response, return invalid
  if ('error' in response) {
    return {
      props: {
        error: response.error,
        description: response.errorDescription,
        errorUri: response.errorUri,
      },
    }
  }

  const { expiryTime, accessToken, refreshToken, idToken } = response

  // Verify identity of the authenticated user server-side via the identity claims
  // embedded in the Microsoft-signed JWTs. Access tokens and refresh tokens must
  // never leave the server: only verified tokens are stored.
  const tokenUpn = getUserPrincipalNameFromToken(idToken, accessToken)
  if (!tokenUpn || tokenUpn.toLowerCase() !== userPrincipalName.toLowerCase()) {
    return {
      props: {
        error: 'Identity mismatch',
        description: `Do not pretend to be the site owner. Expected ${userPrincipalName}, got ${tokenUpn ?? 'unavailable'}.`,
      },
    }
  }

  // Store tokens securely on the server, then redirect home
  try {
    await storeOdAuthTokens({
      accessToken,
      accessTokenExpiry: Number.parseInt(expiryTime),
      refreshToken,
    })
  } catch (error) {
    const err = error as { message?: string } | null
    return {
      props: {
        error: 'Failed to store tokens',
        description: err?.message ?? 'The token store (Redis) could not be reached. Please try again.',
      },
    }
  }

  return {
    props: {
      success: true,
    },
  }
}

export default function OAuthStep3({ success, error, description, errorUri }) {
  const router = useRouter()

  useEffect(() => {
    if (success) {
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }, [success, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>{`OAuth Step 3 - ${siteConfig.title}`}</title>
      </Head>

      <main className="flex w-full flex-1 flex-col">
        <Navbar />

        <div className="mx-auto w-full max-w-5xl p-4">
          <div className="card-base p-3 text-(--content-main)">
            <div className="mx-auto w-52">
              <Image
                src="/images/fabulous-celebration.png"
                width={912}
                height={912}
                alt="fabulous celebration"
                priority
              />
            </div>
            <h3 className="mb-4 text-center text-xl font-medium">Welcome to your new onedrive-vercel-index 🎉</h3>

            <h3 className="mt-4 mb-2 text-lg font-medium">Step 3/3: Get access and refresh tokens</h3>
            {error ? (
              <div>
                <p className="py-1 font-medium text-red-500">
                  <FontAwesomeIcon icon="exclamation-circle" className="mr-2" />
                  <span>Whoops, looks like we got a problem: {error}.</span>
                </p>
                <p className="my-2 whitespace-pre-line rounded-sm border border-(--line-divider) bg-(--btn-plain-bg-hover) p-2 font-mono text-sm opacity-80">
                  {description}
                </p>
                {errorUri && (
                  <p>
                    Check out{' '}
                    <a
                      href={errorUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-(--primary) hover:underline"
                    >
                      {/* eslint-disable-next-line react/no-unescaped-entities */}
                      Microsoft's official explanation
                    </a>{' '}
                    on the error message.
                  </p>
                )}
                <div className="mb-2 mt-6 text-right">
                  <button
                    className="rounded-lg bg-red-500 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-red-400 focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:grayscale dark:focus:ring-red-800"
                    onClick={() => {
                      router.push('/onedrive-vercel-index-oauth/step-1')
                    }}
                  >
                    <FontAwesomeIcon icon="arrow-left" /> <span>Restart</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="py-1 font-medium text-teal-500">
                  <FontAwesomeIcon icon="exclamation-circle" className="mr-2" />
                  Tokens have been verified and stored securely on the server.
                </p>
                <p className="py-1">Going home...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}