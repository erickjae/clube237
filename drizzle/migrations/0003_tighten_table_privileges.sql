REVOKE ALL ON public.administrators, public.user_roles, public.profiles, public.movies, public.reviews, public.watchlist, public.genres, public.movie_genres, public.profile_favorite_genres FROM anon, authenticated;
GRANT SELECT ON public.administrators, public.user_roles TO authenticated;
GRANT SELECT ON public.profiles, public.movies, public.reviews, public.watchlist, public.genres, public.movie_genres, public.profile_favorite_genres TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT INSERT, DELETE ON public.watchlist TO authenticated;
GRANT INSERT, DELETE ON public.profile_favorite_genres TO authenticated;
GRANT ALL ON public.administrators, public.user_roles, public.profiles, public.movies, public.reviews, public.watchlist, public.genres, public.movie_genres, public.profile_favorite_genres TO service_role;