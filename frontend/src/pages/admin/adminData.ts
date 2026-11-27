import type { DirectoryItem, PlaceType } from '../../lib/api'

export interface MonthlyBucket {
  month: string
  total: number
  byType: Record<PlaceType, number>
}

export interface AdminOutletContext {
  openReportsCount: number | null
  refreshPending: () => void
}

export function buildTypeCounts(items: Array<{ placeType: PlaceType }>): Record<PlaceType, number> {
  const counts: Record<PlaceType, number> = { MAISON: 0, COMMERCE: 0, INSTITUTION: 0 }
  for (const item of items) {
    if (item.placeType in counts) counts[item.placeType]++
  }
  return counts
}

export function buildMonthlyBuckets(items: DirectoryItem[], now = new Date()): MonthlyBucket[] {
  const buckets: MonthlyBucket[] = []
  const map = new Map<string, MonthlyBucket>()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const bucket: MonthlyBucket = { month: key, total: 0, byType: { MAISON: 0, COMMERCE: 0, INSTITUTION: 0 } }
    buckets.push(bucket)
    map.set(key, bucket)
  }
  for (const item of items) {
    if (!item.createdAt) continue
    const key = item.createdAt.slice(0, 7)
    const bucket = map.get(key)
    if (bucket) {
      bucket.total++
      if (item.placeType in bucket.byType) bucket.byType[item.placeType]++
    }
  }
  return buckets
}
