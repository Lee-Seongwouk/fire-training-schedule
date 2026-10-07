'use client';
import { ChevronLeft, ChevronRight, Flame, CalendarDays, Clock3, ShieldCheck } from 'lucide-react';
import { Slot,monthLabel,shiftMonth,seoulNow,endTime } from '@/lib/schedule';
import { Button } from '@/components/ui/button';
export function SiteHeader({admin=false,email,homeUrl="/",adminUrl="/admin"}:{admin?:boolean;email?:string;homeUrl?:string;adminUrl?:string}) {
  return <header className="site-header"><div className="header-inner"><a className="brand" href={homeUrl}><span className="brand-mark"><Flame size={23} aria-hidden="true"/></span><span>소방훈련 일정<small>특정소방대상물 훈련 일정 관리</small></span></a><nav aria-label="주 메뉴"><a href={homeUrl} className={!admin?'active':''}>훈련 신청</a><a href={adminUrl} className={admin?'active':''}>관리자</a></nav>{email ? <a className="account-link" href="/signout-with-chatgpt?return_to=%2F" target="_top">로그아웃</a> : null}</div></header>;
}
export function MonthNav({month,onChange,admin=false}:{month:string;onChange:(m:string)=>void;admin?:boolean}) {
  return <div className="month-nav"><h2>{monthLabel(month)}</h2><div className="month-buttons"><Button variant="ghost" className="icon-btn" aria-label="이전 달" disabled={!admin&&month<=seoulNow().month} onClick={()=>onChange(shiftMonth(month,-1))}><ChevronLeft/></Button><Button variant="ghost" className="icon-btn" aria-label="다음 달" onClick={()=>onChange(shiftMonth(month,1))}><ChevronRight/></Button></div></div>;
}
export function CalendarBoard({month,slots,selectedDay,onSelect,admin=false,loading=false}:{month:string;slots:Slot[];selectedDay:string;onSelect:(day:string)=>void;admin?:boolean;loading?:boolean}) {
  const [year,m]=month.split('-').map(Number),first=new Date(Date.UTC(year,m-1,1)).getUTCDay(),count=new Date(Date.UTC(year,m,0)).getUTCDate(),today=seoulNow().day;
  const cells=Array.from({length:first+count},(_,i)=>i<first?null:i-first+1);while(cells.length%7) cells.push(null);
  return <div className={'calendar '+(loading?'is-loading':'')} aria-busy={loading}><div className="weekday-row">{['일','월','화','수','목','금','토'].map((w,i)=><span key={w} className={i===0?'sunday':i===6?'saturday':''}>{w}</span>)}</div><div className="calendar-grid">{cells.map((n,i)=>{
    if(!n) return <div key={`blank-${i}`} className="day-blank"/>;
    const day=`${month}-${String(n).padStart(2,'0')}`,daySlots=slots.filter(s=>s.day===day),available=daySlots.filter(s=>s.available).length,enabled=admin || (available>0&&day>=today);
    return <button type="button" key={day} disabled={!enabled||loading} aria-pressed={day===selectedDay} aria-label={`${m}월 ${n}일${day===today?', 오늘':''}, ${available}개 시간 신청 가능`} className={`calendar-day ${day===selectedDay?'selected':''} ${day===today?'today':''} ${available?'has-slots':''} ${day<today?'past':''}`} onClick={()=>onSelect(day)}><span className="date-num">{n}</span>{daySlots.length?<span className="day-caption">{available?`${available}개`:'마감'}</span>:<span className="day-caption">{day===today?'오늘':''}</span>}</button>;
  })}</div><div className="calendar-legend"><span><i className="legend-open"/>신청 가능</span><span><i className="legend-selected"/>선택한 날짜</span><span>한국 시간 기준</span></div></div>;
}
export function TrainingRules() {
  return <div className="training-rules"><span><Clock3 size={17} aria-hidden="true"/>훈련 30분 이내</span><span><CalendarDays size={17} aria-hidden="true"/>대상물별 월 1회</span><span><ShieldCheck size={17} aria-hidden="true"/>승인 후 문자 안내</span></div>;
}
export function SlotTime({slot}:{slot:Pick<Slot,'time'>}) {return <span className="time-numbers">{slot.time}<span className="time-divider">–</span>{endTime(slot.time)}</span>;}
export function SiteFooter() {return <footer className="site-footer"><span>소방훈련 일정</span><span>신청 정보는 훈련 일정 조율에 사용됩니다.</span></footer>;}
