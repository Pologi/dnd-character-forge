import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { StoredPrivatePack } from '../types/privateContent'
import { ContentRegistry } from './contentRegistry'
import {
  IndexedDbPrivatePackStore,
  PrivatePackValidationError,
  checkStoredPackIntegrity,
  importPrivatePack,
} from './privatePackStorage'

interface ContentRegistryContextValue {
  registry: ContentRegistry
  storedPack: StoredPrivatePack | null
  hasArchivedPack: boolean
  loading: boolean
  message: string
  importPack: (json: string) => Promise<void>
  checkIntegrity: () => Promise<void>
  removePack: () => Promise<void>
}

const emptyValue: ContentRegistryContextValue = {
  registry: new ContentRegistry(),
  storedPack: null,
  hasArchivedPack: false,
  loading: false,
  message: '',
  importPack: async () => undefined,
  checkIntegrity: async () => undefined,
  removePack: async () => undefined,
}

const RegistryContext = createContext<ContentRegistryContextValue>(emptyValue)

export function ContentRegistryProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => new IndexedDbPrivatePackStore(), [])
  const [storedPack, setStoredPack] = useState<StoredPrivatePack | null>(null)
  const [hasArchivedPack, setHasArchivedPack] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const stored = await checkStoredPackIntegrity(store)
      setHasArchivedPack(Boolean(stored))
      setStoredPack(stored?.validation.valid ? stored : null)
      setMessage(stored && !stored.validation.valid
        ? 'Il pacchetto archiviato non supera il controllo di integrità ed è stato disattivato.'
        : '')
    } catch {
      setStoredPack(null)
      setHasArchivedPack(false)
      setMessage('Non è stato possibile leggere l’archivio privato del browser.')
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => {
    void load()
  }, [load])

  const importPack = useCallback(async (json: string) => {
    try {
      const stored = await importPrivatePack(json, store)
      setStoredPack(stored)
      setHasArchivedPack(true)
      setMessage('Pacchetto importato e verificato. Il precedente pacchetto, se presente, è stato sostituito.')
    } catch (error) {
      setMessage(error instanceof PrivatePackValidationError
        ? `Pacchetto rifiutato: ${error.validationMessages.join(' ')}`
        : 'Importazione non riuscita. Nessun contenuto è stato salvato.')
      throw error
    }
  }, [store])

  const removePack = useCallback(async () => {
    await store.remove()
    setStoredPack(null)
    setHasArchivedPack(false)
    setMessage('Pacchetto privato rimosso completamente da questo browser.')
  }, [store])

  const value = useMemo<ContentRegistryContextValue>(() => ({
    registry: new ContentRegistry(storedPack),
    storedPack,
    hasArchivedPack,
    loading,
    message,
    importPack,
    checkIntegrity: load,
    removePack,
  }), [storedPack, hasArchivedPack, loading, message, importPack, load, removePack])

  return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>
}

export function useContentRegistry(): ContentRegistryContextValue {
  return useContext(RegistryContext)
}
