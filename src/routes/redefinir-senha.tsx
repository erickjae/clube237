import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import { ClubShell } from '@/components/club-shell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { completePasswordRecovery } from '@/services/auth.functions';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/redefinir-senha')({
  head: () => pageHead('Nova senha', 'Defina sua nova senha do Clube237.'),
  component: ResetPassword,
});

function ResetPassword() {
  const completeRecovery = useServerFn(completePasswordRecovery);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true);
        setChecking(false);
      }
    });
    // Supabase exchanges the recovery URL for a session during client initialization.
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      const fragment = window.location.hash;
      const params = new URLSearchParams(fragment.startsWith('#') ? fragment.slice(1) : '');
      const isRecoveryLink = params.get('type') === 'recovery';
      if (data.session && isRecoveryLink) setReady(true);
      if (sessionError) setError('O link não pôde ser validado. Solicite outro e-mail.');
      setChecking(false);
    }).catch(() => { if (mounted) { setChecking(false); setError('Não foi possível validar o link.'); } });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    if (password.length < 8) { setError('Use pelo menos 8 caracteres.'); return; }
    setBusy(true);
    setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message || 'Não foi possível alterar a senha.');
      setDone(true);
      try {
        await completeRecovery({ data: {} });
      } catch {
        setError('A senha foi alterada, mas a liberação da conta precisa ser verificada.');
      }
      await supabase.auth.signOut();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível alterar a senha.');
    } finally {
      setBusy(false);
    }
  }

  return <ClubShell><div className="container-club"><section className="auth-area">
    <p className="eyebrow">Acesso dos membros</p>
    <h1>Definir nova senha.</h1>
    {done ? <><p>Senha atualizada. Você já pode entrar com seu usuário e a nova senha.</p><p><Link to="/auth">Ir para o login</Link></p></> :
      checking ? <p>Validando seu link de recuperação…</p> :
      ready ? <><p>Escolha uma senha pessoal com pelo menos 8 caracteres.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>Nova senha<input className="field" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></label>
          <label>Confirmar nova senha<input className="field" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
          {error && <p role="alert" className="form-error">{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</Button>
        </form></> :
      <><p>Este link é inválido ou expirou. Solicite um novo e-mail de recuperação.</p><p><Link to="/esqueci-senha">Solicitar outro link</Link></p></>}
    {done && error && <p role="alert" className="form-error">{error}</p>}
  </section></div></ClubShell>;
}
