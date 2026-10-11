-- The member guard is a trigger function only; nobody should call it directly.
revoke execute on function guard_member_switches() from public, anon, authenticated;
