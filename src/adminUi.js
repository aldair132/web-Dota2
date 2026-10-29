import { supabase, BUCKET } from './supabase.js'
import { comprimir } from './imagenes.js'

// Estilos compartidos por las pantallas del panel
export const campo = 'w-full px-3 py-2 text-sm border border-brand-borde rounded-lg focus:outline-none focus:border-brand-gold bg-brand-bg text-brand-text placeholder:text-brand-muted'
export const etiqueta = 'block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1'
export const btnPrimario = 'px-4 py-2 text-xs font-semibold text-white bg-brand-red hover:bg-brand-redDark rounded-lg disabled:opacity-60'
export const btnSecundario = 'px-4 py-2 text-xs font-semibold text-brand-text bg-brand-panel2 hover:bg-brand-borde rounded-lg'

export const rutaDeUrl = (url) => url.split(`/${BUCKET}/`)[1]

export async function subirImagen(file, carpeta = '') {
  const { blob, ext, type } = await comprimir(file)
  const ruta = `${carpeta}${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, { contentType: type })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl
}

export async function borrarImagenes(urls) {
  const rutas = urls.filter(Boolean).map(rutaDeUrl).filter(Boolean)
  if (rutas.length) await supabase.storage.from(BUCKET).remove(rutas)
}
