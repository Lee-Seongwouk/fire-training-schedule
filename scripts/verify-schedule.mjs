import assert from 'node:assert/strict';
const origin='http://127.0.0.1:5173';
const cookie='__sites_local_auth=1';
async function request(path,method='GET',data,auth=false,extra={}) {
 const response=await fetch(origin+path,{method,headers:{'Content-Type':'application/json',Origin:origin,...(auth?{Cookie:cookie}:{}),...extra},...(data?{body:JSON.stringify(data)}:{})});
 const raw=await response.text();let result;try{result=JSON.parse(raw);}catch{result={error:raw};}return {status:response.status,data:result};
}
const future=new Date(Date.now()+9*3600000+14*86400000).toISOString().slice(0,10);
const month=future.slice(0,7);
const report=[];
async function expect(label,promise,status){const r=await promise;assert.equal(r.status,status,`${label}: ${JSON.stringify(r)}`);report.push(label);return r.data;}
await expect('Anonymous admin access denied',request('/api/admin/schedule?month='+month),401);
await expect('Spoofed auth headers denied',request('/api/admin/schedule?month='+month,'GET',undefined,false,{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'seedy@sites.test'}),401);
await expect('Cross-origin mutation denied',request('/api/admin/slots','POST',{day:future,time:'09:00'},true,{Origin:'https://other.example'}),403);
const s1=await expect('Register first slot',request('/api/admin/slots','POST',{day:future,time:'09:00'},true),201);
await expect('39-minute gap denied',request('/api/admin/slots','POST',{day:future,time:'09:39'},true),409);
const s2=await expect('40-minute gap accepted',request('/api/admin/slots','POST',{day:future,time:'09:40'},true),201);
const s3=await expect('Register third slot',request('/api/admin/slots','POST',{day:future,time:'10:20'},true),201);
await expect('Fourth daily slot denied',request('/api/admin/slots','POST',{day:future,time:'11:00'},true),409);
await expect('Invalid calendar date denied',request('/api/admin/slots','POST',{day:'2027-02-30',time:'09:00'},true),400);
await expect('Invalid phone denied',request('/api/bookings','POST',{slotId:s1.id,targetName:'검증대상',managerName:'검증담당',phone:'wrong'}),400);
const racers=await Promise.all(['검증대상 A','검증대상 B'].map(targetName=>request('/api/bookings','POST',{slotId:s1.id,targetName,managerName:'검증담당',phone:'01000000000'})));
assert.deepEqual(racers.map(r=>r.status).sort(),[201,409]);report.push('Concurrent applicants: exactly one reservation');
const winner=racers.find(r=>r.status===201).data;
const listing=await request('/api/schedule?month='+month);
assert.equal(listing.data.slots.find(s=>s.id===s1.id).available,false);assert.ok(!JSON.stringify(listing.data).includes('phone'));assert.ok(!JSON.stringify(listing.data).includes('검증담당'));report.push('Pending slot locked; public API contains no contact data');
const a=await request('/api/admin/schedule?month='+month,'GET',undefined,true);
const booking=a.data.bookings.find(b=>b.id===winner.id);
await expect('Normalized target monthly duplicate denied',request('/api/bookings','POST',{slotId:s2.id,targetName:booking.targetName.replaceAll(' ',''),managerName:'검증담당',phone:'01000000001'}),409);
await expect('Deleting occupied slot denied',request('/api/admin/slots','DELETE',{id:s1.id},true),409);
await expect('Reject pending request',request('/api/admin/bookings','PATCH',{id:winner.id,action:'reject'},true),200);
const reopened=await request('/api/schedule?month='+month);assert.equal(reopened.data.slots.find(s=>s.id===s1.id).available,true);report.push('Reject reopens slot');
const b2=await expect('Rejected target can apply again',request('/api/bookings','POST',{slotId:s1.id,targetName:booking.targetName,managerName:'검증담당',phone:'01000000000'}),201);
await expect('Approve booking',request('/api/admin/bookings','PATCH',{id:b2.id,action:'approve'},true),200);
await expect('Approved slot stays locked',request('/api/bookings','POST',{slotId:s1.id,targetName:'다른검증대상',managerName:'검증담당',phone:'01000000002'}),409);
await expect('Admin moves approved booking',request('/api/admin/bookings','PATCH',{id:b2.id,action:'move',slotId:s2.id},true),200);
const moved=await request('/api/schedule?month='+month);assert.equal(moved.data.slots.find(s=>s.id===s1.id).available,true);assert.equal(moved.data.slots.find(s=>s.id===s2.id).available,false);report.push('Move atomically releases old slot and locks new slot');
await expect('Cancel approved booking',request('/api/admin/bookings','PATCH',{id:b2.id,action:'cancel'},true),200);
const cancelled=await request('/api/schedule?month='+month);assert.equal(cancelled.data.slots.find(s=>s.id===s2.id).available,true);report.push('Cancel reopens slot');
await expect('Delete available slot',request('/api/admin/slots','DELETE',{id:s3.id},true),200);
console.log(JSON.stringify({passed:report.length,checks:report},null,2));

