import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/authContext'
import { ApiError } from '../lib/api'
import { errorMessage } from '../lib/errors'

export type Resource<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; data: T }
  | { kind: 'error'; message: string; status: number }

/**
 * Charge une ressource authentifiée ; sur 401, tente un rafraîchissement silencieux via le cookie HttpOnly
 * avant de fermer la session.
 */
export function useApiResource<T>(load: (token: string) => Promise<T>, deps: unknown[]) {
  const { token, logout, refresh } = useAuth()
  const [state, setState] = useState<Resource<T>>({ kind: 'loading' })
  const [version, setVersion] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loader = useCallback(load, deps)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setState({ kind: 'loading' })

    const run = async () => {
      try {
        const data = await loader(token)
        if (!cancelled) setState({ kind: 'ready', data })
      } catch (error: unknown) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          const freshToken = await refresh()
          if (cancelled) return
          if (freshToken) {
            try {
              const retried = await loader(freshToken)
              if (!cancelled) setState({ kind: 'ready', data: retried })
              return
            } catch (retryError: unknown) {
              if (cancelled) return
              if (retryError instanceof ApiError && retryError.status === 401) {
                void logout()
                return
              }
              setState({
                kind: 'error',
                message: errorMessage(retryError),
                status: retryError instanceof ApiError ? retryError.status : -1,
              })
              return
            }
          }
          void logout()
        } else {
          setState({
            kind: 'error',
            message: errorMessage(error),
            status: error instanceof ApiError ? error.status : -1,
          })
        }
      }
    }

    void run()
    return () => { cancelled = true }
  }, [token, loader, logout, refresh, version])

  return { state, reload: () => setVersion((v) => v + 1) }
}
