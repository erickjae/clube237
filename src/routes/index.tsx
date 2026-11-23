import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { ClubShell } from '@/components/club-shell';
import { EmptyClub } from '@/components/catalog-view';
import { Button } from '@/components/ui/button';
import { publicCatalog } from '@/services/catalog.functions';
import { pageHead } from '@/lib/metadata';

export const catalogOptions = queryOptions({ queryKey: ['public-catalog'], queryFn: () => publicCatalog() });
export const Route = createFileRoute('/')({ head: () => pageHead('O clube', 'Um clube privado de pessoas que compartilham suas experiências e percepções sobre filmes.'), loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions), component: Index });
function Index() {
  const { data } = useSuspenseQuery(catalogOptions);
  return <ClubShell><section className="cinema-hero"><div className="cinema-backdrop" aria-hidden="true" /><div className="cinema-content container-club"><p className="eyebrow">Um clube para quem sente o cinema</p><h1 className="cinema-title">CLUBE<span>237</span></h1><p className="cinema-quote">“A primeira regra do Clube237 é não falar sobre o Clube237.”</p><p className="cinema-description">Não somos críticos. Somos pessoas com histórias, opiniões<br className="hidden sm:block" /> e um filme que não sai da cabeça.</p></div><div className="hero-footnote"><span>Um filme. Diferentes olhares.</span><ArrowDown size={15} /><span>Est. 2026 · Apenas por convite</span></div></section><div className="container-club"><section className="editorial-section"><div className="section-heading"><div><p className="eyebrow">Depois dos créditos</p><h2>Últimas percepções</h2></div><Button variant="ghost" asChild><Link to="/filmes">Explorar filmes <ArrowRight /></Link></Button></div>{data.reviews.length ? data.reviews.map(review => <article className="review-row" key={review.id}><h3>{data.movies.find(m => m.id === review.movie_id)?.title ?? 'Filme do acervo'} <span className="text-primary">{Number(review.rating).toFixed(1)}</span></h3><p>{review.comment}</p></article>) : <EmptyClub title="A conversa ainda vai começar" description="As primeiras percepções dos membros aparecerão aqui. Cada filme, um novo ponto de vista." />}</section><section className="editorial-section"><div className="section-heading"><div><p className="eyebrow">O próximo encontro</p><h2>Na fila do clube</h2></div><Button variant="ghost" asChild><Link to="/fila">Ver a fila <ArrowRight /></Link></Button></div>{data.queue.length ? <p className="text-sm text-muted-foreground">{data.queue.length} filmes nas filas dos membros.</p> : <EmptyClub title="A próxima sessão está em aberto" description="Os filmes que os membros querem assistir terão seu lugar aqui." />}</section></div></ClubShell>;
}
