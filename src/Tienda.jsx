import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, configurado } from './supabase.js'
import { TIENDA, enlaceWhatsApp, RAREZAS, ATRIBUTOS, colorRareza, puedeComprar, maxCantidad, idYoutube, DEMO } from './datos.js'
import Carrusel from './Carrusel.jsx'
import Tarjeta, { Rareza, Heroe, Etiqueta, Precio, Agotado, descuento } from './Tarjeta.jsx'
import Carrito from './Carrito.jsx'
import { ComoComprar, Testimonios } from './Secciones.jsx'
import Encabezado from './Encabezado.jsx'
import Pie from './Pie.jsx'
import AdminModal from './Admin.jsx'
import Icono from './Icons.jsx'

const hashAdmin = () => window.location.hash.startsWith('#/admin')
const hashProducto = () => window.location.hash.match(/^#\/producto\/([0-9a-f-]{36})/i)?.[1] || null

const ORDENES = {
  recientes: { etiqueta: 'Más recientes', fn: (a, b) => String(b.creado_en).localeCompare(String(a.creado_en)) },
  'precio-asc': { etiqueta: 'Precio: menor a mayor', fn: (a, b) => (a.precio ?? Infinity) - (b.precio ?? Infinity) },
  'precio-desc': { etiqueta: 'Precio: mayor a menor', fn: (a, b) => (b.precio ?? -1) - (a.precio ?? -1) },
  descuento: { etiqueta: 'Mayor descuento', fn: (a, b) => descuento(b) - descuento(a) },
}

// El carrito se guarda en el navegador para no perderlo al recargar
const leerCarrito = () => {
  try { return JSON.parse(localStorage.getItem('carrito')) || [] } catch { return [] }
}

const campo = 'bg-brand-panel border border-brand-borde text-base md:text-sm rounded-lg px-3 py-2 text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-gold'

export default function Tienda() {
  const [productos, setProductos] = useState(null)
  const [testimonios, setTestimonios] = useState([])
  const [error, setError] = useState('')
  const [heroe, setHeroe] = useState('todos')
  const [rar, setRar] = useState('todas')
  const [atr, setAtr] = useState('todos')
  const [orden, setOrden] = useState('recientes')
  const [pMin, setPMin] = useState('')
  const [pMax, setPMax] = useState('')
  const [q, setQ] = useState('')
  const [detalleId, setDetalleId] = useState(hashProducto())
  const [sesion, setSesion] = useState(null)
  const [admin, setAdmin] = useState(hashAdmin())
  const [carrito, setCarrito] = useState(leerCarrito)
  const [verCarrito, setVerCarrito] = useState(false)
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    if (!configurado) { setProductos(DEMO.productos); setTestimonios(DEMO.testimonios); return }
    const [p, t] = await Promise.all([
      supabase.from('productos').select('*').order('creado_en', { ascending: false }),
      supabase.from('testimonios').select('*').order('creado_en', { ascending: false }),
    ])
    if (p.error) setError('No se pudo cargar el catálogo. Recarga la página.')
    else { setError(''); setProductos(p.data) }
    setTestimonios(t.error ? [] : t.data)
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
    const onKey = (e) => { if (e.key === 'Escape') { cerrarDetalle(); cerrarAdmin(); setVerCarrito(false) } }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey) }
  }, [])

  useEffect(() => { try { localStorage.setItem('carrito', JSON.stringify(carrito)) } catch { /* sin almacenamiento */ } }, [carrito])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 2500)
    return () => clearTimeout(t)
  }, [aviso])

  const limpiarHash = () => { if (window.location.hash) history.replaceState(null, '', window.location.pathname) }
  const cerrarAdmin = () => { setAdmin(false); limpiarHash() }
  const cerrarDetalle = () => { setDetalleId(null); if (hashProducto()) limpiarHash() }

  // Carrito: solo guarda id y cantidad; los datos se toman del catálogo actual
  const lineas = useMemo(() => {
    if (!productos) return []
    return carrito
      .map(({ id, cant }) => ({ p: productos.find((x) => x.id === id), cant }))
      .filter(({ p }) => p && p.disponible && puedeComprar(p))
      .map(({ p, cant }) => ({ p, cant: Math.min(cant, maxCantidad(p)) }))
  }, [carrito, productos])
  const enCarrito = lineas.reduce((s, l) => s + l.cant, 0)

  const agregar = (p) => {
    setCarrito((c) => {
      const ya = c.find((x) => x.id === p.id)
      if (ya) return c.map((x) => (x.id === p.id ? { ...x, cant: Math.min(x.cant + 1, maxCantidad(p)) } : x))
      return [...c, { id: p.id, cant: 1 }]
    })
    setAviso(`"${p.nombre}" se agregó al carrito`)
  }
  const cambiarCantidad = (id, cant) => setCarrito((c) => c.map((x) => (x.id === id ? { ...x, cant: Math.max(1, cant) } : x)))
  const quitar = (id) => setCarrito((c) => c.filter((x) => x.id !== id))

  const publicos = useMemo(() => (productos || []).filter((p) => p.disponible), [productos])
  const heroesConSets = useMemo(() => [...new Set(publicos.map((p) => p.heroe).filter(Boolean))].sort(), [publicos])
  const destacados = useMemo(() => publicos.filter((p) => p.destacado && puedeComprar(p)), [publicos])

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase()
    const min = pMin === '' ? -Infinity : Number(pMin)
    const max = pMax === '' ? Infinity : Number(pMax)
    return publicos
      .filter((p) =>
        (heroe === 'todos' || p.heroe === heroe) &&
        (rar === 'todas' || p.rareza === rar) &&
        (atr === 'todos' || p.atributo === atr) &&
        (p.precio == null || (p.precio >= min && p.precio <= max)) &&
        (!t || [p.nombre, p.heroe, p.descripcion].some((s) => (s || '').toLowerCase().includes(t)))
      )
      // Los vendidos/agotados van al final
      .sort((a, b) => (puedeComprar(b) - puedeComprar(a)) || ORDENES[orden].fn(a, b))
  }, [publicos, heroe, rar, atr, pMin, pMax, q, orden])

  const hayFiltros = heroe !== 'todos' || rar !== 'todas' || atr !== 'todos' || pMin !== '' || pMax !== '' || q !== ''
  const limpiarFiltros = () => { setHeroe('todos'); setRar('todas'); setAtr('todos'); setPMin(''); setPMax(''); setQ('') }

  const enlaces = [
    { href: '#inicio', texto: 'Inicio' },
    { href: '#catalogo', texto: 'Catálogo' },
    ...(destacados.length ? [{ href: '#destacados', texto: 'Destacados' }] : []),
    { href: '#como-comprar', texto: 'Cómo comprar' },
    { href: '#preguntas', texto: 'Preguntas' },
    { href: '#contacto', texto: 'Contacto' },
  ]

  const detalle = productos?.find((p) => p.id === detalleId)
  const video = idYoutube(detalle?.video_url)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Barra superior */}
      <div className="bg-gradient-to-r from-brand-redDark via-brand-red to-brand-redDark text-white text-[11px] sm:text-xs py-2 text-center px-3 sm:px-4 tracking-wide sm:tracking-wider font-medium">
        ⚔️ Sets completos de Dota 2 para todos los héroes · Entrega por intercambio de Steam ⚔️
      </div>

      <Encabezado enlaces={enlaces} enCarrito={enCarrito} sesion={sesion} onCarrito={() => setVerCarrito(true)} onAdmin={() => setAdmin(true)} />

      {/* Hero */}
      <section id="inicio" className="hero-bg scroll-mt-24 py-12 sm:py-20 px-4 border-b border-brand-borde">
        <div className="max-w-3xl w-full mx-auto flex flex-col items-center text-center">
          <span className="inline-block px-3.5 py-1 bg-brand-red/15 rounded text-[10px] sm:text-xs uppercase tracking-[.25em] text-brand-gold font-semibold mb-5 border border-brand-red/50">
            Tienda de sets de Dota 2
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight tracking-wide texto-oro">
            Equipa a tu héroe como se merece
          </h1>
          <p className="text-sm sm:text-lg text-brand-text/80 max-w-xl mb-8 leading-relaxed">
            Sets completos para tu héroe favorito a los mejores precios. Pide por WhatsApp y recíbelo por intercambio en Steam.
          </p>
          <div className="flex flex-col min-[420px]:flex-row justify-center items-center gap-3 w-full max-w-xs min-[420px]:max-w-none">
            <a href="#catalogo" className="w-full min-[420px]:w-auto bg-brand-red hover:bg-brand-redDark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition shadow-[0_0_24px_rgba(194,60,42,.45)] text-center">
              Ver sets
            </a>
            <a href={enlaceWhatsApp({ nombre: 'Consulta general' })} target="_blank" rel="noopener noreferrer"
               className="w-full min-[420px]:w-auto bg-transparent text-brand-gold border border-brand-gold/60 hover:bg-brand-gold/10 px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition text-center">
              Pedir un set
            </a>
          </div>
          <ul className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-xl text-[11px] sm:text-xs text-brand-muted">
            <li className="flex flex-col items-center gap-1.5"><Icono n="shield" className="w-5 h-5 text-brand-gold" />Entrega segura</li>
            <li className="flex flex-col items-center gap-1.5"><Icono n="bolt" className="w-5 h-5 text-brand-gold" />Envío rápido</li>
            <li className="flex flex-col items-center gap-1.5"><Icono n="chat" className="w-5 h-5 text-brand-gold" />Atención por WhatsApp</li>
          </ul>
        </div>
      </section>

      {/* Destacados */}
      {destacados.length > 0 && (
        <section id="destacados" className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-8 sm:pt-10 scroll-mt-24">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-gold flex items-center gap-2 mb-4">
            <Icono n="fire" className="w-5 h-5 text-brand-red" /> Destacados
          </h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
            {destacados.map((p) => (
              <button key={p.id} onClick={() => setDetalleId(p.id)} style={{ '--rareza': colorRareza(p.rareza) }}
                      className="product-card snap-start shrink-0 w-64 sm:w-72 text-left bg-brand-panel border border-brand-borde rounded-xl overflow-hidden">
                <div className="relative">
                  <Carrusel fotos={p.fotos.slice(0, 1)} alt={p.nombre} className="aspect-video" />
                  <span className="absolute top-2 right-2"><Etiqueta e={p.etiqueta} /></span>
                  <span className="absolute bottom-0 inset-x-0 h-1" style={{ background: colorRareza(p.rareza) }} />
                </div>
                <div className="p-3">
                  <p className="font-serif font-bold truncate">{p.nombre}</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <Heroe p={p} />
                    <Precio p={p} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Catálogo */}
      <main id="catalogo" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 flex-grow w-full scroll-mt-20 sm:scroll-mt-24">
        <div className="flex flex-col gap-3 mb-6 sm:mb-8 pb-4 border-b border-brand-borde">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold texto-oro shrink-0">Catálogo de sets</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {/* Solo aparecen los héroes que tienen sets a la venta */}
              <select value={heroe} onChange={(e) => setHeroe(e.target.value)} aria-label="Filtrar por héroe" className={`${campo} w-full sm:w-56`}>
                <option value="todos">Todos los héroes ({heroesConSets.length})</option>
                {heroesConSets.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <label className="relative w-full md:w-72 shrink-0">
                <span className="sr-only">Buscar set o héroe</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar set o héroe…" className={`${campo} w-full pl-9`} />
                <Icono n="search" className="w-3.5 h-3.5 absolute left-3.5 top-3.5 md:top-3 text-brand-muted" />
              </label>
            </div>
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

          {/* Atributo del héroe, rango de precio y orden */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
            <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[{ nombre: 'todos', color: '#E6E1D6', icono: '' }, ...ATRIBUTOS].map((a) => {
                const activo = atr === a.nombre
                return (
                  <button key={a.nombre} onClick={() => setAtr(a.nombre)} aria-pressed={activo}
                          className="shrink-0 whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition border"
                          style={{ color: a.color, borderColor: activo ? a.color : `${a.color}40`, background: activo ? `${a.color}26` : 'transparent' }}>
                    {a.nombre === 'todos' ? 'Todos los atributos' : `${a.icono} ${a.nombre}`}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-brand-muted">S/</span>
              <input type="number" min="0" inputMode="decimal" value={pMin} onChange={(e) => setPMin(e.target.value)} placeholder="Mín" aria-label="Precio mínimo" className={`${campo} w-20`} />
              <span className="text-brand-muted">–</span>
              <input type="number" min="0" inputMode="decimal" value={pMax} onChange={(e) => setPMax(e.target.value)} placeholder="Máx" aria-label="Precio máximo" className={`${campo} w-20`} />
              <select value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar" className={`${campo} flex-1 min-w-[11rem]`}>
                {Object.entries(ORDENES).map(([k, o]) => <option key={k} value={k}>{o.etiqueta}</option>)}
              </select>
            </div>
          </div>

          {productos && (
            <div className="flex items-center justify-between text-xs text-brand-muted">
              <span>{visibles.length} set(s)</span>
              {hayFiltros && <button onClick={limpiarFiltros} className="text-brand-gold underline">Limpiar filtros</button>}
            </div>
          )}
        </div>

        {error && <p className="text-center py-16 text-red-400">{error}</p>}
        {!error && !productos && <p className="text-center py-16 text-brand-muted">Cargando sets…</p>}

        {productos && visibles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-brand-panel2 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-3 border border-brand-borde"><Icono n="sword" className="w-7 h-7" /></div>
            <h3 className="font-serif text-2xl text-brand-gold font-bold">No hay sets para mostrar</h3>
            <p className="text-sm text-brand-muted mt-1">Prueba con otros filtros o pídenos el set por WhatsApp.</p>
          </div>
        )}

        {/* 1 columna en celulares pequeños, 2 desde 500px, 3 en laptop, 4 en pantalla grande */}
        <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {visibles.map((p) => <Tarjeta key={p.id} p={p} onVer={setDetalleId} onAgregar={agregar} />)}
        </div>
      </main>

      <ComoComprar />
      <Testimonios lista={testimonios.filter((t) => t.visible !== false)} />

      {/* Detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={cerrarDetalle}>
          <div role="dialog" aria-modal="true" aria-label={detalle.nombre} onClick={(e) => e.stopPropagation()}
               style={{ borderColor: colorRareza(detalle.rareza) }}
               className="bg-brand-panel rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-xl w-full max-h-[92dvh] overflow-y-auto relative border-t-4 sm:border">
            <button onClick={cerrarDetalle} aria-label="Cerrar"
                    className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center">
              <Icono n="x" className="w-5 h-5" />
            </button>
            <div className="relative">
              <Carrusel fotos={detalle.fotos} alt={detalle.nombre} className="aspect-video" />
              <Agotado p={detalle} />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Rareza r={detalle.rareza} />
                <Etiqueta e={detalle.etiqueta} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-brand-gold mb-1 break-words">{detalle.nombre}</h3>
              {detalle.heroe && (
                <p className="text-sm text-brand-text/80 mb-3">
                  Héroe: <strong>{detalle.heroe}</strong>{detalle.atributo && <span className="text-brand-muted"> · {detalle.atributo}</span>}
                </p>
              )}
              {detalle.descripcion && <p className="text-sm text-brand-muted mb-4 leading-relaxed whitespace-pre-line">{detalle.descripcion}</p>}
              {video && (
                <div className="aspect-video mb-4 rounded-xl overflow-hidden border border-brand-borde bg-black">
                  <iframe src={`https://www.youtube-nocookie.com/embed/${video}`} title={`Video de ${detalle.nombre}`} loading="lazy"
                          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen className="w-full h-full" />
                </div>
              )}
              {detalle.precio != null && (
                <div className="bg-brand-panel2 border border-brand-borde p-4 rounded-xl mb-5 sm:mb-6 flex items-end justify-between gap-3">
                  <span className="text-xs text-brand-muted uppercase tracking-wider font-semibold">
                    Precio
                    {descuento(detalle) > 0 && <span className="block mt-1 text-brand-red font-black text-sm normal-case">Ahorras {descuento(detalle)}%</span>}
                    {detalle.stock != null && puedeComprar(detalle) && <span className="block mt-1 text-amber-400 normal-case">Quedan {detalle.stock}</span>}
                  </span>
                  <Precio p={detalle} grande />
                </div>
              )}
              {puedeComprar(detalle) ? (
                <div className="grid sm:grid-cols-2 gap-2">
                  <button onClick={() => { agregar(detalle); cerrarDetalle() }}
                          className="bg-brand-red hover:bg-brand-redDark text-white py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                    <Icono n="cart" className="w-5 h-5" /> Agregar al carrito
                  </button>
                  <a href={enlaceWhatsApp(detalle)} target="_blank" rel="noopener noreferrer"
                     className="bg-[#128C7E] hover:bg-[#0f7367] text-white py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                    <Icono n="chat" className="w-5 h-5" /> Comprar ahora
                  </a>
                </div>
              ) : (
                <a href={enlaceWhatsApp({ nombre: `${detalle.nombre} (¿lo pueden conseguir?)`, heroe: detalle.heroe })} target="_blank" rel="noopener noreferrer"
                   className="w-full border border-brand-gold/60 text-brand-gold hover:bg-brand-gold/10 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                  <Icono n="chat" className="w-5 h-5" /> Preguntar si lo pueden conseguir
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {verCarrito && (
        <Carrito lineas={lineas} onCantidad={cambiarCantidad} onQuitar={quitar}
                 onVaciar={() => setCarrito([])} onCerrar={() => setVerCarrito(false)} />
      )}

      {/* Aviso al agregar al carrito */}
      {aviso && (
        <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-brand-panel2 border border-brand-gold/50 text-sm text-brand-text px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-[calc(100%-2rem)]">
          <span className="truncate">{aviso}</span>
          <button onClick={() => { setAviso(''); setVerCarrito(true) }} className="text-brand-gold font-bold whitespace-nowrap">Ver carrito</button>
        </div>
      )}

      {/* Admin */}
      {admin && <AdminModal sesion={sesion} productos={productos || []} onCambio={cargar} onCerrar={cerrarAdmin} />}

      <Pie enlaces={enlaces} onAdmin={() => setAdmin(true)} />
    </div>
  )
}
