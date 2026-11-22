import { z } from 'zod';

export const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,32}$/, 'Use de 3 a 32 letras, números ou sublinhados.');
export const passwordSchema = z.string().min(8, 'Use pelo menos 8 caracteres.').max(128);
export const reviewSchema = z.object({ rating: z.number().min(0).max(10).refine(n => Math.abs(n * 10 - Math.round(n * 10)) < 1e-8), recommend: z.boolean(), comment: z.string().trim().min(2).max(1000) });
export const MAX_FAVORITE_GENRES = 5;
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export function isReleased(date: string | null | undefined, today = new Date().toISOString().slice(0, 10)) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date && date <= today;
}
export function metadataFresh(updated: string, now = Date.now()) {
  return now - new Date(updated).getTime() < 30 * 24 * 60 * 60 * 1000;
}
export function selectOverview(portuguese: string | null, english: string | null) {
  return portuguese?.trim() || english?.trim() || '';
}