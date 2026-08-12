import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'

import siteConfig from '../../../config/site.config'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export async function getServerSideProps() {
  const { default: apiConfig } = await import('../../../config/api.config')
  // Get accessToken using getAccessToken function
  // (dynamic import keeps server-only deps like ioredis out of the client bundle)
  const { getAccessToken } = await import('../api');
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
      clientId: apiConfig.clientId,
      redirectUri: apiConfig.redirectUri,
      authApi: apiConfig.authApi,
      driveApi: apiConfig.driveApi,
      scope: apiConfig.scope,
    },
  }
}

export default function OAuthStep1({ clientId, redirectUri, authApi, driveApi, scope }) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>{`OAuth Step 1 - ${siteConfig.title}`}</title>
      </Head>

      <main className="flex w-full flex-1 flex-col">
        <Navbar />

        <div className="mx-auto w-full max-w-5xl p-4">
          <div className="card-base p-3 text-(--content-main)">
            <div className="mx-auto w-52">
              <Image src="/images/fabulous-fireworks.png" width={912} height={912} alt="fabulous fireworks" priority />
            </div>
            <h3 className="mb-4 text-center text-xl font-medium">Welcome to your new onedrive-vercel-index 🎉</h3>

            <h3 className="mt-4 mb-2 text-lg font-medium">{'Step 1/3: Preparations'}</h3>

            <p className="py-1 text-sm font-medium text-yellow-400">
                <FontAwesomeIcon icon="exclamation-triangle" className="mr-1" /> If you have not specified a REDIS_URL
                inside your Vercel env variable, go initialise one at{' '}
                <a href="https://upstash.com/" target="_blank" rel="noopener noreferrer" className="underline">
                  Upstash
                </a>
                . Docs:{' '}
                <a
                  href="https://docs.upstash.com/redis/howto/vercelintegration"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Vercel Integration - Upstash
                </a>
                .
            </p>

            <p className="py-1">
                Authorisation is required as no valid{' '}
                <code className="font-mono text-sm underline decoration-pink-600 decoration-wavy">access_token</code> or{' '}
                <code className="font-mono text-sm underline decoration-green-600 decoration-wavy">refresh_token</code>{' '}
                is present on this deployed instance. Check the following configurations before proceeding with
                authorising onedrive-vercel-index with your own Microsoft account.
            </p>

            <div className="my-4 overflow-hidden">
              <table className="min-w-full table-auto">
                <tbody>
                  <tr className="border-y border-(--line-divider)">
                    <td className="py-1 px-3 text-left text-xs font-medium uppercase tracking-wider text-(--content-meta)">
                      CLIENT_ID
                    </td>
                    <td className="whitespace-nowrap py-1 px-3 text-(--content-meta)">
                      <code className="font-mono text-sm">{clientId}</code>
                    </td>
                  </tr>
                  <tr className="border-y border-(--line-divider)">
                    <td className="py-1 px-3 text-left text-xs font-medium uppercase tracking-wider text-(--content-meta)">
                      REDIRECT_URI
                    </td>
                    <td className="whitespace-nowrap py-1 px-3 text-(--content-meta)">
                      <code className="font-mono text-sm">{redirectUri}</code>
                    </td>
                  </tr>
                  <tr className="border-y border-(--line-divider)">
                    <td className="py-1 px-3 text-left text-xs font-medium uppercase tracking-wider text-(--content-meta)">
                      Auth API URL
                    </td>
                    <td className="whitespace-nowrap py-1 px-3 text-(--content-meta)">
                      <code className="font-mono text-sm">{authApi}</code>
                    </td>
                  </tr>
                  <tr className="border-y border-(--line-divider)">
                    <td className="py-1 px-3 text-left text-xs font-medium uppercase tracking-wider text-(--content-meta)">
                      Drive API URL
                    </td>
                    <td className="whitespace-nowrap py-1 px-3 text-(--content-meta)">
                      <code className="font-mono text-sm">{driveApi}</code>
                    </td>
                  </tr>
                  <tr className="border-y border-(--line-divider)">
                    <td className="py-1 px-3 text-left text-xs font-medium uppercase tracking-wider text-(--content-meta)">
                      API Scope
                    </td>
                    <td className="whitespace-nowrap py-1 px-3 text-(--content-meta)">
                      <code className="font-mono text-sm">{scope}</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="py-1 text-sm font-medium">
                <FontAwesomeIcon icon="exclamation-triangle" className="mr-1 text-yellow-400" /> If you see anything
                missing or incorrect, you need to reconfigure{' '}
                <code className="font-mono text-xs">/config/api.config.js</code> and redeploy this instance.
            </p>

            <div className="mb-2 mt-6 text-right">
              <button
                className="btn-regular rounded-lg px-4 py-2.5 text-center text-sm font-medium"
                onClick={() => {
                  router.push('/onedrive-vercel-index-oauth/step-2')
                }}
              >
                <span>{'Proceed to OAuth'}</span> <FontAwesomeIcon icon="arrow-right" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
