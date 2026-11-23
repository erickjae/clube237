import { Link } from '@tanstack/react-router';
import { Film, Star } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { publicCatalog } from '@/services/catalog.functions';

export function EmptyClub({ title, description }: { title: string; description: string }) {
  return <div className="empty-club"><Film aria-hidden="true" /><h3>{title}</h3><p>{description}</p></div>;
}
type Catalog = Awaited<ReturnType<typeof publicCatalog>>;
type Sort = 'best' | 'worst' | 'most' | 'title';

export function CatalogView({ catalog }: { catalog: Catalog }) {
  const [query, setQuery] = useState('');
  const [genreId, setGenreId] = useState('');
  const [sort, setSort] = useState<Sort>('best');
  const stats = new Map<string, { total: number; count: number }>();
  for (const review of catalog.reviews) {
    const current = stats.get(review.movie_id) ?? { total: 0, count: 0 };
    current.total += Number(review.rating);
    current.count++;
    stats.set(review.movie_id, current);
  }
  const movieGenreIds = new Map<string, string[]>();
  for (const relation of catalog.movieGenres ?? []) {
    movieGenreIds.set(relation.movie_id, [...(movieGenreIds.get(relation.movie_id) ?? []), relation.genre_id]);
  }
  const genreNames = new Map((catalog.genres ?? []).map(g => [g.id, g.name]));
  const genreOptions = (catalog.genres ?? []).filter(g => catalog.reviewedMovies.some(m => movieGenreIds.get(m.id)?.includes(g.id)));
  const score = (id: string) => {
    const stat = stats.get(id);
    return stat && stat.count ? stat.total / stat.count : 0;
  };
  const movies = catalog.reviewedMovies
    .filter(movie => movie.title.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')))
    .filter(movie => !genreId || movieGenreIds.get(movie.id)?.includes(genreId))
    .sort((a,b) => {
      const countA = stats.get(a.id)?.count ?? 0;
      const countB = stats.get(b.id)?.count ?? 0;
      if (sort === 'most') return countB-countA || score(b.id)-score(a.id) || a.title.localeCompare(b.title,'pt-BR');
      if (sort === 'title') return a.title.localeCompare(b.title,'pt-BR');
      if (sort === 'worst') return score(a.id)-score(b.id) || countB-countA || a.title.localeCompare(b.title,'pt-BR');
      return score(b.id)-score(a.id) || countB-countA || a.title.localeCompare(b.title,'pt-BR');
    });
  return <>
    <form className="search-form film-filters" onSubmit={event => event.preventDefault()}>
      <input aria-label="Pesquisar filmes avaliados" className="field" placeholder="Buscar entre os filmes avaliados" value={query} onChange={event => setQuery(event.target.value)} maxLength={100} />
      <select aria-label="Filtrar por gênero" className="field" value={genreId} onChange={event => setGenreId(event.target.value)}>
        <option value="">Todos os gêneros</option>
        {genreOptions.map(g => <option value={g.id} key={g.id}>{g.name}</option>)}
      </select>
      <select aria-label="Ordenar filmes" className="field" value={sort} onChange={event => setSort(event.target.value as Sort)}>
        <option value="best">Melhores avaliados</option>
        <option value="worst">Menores notas</option>
        <option value="most">Mais avaliações</option>
        <option value="title">Título (A–Z)</option>
      </select>
      {(query || genreId || sort !== 'best') && <Button variant="ghost" type="button" onClick={() => { setQuery(''); setGenreId(''); setSort('best'); }}>Limpar</Button>}
    </form>
    {movies.length ? <div className="film-grid">{movies.map(movie => {
      const genres = (movieGenreIds.get(movie.id) ?? []).map(id => genreNames.get(id)).filter(Boolean);
      const stat = stats.get(movie.id);
      return <Link to="/filmes/$movieId" params={{ movieId: movie.id }} className="film-item" key={movie.id}>
        <div className="film-poster-frame">
          {movie.poster_path
            ? <img className="film-poster" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`Pôster de ${movie.title}`} loading="lazy" />
            : <div className="film-poster flex items-center justify-center"><Film /></div>}
          {stat && <span className="film-rating-badge" aria-label={`Média ${score(movie.id).toFixed(1)} de 10, com ${stat.count} avaliações`}><Star size={15} fill="currentColor" />{score(movie.id).toFixed(1).replace('.', ',')}</span>}
        </div>
        <h3>{movie.title}</h3>
        <p>{movie.release_date.slice(0, 4)}</p>
        {genres.length > 0 && <p className="film-genres">{genres.join(' · ')}</p>}
        <p className="film-review-count">{stat?.count ?? 0} {(stat?.count ?? 0) === 1 ? 'avaliação' : 'avaliações'}</p>
      </Link>;
    })}</div> : <EmptyClub title={query || genreId ? 'Nenhum filme encontrado' : 'O acervo está começando'} description={query || genreId ? 'Experimente outro título ou gênero.' : 'Os filmes aparecerão aqui quando receberem avaliações dos membros.'} />}
  </>;
}
