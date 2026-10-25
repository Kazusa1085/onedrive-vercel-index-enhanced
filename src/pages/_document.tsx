import type { CSSProperties } from 'react'

import Document, { Head, Html, Main, NextScript } from 'next/document'
import siteConfig from '../../config/site.config'

const themeHue = Number(siteConfig.themeHue) || 345

// Runs before React hydrates so the correct theme is painted immediately.
const themeInitScript = `
(() => {
  try {
    const stored = window.localStorage.getItem('theme-mode')
    const mode = stored === 'light' || stored === 'dark' ? stored : 'system'
    const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const theme = dark ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  } catch {
    document.documentElement.dataset.theme = 'light'
    document.documentElement.style.colorScheme = 'light'
  }
})()
`

class MyDocument extends Document {
  render() {
    return (
      <Html lang="zh-CN" style={{ '--hue': themeHue } as CSSProperties}>
        <Head>
          <meta name="description" content="OneDrive Vercel Index" />
          <meta name="color-scheme" content="light dark" />
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
          <link rel="icon" href={siteConfig.favicon} />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          {siteConfig.googleFontLinks.map(link => (
            <link key={link} rel="stylesheet" href={link} />
          ))}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
