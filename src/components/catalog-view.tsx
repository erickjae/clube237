import { Link } from '@tanstack/react-router';
import { Film } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { publicCatalog } from '@/services/catalog.functions';

export function EmptyClub({ title, description }: { title: string; description: string }) {
  return <div className="empty-club"><Film aria-hidden="true" /><h3>{title}</h3><p>{description}</p></div>;
}
type Catalog = Awaited<ReturnType<typeof publicCatalog>>;
export function CatalogView({ catalog }: { catalog: Catalog }) {
  const [query, setQuery] = useState('');
  const movies = catalog.reviewedMovies.filter(movie =>
    movie.title.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
  );
  return <>
    <form className="search-form" onSubmit={event => event.preventDefault()}>
      <input aria-label="Pesquisar filmes avaliados" className="field" placeholder="Buscar entre os filmes avaliados" value={query} onChange={event => setQuery(event.target.value)} maxLength={100} />
      {query && <Button variant="ghost" type="button" onClick={() => setQuery('')}>Limpar</Button>}
    </form>
    {movies.length ? <div className="film-grid">{movies.map(movie =>
      <Link to="/filmes/$movieId" params={{ movieId: movie.id }} className="film-item" key={movie.id}>
        {movie.poster_path
          ? <img className="film-poster" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`Pôster de ${movie.title}`} loading="lazy" />
          : <div className="film-poster flex items-center justify-center"><Film /></div>}
        <h3>{movie.title}</h3>
        <p>{movie.release_date.slice(0, 4)}</p>
      </Link>
    )}</div> : <EmptyClub title={query ? 'Nenhum filme avaliado encontrado' : 'O acervo está começando'} description={query ? 'Tente outro título entre os filmes já avaliados pelo clube.' : 'Os filmes aparecerão aqui quando receberem avaliações dos membros.'} />}
  </>;
}
