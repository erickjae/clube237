import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Film, ListVideo, Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import { myDashboard } from '@/services/dashboard.functions';

export const myDashboardQueryOptions = queryOptions({ queryKey: ['my-dashboard'], queryFn: () => myDashboard() });

export function MemberOverview() {
  const { data } = useSuspenseQuery(myDashboardQueryOptions);
  const cards = [
    { title: 'Filmes avaliados', value: data.reviewed, icon: Film },
    { title: 'Recomendo', value: data.recommended, icon: ThumbsUp },
    { title: 'Não recomendo', value: data.notRecommended, icon: ThumbsDown },
    { title: 'Na minha fila', value: data.queue, icon: ListVideo },
  ];
  const max = Math.max(1, ...data.genreCounts.map(g => g.count));
  return <section className="member-overview">
    <div className="watchlist-heading"><div><p className="dashboard-section-number">Sua jornada pelo cinema</p><h2>Visão geral</h2></div><p>Suas avaliações, recomendações e gêneros favoritos na prática.</p></div>
    <div className="member-overview-grid">{cards.map(({title,value,icon:Icon}) => <div className="member-overview-stat" key={title}><Icon aria-hidden="true" size={20}/><strong>{value}</strong><span>{title}</span></div>)}</div>
    <div className="member-overview-grid member-overview-summary">
      <div className="member-overview-stat"><Star aria-hidden="true" size={20}/><strong>{data.averageRating === null ? '—' : data.averageRating.toFixed(1).replace('.', ',')}</strong><span>Minha nota média</span></div>
      <div className="member-overview-stat"><ThumbsUp aria-hidden="true" size={20}/><strong>{data.recommendationPercent === null ? '—' : `${Math.round(data.recommendationPercent)}%`}</strong><span>Filmes que recomendo</span></div>
    </div>
    <section className="member-overview-genres">
      <h3>Seu ritmo no clube</h3>
      <div className="member-overview-grid member-overview-summary">
        <div className="member-overview-stat"><strong>{data.thisMonth}</strong><span>Avaliações neste mês</span></div>
        <div className="member-overview-stat"><strong>{data.last30Days}</strong><span>Nos últimos 30 dias</span></div>
      </div>
      <p className="text-sm text-muted-foreground">{data.nextStep}</p>
      {data.latestReview && <p className="text-sm">Sua última avaliação: <strong>{data.latestReview.title}</strong> ({Number(data.latestReview.rating).toFixed(1).replace('.', ',')}/10).</p>}
      <p className="text-sm"><Link to="/filmes" className="underline">Descobrir filmes avaliados pelo clube</Link></p>
    </section>
    <section className="member-overview-genres"><h3>Meus gêneros mais assistidos</h3>
      {data.genreCounts.length ? <div className="member-overview-genre-list">{data.genreCounts.map(g => <div className="member-overview-genre" key={g.name}><div><span>{g.name}</span><strong>{g.count}</strong></div><div className="member-overview-track"><span style={{ width: `${g.count/max*100}%` }} /></div></div>)}</div> : <p className="text-sm text-muted-foreground">Avalie seus primeiros filmes para descobrir seus gêneros mais assistidos.</p>}
      <p className="text-xs text-muted-foreground">Um filme pode contar em mais de um gênero.</p>
    </section>
  </section>;
}
