-- Service-role-only helpers for storing Plaid access tokens in Supabase Vault.
create or replace function vault_create_secret(secret text, name text) returns uuid language sql security definer set search_path = vault, public as $$ select vault.create_secret(secret, name) $$;
create or replace function vault_read_secret(id uuid) returns text language sql security definer set search_path = vault, public as $$ select decrypted_secret from vault.decrypted_secrets d where d.id = vault_read_secret.id $$;
revoke all on function vault_create_secret(text, text) from public, anon, authenticated;
revoke all on function vault_read_secret(uuid) from public, anon, authenticated;
