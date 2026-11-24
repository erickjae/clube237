begin;
set local lock_timeout = '3s';
create or replace function public.enqueue_cinema_metadata()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.cinema_metadata_jobs(movie_id) values(new.id) on conflict(movie_id) do nothing;
 return new;
end;
$$;
revoke all on function public.enqueue_cinema_metadata() from public,anon,authenticated;
create trigger cinema_metadata_enqueue after insert on public.movies for each row execute function public.enqueue_cinema_metadata();
create or replace function public.seed_cinema_metadata_jobs(batch_size integer default 100)
returns integer language plpgsql security invoker set search_path = '' as $$
declare inserted integer;
begin
 insert into public.cinema_metadata_jobs(movie_id)
 select m.id from public.movies m where not exists(select 1 from public.cinema_metadata_jobs j where j.movie_id=m.id)
 order by m.id limit greatest(1,least(batch_size,500)) on conflict do nothing;
 get diagnostics inserted = row_count;
 return inserted;
end;
$$;
create or replace function public.claim_cinema_metadata_job()
returns table(movie_id uuid,tmdb_id bigint,attempts integer,lease_until timestamptz)
language sql volatile security invoker set search_path = '' as $$
with candidate as (
 select j.movie_id from public.cinema_metadata_jobs j
 where j.attempts < 8 and ((j.status in ('pending','failed') and j.next_attempt_at<=now()) or (j.status='processing' and j.lease_until<=now()))
 order by j.next_attempt_at,j.movie_id limit 1 for update skip locked
), claimed as (
 update public.cinema_metadata_jobs j set status='processing',attempts=j.attempts+1,lease_until=now()+interval '2 minutes',updated_at=now()
 from candidate c where j.movie_id=c.movie_id returning j.movie_id,j.attempts,j.lease_until
)
select c.movie_id,m.tmdb_id::bigint,c.attempts,c.lease_until from claimed c join public.movies m on m.id=c.movie_id;
$$;
revoke all on function public.seed_cinema_metadata_jobs(integer),public.claim_cinema_metadata_job() from public,anon,authenticated;
grant execute on function public.seed_cinema_metadata_jobs(integer),public.claim_cinema_metadata_job() to service_role;
commit;
