export const TIENDA = 'Ancient Shop'

export const soles = (n) => `S/ ${Number(n).toFixed(2)}`

export const WHATSAPP_NUMERO = '+51936848270' // ← cambia por tu número

// Rarezas de Dota 2 con su color característico
export const RAREZAS = [
  { nombre: 'Común', color: '#B0C3D9' },
  { nombre: 'Poco común', color: '#5E98D9' },
  { nombre: 'Rara', color: '#4B69FF' },
  { nombre: 'Mítica', color: '#8847FF' },
  { nombre: 'Legendaria', color: '#D32CE6' },
  { nombre: 'Inmortal', color: '#E4AE39' },
  { nombre: 'Arcana', color: '#ADE55C' },
]
export const colorRareza = (r) => RAREZAS.find((x) => x.nombre === r)?.color || '#8C95A3'

export const enlaceWhatsApp = (p) => {
  const lineas = [`Hola, me interesa este item de ${TIENDA}:`, `*${p.nombre}*`]
  if (p.heroe) lineas.push(`Héroe: ${p.heroe}`)
  if (p.rareza) lineas.push(`Rareza: ${p.rareza}`)
  if (p.precio != null) lineas.push(`Precio: ${soles(p.precio)}`)
  lineas.push(`${window.location.origin}/p/${p.id}`)
  lineas.push('¿Está disponible?')
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(lineas.join('\n'))}`
}

// Items de ejemplo para ver la tienda antes de conectar Supabase
const item = (id, nombre, categoria, heroe, rareza, precio, descripcion) =>
  ({ id: `00000000-0000-0000-0000-00000000000${id}`, nombre, categoria, heroe, rareza, precio, descripcion, fotos: [], disponible: true })
export const DEMO = {
  categorias: [
    { id: 'a', nombre: 'Arcanas', emoji: '🌟' }, { id: 'i', nombre: 'Inmortales', emoji: '🏆' },
    { id: 's', nombre: 'Sets', emoji: '🛡️' }, { id: 'c', nombre: 'Couriers', emoji: '🐉' },
  ],
  productos: [
    item(1, 'Arcana de ejemplo', 'Arcanas', 'Juggernaut', 'Arcana', 120, 'Modelo, animaciones y efectos nuevos para tu héroe.'),
    item(2, 'Arma inmortal de ejemplo', 'Inmortales', 'Phantom Assassin', 'Inmortal', 35, 'Arma con efecto especial en golpes críticos.'),
    item(3, 'Set legendario de ejemplo', 'Sets', 'Pudge', 'Legendaria', 18.5, 'Set completo de 5 piezas.'),
    item(4, 'Set mítico de ejemplo', 'Sets', 'Crystal Maiden', 'Mítica', 9.9, 'Set de 4 piezas con estilo alternativo.'),
    item(5, 'Courier de ejemplo', 'Couriers', '', 'Rara', 12, 'Courier con efecto de partículas.'),
    item(6, 'Hombreras inmortales de ejemplo', 'Inmortales', 'Lina', 'Inmortal', 28, 'Pieza inmortal con estilos desbloqueables.'),
  ],
}
