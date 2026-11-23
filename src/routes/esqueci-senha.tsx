import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { ClubShell } from '@/components/club-shell';
import { Button } from '@/components/ui/button';
import { requestPasswordRecovery } from '@/services/auth.functions';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/esqueci-senha')({
  head: () => pageHead('Recuperar senha', 'Recupere o acesso à sua conta do Clube237.'),
  component: ForgotPassword,
});

function ForgotPassword() {
  const requestRecovery = useServerFn(requestPasswordRecovery);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await requestRecovery({ data: { email } });
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar o e-mail.');
    } finally {
      setBusy(false);
    }
  }

  return <ClubShell><div className="container-club"><section className="auth-area">
    <p className="eyebrow">Acesso dos membros</p>
    <h1>Recuperar senha.</h1>
    {sent ? <p>Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha. Verifique também o spam.</p> :
      <><p>Informe o e-mail associado à sua conta. Enviaremos um link para definir uma nova senha.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>E-mail<input className="field" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" /></label>
        {error && <p role="alert" className="form-error">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar link de recuperação'}</Button>
      </form></>}
    <p className="text-sm"><Link to="/auth">Voltar ao login</Link></p>
  </section></div></ClubShell>;
}
