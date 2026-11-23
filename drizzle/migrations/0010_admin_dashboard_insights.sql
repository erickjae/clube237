-- Run this migration in Supabase SQL Editor before merging this PR.
-- SECURITY INVOKER: existing row-level security policies remain in force.
create or replace function public.my_club_insights()
returns jsonb
language sql stable security invoker set search_path = public
as $$
with mine as (
  select r.movie_id, r.rating, r.recommend, r.created_at
  from public.reviews r
  join public.administrators a on a.id = r.administrator_id
  where a.auth_user_id = auth.uid()
), summary as (
  select count(*)::integer as reviewed,
    count(*) filter (where recommend)::integer as recommended,
    count(*) filter (where not recommend)::integer as not_recommended,
    round(avg(rating)::numeric, 2) as average_rating,
    count(*) filter (where created_at >= date_trunc('month', now()))::integer as this_month,
    count(*) filter (where created_at >= now() - interval '30 days')::integer as last_30_days
  from mine
), queue as (
  select count(*)::integer as total from public.watchlist w
  join public.administrators a on a.id = w.administrator_id
  where a.auth_user_id = auth.uid()
), genre_counts as (
  select g.name, count(*)::integer as count
  from mine m join public.movie_genres mg on mg.movie_id = m.movie_id
  join public.genres g on g.id = mg.genre_id
  group by g.id, g.name
), latest as (
  select m.movie_id, mo.title, m.rating, m.created_at
  from mine m join public.movies mo on mo.id = m.movie_id
  order by m.created_at desc limit 1
)
select jsonb_build_object(
  'reviewed', s.reviewed,
  'recommended', s.recommended,
  'notRecommended', s.not_recommended,
  'queue', q.total,
  'averageRating', s.average_rating,
  'recommendationPercent', case when s.reviewed > 0 then round(100.0 * s.recommended / s.reviewed, 1) else null end,
  'genreCounts', coalesce((select jsonb_agg(jsonb_build_object('name', gc.name, 'count', gc.count) order by gc.count desc, gc.name) from genre_counts gc), '[]'::jsonb),
  'thisMonth', s.this_month,
  'last30Days', s.last_30_days,
  'nextStep', case when q.total = 0 then 'Monte sua fila: escolha um filme para assistir.' else 'Sua próxima descoberta está na fila!' end,
  'latestReview', (select to_jsonb(latest) from latest)
) from summary s cross join queue q;
$$;
revoke all on function public.my_club_insights() from public;
grant execute on function public.my_club_insights() to authenticated;
