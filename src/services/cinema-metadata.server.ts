import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const person = z.object({ id: z.number().int().positive(), name: z.string().min(1), profile_path: z.string().nullable().optional() });
const details = z.object({
 original_language: z.string(),
 production_countries: z.array(z.object({ iso_3166_1: z.string() })),
 credits: z.object({
  cast: z.array(person.extend({ order: z.number().int().nonnegative() })),
  crew: z.array(person.extend({ job: z.string() })),
 }),
});
const jobSchema = z.object({ movie_id: z.string().uuid(), tmdb_id: z.coerce.number().int().positive(), attempts: z.number().int(), lease_until: z.string() });
class RateLimit extends Error { constructor(readonly delay: number) { super('Rate limited'); } }
async function fetchDetails(id: number) {
 const token = process.env['TMDB_API_TOKEN'];
 if (!token) throw new Error('Missing TMDB configuration');
 const url = new URL('https://api.themoviedb.org/3/movie/'+id);
 url.searchParams.set('append_to_response','credits');
 const bearer = token.includes('.');
 if (!bearer) url.searchParams.set('api_key',token);
 const response = await fetch(url,{headers: bearer ? {Authorization:'Bearer '+token} : {},signal:AbortSignal.timeout(10000)});
 if (response.status === 429) {
  const raw = response.headers.get('Retry-After');
  const seconds = raw && /^\d+$/.test(raw) ? Number(raw) : raw ? Math.ceil((Date.parse(raw)-Date.now())/1000) : 60;
  throw new RateLimit(Number.isFinite(seconds) ? Math.max(60,seconds) : 60);
 }
 if (!response.ok) throw new Error('TMDB unavailable');
 return details.parse(await response.json());
}
export async function processCinemaMetadata() {
 if (!process.env['TMDB_API_TOKEN']) throw new Error('Missing TMDB configuration');
 const seeded = await supabaseAdmin.rpc('seed_cinema_metadata_jobs' as never,{batch_size:100} as never);
 if (seeded.error) throw new Error('Queue seed failed');
 let completed=0, failed=0;
 // One job per invocation keeps execution bounded on serverless infrastructure.
 const claim = await supabaseAdmin.rpc('claim_cinema_metadata_job' as never);
 if (claim.error) throw new Error('Queue claim failed');
 const jobs = z.array(jobSchema).parse(claim.data);
 for (const job of jobs) {
  try {
   const d = await fetchDetails(job.tmdb_id);
   const people = [
    ...d.credits.cast.filter(p=>p.order<10).map(p=>({id:p.id,name:p.name,profile_path:p.profile_path??null,role:'cast',billing_order:p.order})),
    ...d.credits.crew.filter(p=>p.job==='Director').map(p=>({id:p.id,name:p.name,profile_path:p.profile_path??null,role:'director',billing_order:null})),
   ];
   const result = await supabaseAdmin.rpc('complete_cinema_metadata_job' as never,{p_movie:job.movie_id,p_lease:job.lease_until,p_payload:{people,language:d.original_language,countries:d.production_countries.map(c=>c.iso_3166_1)}} as never);
   if (result.error || result.data !== true) throw new Error('Metadata completion failed');
   completed++;
  } catch(error) {
   const delay = error instanceof RateLimit ? error.delay : Math.min(86400,60*2**job.attempts);
   if (error instanceof RateLimit) {
    const pause = await supabaseAdmin.rpc('pause_cinema_metadata' as never,{p_delay:Math.min(86400,delay)} as never);
    if (pause.error) throw new Error('Queue cooldown failed');
   }
   const result = await supabaseAdmin.rpc('fail_cinema_metadata_job' as never,{p_movie:job.movie_id,p_lease:job.lease_until,p_delay:delay} as never);
   if (result.error) throw new Error('Queue failure recording failed');
   failed++;
  }
 }
 return {completed,failed};
}
