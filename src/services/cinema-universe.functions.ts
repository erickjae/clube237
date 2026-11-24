import { z } from 'zod';
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

export type CinemaSuggestion = { id:string; title:string; poster_path:string|null; reason:string; average_rating:number; total:number };
export const myCinemaSuggestions = createServerFn({method:'GET'}).middleware([clubAuth]).handler(async ({context})=>{
 if(context.account.must_change_password) throw new Error('Atualize sua senha para continuar.');
 const {data,error}=await context.supabase.rpc('my_cinema_suggestions' as never);
 if(error || !data) throw new Error('Não foi possível carregar sugestões.');
 return data as unknown as CinemaSuggestion[];
});

export type CinemaFilmPage = {total:number;items:{movie_id:string;title:string;rating:number;recommend:boolean;poster_path:string|null;runtime:number|null;release_date:string|null;created_at:string}[]};
export const myCinemaFilms=createServerFn({method:'GET'}).middleware([clubAuth]).inputValidator(z.object({kind:z.enum(['all','recommended','not_recommended','perfect','genre','month','decade','cast','director']),value:z.string().max(150),page:z.number().int().min(0).max(100000)})).handler(async({data,context})=>{
 if(context.account.must_change_password) throw new Error('Atualize sua senha para continuar.');
 const {data:result,error}=await context.supabase.rpc('my_cinema_films' as never,{p_kind:data.kind,p_value:data.value,p_page:data.page} as never);
 if(error||!result) throw new Error('Não foi possível carregar os filmes.');
 return result as unknown as CinemaFilmPage;
});
