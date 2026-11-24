import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CircleUserRound, Orbit, ListVideo, Star } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { WatchlistPanel, myWatchlistQueryOptions } from '@/components/watchlist-panel';
import { ReviewsPanel } from '@/components/reviews-panel';
import { CinemaUniverse } from '@/components/cinema-universe';
import { ProfilePanel, myProfileQueryOptions } from '@/components/profile-panel';
import { pageHead } from '@/lib/metadata';
import { loadPanelAccount } from '@/lib/panel-loader';

export const Route = createFileRoute('/_authenticated/painel')({
  head: () => pageHead('Meu Clube237', 'Fila pessoal e avaliações dos administradores do Clube237.'),
  loader: async ({ context }) => {
    const account = await loadPanelAccount('/painel');
    await Promise.all([
      context.queryClient.ensureQueryData(myWatchlistQueryOptions),
      context.queryClient.ensureQueryData(myProfileQueryOptions),
    ]);
    return account;
  },
  component: MemberDashboard,
});

function MemberDashboard() {
  const account = Route.useLoaderData();
  const publicName = account.displayName || account.username;
  const [section, setSection] = useState<'overview' | 'queue' | 'reviews' | 'profile'>('overview');

  return (
    <DashboardShell
      eyebrow="Área dos administradores"
      title="Meu Clube237"
      welcome={`Bem-vindo, ${publicName}.`}
      description="Monte sua fila pessoal e registre suas percepções depois de cada filme. Personalize seu perfil, organize sua fila e compartilhe suas percepções."
      navigation={[
        { label: 'Meu universo', icon: Orbit, current: section === 'overview', onSelect: () => setSection('overview') },
        { label: 'Minha fila', icon: ListVideo, current: section === 'queue', onSelect: () => setSection('queue') },
        { label: 'Minhas avaliações', icon: Star, current: section === 'reviews', onSelect: () => setSection('reviews') },
        { label: 'Meu perfil', icon: CircleUserRound, current: section === 'profile', onSelect: () => setSection('profile') },
      ]}
    >
      {section === 'overview' ? <CinemaUniverse memberKey={account.username} /> : section === 'queue' ? <WatchlistPanel /> : section === 'reviews' ? <ReviewsPanel /> : <ProfilePanel />}
    </DashboardShell>
  );
}
