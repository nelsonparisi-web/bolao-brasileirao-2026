-- Adiciona e sincroniza o e-mail de login na tabela de participantes.
-- Pode ser executado mais de uma vez com segurança.

begin;

alter table public.participants
  add column if not exists email text;

update public.participants as participant
set email = lower(auth_user.email)
from auth.users as auth_user
where auth_user.id = participant.id
  and auth_user.email is not null
  and participant.email is distinct from lower(auth_user.email);

create unique index if not exists participants_email_lower_uk
  on public.participants (lower(email))
  where email is not null;

create or replace function public.fill_participant_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    select lower(auth_user.email)
    into new.email
    from auth.users as auth_user
    where auth_user.id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists participants_fill_email on public.participants;
create trigger participants_fill_email
before insert on public.participants
for each row execute function public.fill_participant_email();

create or replace function public.sync_participant_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.participants
  set email = lower(new.email)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists auth_user_sync_participant_email on auth.users;
create trigger auth_user_sync_participant_email
after update of email on auth.users
for each row execute function public.sync_participant_email();

grant select, insert, update (email) on public.participants to authenticated;

commit;

select name, email, phone, is_admin
from public.participants
order by name;
