-- Pesquisa CNPJ · Elite Marine — histórico compartilhado
-- Rode uma vez em: Supabase → SQL Editor → New query → cole tudo → Run.

create table if not exists public.consultas_cnpj (
  cnpj          text primary key check (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$'),
  razao_social  text not null default '',
  dados         jsonb not null,
  fonte         text not null default '',
  consultado_em timestamptz not null default now(),
  consultas     integer not null default 1
);

create index if not exists consultas_cnpj_data_idx on public.consultas_cnpj (consultado_em desc);

-- Segurança: qualquer visitante pode LER; ninguém grava direto na tabela.
alter table public.consultas_cnpj enable row level security;

drop policy if exists "leitura publica" on public.consultas_cnpj;
create policy "leitura publica" on public.consultas_cnpj
  for select to anon, authenticated using (true);

-- Gravação só pela função abaixo, que valida o conteúdo.
create or replace function public.salvar_consulta(
  p_cnpj text, p_razao_social text, p_dados jsonb, p_fonte text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_cnpj !~ '^[0-9A-Z]{12}[0-9]{2}$' then
    raise exception 'CNPJ inválido';
  end if;
  if p_dados is null or length(p_dados::text) > 200000 then
    raise exception 'Dados inválidos';
  end if;
  if p_fonte not in ('BrasilAPI', 'Minha Receita', 'CNPJ.ws') then
    raise exception 'Fonte inválida';
  end if;

  insert into public.consultas_cnpj (cnpj, razao_social, dados, fonte, consultado_em)
  values (p_cnpj, left(coalesce(p_razao_social, ''), 300), p_dados, p_fonte, now())
  on conflict (cnpj) do update
     set razao_social  = excluded.razao_social,
         dados         = excluded.dados,
         fonte         = excluded.fonte,
         consultado_em = now(),
         consultas     = public.consultas_cnpj.consultas + 1;
end;
$$;

revoke all on function public.salvar_consulta(text, text, jsonb, text) from public;
grant execute on function public.salvar_consulta(text, text, jsonb, text) to anon, authenticated;

-- Para apagar um CNPJ do histórico (pelo painel do Supabase, não pelo site):
--   delete from public.consultas_cnpj where cnpj = '33000167000101';
