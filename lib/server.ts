import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function database() {
  if (!env.DB) throw new HttpError(503, '일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  return env.DB;
}
export async function adminUser() {
  const user = await getChatGPTUser();
  if (!user) throw new HttpError(401, '관리자 로그인이 필요합니다.');
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || user.email.trim().toLowerCase() !== email) throw new HttpError(403, '등록된 관리자 계정만 이용할 수 있습니다.');
  return user;
}
export function json(data: unknown, status=200) {
  return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export async function handle(action: () => Promise<Response>) {
  try { return await action(); } catch(e) {
    if(e instanceof HttpError) return json({error:e.message},e.status);
    console.error('Schedule operation failed', e instanceof Error ? e.name : 'unknown');
    return json({error:'일정을 처리하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.'},503);
  }
}
export async function body(request: Request) {
  const origin=request.headers.get('origin');
  if(origin && origin !== new URL(request.url).origin) throw new HttpError(403,'이 페이지에서 다시 시도해 주세요.');
  if(!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(400,'올바른 형식으로 입력해 주세요.');
  const raw=await request.text();
  if(raw.length>4000) throw new HttpError(400,'입력 내용이 너무 깁니다.');
  try{return JSON.parse(raw);}catch{throw new HttpError(400,'입력 내용을 확인해 주세요.');}
}
export function monthParam(request: Request) {
  const m=new URL(request.url).searchParams.get('month');
  if(!m || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(m)) throw new HttpError(400,'조회할 월을 확인해 주세요.');
  return m;
}
