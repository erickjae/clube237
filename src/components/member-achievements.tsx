import {useState} from 'react';
import {progress, type MemberProgress} from '@/lib/achievements';
import {publicMemberAchievements} from '@/services/member-achievements.functions';
export const memberAchievementsOptions={queryKey:['member-achievements'],queryFn:()=>publicMemberAchievements(),staleTime:0};
type Item=ReturnType<typeof progress>[number]['items'][number];
function Badge({item,next}:{item:Item;next?:Item}) {
 return <details className="achievement-badge"><summary style={{borderColor:item.color}} title={item.label} aria-label={item.label}>{item.emoji}</summary><div className="achievement-tip"><strong>{item.label}</strong><p>{item.category} · {item.tier}</p><p>{item.count} filmes avaliados · meta {item.goal}</p>{next?<p>Próxima: {next.label}<br/>Faltam {next.goal-item.count} filmes ({item.count}/{next.goal}).</p>:<p>Nível máximo alcançado!</p>}</div></details>;
}
export function AchievementShowcase({member}:{member:MemberProgress}) {
 return <div className="achievement-showcase">{progress(member).map(c=>{
 const items=c.items.filter(a=>a.unlocked&&(c.name==='Geral'||a.goal>=10));const item=items[items.length-1];
 return item?<Badge key={c.name} item={item} next={c.items.find(a=>!a.unlocked)}/>:null;
 })}</div>;
}
function AchievementCard({item}:{item:Item}) {
 return <div className="achievement-card" style={{borderColor:item.unlocked?item.color:undefined}}><small style={{color:item.unlocked?item.color:undefined}}>{item.tier} · {item.category}</small><span className="achievement-emoji">{item.emoji}</span><strong>{item.label.split(' ').slice(1).join(' ')}</strong><span>{item.goal.toLocaleString('pt-BR')} filmes</span><progress max={item.goal} value={Math.min(item.count,item.goal)}/><small>{item.unlocked?'✓ Conquistada': '🔒 '+item.count+'/'+item.goal+' · faltam '+(item.goal-item.count)}</small></div>;
}
export function AchievementCollection({member}:{member:MemberProgress}) {
 const [category,setCategory]=useState('Geral');
 const groups=progress(member);const unlocked=groups.flatMap(g=>g.items).filter(a=>a.unlocked).length;
 const next=groups.map(g=>g.items.find(a=>!a.unlocked)).filter((a):a is Item=>!!a).sort((a,b)=>(a.goal-a.count)-(b.goal-b.count)||b.count-a.count).slice(0,3);
 return <section className="member-detail-section achievement-collection"><h2>Conquistas · {unlocked}/120</h2><details><summary>ⓘ Como funcionam as conquistas?</summary><p>Avalie filmes para desbloquear metas de 1, 10, 50, 100, 500 e 1.000. Cada filme conta uma vez no geral e em todos os seus gêneros. Reavaliar não soma; excluir avaliações pode bloquear conquistas novamente. Filmes na fila não contam.</p></details><progress max={120} value={unlocked}/><details open><summary>Explorar coleção</summary>{next.length>0&&<><h3>Próximas conquistas</h3><div className="achievement-grid">{next.map(a=><AchievementCard key={a.category} item={a}/>)}</div></>}<label>Categoria <select value={category} onChange={e=>setCategory(e.target.value)}>{groups.map(g=><option key={g.name}>{g.name}</option>)}</select></label><div className="achievement-grid">{groups.find(g=>g.name===category)?.items.map(a=><AchievementCard key={a.goal} item={a}/>)}</div></details></section>;
}
