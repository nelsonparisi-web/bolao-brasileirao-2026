-- RESET AUTORIZADO DOS PARTICIPANTES E DA AUTENTICAÇÃO
-- ATENÇÃO: operação irreversível.
-- Preserva jogos, equipes e configurações do Bolão Brasileirão 2026.

begin;

-- Remove primeiro os dados vinculados aos participantes.
delete from public.guesses;
delete from public.payments;
delete from public.participants;

-- Remove usuários, identidades, sessões e credenciais do Supabase Auth.
-- Relações internas do Auth utilizam exclusão em cascata.
delete from auth.users;

commit;

-- Conferência: todos os valores devem retornar zero.
select
  (select count(*) from public.participants) as participantes,
  (select count(*) from public.guesses) as palpites,
  (select count(*) from public.payments) as pagamentos,
  (select count(*) from auth.users) as usuarios_auth;

-- Depois do reset:
-- 1. Abra o app e cadastre Nelson com nelsonparisi@gmail.com.
-- 2. Defina uma nova senha conhecida por você.
-- 3. Execute o bloco abaixo para promovê-lo a administrador.

/*
insert into public.participants (id, name, phone, is_admin, is_test)
select id, 'Nelson', '11996142436', true, false
from auth.users
where lower(email) = lower('nelsonparisi@gmail.com')
on conflict (id) do update
set name = excluded.name,
    phone = excluded.phone,
    is_admin = true,
    is_test = false;

select u.email, p.id, p.name, p.phone, p.is_admin
from auth.users u
join public.participants p on p.id = u.id
where lower(u.email) = lower('nelsonparisi@gmail.com');
*/
