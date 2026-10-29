import { soles, colorRareza, colorAtributo, colorEtiqueta, puedeComprar } from './datos.js'
import Carrusel from './Carrusel.jsx'
import Icono from './Icons.jsx'

export function Rareza({ r, className = '' }) {
  if (!r) return null
  const c = colorRareza(r)
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${className}`}
          style={{ color: c, background: `${c}1f`, border: `1px solid ${c}66` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{r}
    </span>
  )
}

export function Heroe({ p }) {
  if (!p.heroe) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-brand-muted font-medium">
      {p.atributo && <span className="w-2 h-2 rounded-full" style={{ background: colorAtributo(p.atributo) }} title={p.atributo} />}
      {p.heroe}
    </span>
  )
}

export function Etiqueta({ e }) {
  if (!e) return null
  return (
    <span className="text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow"
          style={{ background: colorEtiqueta(e) }}>{e}</span>
  )
}

// Porcentaje de descuento si hay un precio anterior mayor
export const descuento = (p) =>
  p.precio_antes && p.precio != null && Number(p.precio_antes) > Number(p.precio)
    ? Math.round((1 - p.precio / p.precio_antes) * 100)
    : 0

export function Precio({ p, grande = false }) {
  if (p.precio == null) return null
  const d = descuento(p)
  return (
    <span className="flex items-baseline gap-2 flex-wrap justify-end">
      {d > 0 && <span className={`${grande ? 'text-base' : 'text-xs'} text-brand-muted line-through`}>{soles(p.precio_antes)}</span>}
      <span className={`font-serif font-bold text-brand-gold ${grande ? 'text-3xl' : 'text-xl sm:text-2xl'}`}>{soles(p.precio)}</span>
    </span>
  )
}

// Cinta que tapa la imagen cuando el item no se puede comprar
export function Agotado({ p }) {
  if (puedeComprar(p)) return null
  return (
    <span className="absolute inset-0 grid place-items-center bg-black/60 pointer-events-none">
      <span className="font-serif font-bold text-lg tracking-widest text-white border-2 border-white/80 px-4 py-1 -rotate-6">
        {p.vendido ? 'VENDIDO' : 'AGOTADO'}
      </span>
    </span>
  )
}

export default function Tarjeta({ p, onVer, onAgregar }) {
  const d = descuento(p)
  const comprable = puedeComprar(p)
  return (
    <article style={{ '--rareza': colorRareza(p.rareza) }}
             className="product-card bg-brand-panel rounded-xl overflow-hidden border border-brand-borde flex flex-col">
      <div className="relative">
        <Carrusel fotos={p.fotos} alt={p.nombre} className="aspect-video" />
        <span className="absolute top-2.5 left-2.5 bg-black/70 text-brand-text text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded uppercase tracking-wider pointer-events-none">{p.categoria}</span>
        <span className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 pointer-events-none">
          {d > 0 && <span className="bg-brand-red text-white text-xs font-black px-2 py-0.5 rounded">-{d}%</span>}
          <Etiqueta e={p.etiqueta} />
        </span>
        <Agotado p={p} />
        <span className="absolute bottom-0 inset-x-0 h-1 pointer-events-none" style={{ background: colorRareza(p.rareza) }} />
      </div>
      <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Rareza r={p.rareza} />
            <Heroe p={p} />
          </div>
          <h3 className="font-serif text-lg font-bold text-brand-text mb-1 break-words">
            <button onClick={() => onVer(p.id)} className="text-left hover:text-brand-gold">{p.nombre}</button>
          </h3>
          {p.descripcion && <p className="text-xs text-brand-muted line-clamp-2 mb-3">{p.descripcion}</p>}
        </div>
        <div>
          {p.precio != null && (
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <span className="text-xs text-brand-muted font-medium">
                Precio
                {p.stock != null && comprable && <span className="block text-[10px] text-amber-400">Quedan {p.stock}</span>}
              </span>
              <Precio p={p} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onVer(p.id)} className="border border-brand-borde text-brand-text hover:bg-brand-panel2 py-2.5 px-2 rounded-lg text-xs font-bold transition">Ver detalle</button>
            <button onClick={() => onAgregar(p)} disabled={!comprable} aria-label={`Agregar ${p.nombre} al carrito`}
                    className="bg-brand-red hover:bg-brand-redDark text-white py-2.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:bg-brand-borde disabled:text-brand-muted disabled:cursor-not-allowed">
              <Icono n="cart" /> {comprable ? 'Agregar' : 'No disponible'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
