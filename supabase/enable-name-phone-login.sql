-- Permite localizar o e-mail de login pelo nome ou celular.
-- Execute no SQL Editor do Supabase.

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

create or replace function public.resolve_login_email(login_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_identifier text := btrim(coalesce(login_identifier, ''));
  phone_identifier text := regexp_replace(coalesce(login_identifier, ''), '\D', '', 'g');
  resolved_email text;
begin
  if clean_identifier = '' then
    return null;
  end if;

  if length(phone_identifier) in (12, 13) and left(phone_identifier, 2) = '55' then
    phone_identifier := substring(phone_identifier from 3);
  end if;

  select lower(participant.email)
  into resolved_email
  from public.participants as participant
  where participant.email is not null
    and (
      lower(btrim(participant.email)) = lower(clean_identifier)
      or lower(btrim(participant.name)) = lower(clean_identifier)
      or (
        length(phone_identifier) between 10 and 11
        and regexp_replace(coalesce(participant.phone, ''), '\D', '', 'g') = phone_identifier
      )
    )
  limit 1;

  return resolved_email;
end;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

commit;

select name, email, phone
from public.participants
order by name;
