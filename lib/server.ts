import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { PUBLIC_ORIGIN } from '@/lib/deployment';
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
// Only the two anonymous booking endpoints accept the GitHub Pages origin.
export async function publicHandle(request: Request, action: () => Promise<Response>) {
  const origin=request.headers.get('origin');
  if(origin && origin!==new URL(request.url).origin && origin!==PUBLIC_ORIGIN) return json({error:'이 페이지에서 다시 시도해 주세요.'},403);
  const response=await handle(action);
  if(origin===PUBLIC_ORIGIN) {
    response.headers.set('Access-Control-Allow-Origin',PUBLIC_ORIGIN);
    response.headers.set('Vary','Origin');
  }
  return response;
}
export async function publicPreflight(request: Request, method: 'GET'|'POST') {
  return publicHandle(request,async()=> {
    if(request.headers.get('access-control-request-method')!==method) throw new HttpError(405,'허용되지 않은 요청입니다.');
    const requested=request.headers.get('access-control-request-headers')?.toLowerCase().split(',').map(s=>s.trim())??[];
    if(requested.some(h=>h!=='content-type')) throw new HttpError(403,'허용되지 않은 요청입니다.');
    return new Response(null,{status:204,headers:{'Access-Control-Allow-Methods':method,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600','Cache-Control':'no-store'}});
  });
}
export async function body(request: Request, publicBooking=false) {
  const origin=request.headers.get('origin');
  if(origin && origin !== new URL(request.url).origin && !(publicBooking && origin===PUBLIC_ORIGIN)) throw new HttpError(403,'이 페이지에서 다시 시도해 주세요.');
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
