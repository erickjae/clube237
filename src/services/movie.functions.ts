import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { clubAuth } from './club-auth';
import { metadataFresh, selectOverview } from '@/lib/club-rules';

export const registerMovie = createServerFn({ method: 'POST' }).middleware([clubAuth]).inputValidator(z.object({ tmdbId: z.number().int().positive() })).handler(async ({ data, context }) => {
  if (context.account.must_change_password) throw new Error('Altere sua senha provisória primeiro.');
  const { data: existing } = await context.supabase.from('movies').select('*').eq('tmdb_id', data.tmdbId).maybeSingle();
  if (existing && metadataFresh(existing.metadata_updated_at)) return existing;
  try {
    const { tmdbMovie } = await import('./tmdb.server');
    const movie = await tmdbMovie(data.tmdbId, 'pt-BR');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(movie.release_date)) throw new Error('O filme precisa ter uma data de estreia válida.');
    const english = movie.overview.trim() ? null : await tmdbMovie(data.tmdbId, 'en-US');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: stored, error } = await supabaseAdmin.rpc('store_tmdb_movie', { payload: { tmdb_id: movie.id, title: movie.title, original_title: movie.original_title, overview: selectOverview(movie.overview, english?.overview ?? null), poster_path: movie.poster_path, backdrop_path: movie.backdrop_path, release_date: movie.release_date, runtime: movie.runtime ?? null, genres: movie.genres ?? [] } });
    if (error) throw new Error('Não foi possível guardar o filme.');
    return stored;
  } catch (error) { if (existing) return existing; throw error; }
});