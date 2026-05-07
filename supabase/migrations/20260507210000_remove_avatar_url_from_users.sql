-- Remove unused avatar_url column from users table
-- This field was never used in the application; avatars are handled via fallback initials
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_url";
