import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import Image from 'next/image'
import { useRouter } from 'next/router'
import { FC, useState } from 'react'

import { hashToken, matchProtectedRoute, type StoredHashedToken } from '../utils/protectedRouteHandler'
import useLocalStorage from '../utils/useLocalStorage'

const Auth: FC<{ redirect: string }> = ({ redirect }) => {
  const authTokenPath = matchProtectedRoute(redirect)

  const router = useRouter()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [, setPersistedToken] = useLocalStorage<StoredHashedToken | null>(authTokenPath, null)

  const submit = () => {
    // The server trims .password before hashing, so mirror that behaviour and
    // never store the plaintext password in localStorage.
    const password = token.trim()
    if (!password) {
      setError('Please enter a password.')
      return
    }
    setError('')
    setPersistedToken({ v: 2, hash: hashToken(password) })
    router.reload()
  }

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
          className="flex-1 rounded-lg border border-(--line-divider) bg-(--card-bg-transparent) p-2 font-mono text-(--content-main) backdrop-blur-md focus:outline-hidden focus:ring-3 focus:ring-(--focus-ring)"
          autoFocus
          type="password"
          placeholder="************"
          aria-label="Folder password"
          aria-invalid={error ? 'true' : undefined}
          value={token}
          onChange={e => {
            setToken(e.target.value)
            if (error) setError('')
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === 'NumpadEnter') {
              e.preventDefault()
              submit()
            }
          }}
        />
        <button
          className="btn-regular rounded-lg px-4 py-2 focus:outline-hidden focus:ring-3 focus:ring-(--focus-ring)"
          title="Unlock folder"
          aria-label="Unlock folder"
          onClick={submit}
        >
          <FontAwesomeIcon icon="arrow-right" />
        </button>
      </div>
      {error && <p className="text-sm text-(--danger-text)">{error}</p>}
    </div>
  )
}

export default Auth
