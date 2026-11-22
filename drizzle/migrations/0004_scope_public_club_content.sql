CREATE OR REPLACE FUNCTION public.administrator_is_public(target_administrator_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.administrators a
    JOIN public.user_roles r ON r.user_id = a.auth_user_id
    WHERE a.id = target_administrator_id
      AND a.status = 'active'
      AND r.role = 'admin'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_is_public(target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = target_profile_id
      AND public.administrator_is_public(p.administrator_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.avatar_is_public(path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id::text = split_part(path, '/', 1)
      AND public.profile_is_public(p.id)
  );
$$;

REVOKE ALL ON FUNCTION public.administrator_is_public(uuid), public.profile_is_public(uuid), public.avatar_is_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.administrator_is_public(uuid), public.profile_is_public(uuid), public.avatar_is_public(text) TO anon, authenticated, service_role;

DROP POLICY profile_read ON public.profiles;
CREATE POLICY profile_read ON public.profiles
FOR SELECT TO anon, authenticated
USING (public.profile_is_public(id));

DROP POLICY review_read ON public.reviews;
CREATE POLICY review_read ON public.reviews
FOR SELECT TO anon, authenticated
USING (public.administrator_is_public(administrator_id));

DROP POLICY queue_read ON public.watchlist;
CREATE POLICY queue_read ON public.watchlist
FOR SELECT TO anon, authenticated
USING (public.administrator_is_public(administrator_id));

DROP POLICY favorite_read ON public.profile_favorite_genres;
CREATE POLICY favorite_read ON public.profile_favorite_genres
FOR SELECT TO anon, authenticated
USING (public.profile_is_public(profile_id));

DROP POLICY avatar_read ON storage.objects;
CREATE POLICY avatar_read ON storage.objects
FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (owner_id IS NOT NULL AND owner_id = (SELECT auth.uid()::text))
    OR public.club_owner()
    OR public.avatar_is_public(name)
  )
);