export const HERO_ANCHO_RECOMENDADO = 1920
export const HERO_ALTO_RECOMENDADO = 1080

const ASPECT_16_9 = HERO_ANCHO_RECOMENDADO / HERO_ALTO_RECOMENDADO
const TOLERANCIA_ASPECT = 0.02

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')) }
    img.src = url
  })
}

export function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve({ width: video.videoWidth, height: video.videoHeight }) }
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer el video')) }
    video.src = url
  })
}

export function esFormatoHero(width: number, height: number): boolean {
  if (width < 1280 || height < 720) return false
  return Math.abs(width / height - ASPECT_16_9) <= TOLERANCIA_ASPECT
}
