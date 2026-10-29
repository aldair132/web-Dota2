// Reduce fotos del celular (3-8 MB) a ~200-500 KB antes de subirlas.
export async function comprimir(file, max = 1600, calidad = 0.82) {
  try {
    const bmp = await createImageBitmap(file)
    const esc = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * esc)
    const h = Math.round(bmp.height * esc)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bmp, 0, 0, w, h)
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', calidad))
    if (blob && blob.size < file.size) return { blob, ext: 'jpg', type: 'image/jpeg' }
  } catch {
    /* si el navegador no puede leerla, se sube tal cual */
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  return { blob: file, ext, type: file.type }
}
