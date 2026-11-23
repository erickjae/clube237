import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { isReleased } from '@/lib/club-rules';

export const publicCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const { publicClient } = await import('./public-client.server');
  const db = publicClient();
  const [movies, reviews, profiles, queue] = await Promise.all([
    db.from('movies').select('id, title, poster_path, release_date, overview').order('created_at', { ascending: false }).limit(500),
    db.from('reviews').select('id, rating, recommend, comment, movie_id, administrator_id, created_at').order('created_at', { ascending: false }).limit(50),
    db.from('profiles').select('id, display_name, avatar_url, about').order('created_at').limit(6),
    db.from('watchlist').select('id, movie_id, administrator_id, added_at').order('added_at', { ascending: false }).limit(24),
  ]);
  if (movies.error || reviews.error || profiles.error || queue.error) throw new Error('O acervo não está disponível agora.');
  const { data: reviewedIds, error: reviewedError } = await db.from('reviews').select('movie_id');
  if (reviewedError) throw new Error('Não foi possível carregar os filmes avaliados.');
  const ids = new Set((reviewedIds ?? []).map((review) => review.movie_id));
  return { movies: movies.data, reviewedMovies: (movies.data ?? []).filter((movie) => ids.has(movie.id)), reviews: reviews.data, profiles: profiles.data, queue: queue.data };
});

export const searchMovies = createServerFn({ method: 'POST' }).inputValidator(z.object({ query: z.string().trim().min(2).max(100) })).handler(async ({ data }) => {
  const { tmdb } = await import('./tmdb.server');
  const response = await tmdb('/search/movie', { query: data.query, language: 'pt-BR', include_adult: 'false' });
  return response.results.filter(movie => isReleased(movie.release_date)).map(movie => ({ tmdb_id: movie.id, title: movie.title, poster_path: movie.poster_path, release_date: movie.release_date, overview: movie.overview }));
});