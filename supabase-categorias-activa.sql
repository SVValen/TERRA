alter table public.categorias
add column if not exists activa boolean not null default true;
