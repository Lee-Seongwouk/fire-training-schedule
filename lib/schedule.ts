export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type Slot = { id: string; day: string; time: string; minute: number; available: boolean };
export type Booking = {
  id: string; slotId: string; month: string; targetName: string; managerName: string;
  phone: string; status: BookingStatus; day: string; time: string; createdAt: string;
};
export const statusLabels: Record<BookingStatus, string> = {
  pending: '승인 대기', approved: '확정', rejected: '반려', cancelled: '취소',
};
export function seoulNow() {
  const local = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();
  return { day: local.slice(0,10), month: local.slice(0,7), time: local.slice(11,16) };
}
export function futureSlot(day: string, time: string) {
  const now = seoulNow();
  return day > now.day || (day === now.day && time > now.time);
}
export function shiftMonth(month: string, amount: number) {
  const [year,m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(year, m-1+amount, 1));
  return d.toISOString().slice(0,7);
}
export function monthLabel(month: string) {
  const [year,m] = month.split('-').map(Number);
  return `${year}년 ${m}월`;
}
export function dateLabel(day: string, year = false) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...(year ? {year: 'numeric' as const} : {}), month:'long', day:'numeric', weekday:'short' }).format(new Date(`${day}T00:00:00+09:00`));
}
export function endTime(time: string) {
  const [h,m] = time.split(':').map(Number);
  const mins=h*60+m+30;
  return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
}
export function phoneLabel(phone: string) {
  return phone.length === 11 ? phone.replace(/(\d{3})(\d{4})(\d{4})/,'$1-$2-$3') : phone;
}
export function smsText(b: Booking) {
  return `[소방훈련 일정 확정]\n${b.targetName} 소방안전관리자님, 훈련 일정이 확정되었습니다.\n일시: ${dateLabel(b.day, true)} ${b.time}~${endTime(b.time)}\n훈련 시간: 30분 이내\n변경이 필요한 경우 담당자에게 연락해 주세요.`;
}
export function targetKey(name: string) {
  return name.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/[\s\p{P}\p{S}]/gu, '');
}
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...options?.headers } });
  let data: unknown;
  try { data = await response.json(); } catch { throw new Error('연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.'); }
  if(!response.ok) throw new Error(data && typeof data==='object' && 'error' in data && typeof data.error==='string' ? data.error : '요청을 처리하지 못했습니다. 다시 시도해 주세요.');
  return data as T;
}
