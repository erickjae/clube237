import { createFileRoute } from '@tanstack/react-router';
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
  return <ClubShell><div className="container-club"><header className="page-heading"><p className="eyebrow">Antes de apertar o play</p><h1>Na fila do clube</h1><p>As histórias que ainda queremos conhecer.</p></header>{data.queue.length ? <div className="film-grid">{data.queue.filter((entry, index, entries) => entries.findIndex(other => other.movie_id === entry.movie_id) === index).map((queueEntry) => {
    const movie = data.movies.find((item) => item.id === queueEntry.movie_id);
    return <article className="film-item" key={queueEntry.id}>{movie?.poster_path ? <img className="film-poster" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`Pôster de ${movie.title}`} loading="lazy" /> : <div className="film-poster watchlist-poster-empty"><Film aria-hidden="true" /></div>}<h3>{movie?.title ?? 'Filme na fila'}</h3><p>{movie?.release_date.slice(0, 4) ?? 'Ano não informado'}</p><div className="queue-members">{[...new Set(data.queue.filter(entry => entry.movie_id === queueEntry.movie_id).map(entry => data.profiles.find(profile => profile.administrator_id === entry.administrator_id)?.display_name).filter(Boolean))].map(name => <span key={name}>{name}</span>)}</div></article>;
  })}</div> : <EmptyClub title="A próxima sessão está em aberto" description="Nenhum filme foi adicionado às filas dos membros ainda." />}</div></ClubShell>;
}