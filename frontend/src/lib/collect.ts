import type { Page } from './api'

/** Limite de sécurité : au-delà, les écrans indiquent que la liste est tronquée. */
export const MAX_PAGES = 10
export const PAGE_SIZE = 50

export interface Collected<T> {
  items: T[]
  total: number
  truncated: boolean
}

/** Parcourt les pages d'une liste paginée (50 éléments par page, 10 pages au maximum). */
export async function collectPages<T>(fetchPage: (page: number) => Promise<Page<T>>): Promise<Collected<T>> {
  const first = await fetchPage(0)
  const items = [...first.items]
  const pages = Math.min(first.totalPages, MAX_PAGES)
  for (let page = 1; page < pages; page++) {
    items.push(...(await fetchPage(page)).items)
  }
  return { items, total: first.totalElements, truncated: first.totalPages > MAX_PAGES }
}
