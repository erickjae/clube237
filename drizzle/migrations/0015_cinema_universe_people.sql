begin;
create or replace function public.my_cinema_universe_people()
returns jsonb language sql stable security definer set search_path = '' as $$
with mine as (
 select distinct on (r.movie_id) r.movie_id,r.rating,r.recommend
 from public.reviews r join public.administrators a on a.id=r.administrator_id
 where a.auth_user_id=auth.uid() and a.status='active' and not a.must_change_password
 order by r.movie_id,r.created_at desc
), people as (
 select p.tmdb_id,p.name,p.profile_path,mp.role,count(distinct m.movie_id) as total,
 round(avg(m.rating)::numeric,2) as average_rating,
 round(100.0*count(*) filter(where m.recommend)/count(*),1) as recommendation_percent
 from mine m join public.cinema_movie_people mp on mp.movie_id=m.movie_id
 join public.cinema_people p on p.tmdb_id=mp.person_id
 where mp.role='director' or (mp.role='cast' and mp.billing_order between 0 and 9)
 group by p.tmdb_id,p.name,p.profile_path,mp.role
), actors as (
 select * from people where role='cast' order by total desc,name,tmdb_id limit 5
), directors as (
 select * from people where role='director' order by total desc,name,tmdb_id limit 5
), languages as (
 select md.original_language as name,count(*) as total from mine m
 join public.cinema_movie_metadata md on md.movie_id=m.movie_id
 where md.synced_at is not null and nullif(md.original_language,'') is not null group by 1
), countries as (
 select c.name,count(distinct m.movie_id) as total from mine m
 join public.cinema_movie_metadata md on md.movie_id=m.movie_id
 cross join lateral unnest(md.production_countries) c(name)
 where md.synced_at is not null and nullif(c.name,'') is not null group by 1
)
select jsonb_build_object(
 'coverage',(select count(*) from mine m join public.cinema_movie_metadata md on md.movie_id=m.movie_id where md.synced_at is not null),
 'actors',coalesce((select jsonb_agg(to_jsonb(actors) order by total desc,name,tmdb_id) from actors),'[]'::jsonb),
 'directors',coalesce((select jsonb_agg(to_jsonb(directors) order by total desc,name,tmdb_id) from directors),'[]'::jsonb),
 'languages',coalesce((select jsonb_agg(to_jsonb(languages) order by total desc,name) from languages),'[]'::jsonb),
 'countries',coalesce((select jsonb_agg(to_jsonb(countries) order by total desc,name) from countries),'[]'::jsonb));
$$;
revoke all on function public.my_cinema_universe_people() from public,anon;
grant execute on function public.my_cinema_universe_people() to authenticated;
commit;
