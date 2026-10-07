import { database,publicHandle,publicPreflight,json,monthParam } from '@/lib/server';
import { futureSlot } from '@/lib/schedule';
export const dynamic='force-dynamic';
export async function GET(request: Request) {
  return publicHandle(request,async()=> {
    const month=monthParam(request);
    const {results}=await database().prepare(`SELECT s.id,s.day,s.time,s.minute,
      NOT EXISTS(SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status IN ('pending','approved')) AS available
      FROM slots s WHERE s.enabled=1 AND substr(s.day,1,7)=? ORDER BY s.day,s.minute`).bind(month).all();
    return json({slots: results.filter(s=>futureSlot(String(s.day),String(s.time))).map(s=>({...s,available:!!s.available}))});
  });
}
export function OPTIONS(request:Request) {return publicPreflight(request,'GET');}
