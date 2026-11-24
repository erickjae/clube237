import {createFileRoute,Link} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {ClubShell} from '@/components/club-shell';
import {EmptyClub} from '@/components/catalog-view';
import {pageHead} from '@/lib/metadata';
import {AchievementShowcase,memberAchievementsOptions} from '@/components/member-achievements';
import {medal} from '@/lib/achievements';
export const Route=createFileRoute('/membros')({head:()=>pageHead('Membros','Conheça as pessoas e perspectivas que fazem parte do Clube237.'),loader:({context})=>context.queryClient.ensureQueryData(memberAchievementsOptions),component:Members});
function Members(){
 const {data}=useSuspenseQuery(memberAchievementsOptions);
 return <ClubShell><div className="container-club"><header className="page-heading"><p className="eyebrow">Pessoas, não críticos</p><h1>Os olhares do clube</h1><p>O mesmo filme nunca é o mesmo para todo mundo.</p></header><h2>Ranking de membros</h2><div className="member-list">{data.length?data.map(p=><article className="achievement-member" key={p.id}><Link to="/membros/$profileId" params={{profileId:p.id}} className="member-row member-row-link">{p.avatar_url?<img className="club-avatar" src={p.avatar_url} alt={`Avatar de ${p.display_name}`}/>:<div className="club-avatar" aria-hidden="true">{p.display_name.slice(0,1).toUpperCase()}</div>}<div className="achievement-member-info"><h2>{p.display_name} {medal(p,data)}</h2><p className="text-sm text-muted-foreground">{p.about||'Conheça as avaliações e preferências deste membro.'}</p><span className="member-profile-link">Ver perfil e avaliações</span></div><div className="achievement-total"><strong>{p.total}</strong><small>Filmes avaliados</small></div></Link><AchievementShowcase member={p}/></article>):<EmptyClub title="Os primeiros olhares estão chegando" description="Os perfis dos membros convidados aparecerão aqui."/>}</div></div></ClubShell>;
}
