import { createServerFn } from '@tanstack/react-start';
import { clubAuth } from './club-auth';

export const myDashboard = createServerFn({ method: 'GET' }).middleware([clubAuth]).handler(async ({ context }) => {
  const db = context.supabase;
  const [reviews, queue] = await Promise.all([
    db.from('reviews').select('movie_id, rating, recommend').eq('administrator_id', context.account.id),
    db.from('watchlist').select('id', { count: 'exact', head: true }).eq('administrator_id', context.account.id),
  ]);
  if (reviews.error || queue.error) throw new Error('Não foi possível carregar os indicadores.');
  const items = reviews.data ?? [];
  const movieIds = [...new Set(items.map(r => r.movie_id))];
  let genreCounts: { name: string; count: number }[] = [];
  if (movieIds.length) {
    const [relations, genres] = await Promise.all([
      db.from('movie_genres').select('movie_id, genre_id').in('movie_id', movieIds),
      db.from('genres').select('id, name'),
    ]);
    if (relations.error || genres.error) throw new Error('Não foi possível carregar os gêneros.');
    const names = new Map((genres.data ?? []).map(g => [g.id, g.name]));
    const counts = new Map<string, number>();
    for (const r of relations.data ?? []) {
      const name = names.get(r.genre_id);
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    genreCounts = [...counts].map(([name,count]) => ({name,count})).sort((a,b) => b.count-a.count || a.name.localeCompare(b.name,'pt-BR'));
  }
  const recommended = items.filter(r => r.recommend).length;
  return {
    reviewed: items.length, recommended, notRecommended: items.length - recommended,
    queue: queue.count ?? 0,
    averageRating: items.length ? items.reduce((sum,r) => sum+Number(r.rating),0)/items.length : null,
    recommendationPercent: items.length ? recommended/items.length*100 : null,
    genreCounts,
  };
});
