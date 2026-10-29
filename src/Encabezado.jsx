import { useEffect, useState } from 'react'
import { TIENDA } from './datos.js'
import { DISCORD_URL } from './supabase.js'
import Icono from './Icons.jsx'

export function Logo({ chico = false }) {
  return (
    <a href="#inicio" className="flex items-center gap-2 sm:gap-3 min-w-0">
      <span className={`${chico ? 'w-9 h-9' : 'w-10 h-10 sm:w-12 sm:h-12'} shrink-0 rotate-45 border-2 border-brand-gold bg-gradient-to-br from-brand-red to-brand-redDark flex items-center justify-center shadow-[0_0_18px_rgba(194,60,42,.5)]`}>
        <Icono n="sword" className={`${chico ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} -rotate-45 text-brand-gold`} />
      </span>
      <span className="min-w-0 ml-1">
        <span className={`font-serif font-black tracking-wider texto-oro block leading-none truncate ${chico ? 'text-xl' : 'text-xl sm:text-3xl'}`}>{TIENDA}</span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[.3em] text-brand-muted font-medium block truncate">Dota 2 Marketplace</span>
      </span>
    </a>
  )
}

export default function Encabezado({ enlaces, enCarrito, sesion, onCarrito, onAdmin }) {
  const [menu, setMenu] = useState(false)

  // Cierra el menú del celular al pasar a pantalla grande
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const cerrar = () => mq.matches && setMenu(false)
    mq.addEventListener('change', cerrar)
    return () => mq.removeEventListener('change', cerrar)
  }, [])

  return (
    <header className="sticky top-0 z-40 bg-brand-bg/90 backdrop-blur-md border-b border-brand-borde">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex justify-between items-center gap-2 h-16 sm:h-20">
        <Logo />

        <nav aria-label="Principal" className="hidden xl:flex items-center gap-1">
          {enlaces.map((e) => (
            <a key={e.href} href={e.href} className="whitespace-nowrap px-3 py-2 text-sm font-medium text-brand-text/80 hover:text-brand-gold rounded-lg hover:bg-brand-panel transition">{e.texto}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {DISCORD_URL && (
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer"
               className="hidden 2xl:inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              <Icono n="chat" /> Discord
            </a>
          )}
          {sesion && (
            <button onClick={onAdmin} aria-label="Gestionar tienda"
                    className="bg-brand-panel2 text-brand-gold hover:bg-brand-borde w-10 h-10 xl:w-auto xl:h-auto xl:px-3 xl:py-2 rounded-lg text-xs font-semibold border border-brand-borde transition flex items-center justify-center gap-1.5">
              <Icono n="sliders" />
              <span className="hidden xl:inline">Gestionar tienda</span>
            </button>
          )}
          <button onClick={onCarrito} aria-label={`Abrir carrito (${enCarrito} sets)`}
                  className="relative bg-brand-red hover:bg-brand-redDark text-white w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2">
            <Icono n="cart" className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Carrito</span>
            {enCarrito > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-brand-gold text-brand-bg text-[11px] font-black grid place-items-center">{enCarrito}</span>
            )}
          </button>
          <button onClick={() => setMenu((m) => !m)} aria-label={menu ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menu} aria-controls="menu-movil"
                  className="xl:hidden w-10 h-10 rounded-lg border border-brand-borde bg-brand-panel text-brand-text grid place-items-center">
            <Icono n={menu ? 'x' : 'menu'} className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Menú del celular */}
      {menu && (
        <nav id="menu-movil" aria-label="Principal" className="xl:hidden border-t border-brand-borde bg-brand-panel px-3 py-2">
          {enlaces.map((e) => (
            <a key={e.href} href={e.href} onClick={() => setMenu(false)}
               className="block px-3 py-3 text-sm font-semibold text-brand-text hover:text-brand-gold border-b border-brand-borde/60 last:border-0">{e.texto}</a>
          ))}
        </nav>
      )}
    </header>
  )
}
