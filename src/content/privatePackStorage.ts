import type { StoredPrivatePack } from '../types/privateContent'
import { parseAndValidatePrivatePack, validatePrivatePack } from './privatePackSchema'

const DATABASE_NAME = 'dnd-character-forge.private-content'
const DATABASE_VERSION = 1
const STORE_NAME = 'manual-packs'
const ACTIVE_PACK_KEY = 'phb-2024'

export interface PrivatePackStore {
  get(): Promise<StoredPrivatePack | null>
  put(value: StoredPrivatePack): Promise<void>
  remove(): Promise<void>
}

export class IndexedDbPrivatePackStore implements PrivatePackStore {
  async get(): Promise<StoredPrivatePack | null> {
    const database = await openDatabase()
    return requestResult<StoredPrivatePack | undefined>(database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(ACTIVE_PACK_KEY))
      .then((value) => value ?? null)
      .finally(() => database.close())
  }

  async put(value: StoredPrivatePack): Promise<void> {
    const database = await openDatabase()
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(value, ACTIVE_PACK_KEY)
      await transactionDone(transaction)
    } finally {
      database.close()
    }
  }

  async remove(): Promise<void> {
    const database = await openDatabase()
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(ACTIVE_PACK_KEY)
      await transactionDone(transaction)
    } finally {
      database.close()
    }
  }
}

export async function importPrivatePack(json: string, store: PrivatePackStore = new IndexedDbPrivatePackStore()): Promise<StoredPrivatePack> {
  const { pack, validation } = parseAndValidatePrivatePack(json)
  if (!pack || !validation.valid) throw new PrivatePackValidationError(validation.issues.map((issue) => issue.message))
  const stored = { pack, validation, importedAt: new Date().toISOString() }
  await store.put(stored)
  return stored
}

export async function checkStoredPackIntegrity(store: PrivatePackStore = new IndexedDbPrivatePackStore()): Promise<StoredPrivatePack | null> {
  const stored = await store.get()
  if (!stored) return null
  return { ...stored, validation: validatePrivatePack(stored.pack) }
}

export function exportPrivatePackConfiguration(stored: StoredPrivatePack): string {
  return JSON.stringify({
    format: stored.pack.format,
    schemaVersion: stored.pack.schemaVersion,
    packId: stored.pack.packId,
    title: stored.pack.title,
    importedAt: stored.importedAt,
    itemCounts: stored.validation.counts,
  }, null, 2)
}

export class PrivatePackValidationError extends Error {
  constructor(public readonly validationMessages: string[]) {
    super(validationMessages[0] ?? 'Il pacchetto privato non è valido.')
    this.name = 'PrivatePackValidationError'
  }
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB non è disponibile in questo browser.'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Non è stato possibile aprire l’archivio privato.'))
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Operazione IndexedDB non riuscita.'))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(new Error('Scrittura IndexedDB non riuscita.'))
    transaction.onabort = () => reject(new Error('Scrittura IndexedDB annullata.'))
  })
}
