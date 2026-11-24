import { createServerFn } from '@tanstack/react-start';
import type { MemberProgress } from '@/lib/achievements';
export const publicMemberAchievements=createServerFn({method:'GET'}).handler(async()=>{
 const {publicClient}=await import('./public-client.server');
 const {data,error}=await publicClient().rpc('club_member_achievements' as never);
 if(error) throw new Error('Não foi possível carregar as conquistas.');
 return data as unknown as MemberProgress[];
});
