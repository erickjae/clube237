import { z } from 'zod';
const movie = z.object({ id: z.number(), title: z.string(), original_title: z.string().default(''), overview: z.string().default(''), poster_path: z.string().nullable().default(null), backdrop_path: z.string().nullable().default(null), release_date: z.string().default(''), runtime: z.number().nullable().optional(), genres: z.array(z.object({ id: z.number(), name: z.string() })).optional() });
export async function tmdb(path: string, params: Record<string, string>) {
  const response = await tmdbRequest(path, params);
  return z.object({ results: z.array(movie) }).parse(response);
}
export async function tmdbMovie(id: number, language: string) {
  return movie.parse(await tmdbRequest(`/movie/${id}`, { language }));
}
export async function tmdbRequest(path: string, params: Record<string, string>) {
  const token = process.env['TMDB_API_TOKEN'];
  if (!token) throw new Error('A pesquisa aguarda a configuração do TMDB.');
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [key,value] of Object.entries(params)) url.searchParams.set(key,value);
  // Accept either TMDB's read token or its v3 API key, both remain server-only.
  const bearer = token.includes('.');
  if (!bearer) url.searchParams.set('api_key',token);
  const response = await fetch(url, { headers: bearer ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('O TMDB está indisponível. Tente novamente mais tarde.');
  return response.json() as Promise<unknown>;
}