import { describe, expect, it } from 'vitest';
import { canModifyReview, reviewWriteError } from '@/lib/review-rules';

describe('Review ownership and cycle rules', () => {
  it('allows administrators to delete their own reviews', () => {
    expect(canModifyReview('account-a', 'account-a')).toBe(true);
  });

  it('prevents administrators from changing another account review', () => {
    expect(canModifyReview('account-a', 'account-b')).toBe(false);
  });

  it('rejects a second review for the same administrator and movie', () => {
    expect(reviewWriteError('23505')).toBe('Você já avaliou este filme. Exclua a avaliação anterior para iniciar um novo ciclo.');
  });

  it('requires the movie to return to the queue before a new review', () => {
    expect(reviewWriteError('P0001')).toBe('Adicione o filme à sua fila antes de avaliar.');
  });
});
