-- Add concurrent index for deployed_by queries
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- This migration file is intentionally separate from the column addition
-- so Supabase does not wrap it in a transaction. See: https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_bound_evaluations_deployed_by
ON course_bound_evaluations(deployed_by);
