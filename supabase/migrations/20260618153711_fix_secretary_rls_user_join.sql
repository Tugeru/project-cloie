-- Fix: SECRETARY RLS policies referenced the wrong column for the auth-UUID linkage.
--
-- Background: migration 20260618124311_rename_systemrole_admin_to_secretary.sql
-- carried forward a pre-existing bug from 20260510003018_add_school_year_and_term_instance.sql
-- where the policy check used `u.id = auth.uid()`. The `public.users.id` column is a
-- separate UUID primary key (default gen_random_uuid()); the auth UUID lives in
-- `public.users.auth_user_id` (FK to auth.users.id, see ADR-0002). `auth.uid()`
-- returns the auth UUID, so the old predicate never matched any row, silently
-- blocking every secretary write to `school_years` and `academic_term_instances`.
--
-- Server Actions bypassed RLS via the postgres/service role, which is why writes
-- appeared to work — but any authenticated client (RLS-aware) write would be denied.
--
-- This migration drops and re-creates the two secretary-write policies with the
-- corrected join: `u.auth_user_id = auth.uid()`.

DROP POLICY IF EXISTS "Enable write access for secretary only" ON school_years;

CREATE POLICY "Enable write access for secretary only" ON school_years
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid() AND ur.role = 'SECRETARY'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid() AND ur.role = 'SECRETARY'
  )
);

DROP POLICY IF EXISTS "Enable write access for secretary only" ON academic_term_instances;

CREATE POLICY "Enable write access for secretary only" ON academic_term_instances
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid() AND ur.role = 'SECRETARY'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid() AND ur.role = 'SECRETARY'
  )
);
