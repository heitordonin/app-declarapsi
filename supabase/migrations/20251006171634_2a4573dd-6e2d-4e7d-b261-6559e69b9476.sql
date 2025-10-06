-- 1) Funções helper (SECURITY DEFINER, bypass RLS)
create or replace function public.client_in_user_org(_client_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients
    where id = _client_id
      and org_id = public.get_user_org(_user_id)
  )
$$;

create or replace function public.communication_in_user_org(_communication_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.communications
    where id = _communication_id
      and org_id = public.get_user_org(_user_id)
  )
$$;

-- 2) Regravar a policy de INSERT sem subquery direta (evita recursão)
drop policy if exists "Admins can create recipients" on public.communication_recipients;

create policy "Admins can create recipients"
on public.communication_recipients
for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'admin'::app_role)
  and public.client_in_user_org(client_id, auth.uid())
  and public.communication_in_user_org(communication_id, auth.uid())
);