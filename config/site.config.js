/**
 * This file contains the configuration used for customising the website, such as the folder to share,
 * the title, used Google fonts, site icons, contact info, etc.
 */
module.exports = {
  // This is what we use to identify who you are when you are initialising the website for the first time.
  // Make sure this is exactly the same as the email address you use to sign into your Microsoft account.
  // You MUST put this in your Vercel's environment variable KEY is 'USER_PRINCIPAL_NAME' and VALUE is 'your Microsoft account'.
  // your email being exposed in public.
  userPrincipalName: process.env.USER_PRINCIPAL_NAME || '',

  // [OPTIONAL] This is the website icon to the left of the title inside the navigation bar.
  // Supports both local paths under /public and remote URLs (rendered via plain <img>).
  icon: 'https://www.raana.icu/images/icon.png',

  // [OPTIONAL] The favicon shown in the browser tab. Supports both local paths under /public
  // and remote URLs.
  favicon: 'https://www.raana.icu/images/icon.png',

  // Prefix for KV Storage
  kvPrefix: process.env.KV_PREFIX || '',

  // The name of your website. Present alongside your icon.
  title: "Kazusa1085's Onedrive",

  // The folder that you are to share publicly with onedrive-vercel-index. Use '/' if you want to share your root folder.
  baseDirectory: process.env.BASE_DIRECTORY || '/',

  // [OPTIONAL] This represents the maximum number of items that one directory lists, pagination supported.
  // Do note that this is limited up to 200 items by the upstream OneDrive API.
  maxItems: 100,

  // [OPTIONAL] We use Google Fonts natively for font customisations.
  // You can check and generate the required links and names at https://fonts.google.com.
  // googleFontSans - the sans serif font used in onedrive-vercel-index.
  googleFontSans: 'Roboto',
  // googleFontMono - the monospace font used in onedrive-vercel-index.
  googleFontMono: 'JetBrains Mono',
  // googleFontLinks -  an array of links for referencing the google font assets.
  googleFontLinks: ['https://fonts.googleapis.com/css2?family=JetBrains+Mono&family=Roboto:wght@400;500;700&display=swap'],

  // [OPTIONAL] Whether to show the search entry (button + Ctrl/Cmd+K shortcut).
  // Disabled because Microsoft Graph search returns no results on this personal
  // OneDrive account. Set to true to re-enable.
  searchEnabled: false,

  // [OPTIONAL] Page background. Set `backgroundImage` to a direct image URL to
  // always use it, or fill `randomBackgrounds` with several image URLs to pick
  // one randomly per visit. Leave both empty to use the built-in Aurora blur
  // background (CSS-only layered parallax, no image requests).
  backgroundImage: '',
  randomBackgrounds: [],

  // [OPTIONAL] The footer component of your website. You can write HTML here, but you need to escape double
  // quotes - changing " to \". You can write anything here, and if you like badges, generate some with https://shields.io
  footer:
    'Powered by <a href="https://github.com/spencerwooo/onedrive-vercel-index" target="_blank" rel="noopener noreferrer">onedrive-vercel-index</a>. Enhanced by <a href="https://github.com/Kazusa1085" target="_blank" rel="noopener noreferrer">🐱 Kazusa1085</a>. Made with ❤ by <a href="https://github.com/postman1year" target="_blank" rel="noopener noreferrer">postman1year</a>.',

  // [OPTIONAL] Whether to render raw HTML tags inside Markdown files (e.g. README.md).
  // Enabled by default for compatibility. Only disable this if you cannot trust every
  // Markdown file inside your shared OneDrive folder (raw HTML may contain scripts that
  // execute on visitors' browsers). To turn it off, change this to false.
  allowRawHtmlInMarkdown: true,

  // [OPTIONAL] This is where you specify the folders that are password protected. It is an array of paths pointing to all
  // the directories in which you have .password set. Check the documentation for details.
  protectedRoutes: [
    '/㊙️ Private',
    '/🎵 Music',
    '/🥁 Taiko/🎶 TJA/🎵 Real TJA'
  ],

  // [OPTIONAL] Use "" here if you want to remove this email address from the nav bar.
  email: 'mailto:kazusa1085@raanna.icu',

  // [OPTIONAL] This is an array of names and links for setting your social information and links.
  // In the latest update, all brand icons inside font awesome is supported and the icon to render is based on the name
  // you provide. See the documentation for details.
  links: [
    {
      name: 'GitHub',
      link: 'https://github.com/Kazusa1085/onedrive-vercel-index-enhanced',
    },
  ],

  // This is a day.js-style datetime format string to format datetimes in the app. Ref to
  // https://day.js.org/docs/en/display/format for detailed specification. The default value is ISO 8601 full datetime
  // without timezone and replacing T with space.
  datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
}
