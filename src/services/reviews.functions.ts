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
      .select('id, title, poster_path, release_date')
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

    const { data: saved, error } = await context.supabase.rpc('submit_club_review', {
      p_movie_id: data.movieId,
      p_rating: data.rating,
      p_recommend: data.recommend,
      p_comment: data.comment,
    });

    if (error) throw new Error(reviewWriteError(error.code));
    return { id: saved.id };
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
