begin;
create or replace function public.complete_cinema_metadata_job(p_movie uuid,p_lease timestamptz,p_payload jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
 perform 1 from public.cinema_metadata_jobs where movie_id=p_movie and status='processing' and lease_until=p_lease and lease_until>now() for update;
 if not found then return false; end if;
 insert into public.cinema_people(tmdb_id,name,profile_path)
 select distinct on (p.id) p.id,p.name,p.profile_path
 from jsonb_to_recordset(p_payload->'people') as p(id bigint,name text,profile_path text,role text,billing_order integer)
 order by p.id,p.name
 on conflict(tmdb_id) do update set name=excluded.name,profile_path=excluded.profile_path;
 delete from public.cinema_movie_people where movie_id=p_movie;
 insert into public.cinema_movie_people(movie_id,person_id,role,billing_order)
 select distinct on (p.id,p.role) p_movie,p.id,p.role,p.billing_order
 from jsonb_to_recordset(p_payload->'people') as p(id bigint,name text,profile_path text,role text,billing_order integer)
 where p.role='director' or (p.role='cast' and p.billing_order between 0 and 9)
 order by p.id,p.role,p.billing_order;
 insert into public.cinema_movie_metadata(movie_id,original_language,production_countries,synced_at)
 values(p_movie,p_payload->>'language',array(select jsonb_array_elements_text(p_payload->'countries')),now())
 on conflict(movie_id) do update set original_language=excluded.original_language,production_countries=excluded.production_countries,synced_at=excluded.synced_at;
 update public.cinema_metadata_jobs set status='completed',lease_until=null,last_error=null,updated_at=now() where movie_id=p_movie;
 return true;
end;
$$;
create or replace function public.fail_cinema_metadata_job(p_movie uuid,p_lease timestamptz,p_delay integer)
returns void language sql security invoker set search_path = '' as $$
 update public.cinema_metadata_jobs set status='failed',lease_until=null,last_error='Metadata request failed',next_attempt_at=now()+make_interval(secs=>greatest(60,least(p_delay,86400))),updated_at=now()
 where movie_id=p_movie and status='processing' and lease_until=p_lease;
$$;
revoke all on function public.complete_cinema_metadata_job(uuid,timestamptz,jsonb),public.fail_cinema_metadata_job(uuid,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.complete_cinema_metadata_job(uuid,timestamptz,jsonb),public.fail_cinema_metadata_job(uuid,timestamptz,integer) to service_role;
commit;
