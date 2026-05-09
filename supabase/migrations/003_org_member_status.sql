-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 003 — Add status column to organization_members
--
-- WHY:
--   Previously, member status ("invited" vs "active") was derived at
--   read time by checking the invitations table. This broke when the
--   invitations insert silently failed (token/expires_at were NOT NULL
--   but not provided), and made it impossible to distinguish states
--   in the database.
--
-- WHAT THIS DOES:
--   • Adds a `status` column to organization_members
--   • Backfills existing rows as 'active'
-- ═══════════════════════════════════════════════════════════════════

alter table organization_members
  add column if not exists status text not null default 'active'
  check (status in ('invited', 'active'));
