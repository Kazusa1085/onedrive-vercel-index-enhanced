import type { GetServerSidePropsContext } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import siteConfig from '../../../config/site.config'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export async function getServerSideProps({ query }: GetServerSidePropsContext) {
  const { authCode } = query
  const userPrincipalName = siteConfig.userPrincipalName

  // dynamic imports keep server-only deps like ioredis out of the client bundle
  const [{ getAccessToken }, { storeOdAuthTokens }] = await Promise.all([
    import('../../utils/onedriveApi'),
    import('../../utils/odAuthTokenStore'),
  ])

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

  if (typeof authCode !== 'string' || authCode.length === 0) {
    return {
      props: {
        error: 'No auth code present',
        description: 'Where is the auth code? Did you follow step 2 you silly donut?',
      },
    }
  }

  const { accessTokenBelongsToOwner, requestTokenWithAuthCode } = await import('../../utils/oAuthServer')
  const response = await requestTokenWithAuthCode(authCode)

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

  const { expiryTime, accessToken, refreshToken } = response

  // Verify the authenticated account through Graph. JWT payload decoding alone
  // is not proof of identity because it does not verify a token signature.
  if (!userPrincipalName || !(await accessTokenBelongsToOwner(accessToken, userPrincipalName))) {
    return {
      props: {
        error: 'Identity mismatch',
        description: 'The authenticated Microsoft account does not match USER_PRINCIPAL_NAME.',
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

interface OAuthStep3Props {
  success?: boolean
  error?: string
  description?: string
  errorUri?: string
}

export default function OAuthStep3({ success, error, description, errorUri }: OAuthStep3Props) {
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
          <div className="card-base p-4 text-(--content-main) sm:p-5">
            <div className="mx-auto w-36 sm:w-44">
              <Image
                src="/images/fabulous-celebration.png"
                width={912}
                height={912}
                alt="fabulous celebration"
                priority
              />
            </div>

            <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-(--content-meta)">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-(--btn-regular-bg) text-[11px] text-(--btn-regular-content)">
                3
              </span>
              <span>{error ? 'Connection failed' : 'Finishing up'}</span>
              <span className="h-px flex-1 bg-(--line-divider)" />
              <span>Step 3 / 3</span>
            </div>

            <h1 className="text-lg font-semibold sm:text-xl">
              {error ? 'Could not finish authorisation' : 'Your index is ready'}
            </h1>

            {error ? (
              <div className="mt-4">
                <p
                  role="alert"
                  className="rounded-lg border border-(--danger-border) bg-(--danger-bg) p-2.5 font-medium text-(--danger-text)"
                >
                  <FontAwesomeIcon icon="exclamation-circle" className="mr-2" />
                  <span>Whoops, looks like we got a problem: {error}.</span>
                </p>
                <p className="my-2 whitespace-pre-line rounded-lg border border-(--line-divider) bg-(--surface-sunken) p-2.5 font-mono text-sm text-(--content-meta)">
                  {description}
                </p>
                {errorUri && (
                  <p className="text-sm text-(--content-meta)">
                    Check out{' '}
                    <a
                      href={errorUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-(--primary-text) underline underline-offset-2"
                    >
                      {/* eslint-disable-next-line react/no-unescaped-entities */}
                      Microsoft's official explanation
                    </a>{' '}
                    on the error message.
                  </p>
                )}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      router.push('/onedrive-vercel-index-oauth/step-1')
                    }}
                  >
                    <FontAwesomeIcon icon="arrow-left" /> <span>Restart</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="rounded-lg border border-(--success-border) bg-(--success-bg) p-2.5 font-medium text-(--success-text)">
                  <FontAwesomeIcon icon="check" className="mr-2" />
                  Tokens have been verified and stored securely on the server.
                </p>
                <p className="mt-2 text-sm text-(--content-meta)">Going home...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
