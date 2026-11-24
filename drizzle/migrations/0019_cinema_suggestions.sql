begin;
create or replace function public.my_cinema_suggestions()
returns jsonb language sql stable security invoker set search_path = '' as $$
with member as (
 select id from public.administrators where auth_user_id=auth.uid() and status='active' and not must_change_password
), mine as (
 select r.movie_id,r.rating,r.recommend from public.reviews r join member a on a.id=r.administrator_id
), preferences as (
 select mg.genre_id,count(*) as total,avg(m.rating) as average_rating
 from mine m join public.movie_genres mg on mg.movie_id=m.movie_id
 group by mg.genre_id having count(*)>=3 and avg(m.rating)>=7
), candidates as (
 select m.id,m.title,m.poster_path,g.name as reason,p.average_rating,p.total,
 row_number() over(partition by m.id order by p.average_rating desc,p.total desc,g.id) as rn
 from public.movies m join public.movie_genres mg on mg.movie_id=m.id
 join preferences p on p.genre_id=mg.genre_id join public.genres g on g.id=mg.genre_id
 where exists(select 1 from member) and m.release_date<=current_date
 and not exists(select 1 from mine where movie_id=m.id)
 and not exists(select 1 from public.watchlist w join member a on a.id=w.administrator_id where w.movie_id=m.id)
), ranked as (
 select id,title,poster_path,reason,average_rating,total from candidates where rn=1
 order by average_rating desc,total desc,id limit 5
)
select coalesce(jsonb_agg(to_jsonb(ranked) order by average_rating desc,total desc,id),'[]'::jsonb) from ranked;
$$;
revoke all on function public.my_cinema_suggestions() from public,anon;
grant execute on function public.my_cinema_suggestions() to authenticated;
commit;
