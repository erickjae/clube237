import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { ClubShell } from '@/components/club-shell';
import { Button } from '@/components/ui/button';
import { login, currentAccount, changePassword } from '@/services/auth.functions';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/metadata';
import { canAccessPanel, panelDestination, type PanelPath } from '@/lib/panel-access';

type AuthSearch = { redirect?: string; reason?: 'access' | 'password' };

export const Route = createFileRoute('/auth')({
  validateSearch: (search): AuthSearch => ({
    ...(typeof search['redirect'] === 'string' ? { redirect: search['redirect'] } : {}),
    ...(search['reason'] === 'access' || search['reason'] === 'password' ? { reason: search['reason'] } : {}),
  }),
  head: () => pageHead('Entrar', 'Acesso exclusivo para os membros convidados do Clube237.'),
  component: Auth,
});

function Auth() {
  const signIn = useServerFn(login);
  const account = useServerFn(currentAccount);
  const change = useServerFn(changePassword);
  const router = useRouter();
  const search = Route.useSearch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [phase, setPhase] = useState<'login' | 'change'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(() => {
    if (search.reason === 'access') return 'Esta conta está bloqueada ou não tem permissão para acessar o painel.';
    if (search.reason === 'password') return 'Defina uma senha pessoal antes de acessar o painel.';
    return '';
  });

  async function openPanel(role: string) {
    const fallback = panelDestination(role);
    if (!fallback) throw new Error('Esta conta não tem uma função válida para acessar o clube.');
    const intended = search.redirect === '/admin' || search.redirect === '/painel' ? search.redirect : null;
    const destination: PanelPath = intended && canAccessPanel(role, intended) ? intended : fallback;
    await router.navigate({ to: destination, replace: true });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (phase === 'login') {
        const tokens = await signIn({ data: { username, password } });
        const { error: sessionError } = await supabase.auth.setSession(tokens);
        if (sessionError) throw new Error('Não foi possível iniciar a sessão.');

        try {
          const me = await account({ data: {} });
          setUsername(me.username);
          if (me.mustChangePassword) {
            setPhase('change');
          } else {
            await openPanel(me.role);
          }
        } catch (accountError) {
          await supabase.auth.signOut();
          throw accountError;
        }
      } else {
        if (newPassword !== confirmation) throw new Error('As novas senhas não coincidem.');
        await change({ data: { currentPassword: password, password: newPassword } });
        const me = await account({ data: {} });
        setPassword('');
        setNewPassword('');
        setConfirmation('');
        await openPanel(me.role);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ClubShell>
      <div className="container-club">
        <section className="auth-area">
          <p className="eyebrow"><LockKeyhole size={13} />Apenas por convite</p>
          <h1>{phase === 'change' ? 'Uma nova senha.' : 'Seu lugar no clube.'}</h1>
          <p>{phase === 'change'
            ? 'Antes de continuar, substitua sua senha provisória por uma senha pessoal.'
            : 'Entre com seu usuário e senha. As boas conversas começam depois dos créditos.'}</p>
          <form className="auth-form" onSubmit={submit}>
            {phase === 'login' && (
              <label>Usuário
                <input className="field" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={32} placeholder="Seu usuário" />
              </label>
            )}
            <label>{phase === 'change' ? 'Senha provisória' : 'Senha'}
              <input className="field" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Sua senha" maxLength={128} />
            </label>
            {phase === 'change' && (
              <>
                <label>Nova senha
                  <input className="field" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                </label>
                <label>Confirmar nova senha
                  <input className="field" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
                </label>
              </>
            )}
            {error && <p role="alert" className="form-error">{error}</p>}
            <Button disabled={busy} type="submit">
              {busy ? 'Aguarde…' : phase === 'change' ? 'Definir nova senha' : 'Entrar no clube'}<ArrowRight />
            </Button>
            {phase === 'login' && <p className="text-sm text-center"><a href="/esqueci-senha">Esqueci minha senha</a></p>}
            <p className="text-xs text-muted-foreground text-center">Acesso privado. Não há cadastro público.</p>
          </form>
        </section>
      </div>
    </ClubShell>
  );
}
