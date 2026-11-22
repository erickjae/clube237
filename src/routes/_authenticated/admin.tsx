import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRight, LayoutDashboard, UsersRound } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { AdministratorManagement, administratorsQueryOptions } from '@/components/administrator-management';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/metadata';
import { loadPanelAccount } from '@/lib/panel-loader';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => pageHead('Painel do Proprietário', 'Área privada do proprietário do Clube237.'),
  loader: async ({ context }) => {
    const account = await loadPanelAccount('/admin');
    await context.queryClient.ensureQueryData(administratorsQueryOptions);
    return account;
  },
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const account = Route.useLoaderData();
  const { data } = useSuspenseQuery(administratorsQueryOptions);
  const [section, setSection] = useState<'overview' | 'administrators'>('overview');

  return (
    <DashboardShell
      eyebrow="Acesso do proprietário"
      title="Painel do Proprietário"
      welcome={`Bem-vindo, ${account.username}.`}
      description="Gerencie os acessos dos administradores e acompanhe a situação de cada conta do Clube237."
      navigation={[
        { label: 'Visão geral', icon: LayoutDashboard, current: section === 'overview', onSelect: () => setSection('overview') },
        { label: 'Administradores', icon: UsersRound, current: section === 'administrators', onSelect: () => setSection('administrators') },
      ]}
    >
      {section === 'overview' ? (
        <section className="owner-overview" aria-labelledby="owner-total-title">
          <div>
            <p className="dashboard-section-number">Contas convidadas</p>
            <h2 id="owner-total-title">Administradores cadastrados</h2>
            <p>O proprietário não faz parte desta contagem.</p>
          </div>
          <strong>{data.total}</strong>
          <Button variant="outline" onClick={() => setSection('administrators')}>Gerenciar administradores<ArrowRight /></Button>
        </section>
      ) : <AdministratorManagement />}
    </DashboardShell>
  );
}
