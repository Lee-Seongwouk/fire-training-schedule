import { z } from 'zod';
import { adminUser,body,database,handle,HttpError,json } from '@/lib/server';
import { futureSlot } from '@/lib/schedule';
export const dynamic='force-dynamic';
const slotInput=z.object({day:z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])-\d{2}$/),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)});
export async function POST(request: Request) {
  return handle(async()=> {
    await adminUser();
    const parsed=slotInput.safeParse(await body(request));
    if(!parsed.success) throw new HttpError(400,'날짜와 시작 시간을 확인해 주세요.');
    const {day,time}=parsed.data;
    const check=new Date(`${day}T00:00:00Z`);
    if(Number.isNaN(check.valueOf())||check.toISOString().slice(0,10)!==day||!futureSlot(day,time)) throw new HttpError(400,'현재 이후의 날짜와 시간을 선택해 주세요.');
    const [h,m]=time.split(':').map(Number),minute=h*60+m;
    if(minute>1410) throw new HttpError(400,'훈련이 당일 끝나도록 23:30 이전 시간을 선택해 주세요.');
    const id=crypto.randomUUID();
    const result=await database().prepare(`INSERT INTO slots(id,day,time,minute,enabled,created_at)
      SELECT ?,?,?,?,1,? WHERE (SELECT COUNT(*) FROM slots WHERE day=? AND enabled=1)<3
      AND NOT EXISTS(SELECT 1 FROM slots WHERE day=? AND enabled=1 AND ABS(minute-?)<40)`)
      .bind(id,day,time,minute,new Date().toISOString(),day,day,minute).run();
    if(!result.meta.changes) throw new HttpError(409,'하루 최대 3개 시간만 등록할 수 있으며, 시작 시간 사이에 최소 40분이 필요합니다.');
    return json({id},201);
  });
}
export async function DELETE(request: Request) {
  return handle(async()=> {
    await adminUser();
    const parsed=z.object({id:z.string().uuid()}).safeParse(await body(request));
    if(!parsed.success) throw new HttpError(400,'삭제할 시간을 확인해 주세요.');
    const result=await database().prepare(`UPDATE slots SET enabled=0 WHERE id=? AND enabled=1
      AND NOT EXISTS(SELECT 1 FROM bookings WHERE slot_id=slots.id AND status IN ('pending','approved'))`).bind(parsed.data.id).run();
    if(!result.meta.changes) throw new HttpError(409,'신청이 있는 시간입니다. 먼저 신청을 반려하거나 취소해 주세요.');
    return json({ok:true});
  });
}
