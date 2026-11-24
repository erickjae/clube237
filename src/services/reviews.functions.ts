import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { reviewSchema } from '@/lib/club-rules';
import { canModifyReview, reviewWriteError } from '@/lib/review-rules';
import { clubAuth } from './club-auth';

export const myReviews = createServerFn({ method: 'GET' })
  .middleware([clubAuth])
  .handler(async ({ context }) => {
    const { data: reviews, error } = await context.supabase
      .from('reviews')
      .select('id, movie_id, rating, recommend, comment, created_at')
      .eq('administrator_id', context.account.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error('Não foi possível carregar suas avaliações.');
    if (reviews.length === 0) return [];

    const { data: movies, error: moviesError } = await context.supabase
      .from('movies')
      .select('id, tmdb_id, title, poster_path, release_date')
      .in('id', reviews.map((review) => review.movie_id));

    if (moviesError) throw new Error('Não foi possível carregar os filmes avaliados.');
    const movieById = new Map(movies.map((movie) => [movie.id, movie]));

    return reviews.flatMap((review) => {
      const movie = movieById.get(review.movie_id);
      return movie ? [{
        id: review.id,
        rating: Number(review.rating),
        recommend: review.recommend,
        comment: review.comment,
        createdAt: review.created_at,
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

export const submitReview = createServerFn({ method: 'POST' })
  .middleware([clubAuth])
  .inputValidator(reviewSchema.extend({ movieId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    if (context.account.must_change_password) throw new Error('Altere sua senha provisória primeiro.');

    const { data: movie } = await context.supabase.from('movies').select('release_date').eq('id', data.movieId).maybeSingle();
    if (movie && movie.release_date > new Date().toISOString().slice(0, 10)) throw new Error('Este filme ainda não estreou. Você poderá avaliá-lo após o lançamento.');
    const { data: saved, error } = await context.supabase.rpc('submit_club_review', {
      p_movie_id: data.movieId,
      p_rating: data.rating,
      p_recommend: data.recommend,
      p_comment: data.comment,
    });

    if (error) throw new Error(reviewWriteError(error.code));
    return { id: saved.id };
  });

export const submitDirectReview = createServerFn({ method: 'POST' })
  .middleware([clubAuth])
  .inputValidator(reviewSchema.extend({ movieId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    if (context.account.must_change_password) throw new Error('Altere sua senha provisória primeiro.');
    const { data: movie } = await context.supabase.from('movies').select('release_date').eq('id', data.movieId).maybeSingle();
    if (movie && movie.release_date > new Date().toISOString().slice(0, 10)) throw new Error('Este filme ainda não estreou. Você poderá avaliá-lo após o lançamento.');
    const { data: saved, error } = await context.supabase.rpc('submit_direct_club_review' as never, {
      p_movie_id: data.movieId,
      p_rating: data.rating,
      p_recommend: data.recommend,
      p_comment: data.comment,
    } as never);
    if (error) throw new Error(reviewWriteError(error.code));
    return { id: (saved as unknown as { id: string }).id };
  });

export const deleteReview = createServerFn({ method: 'POST' })
  .middleware([clubAuth])
  .inputValidator(z.object({ reviewId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    if (context.account.must_change_password) throw new Error('Altere sua senha provisória primeiro.');

    const { data: target, error: targetError } = await context.supabase
      .from('reviews')
      .select('id, administrator_id')
      .eq('id', data.reviewId)
      .maybeSingle();

    if (targetError) throw new Error('Não foi possível localizar a avaliação.');
    if (!target) throw new Error('Esta avaliação já foi excluída.');
    if (!canModifyReview(context.account.id, target.administrator_id)) {
      throw new Error('Você só pode excluir as próprias avaliações.');
    }

    const { data: removed, error } = await context.supabase
      .from('reviews')
      .delete()
      .eq('id', data.reviewId)
      .eq('administrator_id', context.account.id)
      .select('id');

    if (error) throw new Error(reviewWriteError(error.code));
    if (removed.length === 0) throw new Error('Você só pode excluir as próprias avaliações.');
    return { success: true };
  });

export const myReviewsPage = createServerFn({ method: 'POST' })
  .middleware([clubAuth])
  .inputValidator(z.object({
    page: z.number().int().min(1).max(100000),
    search: z.string().trim().max(100),
    recommendation: z.enum(['all', 'yes', 'no']),
    sort: z.enum(['newest', 'oldest', 'highest', 'lowest']),
  }))
  .handler(async ({ context, data }) => {
    const orderColumn = data.sort === 'highest' || data.sort === 'lowest' ? 'rating' : 'created_at';
    const ascending = data.sort === 'oldest' || data.sort === 'lowest';
    let query = context.supabase.from('reviews')
      .select('id, movie_id, rating, recommend, comment, created_at, movie:movies!inner(id, tmdb_id, title, poster_path, release_date)', { count: 'exact' })
      .eq('administrator_id', context.account.id);
    if (data.search) query = query.ilike('movie.title', `%${data.search.replace(/[%,_]/g, '')}%`);
    if (data.recommendation !== 'all') query = query.eq('recommend', data.recommendation === 'yes');
    const { data: rows, count, error } = await query
      .order(orderColumn, { ascending })
      .order('id', { ascending: true })
      .range((data.page - 1) * 20, data.page * 20 - 1);
    if (error) throw new Error('Não foi possível carregar seu histórico.');
    return {
      total: count ?? 0,
      reviews: (rows ?? []).map(r => ({
        id: r.id, rating: Number(r.rating), recommend: r.recommend,
        comment: r.comment, createdAt: r.created_at,
        movie: { id: r.movie.id, tmdbId: r.movie.tmdb_id, title: r.movie.title,
          posterPath: r.movie.poster_path, releaseDate: r.movie.release_date },
      })),
    };
  });

/** Update an existing review owned by the authenticated administrator. */
export const updateMyReview = createServerFn({ method: 'POST' })
  .middleware([clubAuth])
  .inputValidator(reviewSchema.extend({ reviewId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    if (context.account.must_change_password) throw new Error('Altere sua senha provisória primeiro.');
    const { data: updated, error } = await context.supabase.from('reviews')
      .update({ rating: data.rating, recommend: data.recommend, comment: data.comment })
      .eq('id', data.reviewId)
      .eq('administrator_id', context.account.id)
      .select('id');
    if (error) throw new Error(reviewWriteError(error.code));
    if (!updated?.[0]) throw new Error('Avaliação não encontrada ou sem permissão para editar.');
    return { id: updated[0].id };
  });
