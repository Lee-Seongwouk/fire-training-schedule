import { z } from 'zod';
import { body,database,publicHandle,publicPreflight,HttpError,json } from '@/lib/server';
import { futureSlot,targetKey } from '@/lib/schedule';
export const dynamic='force-dynamic';
const input=z.object({slotId:z.string().uuid(),targetName:z.string().trim().min(2).max(80),managerName:z.string().trim().min(2).max(30),phone:z.string().max(30)});
export async function POST(request: Request) {
  return publicHandle(request,async()=> {
    const parsed=input.safeParse(await body(request,true));
    if(!parsed.success) throw new HttpError(400,'대상물명과 관리자 이름을 2자 이상 입력하고 훈련 시간을 선택해 주세요.');
    const d=parsed.data;
    const phone=d.phone.replace(/[\s()-]/g,'');
    if(!/^0\d{8,10}$/.test(phone)) throw new HttpError(400,'전화번호를 확인해 주세요.');
    const key=targetKey(d.targetName);
    if(!key) throw new HttpError(400,'대상물명을 확인해 주세요.');
    const db=database();
    const slot=await db.prepare('SELECT day,time FROM slots WHERE id=? AND enabled=1').bind(d.slotId).first<{day:string;time:string}>();
    if(!slot || !futureSlot(slot.day,slot.time)) throw new HttpError(409,'선택한 시간은 신청할 수 없습니다. 다른 시간을 선택해 주세요.');
    const month=slot.day.slice(0,7);
    const id=crypto.randomUUID(),now=new Date().toISOString();
    try {
      const result=await db.prepare(`INSERT INTO bookings(id,slot_id,month,target_key,target_name,manager_name,phone,status,created_at,updated_at)
        SELECT ?,?,?,?,?,?,?,'pending',?,? FROM slots s WHERE s.id=? AND s.enabled=1
        AND NOT EXISTS(SELECT 1 FROM bookings WHERE slot_id=s.id AND status IN ('pending','approved'))
        AND NOT EXISTS(SELECT 1 FROM bookings WHERE target_key=? AND month=? AND status IN ('pending','approved'))`)
        .bind(id,d.slotId,month,key,d.targetName,d.managerName,phone,now,now,d.slotId,key,month).run();
      if(!result.meta.changes) throw new Error('conflict');
    } catch(e) {
      const duplicate=await db.prepare("SELECT id FROM bookings WHERE target_key=? AND month=? AND status IN ('pending','approved')").bind(key,month).first();
      if(!duplicate && e instanceof Error && !/conflict|UNIQUE constraint/.test(e.message)) throw e;
      throw new HttpError(409,duplicate ? '이 대상물은 이번 달 신청 내역이 있습니다. 변경은 훈련 담당자에게 문의해 주세요.' : '다른 분이 먼저 신청한 시간입니다. 다른 시간을 선택해 주세요.');
    }
    return json({id,status:'pending',day:slot.day,time:slot.time},201);
  });
}
export function OPTIONS(request:Request) {return publicPreflight(request,'POST');}
