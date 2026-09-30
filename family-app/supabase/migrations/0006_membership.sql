-- Membership. Early access = free. When the paywall launches, flip PAYWALL_ENABLED and RevenueCat webhooks keep this row current.
alter table families add column if not exists plan text not null default 'early_access' check (plan in ('early_access','trial','active','expired','comped'));
alter table families add column if not exists plan_expires_at timestamptz;
alter table families add column if not exists early_access_member boolean not null default true;  -- families who joined free get a founding-family offer later
