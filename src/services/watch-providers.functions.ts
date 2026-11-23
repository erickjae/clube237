import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const provider = z.object({
  provider_id: z.number(),
  provider_name: z.string(),
  logo_path: z.string().nullable(),
});
const country = z.object({
  link: z.string().url().optional(),
  flatrate: z.array(provider).optional(),
  rent: z.array(provider).optional(),
  buy: z.array(provider).optional(),
});
const responseSchema = z.object({ results: z.object({ BR: country.optional() }).passthrough() });

export const movieWatchProviders = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ tmdbId: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const { tmdbRequest } = await import('./tmdb.server');
    const result = responseSchema.parse(await tmdbRequest(`/movie/${data.tmdbId}/watch/providers`, {}));
    const br = result.results.BR;
    return {
      link: br?.link ?? null,
      streaming: br?.flatrate ?? [],
      rent: br?.rent ?? [],
      buy: br?.buy ?? [],
    };
  });
