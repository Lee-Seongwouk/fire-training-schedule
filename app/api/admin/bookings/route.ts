import { z } from 'zod';
import { adminUser,body,database,handle,HttpError,json } from '@/lib/server';
import { futureSlot } from '@/lib/schedule';
export const dynamic='force-dynamic';
const input=z.object({id:z.string().uuid(),action:z.enum(['approve','reject','cancel','move']),slotId:z.string().uuid().optional()});
export async function PATCH(request: Request) {
  return handle(async()=> {
    await adminUser();
    const parsed=input.safeParse(await body(request));
    if(!parsed.success) throw new HttpError(400,'신청 내용을 확인해 주세요.');
    const {id,action,slotId}=parsed.data,db=database();
    let result;
    if(action==='move') {
      if(!slotId) throw new HttpError(400,'변경할 시간을 선택해 주세요.');
      const slot=await db.prepare('SELECT day,time FROM slots WHERE id=? AND enabled=1').bind(slotId).first<{day:string;time:string}>();
      if(!slot||!futureSlot(slot.day,slot.time)) throw new HttpError(409,'변경할 수 없는 시간입니다.');
      try {
        result=await db.prepare(`UPDATE bookings SET slot_id=?,month=?,updated_at=? WHERE id=? AND status IN ('pending','approved')
          AND EXISTS(SELECT 1 FROM slots WHERE id=? AND enabled=1)
          AND NOT EXISTS(SELECT 1 FROM bookings WHERE slot_id=? AND status IN ('pending','approved') AND id<>?)`)
          .bind(slotId,slot.day.slice(0,7),new Date().toISOString(),id,slotId,slotId,id).run();
      } catch(e) {
        if(e instanceof Error && /UNIQUE constraint/.test(e.message)) throw new HttpError(409,'이 대상물은 변경하려는 달에 신청 내역이 있습니다.');
        throw e;
      }
    } else {
      const status={approve:'approved',reject:'rejected',cancel:'cancelled'}[action];
      if(action==='approve') {
        const slot=await db.prepare('SELECT s.day,s.time FROM bookings b JOIN slots s ON s.id=b.slot_id WHERE b.id=? AND s.enabled=1').bind(id).first<{day:string;time:string}>();
        if(!slot||!futureSlot(slot.day,slot.time)) throw new HttpError(409,'이미 지난 일정은 승인할 수 없습니다. 먼저 날짜를 변경해 주세요.');
      }
      result=await db.prepare(`UPDATE bookings SET status=?,updated_at=? WHERE id=? AND ${action==='cancel' ? "status IN ('pending','approved')" : "status='pending'"}`)
        .bind(status,new Date().toISOString(),id).run();
    }
    if(!result.meta.changes) throw new HttpError(409,'신청 상태가 변경되었습니다. 새로고침 후 다시 확인해 주세요.');
    return json({ok:true});
  });
}
