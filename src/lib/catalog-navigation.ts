import { z } from 'zod';
const uuidOrEmpty = z.union([z.string().uuid(), z.literal('')]).catch('');
export const catalogSearchSchema = z.object({
  query: z.string().max(100).catch(''),
  genreId: uuidOrEmpty,
  administratorId: uuidOrEmpty,
  recommend: z.enum(['', 'yes', 'no']).catch(''),
  sort: z.enum(['best', 'worst', 'most', 'title']).catch('best'),
  hideReviewed: z.boolean().catch(false),
  page: z.number().int().min(1).max(100000).catch(1),
});
export const movieDetailSearchSchema = z.object({
  fromCatalog: z.boolean().optional(),
  catalog: catalogSearchSchema.optional(),
});
