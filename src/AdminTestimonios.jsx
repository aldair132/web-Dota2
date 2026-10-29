import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { campo, etiqueta, btnPrimario, btnSecundario, subirImagen, borrarImagenes } from './adminUi.js'
import Icono from './Icons.jsx'

const VACIO = { nombre: '', texto: '', visible: true, foto: null }

export default function AdminTestimonios({ onCambio }) {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState(VACIO)
  const [archivo, setArchivo] = useState(null)
  const [editId, setEditId] = useState(null)
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('testimonios').select('*').order('creado_en', { ascending: false })
    if (error) setMsg('No se pudieron cargar. ¿Ejecutaste el supabase.sql actualizado?')
    else setLista(data)
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const limpiar = () => { setForm(VACIO); setArchivo(null); setEditId(null) }
  const recargar = () => { cargar(); onCambio() }

  const guardar = async (e) => {
    e.preventDefault()
    setOcupado(true)
    setMsg('')
    try {
      const anterior = editId ? lista.find((t) => t.id === editId)?.foto : null
      const foto = archivo ? await subirImagen(archivo, 'testimonios/') : form.foto
      const fila = { nombre: form.nombre.trim(), texto: form.texto.trim(), visible: form.visible, foto }
      const { error } = editId
        ? await supabase.from('testimonios').update(fila).eq('id', editId)
        : await supabase.from('testimonios').insert(fila)
      if (error) throw error
      if (anterior && anterior !== foto) await borrarImagenes([anterior])
      setMsg(editId ? 'Testimonio actualizado.' : 'Testimonio agregado.')
      limpiar()
      recargar()
    } catch (err) {
      setMsg('No se pudo guardar: ' + err.message)
    } finally {
      setOcupado(false)
    }
  }

  const editar = (t) => { setEditId(t.id); setForm({ nombre: t.nombre, texto: t.texto, visible: t.visible, foto: t.foto }); setArchivo(null); setMsg('') }

  const borrar = async (t) => {
    if (!confirm(`¿Eliminar el testimonio de "${t.nombre}"?`)) return
    const { error } = await supabase.from('testimonios').delete().eq('id', t.id)
    if (!error) await borrarImagenes([t.foto])
    setMsg(error ? 'No se pudo eliminar: ' + error.message : 'Testimonio eliminado.')
    if (editId === t.id) limpiar()
    recargar()
  }

  const alternar = async (t) => {
    await supabase.from('testimonios').update({ visible: !t.visible }).eq('id', t.id)
    recargar()
  }

  return (
    <div className="max-w-2xl mx-auto pb-6 space-y-4">
      <p className="text-sm text-brand-muted">Opiniones de clientes o capturas de intercambios completados. Se muestran en la tienda debajo de "¿Cómo comprar?".</p>
      {msg && <p role="status" className="text-sm bg-brand-red/15 text-brand-gold border border-brand-red/40 rounded-lg px-3 py-2">{msg}</p>}

      <form onSubmit={guardar} className="bg-brand-panel2 p-4 rounded-xl border border-brand-borde space-y-3">
        <label className="block"><span className={etiqueta}>Nombre del cliente</span><input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Carlos M." className={campo} /></label>
        <label className="block"><span className={etiqueta}>Comentario</span><textarea required rows="2" value={form.texto} onChange={(e) => set('texto', e.target.value)} placeholder="Ej: Me llegó en 10 minutos, todo perfecto." className={campo} /></label>
        <div>
          <span className={etiqueta}>Captura (opcional)</span>
          {form.foto && !archivo && (
            <div className="flex items-center gap-2 mb-2">
              <img src={form.foto} alt="" className="w-28 h-16 object-cover rounded-md border border-brand-borde" />
              <button type="button" onClick={() => set('foto', null)} className="text-xs text-red-300 underline">Quitar</button>
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => setArchivo(e.target.files[0] || null)}
                 className="text-xs text-brand-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-bg file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-gold" />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.visible} onChange={(e) => set('visible', e.target.checked)} className="accent-brand-red" /> Visible en la tienda</label>
        <div className="flex justify-end gap-2">
          {editId && <button type="button" onClick={limpiar} className={btnSecundario}>Cancelar</button>}
          <button disabled={ocupado} className={btnPrimario}>{ocupado ? 'Guardando…' : editId ? 'Actualizar' : 'Agregar testimonio'}</button>
        </div>
      </form>

      <ul className="space-y-2">
        {lista.map((t) => (
          <li key={t.id} className="flex items-center gap-3 p-3 bg-brand-panel2 border border-brand-borde rounded-xl">
            {t.foto ? <img src={t.foto} alt="" className="w-16 h-10 object-cover rounded shrink-0" /> : <Icono n="star" className="w-5 h-5 text-brand-gold shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{t.nombre}</p>
              <p className="text-xs text-brand-muted truncate">{t.texto}</p>
            </div>
            <button onClick={() => alternar(t)} className={`text-[11px] px-2 py-1 rounded ${t.visible ? 'text-green-300 bg-green-500/10' : 'text-brand-muted bg-brand-bg'}`}>{t.visible ? 'Visible' : 'Oculto'}</button>
            <button onClick={() => editar(t)} aria-label={`Editar testimonio de ${t.nombre}`} className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 p-2 rounded-lg"><Icono n="edit" /></button>
            <button onClick={() => borrar(t)} aria-label={`Eliminar testimonio de ${t.nombre}`} className="bg-red-500/10 text-red-300 hover:bg-red-500/20 p-2 rounded-lg"><Icono n="trash" /></button>
          </li>
        ))}
        {lista.length === 0 && <p className="text-center text-sm text-brand-muted py-6">Aún no hay testimonios.</p>}
      </ul>
    </div>
  )
}
