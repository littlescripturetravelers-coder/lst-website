-- Daily per-family AI call counter (cost guard). Only the server functions (service role) touch it.
create table ai_usage (family_id uuid not null references families on delete cascade, day date not null default current_date, kind text not null, n int not null default 0, primary key (family_id, day, kind));
alter table ai_usage enable row level security;
create or replace function bump_ai_usage(fid uuid, k text, lim int) returns boolean language plpgsql security definer set search_path = public as $$
declare cur int;
begin
  insert into ai_usage (family_id, day, kind, n) values (fid, current_date, k, 1)
  on conflict (family_id, day, kind) do update set n = ai_usage.n + 1
  returning n into cur;
  return cur <= lim;
end $$;
revoke execute on function bump_ai_usage(uuid, text, int) from public, anon, authenticated;
