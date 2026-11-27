/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Adresse de l'API Spring Boot (ex. http://localhost:8080). */
  readonly VITE_API_BASE_URL?: string
  /** Adresse publique du site, utilisée dans les liens de partage et les QR codes. */
  readonly VITE_PUBLIC_APP_URL?: string
}
