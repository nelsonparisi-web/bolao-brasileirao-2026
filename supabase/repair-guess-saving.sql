-- Reparo consolidado do salvamento de palpites.
-- Pode ser executado mais de uma vez com segurança.

begin;

alter table public.guesses enable row level security;

alter table public.settings
  alter column guess_lock_hours set default 1;

update public.settings
set guess_lock_hours = 1
where id = 1;

-- Leitura: todos os participantes autenticados podem consultar os palpites.
drop policy if exists guesses_read on public.guesses;
create policy guesses_read on public.guesses
for select to authenticated
using (true);

-- Escrita: cada usuário autenticado grava somente os próprios palpites.
drop policy if exists guesses_insert on public.guesses;
drop policy if exists guesses_update on public.guesses;
drop policy if exists guesses_insert_own_or_admin on public.guesses;
drop policy if exists guesses_update_own_or_admin on public.guesses;
drop policy if exists guesses_insert_own on public.guesses;
drop policy if exists guesses_update_own on public.guesses;

create policy guesses_insert_own on public.guesses
for insert to authenticated
with check (participant_id = auth.uid());

create policy guesses_update_own on public.guesses
for update to authenticated
using (participant_id = auth.uid())
with check (participant_id = auth.uid());

grant select, insert, update on public.guesses to authenticated;

-- Agendados e adiados aceitam palpites até uma hora antes da data cadastrada.
create or replace function public.validate_guess_deadline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kickoff timestamptz;
  game_status text;
begin
  select g.datetime, g.status
  into kickoff, game_status
  from public.games g
  where g.id = new.game_id;

  if kickoff is null then
    raise exception 'Jogo não encontrado.';
  end if;

  if game_status not in ('scheduled', 'postponed') then
    raise exception 'Palpites não podem ser alterados para jogo com status %.', game_status;
  end if;

  if now() >= kickoff - interval '1 hour' then
    raise exception 'Palpites encerrados para esta partida.';
  end if;

  return new;
end;
$$;

drop trigger if exists guesses_validate_deadline on public.guesses;
create trigger guesses_validate_deadline
before insert or update of score1, score2, game_id on public.guesses
for each row execute function public.validate_guess_deadline();

commit;

-- Conferência: deve mostrar authenticated nas três operações.
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'guesses'
order by cmd, policyname;

select id, guess_lock_hours
from public.settings
where id = 1;
