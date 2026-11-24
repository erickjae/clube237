import { useQuery } from '@tanstack/react-query';
import { Film, Clock, Star, ThumbsUp } from 'lucide-react';
import { myCinemaUniverse } from '@/services/cinema-universe.functions';

const fmt = (n: number | null) => n === null ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export function CinemaUniverse({ memberKey }: { memberKey: string }) {
 const { data, isPending, isError, refetch } = useQuery({
   queryKey: ['my-cinema-universe', memberKey],
   queryFn: () => myCinemaUniverse(),
   staleTime: 0,
   refetchOnMount: 'always',
 });
 if (isPending) return <p role="status">Carregando seu universo cinematográfico…</p>;
 if (isError || !data) return <section><p role="alert">Não foi possível carregar seu universo.</p><button type="button" onClick={() => void refetch()}>Tentar novamente</button></section>;
 const t = data.totals;
 const watchedGenres = data.genres.filter(g => g.total > 0);
 const favorite = watchedGenres[0];
 const loved = [...watchedGenres].filter(g => g.total >= 5).sort((a,b) => Number(b.average_rating)-Number(a.average_rating) || a.name.localeCompare(b.name))[0];
 const identity = t.reviewed < 5 ? 'Sua história está começando' : watchedGenres.length >= 10 ? 'Explorador de universos' : favorite ? 'Explorador de ' + favorite.name : 'Explorador do cinema';
 const bars = (items: { label: string; total: number }[]) => {
   const max = Math.max(1,...items.map(i => i.total));
   return <div className="member-overview-genre-list">{items.map(i => <div className="member-overview-genre" key={i.label}><div><span>{i.label}</span><strong>{i.total}</strong></div><div className="member-overview-track" aria-hidden="true"><span style={{width: (i.total/max*100)+'%'}} /></div></div>)}</div>;
 };
 return <section className="member-overview">
  <div className="watchlist-heading"><div><p className="dashboard-section-number">Toda avaliação conta uma história.</p><h2>Meu universo cinematográfico</h2></div><p>Descubra seu gosto, reviva suas experiências e explore o cinema através dos seus próprios olhos.</p></div>
  <section className="member-overview-genres"><h3>{identity}</h3><p className="text-sm text-muted-foreground">{t.reviewed < 5 ? 'Avalie pelo menos cinco filmes para descobrir sua identidade.' : 'Identidade baseada na variedade e frequência dos gêneros avaliados.'}</p></section>
  <div className="member-overview-grid">
   <div className="member-overview-stat"><Film aria-hidden="true"/><strong>{t.reviewed}</strong><span>Filmes avaliados</span></div>
   <div className="member-overview-stat"><Clock aria-hidden="true"/><strong>{t.runtime_coverage ? Math.floor(t.minutes/60)+'h '+t.minutes%60+'min' : '—'}</strong><span>Tempo de cinema</span></div>
   <div className="member-overview-stat"><Star aria-hidden="true"/><strong>{fmt(t.average_rating)}</strong><span>Nota média</span></div>
   <div className="member-overview-stat"><ThumbsUp aria-hidden="true"/><strong>{t.reviewed ? fmt(t.recommended/t.reviewed*100)+'%' : '—'}</strong><span>Recomendo</span></div>
  </div>
  <p className="text-sm text-muted-foreground">Duração conhecida de {t.runtime_coverage} de {t.reviewed} filmes. {t.runtime_coverage > 0 && 'Equivalente a '+fmt(t.minutes/1440)+' dias de cinema.'} Não representa sessões repetidas.</p>
  {t.reviewed === 0 ? <p>Registre sua primeira avaliação para começar.</p> : <>
   <section className="member-overview-genres"><h3>Seu olhar crítico</h3><p>Menor nota: {fmt(t.min_rating)} · Maior nota: {fmt(t.max_rating)} · Notas 10: {t.perfect}</p><p>{t.recommended} recomendações · {t.reviewed-t.recommended} não recomendações</p></section>
   <section className="member-overview-genres"><h3>Seus gêneros</h3>{bars(data.genres.map(g=>({label:g.name,total:g.total})))}<p className="text-sm">Diversidade: {watchedGenres.length} de 19 gêneros TMDB.</p><p className="text-sm">Mais assistido: {favorite?.name ?? '—'} · Mais bem avaliado (mínimo 5 filmes): {loved?.name ?? 'Amostra insuficiente'}</p><p className="text-xs text-muted-foreground">Um filme pode contar em mais de um gênero.</p></section>
   <section className="member-overview-genres"><h3>Sua evolução</h3><p>{t.last30} avaliações nos últimos 30 dias.</p>{bars(data.months.slice(-12).map(m=>({label:m.month,total:m.total})))}</section>
   <section className="member-overview-genres"><h3>Décadas</h3>{bars(data.decades.map(d=>({label:String(d.decade),total:d.total})))}</section>
   <section className="member-overview-genres"><h3>Memórias: seus cinco favoritos</h3>{data.favorites.map(f=><p key={f.movie_id}>{f.title} — {fmt(f.rating)}/10</p>)}</section>
  </>}
 </section>;
}
