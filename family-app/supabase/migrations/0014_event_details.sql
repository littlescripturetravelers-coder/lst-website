-- Apple-Calendar-style event details: where it is, a link, and repeat exceptions.
-- exdates: single days removed from a repeating event ("Delete This Event Only").
-- repeat_until: last day a repeating event happens ("Delete All Future Events").
alter table events add column if not exists location text;
alter table events add column if not exists url text;
alter table events add column if not exists exdates date[] not null default '{}';
alter table events add column if not exists repeat_until date;
create index if not exists events_family_repeat on events (family_id) where repeat is not null;
