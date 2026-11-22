import { describe, expect, it } from 'vitest';
import { canModifyWatchlistEntry, watchlistWriteError } from '@/lib/watchlist-rules';

describe('Watchlist rules', () => {
  it('allows administrators to modify their own queue entries', () => {
    expect(canModifyWatchlistEntry('account-a', 'account-a')).toBe(true);
  });

  it('prevents administrators from modifying another account queue entry', () => {
    expect(canModifyWatchlistEntry('account-a', 'account-b')).toBe(false);
  });

  it('rejects duplicate movies in the same queue with a clear message', () => {
    expect(watchlistWriteError('23505')).toBe('Este filme já está na sua fila.');
  });
});
