-- Psystema — base de datos (Supabase)
-- Una sola tabla con un registro por paciente, pago, cita o ajuste.
-- Las reglas (RLS) hacen que cada usuario SOLO pueda leer y modificar sus propios registros.

create table if not exists public.registros (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  tipo       text        not null check (tipo in ('paciente', 'pago', 'cita', 'config')),
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, tipo, id)
);

alter table public.registros enable row level security;

drop policy if exists "registros_select_propios" on public.registros;
drop policy if exists "registros_insert_propios" on public.registros;
drop policy if exists "registros_update_propios" on public.registros;
drop policy if exists "registros_delete_propios" on public.registros;

create policy "registros_select_propios" on public.registros
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "registros_insert_propios" on public.registros
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "registros_update_propios" on public.registros
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "registros_delete_propios" on public.registros
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Nadie sin sesión puede tocar la tabla
revoke all on public.registros from anon;
grant select, insert, update, delete on public.registros to authenticated;
