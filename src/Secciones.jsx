import { PASOS_COMPRA, PREGUNTAS, METODOS_PAGO } from './datos.js'
import Icono from './Icons.jsx'

const Titulo = ({ children, sub }) => (
  <div className="text-center mb-8">
    <h2 className="font-serif text-2xl sm:text-4xl font-bold texto-oro">{children}</h2>
    {sub && <p className="text-sm text-brand-muted mt-2">{sub}</p>}
  </div>
)

export function ComoComprar() {
  return (
    <section id="como-comprar" className="border-t border-brand-borde bg-brand-panel/40 py-12 sm:py-16 px-4 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <Titulo sub="Comprar es rápido y seguro">¿Cómo comprar?</Titulo>
        <ol className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {PASOS_COMPRA.map((s, i) => (
            <li key={s.titulo} className="relative bg-brand-panel border border-brand-borde rounded-xl p-5 pt-8">
              <span className="absolute -top-4 left-5 w-9 h-9 rotate-45 bg-brand-red border-2 border-brand-gold grid place-items-center">
                <span className="-rotate-45 font-serif font-black text-white">{i + 1}</span>
              </span>
              <h3 className="font-serif text-lg font-bold text-brand-gold mb-1">{s.titulo}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">{s.texto}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-brand-muted uppercase tracking-wider mr-1">Aceptamos</span>
          <MetodosPago />
        </div>

        <div id="preguntas" className="mt-12 max-w-3xl mx-auto scroll-mt-24">
          <h3 className="font-serif text-xl font-bold text-brand-gold text-center mb-4">Preguntas frecuentes</h3>
          <div className="space-y-2">
            {PREGUNTAS.map((f) => (
              <details key={f.p} className="group bg-brand-panel border border-brand-borde rounded-xl open:border-brand-gold/50">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 font-semibold text-sm">
                  {f.p}
                  <Icono n="plus" className="w-4 h-4 shrink-0 text-brand-gold transition-transform group-open:rotate-45" />
                </summary>
                <p className="px-4 pb-4 text-sm text-brand-muted leading-relaxed">{f.r}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function MetodosPago() {
  return METODOS_PAGO.map((m) => (
    <span key={m.nombre} className="text-white text-xs font-bold px-3 py-1.5 rounded-md border border-white/10" style={{ background: m.color }}>
      {m.nombre}
    </span>
  ))
}

export function Testimonios({ lista }) {
  if (!lista.length) return null
  return (
    <section className="border-t border-brand-borde py-12 sm:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <Titulo sub="Lo que dicen nuestros clientes">Clientes satisfechos</Titulo>
        {/* Centrado aunque haya pocos testimonios */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {lista.map((t) => (
            <figure key={t.id} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-brand-panel border border-brand-borde rounded-xl overflow-hidden flex flex-col">
              {t.foto && <img src={t.foto} alt={`Captura de ${t.nombre}`} loading="lazy" className="w-full aspect-video object-cover" />}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex gap-0.5 text-brand-gold mb-2" aria-label="5 estrellas">
                  {[0, 1, 2, 3, 4].map((k) => <Icono key={k} n="star" className="w-4 h-4 fill-current" />)}
                </div>
                <blockquote className="text-sm text-brand-text/90 leading-relaxed flex-1">“{t.texto}”</blockquote>
                <figcaption className="mt-3 text-xs font-semibold text-brand-gold">— {t.nombre}</figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
