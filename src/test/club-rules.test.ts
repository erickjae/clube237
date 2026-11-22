import { describe, expect, it } from 'vitest';
import { isReleased, metadataFresh, selectOverview, reviewSchema, MAX_AVATAR_BYTES, AVATAR_TYPES, MAX_FAVORITE_GENRES } from '@/lib/club-rules';
describe('Clube237 business rules', () => {
  it('allows ratings from 0 to 10 with at most one decimal', () => {
    const parse = (rating: number) => reviewSchema.safeParse({ rating, recommend: true, comment: 'Um filme.' }).success;
    expect(parse(0)).toBe(true); expect(parse(10)).toBe(true); expect(parse(7.3)).toBe(true);
    expect(parse(-0.1)).toBe(false); expect(parse(10.1)).toBe(false); expect(parse(7.35)).toBe(false);
  });
  it('requires a boolean recommendation', () => { expect(reviewSchema.safeParse({ rating: 5, recommend: 'yes', comment: 'Bom' }).success).toBe(false); });
  it('requires a comment between 2 and 1000 characters', () => {
    const parse = (comment: string) => reviewSchema.safeParse({ rating: 5, recommend: false, comment }).success;
    expect(parse('ab')).toBe(true); expect(parse('a'.repeat(1000))).toBe(true); expect(parse('a')).toBe(false); expect(parse('a'.repeat(1001))).toBe(false); expect(parse('  ')).toBe(false);
  });
  it('excludes missing, invalid and future release dates', () => {
    expect(isReleased('', '2026-11-22')).toBe(false); expect(isReleased('2026-02-30','2026-11-22')).toBe(false); expect(isReleased('2026-11-23','2026-11-22')).toBe(false); expect(isReleased('2026-11-22','2026-11-22')).toBe(true);
  });
  it('refreshes metadata at exactly 30 days', () => { const start = Date.parse('2026-10-01T00:00:00Z'); expect(metadataFresh('2026-10-01T00:00:00Z', start+30*86400000-1)).toBe(true); expect(metadataFresh('2026-10-01T00:00:00Z', start+30*86400000)).toBe(false); });
  it('prioritizes Portuguese, then English, then empty overview', () => { expect(selectOverview('PT','EN')).toBe('PT'); expect(selectOverview('','EN')).toBe('EN'); expect(selectOverview(null,null)).toBe(''); });
  it('caps favorite genres at five', () => { expect(MAX_FAVORITE_GENRES).toBe(5); });
  it('caps avatars at 5 MB', () => { expect(MAX_AVATAR_BYTES).toBe(5242880); });
  it('only accepts JPG PNG and WebP', () => { expect(AVATAR_TYPES).toEqual(['image/jpeg','image/png','image/webp']); expect(AVATAR_TYPES.includes('image/gif')).toBe(false); });
});