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
  locationType: LocationType;
  createdAt: string;
}

export const createAddress = async (payload: CreateAddressPayload): Promise<AddressResponse> => {
  return customFetch<AddressResponse>('/api/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getPublicAddress = async (code: string): Promise<PublicAddressResponse> => {
  return customFetch<PublicAddressResponse>(`/api/addresses/${code}`);
};

export const getMyAddresses = async (): Promise<AddressResponse[]> => {
  return customFetch<AddressResponse[]>('/api/addresses/mine');
};
