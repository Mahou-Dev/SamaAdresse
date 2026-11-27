import { getQuartierName, getZoneName } from './geoGrid'

export type PlaceType = 'MAISON' | 'COMMERCE' | 'INSTITUTION'
export type AddressStatus = 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED' | 'SIGNALED'

export interface PublicAddress {
  publicCode: string
  title: string
  placeType: PlaceType
  zone: string
  quartier: string
  district: string
  city: string
  description: string | null
  latitude: number
  longitude: number
  photoUrl: string | null
  /** Nom du propriétaire, seulement s'il a accepté de figurer dans l'annuaire. */
  ownerName: string | null
  createdAt?: string | null
}

export interface DirectoryItem {
  publicCode: string
  title: string
  placeType: PlaceType
  zone: string
  quartier: string
  district: string
  city: string
  description: string | null
  photoUrl: string | null
  latitude?: number | null
  longitude?: number | null
  ownerName: string | null
  createdAt: string
}

export interface User {
  id: string
  email: string
  displayName: string
  phoneNumber: string | null
  role: 'PROPRIETAIRE' | 'ADMIN'
  enabled: boolean
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  expiresAt: string
  user: User
}

/** Adresse telle que la voit son propriétaire (GET /api/addresses/mine). */
export interface OwnerAddress {
  id: string
  publicCode: string
  title: string
  placeType: PlaceType
  zone: string
  quartier: string
  district: string
  city: string
  description: string | null
  latitude: number
  longitude: number
  status: AddressStatus
  listed: boolean
  publicationConsent: boolean
  publiclyAccessible: boolean
  createdAt: string
  updatedAt: string | null
  moderatedAt: string | null
  photoUrl: string | null
  hasPhoto: boolean
  ownerNamePublic: boolean
  moderationNotice: string | null
  codeChanged?: boolean
  previousCode?: string | null
}

export interface Page<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** Le code public, le statut et le propriétaire ne sont jamais envoyés : le serveur les attribue. */
export interface NewAddressInput {
  title: string
  placeType: PlaceType
  description: string | null
  latitude: number
  longitude: number
  listed: boolean
  ownerNamePublic?: boolean
  clientRequestId?: string
  reservedCode?: string
}

export type FieldErrors = Record<string, string>

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/**
 * Base URL de l'API.
 * Par défaut vide ('') : même origine que le frontend (en production sur Render et en dev via le proxy Vite -> :8082).
 * Peut être surchargée explicitement via VITE_API_BASE_URL.
 */
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

/** En-tête ajouté par le Service Worker quand la fiche vient du cache (pas du réseau). */
export const OFFLINE_HEADER = 'X-SamaAdresse-Offline'

export interface PublicAddressResult extends PublicAddress {
  /** Date de la copie hors ligne affichée, si la fiche vient du cache du Service Worker. */
  offlineCopyAt?: string
}

/* ---------- Types bruts du backend Spring Boot ---------- */

interface BackendUserProfile {
  id: string
  fullName: string
  email: string
  phoneNumber?: string | null
  role: 'PROPRIETAIRE' | 'ADMIN'
  enabled?: boolean
  createdAt: string
}

interface BackendAuthResponse {
  accessToken: string
  tokenType?: 'Bearer'
  expiresIn?: number
  user: BackendUserProfile
}

interface BackendPublicAddress {
  code: string
  latitude: number
  longitude: number
  zone: string
  quartier: string
  description: string | null
  locationType: PlaceType
  photoUrl: string | null
  ownerName?: string | null
  createdAt?: string | null
}

interface BackendDirectoryItem {
  code: string
  zone: string
  quartier: string
  locationType: PlaceType
  description: string | null
  photoUrl: string | null
  createdAt: string
  latitude?: number | null
  longitude?: number | null
  ownerName: string | null
}

interface BackendAddressResponse {
  id: string
  code: string
  latitude: number
  longitude: number
  zone: string
  quartier: string
  description: string | null
  photoUrl: string | null
  locationType: PlaceType
  status: AddressStatus
  listed: boolean | null
  showOwnerName: boolean | null
  moderationNotice?: string | null
  createdAt: string
  codeChanged?: boolean
  previousCode?: string | null
}

interface SpringPage<T> {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
}

interface BackendRouteResponse {
  distance: number
  duration: number
  approximateFallback?: boolean
  geometry?: {
    type?: string
    coordinates?: Array<[number, number]>
  }
  steps?: Array<{
    instruction: string
    distance: number
    duration: number
  }>
}

interface BackendAdminReport {
  id: string
  reason: ReportReason
  comment: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
  addressId: string
  addressCode: string
  addressZone: string
  addressQuartier: string
  addressLocationType: PlaceType
  addressDescription: string | null
  addressPhotoUrl: string | null
  addressStatus: AddressStatus
}

/* ---------- Utilitaires de mapping ---------- */

export function composeAddressDescription(title: string, details: string | null | undefined): string {
  const cleanTitle = title.trim()
  const cleanDetails = details?.trim() ?? ''
  if (!cleanDetails) return cleanTitle
  if (!cleanTitle) return cleanDetails
  return `${cleanTitle} — ${cleanDetails}`
}

export function splitAddressDescription(raw: string | null | undefined): { title: string; details: string | null } {
  const clean = (raw ?? '').trim()
  if (!clean) return { title: 'Adresse géolocalisée', details: null }
  const sep = ' — '
  const idx = clean.indexOf(sep)
  if (idx > 0 && idx < 160) {
    const title = clean.slice(0, idx).trim()
    const details = clean.slice(idx + sep.length).trim()
    return { title, details: details || null }
  }
  return { title: clean, details: null }
}

/** Normalise un numéro sénégalais vers le format E.164 (+221XXXXXXXXX) attendu par le backend. */
export function normalizeSenegalPhone(raw: string): string {
  const compact = raw.replace(/[\s\-().]/g, '')
  if (compact.startsWith('+221')) return compact
  if (compact.startsWith('00221')) return `+221${compact.slice(5)}`
  if (compact.startsWith('221') && compact.length === 12) return `+${compact}`
  if (/^(70|75|76|77|78|33)[0-9]{7}$/.test(compact)) return `+221${compact}`
  return compact
}

function mapUser(raw: BackendUserProfile): User {
  return {
    id: raw.id,
    email: raw.email,
    displayName: raw.fullName,
    phoneNumber: raw.phoneNumber ?? null,
    role: raw.role,
    enabled: raw.enabled ?? true,
    createdAt: raw.createdAt,
  }
}

function mapAuthResponse(raw: BackendAuthResponse): AuthResponse {
  const expiresIn = raw.expiresIn ?? 900
  return {
    accessToken: raw.accessToken,
    tokenType: 'Bearer',
    expiresIn,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    user: mapUser(raw.user),
  }
}

function mapPublicAddress(raw: BackendPublicAddress): PublicAddress {
  const { title, details } = splitAddressDescription(raw.description)
  return {
    publicCode: raw.code,
    title,
    placeType: raw.locationType,
    zone: raw.zone,
    quartier: raw.quartier,
    district: getQuartierName(raw.quartier, raw.zone),
    city: getZoneName(raw.zone),
    description: details,
    latitude: raw.latitude,
    longitude: raw.longitude,
    photoUrl: raw.photoUrl ?? null,
    ownerName: raw.ownerName ?? null,
    createdAt: raw.createdAt ?? null,
  }
}

function mapDirectoryItem(raw: BackendDirectoryItem): DirectoryItem {
  const { title, details } = splitAddressDescription(raw.description)
  return {
    publicCode: raw.code,
    title,
    placeType: raw.locationType,
    zone: raw.zone,
    quartier: raw.quartier,
    district: getQuartierName(raw.quartier, raw.zone),
    city: getZoneName(raw.zone),
    description: details,
    photoUrl: raw.photoUrl ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    ownerName: raw.ownerName ?? null,
    createdAt: raw.createdAt,
  }
}

function mapOwnerAddress(raw: BackendAddressResponse): OwnerAddress {
  const { title, details } = splitAddressDescription(raw.description)
  const listed = Boolean(raw.listed)
  const isPubliclyAccessible = raw.status === 'ACTIVE' || raw.status === 'SIGNALED'
  return {
    id: raw.id,
    publicCode: raw.code,
    title,
    placeType: raw.locationType,
    zone: raw.zone,
    quartier: raw.quartier,
    district: getQuartierName(raw.quartier, raw.zone),
    city: getZoneName(raw.zone),
    description: details,
    latitude: raw.latitude,
    longitude: raw.longitude,
    status: raw.status,
    listed,
    publicationConsent: listed,
    publiclyAccessible: isPubliclyAccessible,
    createdAt: raw.createdAt,
    updatedAt: null,
    moderatedAt: null,
    photoUrl: raw.photoUrl ?? null,
    hasPhoto: Boolean(raw.photoUrl),
    ownerNamePublic: Boolean(raw.showOwnerName),
    moderationNotice: raw.moderationNotice ?? null,
    codeChanged: raw.codeChanged,
    previousCode: raw.previousCode ?? null,
  }
}

function mapAdminReport(raw: BackendAdminReport): AdminReport {
  const { title } = splitAddressDescription(raw.addressDescription)
  return {
    id: raw.id,
    reason: raw.reason,
    comment: raw.comment ?? null,
    status: raw.status,
    createdAt: raw.createdAt,
    resolvedAt: raw.resolvedAt ?? null,
    addressId: raw.addressId,
    publicCode: raw.addressCode,
    addressTitle: title,
    zone: raw.addressZone,
    quartier: raw.addressQuartier,
    district: getQuartierName(raw.addressQuartier, raw.addressZone),
    city: getZoneName(raw.addressZone),
    locationType: raw.addressLocationType,
    photoUrl: raw.addressPhotoUrl ?? null,
    addressStatus: raw.addressStatus,
  }
}

function mapSpringPage<T, R>(raw: SpringPage<T>, mapItem: (item: T) => R): Page<R> {
  return {
    items: (raw.content ?? []).map(mapItem),
    page: raw.number ?? 0,
    size: raw.size ?? 20,
    totalElements: raw.totalElements ?? 0,
    totalPages: raw.totalPages ?? 0,
  }
}

/* ---------- Client HTTP commun ---------- */

/** URL absolue ou relative d'un chemin renvoyé par l'API (ex. /uploads/…). */
export function apiUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : `${apiBaseUrl}${path}`
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string
  credentials?: RequestCredentials
}

/**
 * Appel JSON commun vers Spring Boot.
 * Convertit ErrorResponse ({ message, fieldErrors }) et problem+json ({ detail, errors }) en ApiError.
 */
async function request<T>(
  path: string,
  { method = 'GET', body, token, credentials = 'same-origin' }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const multipart = body instanceof FormData
  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      credentials,
      body: body === undefined ? undefined : multipart ? (body as FormData) : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Le service est injoignable. Vérifiez votre connexion.', 0)
  }

  if (!response.ok) {
    let message = 'La requête a échoué.'
    let fieldErrors: FieldErrors = {}
    try {
      const problem = await response.json() as {
        message?: string
        detail?: string
        fieldErrors?: FieldErrors
        errors?: FieldErrors
      }
      if (problem.message) message = problem.message
      else if (problem.detail) message = problem.detail
      if (problem.fieldErrors) fieldErrors = problem.fieldErrors
      else if (problem.errors) fieldErrors = problem.errors
    } catch {
      // Réponse sans corps JSON : on garde le message générique.
    }
    throw new ApiError(message, response.status, fieldErrors)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  return search.toString()
}

/* ---------- Authentification (/api/auth/*) ---------- */

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  const raw = await request<BackendAuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { email: input.email.trim(), password: input.password },
    credentials: 'include',
  })
  return mapAuthResponse(raw)
}

export async function register(input: {
  email: string
  password: string
  displayName: string
  phoneNumber: string
}): Promise<AuthResponse> {
  const email = input.email.trim()
  await request<BackendUserProfile>('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: input.displayName.trim(),
      email,
      phoneNumber: normalizeSenegalPhone(input.phoneNumber),
      password: input.password,
    },
    credentials: 'include',
  })
  // Le backend renvoie 201 UserProfileResponse sans jeton : on connecte immédiatement le compte créé.
  return login({ email, password: input.password })
}

let pendingRefresh: Promise<AuthResponse> | null = null

/** Échange le cookie HttpOnly refreshToken contre un nouvel Access Token (dédupliqué). */
export function refreshSession(): Promise<AuthResponse> {
  if (!pendingRefresh) {
    pendingRefresh = request<BackendAuthResponse>('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then(mapAuthResponse)
      .finally(() => {
        pendingRefresh = null
      })
  }
  return pendingRefresh
}

export async function logoutSession(token?: string | null): Promise<void> {
  try {
    await request<{ message?: string }>('/api/auth/logout', {
      method: 'POST',
      token: token ?? undefined,
      credentials: 'include',
    })
  } catch {
    // La session locale est nettoyée même si le réseau est coupé.
  }
}

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/change-password', {
    method: 'POST',
    token,
    credentials: 'include',
    body: { currentPassword, newPassword },
  })
}

export interface ReservedCodeItem {
  id: string
  code: string
  zone: string
  quartier: string
  status: 'RESERVED' | 'USED' | 'EXPIRED'
  expiresAt: string
}

export async function listReservedCodes(token: string): Promise<ReservedCodeItem[]> {
  return request<ReservedCodeItem[]>('/api/address-codes/reservations', { token })
}

export async function topUpReservedCodes(token: string, zone: string): Promise<ReservedCodeItem[]> {
  const qs = queryString({ zone: zone.trim().toUpperCase() })
  return request<ReservedCodeItem[]>(`/api/address-codes/reservations?${qs}`, {
    method: 'POST',
    token,
  })
}

export async function getCurrentUser(token: string): Promise<User> {
  const raw = await request<BackendUserProfile>('/api/auth/me', { token })
  return mapUser(raw)
}

/* ---------- Résolution publique & Annuaire ---------- */

export async function getPublicAddress(code: string): Promise<PublicAddressResult> {
  let response: Response
  try {
    response = await fetch(
      `${apiBaseUrl}/api/addresses/${encodeURIComponent(code.trim().toUpperCase())}`,
      { headers: { Accept: 'application/json' } },
    )
  } catch {
    throw new ApiError('Le service est injoignable. Vérifiez votre connexion.', 0)
  }

  if (!response.ok) {
    let message = 'La recherche de cette adresse a échoué.'
    try {
      const problem = await response.json() as { message?: string; detail?: string }
      if (problem.message) message = problem.message
      else if (problem.detail) message = problem.detail
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status)
  }

  const raw = await response.json() as BackendPublicAddress
  const mapped = mapPublicAddress(raw)
  const offline = response.headers.get(OFFLINE_HEADER)
  return offline ? { ...mapped, offlineCopyAt: offline } : mapped
}

export interface DirectoryQuery {
  q?: string
  quartier?: string
  type?: PlaceType | ''
}

/** GET /api/public/directory : adresses actives et listées dans l'annuaire public, paginées côté serveur. */
export async function searchDirectory(query: DirectoryQuery, page = 0, size = 12): Promise<Page<DirectoryItem>> {
  const qs = queryString({
    q: query.q?.trim() || undefined,
    quartier: query.quartier?.trim() || undefined,
    type: query.type || undefined,
    page,
    size,
  })
  const raw = await request<SpringPage<BackendDirectoryItem>>(`/api/public/directory?${qs}`)
  return mapSpringPage(raw, mapDirectoryItem)
}

/* ---------- Adresses du propriétaire (/api/addresses/*) ---------- */

export async function listAllMyAddresses(token: string): Promise<OwnerAddress[]> {
  const raw = await request<BackendAddressResponse[]>('/api/addresses/mine', { token })
  return (raw ?? []).map(mapOwnerAddress)
}

export async function listMyAddresses(token: string, page = 0, size = 20): Promise<Page<OwnerAddress>> {
  const all = await listAllMyAddresses(token)
  const totalElements = all.length
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size)
  const start = page * size
  return {
    items: all.slice(start, start + size),
    page,
    size,
    totalElements,
    totalPages,
  }
}

export async function getMyAddress(token: string, id: string): Promise<OwnerAddress> {
  const all = await listAllMyAddresses(token)
  const found = all.find((a) => a.id === id)
  if (!found) {
    throw new ApiError('Adresse introuvable ou inaccessible.', 404)
  }
  return found
}

export async function createMyAddress(token: string, input: NewAddressInput): Promise<OwnerAddress> {
  const raw = await request<BackendAddressResponse>('/api/addresses', {
    method: 'POST',
    token,
    body: {
      latitude: input.latitude,
      longitude: input.longitude,
      description: composeAddressDescription(input.title, input.description),
      locationType: input.placeType,
      listed: input.listed,
      showOwnerName: input.listed && Boolean(input.ownerNamePublic),
      clientRequestId: input.clientRequestId,
      reservedCode: input.reservedCode,
    },
  })
  return mapOwnerAddress(raw)
}

export interface UpdateAddressInput {
  title: string
  placeType: PlaceType
  description: string | null
  listed: boolean
  ownerNamePublic: boolean
}

export async function updateMyAddress(token: string, id: string, input: UpdateAddressInput): Promise<OwnerAddress> {
  const raw = await request<BackendAddressResponse>(`/api/addresses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: {
      description: composeAddressDescription(input.title, input.description),
      locationType: input.placeType,
      listed: input.listed,
      showOwnerName: input.listed && input.ownerNamePublic,
    },
  })
  return mapOwnerAddress(raw)
}

export async function uploadMyAddressPhoto(token: string, id: string, photo: Blob): Promise<OwnerAddress> {
  const form = new FormData()
  // Le contrôleur Spring Boot attend le champ multipart « file ».
  form.append('file', photo, 'facade.jpg')
  const raw = await request<BackendAddressResponse>(`/api/addresses/${encodeURIComponent(id)}/photo`, {
    method: 'POST',
    body: form,
    token,
  })
  return mapOwnerAddress(raw)
}

export async function deleteMyAddressPhoto(token: string, id: string): Promise<OwnerAddress> {
  const raw = await request<BackendAddressResponse>(`/api/addresses/${encodeURIComponent(id)}/photo`, {
    method: 'DELETE',
    token,
  })
  return mapOwnerAddress(raw)
}

export async function archiveMyAddress(token: string, id: string): Promise<OwnerAddress> {
  const raw = await request<BackendAddressResponse>(`/api/addresses/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
    token,
  })
  return mapOwnerAddress(raw)
}

export async function restoreMyAddress(token: string, id: string): Promise<OwnerAddress> {
  const raw = await request<BackendAddressResponse>(`/api/addresses/${encodeURIComponent(id)}/restore`, {
    method: 'POST',
    token,
  })
  return mapOwnerAddress(raw)
}

/* ---------- Partage SMS (/api/addresses/{code}/share/sms) ---------- */

export interface SmsResult {
  status: 'SENT' | 'SIMULATED'
  maskedPhone: string
}

export async function sendAddressSms(token: string, code: string, phone: string): Promise<SmsResult> {
  const raw = await request<{ status: 'SENT' | 'SIMULATED'; maskedPhone: string }>(
    `/api/addresses/${encodeURIComponent(code.trim().toUpperCase())}/share/sms`,
    {
      method: 'POST',
      token,
      body: { phoneNumber: normalizeSenegalPhone(phone) },
    },
  )
  return raw
}

/* ---------- Signalements publics & Itinéraire ---------- */

export type ReportReason = 'POSITION_INCORRECTE' | 'CONTENU_INAPPROPRIE' | 'PHOTO_INAPPROPRIEE' | 'AUTRE'

export async function reportAddress(
  code: string,
  reason: ReportReason,
  comment: string | null,
): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>(
    `/api/public/addresses/${encodeURIComponent(code.trim().toUpperCase())}/reports`,
    {
      method: 'POST',
      body: { reason, comment: comment?.trim() || null },
    },
  )
}

export type RouteProfile = 'foot-walking' | 'driving-car'

export interface RouteStep {
  instruction: string
  distance: number
  duration: number
}

export interface RouteResult {
  profile: RouteProfile
  distanceMeters: number
  durationSeconds: number
  /** Points [latitude, longitude] pour Leaflet. */
  coordinates: Array<[number, number]>
  steps: RouteStep[]
  approximateFallback?: boolean
}

/** Itinéraire OpenRouteService calculé par le serveur (clé ORS jamais exposée côté navigateur). */
export async function getRoute(
  from: { lat: number; lng: number },
  toCode: string,
  profile: RouteProfile,
): Promise<RouteResult> {
  const qs = queryString({
    fromLat: from.lat,
    fromLon: from.lng,
    code: toCode.trim().toUpperCase(),
    profile,
  })
  const raw = await request<BackendRouteResponse>(`/api/public/route?${qs}`)
  // GeoJSON LineString renvoie [longitude, latitude] -> Leaflet attend [latitude, longitude].
  const coordinates: Array<[number, number]> = (raw.geometry?.coordinates ?? []).map(
    ([lon, lat]) => [lat, lon],
  )
  return {
    profile,
    distanceMeters: raw.distance,
    durationSeconds: raw.duration,
    coordinates,
    steps: raw.steps ?? [],
    approximateFallback: Boolean(raw.approximateFallback),
  }
}

/* ---------- Administration & Modération (/api/admin/*) ---------- */

export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED'

export interface AdminReport {
  id: string
  reason: ReportReason
  comment: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
  addressId: string
  publicCode: string
  addressTitle: string
  zone: string
  quartier: string
  district: string
  city: string
  locationType: PlaceType
  photoUrl: string | null
  addressStatus: AddressStatus
}

export async function listReports(
  token: string,
  status?: ReportStatus,
  page = 0,
  size = 20,
): Promise<Page<AdminReport>> {
  const qs = queryString({ status, page, size })
  const raw = await request<SpringPage<BackendAdminReport>>(`/api/admin/reports?${qs}`, { token })
  return mapSpringPage(raw, mapAdminReport)
}

export async function updateReportStatus(
  token: string,
  id: string,
  status: 'RESOLVED' | 'DISMISSED',
  reason?: string,
): Promise<AdminReport> {
  const raw = await request<BackendAdminReport>(`/api/admin/reports/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: { status, reason: reason?.trim() || undefined },
  })
  return mapAdminReport(raw)
}

export async function suspendAdminAddress(
  token: string,
  addressId: string,
  reason: string,
): Promise<OwnerAddress> {
  const raw = await request<BackendAddressResponse>(
    `/api/admin/addresses/${encodeURIComponent(addressId)}/suspend`,
    {
      method: 'POST',
      token,
      body: { reason: reason.trim() },
    },
  )
  return mapOwnerAddress(raw)
}

export async function reinstateAdminAddress(
  token: string,
  addressId: string,
  reason?: string,
): Promise<OwnerAddress> {
  const raw = await request<BackendAddressResponse>(
    `/api/admin/addresses/${encodeURIComponent(addressId)}/reinstate`,
    {
      method: 'POST',
      token,
      body: reason?.trim() ? { reason: reason.trim() } : {},
    },
  )
  return mapOwnerAddress(raw)
}

export interface AdminActionItem {
  id: string
  adminId: string | null
  adminEmail: string
  action: string
  addressId: string
  addressCode: string
  reportId: string | null
  reason: string | null
  createdAt: string
}

export async function listAdminActions(token: string, page = 0, size = 20): Promise<Page<AdminActionItem>> {
  const qs = queryString({ page, size })
  const raw = await request<SpringPage<AdminActionItem>>(`/api/admin/actions?${qs}`, { token })
  return mapSpringPage(raw, (item) => item)
}

export async function listAdminAddresses(
  token: string,
  status?: AddressStatus,
  q?: string,
  page = 0,
  size = 50,
): Promise<Page<OwnerAddress>> {
  const qs = queryString({ status, q: q?.trim() || undefined, page, size })
  const raw = await request<SpringPage<BackendAddressResponse>>(`/api/admin/addresses?${qs}`, { token })
  return mapSpringPage(raw, mapOwnerAddress)
}
