import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, configurado, DISCORD_URL } from './supabase.js'
import { TIENDA, soles, enlaceWhatsApp, RAREZAS, colorRareza, DEMO } from './datos.js'
import Carrusel from './Carrusel.jsx'
import AdminModal from './Admin.jsx'
import Icono from './Icons.jsx'

const hashAdmin = () => window.location.hash.startsWith('#/admin')
const hashProducto = () => window.location.hash.match(/^#\/producto\/([0-9a-f-]{36})/i)?.[1] || null

function Rareza({ r, className = '' }) {
  if (!r) return null
  const c = colorRareza(r)
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${className}`}
          style={{ color: c, background: `${c}1f`, border: `1px solid ${c}66` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{r}
    </span>
  )
}

export default function Tienda() {
  const [productos, setProductos] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [error, setError] = useState('')
  const [cat, setCat] = useState('todos')
  const [rar, setRar] = useState('todas')
  const [q, setQ] = useState('')
  const [detalleId, setDetalleId] = useState(hashProducto())
  const [sesion, setSesion] = useState(null)
  const [admin, setAdmin] = useState(hashAdmin())

  const cargar = useCallback(async () => {
    if (!configurado) { setProductos(DEMO.productos); setCategorias(DEMO.categorias); return }
    const [p, c] = await Promise.all([
      supabase.from('productos').select('*').order('creado_en', { ascending: false }),
      supabase.from('categorias').select('*').order('orden', { ascending: true }),
    ])
    if (p.error) setError('No se pudo cargar el catálogo. Recarga la página.')
    else { setError(''); setProductos(p.data) }
    setCategorias(c.error ? [] : c.data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // Recarga al iniciar y al entrar/salir de sesión (el admin ve también los ocultos)
  useEffect(() => { cargar() }, [sesion, cargar])

  useEffect(() => {
    const onHash = () => { setAdmin(hashAdmin()); const id = hashProducto(); if (id) setDetalleId(id) }
    const onKey = (e) => { if (e.key === 'Escape') { cerrarDetalle(); cerrarAdmin() } }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey) }
  }, [])

  const limpiarHash = () => { if (window.location.hash) history.replaceState(null, '', window.location.pathname) }
  const cerrarAdmin = () => { setAdmin(false); limpiarHash() }
  const cerrarDetalle = () => { setDetalleId(null); if (hashProducto()) limpiarHash() }

  // Categorías para los filtros: las de la base de datos, o las que usan los productos
  const listaCats = useMemo(() => {
    if (categorias.length) return categorias
    return [...new Set((productos || []).map((p) => p.categoria))].map((nombre) => ({ id: nombre, nombre, emoji: '' }))
  }, [categorias, productos])

  // Si la categoría elegida ya no existe (se renombró o quedó vacía), vuelve a "Todos"
  useEffect(() => {
    if (productos && cat !== 'todos' && !listaCats.some((c) => c.nombre === cat)) setCat('todos')
  }, [productos, listaCats, cat])

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (productos || []).filter((p) =>
      p.disponible &&
      (cat === 'todos' || p.categoria === cat) &&
      (rar === 'todas' || p.rareza === rar) &&
      (!t || [p.nombre, p.heroe, p.descripcion].some((s) => (s || '').toLowerCase().includes(t)))
    )
  }, [productos, cat, rar, q])

  const detalle = productos?.find((p) => p.id === detalleId)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Barra superior */}
      <div className="bg-gradient-to-r from-brand-redDark via-brand-red to-brand-redDark text-white text-[11px] sm:text-xs py-2 text-center px-3 sm:px-4 tracking-wide sm:tracking-wider font-medium">
        ⚔️ Items, sets, arcanas e inmortales de Dota 2 · Entrega por intercambio de Steam ⚔️
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-brand-bg/85 backdrop-blur-md border-b border-brand-borde">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex justify-between items-center gap-2 h-16 sm:h-20">
          <a href="#catalogo" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rotate-45 border-2 border-brand-gold bg-gradient-to-br from-brand-red to-brand-redDark flex items-center justify-center shadow-[0_0_18px_rgba(194,60,42,.5)]">
              <Icono n="sword" className="w-5 h-5 sm:w-6 sm:h-6 -rotate-45 text-brand-gold" />
            </span>
            <span className="min-w-0 ml-1">
              <span className="font-serif text-xl sm:text-3xl font-black tracking-wider texto-oro block leading-none truncate">{TIENDA}</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[.3em] text-brand-muted font-medium block truncate">Dota 2 Marketplace</span>
            </span>
          </a>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {DISCORD_URL && (
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer"
                 className="hidden sm:inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                <Icono n="chat" /> Discord
              </a>
            )}
            {sesion && (
              <button onClick={() => setAdmin(true)} aria-label="Gestionar items"
                      className="bg-brand-panel2 text-brand-gold hover:bg-brand-borde w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 rounded-lg text-xs font-semibold border border-brand-borde transition flex items-center justify-center gap-1.5">
                <Icono n="sliders" />
                <span className="hidden md:inline">Gestionar items</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero-bg py-12 sm:py-20 px-4 border-b border-brand-borde">
        <div className="max-w-3xl w-full mx-auto flex flex-col items-center text-center">
          <span className="inline-block px-3.5 py-1 bg-brand-red/15 rounded text-[10px] sm:text-xs uppercase tracking-[.25em] text-brand-gold font-semibold mb-5 border border-brand-red/50">
            Tienda de cosméticos de Dota 2
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight tracking-wide texto-oro">
            Equipa a tu héroe como se merece
          </h1>
          <p className="text-sm sm:text-lg text-brand-text/80 max-w-xl mb-8 leading-relaxed">
            Arcanas, inmortales, sets y couriers a los mejores precios. Pide por WhatsApp y recíbelo por intercambio en Steam.
          </p>
          <div className="flex flex-col min-[420px]:flex-row justify-center items-center gap-3 w-full max-w-xs min-[420px]:max-w-none">
            <a href="#catalogo" className="w-full min-[420px]:w-auto bg-brand-red hover:bg-brand-redDark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition shadow-[0_0_24px_rgba(194,60,42,.45)] text-center">
              Ver items
            </a>
            <a href={enlaceWhatsApp({ nombre: 'Consulta general' })} target="_blank" rel="noopener noreferrer"
               className="w-full min-[420px]:w-auto bg-transparent text-brand-gold border border-brand-gold/60 hover:bg-brand-gold/10 px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition text-center">
              Pedir un item
            </a>
          </div>
          <ul className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-xl text-[11px] sm:text-xs text-brand-muted">
            <li className="flex flex-col items-center gap-1.5"><Icono n="shield" className="w-5 h-5 text-brand-gold" />Entrega segura</li>
            <li className="flex flex-col items-center gap-1.5"><Icono n="bolt" className="w-5 h-5 text-brand-gold" />Envío rápido</li>
            <li className="flex flex-col items-center gap-1.5"><Icono n="chat" className="w-5 h-5 text-brand-gold" />Atención por WhatsApp</li>
          </ul>
        </div>
      </header>

      {/* Catálogo */}
      <main id="catalogo" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 flex-grow w-full scroll-mt-16 sm:scroll-mt-20">
        <div className="flex flex-col gap-3 mb-6 sm:mb-8 pb-4 border-b border-brand-borde">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
            {/* Filtros por categoría: fila deslizable en celular */}
            <div className="flex gap-2 overflow-x-auto md:flex-wrap pb-1 -mx-3 px-3 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[{ nombre: 'todos', etiqueta: 'Todos' }, ...listaCats.map((c) => ({ nombre: c.nombre, etiqueta: `${c.emoji ? c.emoji + ' ' : ''}${c.nombre}` }))].map((c) => (
                <button key={c.nombre} onClick={() => setCat(c.nombre)}
                        className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${cat === c.nombre ? 'bg-brand-red text-white shadow-[0_0_14px_rgba(194,60,42,.45)]' : 'bg-brand-panel text-brand-text/80 hover:bg-brand-panel2 border border-brand-borde'}`}>
                  {c.etiqueta}
                </button>
              ))}
            </div>
            <label className="relative w-full md:w-72 shrink-0">
              <span className="sr-only">Buscar item o héroe</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar item o héroe…"
                     className="w-full bg-brand-panel border border-brand-borde text-base md:text-sm rounded-lg pl-9 pr-4 py-2 text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-gold" />
              <Icono n="search" className="w-3.5 h-3.5 absolute left-3.5 top-3.5 md:top-3 text-brand-muted" />
            </label>
          </div>
          {/* Filtro por rareza */}
          <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 md:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[{ nombre: 'todas', color: '#E6E1D6' }, ...RAREZAS].map((r) => {
              const activa = rar === r.nombre
              return (
                <button key={r.nombre} onClick={() => setRar(r.nombre)} aria-pressed={activa}
                        className="shrink-0 whitespace-nowrap px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition border"
                        style={{ color: r.color, borderColor: activa ? r.color : `${r.color}40`, background: activa ? `${r.color}26` : 'transparent' }}>
                  {r.nombre === 'todas' ? 'Todas las rarezas' : r.nombre}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className="text-center py-16 text-red-400">{error}</p>}
        {!error && !productos && <p className="text-center py-16 text-brand-muted">Cargando items…</p>}

        {productos && visibles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-brand-panel2 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-3 border border-brand-borde"><Icono n="sword" className="w-7 h-7" /></div>
            <h3 className="font-serif text-2xl text-brand-gold font-bold">No hay items para mostrar</h3>
            <p className="text-sm text-brand-muted mt-1">Prueba con otra categoría, rareza o búsqueda.</p>
          </div>
        )}

        {/* 1 columna en celulares pequeños, 2 desde 500px, 3 en laptop, 4 en pantalla grande */}
        <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {visibles.map((p) => (
            <article key={p.id} style={{ '--rareza': colorRareza(p.rareza) }}
                     className="product-card bg-brand-panel rounded-xl overflow-hidden border border-brand-borde flex flex-col">
              <div className="relative">
                <Carrusel fotos={p.fotos} alt={p.nombre} className="aspect-video" />
                <span className="absolute top-2.5 left-2.5 bg-black/70 text-brand-text text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded uppercase tracking-wider pointer-events-none">{p.categoria}</span>
                <span className="absolute bottom-0 inset-x-0 h-1 pointer-events-none" style={{ background: colorRareza(p.rareza) }} />
              </div>
              <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Rareza r={p.rareza} />
                    {p.heroe && <span className="text-[11px] text-brand-muted font-medium">{p.heroe}</span>}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-brand-text mb-1 break-words">
                    <button onClick={() => setDetalleId(p.id)} className="text-left hover:text-brand-gold">{p.nombre}</button>
                  </h3>
                  {p.descripcion && <p className="text-xs text-brand-muted line-clamp-2 mb-3">{p.descripcion}</p>}
                </div>
                <div>
                  {p.precio != null && (
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="text-xs text-brand-muted font-medium">Precio</span>
                      <span className="font-serif text-xl sm:text-2xl font-bold text-brand-gold">{soles(p.precio)}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setDetalleId(p.id)} className="border border-brand-borde text-brand-text hover:bg-brand-panel2 py-2.5 px-2 rounded-lg text-xs font-bold transition">Ver detalle</button>
                    <a href={enlaceWhatsApp(p)} target="_blank" rel="noopener noreferrer" aria-label={`Comprar ${p.nombre} por WhatsApp`}
                       className="bg-brand-red hover:bg-brand-redDark text-white py-2.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5">
                      <Icono n="chat" /> Comprar
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={cerrarDetalle}>
          <div role="dialog" aria-modal="true" aria-label={detalle.nombre} onClick={(e) => e.stopPropagation()}
               style={{ borderColor: colorRareza(detalle.rareza) }}
               className="bg-brand-panel rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[92dvh] overflow-y-auto relative border-t-4 sm:border">
            <button onClick={cerrarDetalle} aria-label="Cerrar"
                    className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center">
              <Icono n="x" className="w-5 h-5" />
            </button>
            <Carrusel fotos={detalle.fotos} alt={detalle.nombre} className="aspect-video" />
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Rareza r={detalle.rareza} />
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">{detalle.categoria}</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-brand-gold mb-1 break-words">{detalle.nombre}</h3>
              {detalle.heroe && <p className="text-sm text-brand-text/80 mb-3">Héroe: <strong>{detalle.heroe}</strong></p>}
              {detalle.descripcion && <p className="text-sm text-brand-muted mb-4 leading-relaxed whitespace-pre-line">{detalle.descripcion}</p>}
              {detalle.precio != null && (
                <div className="bg-brand-panel2 border border-brand-borde p-4 rounded-xl mb-5 sm:mb-6">
                  <span className="text-xs text-brand-muted block uppercase tracking-wider font-semibold">Precio</span>
                  <span className="font-serif text-3xl font-bold text-brand-gold">{soles(detalle.precio)}</span>
                </div>
              )}
              <a href={enlaceWhatsApp(detalle)} target="_blank" rel="noopener noreferrer"
                 className="w-full bg-[#128C7E] hover:bg-[#0f7367] text-white py-3 rounded-xl text-sm font-bold shadow-lg transition flex items-center justify-center gap-2">
                <Icono n="chat" className="w-5 h-5" /> Comprar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin */}
      {admin && <AdminModal sesion={sesion} productos={productos || []} categorias={categorias} onCambio={cargar} onCerrar={cerrarAdmin} />}

      {/* Footer */}
      <footer className="bg-brand-panel border-t border-brand-borde py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <span className="font-serif text-xl font-bold texto-oro">{TIENDA}</span>
            <p className="text-xs text-brand-muted mt-0.5 max-w-md">Tienda independiente, sin relación con Valve. Dota 2 es marca registrada de Valve Corporation.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-brand-muted">© 2026 {TIENDA}</span>
            <button onClick={() => setAdmin(true)} aria-label="Acceso administrador" className="text-brand-borde hover:text-brand-gold p-2"><Icono n="lock" className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </footer>
    </div>
  )
}
