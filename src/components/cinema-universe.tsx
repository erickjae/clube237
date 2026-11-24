import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Film, Clock, Star, ThumbsUp } from 'lucide-react';
import { myCinemaUniverse, myCinemaPeople, myCinemaAffinity, myCinemaSuggestions, myCinemaFilms, type CinemaPeople } from '@/services/cinema-universe.functions';

import { addToWatchlist } from '@/services/watchlist.functions';

import { AchievementCollection } from '@/components/member-achievements';

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
 return <section className="member-overview cinema-universe">
  <div className="watchlist-heading"><div><p className="dashboard-section-number">Toda avaliação conta uma história.</p><h2>Meu universo cinematográfico</h2></div><p>Descubra seu gosto, reviva suas experiências e explore o cinema através dos seus próprios olhos.</p></div>
  <section className="member-overview-genres cinema-identity"><span className="cinema-eyebrow">SEU PERFIL CINEMATOGRÁFICO</span><h3>{identity}</h3><p className="text-sm text-muted-foreground">{t.reviewed < 5 ? 'Avalie pelo menos cinco filmes para descobrir sua identidade.' : 'Identidade baseada na variedade e frequência dos gêneros avaliados.'}</p></section>
  <div className="member-overview-grid cinema-stats">
   <div className="member-overview-stat"><Film aria-hidden="true"/><strong>{t.reviewed}</strong><span>Filmes avaliados</span></div>
   <div className="member-overview-stat"><Clock aria-hidden="true"/><strong>{t.runtime_coverage ? Math.floor(t.minutes/60)+'h '+t.minutes%60+'min' : '—'}</strong><span>Tempo de cinema</span></div>
   <div className="member-overview-stat"><Star aria-hidden="true"/><strong>{fmt(t.average_rating)}</strong><span>Nota média</span></div>
   <div className="member-overview-stat"><ThumbsUp aria-hidden="true"/><strong>{t.reviewed ? fmt(t.recommended/t.reviewed*100)+'%' : '—'}</strong><span>Recomendo</span></div>
  </div>
  <p className="text-sm text-muted-foreground">Duração conhecida de {t.runtime_coverage} de {t.reviewed} filmes. {t.runtime_coverage > 0 && 'Equivalente a '+fmt(t.minutes/1440)+' dias de cinema.'} Não representa sessões repetidas.</p>
  <AchievementCollection member={{id:memberKey,display_name:memberKey,avatar_url:null,about:null,total:t.reviewed,recommended:t.recommended,genres:Object.fromEntries(data.genres.map(g=>[g.name,g.total]))}} />
  {t.reviewed === 0 ? <p>Registre sua primeira avaliação para começar.</p> : <>
   <section className="member-overview-genres"><h3>Seu olhar crítico</h3><p>Menor nota: {fmt(t.min_rating)} · Maior nota: {fmt(t.max_rating)} · Notas 10: {t.perfect}</p><div className="cinema-recommendation"><div role="img" aria-label={`${fmt(t.recommended/t.reviewed*100)}% de recomendações`} className="cinema-donut" style={{background:`conic-gradient(var(--primary) ${t.recommended/t.reviewed*100}%, var(--muted) 0)`}}><span>{fmt(t.recommended/t.reviewed*100)}%</span></div><div><p>{t.recommended} recomendações</p><p>{t.reviewed-t.recommended} não recomendações</p></div></div></section>
   <section className="member-overview-genres"><h3>Seus gêneros</h3>{bars(data.genres.map(g=>({label:g.name,total:g.total})))}<p className="text-sm">Diversidade: {watchedGenres.length} de 19 gêneros TMDB.</p><p className="text-sm">Mais assistido: {favorite?.name ?? '—'} · Mais bem avaliado (mínimo 5 filmes): {loved?.name ?? 'Amostra insuficiente'}</p><p className="text-xs text-muted-foreground">Um filme pode contar em mais de um gênero.</p></section>
   <section className="member-overview-genres"><h3>Sua evolução</h3><p>{t.last30} avaliações nos últimos 30 dias.</p>{bars(data.months.slice(-12).map(m=>({label:m.month,total:m.total})))}</section>
   <section className="member-overview-genres"><h3>Décadas</h3>{bars(data.decades.map(d=>({label:String(d.decade),total:d.total})))}</section>
   <section className="member-overview-genres"><h3>Memórias: seus cinco favoritos</h3>{data.favorites.map(f=><p key={f.movie_id}>{f.title} — {fmt(f.rating)}/10</p>)}</section>
   <CinemaFilmDetails memberKey={memberKey} genres={data.genres.map(g=>g.name)} months={data.months.map(m=>m.month)} decades={data.decades.map(d=>String(d.decade))} />
   <CinemaCredits memberKey={memberKey} reviewed={t.reviewed} />
   <CinemaAffinityPanel memberKey={memberKey} />
   <CinemaSuggestionsPanel memberKey={memberKey} />
  </>}
 </section>;
}

function CinemaCredits({ memberKey, reviewed }: { memberKey: string; reviewed: number }) {
 const { data, isPending, isError, refetch } = useQuery({
  queryKey: ['my-cinema-people', memberKey],
  queryFn: () => myCinemaPeople(),
  staleTime: 0,
  refetchOnMount: 'always',
 });
 if (isPending) return <p role="status">Carregando os créditos do seu universo…</p>;
 if (isError || !data) return <section className="member-overview-genres"><p role="alert">Créditos temporariamente indisponíveis.</p><button type="button" onClick={() => void refetch()}>Tentar novamente</button></section>;
 const ranking = (title: string, people: CinemaPeople['actors'], role: 'cast'|'director') => <section className="member-overview-genres">
  <h3>{title}</h3>
  {people.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há créditos disponíveis.</p> : <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
   {people.map((p,i) => <li key={p.tmdb_id} className="min-w-0 rounded-lg border border-border p-3">
    {p.profile_path && /^\/[a-zA-Z0-9_.-]+$/.test(p.profile_path) ? <img src={'https://image.tmdb.org/t/p/w185'+p.profile_path} alt="" loading="lazy" className="aspect-[2/3] w-full rounded object-cover"/> : <div aria-hidden="true" className="flex aspect-[2/3] items-center justify-center rounded bg-muted text-2xl">{i+1}</div>}
    <p className="mt-2 break-words font-semibold">{i+1}. {p.name}</p>
    <p className="text-sm">{p.total} {p.total === 1 ? 'filme' : 'filmes'}</p>
    <p className="text-xs text-muted-foreground">Nota {fmt(p.average_rating)} · {fmt(p.recommendation_percent)}% recomendo</p>
    <PersonFilms memberKey={memberKey} personId={p.tmdb_id} role={role} name={p.name}/>
   </li>)}
  </ol>}
 </section>;
 const names = (items: CinemaPeople['countries'], type: 'region' | 'language') => {
  const display = new Intl.DisplayNames(['pt-BR'], {type});
  return items.map(item => { let name = item.name; try { name = display.of(item.name) || name; } catch { /* preserve source code */ } return <li key={item.name} className="flex justify-between gap-3"><span>{name}</span><strong>{item.total}</strong></li>; });
 };
 return <>
  <section className="member-overview-genres"><h3>Além das telas</h3><p className="text-sm text-muted-foreground">Metadados disponíveis para {data.coverage} de {reviewed} filmes avaliados. Os rankings podem mudar conforme o catálogo for enriquecido.</p></section>
  {ranking('Atores e atrizes mais presentes',data.actors,'cast')}
  {ranking('Diretores mais presentes',data.directors,'director')}
  <section className="member-overview-genres"><h3>O cinema pelo mundo</h3><h4>Países de produção</h4>{data.countries.length ? <ul>{names(data.countries,'region')}</ul> : <p>Dados ainda indisponíveis.</p>}<h4>Idiomas originais</h4>{data.languages.length ? <ul>{names(data.languages,'language')}</ul> : <p>Dados ainda indisponíveis.</p>}<p className="text-xs text-muted-foreground">Coproduções podem contar em mais de um país.</p></section>
 </>;
}

function CinemaAffinityPanel({memberKey}: {memberKey:string}) {
 const {data,isPending,isError,refetch}=useQuery({queryKey:['my-cinema-affinity',memberKey],queryFn:()=>myCinemaAffinity(),staleTime:0,refetchOnMount:'always'});
 return <section className="member-overview-genres">
  <h3>Quem compartilha seu olhar?</h3>
  <p className="text-sm text-muted-foreground">Afinidade: 70% proximidade das notas e 30% concordância nas recomendações. Até três membros com maior afinidade. Mínimo de cinco filmes em comum.</p>
  {isPending ? <p role="status">Calculando afinidades…</p> : isError ? <div><p role="alert">Afinidades indisponíveis.</p><button type="button" onClick={()=>void refetch()}>Tentar novamente</button></div> : !data?.length ? <p>Ainda não há membros com avaliações suficientes em comum.</p> : <div className="member-overview-genre-list">{data.slice(0,3).map(p=><div className="member-overview-genre" key={p.id}><div><span>{p.display_name} · {p.common} filmes em comum</span><strong>{fmt(p.affinity)}%</strong></div><div className="member-overview-track" aria-hidden="true"><span style={{width:Math.max(0,Math.min(100,p.affinity))+'%'}}/></div></div>)}</div>}
 </section>;
}

function CinemaSuggestionsPanel({memberKey}: {memberKey:string}) {
 const client=useQueryClient();
 const key=['my-cinema-suggestions',memberKey];
 const {data,isPending,isError,refetch}=useQuery({queryKey:key,queryFn:()=>myCinemaSuggestions(),staleTime:0,refetchOnMount:'always'});
 const add=useMutation({
  mutationFn:(movieId:string)=>addToWatchlist({data:{movieId}}),
  onSuccess:async (_,movieId)=>{
   client.setQueryData<Awaited<ReturnType<typeof myCinemaSuggestions>>>(key,old=>old?.filter(f=>f.id!==movieId));
   await Promise.all([client.invalidateQueries({queryKey:key}),client.invalidateQueries({queryKey:['my-watchlist']}),client.invalidateQueries({queryKey:['my-dashboard']})]);
  },
 });
 return <section className="member-overview-genres">
  <h3>Seu próximo filme</h3>
  <p className="text-sm text-muted-foreground">Sugestões do catálogo do clube, baseadas em gêneros com pelo menos três avaliações e nota média a partir de 7.</p>
  {add.isError && <p role="alert">Não foi possível adicionar o filme. Atualize a lista e tente novamente.</p>}
  {add.isSuccess && <p role="status">Filme adicionado à sua fila.</p>}
  {isPending ? <p role="status">Buscando sugestões…</p> : isError ? <div><p role="alert">Sugestões indisponíveis.</p><button type="button" onClick={()=>void refetch()}>Tentar novamente</button></div> : !data?.length ? <p>Ainda não encontramos novas sugestões para seu perfil.</p> : <ul className="grid gap-3 sm:grid-cols-2">{data.map(f=><li key={f.id} className="flex gap-3 rounded-lg border border-border p-3">
   {f.poster_path && /^\/[a-zA-Z0-9_.-]+$/.test(f.poster_path) && <img src={'https://image.tmdb.org/t/p/w185'+f.poster_path} alt="" loading="lazy" className="w-20 self-start rounded object-cover"/>}
   <div className="min-w-0 flex-1"><h4 className="break-words font-semibold">{f.title}</h4><p className="text-sm text-muted-foreground">Sua nota média em {f.reason}: {fmt(f.average_rating)} ({f.total} filmes).</p>
    <button type="button" disabled={add.isPending} className="mt-2 rounded border border-border px-3 py-2 text-sm disabled:opacity-50" onClick={()=>add.mutate(f.id)}>{add.isPending && add.variables===f.id?'Adicionando…':'Adicionar à minha fila'}</button>
   </div>
  </li>)}</ul>}
 </section>;
}

type DetailKind = 'all'|'recommended'|'not_recommended'|'perfect'|'genre'|'month'|'decade';
function CinemaFilmDetails({memberKey,genres,months,decades}:{memberKey:string;genres:string[];months:string[];decades:string[]}) {
 const [open,setOpen]=useState(false);
 const [kind,setKind]=useState<DetailKind>('all');
 const [value,setValue]=useState('');
 const [page,setPage]=useState(0);
 const options=kind==='genre'?genres:kind==='month'?months:kind==='decade'?decades:[];
 const {data,isPending,isError,refetch}=useQuery({queryKey:['my-cinema-films',memberKey,kind,value,page],queryFn:()=>myCinemaFilms({data:{kind,value,page}}),enabled:open,staleTime:0});
 return <section className="member-overview-genres">
 <h3>Explore seus filmes</h3>
 <button type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)} className="rounded border border-border px-3 py-2">{open?'Fechar detalhamento':'Explorar indicadores'}</button>
 {open&&<div className="mt-3 space-y-3">
 <label className="block">Indicador <select className="rounded border border-border bg-background p-2" value={kind} onChange={e=>{const k=e.target.value as DetailKind;setKind(k);setValue(k==='genre'?genres[0]??'':k==='month'?months[0]??'':k==='decade'?decades[0]??'':'');setPage(0);}}>
 {([['all','Todos'],['recommended','Recomendados'],['not_recommended','Não recomendados'],['perfect','Nota 10'],['genre','Gênero'],['month','Mês'],['decade','Década']] as const).map(([k,label])=><option key={k} value={k}>{label}</option>)}
 </select></label>
 {options.length>0&&<label className="block">Filtro <select className="rounded border border-border bg-background p-2" value={value} onChange={e=>{setValue(e.target.value);setPage(0);}}>{options.map(o=><option key={o}>{o}</option>)}</select></label>}
 {isPending?<p role="status">Carregando filmes…</p>:isError?<div><p role="alert">Não foi possível carregar os filmes.</p><button type="button" onClick={()=>void refetch()}>Tentar novamente</button></div>:data&&<>
 <p>{data.total} filmes encontrados</p>
 <ul className="space-y-2">{data.items.map(f=><li key={f.movie_id} className="flex items-center gap-3 border-b border-border py-2">
 {f.poster_path&&/^\/[a-zA-Z0-9_.-]+$/.test(f.poster_path)&&<img src={'https://image.tmdb.org/t/p/w92'+f.poster_path} alt="" loading="lazy" className="w-10 rounded"/>}
 <div className="min-w-0 flex-1"><strong className="break-words">{f.title}</strong><p className="text-sm text-muted-foreground">{f.recommend?'Recomendo':'Não recomendo'}</p></div><span>{fmt(f.rating)}/10</span></li>)}</ul>
 <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page+1} de {Math.max(1,Math.ceil(data.total/20))}</span><button type="button" disabled={(page+1)*20>=data.total} onClick={()=>setPage(p=>p+1)}>Próxima</button></div>
 </>}
 </div>}
 </section>;
}

function PersonFilms({memberKey,personId,role,name}:{memberKey:string;personId:number;role:'cast'|'director';name:string}) {
 const [open,setOpen]=useState(false);
 const [page,setPage]=useState(0);
 const {data,isPending,isError,refetch}=useQuery({queryKey:['my-cinema-films',memberKey,role,String(personId),page],queryFn:()=>myCinemaFilms({data:{kind:role,value:String(personId),page}}),enabled:open,staleTime:0});
 return <div className="mt-2">
 <button type="button" className="text-sm underline" aria-expanded={open} aria-label={'Ver filmes de '+name} onClick={()=>{setOpen(v=>!v);setPage(0);}}>{open?'Fechar filmes':'Ver filmes'}</button>
 {open&&<div className="mt-2 space-y-2">{isPending?<p role="status">Carregando…</p>:isError?<button type="button" onClick={()=>void refetch()}>Tentar novamente</button>:data&&<>
 <p className="text-xs">{data.total} filmes</p>
 <ul className="space-y-2">{data.items.map(f=><li key={f.movie_id} className="border-t border-border pt-2 text-sm break-words">{f.title} · {fmt(f.rating)}/10 · {f.recommend?'Recomendo':'Não recomendo'}</li>)}</ul>
 <div className="flex flex-wrap gap-2 text-xs"><button type="button" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>{page+1}/{Math.max(1,Math.ceil(data.total/20))}</span><button type="button" disabled={(page+1)*20>=data.total} onClick={()=>setPage(p=>p+1)}>Próxima</button></div>
 </>}</div>}
 </div>;
}
