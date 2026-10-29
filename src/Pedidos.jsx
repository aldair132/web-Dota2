import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase.js'
import { soles } from './datos.js'
import { campo, etiqueta, btnPrimario, btnSecundario } from './adminUi.js'
import Icono from './Icons.jsx'

const hoy = () => new Date().toLocaleDateString('en-CA') // AAAA-MM-DD en hora local
const VACIO = { cliente: '', productoId: '', detalle: '', total: '', fecha: hoy(), nota: '', descontar: true }

export default function Pedidos({ productos, onCambio }) {
  const [lista, setLista] = useState([])
  const [mes, setMes] = useState(hoy().slice(0, 7))
  const [form, setForm] = useState(VACIO)
  const [abierto, setAbierto] = useState(false)
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(async () => {
    const [a, m] = mes.split('-').map(Number)
    const fin = new Date(a, m, 1).toLocaleDateString('en-CA') // primer día del mes siguiente
    const { data, error } = await supabase.from('pedidos').select('*')
      .gte('fecha', `${mes}-01`).lt('fecha', fin)
      .order('fecha', { ascending: false }).order('creado_en', { ascending: false })
    if (error) setMsg('No se pudieron cargar los pedidos. ¿Ejecutaste el supabase.sql actualizado?')
    else setLista(data)
  }, [mes])
  useEffect(() => { cargar() }, [cargar])

  const total = useMemo(() => lista.reduce((s, p) => s + Number(p.total || 0), 0), [lista])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Elegir un item del catálogo rellena detalle y total
  const elegir = (id) => {
    const p = productos.find((x) => x.id === id)
    setForm((f) => ({ ...f, productoId: id, detalle: p ? p.nombre : f.detalle, total: p?.precio ?? f.total }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    setOcupado(true)
    setMsg('')
    try {
      const { error } = await supabase.from('pedidos').insert({
        cliente: form.cliente.trim(), detalle: form.detalle.trim(), total: Number(form.total || 0), fecha: form.fecha, nota: form.nota.trim() || null,
      })
      if (error) throw error

      // Descuenta 1 del stock, o marca como vendido si el item no lleva stock
      const p = productos.find((x) => x.id === form.productoId)
      if (p && form.descontar) {
        const cambio = p.stock != null ? { stock: Math.max(0, p.stock - 1) } : { vendido: true }
        await supabase.from('productos').update(cambio).eq('id', p.id)
        onCambio()
      }
      setMsg('Venta registrada.')
      setForm({ ...VACIO, fecha: form.fecha })
      setAbierto(false)
      if (form.fecha.slice(0, 7) !== mes) setMes(form.fecha.slice(0, 7))
      else cargar()
    } catch (err) {
      setMsg('No se pudo guardar: ' + err.message)
    } finally {
      setOcupado(false)
    }
  }

  const borrar = async (p) => {
    if (!confirm(`¿Eliminar la venta a "${p.cliente}"?`)) return
    const { error } = await supabase.from('pedidos').delete().eq('id', p.id)
    setMsg(error ? 'No se pudo eliminar: ' + error.message : 'Venta eliminada.')
    cargar()
  }

  const elegido = productos.find((x) => x.id === form.productoId)

  return (
    <div className="max-w-3xl mx-auto pb-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <label className="sm:w-48"><span className={etiqueta}>Mes</span><input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} className={campo} /></label>
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="bg-brand-panel2 border border-brand-borde rounded-xl px-4 py-2">
            <span className="text-[11px] text-brand-muted uppercase tracking-wider">Vendido en el mes</span>
            <p className="font-serif text-2xl font-bold text-brand-gold">{soles(total)}</p>
          </div>
          <div className="bg-brand-panel2 border border-brand-borde rounded-xl px-4 py-2">
            <span className="text-[11px] text-brand-muted uppercase tracking-wider">Ventas</span>
            <p className="font-serif text-2xl font-bold text-brand-text">{lista.length}</p>
          </div>
        </div>
        {!abierto && <button onClick={() => { setAbierto(true); setMsg('') }} className={`${btnPrimario} py-3`}>+ Registrar venta</button>}
      </div>

      {msg && <p role="status" className="text-sm bg-brand-red/15 text-brand-gold border border-brand-red/40 rounded-lg px-3 py-2">{msg}</p>}

      {abierto && (
        <form onSubmit={guardar} className="bg-brand-panel2 p-4 rounded-xl border border-brand-borde space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label><span className={etiqueta}>Cliente</span><input required value={form.cliente} onChange={(e) => set('cliente', e.target.value)} placeholder="Nombre o número" className={campo} /></label>
            <label><span className={etiqueta}>Fecha</span><input required type="date" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} className={campo} /></label>
          </div>
          <label className="block"><span className={etiqueta}>Item del catálogo (opcional)</span>
            <select value={form.productoId} onChange={(e) => elegir(e.target.value)} className={campo}>
              <option value="">— Escribir manualmente —</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.precio != null ? ` · ${soles(p.precio)}` : ''}</option>)}
            </select>
          </label>
          <div className="grid sm:grid-cols-[1fr_10rem] gap-3">
            <label><span className={etiqueta}>Detalle</span><input required value={form.detalle} onChange={(e) => set('detalle', e.target.value)} placeholder="Ej: Arcana Juggernaut + courier" className={campo} /></label>
            <label><span className={etiqueta}>Total (S/)</span><input required type="number" step="0.01" min="0" value={form.total} onChange={(e) => set('total', e.target.value)} className={campo} /></label>
          </div>
          <label className="block"><span className={etiqueta}>Nota</span><input value={form.nota} onChange={(e) => set('nota', e.target.value)} placeholder="Método de pago, Steam del cliente…" className={campo} /></label>
          {elegido && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.descontar} onChange={(e) => set('descontar', e.target.checked)} className="accent-brand-red" />
              {elegido.stock != null ? `Descontar 1 del stock (quedan ${elegido.stock})` : 'Marcar el item como vendido'}
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setAbierto(false); setForm(VACIO) }} className={btnSecundario}>Cancelar</button>
            <button disabled={ocupado} className={btnPrimario}>{ocupado ? 'Guardando…' : 'Guardar venta'}</button>
          </div>
        </form>
      )}

      <ul className="space-y-2">
        {lista.map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-3 bg-brand-panel2 border border-brand-borde rounded-xl">
            <span className="text-[11px] text-brand-muted w-12 shrink-0 text-center leading-tight">{p.fecha.slice(8, 10)}/{p.fecha.slice(5, 7)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.detalle}</p>
              <p className="text-xs text-brand-muted truncate">{p.cliente}{p.nota ? ` · ${p.nota}` : ''}</p>
            </div>
            <span className="font-bold text-brand-gold text-sm shrink-0">{soles(p.total)}</span>
            <button onClick={() => borrar(p)} aria-label={`Eliminar venta a ${p.cliente}`} className="bg-red-500/10 text-red-300 hover:bg-red-500/20 p-2 rounded-lg"><Icono n="trash" /></button>
          </li>
        ))}
        {lista.length === 0 && <p className="text-center text-sm text-brand-muted py-6">No hay ventas registradas en este mes.</p>}
      </ul>
    </div>
  )
}
