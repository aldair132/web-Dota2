const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export default async function handler(req, res) {
  const id = String(req.query.id || '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) { res.redirect(302, '/'); return }

  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  let p = null
  try {
    const r = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/productos?id=eq.${id}&disponible=eq.true&select=nombre,heroe,rareza,precio,descripcion,fotos`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
    const data = await r.json()
    p = Array.isArray(data) ? data[0] : null
  } catch { /* si falla, se redirige a la tienda */ }
  if (!p) { res.redirect(302, '/'); return }

  const titulo = `${p.nombre}${p.precio != null ? ` · S/ ${Number(p.precio).toFixed(2)}` : ''}`
  const desc = (p.descripcion || [p.heroe, p.rareza].filter(Boolean).join(' · ') || 'Item de Dota 2').replace(/\s+/g, ' ').slice(0, 160)
  const img = p.fotos?.[0] || ''
  const destino = `/#/producto/${id}`
  const url = `https://${req.headers.host}/p/${id}`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>${esc(titulo)} | Ancient Shop</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ancient Shop">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
${img ? `<meta property="og:image" content="${esc(img)}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<meta http-equiv="refresh" content="0;url=${destino}">
</head><body>
<script>location.replace(${JSON.stringify(destino)})</script>
<a href="${destino}">Ver item</a>
</body></html>`)
}