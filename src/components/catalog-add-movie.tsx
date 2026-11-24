import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Film, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ReviewFormDialog } from '@/components/review-form-dialog';
import type { WatchlistEntry } from '@/components/watchlist-panel';
import { searchMovies } from '@/services/catalog.functions';
import { registerMovie } from '@/services/movie.functions';
import { addToWatchlist, myWatchlist } from '@/services/watchlist.functions';
import { myReviews } from '@/services/reviews.functions';
import { isReleased } from '@/lib/club-rules';

type Result = Awaited<ReturnType<typeof searchMovies>>[number];
type Review = Awaited<ReturnType<typeof myReviews>>[number];
export function CatalogAddMovie({ userId }: { userId: string }) {
  const client = useQueryClient();
  const search = useServerFn(searchMovies);
  const register = useServerFn(registerMovie);
  const add = useServerFn(addToWatchlist);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [target, setTarget] = useState<{ entry: WatchlistEntry; existing?: Review } | null>(null);
  const queue = useQuery({ queryKey: ['my-watchlist', userId], queryFn: () => myWatchlist(), enabled: open });
  const reviews = useQuery({ queryKey: ['my-reviews', userId], queryFn: () => myReviews(), enabled: open });
  async function find(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { setResults(await search({ data: { query } })); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível pesquisar.'); }
    finally { setBusy(false); }
  }
  async function act(movie: Result, action: 'queue' | 'review') {
    setBusy(true); setError(''); setNotice('');
    try {
      const [freshQueue, freshReviews] = await Promise.all([myWatchlist(), myReviews()]);
      const prior = freshReviews.find(r => r.movie.tmdbId === movie.tmdb_id);
      const queued = freshQueue.find(r => r.movie.tmdbId === movie.tmdb_id);
      if (action === 'queue' && (prior || queued)) { setNotice(prior ? 'Você já avaliou este filme.' : 'Este filme já está na sua fila.'); return; }
      if (action === 'review' && !isReleased(movie.release_date)) { setError('Aguarde a estreia para avaliar.'); return; }
      const stored = await register({ data: { tmdbId: movie.tmdb_id } });
      if (action === 'queue') {
        await add({ data: { movieId: stored.id } });
        await Promise.all([client.invalidateQueries({ queryKey: ['my-watchlist'] }), client.invalidateQueries({ queryKey: ['public-catalog'] }), client.invalidateQueries({ queryKey: ['my-dashboard'] })]);
        setNotice(movie.title + ' foi adicionado à sua fila.');
      } else {
        setTarget({ existing: prior, entry: queued ?? { id: 'direct-' + stored.id, addedAt: new Date().toISOString(), movie: { id: stored.id, tmdbId: movie.tmdb_id, title: stored.title, posterPath: stored.poster_path, releaseDate: stored.release_date } } });
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir a ação.'); }
    finally { setBusy(false); }
  }
  return <>
    <Button type="button" onClick={() => setOpen(true)}><Plus />Adicionar filme</Button>
    <Dialog open={open && !target} onOpenChange={value => { if (!busy && !target) setOpen(value); }}>
      <DialogContent className="catalog-add-dialog">
        <DialogHeader><DialogTitle>Adicionar filme</DialogTitle><DialogDescription>Pesquise no TMDB e escolha adicionar à fila ou avaliar.</DialogDescription></DialogHeader>
        <form className="catalog-add-search" onSubmit={find}>
          <input className="field" aria-label="Título do filme" placeholder="Digite o nome do filme" value={query} onChange={e => setQuery(e.target.value)} minLength={2} maxLength={100} required />
          <Button type="submit" disabled={busy}><Search />Buscar</Button>
        </form>
        {error && <p role="alert" className="form-error">{error}</p>}
        {notice && <p role="status" className="management-notice">{notice}</p>}
        {(queue.isError || reviews.isError) && <p role="alert">Não foi possível consultar sua fila e avaliações. <Button variant="outline" onClick={() => { void queue.refetch(); void reviews.refetch(); }}>Tentar novamente</Button></p>}
        {results && <div className="catalog-add-results">{results.length === 0 && <p>Nenhum filme encontrado.</p>}{results.map(movie => {
          const prior = reviews.data?.find(r => r.movie.tmdbId === movie.tmdb_id);
          const queued = queue.data?.some(r => r.movie.tmdbId === movie.tmdb_id);
          const released = isReleased(movie.release_date);
          const disabled = busy || !queue.isSuccess || !reviews.isSuccess;
          return <article className="catalog-add-result" key={movie.tmdb_id}>
            {movie.poster_path ? <img src={'https://image.tmdb.org/t/p/w185' + movie.poster_path} alt={'Pôster de ' + movie.title} /> : <div className="catalog-add-placeholder"><Film /></div>}
            <div><h3>{movie.title}</h3><p>{movie.release_date.slice(0,4)}{!released ? ' · Em breve' : ''}</p>
              <div className="catalog-add-actions"><Button size="sm" variant="outline" disabled={disabled || !!prior || queued} onClick={() => void act(movie, 'queue')}>{prior ? 'Já avaliado' : queued ? 'Na sua fila' : 'Adicionar à fila'}</Button>
              <Button size="sm" disabled={disabled || !released} onClick={() => void act(movie, 'review')}>{prior ? 'Reavaliar' : 'Avaliar'}</Button></div>
            </div>
          </article>;
        })}</div>}
      </DialogContent>
    </Dialog>
    {target && <ReviewFormDialog entry={target.entry} direct existingReview={target.existing} onClose={() => setTarget(null)} onSaved={title => { setTarget(null); setNotice('Avaliação de ' + title + ' salva.'); void client.invalidateQueries({ queryKey: ['films-page'] }); }} />}
  </>;
}
