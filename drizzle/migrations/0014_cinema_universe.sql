begin;
create or replace function public.my_cinema_universe()
returns jsonb language sql stable security invoker set search_path = public as $$
with mine as (
 select distinct on (r.movie_id) r.movie_id,r.rating,r.recommend,r.created_at,m.title,m.runtime,m.release_date
 from public.reviews r join public.administrators a on a.id=r.administrator_id
 join public.movies m on m.id=r.movie_id
 where a.auth_user_id=auth.uid() and a.status='active' and not a.must_change_password
 order by r.movie_id,r.created_at desc
), totals as (
 select count(*) as reviewed, count(*) filter(where recommend) as recommended,
 avg(rating) as average_rating,min(rating) as min_rating,max(rating) as max_rating,
 coalesce(sum(runtime) filter(where runtime>0),0) as minutes,
 count(*) filter(where runtime>0) as runtime_coverage,
 count(*) filter(where rating=10) as perfect,
 count(*) filter(where created_at>=now()-interval '30 days') as last30
 from mine
), genres as (
 select g.name,count(m.movie_id) as total,avg(m.rating) as average_rating
 from public.genres g left join public.movie_genres mg on mg.genre_id=g.id
 left join mine m on m.movie_id=mg.movie_id group by g.id,g.name
), months as (
 select to_char(date_trunc('month',created_at),'YYYY-MM') as month,count(*) as total
 from mine group by 1
), decades as (
 select (extract(year from release_date)::int/10)*10 as decade,count(*) as total
 from mine where release_date is not null group by 1
), favorites as (
 select movie_id,title,rating from mine order by rating desc,created_at desc,movie_id limit 5
)
select jsonb_build_object('totals',to_jsonb(totals),
 'genres',coalesce((select jsonb_agg(to_jsonb(genres) order by total desc,name) from genres),'[]'::jsonb),
 'months',coalesce((select jsonb_agg(to_jsonb(months) order by month) from months),'[]'::jsonb),
 'decades',coalesce((select jsonb_agg(to_jsonb(decades) order by decade) from decades),'[]'::jsonb),
 'favorites',coalesce((select jsonb_agg(to_jsonb(favorites) order by rating desc,movie_id) from favorites),'[]'::jsonb))
from totals;
$$;
revoke all on function public.my_cinema_universe() from public,anon;
grant execute on function public.my_cinema_universe() to authenticated;
commit;
