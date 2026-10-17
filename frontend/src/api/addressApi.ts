import { customFetch, ApiError } from './apiClient';

export type LocationType = 'MAISON' | 'COMMERCE' | 'INSTITUTION';
export type AddressStatus = 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED' | 'SIGNALED';
export type ReportReason =
  | 'POSITION_INCORRECTE'
  | 'CONTENU_INAPPROPRIE'
  | 'PHOTO_INAPPROPRIEE'
  | 'AUTRE';
export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export interface CreateAddressPayload {
  latitude: number;
  longitude: number;
  description: string;
  locationType: LocationType;
  listed?: boolean;
  showOwnerName?: boolean;
}

export interface UpdateAddressPayload {
  description?: string;
  locationType?: LocationType;
  listed?: boolean;
  showOwnerName?: boolean;
}

export interface UpdateVisibilityPayload {
  listed: boolean;
  showOwnerName: boolean;
}

export interface AddressResponse {
  id: string;
  code: string;
  latitude: number;
  longitude: number;
  zone: string;
  quartier: string;
  description: string;
  photoUrl?: string;
  locationType: LocationType;
  status: AddressStatus;
  listed?: boolean;
  showOwnerName?: boolean;
  moderationNotice?: string | null;
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
  };
}

export interface PublicAddressResponse {
  code: string;
  latitude: number;
  longitude: number;
  zone: string;
  quartier: string;
  description: string;
  photoUrl?: string;
  locationType: LocationType;
  createdAt: string;
}

export interface CreateReportPayload {
  reason: ReportReason;
  comment?: string;
}

export interface ReportCreatedResponse {
  status: string;
  message: string;
}

export interface AdminReportResponse {
  id: string;
  reason: ReportReason;
  comment?: string | null;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string | null;
  addressId: string;
  addressCode: string;
  addressZone: string;
  addressQuartier: string;
  addressLocationType: LocationType;
  addressDescription: string;
  addressPhotoUrl?: string | null;
  addressStatus: AddressStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DirectoryItemResponse {
  code: string;
  zone: string;
  quartier: string;
  locationType: LocationType;
  description: string;
  photoUrl?: string;
  createdAt: string;
  ownerName?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  name: string;
}

export interface GeoJsonLineString {
  type: string;
  coordinates: [number, number][]; // [lon, lat]
}

export interface RouteResponse {
  distance: number;
  duration: number;
  profile: 'driving-car' | 'foot-walking';
  geometry: GeoJsonLineString;
  steps: RouteStep[];
}

export const createAddress = async (
  payload: CreateAddressPayload,
  photo?: File
): Promise<AddressResponse> => {
  if (photo) {
    const formData = new FormData();
    formData.append('latitude', payload.latitude.toString());
    formData.append('longitude', payload.longitude.toString());
    formData.append('description', payload.description);
    formData.append('locationType', payload.locationType);
    if (payload.listed !== undefined) {
      formData.append('listed', payload.listed.toString());
    }
    if (payload.showOwnerName !== undefined) {
      formData.append('showOwnerName', payload.showOwnerName.toString());
    }
    formData.append('photo', photo);

    return customFetch<AddressResponse>('/api/addresses', {
      method: 'POST',
      body: formData,
    });
  }

  return customFetch<AddressResponse>('/api/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateAddress = async (
  id: string,
  payload: UpdateAddressPayload
): Promise<AddressResponse> => {
  return customFetch<AddressResponse>(`/api/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const uploadAddressPhoto = async (
  id: string,
  file: File
): Promise<AddressResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  return customFetch<AddressResponse>(`/api/addresses/${id}/photo`, {
    method: 'POST',
    body: formData,
  });
};

export const deleteAddressPhoto = async (id: string): Promise<AddressResponse> => {
  return customFetch<AddressResponse>(`/api/addresses/${id}/photo`, {
    method: 'DELETE',
  });
};

export const archiveAddress = async (id: string): Promise<AddressResponse> => {
  return customFetch<AddressResponse>(`/api/addresses/${id}/archive`, {
    method: 'POST',
  });
};

export const restoreAddress = async (id: string): Promise<AddressResponse> => {
  return customFetch<AddressResponse>(`/api/addresses/${id}/restore`, {
    method: 'POST',
  });
};

export const getPublicAddress = async (code: string): Promise<PublicAddressResponse> => {
  const cacheKey = `/api/addresses/${code}`;
  try {
    const data = await customFetch<PublicAddressResponse>(cacheKey);
    try {
      localStorage.setItem(`cached_date_${code}`, new Date().toLocaleDateString('fr-FR'));
      localStorage.setItem(`cached_addr_${code}`, JSON.stringify(data));
      const visited = JSON.parse(localStorage.getItem('visited_address_codes') || '[]');
      if (!visited.includes(code)) {
        visited.push(code);
        localStorage.setItem('visited_address_codes', JSON.stringify(visited));
      }
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.open('samaadresse-addresses-cache').then((cache) => {
          cache.put(cacheKey, new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
          }));
        });
      }
    } catch {
      // ignore
    }
    return data;
  } catch (err: any) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 410)) {
      try {
        localStorage.removeItem(`cached_date_${code}`);
        localStorage.removeItem(`cached_addr_${code}`);
        const visited = JSON.parse(localStorage.getItem('visited_address_codes') || '[]');
        localStorage.setItem(
          'visited_address_codes',
          JSON.stringify(visited.filter((c: string) => c !== code))
        );
        if (typeof window !== 'undefined' && 'caches' in window) {
          caches.open('samaadresse-addresses-cache').then((cache) => {
            cache.delete(cacheKey);
            cache.delete(window.location.origin + cacheKey);
          });
        }
      } catch {
        // ignore
      }
      throw err;
    }

    // Si erreur réseau (ex: hors ligne), tenter la récupération depuis Cache Storage puis localStorage
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('samaadresse-addresses-cache');
        let match = await cache.match(cacheKey);
        if (!match) {
          match = await cache.match(window.location.origin + cacheKey);
        }
        if (match) {
          return await match.json();
        }
      } catch {
        // ignore
      }
    }

    try {
      const stored = localStorage.getItem(`cached_addr_${code}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    throw err;
  }
};

export const getMyAddresses = async (): Promise<AddressResponse[]> => {
  return customFetch<AddressResponse[]>('/api/addresses/mine');
};

export const createPublicReport = async (
  code: string,
  payload: CreateReportPayload
): Promise<ReportCreatedResponse> => {
  return customFetch<ReportCreatedResponse>(`/api/public/addresses/${encodeURIComponent(code)}/reports`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getAdminReports = async (
  status?: ReportStatus | 'ALL',
  page = 0,
  size = 20
): Promise<PageResponse<AdminReportResponse>> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (status && status !== 'ALL') {
    params.set('status', status);
  }
  return customFetch<PageResponse<AdminReportResponse>>(`/api/admin/reports?${params.toString()}`);
};

export const suspendAddressAdmin = async (
  addressId: string,
  reason: string
): Promise<AddressResponse> => {
  return customFetch<AddressResponse>(`/api/admin/addresses/${addressId}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

export const reinstateAddressAdmin = async (
  addressId: string,
  reason?: string
): Promise<AddressResponse> => {
  return customFetch<AddressResponse>(`/api/admin/addresses/${addressId}/reinstate`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || '' }),
  });
};

export const updateReportStatusAdmin = async (
  reportId: string,
  status: 'RESOLVED' | 'DISMISSED',
  reason?: string
): Promise<AdminReportResponse> => {
  return customFetch<AdminReportResponse>(`/api/admin/reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  });
};

export const updateAddressVisibility = async (
  id: string,
  payload: UpdateVisibilityPayload
): Promise<AddressResponse> => {
  return customFetch<AddressResponse>(`/api/addresses/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const searchDirectory = async (params: {
  q?: string;
  quartier?: string;
  type?: LocationType;
  page?: number;
  size?: number;
}): Promise<PageResponse<DirectoryItemResponse>> => {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.quartier) query.set('quartier', params.quartier);
  if (params.type) query.set('type', params.type);
  if (params.page !== undefined) query.set('page', params.page.toString());
  if (params.size !== undefined) query.set('size', params.size.toString());

  return customFetch<PageResponse<DirectoryItemResponse>>(`/api/public/directory?${query.toString()}`);
};

export const getRoute = async (params: {
  fromLat: number;
  fromLon: number;
  code: string;
  profile?: 'driving-car' | 'foot-walking';
}): Promise<RouteResponse> => {
  const query = new URLSearchParams({
    fromLat: params.fromLat.toString(),
    fromLon: params.fromLon.toString(),
    code: params.code,
  });
  if (params.profile) {
    query.set('profile', params.profile);
  }

  return customFetch<RouteResponse>(`/api/public/route?${query.toString()}`);
};
