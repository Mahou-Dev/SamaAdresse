import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/authContext'
import { deleteDraft, DRAFTS_CHANGED, listDrafts, syncDrafts, type AddressDraft, type SyncReport } from '../lib/drafts'

/**
 * Brouillons hors ligne du compte connecté. La synchronisation part automatiquement au retour
 * du réseau (événement « online ») et peut être relancée à la main.
 */
export function useDrafts() {
  const { token, user } = useAuth()
  const [drafts, setDrafts] = useState<AddressDraft[]>([])
  const [syncing, setSyncing] = useState(false)
  const [report, setReport] = useState<SyncReport | null>(null)
  const userId = user?.id

  const refresh = useCallback(() => {
    if (!userId) return
    listDrafts(userId).then(setDrafts).catch(() => setDrafts([]))
  }, [userId])

  const sync = useCallback(async () => {
    if (!token || !userId) return
    setSyncing(true)
    try {
      setReport(await syncDrafts(token, userId))
    } finally {
      setSyncing(false)
      refresh()
    }
  }, [token, userId, refresh])

  useEffect(() => {
    refresh()
    window.addEventListener(DRAFTS_CHANGED, refresh)
    return () => window.removeEventListener(DRAFTS_CHANGED, refresh)
  }, [refresh])

  useEffect(() => {
    const onOnline = () => { void sync() }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [sync])

  return { drafts, syncing, report, sync, remove: deleteDraft }
}
