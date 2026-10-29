-- Ejecutar en Supabase > SQL Editor (se puede ejecutar más de una vez sin problema)

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null default 'Sets',
  heroe text,
  rareza text,
  precio numeric(10,2),
  descripcion text,
  fotos text[] not null default '{}',
  disponible boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  emoji text,
  orden int not null default 0
);

insert into categorias (nombre, emoji, orden) values
  ('Arcanas', '🌟', 1),
  ('Inmortales', '🏆', 2),
  ('Sets', '🛡️', 3),
  ('Couriers', '🐉', 4),
  ('Tesoros', '🎁', 5),
  ('Wards', '👁️', 6)
on conflict (nombre) do nothing;

alter table productos enable row level security;
alter table categorias enable row level security;

drop policy if exists "ver productos" on productos;
drop policy if exists "admin escribe" on productos;
drop policy if exists "ver categorias" on categorias;
drop policy if exists "admin escribe categorias" on categorias;

-- El público solo ve items visibles; el admin (con sesión) ve todos
create policy "ver productos" on productos
  for select using (disponible or auth.role() = 'authenticated');
create policy "admin escribe" on productos
  for all to authenticated using (true) with check (true);

create policy "ver categorias" on categorias for select using (true);
create policy "admin escribe categorias" on categorias
  for all to authenticated using (true) with check (true);

-- Bucket público para las imágenes
insert into storage.buckets (id, name, public)
values ('items', 'items', true)
on conflict (id) do nothing;

drop policy if exists "ver fotos items" on storage.objects;
drop policy if exists "admin sube fotos items" on storage.objects;
drop policy if exists "admin borra fotos items" on storage.objects;

create policy "ver fotos items" on storage.objects
  for select using (bucket_id = 'items');
create policy "admin sube fotos items" on storage.objects
  for insert to authenticated with check (bucket_id = 'items');
create policy "admin borra fotos items" on storage.objects
  for delete to authenticated using (bucket_id = 'items');
