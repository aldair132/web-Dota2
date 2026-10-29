import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase.js'
import { soles, RAREZAS, ATRIBUTOS, ETIQUETAS, colorRareza, colorEtiqueta, idYoutube, puedeComprar } from './datos.js'
import { HEROES } from './heroes.js'
import { campo, etiqueta, subirImagen, borrarImagenes } from './adminUi.js'
import AdminTestimonios from './AdminTestimonios.jsx'
import Pedidos from './Pedidos.jsx'
import Icono from './Icons.jsx'

const VACIO = {
  nombre: '', heroe: '', atributo: '', rareza: 'Mítica', precio: '', precio_antes: '', etiqueta: '',
  descripcion: '', video_url: '', stock: '', destacado: false, vendido: false, disponible: true, fotos: [],
}
const POR_PAGINA = 10
const PESTANAS = [
  { id: 'lista', nombre: 'Sets' },
  { id: 'testi', nombre: 'Testimonios' },
  { id: 'pedidos', nombre: 'Ventas' },
]
const numOVacio = (v) => (v === '' || v == null ? null : Number(v))

export default function AdminModal({ sesion, productos, onCambio, onCerrar }) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" onClick={onCerrar}>
      <div role="dialog" aria-modal="true" aria-label="Panel de administración" onClick={(e) => e.stopPropagation()}
           className="bg-brand-panel rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94dvh] flex flex-col overflow-hidden relative border border-brand-borde">
        <button onClick={onCerrar} aria-label="Cerrar" className="absolute top-3 right-3 z-10 text-brand-muted hover:text-brand-text w-9 h-9 rounded-full flex items-center justify-center hover:bg-brand-panel2">
          <Icono n="x" className="w-5 h-5" />
        </button>
        {sesion ? <Panel productos={productos} onCambio={onCambio} /> : <Login />}
      </div>
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')

  const entrar = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) setError('Correo o contraseña incorrectos.')
  }

  return (
    <form onSubmit={entrar} className="max-w-sm w-full mx-auto space-y-4 p-6 sm:p-8">
      <h2 className="font-serif text-3xl font-bold text-brand-gold text-center">Ingresar</h2>
      <label className="block"><span className={etiqueta}>Correo</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={campo} /></label>
      <label className="block"><span className={etiqueta}>Contraseña</span><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required className={campo} /></label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="w-full bg-brand-red hover:bg-brand-redDark text-white py-2.5 rounded-lg text-sm font-semibold transition">Entrar</button>
    </form>
  )
}

function Interruptor({ activo, onClick, etiqueta: texto }) {
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={texto} title={texto} onClick={onClick}
            className={`relative w-10 h-6 shrink-0 rounded-full transition-colors ${activo ? 'bg-brand-red' : 'bg-brand-borde'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${activo ? 'translate-x-4' : ''}`} />
    </button>
  )
}

function Panel({ productos, onCambio }) {
  const [vista, setVista] = useState('lista') // 'lista' | 'form' | 'cats' | 'testi' | 'pedidos'
  const [form, setForm] = useState(VACIO)
  const [editId, setEditId] = useState(null)
  const [nuevas, setNuevas] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState('')
  const [fEstado, setFEstado] = useState('todos')
  const [limite, setLimite] = useState(POR_PAGINA)
  const cuerpo = useRef(null)


  const previews = useMemo(() => nuevas.map((f) => URL.createObjectURL(f)), [nuevas])
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])
  useEffect(() => { cuerpo.current?.scrollTo({ top: 0 }) }, [vista])
  useEffect(() => { setLimite(POR_PAGINA) }, [q, fEstado])

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return productos.filter((p) => {
      if (fEstado === 'visibles' && !p.disponible) return false
      if (fEstado === 'ocultos' && p.disponible) return false
      if (fEstado === 'destacados' && !p.destacado) return false
      if (fEstado === 'agotados' && puedeComprar(p)) return false
      return !t || p.nombre.toLowerCase().includes(t) || (p.heroe || '').toLowerCase().includes(t)
    })
  }, [productos, q, fEstado])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const limpiar = () => { setForm(VACIO); setEditId(null); setNuevas([]) }

  const nuevo = () => { limpiar(); setMsg(''); setVista('form') }
  const volver = () => { limpiar(); setVista('lista') }

  const editar = (p) => {
    setEditId(p.id)
    setForm({
      nombre: p.nombre, heroe: p.heroe ?? '', atributo: p.atributo ?? '', rareza: p.rareza ?? '',
      precio: p.precio ?? '', precio_antes: p.precio_antes ?? '', etiqueta: p.etiqueta ?? '', descripcion: p.descripcion ?? '',
      video_url: p.video_url ?? '', stock: p.stock ?? '', destacado: !!p.destacado, vendido: !!p.vendido, disponible: p.disponible, fotos: p.fotos,
    })
    setNuevas([])
    setMsg('')
    setVista('form')
  }

  const guardar = async (e) => {
    e.preventDefault()
    const otro = e.nativeEvent.submitter?.dataset.otro === 'si'
    if (form.video_url.trim() && !idYoutube(form.video_url)) { setMsg('El enlace del video debe ser de YouTube.'); return }
    setGuardando(true)
    setMsg('')
    try {
      const original = editId ? productos.find((p) => p.id === editId)?.fotos || [] : []
      const subidas = []
      for (const f of nuevas) subidas.push(await subirImagen(f))
      const fila = {
        nombre: form.nombre,
        categoria: 'Sets',
        heroe: form.heroe.trim() || null,
        atributo: form.atributo || null,
        rareza: form.rareza || null,
        precio: Number(form.precio),
        precio_antes: numOVacio(form.precio_antes),
        etiqueta: form.etiqueta || null,
        descripcion: form.descripcion,
        video_url: form.video_url.trim() || null,
        stock: numOVacio(form.stock),
        destacado: form.destacado,
        vendido: form.vendido,
        disponible: form.disponible,
        fotos: [...form.fotos, ...subidas],
      }
      const { error } = editId
        ? await supabase.from('productos').update(fila).eq('id', editId)
        : await supabase.from('productos').insert(fila)
      if (error) throw error

      // Borra del almacenamiento las fotos que se quitaron al editar
      await borrarImagenes(original.filter((u) => !form.fotos.includes(u)))

      setMsg(editId ? 'Set actualizado.' : 'Set creado.')
      limpiar()
      onCambio()
      if (!otro) setVista('lista')
    } catch (err) {
      const falta = /column|schema cache/i.test(err.message)
      setMsg('No se pudo guardar: ' + err.message + (falta ? ' → Ejecuta otra vez supabase.sql en Supabase para crear las columnas nuevas.' : ''))
    } finally {
      setGuardando(false)
    }
  }

  const actualizar = async (p, cambio) => {
    const { error } = await supabase.from('productos').update(cambio).eq('id', p.id)
    setMsg(error ? 'No se pudo cambiar: ' + error.message : '')
    onCambio()
  }

  const borrar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? No se puede deshacer.`)) return
    await borrarImagenes(p.fotos)
    const { error } = await supabase.from('productos').delete().eq('id', p.id)
    setMsg(error ? 'No se pudo eliminar: ' + error.message : 'Set eliminado.')
    if (editId === p.id) limpiar()
    onCambio()
  }

  const quitarFoto = (url) => set('fotos', form.fotos.filter((u) => u !== url))
  const hacerPortada = (url) => set('fotos', [url, ...form.fotos.filter((u) => u !== url)])
  const pestana = vista === 'form' ? 'lista' : vista

  return (
    <>
      <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 border-b border-brand-borde pr-14">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-gold flex items-center gap-2">
          <Icono n="sliders" className="w-5 h-5 text-brand-red" /> Panel de administración
        </h2>
        <button onClick={() => supabase.auth.signOut()} className="text-xs text-brand-gold underline mt-1">Cerrar sesión</button>
        <div role="tablist" className="flex gap-1 mt-3 overflow-x-auto [scrollbar-width:none]">
          {PESTANAS.map((t) => (
            <button key={t.id} role="tab" aria-selected={pestana === t.id} onClick={() => { if (vista === 'form') limpiar(); setMsg(''); setVista(t.id) }}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition ${pestana === t.id ? 'border-brand-red text-brand-gold' : 'border-transparent text-brand-muted hover:text-brand-text'}`}>
              {t.nombre}
            </button>
          ))}
        </div>
      </div>

      <div ref={cuerpo} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pt-4">
        {msg && (vista === 'lista' || vista === 'form') && <p role="status" className="text-sm mb-3 bg-brand-red/15 text-brand-gold border border-brand-red/40 rounded-lg px-3 py-2">{msg}</p>}

        {vista === 'testi' ? (
          <AdminTestimonios onCambio={onCambio} />
        ) : vista === 'pedidos' ? (
          <Pedidos productos={productos} onCambio={onCambio} />
        ) : vista === 'lista' ? (
          <div className="pb-6">
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <label className="relative flex-1">
                <span className="sr-only">Buscar set</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o héroe…" className={`${campo} pl-9`} />
                <Icono n="search" className="w-3.5 h-3.5 absolute left-3 top-3 text-brand-muted" />
              </label>
              <select value={fEstado} onChange={(e) => setFEstado(e.target.value)} aria-label="Filtrar por estado" className={`${campo} sm:w-40`}>
                <option value="todos">Todos</option>
                <option value="visibles">Visibles</option>
                <option value="ocultos">Ocultos</option>
                <option value="destacados">Destacados</option>
                <option value="agotados">Vendidos / agotados</option>
              </select>
              <button onClick={nuevo} className="bg-brand-red hover:bg-brand-redDark text-white px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap">+ Nuevo set</button>
            </div>

            <p className="text-xs text-brand-muted mb-2">Mostrando {Math.min(limite, filtrados.length)} de {filtrados.length} set(s)</p>

            <ul className="space-y-2">
              {filtrados.slice(0, limite).map((p) => (
                <li key={p.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-brand-panel2 border border-brand-borde rounded-xl" style={{ borderLeft: `4px solid ${colorRareza(p.rareza)}` }}>
                  {p.fotos[0]
                    ? <img src={p.fotos[0]} alt="" className="w-20 h-12 shrink-0 object-cover rounded-md border border-brand-borde" />
                    : <span className="w-20 h-12 shrink-0 rounded-md bg-brand-bg grid place-items-center text-brand-muted text-xs">Sin foto</span>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-text truncate">
                      {p.destacado && <span title="Destacado" className="text-brand-gold mr-1">★</span>}{p.nombre}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-muted">
                      {p.heroe && <span>{p.heroe}</span>}
                      {p.rareza && <span style={{ color: colorRareza(p.rareza) }}>{p.rareza}</span>}
                      {p.precio != null && <span className="font-bold text-brand-gold">{soles(p.precio)}</span>}
                      {p.etiqueta && <span className="px-1.5 rounded text-white" style={{ background: colorEtiqueta(p.etiqueta) }}>{p.etiqueta}</span>}
                      {p.stock != null && <span className={p.stock > 0 ? '' : 'text-red-300'}>Stock: {p.stock}</span>}
                      {p.vendido && <span className="text-red-300 font-semibold">Vendido</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <button onClick={() => actualizar(p, { destacado: !p.destacado })} aria-label={p.destacado ? 'Quitar de destacados' : 'Marcar como destacado'} title={p.destacado ? 'Quitar de destacados' : 'Destacar'}
                            className={`p-2 rounded-lg ${p.destacado ? 'bg-brand-gold/20 text-brand-gold' : 'bg-brand-bg text-brand-muted hover:text-brand-gold'}`}><Icono n="star" className={`w-4 h-4 ${p.destacado ? 'fill-current' : ''}`} /></button>
                    <span className="hidden sm:inline text-[11px] text-brand-muted">{p.disponible ? 'Visible' : 'Oculto'}</span>
                    <Interruptor activo={p.disponible} etiqueta={p.disponible ? 'Ocultar de la tienda' : 'Mostrar en la tienda'} onClick={() => actualizar(p, { disponible: !p.disponible })} />
                    <button onClick={() => editar(p)} aria-label={`Editar ${p.nombre}`} className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 p-2 rounded-lg"><Icono n="edit" /></button>
                    <button onClick={() => borrar(p)} aria-label={`Eliminar ${p.nombre}`} className="bg-red-500/10 text-red-300 hover:bg-red-500/20 p-2 rounded-lg"><Icono n="trash" /></button>
                  </div>
                </li>
              ))}
            </ul>

            {filtrados.length === 0 && (
              <p className="text-center text-sm text-brand-muted py-10">
                {productos.length === 0 ? 'Aún no hay sets. Pulsa "+ Nuevo set".' : 'Ningún set coincide con los filtros.'}
              </p>
            )}

            {filtrados.length > limite && (
              <button onClick={() => setLimite((l) => l + POR_PAGINA)} className="mt-4 mx-auto block px-5 py-2 text-sm font-semibold text-brand-gold border border-brand-borde rounded-lg hover:bg-brand-panel2">Ver más</button>
            )}
          </div>
        ) : (
          <form onSubmit={guardar} className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={volver} className="text-sm text-brand-gold underline">← Volver a la lista</button>
              <h3 className="font-serif text-xl font-bold text-brand-gold">{editId ? 'Editar set' : 'Nuevo set'}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label><span className={etiqueta}>Nombre del set</span><input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Set de la Tormenta Carmesí" className={campo} /></label>
              <label><span className={etiqueta}>Héroe</span>
                <input list="lista-heroes" value={form.heroe} onChange={(e) => set('heroe', e.target.value)} placeholder="Escribe y elige (vacío si no aplica)" className={campo} />
                <datalist id="lista-heroes">{HEROES.map((h) => <option key={h} value={h} />)}</datalist>
              </label>
              <label><span className={etiqueta}>Atributo del héroe</span>
                <select value={form.atributo} onChange={(e) => set('atributo', e.target.value)} className={campo}>
                  <option value="">Sin atributo</option>
                  {ATRIBUTOS.map((a) => <option key={a.nombre} value={a.nombre}>{a.icono} {a.nombre}</option>)}
                </select>
              </label>
              <label><span className={etiqueta}>Rareza</span>
                <select value={form.rareza} onChange={(e) => set('rareza', e.target.value)} className={campo} style={{ color: colorRareza(form.rareza) }}>
                  <option value="">Sin rareza</option>
                  {RAREZAS.map((r) => <option key={r.nombre} value={r.nombre} style={{ color: r.color }}>{r.nombre}</option>)}
                </select>
              </label>
              <label><span className={etiqueta}>Etiqueta</span>
                <select value={form.etiqueta} onChange={(e) => set('etiqueta', e.target.value)} className={campo}>
                  <option value="">Sin etiqueta</option>
                  {ETIQUETAS.map((t) => <option key={t.nombre} value={t.nombre}>{t.nombre}</option>)}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label><span className={etiqueta}>Precio (S/)</span><input required type="number" step="0.01" min="0" value={form.precio} onChange={(e) => set('precio', e.target.value)} placeholder="25.00" className={campo} /></label>
              <label><span className={etiqueta}>Precio antes (oferta)</span><input type="number" step="0.01" min="0" value={form.precio_antes} onChange={(e) => set('precio_antes', e.target.value)} placeholder="Vacío si no hay oferta" className={campo} /></label>
              <label><span className={etiqueta}>Stock</span><input type="number" step="1" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="Vacío = sin límite" className={campo} /></label>
            </div>
            {form.precio_antes !== '' && Number(form.precio_antes) <= Number(form.precio) && (
              <p className="text-xs text-amber-400 -mt-2">El "precio antes" debe ser mayor que el precio para que se muestre como oferta.</p>
            )}

            <label className="block"><span className={etiqueta}>Descripción</span><textarea rows="3" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Piezas incluidas (cabeza, arma, hombros…), estilos y efectos" className={campo} /></label>
            <label className="block"><span className={etiqueta}>Video de YouTube (opcional)</span><input type="url" value={form.video_url} onChange={(e) => set('video_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={campo} /></label>

            {form.fotos.length > 0 && (
              <div>
                <span className={etiqueta}>Fotos actuales</span>
                <div className="flex gap-2 flex-wrap">
                  {form.fotos.map((u, k) => (
                    <div key={u} className="relative">
                      <img src={u} alt="" className="w-28 h-16 object-cover rounded-lg border border-brand-borde" />
                      <button type="button" onClick={() => quitarFoto(u)} aria-label="Quitar foto" className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-brand-red text-white flex items-center justify-center"><Icono n="x" className="w-3 h-3" /></button>
                      {k === 0
                        ? <span className="absolute bottom-0 inset-x-0 text-[10px] text-center bg-brand-red/90 text-white rounded-b-lg">Portada</span>
                        : <button type="button" onClick={() => hacerPortada(u)} className="absolute bottom-0 inset-x-0 text-[10px] text-center bg-black/75 text-brand-gold rounded-b-lg hover:bg-black">Hacer portada</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className={etiqueta}>{editId ? 'Agregar más fotos' : 'Subir capturas o imágenes'}</span>
              <input type="file" accept="image/*" multiple onChange={(e) => setNuevas([...e.target.files])}
                     className="text-xs text-brand-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-panel2 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-gold" />
              {previews.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {previews.map((u) => <img key={u} src={u} alt="Vista previa" className="w-28 h-16 object-cover rounded-lg border border-dashed border-brand-gold" />)}
                </div>
              )}
              <p className="text-[11px] text-brand-muted mt-1">Puedes elegir varias. Se reducen de tamaño automáticamente. La primera es la portada (se ve mejor en formato horizontal 16:9).</p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.disponible} onChange={(e) => set('disponible', e.target.checked)} className="accent-brand-red" /> Visible en la tienda</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.destacado} onChange={(e) => set('destacado', e.target.checked)} className="accent-brand-red" /> ★ Destacado</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.vendido} onChange={(e) => set('vendido', e.target.checked)} className="accent-brand-red" /> Vendido (se ve pero no se puede comprar)</label>
            </div>

            {/* Botones fijos abajo */}
            <div className="sticky bottom-0 bg-brand-panel border-t border-brand-borde py-3 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={volver} className="px-4 py-2 text-xs font-semibold text-brand-text bg-brand-panel2 hover:bg-brand-borde rounded-lg">Cancelar</button>
              {!editId && (
                <button data-otro="si" disabled={guardando} className="px-4 py-2 text-xs font-semibold text-brand-gold border border-brand-gold/60 hover:bg-brand-gold/10 rounded-lg disabled:opacity-60">Guardar y crear otro</button>
              )}
              <button disabled={guardando} className="px-5 py-2 text-xs font-semibold text-white bg-brand-red hover:bg-brand-redDark rounded-lg shadow disabled:opacity-60">
                {guardando ? 'Guardando…' : editId ? 'Actualizar set' : 'Guardar set'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
