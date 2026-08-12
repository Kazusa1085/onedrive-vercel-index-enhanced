import config from '../../config/site.config'

const createFooterMarkup = () => {
  return {
    __html: config.footer,
  }
}

const Footer = () => {
  return (
    <div className="w-full pt-6 pb-4">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div
          className="w-full rounded-2xl border border-(--line-divider) bg-(--card-bg-transparent) p-4 text-center text-xs font-medium text-(--content-meta) shadow-(--card-shadow-hover) backdrop-blur-md"
          dangerouslySetInnerHTML={createFooterMarkup()}
        ></div>
      </div>
    </div>
  )
}

export default Footer
