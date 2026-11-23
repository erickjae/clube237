import { createServerFn } from '@tanstack/react-start';
import { clubAuth } from './club-auth';

type Insights = {
  reviewed: number;
  recommended: number;
  notRecommended: number;
  queue: number;
  averageRating: number | null;
  recommendationPercent: number | null;
  genreCounts: { name: string; count: number }[];
  thisMonth: number;
  last30Days: number;
  nextStep: string;
  latestReview: { movie_id: string; title: string; rating: number; created_at: string } | null;
};

export const myDashboard = createServerFn({ method: 'GET' }).middleware([clubAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.rpc('my_club_insights' as never);
  if (error || !data) throw new Error('Não foi possível carregar os indicadores.');
  return data as unknown as Insights;
});
