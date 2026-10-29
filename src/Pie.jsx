import { TIENDA, WHATSAPP_NUMERO, HORARIO, enlaceWhatsApp } from './datos.js'
import { DISCORD_URL } from './supabase.js'
import { Logo } from './Encabezado.jsx'
import Icono from './Icons.jsx'

const titulo = 'font-serif text-sm font-bold text-brand-gold uppercase tracking-wider mb-3'
const enlace = 'text-sm text-brand-muted hover:text-brand-gold transition'

export default function Pie({ enlaces, onAdmin }) {
  return (
    <footer id="contacto" className="bg-brand-panel border-t border-brand-borde scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo chico />
          <p className="text-sm text-brand-muted mt-4 max-w-xs leading-relaxed">
            Sets completos de Dota 2 para todos los héroes, a buen precio y con entrega por intercambio de Steam.
          </p>
        </div>

        <div>
          <h2 className={titulo}>Navegación</h2>
          <ul className="space-y-2">
            {enlaces.map((e) => <li key={e.href}><a href={e.href} className={enlace}>{e.texto}</a></li>)}
          </ul>
        </div>

        <div>
          <h2 className={titulo}>Ayuda</h2>
          <ul className="space-y-2">
            <li><a href="#como-comprar" className={enlace}>Cómo comprar</a></li>
            <li><a href="#preguntas" className={enlace}>Preguntas frecuentes</a></li>
            <li><a href={enlaceWhatsApp({ nombre: 'Consulta sobre un pedido' })} target="_blank" rel="noopener noreferrer" className={enlace}>Estado de mi pedido</a></li>
          </ul>
        </div>

        <div>
          <h2 className={titulo}>Contacto</h2>
          <ul className="space-y-3 text-sm text-brand-muted">
            <li>
              <a href={enlaceWhatsApp({ nombre: 'Consulta general' })} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 bg-[#128C7E] hover:bg-[#0f7367] text-white px-4 py-2 rounded-lg font-semibold transition">
                <Icono n="chat" /> {WHATSAPP_NUMERO.replace(/^\+51(\d{3})(\d{3})(\d{3})$/, '+51 $1 $2 $3')}
              </a>
            </li>
            {DISCORD_URL && <li><a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className={enlace}>Únete a nuestro Discord</a></li>}
            <li className="flex items-start gap-2"><Icono n="bolt" className="w-4 h-4 mt-0.5 text-brand-gold shrink-0" />{HORARIO}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brand-borde">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-brand-muted text-center sm:text-left">
          <span>© 2026 {TIENDA}. Todos los derechos reservados.</span>
          <span className="flex items-center gap-2">
            Tienda independiente. Dota 2 es una marca de Valve Corporation.
            <button onClick={onAdmin} aria-label="Acceso administrador" className="text-brand-borde hover:text-brand-gold p-1"><Icono n="lock" className="w-3.5 h-3.5" /></button>
          </span>
        </div>
      </div>
    </footer>
  )
}
