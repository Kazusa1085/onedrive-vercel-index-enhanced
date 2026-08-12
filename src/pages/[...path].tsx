import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

import siteConfig from '../../config/site.config'
const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false })
const FileListing = dynamic(() => import('../components/FileListing'), { ssr: false })
const Footer = dynamic(() => import('../components/Footer'), { ssr: false })
const Breadcrumb = dynamic(() => import('../components/Breadcrumb'), { ssr: false })
const SwitchLayout = dynamic(() => import('../components/SwitchLayout'), { ssr: false })

export default function Folders() {
  const { query } = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>{siteConfig.title}</title>
      </Head>

      <main className="flex w-full flex-1 flex-col">
        <Navbar />
        <div className="mx-auto w-full max-w-5xl p-4">
          <nav className="mb-4 flex items-center justify-between space-x-3 px-4 sm:px-0 sm:pl-1">
            <Breadcrumb query={query} />
            <SwitchLayout />
          </nav>
          <FileListing query={query} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
