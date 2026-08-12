import axios from 'axios'
import useSWR from 'swr'
import { getStoredToken } from './protectedRouteHandler'

/**
 * Custom hook for SWR to fetch raw file content
 * @param fetchUrl The URL pointing to the raw file content
 * @param path The path of the file, used for determining whether path is protected
 */
export default function useFileContent(
  fetchUrl: string,
  path: string
): { response: string; error: string; validating: boolean } {
  const hashedToken = getStoredToken(path)
  const url = fetchUrl + (hashedToken ? `&odpt=${hashedToken}` : '')

  const { data, error, isValidating } = useSWR(url, () =>
    axios
      // Using 'blob' as response type to get the response as a raw file blob, which is later parsed as a string.
      // Axios defaults response parsing to JSON, which causes issues when parsing JSON files.
      .get(url, { responseType: 'blob' })
      .then(async res => res.data.text())
  )

  return { response: data, error: error?.message ?? '', validating: isValidating ?? true }
}