import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const publicCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const { publicClient } = await import('./public-client.server');
  const db = publicClient();
  const [movies, reviews, profiles, queue, genres, favoriteGenres, movieGenres] = await Promise.all([
    db.from('movies').select('id, tmdb_id, title, poster_path, release_date, overview').order('created_at', { ascending: false }).limit(500),
    db.from('reviews').select('id, rating, recommend, comment, movie_id, administrator_id, created_at').order('created_at', { ascending: false }).limit(1000),
    db.from('profiles').select('id, administrator_id, display_name, avatar_url, about, rating_philosophy').order('created_at').limit(6),
    db.from('watchlist').select('id, movie_id, administrator_id, added_at').order('added_at', { ascending: false }).limit(24),
    db.from('genres').select('id, name'),
    db.from('profile_favorite_genres').select('profile_id, genre_id'),
    db.from('movie_genres').select('movie_id, genre_id'),
  ]);
  if (movies.error || reviews.error || profiles.error || queue.error || genres.error || favoriteGenres.error || movieGenres.error) throw new Error('O acervo não está disponível agora.');
  const { data: reviewedIds, error: reviewedError } = await db.from('reviews').select('movie_id');
  if (reviewedError) throw new Error('Não foi possível carregar os filmes avaliados.');
  const ids = new Set((reviewedIds ?? []).map((review) => review.movie_id));
  return { movies: movies.data, reviewedMovies: (movies.data ?? []).filter((movie) => ids.has(movie.id)), reviews: reviews.data, profiles: profiles.data, queue: queue.data, genres: genres.data, favoriteGenres: favoriteGenres.data, movieGenres: movieGenres.data };
});

export const searchMovies = createServerFn({ method: 'POST' }).inputValidator(z.object({ query: z.string().trim().min(2).max(100) })).handler(async ({ data }) => {
  const { tmdb } = await import('./tmdb.server');
  const response = await tmdb('/search/movie', { query: data.query, language: 'pt-BR', include_adult: 'false' });
  return response.results.filter(movie => movie.release_date && /^\d{4}-\d{2}-\d{2}$/.test(movie.release_date)).map(movie => ({ tmdb_id: movie.id, title: movie.title, poster_path: movie.poster_path, release_date: movie.release_date, overview: movie.overview }));
});
const filmPageInput = z.object({
  page: z.number().int().min(1).max(100000).default(1),
  search: z.string().trim().max(100).default(''),
  genreId: z.string().uuid().nullable().default(null),
  administratorId: z.string().uuid().nullable().default(null),
  recommend: z.boolean().nullable().default(null),
  sort: z.enum(['best', 'worst', 'most', 'title']).default('best'),
  hideReviewed: z.boolean().default(false),
  accessToken: z.string().max(4096).optional(),
});

export const publicFilmsPage = createServerFn({ method: 'POST' })
  .inputValidator(filmPageInput)
  .handler(async ({ data }) => {
    const { publicClient } = await import('./public-client.server');
    const db = publicClient();
    let verifiedToken: string | undefined;
    if (data.hideReviewed && data.accessToken) {
      const { data: identity, error } = await db.auth.getUser(data.accessToken);
      if (!error && identity.user) verifiedToken = data.accessToken;
    }
    // Only validated sessions can influence the personal watched filter.
    const client = verifiedToken ? publicClient(verifiedToken) : db;
    const { data: result, error } = await client.rpc('club_films_page' as never, {
      p_page: data.page,
      p_search: data.search,
      p_genre_id: data.genreId,
      p_administrator_id: data.administratorId,
      p_recommend: data.recommend,
      p_sort: data.sort,
      p_hide_reviewed: !!verifiedToken && data.hideReviewed,
    } as never);
    if (error) throw new Error('Não foi possível carregar a página de filmes.');
    return result as unknown as {
      total: number;
      movies: Array<{ id: string; title: string; poster_path: string | null; release_date: string; review_count: number; average_rating: number; genres: string[] }>;
    };
  });

export const publicFilmFilters = createServerFn({ method: 'GET' }).handler(async () => {
  const { publicClient } = await import('./public-client.server');
  const db = publicClient();
  const [genres, profiles] = await Promise.all([
    db.from('genres').select('id, name').order('name'),
    db.from('profiles').select('administrator_id, display_name').order('display_name'),
  ]);
  if (genres.error || profiles.error) throw new Error('Não foi possível carregar os filtros.');
  return { genres: genres.data ?? [], profiles: profiles.data ?? [] };
  });
/** Homepage-only payload: six recent reviews and six recent queue entries. */
export const publicHome = createServerFn({ method: 'GET' }).handler(async () => {
  const { publicClient } = await import('./public-client.server');
  const db = publicClient();
  const [reviews, queue] = await Promise.all([
    db.from('reviews').select('id, rating, recommend, movie_id, administrator_id, created_at').order('created_at', { ascending: false }).order('id').limit(6),
    db.from('watchlist').select('id, movie_id, administrator_id, added_at').order('added_at', { ascending: false }).order('id').limit(6),
  ]);
  if (reviews.error || queue.error) throw new Error('O acervo não está disponível agora.');
  const entries = [...(reviews.data ?? []), ...(queue.data ?? [])];
  const movieIds = [...new Set(entries.map(entry => entry.movie_id))];
  const memberIds = [...new Set(entries.map(entry => entry.administrator_id))];
  const [movies, profiles] = await Promise.all([
    movieIds.length ? db.from('movies').select('id, title, poster_path').in('id', movieIds) : { data: [], error: null },
    memberIds.length ? db.from('profiles').select('id, administrator_id, display_name').in('administrator_id', memberIds) : { data: [], error: null },
  ]);
  if (movies.error || profiles.error) throw new Error('Não foi possível carregar os filmes recentes.');
  return { reviews: reviews.data ?? [], queue: queue.data ?? [], profiles: profiles.data ?? [], movies: movies.data ?? [] };
});
