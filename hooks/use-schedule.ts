'use client';
import {useState,useEffect,useCallback,useRef} from 'react';
import {api,Slot,Booking} from '@/lib/schedule';
type Data={slots:Slot[];bookings:Booking[]};
export function useSchedule(month:string,admin=false) {
  const [data,setData]=useState<Data>({slots:[],bookings:[]}),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const controller=useRef<AbortController|null>(null);
  const reload=useCallback(async(quiet=false)=>{
    controller.current?.abort();const c=new AbortController();controller.current=c;if(!quiet)setLoading(true);
    try {const result=await api<Data>(`/api/${admin?'admin/':''}schedule?month=${month}`,{signal:c.signal});if(!c.signal.aborted){setData({slots:result.slots,bookings:result.bookings??[]});setError('');}}
    catch(e){if(!c.signal.aborted)setError(e instanceof Error?e.message:'일정을 불러오지 못했습니다.');}
    finally{if(!c.signal.aborted)setLoading(false);}
  },[month,admin]);
  useEffect(()=>{setData({slots:[],bookings:[]});void reload();const refresh=()=>{if(document.visibilityState==='visible')void reload(true);};const timer=setInterval(refresh,20000);window.addEventListener('focus',refresh);return ()=>{controller.current?.abort();clearInterval(timer);window.removeEventListener('focus',refresh);};},[reload]);
  return {...data,loading,error,reload};
}
