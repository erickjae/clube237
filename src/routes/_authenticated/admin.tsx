import { createFileRoute } from '@tanstack/react-router';
import { LayoutDashboard, UsersRound } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { pageHead } from '@/lib/metadata';
import { loadPanelAccount } from '@/lib/panel-loader';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => pageHead('Painel do Proprietário', 'Área privada do proprietário do Clube237.'),
  loader: () => loadPanelAccount('/admin'),
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const account = Route.useLoaderData();

  return (
    <DashboardShell
      eyebrow="Acesso do proprietário"
      title="Painel do Proprietário"
      welcome={`Bem-vindo, ${account.username}.`}
      description="Este é o seu espaço reservado no Clube237. A gestão de administradores será adicionada na próxima etapa."
      navigation={[
        { label: 'Visão geral', icon: LayoutDashboard, current: true },
        { label: 'Administradores', icon: UsersRound, note: 'Próxima etapa' },
      ]}
    />
  );
}
