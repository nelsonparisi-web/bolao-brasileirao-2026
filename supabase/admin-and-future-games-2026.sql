-- Migração do Bolão Brasileirão 2026
-- 1) mantém somente jogos a partir de 01/08/2026 e quatro adiados da rodada 21;
-- 2) detalha as rodadas 22 a 24 conforme tabela publicada pela CBF;
-- 3) restringe operações administrativas a participants.is_admin = true.

begin;

-- Os quatro jogos sem data definida da rodada 21 permanecem no bolão.
update public.games
set datetime = '2026-08-01 23:59:00-03', status = 'postponed'
where season = 2026 and round = 21 and (team1, team2) in (
  ('Botafogo', 'Grêmio'),
  ('São Paulo', 'Santos'),
  ('Atlético-MG', 'Red Bull Bragantino'),
  ('Chapecoense', 'Vasco')
);

-- Remove partidas já realizadas. Palpites vinculados são removidos pelo ON DELETE CASCADE.
delete from public.games
where season = 2026
  and datetime < '2026-08-01 00:00:00-03';

-- Datas, horários e estádios detalhados das rodadas 22 a 24.
update public.games as g
set datetime = v.datetime::timestamptz,
    stadium = v.stadium,
    status = 'scheduled'
from (values
  (22, 'Grêmio', 'São Paulo', '2026-08-08 16:00:00-03', 'Arena do Grêmio'),
  (22, 'Remo', 'Atlético-MG', '2026-08-08 18:30:00-03', 'Mangueirão'),
  (22, 'Coritiba', 'Chapecoense', '2026-08-08 20:30:00-03', 'Couto Pereira'),
  (22, 'Botafogo', 'Fluminense', '2026-08-08 21:00:00-03', 'Nilton Santos'),
  (22, 'Cruzeiro', 'Mirassol', '2026-08-09 11:00:00-03', 'Mineirão'),
  (22, 'Palmeiras', 'Internacional', '2026-08-09 16:00:00-03', 'Allianz Parque'),
  (22, 'Bahia', 'Vasco', '2026-08-09 16:00:00-03', 'Arena Fonte Nova'),
  (22, 'Santos', 'Athletico-PR', '2026-08-09 18:30:00-03', 'Vila Belmiro'),
  (22, 'Red Bull Bragantino', 'Corinthians', '2026-08-09 18:30:00-03', 'Cícero de Souza Marques'),
  (22, 'Flamengo', 'Vitória', '2026-08-09 19:30:00-03', 'Maracanã'),
  (23, 'Fluminense', 'Palmeiras', '2026-08-15 16:30:00-03', 'Maracanã'),
  (23, 'Atlético-MG', 'Grêmio', '2026-08-15 16:30:00-03', 'Arena MRV'),
  (23, 'Athletico-PR', 'Red Bull Bragantino', '2026-08-15 18:30:00-03', 'Arena da Baixada'),
  (23, 'São Paulo', 'Coritiba', '2026-08-15 21:00:00-03', 'Morumbis'),
  (23, 'Chapecoense', 'Bahia', '2026-08-16 11:00:00-03', 'Arena Condá'),
  (23, 'Vasco', 'Santos', '2026-08-16 16:00:00-03', 'São Januário'),
  (23, 'Mirassol', 'Flamengo', '2026-08-16 18:30:00-03', 'José Maria de Campos Maia'),
  (23, 'Vitória', 'Botafogo', '2026-08-16 18:30:00-03', 'Barradão'),
  (23, 'Corinthians', 'Cruzeiro', '2026-08-16 19:30:00-03', 'Neo Química Arena'),
  (23, 'Internacional', 'Remo', '2026-08-17 20:00:00-03', 'Beira-Rio'),
  (24, 'Fluminense', 'Remo', '2026-08-22 16:00:00-03', 'Maracanã'),
  (24, 'Internacional', 'Atlético-MG', '2026-08-22 18:30:00-03', 'Beira-Rio'),
  (24, 'Cruzeiro', 'Flamengo', '2026-08-22 20:30:00-03', 'Mineirão'),
  (24, 'Palmeiras', 'Vasco', '2026-08-23 16:00:00-03', 'Allianz Parque'),
  (24, 'Red Bull Bragantino', 'Grêmio', '2026-08-23 16:00:00-03', 'Cícero de Souza Marques'),
  (24, 'Vitória', 'Bahia', '2026-08-23 16:00:00-03', 'Barradão'),
  (24, 'Santos', 'Mirassol', '2026-08-23 18:30:00-03', 'Vila Belmiro'),
  (24, 'Chapecoense', 'São Paulo', '2026-08-23 18:30:00-03', 'Arena Condá'),
  (24, 'Coritiba', 'Corinthians', '2026-08-23 19:30:00-03', 'Couto Pereira'),
  (24, 'Botafogo', 'Athletico-PR', '2026-08-24 20:00:00-03', 'Nilton Santos')
) as v(round, team1, team2, datetime, stadium)
where g.season = 2026
  and g.round = v.round
  and g.team1 = v.team1
  and g.team2 = v.team2;

-- Função usada pelas políticas sem provocar recursão de RLS.
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.participants
    where id = auth.uid() and is_admin = true
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

-- Participantes: leitura para usuários logados, cadastro próprio e gestão pelo admin.
drop policy if exists participants_read on public.participants;
drop policy if exists participants_register on public.participants;
drop policy if exists participants_compat_update on public.participants;
drop policy if exists participants_compat_delete on public.participants;
drop policy if exists participants_insert_own on public.participants;
drop policy if exists participants_update_own_or_admin on public.participants;
drop policy if exists participants_delete_admin on public.participants;
create policy participants_read on public.participants for select to authenticated using (true);
create policy participants_insert_own on public.participants for insert to authenticated
  with check (id = auth.uid() and is_admin = false);
create policy participants_update_own_or_admin on public.participants for update to authenticated
  using (id = auth.uid() or public.current_user_is_admin())
  with check (public.current_user_is_admin() or (id = auth.uid() and is_admin = false));
create policy participants_delete_admin on public.participants for delete to authenticated
  using (public.current_user_is_admin());

-- Jogos: leitura pública; somente admin altera agenda, status e placares.
drop policy if exists games_read on public.games;
drop policy if exists games_compat_update on public.games;
drop policy if exists games_update_admin on public.games;
create policy games_read on public.games for select to anon, authenticated using (true);
create policy games_update_admin on public.games for update to authenticated
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

-- Palpites: cada participante grava os seus; admin pode corrigir quando necessário.
drop policy if exists guesses_read on public.guesses;
drop policy if exists guesses_insert on public.guesses;
drop policy if exists guesses_update on public.guesses;
drop policy if exists guesses_insert_own_or_admin on public.guesses;
drop policy if exists guesses_update_own_or_admin on public.guesses;
create policy guesses_read on public.guesses for select to authenticated using (true);
create policy guesses_insert_own_or_admin on public.guesses for insert to authenticated
  with check (participant_id = auth.uid() or public.current_user_is_admin());
create policy guesses_update_own_or_admin on public.guesses for update to authenticated
  using (participant_id = auth.uid() or public.current_user_is_admin())
  with check (participant_id = auth.uid() or public.current_user_is_admin());

-- Pagamentos: participante vê o próprio registro; admin administra todos.
drop policy if exists payments_read on public.payments;
drop policy if exists payments_read_own_or_admin on public.payments;
drop policy if exists payments_write_admin on public.payments;
create policy payments_read_own_or_admin on public.payments for select to authenticated
  using (participant_id = auth.uid() or public.current_user_is_admin());
create policy payments_write_admin on public.payments for all to authenticated
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

-- Configurações: leitura pública; admin pode editar.
drop policy if exists settings_read on public.settings;
drop policy if exists settings_update_admin on public.settings;
create policy settings_read on public.settings for select to anon, authenticated using (true);
create policy settings_update_admin on public.settings for update to authenticated
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

grant select on public.participants to authenticated;
grant insert, update, delete on public.participants to authenticated;
grant select on public.games to anon, authenticated;
grant update on public.games to authenticated;
grant select, insert, update on public.guesses to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select on public.settings to anon, authenticated;
grant update on public.settings to authenticated;

commit;

-- Resultado esperado: 174 jogos (170 das rodadas 22–38 + 4 adiados da rodada 21).
select count(*) as jogos_mantidos from public.games where season = 2026;
select round, count(*) as jogos
from public.games where season = 2026
group by round order by round;
