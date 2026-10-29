import { useState } from 'react'
import { supabase } from './supabase.js'
import Icono from './Icons.jsx'

const campo = 'w-full px-3 py-2 text-sm border border-brand-borde rounded-lg focus:outline-none focus:border-brand-gold bg-brand-bg text-brand-text placeholder:text-brand-muted'
const etiqueta = 'block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1'

export default function Categorias({ categorias, productos, onCambio, onVolver }) {
  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState('')
  const [editId, setEditId] = useState(null)
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const usos = (n) => productos.filter((p) => p.categoria === n).length
  const limpiar = () => { setNombre(''); setEmoji(''); setEditId(null) }

  const guardar = async (e) => {
    e.preventDefault()
    const n = nombre.trim()
    if (!n) return
    setOcupado(true)
    setMsg('')
    try {
      if (editId) {
        const previa = categorias.find((c) => c.id === editId)
        const { error } = await supabase.from('categorias').update({ nombre: n, emoji: emoji.trim() }).eq('id', editId)
        if (error) throw error
        // Si cambió el nombre, los productos de esa categoría se actualizan también
        if (previa && previa.nombre !== n) {
          const { error: e2 } = await supabase.from('productos').update({ categoria: n }).eq('categoria', previa.nombre)
          if (e2) throw e2
        }
        setMsg('Categoría actualizada.')
      } else {
        const orden = categorias.length ? Math.max(...categorias.map((c) => c.orden || 0)) + 1 : 1
        const { error } = await supabase.from('categorias').insert({ nombre: n, emoji: emoji.trim(), orden })
        if (error) throw error
        setMsg('Categoría creada.')
      }
      limpiar()
      onCambio()
    } catch (err) {
      setMsg(err.code === '23505' ? 'Ya existe una categoría con ese nombre.' : 'No se pudo guardar: ' + err.message)
    } finally {
      setOcupado(false)
    }
  }

  const editar = (c) => { setEditId(c.id); setNombre(c.nombre); setEmoji(c.emoji || ''); setMsg('') }

  const borrar = async (c) => {
    const n = usos(c.nombre)
    if (n > 0) { setMsg(`"${c.nombre}" tiene ${n} producto(s). Cámbiales la categoría antes de borrarla.`); return }
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return
    const { error } = await supabase.from('categorias').delete().eq('id', c.id)
    setMsg(error ? 'No se pudo eliminar: ' + error.message : 'Categoría eliminada.')
    if (editId === c.id) limpiar()
    onCambio()
  }

  const mover = async (i, dir) => {
    const a = categorias[i]
    const b = categorias[i + dir]
    if (!a || !b) return
    await Promise.all([
      supabase.from('categorias').update({ orden: b.orden }).eq('id', a.id),
      supabase.from('categorias').update({ orden: a.orden }).eq('id', b.id),
    ])
    onCambio()
  }

  return (
    <div className="max-w-2xl mx-auto pb-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onVolver} className="text-sm text-brand-gold underline">← Volver a la lista</button>
        <h3 className="font-serif text-xl font-bold text-brand-gold">Categorías</h3>
      </div>

      {msg && <p role="status" className="text-sm bg-brand-red/15 text-brand-gold border border-brand-red/40 rounded-lg px-3 py-2">{msg}</p>}

      <form onSubmit={guardar} className="flex flex-col sm:flex-row gap-2 sm:items-end bg-brand-panel2 p-3 rounded-xl border border-brand-borde">
        <label className="flex-1"><span className={etiqueta}>Nombre</span><input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Couriers" className={campo} /></label>
        <label className="sm:w-24"><span className={etiqueta}>Emoji</span><input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🐉" maxLength={4} className={campo} /></label>
        <div className="flex gap-2">
          {editId && <button type="button" onClick={limpiar} className="px-3 py-2 text-xs font-semibold text-brand-text bg-brand-panel2 hover:bg-brand-borde rounded-lg">Cancelar</button>}
          <button disabled={ocupado} className="px-4 py-2 text-xs font-semibold text-white bg-brand-red hover:bg-brand-redDark rounded-lg disabled:opacity-60">{editId ? 'Actualizar' : 'Agregar'}</button>
        </div>
      </form>

      <ul className="space-y-2">
        {categorias.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3 p-3 bg-brand-panel2 border border-brand-borde rounded-xl">
            <span className="text-xl w-8 text-center">{c.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-text truncate">{c.nombre}</p>
              <p className="text-xs text-brand-muted">{usos(c.nombre)} producto(s)</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${c.nombre}`} className="w-8 h-8 rounded-lg text-brand-muted hover:bg-brand-borde disabled:opacity-30">↑</button>
              <button onClick={() => mover(i, 1)} disabled={i === categorias.length - 1} aria-label={`Bajar ${c.nombre}`} className="w-8 h-8 rounded-lg text-brand-muted hover:bg-brand-borde disabled:opacity-30">↓</button>
              <button onClick={() => editar(c)} aria-label={`Editar ${c.nombre}`} className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 p-2 rounded-lg"><Icono n="edit" /></button>
              <button onClick={() => borrar(c)} aria-label={`Eliminar ${c.nombre}`} className="bg-red-500/10 text-red-300 hover:bg-red-500/20 p-2 rounded-lg"><Icono n="trash" /></button>
            </div>
          </li>
        ))}
        {categorias.length === 0 && <p className="text-center text-sm text-brand-muted py-6">No hay categorías. Agrega la primera arriba.</p>}
      </ul>
    </div>
  )
}