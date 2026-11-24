import { createServerFn } from '@tanstack/react-start';
import { clubAuth } from './club-auth';

export type CinemaUniverse = {
 totals: { reviewed: number; recommended: number; average_rating: number | null; min_rating: number | null; max_rating: number | null; minutes: number; runtime_coverage: number; perfect: number; last30: number };
 genres: { name: string; total: number; average_rating: number | null }[];
 months: { month: string; total: number }[];
 decades: { decade: number; total: number }[];
 favorites: { movie_id: string; title: string; rating: number }[];
};

export const myCinemaUniverse = createServerFn({ method: 'GET' }).middleware([clubAuth]).handler(async ({ context }) => {
 if (context.account.must_change_password) throw new Error('Atualize sua senha para continuar.');
 const { data, error } = await context.supabase.rpc('my_cinema_universe' as never);
 if (error || !data) throw new Error('Não foi possível carregar seu universo.');
 return data as unknown as CinemaUniverse;
});

export type CinemaPeople = {
 coverage: number;
 actors: CinemaPerson[];
 directors: CinemaPerson[];
 languages: { name: string; total: number }[];
 countries: { name: string; total: number }[];
};
type CinemaPerson = { tmdb_id: number; name: string; profile_path: string | null; total: number; average_rating: number; recommendation_percent: number };
export const myCinemaPeople = createServerFn({ method: 'GET' }).middleware([clubAuth]).handler(async ({ context }) => {
 if (context.account.must_change_password) throw new Error('Atualize sua senha para continuar.');
 const { data, error } = await context.supabase.rpc('my_cinema_universe_people' as never);
 if (error || !data) throw new Error('Não foi possível carregar os créditos.');
 return data as unknown as CinemaPeople;
});

export type CinemaAffinity = { id: string; display_name: string; common: number; affinity: number };
export const myCinemaAffinity = createServerFn({ method: 'GET' }).middleware([clubAuth]).handler(async ({ context }) => {
 if (context.account.must_change_password) throw new Error('Atualize sua senha para continuar.');
 const { data, error } = await context.supabase.rpc('my_cinema_affinity' as never);
 if (error || !data) throw new Error('Não foi possível carregar afinidades.');
 return data as unknown as CinemaAffinity[];
});
