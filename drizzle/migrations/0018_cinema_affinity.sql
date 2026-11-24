begin;
create or replace function public.my_cinema_affinity()
returns jsonb language sql stable security invoker set search_path = '' as $$
with mine as (
 select r.movie_id,r.rating,r.recommend,a.id as administrator_id
 from public.reviews r join public.administrators a on a.id=r.administrator_id
 where a.auth_user_id=auth.uid() and a.status='active' and not a.must_change_password
), scores as (
 select a.id, p.display_name,count(distinct m.movie_id) as common,
 round(100*(0.7*(1-avg(abs(m.rating-r.rating))/10)+0.3*avg(case when m.recommend=r.recommend then 1.0 else 0.0 end)),1) as affinity
 from mine m join public.reviews r on r.movie_id=m.movie_id and r.administrator_id<>m.administrator_id
 join public.administrators a on a.id=r.administrator_id and a.status='active'
 join public.profiles p on p.administrator_id=a.id
 group by a.id,p.display_name having count(distinct m.movie_id)>=5
)
select coalesce(jsonb_agg(to_jsonb(scores) order by affinity desc,common desc,id),'[]'::jsonb) from (select * from scores order by affinity desc,common desc,id limit 3) scores;
$$;
revoke all on function public.my_cinema_affinity() from public,anon;
grant execute on function public.my_cinema_affinity() to authenticated;
commit;
