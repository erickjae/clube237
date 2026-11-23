import { Film } from 'lucide-react';
import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { searchMovies, publicCatalog } from '@/services/catalog.functions';

export function EmptyClub({ title, description }: { title: string; description: string }) {
  return <div className="empty-club"><Film aria-hidden="true" /><h3>{title}</h3><p>{description}</p></div>;
}
type Catalog = Awaited<ReturnType<typeof publicCatalog>>;
export function CatalogView({ catalog }: { catalog: Catalog }) {
  const [query,setQuery] = useState('');
  const [results,setResults] = useState<Awaited<ReturnType<typeof searchMovies>> | null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const search = useServerFn(searchMovies);
  const movies = results ?? catalog.reviewedMovies;
  return <><form className="search-form" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { setResults(await search({ data: { query } })); } catch (e) { setError(e instanceof Error ? e.message : 'Pesquisa indisponível.'); } finally { setBusy(false); } }}><input aria-label="Nome do filme" className="field" placeholder="Qual filme você está procurando?" value={query} onChange={e => setQuery(e.target.value)} minLength={2} required maxLength={100} /><Button type="submit" disabled={busy}>{busy ? 'Buscando…' : 'Buscar'}</Button>{results !== null && <Button variant="ghost" type="button" onClick={() => { setResults(null); setQuery(''); }}>Limpar</Button>}</form>{error && <p className="form-error" role="alert">{error}</p>}{movies.length ? <div className="film-grid">{movies.map(movie => <article className="film-item" key={'tmdb_id' in movie ? movie.tmdb_id : movie.id}>{movie.poster_path ? <img className="film-poster" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`Pôster de ${movie.title}`} loading="lazy" /> : <div className="film-poster flex items-center justify-center"><Film /></div>}<h3>{movie.title}</h3><p>{movie.release_date.slice(0,4)}</p></article>)}</div> : <EmptyClub title={results ? 'Nenhum filme encontrado' : 'O acervo está começando'} description={results ? 'Tente buscar outro título. Apenas filmes já lançados aparecem aqui.' : 'Os filmes do clube aparecerão aqui quando receberem avaliações dos membros.'} />}</>;
}