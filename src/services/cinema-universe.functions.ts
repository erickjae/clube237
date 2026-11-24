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
