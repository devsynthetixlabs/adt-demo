-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 002 — Switch invitations to Supabase Auth inviteUserByEmail
--
-- HOW TO RUN:
--   Paste this entire file into the Supabase Dashboard → SQL Editor and execute.
--
-- WHAT THIS DOES:
--   • Makes `token` and `expires_at` nullable (Supabase now owns the token)
--   • Adds `invited_user_id` to track the Supabase auth user that was created
--   • Adds `name` so we can store the display name sent at invite time
-- ═══════════════════════════════════════════════════════════════════

-- 1. Relax the old constraints that assumed a custom token
alter table invitations
  alter column token drop not null;

alter table invitations
  alter column expires_at drop not null;

-- 2. Track the Supabase auth user that was invited
alter table invitations
  add column if not exists invited_user_id uuid references auth.users(id) on delete set null;

-- 3. Store the display name that was typed in the invite form
alter table invitations
  add column if not exists name text;
