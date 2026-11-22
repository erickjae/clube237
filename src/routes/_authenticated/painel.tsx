import { createFileRoute } from '@tanstack/react-router';
import { CircleUserRound, ListVideo, Star } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { pageHead } from '@/lib/metadata';
import { loadPanelAccount } from '@/lib/panel-loader';

export const Route = createFileRoute('/_authenticated/painel')({
  head: () => pageHead('Meu Clube237', 'Área privada dos administradores do Clube237.'),
  loader: () => loadPanelAccount('/painel'),
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
      description="Sua fila, suas avaliações e seu perfil serão reunidos aqui nas próximas etapas do clube."
      navigation={[
        { label: 'Minha fila', icon: ListVideo, note: 'Em breve' },
        { label: 'Minhas avaliações', icon: Star, note: 'Em breve' },
        { label: 'Meu perfil', icon: CircleUserRound, note: 'Em breve' },
      ]}
    />
  );
}
