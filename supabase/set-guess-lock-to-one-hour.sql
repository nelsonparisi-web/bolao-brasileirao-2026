-- Ajusta o prazo de bloqueio dos palpites para uma hora antes de cada partida.
begin;

alter table public.settings
  alter column guess_lock_hours set default 1;

update public.settings
set guess_lock_hours = 1
where id = 1;

-- Todos os participantes autenticados podem consultar os palpites,
-- mas cada um só pode inserir ou alterar os próprios registros.
drop policy if exists guesses_insert_own_or_admin on public.guesses;
drop policy if exists guesses_update_own_or_admin on public.guesses;
drop policy if exists guesses_insert on public.guesses;
drop policy if exists guesses_update on public.guesses;
drop policy if exists guesses_insert_own on public.guesses;
drop policy if exists guesses_update_own on public.guesses;

create policy guesses_insert_own on public.guesses
for insert to authenticated
with check (participant_id = auth.uid());

create policy guesses_update_own on public.guesses
for update to authenticated
using (participant_id = auth.uid())
with check (participant_id = auth.uid());

create or replace function public.validate_guess_deadline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kickoff timestamptz;
  game_status text;
  lock_hours integer;
begin
  select g.datetime, g.status into kickoff, game_status
  from public.games g where g.id = new.game_id;

  select s.guess_lock_hours into lock_hours
  from public.settings s where s.id = 1;

  if kickoff is null then
    raise exception 'Jogo não encontrado.';
  end if;

  if game_status <> 'scheduled' then
    raise exception 'Palpites não podem ser alterados para jogo com status %.', game_status;
  end if;

  if now() >= kickoff - make_interval(hours => coalesce(lock_hours, 1)) then
    raise exception 'Palpites encerrados para esta partida.';
  end if;

  return new;
end;
$$;

commit;

select id, guess_lock_hours
from public.settings
where id = 1;
