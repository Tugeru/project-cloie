-- 1. Rename enum value ADMIN → SECRETARY in SystemRole
ALTER TYPE "SystemRole" RENAME VALUE 'ADMIN' TO 'SECRETARY';

-- 2. Update auth.users.raw_app_meta_data (belt-and-braces)
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"SECRETARY"',
  true
)
WHERE raw_app_meta_data->>'role' = 'ADMIN';

-- 3. Scoped session invalidation (SECRETARY-role users only)
DELETE FROM auth.sessions s
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  JOIN public.users u ON ur.user_id = u.id
  WHERE ur.role = 'SECRETARY'
    AND u.auth_user_id = s.user_id
);

-- 4. DROP and re-CREATE RLS policies on school_years
DROP POLICY IF EXISTS "Enable write access for admin only" ON school_years;
CREATE POLICY "Enable write access for secretary only" ON school_years
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid() AND ur.role = 'SECRETARY'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid() AND ur.role = 'SECRETARY'
  )
);

-- 5. DROP and re-CREATE RLS policies on academic_term_instances
DROP POLICY IF EXISTS "Enable write access for admin only" ON academic_term_instances;
CREATE POLICY "Enable write access for secretary only" ON academic_term_instances
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid() AND ur.role = 'SECRETARY'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.id = auth.uid() AND ur.role = 'SECRETARY'
  )
);
