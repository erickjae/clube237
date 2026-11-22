import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { canModifyWatchlistEntry, watchlistWriteError } from '@/lib/watchlist-rules';
import { clubAuth } from './club-auth';

export const myWatchlist = createServerFn({ method: 'GET' })
  .middleware([clubAuth])
  .handler(async ({ context }) => {
    const { data: entries, error } = await context.supabase
      .from('watchlist')
      .select('id, movie_id, added_at')
      .eq('administrator_id', context.account.id)
      .order('added_at', { ascending: false });

    if (error) throw new Error('Não foi possível carregar sua fila.');
    if (entries.length === 0) return [];

    const { data: movies, error: moviesError } = await context.supabase
      .from('movies')
      .select('id, tmdb_id, title, poster_path, release_date')
      .in('id', entries.map((entry) => entry.movie_id));

    if (moviesError) throw new Error('Não foi possível carregar os filmes da sua fila.');
    const movieById = new Map(movies.map((movie) => [movie.id, movie]));

    return entries.flatMap((entry) => {
      const movie = movieById.get(entry.movie_id);
      return movie ? [{
        id: entry.id,
        addedAt: entry.added_at,
        movie: {
          id: movie.id,
          tmdbId: movie.tmdb_id,
          title: movie.title,
          posterPath: movie.poster_path,
          releaseDate: movie.release_date,
        },
      }] : [];
    });
  });

export const addToWatchlist = createServerFn({ method: 'POST' })
  .middleware([clubAuth])
  .inputValidator(z.object({ movieId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    if (context.account.must_change_password) throw new Error('Altere sua senha provisória primeiro.');

    const { data: entry, error } = await context.supabase
      .from('watchlist')
      .insert({ movie_id: data.movieId, administrator_id: context.account.id })
      .select('id')
      .single();

    if (error) throw new Error(watchlistWriteError(error.code));
    return { id: entry.id };
  });

export const removeFromWatchlist = createServerFn({ method: 'POST' })
  .middleware([clubAuth])
  .inputValidator(z.object({ entryId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    if (context.account.must_change_password) throw new Error('Altere sua senha provisória primeiro.');

    const { data: target, error: targetError } = await context.supabase
      .from('watchlist')
      .select('id, administrator_id')
      .eq('id', data.entryId)
      .maybeSingle();

    if (targetError) throw new Error('Não foi possível localizar o filme na fila.');
    if (!target) throw new Error('Este filme não está mais na fila.');
    if (!canModifyWatchlistEntry(context.account.id, target.administrator_id)) {
      throw new Error('Você só pode remover filmes da própria fila.');
    }

    const { data: removed, error } = await context.supabase
      .from('watchlist')
      .delete()
      .eq('id', data.entryId)
      .eq('administrator_id', context.account.id)
      .select('id');

    if (error) throw new Error(watchlistWriteError(error.code));
    if (removed.length === 0) throw new Error('Você só pode remover filmes da própria fila.');
    return { success: true };
  });
