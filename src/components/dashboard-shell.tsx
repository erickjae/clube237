import { useState, type ComponentType, type ReactNode } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, LogOut } from 'lucide-react';
import { Wordmark } from '@/components/club-shell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type NavigationItem = {
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  current?: boolean;
  note?: string;
  onSelect?: () => void;
};

type DashboardShellProps = {
  eyebrow: string;
  title: string;
  welcome: string;
  description: string;
  navigation: NavigationItem[];
  children?: ReactNode;
};

export function DashboardShell({ eyebrow, title, welcome, description, navigation, children }: DashboardShellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    setBusy(true);
    setError('');
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError('Não foi possível sair. Tente novamente.');
      setBusy(false);
      return;
    }
    await router.navigate({ to: '/auth', replace: true });
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <Link to="/" aria-label="Clube237, ir para a página pública"><Wordmark /></Link>
        <Button variant="outline" size="sm" onClick={signOut} disabled={busy}>
          <LogOut />{busy ? 'Saindo…' : 'Sair da conta'}
        </Button>
      </header>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar" aria-label="Navegação do painel">
          <p className="dashboard-nav-label">Navegação</p>
          <ul>
            {navigation.map((item) => {
              const Icon = item.icon;
              const content = <><Icon size={18} strokeWidth={1.5} /><span>{item.label}</span>{item.note && <small>{item.note}</small>}</>;
              return (
                <li key={item.label} className={item.current ? 'dashboard-nav-item is-current' : 'dashboard-nav-item'}>
                  {item.onSelect
                    ? <button type="button" className="dashboard-nav-entry" onClick={item.onSelect}>{content}</button>
                    : <div className="dashboard-nav-entry">{content}</div>}
                </li>
              );
            })}
          </ul>
        </aside>
        <main className="dashboard-main">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <section className="dashboard-welcome" aria-labelledby="dashboard-welcome-title">
            <p className="dashboard-section-number">237 / Área privada</p>
            <h2 id="dashboard-welcome-title">{welcome}</h2>
            <p>{description}</p>
          </section>
          {error && <p role="alert" className="form-error">{error}</p>}
          {children}
          <Link to="/" className="dashboard-public-link">Ver a página pública do clube <ArrowUpRight size={15} /></Link>
        </main>
      </div>
    </div>
  );
}
