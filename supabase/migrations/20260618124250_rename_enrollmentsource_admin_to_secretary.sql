-- Rename EnrollmentSource.ADMIN to SECRETARY
BEGIN;
ALTER TYPE "enrollment_source" RENAME VALUE 'ADMIN' TO 'SECRETARY';
COMMIT;
