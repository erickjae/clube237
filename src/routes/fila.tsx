import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ClubShell } from '@/components/club-shell';
import { EmptyClub } from '@/components/catalog-view';
import { catalogOptions } from './index';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute('/fila')({ head: () => pageHead('Na fila', 'Os próximos filmes nas filas dos membros do Clube237.'), loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions), component: Queue });
function Queue() { const { data } = useSuspenseQuery(catalogOptions); return <ClubShell><div className="container-club"><header className="page-heading"><p className="eyebrow">Antes de apertar o play</p><h1>Na fila do clube</h1><p>As histórias que ainda queremos conhecer.</p></header>{data.queue.length ? <div className="member-list">{data.queue.map(q => <article className="review-row" key={q.id}>{data.movies.find(m => m.id === q.movie_id)?.title ?? 'Filme na fila'}</article>)}</div> : <EmptyClub title="A próxima sessão está em aberto" description="Nenhum filme foi adicionado às filas dos membros ainda." />}</div></ClubShell>; }