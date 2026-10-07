import BookingApp from '@/components/booking-app';
import { seoulNow } from '@/lib/schedule';
export const dynamic = 'force-dynamic';
export default function Home() { return <BookingApp initialMonth={seoulNow().month}/>; }
