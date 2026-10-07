import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BookingApp from '@/components/booking-app';
import { seoulNow } from '@/lib/schedule';
import { PUBLIC_URL, BACKEND_URL } from '@/lib/deployment';
import '@/app/globals.css';

createRoot(document.getElementById('root')!).render(<StrictMode><BookingApp initialMonth={seoulNow().month} apiBase={BACKEND_URL} homeUrl={PUBLIC_URL} adminUrl={`${BACKEND_URL}/admin`}/></StrictMode>);
