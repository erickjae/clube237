import { createFileRoute } from '@tanstack/react-router';
import { CircleUserRound, ListVideo, Star } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { WatchlistPanel, myWatchlistQueryOptions } from '@/components/watchlist-panel';
import { pageHead } from '@/lib/metadata';
import { loadPanelAccount } from '@/lib/panel-loader';

export const Route = createFileRoute('/_authenticated/painel')({
  head: () => pageHead('Meu Clube237', 'Área privada dos administradores do Clube237.'),
  loader: async ({ context }) => {
    const account = await loadPanelAccount('/painel');
    await context.queryClient.ensureQueryData(myWatchlistQueryOptions);
    return account;
  },
  component: MemberDashboard,
});

function MemberDashboard() {
  const account = Route.useLoaderData();
  const publicName = account.displayName || account.username;

  return (
    <DashboardShell
      eyebrow="Área dos administradores"
      title="Meu Clube237"
      welcome={`Bem-vindo, ${publicName}.`}
      description="Monte sua fila pessoal com os filmes que você quer assistir. Suas avaliações e seu perfil chegarão nas próximas etapas."
      navigation={[
        { label: 'Minha fila', icon: ListVideo, current: true },
        { label: 'Minhas avaliações', icon: Star, note: 'Em breve' },
        { label: 'Meu perfil', icon: CircleUserRound, note: 'Em breve' },
      ]}
    >
      <WatchlistPanel />
    </DashboardShell>
  );
}
