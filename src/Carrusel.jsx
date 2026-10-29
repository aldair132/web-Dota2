import { useEffect, useRef, useState } from 'react'

export default function Carrusel({ fotos, alt, className = 'aspect-square', intervalo = 4000 }) {
  const pista = useRef(null)
  const desfase = useRef(Math.random() * 1500) // evita que todas las cards cambien a la vez
  const [i, setI] = useState(0)
  const [pausa, setPausa] = useState(false)
  const n = fotos?.length || 0

  const ir = (k, suave = true) => {
    const el = pista.current
    if (!el || n === 0) return
    const idx = (k + n) % n
    el.scrollTo({ left: idx * el.clientWidth, behavior: suave ? 'smooth' : 'auto' })
  }

  // Si cambia la cantidad de fotos (al editar), vuelve a la primera
  useEffect(() => {
    setI(0)
    pista.current?.scrollTo({ left: 0 })
  }, [n])

  // Cambio automático: solo con 2 o más fotos
  useEffect(() => {
    if (n < 2 || pausa) return
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setInterval(() => {
      const el = pista.current
      if (!el || document.hidden) return
      ir(Math.round(el.scrollLeft / el.clientWidth) + 1, !reducir)
    }, intervalo + desfase.current)
    return () => clearInterval(t)
  }, [n, pausa, intervalo])

  const onScroll = () => setI(Math.round(pista.current.scrollLeft / pista.current.clientWidth))
  const pausar = () => setPausa(true)
  const reanudar = () => setTimeout(() => setPausa(false), 3000)

  if (!n) {
    return <div className={`${className} grid place-items-center bg-brand-panel2 text-brand-gold font-serif text-xl`}>Ancient Shop</div>
  }

  return (
    <div
      className={`relative bg-brand-panel2 ${className}`}
      onMouseEnter={pausar} onMouseLeave={() => setPausa(false)}
      onFocusCapture={(e) => e.target.matches(':focus-visible') && pausar()}
      onBlurCapture={() => setPausa(false)}
      onTouchStart={pausar} onTouchEnd={reanudar}
    >
      <div
        ref={pista}
        onScroll={onScroll}
        className="flex h-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {fotos.map((src, k) => (
          <img key={src} src={src} alt={`${alt} (foto ${k + 1})`} loading="lazy"
               className="h-full w-full shrink-0 snap-center object-cover" />
        ))}
      </div>

      {n > 1 && (
        <>
          <button onClick={() => ir(i - 1)} aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-brand-gold text-2xl leading-none hover:bg-black/80 border border-brand-borde">‹</button>
          <button onClick={() => ir(i + 1)} aria-label="Foto siguiente"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-brand-gold text-2xl leading-none hover:bg-black/80 border border-brand-borde">›</button>
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
            {fotos.map((_, k) => (
              <button key={k} onClick={() => ir(k)} aria-label={`Ir a la foto ${k + 1}`}
                      className={`w-2 h-2 rounded-full ${k === i ? 'bg-brand-gold' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}