import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Proposition d'installation de la PWA (Chrome/Edge/Android) ; null si le navigateur ne la propose pas. */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => typeof window !== 'undefined'
    && window.matchMedia?.('(display-mode: standalone)').matches === true)

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvent(e as BeforeInstallPromptEvent) }
    const onInstalled = () => { setInstalled(true); setEvent(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!event) return
    await event.prompt()
    await event.userChoice
    setEvent(null)
  }

  return { canInstall: event !== null, installed, install }
}
