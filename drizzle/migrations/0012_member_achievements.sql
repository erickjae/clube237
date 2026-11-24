-- Public aggregate only; respects existing RLS.
create or replace function public.club_member_achievements()
returns jsonb language sql stable security invoker set search_path = public as $$
  with totals as (
    select administrator_id, count(distinct movie_id) as total,
      count(distinct movie_id) filter (where recommend) as recommended
    from public.reviews group by administrator_id
  ), genres_count as (
    select r.administrator_id, g.name, count(distinct r.movie_id) as total
    from public.reviews r join public.movie_genres mg on mg.movie_id=r.movie_id
    join public.genres g on g.id=mg.genre_id
    group by r.administrator_id,g.name
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,'display_name',p.display_name,'avatar_url',p.avatar_url,'about',p.about,
    'total',coalesce(t.total,0),'recommended',coalesce(t.recommended,0),
    'genres',coalesce((select jsonb_object_agg(gc.name,gc.total) from genres_count gc where gc.administrator_id=p.administrator_id),'{}'::jsonb)
  ) order by coalesce(t.total,0) desc,p.display_name,p.id),'[]'::jsonb)
  from public.profiles p left join totals t on t.administrator_id=p.administrator_id;
$$;
grant execute on function public.club_member_achievements() to anon, authenticated;
