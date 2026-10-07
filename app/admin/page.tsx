import { getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { adminUser,HttpError } from '@/lib/server';
import { seoulNow } from '@/lib/schedule';
import AdminApp from '@/components/admin-app';
import { SiteHeader,SiteFooter } from '@/components/schedule-ui';
import { ShieldCheck,CalendarDays,ClipboardCheck,QrCode } from 'lucide-react';
export const dynamic='force-dynamic';
export default async function AdminPage() {
  const user=await getChatGPTUser();
  if(user) {
    try {
      const admin=await adminUser();
      return <AdminApp initialMonth={seoulNow().month} email={admin.email}/>;
    } catch(e) {if(!(e instanceof HttpError))throw e;}
  }
  return <><SiteHeader admin/><main className="login-main"><section className="login-panel panel"><div className="login-icon"><ShieldCheck size={34}/></div><p className="eyebrow">담당자 전용</p><h1>소방훈련 일정 관리</h1><p className="heading-note">훈련 가능한 시간을 등록하고<br/>신청된 일정을 확인·승인하세요.</p><div className="login-features"><span><CalendarDays/>월별 훈련 시간 등록</span><span><ClipboardCheck/>신청 확인 및 일정 승인</span><span><QrCode/>공통 QR코드 다운로드</span></div>{user?<><div className="error-message" role="alert">현재 계정은 등록된 관리자 계정이 아닙니다.</div><a className="link-button primary-btn" href={chatGPTSignOutPath('/admin')} target="_top">로그아웃하고 계정 변경</a></>:<a className="link-button primary-btn" href={chatGPTSignInPath('/admin')} target="_top">ChatGPT 계정으로 로그인</a>}<p className="form-footnote">등록된 관리자 계정만 이용할 수 있습니다.</p></section></main><SiteFooter/></>;
}
