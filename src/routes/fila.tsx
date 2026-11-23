import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Film } from 'lucide-react';
import { ClubShell } from '@/components/club-shell';
import { EmptyClub } from '@/components/catalog-view';
import { catalogOptions } from './index';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/fila')({
  head: () => pageHead('Na fila', 'Os próximos filmes nas filas dos membros do Clube237.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  component: Queue,
});

function Queue() {
  const { data } = useSuspenseQuery(catalogOptions);
  const queuedMovies = data.queue.filter((entry, index, entries) =>
    entries.findIndex(other => other.movie_id === entry.movie_id) === index
  );
  return <ClubShell><div className="container-club">
    <header className="page-heading"><p className="eyebrow">Antes de apertar o play</p><h1>Na fila do clube</h1><p>As histórias que ainda queremos conhecer.</p></header>
    {queuedMovies.length ? <div className="film-grid">{queuedMovies.map(entry => {
      const movie = data.movies.find(item => item.id === entry.movie_id);
      const interested = data.queue.filter(item => item.movie_id === entry.movie_id);
      return <article className="film-item queue-film" key={entry.movie_id}>
        <Link to="/filmes/$movieId" params={{ movieId: entry.movie_id }} className="queue-film-link">
          {movie?.poster_path ? <img className="film-poster" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`Pôster de ${movie.title}`} loading="lazy" /> : <div className="film-poster watchlist-poster-empty"><Film aria-hidden="true" /></div>}
          <h3>{movie?.title ?? 'Filme na fila'}</h3>
          <p>{movie?.release_date.slice(0, 4) ?? 'Ano não informado'}</p>
          <span className="queue-film-detail">Ver sinopse e avaliações</span>
        </Link>
        <div className="queue-interested"><strong>Quem quer assistir</strong>
          <div className="queue-member-list">{interested.map(item => {
            const profile = data.profiles.find(p => p.administrator_id === item.administrator_id);
            const name = profile?.display_name || 'Membro do clube';
            return <div className="queue-member" key={item.id}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span className="queue-member-initial" aria-hidden="true">{name.slice(0,1).toUpperCase()}</span>}
              <span>{name}</span>
            </div>;
          })}</div>
        </div>
      </article>;
    })}</div> : <EmptyClub title="A próxima sessão está em aberto" description="Nenhum filme foi adicionado às filas dos membros ainda." />}
  </div></ClubShell>;
}
