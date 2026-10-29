import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase, BUCKET } from './supabase.js'
import { soles, RAREZAS, colorRareza } from './datos.js'
import { comprimir } from './imagenes.js'
import Categorias from './Categorias.jsx'
import Icono from './Icons.jsx'

const VACIO = { nombre: '', categoria: '', heroe: '', rareza: 'Inmortal', precio: '', descripcion: '', disponible: true, fotos: [] }
const POR_PAGINA = 10
const rutaDeUrl = (url) => url.split(`/${BUCKET}/`)[1]
const campo = 'w-full px-3 py-2 text-sm border border-brand-borde rounded-lg focus:outline-none focus:border-brand-gold bg-brand-bg text-brand-text placeholder:text-brand-muted'
const etiqueta = 'block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1'

export default function AdminModal({ sesion, productos, categorias, onCambio, onCerrar }) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" onClick={onCerrar}>
      <div role="dialog" aria-modal="true" aria-label="Panel de administración" onClick={(e) => e.stopPropagation()}
           className="bg-brand-panel rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94dvh] flex flex-col overflow-hidden relative border border-brand-borde">
        <button onClick={onCerrar} aria-label="Cerrar" className="absolute top-3 right-3 z-10 text-brand-muted hover:text-brand-text w-9 h-9 rounded-full flex items-center justify-center hover:bg-brand-panel2">
          <Icono n="x" className="w-5 h-5" />
        </button>
        {sesion ? <Panel productos={productos} categorias={categorias} onCambio={onCambio} /> : <Login />}
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

function Panel({ productos, categorias, onCambio }) {
  const [vista, setVista] = useState('lista') // 'lista' | 'form' | 'cats'
  const [form, setForm] = useState(VACIO)
  const [editId, setEditId] = useState(null)
  const [nuevas, setNuevas] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState('')
  const [fCat, setFCat] = useState('todas')
  const [fEstado, setFEstado] = useState('todos')
  const [limite, setLimite] = useState(POR_PAGINA)
  const cuerpo = useRef(null)

  // Si la tabla de categorías aún no existe, se usan las que ya tienen los productos
  const opciones = useMemo(
    () => categorias.length
      ? categorias
      : [...new Set(productos.map((p) => p.categoria))].map((nombre) => ({ id: nombre, nombre, emoji: '' })),
    [categorias, productos]
  )

  const previews = useMemo(() => nuevas.map((f) => URL.createObjectURL(f)), [nuevas])
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])
  useEffect(() => { cuerpo.current?.scrollTo({ top: 0 }) }, [vista])
  useEffect(() => { setLimite(POR_PAGINA) }, [q, fCat, fEstado])

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return productos.filter((p) => {
      if (fCat !== 'todas' && p.categoria !== fCat) return false
      if (fEstado === 'visibles' && !p.disponible) return false
      if (fEstado === 'ocultos' && p.disponible) return false
      return !t || p.nombre.toLowerCase().includes(t) || (p.heroe || '').toLowerCase().includes(t)
    })
  }, [productos, q, fCat, fEstado])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const limpiar = () => { setForm({ ...VACIO, categoria: opciones[0]?.nombre || '' }); setEditId(null); setNuevas([]) }

  const nuevo = () => { limpiar(); setMsg(''); setVista('form') }
  const volver = () => { limpiar(); setVista('lista') }

  const editar = (p) => {
    setEditId(p.id)
    setForm({ nombre: p.nombre, categoria: p.categoria, heroe: p.heroe ?? '', rareza: p.rareza ?? '', precio: p.precio ?? '', descripcion: p.descripcion ?? '', disponible: p.disponible, fotos: p.fotos })
    setNuevas([])
    setMsg('')
    setVista('form')
  }

  const subirFotos = async () => {
    const urls = []
    for (const f of nuevas) {
      const { blob, ext, type } = await comprimir(f)
      const ruta = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, { contentType: type })
      if (error) throw error
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl)
    }
    return urls
  }

  const guardar = async (e) => {
    e.preventDefault()
    const otro = e.nativeEvent.submitter?.dataset.otro === 'si'
    setGuardando(true)
    setMsg('')
    try {
      const original = editId ? productos.find((p) => p.id === editId)?.fotos || [] : []
      const subidas = await subirFotos()
      const fila = {
        nombre: form.nombre,
        categoria: form.categoria,
        heroe: form.heroe.trim() || null,
        rareza: form.rareza || null,
        precio: Number(form.precio),
        descripcion: form.descripcion,
        disponible: form.disponible,
        fotos: [...form.fotos, ...subidas],
      }
      const { error } = editId
        ? await supabase.from('productos').update(fila).eq('id', editId)
        : await supabase.from('productos').insert(fila)
      if (error) throw error

      // Borra del almacenamiento las fotos que se quitaron al editar
      const quitadas = original.filter((u) => !form.fotos.includes(u)).map(rutaDeUrl).filter(Boolean)
      if (quitadas.length) await supabase.storage.from(BUCKET).remove(quitadas)

      setMsg(editId ? 'Item actualizado.' : 'Item creado.')
      limpiar()
      onCambio()
      if (!otro) setVista('lista')
    } catch (err) {
      setMsg('No se pudo guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const alternarVisible = async (p) => {
    const { error } = await supabase.from('productos').update({ disponible: !p.disponible }).eq('id', p.id)
    setMsg(error ? 'No se pudo cambiar: ' + error.message : '')
    onCambio()
  }

  const borrar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? No se puede deshacer.`)) return
    const rutas = p.fotos.map(rutaDeUrl).filter(Boolean)
    if (rutas.length) await supabase.storage.from(BUCKET).remove(rutas)
    const { error } = await supabase.from('productos').delete().eq('id', p.id)
    setMsg(error ? 'No se pudo eliminar: ' + error.message : 'Item eliminado.')
    if (editId === p.id) limpiar()
    onCambio()
  }

  const quitarFoto = (url) => set('fotos', form.fotos.filter((u) => u !== url))
  const hacerPortada = (url) => set('fotos', [url, ...form.fotos.filter((u) => u !== url)])

  return (
    <>
      <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-brand-borde pr-14">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-gold flex items-center gap-2">
          <Icono n="sliders" className="w-5 h-5 text-brand-red" /> Panel de administración
        </h2>
        <button onClick={() => supabase.auth.signOut()} className="text-xs text-brand-gold underline mt-1">Cerrar sesión</button>
      </div>

      <div ref={cuerpo} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pt-4">
        {msg && vista !== 'cats' && <p role="status" className="text-sm mb-3 bg-brand-red/15 text-brand-gold border border-brand-red/40 rounded-lg px-3 py-2">{msg}</p>}

        {vista === 'cats' ? (
          <Categorias categorias={categorias} productos={productos} onCambio={onCambio} onVolver={() => setVista('lista')} />
        ) : vista === 'lista' ? (
          <div className="pb-6">
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <label className="relative flex-1">
                <span className="sr-only">Buscar item</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o héroe…" className={`${campo} pl-9`} />
                <Icono n="search" className="w-3.5 h-3.5 absolute left-3 top-3 text-brand-muted" />
              </label>
              <select value={fCat} onChange={(e) => setFCat(e.target.value)} aria-label="Filtrar por categoría" className={`${campo} sm:w-40`}>
                <option value="todas">Todas</option>
                {opciones.map((c) => <option key={c.id} value={c.nombre}>{c.emoji} {c.nombre}</option>)}
              </select>
              <select value={fEstado} onChange={(e) => setFEstado(e.target.value)} aria-label="Filtrar por estado" className={`${campo} sm:w-36`}>
                <option value="todos">Todos</option>
                <option value="visibles">Visibles</option>
                <option value="ocultos">Ocultos</option>
              </select>
              <button onClick={() => setVista('cats')} className="border border-brand-gold/60 text-brand-gold hover:bg-brand-gold/10 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap">Categorías</button>
              <button onClick={nuevo} className="bg-brand-red hover:bg-brand-redDark text-white px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap">+ Nuevo item</button>
            </div>

            <p className="text-xs text-brand-muted mb-2">Mostrando {Math.min(limite, filtrados.length)} de {filtrados.length} item(s)</p>

            <ul className="space-y-2">
              {filtrados.slice(0, limite).map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3 bg-brand-panel2 border border-brand-borde rounded-xl" style={{ borderLeft: `4px solid ${colorRareza(p.rareza)}` }}>
                  {p.fotos[0]
                    ? <img src={p.fotos[0]} alt="" className="w-20 h-12 shrink-0 object-cover rounded-md border border-brand-borde" />
                    : <span className="w-20 h-12 shrink-0 rounded-md bg-brand-bg grid place-items-center text-brand-muted text-xs">Sin foto</span>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-text truncate">{p.nombre}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-muted">
                      <span>{p.categoria}</span>
                      {p.heroe && <span>{p.heroe}</span>}
                      {p.rareza && <span style={{ color: colorRareza(p.rareza) }}>{p.rareza}</span>}
                      {p.precio != null && <span className="font-bold text-brand-gold">{soles(p.precio)}</span>}
                      <span>{p.fotos.length} foto(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline text-[11px] text-brand-muted">{p.disponible ? 'Visible' : 'Oculto'}</span>
                    <Interruptor activo={p.disponible} etiqueta={p.disponible ? 'Ocultar de la tienda' : 'Mostrar en la tienda'} onClick={() => alternarVisible(p)} />
                    <button onClick={() => editar(p)} aria-label={`Editar ${p.nombre}`} className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 p-2 rounded-lg"><Icono n="edit" /></button>
                    <button onClick={() => borrar(p)} aria-label={`Eliminar ${p.nombre}`} className="bg-red-500/10 text-red-300 hover:bg-red-500/20 p-2 rounded-lg"><Icono n="trash" /></button>
                  </div>
                </li>
              ))}
            </ul>

            {filtrados.length === 0 && (
              <p className="text-center text-sm text-brand-muted py-10">
                {productos.length === 0 ? 'Aún no hay items. Pulsa "+ Nuevo item".' : 'Ningún item coincide con los filtros.'}
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
              <h3 className="font-serif text-xl font-bold text-brand-gold">{editId ? 'Editar item' : 'Nuevo item'}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label><span className={etiqueta}>Nombre</span><input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Set de la Tormenta Carmesí" className={campo} /></label>
              <label><span className={etiqueta}>Categoría</span>
                <select required value={form.categoria} onChange={(e) => set('categoria', e.target.value)} className={campo}>
                  {!form.categoria && <option value="">Elige una categoría</option>}
                  {form.categoria && !opciones.some((c) => c.nombre === form.categoria) && <option value={form.categoria}>{form.categoria}</option>}
                  {opciones.map((c) => <option key={c.id} value={c.nombre}>{c.emoji} {c.nombre}</option>)}
                </select>
                <button type="button" onClick={() => setVista('cats')} className="text-[11px] text-brand-gold underline mt-1">Administrar categorías</button>
              </label>
              <label><span className={etiqueta}>Héroe</span><input value={form.heroe} onChange={(e) => set('heroe', e.target.value)} placeholder="Ej: Juggernaut (vacío si no aplica)" className={campo} /></label>
              <label><span className={etiqueta}>Rareza</span>
                <select value={form.rareza} onChange={(e) => set('rareza', e.target.value)} className={campo} style={{ color: colorRareza(form.rareza) }}>
                  <option value="">Sin rareza</option>
                  {RAREZAS.map((r) => <option key={r.nombre} value={r.nombre} style={{ color: r.color }}>{r.nombre}</option>)}
                </select>
              </label>
            </div>

            <label className="block"><span className={etiqueta}>Precio (S/)</span><input required type="number" step="0.01" min="0" value={form.precio} onChange={(e) => set('precio', e.target.value)} placeholder="25.00" className={campo} /></label>
            <label className="block"><span className={etiqueta}>Descripción</span><textarea rows="3" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Piezas incluidas, estilos desbloqueables, efectos…" className={campo} /></label>

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

            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.disponible} onChange={(e) => set('disponible', e.target.checked)} className="accent-brand-red" /> Visible en la tienda</label>

            {/* Botones fijos abajo */}
            <div className="sticky bottom-0 bg-brand-panel border-t border-brand-borde py-3 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={volver} className="px-4 py-2 text-xs font-semibold text-brand-text bg-brand-panel2 hover:bg-brand-borde rounded-lg">Cancelar</button>
              {!editId && (
                <button data-otro="si" disabled={guardando} className="px-4 py-2 text-xs font-semibold text-brand-gold border border-brand-gold/60 hover:bg-brand-gold/10 rounded-lg disabled:opacity-60">Guardar y crear otro</button>
              )}
              <button disabled={guardando} className="px-5 py-2 text-xs font-semibold text-white bg-brand-red hover:bg-brand-redDark rounded-lg shadow disabled:opacity-60">
                {guardando ? 'Guardando…' : editId ? 'Actualizar item' : 'Guardar item'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
