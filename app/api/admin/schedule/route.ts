import { adminUser,database,handle,json,monthParam } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(request: Request) {
  return handle(async()=> {
    await adminUser();
    const month=monthParam(request),db=database();
    const [slots,bookings]=await db.batch<Record<string,unknown>>([
      db.prepare(`SELECT s.id,s.day,s.time,s.minute,NOT EXISTS(SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status IN ('pending','approved')) AS available
        FROM slots s WHERE s.enabled=1 AND substr(s.day,1,7)=? ORDER BY s.day,s.minute`).bind(month),
      db.prepare(`SELECT b.id,b.slot_id AS slotId,b.month,b.target_name AS targetName,b.manager_name AS managerName,b.phone,b.status,b.created_at AS createdAt,s.day,s.time
        FROM bookings b JOIN slots s ON s.id=b.slot_id WHERE b.month=? ORDER BY s.day,s.minute,b.created_at DESC`).bind(month),
    ]);
    return json({slots:slots.results.map(s=>({...s,available:!!s.available})),bookings:bookings.results});
  });
}
