import type { DirectoryItemResponse } from '../../api/addressApi';

export type DirectoryViewMode = 'grid' | 'list' | 'map';

export interface ResolvedCoordinates {
  latitude: number;
  longitude: number;
}

export interface MappedDirectoryItem {
  item: DirectoryItemResponse;
  latitude: number;
  longitude: number;
}

export function parseDirectoryView(raw: string | null): DirectoryViewMode {
  if (raw === 'list' || raw === 'map') {
    return raw;
  }
  return 'grid';
}
