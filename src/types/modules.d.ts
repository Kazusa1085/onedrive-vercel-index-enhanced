// Minimal ambient declarations for small third-party packages that do not ship
// TypeScript definitions. Keeping them here avoids weakening the project-wide
// `noImplicitAny` setting for every other module.
declare module 'react-syntax-highlighter/dist/cjs/light-async' {
  import type { ComponentType } from 'react'
  const SyntaxHighlighter: ComponentType<Record<string, unknown>>
  export default SyntaxHighlighter
}

declare module 'react-syntax-highlighter/dist/cjs/styles/hljs' {
  export const tomorrow: Record<string, unknown>
  export const tomorrowNight: Record<string, unknown>
  export const tomorrowNightEighties: Record<string, unknown>
}

declare module 'preview-office-docs' {
  import type { ComponentType } from 'react'
  const Preview: ComponentType<{ url: string; width?: string; height?: string }>
  export default Preview
}
