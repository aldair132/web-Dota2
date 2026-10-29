import { soles, enlaceCarrito, maxCantidad } from './datos.js'
import Icono from './Icons.jsx'

// lineas: [{ p, cant }] ya cruzadas con el catálogo
export default function Carrito({ lineas, onCantidad, onQuitar, onVaciar, onCerrar }) {
  const total = lineas.reduce((s, { p, cant }) => s + Number(p.precio || 0) * cant, 0)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end" onClick={onCerrar}>
      <aside role="dialog" aria-modal="true" aria-label="Carrito" onClick={(e) => e.stopPropagation()}
             className="bg-brand-panel w-full max-w-md h-full flex flex-col border-l border-brand-borde shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-borde">
          <h2 className="font-serif text-2xl font-bold text-brand-gold flex items-center gap-2"><Icono n="cart" className="w-5 h-5" /> Tu pedido</h2>
          <button onClick={onCerrar} aria-label="Cerrar carrito" className="text-brand-muted hover:text-brand-text w-9 h-9 rounded-full grid place-items-center hover:bg-brand-panel2">
            <Icono n="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lineas.length === 0 ? (
            <div className="text-center py-16 text-brand-muted">
              <Icono n="cart" className="w-10 h-10 mx-auto mb-3 text-brand-borde" />
              <p>Tu carrito está vacío.</p>
              <p className="text-xs mt-1">Agrega sets desde el catálogo.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {lineas.map(({ p, cant }) => (
                <li key={p.id} className="flex gap-3 p-3 bg-brand-panel2 border border-brand-borde rounded-xl">
                  {p.fotos?.[0]
                    ? <img src={p.fotos[0]} alt="" className="w-20 h-12 object-cover rounded-md shrink-0" />
                    : <span className="w-20 h-12 rounded-md bg-brand-bg shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-brand-text truncate">{p.nombre}</p>
                    {p.heroe && <p className="text-[11px] text-brand-muted">{p.heroe}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onCantidad(p.id, cant - 1)} disabled={cant <= 1} aria-label="Quitar uno"
                                className="w-7 h-7 grid place-items-center rounded bg-brand-bg border border-brand-borde disabled:opacity-40"><Icono n="minus" className="w-3 h-3" /></button>
                        <span className="w-7 text-center text-sm font-semibold">{cant}</span>
                        <button onClick={() => onCantidad(p.id, cant + 1)} disabled={cant >= maxCantidad(p)} aria-label="Agregar uno"
                                className="w-7 h-7 grid place-items-center rounded bg-brand-bg border border-brand-borde disabled:opacity-40"><Icono n="plus" className="w-3 h-3" /></button>
                      </div>
                      <span className="font-bold text-brand-gold text-sm">{soles(Number(p.precio || 0) * cant)}</span>
                    </div>
                  </div>
                  <button onClick={() => onQuitar(p.id)} aria-label={`Quitar ${p.nombre}`} className="self-start text-brand-muted hover:text-red-400 p-1"><Icono n="trash" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lineas.length > 0 && (
          <div className="border-t border-brand-borde px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-muted uppercase tracking-wider font-semibold">Total</span>
              <span className="font-serif text-3xl font-bold text-brand-gold">{soles(total)}</span>
            </div>
            <a href={enlaceCarrito(lineas, total)} target="_blank" rel="noopener noreferrer"
               className="w-full bg-[#128C7E] hover:bg-[#0f7367] text-white py-3 rounded-xl text-sm font-bold shadow-lg transition flex items-center justify-center gap-2">
              <Icono n="chat" className="w-5 h-5" /> Enviar pedido por WhatsApp
            </a>
            <button onClick={onVaciar} className="w-full text-xs text-brand-muted hover:text-brand-text underline">Vaciar carrito</button>
          </div>
        )}
      </aside>
    </div>
  )
}
