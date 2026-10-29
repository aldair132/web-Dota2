export const TIENDA = 'Ancient Shop'

export const soles = (n) => `S/ ${Number(n).toFixed(2)}`

export const WHATSAPP_NUMERO = '+51936848270' // ← cambia por tu número

export const HORARIO = 'Lunes a domingo, 10:00 a. m. – 11:00 p. m.' // ← tu horario de atención

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

export const ATRIBUTOS = [
  { nombre: 'Fuerza', color: '#E5533D', icono: '💪' },
  { nombre: 'Agilidad', color: '#3FBF5A', icono: '🏹' },
  { nombre: 'Inteligencia', color: '#3FA9E5', icono: '🔮' },
  { nombre: 'Universal', color: '#D4A64A', icono: '✴️' },
]
export const colorAtributo = (a) => ATRIBUTOS.find((x) => x.nombre === a)?.color || '#8C95A3'

// Etiquetas que se pueden poner a un item desde el admin
export const ETIQUETAS = [
  { nombre: 'Oferta', color: '#C23C2A' },
  { nombre: 'Nuevo', color: '#2E9E6A' },
  { nombre: 'Más vendido', color: '#B8862E' },
  { nombre: 'Últimas unidades', color: '#7A3FE0' },
]
export const colorEtiqueta = (e) => ETIQUETAS.find((x) => x.nombre === e)?.color || '#2A3342'

// Métodos de pago que se muestran en la web (edítalos a tu gusto)
export const METODOS_PAGO = [
  { nombre: 'Yape', color: '#742284' },
  { nombre: 'Plin', color: '#00A3B4' },
  { nombre: 'BCP', color: '#0F3B8C' },
  { nombre: 'Interbank', color: '#00884A' },
  { nombre: 'Transferencia', color: '#2A3342' },
]

export const PASOS_COMPRA = [
  { titulo: 'Elige tus items', texto: 'Agrégalos al carrito y envíanos el pedido por WhatsApp con un solo clic.' },
  { titulo: 'Paga fácil', texto: 'Te confirmamos disponibilidad y pagas por Yape, Plin o transferencia.' },
  { titulo: 'Recibe en Steam', texto: 'Te enviamos una solicitud de intercambio y el item llega a tu inventario.' },
]

export const PREGUNTAS = [
  { p: '¿Cuánto demora la entrega?', r: 'Normalmente entre 5 y 30 minutos después de confirmar el pago, en horario de atención.' },
  { p: '¿Qué es el bloqueo de intercambio de Steam?', r: 'Steam puede retener por unos días los items recién intercambiados, y si tu cuenta no tiene Steam Guard activo hace tiempo el intercambio puede quedar en espera. Te avisamos antes de enviarlo.' },
  { p: '¿Qué necesito para recibir el item?', r: 'Tu enlace de intercambio de Steam (Inventario → Ofertas de intercambio → ¿Quién puede enviarme ofertas?) y que tu inventario sea público.' },
  { p: '¿Tienen garantía?', r: 'Sí. Si el intercambio no llega o hay algún problema, te devolvemos el dinero o te enviamos otro item del mismo valor.' },
  { p: '¿Puedo pedir un item que no está en el catálogo?', r: 'Claro. Escríbenos por WhatsApp con el nombre del item y te lo cotizamos.' },
]

// Se puede comprar si no está marcado como vendido y queda stock (stock vacío = sin límite)
export const puedeComprar = (p) => !p.vendido && (p.stock == null || p.stock > 0)
export const maxCantidad = (p) => (p.stock == null ? 10 : p.stock)

export const enlaceWhatsApp = (p) => {
  const lineas = [`Hola, me interesa este item de ${TIENDA}:`, `*${p.nombre}*`]
  if (p.heroe) lineas.push(`Héroe: ${p.heroe}`)
  if (p.rareza) lineas.push(`Rareza: ${p.rareza}`)
  if (p.precio != null) lineas.push(`Precio: ${soles(p.precio)}`)
  if (p.id) lineas.push(`${window.location.origin}/p/${p.id}`)
  lineas.push('¿Está disponible?')
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(lineas.join('\n'))}`
}

export const enlaceCarrito = (lineas, total) => {
  const texto = [
    `Hola, quiero hacer este pedido en ${TIENDA}:`,
    '',
    ...lineas.map(({ p, cant }) => `• ${cant} x *${p.nombre}*${p.heroe ? ` (${p.heroe})` : ''} — ${soles(p.precio * cant)}`),
    '',
    `*Total: ${soles(total)}*`,
    '',
    'Mi enlace de intercambio de Steam es: ',
  ]
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto.join('\n'))}`
}

// Acepta enlaces de YouTube (watch, youtu.be, shorts, embed) y devuelve el id del video
export const idYoutube = (url = '') =>
  (url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/))([\w-]{11})/)?.[1] || null

// Items de ejemplo para ver la tienda antes de conectar Supabase
const item = (id, nombre, categoria, heroe, atributo, rareza, precio, descripcion, extra = {}) =>
  ({ id: `00000000-0000-0000-0000-00000000000${id}`, nombre, categoria, heroe, atributo, rareza, precio, descripcion, fotos: [], disponible: true, creado_en: `2026-10-0${id}`, ...extra })
export const DEMO = {
  categorias: [
    { id: 'a', nombre: 'Arcanas', emoji: '🌟' }, { id: 'i', nombre: 'Inmortales', emoji: '🏆' },
    { id: 's', nombre: 'Sets', emoji: '🛡️' }, { id: 'c', nombre: 'Couriers', emoji: '🐉' },
  ],
  productos: [
    item(1, 'Arcana de ejemplo', 'Arcanas', 'Juggernaut', 'Agilidad', 'Arcana', 120, 'Modelo, animaciones y efectos nuevos para tu héroe.', { precio_antes: 150, etiqueta: 'Oferta', destacado: true }),
    item(2, 'Arma inmortal de ejemplo', 'Inmortales', 'Phantom Assassin', 'Agilidad', 'Inmortal', 35, 'Arma con efecto especial en golpes críticos.', { etiqueta: 'Más vendido', destacado: true }),
    item(3, 'Set legendario de ejemplo', 'Sets', 'Pudge', 'Fuerza', 'Legendaria', 18.5, 'Set completo de 5 piezas.', { etiqueta: 'Nuevo' }),
    item(4, 'Set mítico de ejemplo', 'Sets', 'Crystal Maiden', 'Inteligencia', 'Mítica', 9.9, 'Set de 4 piezas con estilo alternativo.', { stock: 1, etiqueta: 'Últimas unidades' }),
    item(5, 'Courier de ejemplo', 'Couriers', '', null, 'Rara', 12, 'Courier con efecto de partículas.', { vendido: true }),
    item(6, 'Hombreras inmortales de ejemplo', 'Inmortales', 'Lina', 'Inteligencia', 'Inmortal', 28, 'Pieza inmortal con estilos desbloqueables.', { destacado: true }),
  ],
  testimonios: [
    { id: 't1', nombre: 'Cliente de ejemplo', texto: 'Me llegó la arcana en 10 minutos. Todo muy confiable.', foto: null },
    { id: 't2', nombre: 'Otro cliente', texto: 'Buenos precios y me explicaron todo sobre el intercambio.', foto: null },
  ],
}
