import { customFetch } from './apiClient';

export type LocationType = 'MAISON' | 'COMMERCE' | 'INSTITUTION';
export type AddressStatus = 'ACTIVE' | 'SIGNALED' | 'ARCHIVED';

export interface CreateAddressPayload {
  latitude: number;
  longitude: number;
  description: string;
  locationType: LocationType;
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

export const getPublicAddress = async (code: string): Promise<PublicAddressResponse> => {
  return customFetch<PublicAddressResponse>(`/api/addresses/${code}`);
};

export const getMyAddresses = async (): Promise<AddressResponse[]> => {
  return customFetch<AddressResponse[]>('/api/addresses/mine');
};
