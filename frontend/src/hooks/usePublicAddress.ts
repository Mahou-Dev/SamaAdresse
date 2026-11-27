import { useEffect, useState } from 'react'
import { ApiError, getPublicAddress, type PublicAddressResult } from '../lib/api'

export type PublicState =
  | { kind: 'loading' }
  | { kind: 'ready'; address: PublicAddressResult }
  | { kind: 'not-found' }
  | { kind: 'gone' }
  | { kind: 'offline' }
  | { kind: 'error' }

export function usePublicAddress(code: string): PublicState {
  const [state, setState] = useState<PublicState>({ kind: 'loading' })
  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })
    getPublicAddress(code)
      .then((address) => { if (!cancelled) setState({ kind: 'ready', address }) })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 410) setState({ kind: 'gone' })
        else if (error instanceof ApiError && (error.status === 404 || error.status === 400)) setState({ kind: 'not-found' })
        else if (error instanceof ApiError && error.status === 0) setState({ kind: 'offline' })
        else setState({ kind: 'error' })
      })
    return () => { cancelled = true }
  }, [code])
  return state
}

export { publicAddressUrl } from '../lib/publicUrl'
