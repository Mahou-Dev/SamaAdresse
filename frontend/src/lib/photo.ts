/** Limites alignées sur le serveur (5 Mo, JPEG/PNG) ; le serveur revérifie et réencode toujours. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const MAX_SIDE = 1600
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'

export class PhotoError extends Error {}

/**
 * Prépare la photo dans le navigateur : orientation de l'appareil appliquée, réduction à 1600 px
 * et conversion en JPEG. Cela allège l'envoi sur réseau mobile et retire déjà les métadonnées
 * (position GPS de l'appareil photo). Si le navigateur ne sait pas redessiner l'image, le fichier
 * d'origine est envoyé tel quel s'il respecte les limites.
 */
export async function preparePhoto(file: File): Promise<Blob> {
  if (!ACCEPTED.includes(file.type)) {
    throw new PhotoError('Choisissez une photo (JPEG, PNG ou WebP).')
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (blob) return checkSize(blob)
  } catch {
    // Repli ci-dessous.
  }
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    throw new PhotoError('Ce format n’a pas pu être converti par votre navigateur : utilisez une photo JPEG ou PNG.')
  }
  return checkSize(file)
}

function checkSize(blob: Blob) {
  if (blob.size > MAX_UPLOAD_BYTES) throw new PhotoError('Photo trop volumineuse : 5 Mo au maximum.')
  return blob
}
