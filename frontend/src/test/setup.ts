import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'
import { createElement } from 'react'
import { vi } from 'vitest'

configure({ asyncUtilTimeout: 4000 })

vi.mock('../components/map/AddressMap', () => ({
  AddressMap: ({ addresses, label }: { addresses: Array<{ key: string; publicCode: string }>; label: string }) =>
    createElement('ul', { 'aria-label': label, 'data-testid': 'address-map' },
      addresses.map((a) => createElement('li', { key: a.key }, `marqueur ${a.publicCode}`))),
}))

vi.mock('../components/map/LocationPicker', () => ({
  LocationPicker: ({ onChange }: { onChange: (lat: number, lng: number) => void }) =>
    createElement('button', { type: 'button', onClick: () => onChange(12.5738, -16.265) }, 'Cliquer sur la carte (test)'),
}))

if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:aperçu-test')
  URL.revokeObjectURL = vi.fn()
}
