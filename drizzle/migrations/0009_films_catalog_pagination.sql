-- Run in Supabase SQL Editor before merging the films catalog PR.
-- Filters and pagination are applied in PostgreSQL before returning rows.
create or replace function public.club_films_page(
  p_page integer default 1,
  p_search text default '',
  p_genre_id uuid default null,
  p_administrator_id uuid default null,
  p_recommend boolean default null,
  p_sort text default 'best',
  p_hide_reviewed boolean default false
) returns jsonb
language plpgsql stable security invoker set search_path = public
as $$
declare
  result jsonb;
begin
  if p_page < 1 or p_page > 100000 or length(p_search) > 100 or p_sort not in ('best','worst','most','title') then
    raise exception 'Parâmetros inválidos';
  end if;
  -- Never trust a supplied administrator ID as the identity of the viewer.
  with rated as (
    select r.movie_id,
      count(*)::integer as review_count,
      avg(r.rating)::numeric as average_rating
    from public.reviews r
    group by r.movie_id
  ), matching as (
    select m.id, m.title, m.poster_path, m.release_date,
      rated.review_count, rated.average_rating
    from public.movies m
    join rated on rated.movie_id = m.id
    where (trim(p_search) = '' or m.title ilike '%' || replace(replace(replace(trim(p_search),'\\','\\\\'),'%','\\%'),'_','\\_') || '%' escape '\\')
      and (p_genre_id is null or exists (
        select 1 from public.movie_genres mg where mg.movie_id = m.id and mg.genre_id = p_genre_id
      ))
      and (p_administrator_id is null and p_recommend is null or exists (
        select 1 from public.reviews r2
        where r2.movie_id = m.id
          and (p_administrator_id is null or r2.administrator_id = p_administrator_id)
          and (p_recommend is null or r2.recommend = p_recommend)
      ))
      and (not p_hide_reviewed or auth.uid() is null or not exists (
        select 1 from public.reviews mine
        join public.administrators a on a.id = mine.administrator_id
        where mine.movie_id = m.id and a.auth_user_id = auth.uid() and a.status = 'active'
      ))
  ), page_rows as (
    select * from matching
    order by
      case when p_sort = 'best' then average_rating end desc nulls last,
      case when p_sort = 'worst' then average_rating end asc nulls last,
      case when p_sort = 'most' then review_count end desc,
      case when p_sort in ('best','worst') then review_count end desc,
      case when p_sort = 'most' then average_rating end desc,
      title asc, id asc
    limit 48 offset (p_page - 1) * 48
  )
  select jsonb_build_object(
    'total', (select count(*) from matching),
    'movies', coalesce((select jsonb_agg(to_jsonb(p) order by
      case when p_sort = 'best' then p.average_rating end desc nulls last,
      case when p_sort = 'worst' then p.average_rating end asc nulls last,
      case when p_sort = 'most' then p.review_count end desc,
      case when p_sort in ('best','worst') then p.review_count end desc,
      case when p_sort = 'most' then p.average_rating end desc,
      p.title asc, p.id asc) from page_rows p), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
grant execute on function public.club_films_page(integer,text,uuid,uuid,boolean,text,boolean) to anon, authenticated;
create index if not exists club_reviews_movie_idx on public.reviews(movie_id);
create index if not exists club_reviews_administrator_movie_idx on public.reviews(administrator_id,movie_id);
create index if not exists club_movie_genres_genre_movie_idx on public.movie_genres(genre_id,movie_id);
