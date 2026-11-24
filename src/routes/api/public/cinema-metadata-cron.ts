import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/cinema-metadata-cron')({
 server: { handlers: { GET: async ({ request }) => {
  const secret = process.env['CRON_SECRET'];
  if (!secret || process.env['CINEMA_METADATA_ENABLED'] !== 'true') return new Response('Disabled', {status:503});
  const { createHash, timingSafeEqual } = await import('node:crypto');
  const digest = (s:string) => createHash('sha256').update(s).digest();
  if (!timingSafeEqual(digest(request.headers.get('authorization') ?? ''),digest('Bearer '+secret))) return new Response('Unauthorized',{status:401});
  try {
   const { processCinemaMetadata } = await import('@/services/cinema-metadata.server');
   return Response.json(await processCinemaMetadata(),{headers:{'Cache-Control':'no-store'}});
  } catch {
   return new Response('Metadata processing failed',{status:503});
  }
 } } },
});
