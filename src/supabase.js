import { createClient } from '@supabase/supabase-js'

// Sin .env la tienda arranca en modo demo con items de ejemplo
export const configurado = Boolean(import.meta.env.VITE_SUPABASE_URL)

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo'
)

export const BUCKET = 'items'
export const DISCORD_URL = '' // opcional: enlace de invitación a tu Discord
