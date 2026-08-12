import '@fortawesome/fontawesome-svg-core/styles.css'

import '../styles/globals.css'
import '../styles/markdown-github.css'

// Require had to be used to prevent SSR failure in Next.js
// Related discussion: https://github.com/FortAwesome/Font-Awesome/issues/19348
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { library, config } = require('@fortawesome/fontawesome-svg-core')
config.autoAddCss = false

import {
  faFileImage,
  faFilePdf,
  faFileWord,
  faFilePowerpoint,
  faFileExcel,
  faFileAudio,
  faFileVideo,
  faFileArchive,
  faFileCode,
  faFileAlt,
  faFile,
  faFolder,
  faCopy,
  faArrowAltCircleDown,
  faTrashAlt,
  faEnvelope,
  faFlag,
} from '@fortawesome/free-regular-svg-icons'
import {
  faSearch,
  faPen,
  faCheck,
  faCopy as faCopySolid,
  faAngleRight,
  faMusic,
  faArrowLeft,
  faArrowRight,
  faFileDownload,
  faBook,
  faKey,
  faSignOutAlt,
  faChevronCircleDown,
  faChevronDown,
  faLink,
  faExternalLinkAlt,
  faExclamationCircle,
  faExclamationTriangle,
  faTh,
  faThList,
} from '@fortawesome/free-solid-svg-icons'
import * as Icons from '@fortawesome/free-brands-svg-icons'

import type { AppProps } from 'next/app'
import NextNProgress from 'nextjs-progressbar'
import Background from '../components/Background'

// import all brand icons with tree-shaking so all icons can be referenced in the app
const iconList = Object.keys(Icons)
  .filter(k => k !== 'fab' && k !== 'prefix')
  .map(icon => Icons[icon])

library.add(
  faFileImage,
  faFilePdf,
  faFileWord,
  faFilePowerpoint,
  faFileExcel,
  faFileAudio,
  faFileVideo,
  faFileArchive,
  faFileCode,
  faFileAlt,
  faFile,
  faFlag,
  faFolder,
  faMusic,
  faArrowLeft,
  faArrowRight,
  faAngleRight,
  faFileDownload,
  faCopy,
  faCopySolid,
  faLink,
  faBook,
  faArrowAltCircleDown,
  faKey,
  faTrashAlt,
  faSignOutAlt,
  faEnvelope,
  faChevronCircleDown,
  faExternalLinkAlt,
  faExclamationCircle,
  faExclamationTriangle,
  faCheck,
  faSearch,
  faChevronDown,
  faTh,
  faThList,
  faPen,
  ...iconList
)

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Background />
      <NextNProgress height={1} color="rgb(156, 163, 175, 0.9)" options={{ showSpinner: false }} />
      <Component {...pageProps} />
    </>
  )
}
export default MyApp
