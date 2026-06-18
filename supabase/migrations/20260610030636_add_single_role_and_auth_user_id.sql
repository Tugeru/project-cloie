-- DropIndex
DROP INDEX "user_roles_user_id_role_key";

-- Deduplicate user_roles keeping only the highest priority role based on the role hierarchy:
-- ADMIN, DEAN, PROGRAM_HEAD, FACULTY, INDUSTRY_PARTNER, ALUMNI, STUDENT
WITH ranked_roles AS (
  SELECT id, user_id, role,
         ROW_NUMBER() OVER (
           PARTITION BY user_id 
           ORDER BY CASE role::text
             WHEN 'ADMIN' THEN 1
             WHEN 'DEAN' THEN 2
             WHEN 'PROGRAM_HEAD' THEN 3
             WHEN 'FACULTY' THEN 4
             WHEN 'INDUSTRY_PARTNER' THEN 5
             WHEN 'ALUMNI' THEN 6
             WHEN 'STUDENT' THEN 7
             ELSE 8
           END ASC
         ) as rn
  FROM user_roles
)
DELETE FROM user_roles
WHERE id IN (
  SELECT id FROM ranked_roles WHERE rn > 1
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth_user_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_key" ON "user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");
