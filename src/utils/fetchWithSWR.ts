import axios from 'axios'
import useSWRInfinite from 'swr/infinite'

import type { OdAPIResponse } from '../types'

import { getStoredToken } from './protectedRouteHandler'

interface ApiError {
  status: number
  message: unknown
}

// Common axios fetch function for use with useSWR
export async function fetcher<T = OdAPIResponse>([url, token]: [url: string, token?: string]): Promise<T> {
  try {
    return (
      await (token
        ? axios.get<T>(url, {
            headers: { 'od-protected-token': token },
          })
        : axios.get<T>(url))
    ).data
  } catch (err) {
    const error = err as { response?: { status?: number; data?: unknown } }
    throw { status: error.response?.status ?? 500, message: error.response?.data ?? 'Network error' } satisfies ApiError
  }
}

/**
 * Paging with useSWRInfinite + protected token support
 * @param path Current query directory path
 * @returns useSWRInfinite API
 */
export function useProtectedSWRInfinite(path: string = '') {
  const hashedToken = getStoredToken(path)

  /**
   * Next page infinite loading for useSWR
   * @param pageIdx The index of this paging collection
   * @param prevPageData Previous page information
   * @param path Directory path
   * @returns API to the next page
   */
  function getNextKey(pageIndex: number, previousPageData: OdAPIResponse): (string | null)[] | null {
    // Reached the end of the collection
    if (previousPageData && !previousPageData.folder) return null

    // First page with no prevPageData
    if (pageIndex === 0) return [`/api/?path=${path}`, hashedToken]

    // Add nextPage token to API endpoint
    return [`/api/?path=${path}&next=${previousPageData.next}`, hashedToken]
  }

  // Disable auto-revalidate, these options are equivalent to useSWRImmutable
  // https://swr.vercel.app/docs/revalidation#disable-automatic-revalidations
  const revalidationOptions = {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  }
  return useSWRInfinite<OdAPIResponse>(getNextKey, fetcher, revalidationOptions)
}
