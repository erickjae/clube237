-- Release 24: additive foundation only. Test on restored staging first.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
create table public.cinema_people (
  tmdb_id bigint primary key,
  name text not null,
  profile_path text
);
create table public.cinema_movie_people (
  movie_id uuid not null references public.movies(id),
  person_id bigint not null references public.cinema_people(tmdb_id),
  role text not null check (role in ('cast','director')),
  billing_order integer,
  primary key (movie_id, person_id, role)
);
create index cinema_movie_people_person_idx on public.cinema_movie_people(person_id, role);
create table public.cinema_movie_metadata (
  movie_id uuid primary key references public.movies(id),
  original_language text,
  production_countries text[],
  synced_at timestamptz
);
create table public.cinema_metadata_jobs (
  movie_id uuid primary key references public.movies(id),
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  lease_until timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);
create index cinema_metadata_jobs_pending_idx on public.cinema_metadata_jobs(status,next_attempt_at);
alter table public.cinema_people enable row level security;
alter table public.cinema_movie_people enable row level security;
alter table public.cinema_movie_metadata enable row level security;
alter table public.cinema_metadata_jobs enable row level security;
revoke all on public.cinema_people, public.cinema_movie_people, public.cinema_movie_metadata, public.cinema_metadata_jobs from public, anon, authenticated;
grant select,insert,update,delete on public.cinema_people, public.cinema_movie_people, public.cinema_movie_metadata, public.cinema_metadata_jobs to service_role;
commit;
