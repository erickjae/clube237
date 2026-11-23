import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CircleUserRound, ListVideo, Star } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { WatchlistPanel, myWatchlistQueryOptions } from '@/components/watchlist-panel';
import { ReviewsPanel, myReviewsQueryOptions } from '@/components/reviews-panel';
import { pageHead } from '@/lib/metadata';
import { loadPanelAccount } from '@/lib/panel-loader';

export const Route = createFileRoute('/_authenticated/painel')({
  head: () => pageHead('Meu Clube237', 'Fila pessoal e avaliações dos administradores do Clube237.'),
  loader: async ({ context }) => {
    const account = await loadPanelAccount('/painel');
    await Promise.all([
      context.queryClient.ensureQueryData(myWatchlistQueryOptions),
      context.queryClient.ensureQueryData(myReviewsQueryOptions),
    ]);
    return account;
  },
  component: MemberDashboard,
});

function MemberDashboard() {
  const account = Route.useLoaderData();
  const publicName = account.displayName || account.username;
  const [section, setSection] = useState<'queue' | 'reviews'>('queue');

  return (
    <DashboardShell
      eyebrow="Área dos administradores"
      title="Meu Clube237"
      welcome={`Bem-vindo, ${publicName}.`}
      description="Monte sua fila pessoal e registre suas percepções depois de cada filme. Seu perfil chegará na próxima etapa."
      navigation={[
        { label: 'Minha fila', icon: ListVideo, current: section === 'queue', onSelect: () => setSection('queue') },
        { label: 'Minhas avaliações', icon: Star, current: section === 'reviews', onSelect: () => setSection('reviews') },
        { label: 'Meu perfil', icon: CircleUserRound, note: 'Em breve' },
      ]}
    >
      {section === 'queue' ? <WatchlistPanel /> : <ReviewsPanel />}
    </DashboardShell>
  );
}
