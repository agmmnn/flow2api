export type StorageRecord = Record<string, unknown>

export interface ExtensionStorageArea {
  get(defaults: StorageRecord, callback: (items: StorageRecord) => void): void
  set(items: StorageRecord, callback?: () => void): void
  remove(keys: string | string[], callback?: () => void): void
}

export function readStorage<T extends StorageRecord>(
  area: ExtensionStorageArea,
  defaults: T,
): Promise<T> {
  return new Promise((resolve) => {
    area.get(defaults, (items) => resolve(items as T))
  })
}

export function writeStorage(area: ExtensionStorageArea, values: StorageRecord): Promise<void> {
  return new Promise((resolve) => area.set(values, resolve))
}

export function removeStorage(area: ExtensionStorageArea, keys: string | string[]): Promise<void> {
  return new Promise((resolve) => area.remove(keys, resolve))
}
