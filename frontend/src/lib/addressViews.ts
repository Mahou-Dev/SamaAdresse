import type { MapAddress } from '../components/map/AddressMap'
import type { OwnerAddress } from './api'

export function toMapAddress(address: OwnerAddress): MapAddress {
  return {
    key: address.id,
    publicCode: address.publicCode,
    title: address.title,
    placeType: address.placeType,
    district: address.district,
    latitude: address.latitude,
    longitude: address.longitude,
    status: address.status,
    href: `/mes-adresses/${address.id}`,
  }
}

export function countByStatus(addresses: OwnerAddress[]) {
  return {
    active: addresses.filter((a) => a.status === 'ACTIVE').length,
    signaled: addresses.filter((a) => a.status === 'SIGNALED').length,
    suspended: addresses.filter((a) => a.status === 'SUSPENDED').length,
    archived: addresses.filter((a) => a.status === 'ARCHIVED').length,
    listedOnes: addresses.filter((a) => a.publiclyAccessible && a.listed).length,
    publicOnes: addresses.filter((a) => a.publiclyAccessible).length,
  }
}
