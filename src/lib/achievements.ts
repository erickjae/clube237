export const levels = [1,10,50,100,500,1000] as const;
export const tiers = ['Inicial','Bronze','Prata','Ouro','Platina','Diamante'];
export const colors = ['#858585','#b77c49','#c0c5ce','#d4af37','#79c8cf','#b49af4'];
export const categories = [
['Geral','🎬 Primeira sessão|🍿 Maratonista|🎞️ Cinéfilo|🏆 Veterano|👑 Lenda do clube|💎 Além dos créditos'],
['Terror','😱 Primeiro susto|🔦 Sobrevivente|👻 Caçador de pesadelos|💀 Mestre do medo|🧛 Senhor das sombras|🔥 Pesadelo eterno'],
['Ação','👊 Primeiro golpe|💥 Adrenalina pura|🥋 Máquina de ação|🚁 Missão impossível|🔥 Imparável|🏆 Herói de ação'],
['Aventura','🎒 Primeira jornada|🧭 Explorador|🗺️ Caçador de tesouros|🏔️ Desbravador|🌎 Conquistador de mundos|🏴‍☠️ Lenda dos sete mares'],
['Animação','✏️ Primeiro traço|🖍️ Mundo colorido|🎨 Mestre das cores|🪄 Imaginação sem limites|🏰 Criador de mundos|🌈 Universo animado'],
['Comédia','😄 Primeiro sorriso|😂 Risada garantida|🤣 Crise de riso|🎭 Mestre do humor|🤡 Rei da comédia|🏆 Lenda das gargalhadas'],
['Crime','🔍 Primeira pista|🕵️ Investigador|💼 Fora da lei|🚔 Mestre do submundo|🎩 O poderoso chefão|♟️ Mente criminosa'],
['Documentário','👀 Olhar curioso|📚 Colecionador de fatos|🔬 Investigador da realidade|🎥 Mestre da verdade|🌍 Testemunha do mundo|🧠 Enciclopédia viva'],
['Drama','🥹 Primeira emoção|💔 Coração sensível|🎭 Alma dramática|🌹 Mestre das emoções|🖋️ Histórias de uma vida|🏆 A arte de sentir'],
['Família','🧸 Primeira lembrança|🏠 Sessão em família|🍿 Laços de cinema|❤️ Guardião das memórias|🌟 Coração de ouro|🏡 Legado de gerações'],
['Fantasia','✨ Primeiro encanto|🪄 Aprendiz de magia|🧙 Feiticeiro|🐉 Mestre dos dragões|🔮 Arquimago|🌌 Senhor dos reinos'],
['História','📜 Primeira página|⏳ Viajante do tempo|🏛️ Guardião do passado|⚱️ Cronista das eras|👑 Testemunha dos impérios|📖 Memória da humanidade'],
['Música','🎵 Primeira nota|🎧 Ouvido afinado|🎸 Astro do palco|🎹 Maestro|🎼 Virtuose|🎤 Lenda da música'],
['Mistério','❓ Primeira incógnita|🔍 Detetive curioso|🧩 Decifrador|🕵️ Mestre das pistas|🔐 Guardião dos segredos|🧠 Enigma indecifrável'],
['Romance','💌 Primeiro encontro|🌹 Romântico|💘 Cupido|💞 Mestre dos corações|💍 Amor de cinema|❤️‍🔥 Amor eterno'],
['Ficção científica','🚀 Primeiro lançamento|🛰️ Explorador espacial|👽 Contato imediato|🪐 Viajante intergaláctico|🌌 Além do universo|♾️ Além do infinito'],
['Cinema TV','📺 Primeira transmissão|📡 Sintonizado|🎬 Sessão especial|🎞️ Mestre da programação|🌟 Estrela da telinha|🏆 Lenda da televisão'],
['Thriller','😬 Primeira tensão|⏱️ Contra o tempo|🔪 À beira do abismo|🧠 Mestre da tensão|♟️ Jogo psicológico|⚡ Suspense absoluto'],
['Guerra','🪖 Primeiro batalhão|🎖️ Recruta veterano|⚔️ Estrategista|🛡️ Comandante|🕊️ Guardião da paz|🏅 Lenda dos campos de batalha'],
['Faroeste','🐎 Primeiro duelo|🔫 Pistoleiro|💰 Caçador de recompensas|⭐ Xerife|🌵 Lenda do Oeste|🤠 O último fora da lei']
].map(([name,labels])=>({name,labels:labels.split('|')}));
export type MemberProgress = {id:string;display_name:string;avatar_url:string|null;about:string|null;total:number;recommended:number;genres:Record<string,number>};
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function progress(member:MemberProgress) {
 return categories.map(c=>{
 const aliases=c.name==='Thriller'?['thriller','suspense']:c.name==='Cinema TV'?['cinema tv','filme para tv','tv movie']: [normalize(c.name)];
 const count=c.name==='Geral'?member.total:Object.entries(member.genres).filter(([name])=>aliases.includes(normalize(name))).reduce((sum,[,n])=>sum+n,0);
 const items=levels.map((goal,i)=>({goal,label:c.labels[i],emoji:c.labels[i].split(' ')[0],tier:tiers[i],color:colors[i],unlocked:count>=goal,category:c.name,count}));
 return {name:c.name,count,items};
 });
}
export function medal(m:MemberProgress,all:MemberProgress[]) {
 const rank=1+all.filter(a=>a.total>m.total).length;
 return m.total>0?(['🥇','🥈','🥉'][rank-1]??''):'';
}
