import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import Image from 'next/image'
import { useRouter } from 'next/router'
import { FC, useState } from 'react'

import { matchProtectedRoute } from '../utils/protectedRouteHandler'
import useLocalStorage from '../utils/useLocalStorage'

const Auth: FC<{ redirect: string }> = ({ redirect }) => {
  const authTokenPath = matchProtectedRoute(redirect)

  const router = useRouter()
  const [token, setToken] = useState('')
  const [, setPersistedToken] = useLocalStorage(authTokenPath, '')

  return (
    <div className="mx-auto flex max-w-sm flex-col space-y-4 md:my-10">
      <div className="mx-auto w-3/4 md:w-5/6">
        <Image src={'/images/fabulous-wapmire-weekdays.png'} alt="authenticate" width={912} height={912} priority />
      </div>
      <div className="text-lg font-bold text-(--content-main)">Enter Password</div>

      <p className="text-sm font-medium text-(--content-meta)">
        This route (the folder itself and the files inside) is password protected. If you know the password, please
        enter it below.
      </p>

      <div className="flex items-center space-x-2">
        <input
          className="flex-1 rounded-lg border border-(--line-divider) bg-(--card-bg-transparent) p-2 font-mono text-(--content-main) backdrop-blur-md focus:outline-hidden focus:ring-3 focus:ring-(--primary)"
          autoFocus
          type="password"
          placeholder="************"
          value={token}
          onChange={e => {
            setToken(e.target.value)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === 'NumpadEnter') {
              setPersistedToken(token)
              router.reload()
            }
          }}
        />
        <button
          className="btn-regular rounded-lg px-4 py-2 focus:outline-hidden focus:ring-3 focus:ring-(--primary)"
          onClick={() => {
            setPersistedToken(token)
            router.reload()
          }}
        >
          <FontAwesomeIcon icon="arrow-right" />
        </button>
      </div>
    </div>
  )
}

export default Auth
