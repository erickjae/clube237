begin;
create or replace function public.my_cinema_films(p_kind text,p_value text,p_page integer default 0)
returns jsonb language sql stable security invoker set search_path = '' as $$
with mine as (
 select distinct on (r.movie_id) r.movie_id,r.rating,r.recommend,r.created_at,m.title,m.poster_path,m.runtime,m.release_date
 from public.reviews r join public.administrators a on a.id=r.administrator_id
 join public.movies m on m.id=r.movie_id
 where a.auth_user_id=auth.uid() and a.status='active' and not a.must_change_password
 order by r.movie_id,r.created_at desc
), filtered as (
 select m.* from mine m where case p_kind
 when 'all' then true
 when 'recommended' then m.recommend
 when 'not_recommended' then not m.recommend
 when 'perfect' then m.rating=10
 when 'genre' then exists(select 1 from public.movie_genres mg join public.genres g on g.id=mg.genre_id where mg.movie_id=m.movie_id and g.name=p_value)
 when 'month' then to_char(date_trunc('month',m.created_at),'YYYY-MM')=p_value
 when 'decade' then ((extract(year from m.release_date)::int/10)*10)::text=p_value
 else false end
), page as (
 select * from filtered order by created_at desc,movie_id limit 20 offset (greatest(0,least(coalesce(p_page,0),100000))*20)
)
select jsonb_build_object('total',(select count(*) from filtered),'items',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,movie_id) from page),'[]'::jsonb));
$$;
revoke all on function public.my_cinema_films(text,text,integer) from public,anon;
grant execute on function public.my_cinema_films(text,text,integer) to authenticated;
commit;
