import { House, Landmark, Store } from 'lucide-react'
import type { PlaceType } from './api'

export const PLACE_TYPE_ICONS: Record<PlaceType, typeof House> = {
  MAISON: House,
  COMMERCE: Store,
  INSTITUTION: Landmark,
}
