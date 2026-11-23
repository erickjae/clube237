import { useState } from 'react';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Ban, KeyRound, RotateCcw, UserPlus, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { createAdministrator, listAdministrators, manageAdministrator } from '@/services/auth.functions';

export const administratorsQueryOptions = queryOptions({
  queryKey: ['owner', 'administrators'],
  queryFn: () => listAdministrators(),
});

type Administrator = Awaited<ReturnType<typeof listAdministrators>>['administrators'][number];
type StatusAction = 'block' | 'reactivate';

export function AdministratorManagement() {
  const { data } = useSuspenseQuery(administratorsQueryOptions);
  const queryClient = useQueryClient();
  const createAccount = useServerFn(createAdministrator);
  const manageAccount = useServerFn(manageAdministrator);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Administrator | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ administrator: Administrator; action: StatusAction } | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function clearCredentials() {
    setUsername('');
    setEmail('');
    setTemporaryPassword('');
    setConfirmation('');
    setError('');
  }

  function openCreate() {
    clearCredentials();
    setNotice('');
    setCreateOpen(true);
  }

  function openReset(administrator: Administrator) {
    clearCredentials();
    setNotice('');
    setResetTarget(administrator);
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: administratorsQueryOptions.queryKey });
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (temporaryPassword !== confirmation) {
      setError('As senhas provisórias não coincidem.');
      return;
    }
    setBusy('create');
    try {
      const result = await createAccount({ data: { username, email, temporaryPassword } });
      setCreateOpen(false);
      clearCredentials();
      setNotice(`Conta de ${result.username} criada. A senha provisória deverá ser trocada no primeiro acesso.`);
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível criar a conta.');
    } finally {
      setBusy('');
    }
  }

  async function submitReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetTarget) return;
    setError('');
    if (temporaryPassword !== confirmation) {
      setError('As senhas provisórias não coincidem.');
      return;
    }
    setBusy('reset');
    try {
      await manageAccount({ data: { administratorId: resetTarget.id, action: 'reset', temporaryPassword } });
      const name = resetTarget.displayName;
      setResetTarget(null);
      clearCredentials();
      setNotice(`Senha provisória definida para ${name}. A troca será obrigatória no próximo acesso.`);
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível redefinir a senha.');
    } finally {
      setBusy('');
    }
  }

  async function changeStatus() {
    if (!statusTarget) return;
    setBusy('status');
    setError('');
    setNotice('');
    try {
      await manageAccount({ data: { administratorId: statusTarget.administrator.id, action: statusTarget.action } });
      const name = statusTarget.administrator.displayName;
      const action = statusTarget.action;
      setStatusTarget(null);
      setNotice(action === 'block' ? `Acesso de ${name} bloqueado.` : `Acesso de ${name} reativado.`);
      await refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Não foi possível atualizar a conta.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="administrator-section" aria-labelledby="administrator-list-title">
      <div className="administrator-section-heading">
        <div>
          <p className="dashboard-section-number">Gestão de acesso</p>
          <h2 id="administrator-list-title">Administradores <span>{data.total}</span></h2>
        </div>
        <Button onClick={openCreate}><UserPlus />Cadastrar administrador</Button>
      </div>

      {notice && <p className="management-notice" role="status">{notice}</p>}
      {error && !createOpen && !resetTarget && !statusTarget && <p className="form-error" role="alert">{error}</p>}

      {data.administrators.length === 0 ? (
        <div className="administrator-empty"><UsersRound /><p>Nenhum administrador cadastrado.</p></div>
      ) : (
        <ul className="administrator-list">
          {data.administrators.map((administrator) => (
            <li key={administrator.id} className="administrator-row">
              <div className="administrator-identity">
                <span className="administrator-initials" aria-hidden="true">{administrator.displayName.trim().slice(0, 2).toUpperCase()}</span>
                <div>
                  <h3>{administrator.displayName}</h3>
                  <p>@{administrator.username}</p>
                </div>
              </div>
              <span className={administrator.status === 'active' ? 'account-status is-active' : 'account-status is-blocked'}>
                {administrator.status === 'active' ? 'Ativo' : 'Bloqueado'}
              </span>
              <div className="administrator-actions">
                <Button variant="ghost" size="sm" onClick={() => openReset(administrator)}><KeyRound />Redefinir senha</Button>
                {administrator.status === 'active' ? (
                  <Button variant="ghost" size="sm" onClick={() => { setError(''); setNotice(''); setStatusTarget({ administrator, action: 'block' }); }}><Ban />Bloquear</Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => { setError(''); setNotice(''); setStatusTarget({ administrator, action: 'reactivate' }); }}><RotateCcw />Reativar</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => { if (!busy) { setCreateOpen(open); if (!open) clearCredentials(); } }}>
        <DialogContent className="account-dialog">
          <DialogHeader>
            <DialogTitle>Cadastrar administrador</DialogTitle>
            <DialogDescription>Crie uma conta individual. O administrador deverá substituir a senha provisória no primeiro acesso.</DialogDescription>
          </DialogHeader>
          <form className="account-form" onSubmit={submitCreate}>
            <label>Nome de usuário
              <input className="field" autoComplete="off" minLength={3} maxLength={32} pattern="[A-Za-z0-9_]+" required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Ex.: Nome237" />
            </label>
            <label>E-mail
              <input className="field" type="email" autoComplete="off" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@exemplo.com" />
            </label>
            <label>Senha provisória
              <input className="field" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} />
            </label>
            <label>Confirmar senha provisória
              <input className="field" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </label>
            <p className="account-form-note">Use ao menos 8 caracteres e prefira uma frase longa e única.</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy === 'create'} onClick={() => { setCreateOpen(false); clearCredentials(); }}>Cancelar</Button>
              <Button type="submit" disabled={busy === 'create'}>{busy === 'create' ? 'Criando…' : 'Criar conta'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetTarget !== null} onOpenChange={(open) => { if (!open && !busy) { setResetTarget(null); clearCredentials(); } }}>
        <DialogContent className="account-dialog">
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>Defina uma nova senha provisória para {resetTarget?.displayName}. A senha atual não será consultada nem exibida.</DialogDescription>
          </DialogHeader>
          <form className="account-form" onSubmit={submitReset}>
            <label>Nova senha provisória
              <input className="field" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} />
            </label>
            <label>Confirmar nova senha provisória
              <input className="field" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </label>
            <p className="account-form-note">A troca por uma senha pessoal será obrigatória no próximo acesso.</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy === 'reset'} onClick={() => { setResetTarget(null); clearCredentials(); }}>Cancelar</Button>
              <Button type="submit" disabled={busy === 'reset'}>{busy === 'reset' ? 'Redefinindo…' : 'Definir senha provisória'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={statusTarget !== null} onOpenChange={(open) => { if (!open && !busy) setStatusTarget(null); }}>
        <AlertDialogContent className="account-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{statusTarget?.action === 'block' ? 'Bloquear administrador?' : 'Reativar administrador?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.action === 'block'
                ? `${statusTarget.administrator.displayName} não poderá entrar no clube enquanto a conta estiver bloqueada.`
                : `${statusTarget?.administrator.displayName ?? ''} voltará a ter acesso ao próprio painel.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="form-error" role="alert">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === 'status'}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={busy === 'status'} onClick={(event) => { event.preventDefault(); void changeStatus(); }}>
              {busy === 'status' ? 'Atualizando…' : statusTarget?.action === 'block' ? 'Bloquear acesso' : 'Reativar acesso'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
