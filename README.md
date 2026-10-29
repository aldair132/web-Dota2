# Ancient Shop (Dota 2)

Catálogo de items de Dota 2 (arcanas, inmortales, sets, couriers…) con panel admin (CRUD), filtros por categoría y rareza, y compra por WhatsApp. React + Vite + Supabase. Misma base que Alyz Shop.

Sin `.env` arranca en **modo demo** con items de ejemplo, para ver el diseño.

## Personalizar
- Nombre de la tienda, número de WhatsApp y rarezas: `src/datos.js`
- Enlace de Discord (opcional): `src/supabase.js`
- Colores y fuentes: `tailwind.config.js`

## 1. Supabase (gratis)
1. Crea un proyecto **nuevo** en supabase.com (no uses el de Alyz Shop).
2. SQL Editor → pega y ejecuta `supabase.sql` (crea tablas, categorías iniciales y el bucket `items`).
3. Authentication → Users → "Add user" (tu correo y contraseña). Ese es tu acceso admin.
4. Authentication → Sign In / Providers → desactiva "Allow new users to sign up".
5. Project Settings → API → copia la URL y la anon key.

## 2. Local
```
cp .env.example .env     # pega URL y anon key
npm install
npm run dev
```
- Tienda: `http://localhost:5173/`
- Admin: candado en el pie de página, o `http://localhost:5173/#/admin`

## 3. Publicar
1. Sube la carpeta a un repo de GitHub.
2. Vercel → Add New Project → importa el repo.
3. Environment Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Deploy.
