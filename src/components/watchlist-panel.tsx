import { useState } from 'react';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Film, ListPlus, Search, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyClub } from '@/components/catalog-view';
import { myReviewsQueryOptions } from '@/components/reviews-panel';
import { ReviewFormDialog } from '@/components/review-form-dialog';
import { searchMovies } from '@/services/catalog.functions';
import { registerMovie } from '@/services/movie.functions';
import { addToWatchlist, myWatchlist, removeFromWatchlist } from '@/services/watchlist.functions';

export const myWatchlistQueryOptions = queryOptions({
  queryKey: ['my-watchlist'],
  queryFn: () => myWatchlist(),
});

type SearchResult = Awaited<ReturnType<typeof searchMovies>>[number];
export type WatchlistEntry = Awaited<ReturnType<typeof myWatchlist>>[number];

export function WatchlistPanel() {
  const { data: entries } = useSuspenseQuery(myWatchlistQueryOptions);
  const { data: reviews } = useSuspenseQuery(myReviewsQueryOptions);
  const queryClient = useQueryClient();
  const search = useServerFn(searchMovies);
  const register = useServerFn(registerMovie);
  const add = useServerFn(addToWatchlist);
  const remove = useServerFn(removeFromWatchlist);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reviewTarget, setReviewTarget] = useState<{ entry: WatchlistEntry; direct: boolean } | null>(null);

  const queuedTmdbIds = new Set(entries.map((entry) => entry.movie.tmdbId));
  const reviewedMovieIds = new Set(reviews.map(review => review.movie.id));
  const reviewedTitles = new Set(reviews.map(review => `${review.movie.title.toLocaleLowerCase('pt-BR')}|${review.movie.releaseDate}`));

  async function evaluateNow(movie: SearchResult) {
    setBusy(`review-${movie.tmdb_id}`); setError(''); setNotice('');
    try {
      const stored = await register({ data: { tmdbId: movie.tmdb_id } });
      if (reviewedMovieIds.has(stored.id)) { setNotice(`${movie.title} já foi avaliado por você.`); return; }
      const queued = entries.find(entry => entry.movie.id === stored.id);
      setReviewTarget({ direct: true, entry: queued ?? {
        id: `direct-${stored.id}`, addedAt: new Date().toISOString(),
        movie: { id: stored.id, tmdbId: movie.tmdb_id, title: stored.title, posterPath: stored.poster_path, releaseDate: stored.release_date },
      } });
    } catch (reviewError) { setError(reviewError instanceof Error ? reviewError.message : 'Não foi possível preparar a avaliação.'); }
    finally { setBusy(''); }
  }

  async function refreshWatchlist() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: myWatchlistQueryOptions.queryKey }),
      queryClient.invalidateQueries({ queryKey: ['public-catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['my-dashboard'] }),
    ]);
  }

  async function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy('search');
    setError('');
    setNotice('');
    try {
      setResults(await search({ data: { query } }));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'A pesquisa está indisponível agora.');
    } finally {
      setBusy('');
    }
  }

  async function addMovie(movie: SearchResult) {
    setBusy(`add-${movie.tmdb_id}`);
    setError('');
    setNotice('');
    try {
      const stored = await register({ data: { tmdbId: movie.tmdb_id } });
      await add({ data: { movieId: stored.id } });
      await refreshWatchlist();
      setNotice(`${movie.title} foi adicionado à sua fila.`);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Não foi possível adicionar o filme.');
    } finally {
      setBusy('');
    }
  }

  async function removeMovie(entryId: string, title: string) {
    setBusy(`remove-${entryId}`);
    setError('');
    setNotice('');
    try {
      await remove({ data: { entryId } });
      await refreshWatchlist();
      setNotice(`${title} foi removido da sua fila.`);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Não foi possível remover o filme.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="watchlist-section" aria-labelledby="watchlist-title">
      <div className="watchlist-heading">
        <div>
          <p className="dashboard-section-number">Sua próxima sessão</p>
          <h2 id="watchlist-title">Minha fila <span>{entries.length}</span></h2>
        </div>
        <p>Busque um filme já lançado e guarde aqui o que você quer assistir.</p>
      </div>

      <form className="search-form watchlist-search" onSubmit={submitSearch}>
        <input
          aria-label="Pesquisar filme para adicionar à fila"
          className="field"
          placeholder="Digite o nome de um filme"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          minLength={2}
          maxLength={100}
          required
        />
        <Button type="submit" disabled={busy !== ''}><Search />{busy === 'search' ? 'Buscando…' : 'Buscar filme'}</Button>
        {results !== null && <Button variant="ghost" type="button" disabled={busy !== ''} onClick={() => { setResults(null); setQuery(''); setError(''); }}>Limpar</Button>}
      </form>

      {notice && <p className="management-notice" role="status">{notice}</p>}
      {error && <p className="form-error watchlist-error" role="alert">{error}</p>}

      {results !== null && (
        <div className="watchlist-results" aria-labelledby="watchlist-results-title">
          <div className="watchlist-subheading">
            <h3 id="watchlist-results-title">Resultados da pesquisa</h3>
            <span>{results.length} {results.length === 1 ? 'filme' : 'filmes'}</span>
          </div>
          {results.length > 0 ? (
            <div className="watchlist-result-grid">
              {results.map((movie) => {
                const queued = queuedTmdbIds.has(movie.tmdb_id);
                const adding = busy === `add-${movie.tmdb_id}`;
                const alreadyReviewed = reviewedTitles.has(`${movie.title.toLocaleLowerCase('pt-BR')}|${movie.release_date}`);
                return (
                  <article className="watchlist-result" key={movie.tmdb_id}>
                    {movie.poster_path
                      ? <img className="film-poster" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`Pôster de ${movie.title}`} loading="lazy" />
                      : <div className="film-poster watchlist-poster-empty"><Film aria-hidden="true" /></div>}
                    <div className="watchlist-result-info">
                      <h4>{movie.title}</h4>
                      <p>{movie.release_date.slice(0, 4)}</p>
                      <Button variant="default" size="sm" disabled={busy !== '' || alreadyReviewed} onClick={() => evaluateNow(movie)}><Star />{busy === `review-${movie.tmdb_id}` ? 'Abrindo…' : alreadyReviewed ? 'Já avaliado' : 'Avaliar agora'}</Button>
                      <Button variant={queued ? 'ghost' : 'outline'} size="sm" disabled={busy !== '' || queued || alreadyReviewed} onClick={() => addMovie(movie)}>
                        <ListPlus />{adding ? 'Adicionando…' : queued ? 'Já está na fila' : 'Adicionar à fila'}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <EmptyClub title="Nenhum filme encontrado" description="Tente outro título. Somente filmes já lançados aparecem nos resultados." />}
        </div>
      )}

      <div className="watchlist-personal">
        <div className="watchlist-subheading">
          <h3>Filmes que você quer assistir</h3>
          <span>Visível publicamente na fila do clube</span>
        </div>
        {entries.length > 0 ? (
          <ul className="watchlist-list">
            {entries.map((entry) => (
              <li className="watchlist-row" key={entry.id}>
                {entry.movie.posterPath
                  ? <img className="watchlist-row-poster" src={`https://image.tmdb.org/t/p/w185${entry.movie.posterPath}`} alt={`Pôster de ${entry.movie.title}`} loading="lazy" />
                  : <div className="watchlist-row-poster watchlist-poster-empty"><Film aria-hidden="true" /></div>}
                <div className="watchlist-row-title">
                  <h4>{entry.movie.title}</h4>
                  <p>{entry.movie.releaseDate.slice(0, 4)}</p>
                </div>
                <div className="watchlist-row-actions">
                  <Button variant="outline" size="sm" disabled={busy !== ''} onClick={() => { setError(''); setNotice(''); setReviewTarget({ entry, direct: false }); }}>
                    <Star />Avaliar filme
                  </Button>
                  <Button variant="ghost" size="sm" disabled={busy !== ''} onClick={() => removeMovie(entry.id, entry.movie.title)}>
                    <Trash2 />{busy === `remove-${entry.id}` ? 'Removendo…' : 'Remover'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyClub title="Sua fila está vazia" description="Pesquise um filme acima e adicione o primeiro título à sua lista." />}
      </div>
      {reviewTarget && <ReviewFormDialog
        key={reviewTarget.entry.id}
        entry={reviewTarget.entry}
        direct={reviewTarget.direct}
        onClose={() => setReviewTarget(null)}
        onSaved={(title) => {
          setReviewTarget(null);
          setNotice(`Avaliação de ${title} publicada com sucesso.`);
        }}
      />}
    </section>
  );
}
