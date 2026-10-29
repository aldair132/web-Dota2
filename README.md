# Ancient Shop (Dota 2)

Catálogo de items de Dota 2 con React + Vite + Supabase. Misma base que Alyz Shop.

**Tienda:** filtros por categoría, rareza, atributo y rango de precio · orden por precio, novedad o descuento · ofertas con precio tachado y etiquetas (Oferta, Nuevo, Más vendido, Últimas unidades) · sección de destacados · carrito que envía un solo pedido por WhatsApp · video de YouTube en el detalle · items vendidos/agotados · "¿Cómo comprar?", preguntas frecuentes, testimonios y métodos de pago.

**Panel admin** (`/#/admin` o el candado del pie de página): items (con héroe autocompletado, atributo, rareza, etiqueta, oferta, stock, video, destacado, vendido), categorías, testimonios y registro de ventas con total del mes.

Sin `.env` arranca en **modo demo** con items de ejemplo.

## Personalizar
- Número de WhatsApp, métodos de pago, pasos de compra y preguntas frecuentes: `src/datos.js`
- Lista de héroes del autocompletado: `src/heroes.js`
- Enlace de Discord (opcional): `src/supabase.js`
- Colores y fuentes: `tailwind.config.js`

## 1. Supabase
1. SQL Editor → pega y ejecuta `supabase.sql`. Se puede ejecutar varias veces: **cada vez que actualices el proyecto, vuelve a ejecutarlo** para crear las columnas y tablas nuevas.
2. Authentication → Users → "Add user" (marca Auto Confirm User). Ese es tu acceso admin.
3. Authentication → Sign In / Providers → desactiva "Allow new users to sign up".
4. Connect → copia la URL y la publishable key.

## 2. Local
Crea un archivo `.env` (no se sube a GitHub):
```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```
```
npm install
npm run dev
```

## 3. Publicar en Vercel (gratis, siempre en línea)
1. Entra a vercel.com → "Sign Up" → **Continue with GitHub**.
2. **Add New… → Project** → busca `web-Dota2` → **Import**.
3. Framework Preset: Vite (lo detecta solo). No cambies los comandos.
4. Abre **Environment Variables** y agrega las dos del `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. **Deploy**. En 1 minuto tienes tu enlace `https://web-dota2-xxxx.vercel.app`.
6. Desde ahí, cada `git push` a `main` vuelve a publicar la web sola.

### Dominio propio (opcional)
1. Compra el dominio (por ejemplo en Namecheap, GoDaddy o punto.pe).
2. Vercel → tu proyecto → **Settings → Domains** → escribe tu dominio → **Add**.
3. Vercel te muestra los registros DNS (A o CNAME). Cópialos en el panel de donde compraste el dominio.
4. En unos minutos (a veces hasta 24 h) tu tienda abre con tu dominio y con HTTPS.

Nota: en el plan gratis, Supabase pausa proyectos tras 1 semana sin actividad. Una visita a la tienda cuenta como actividad.
