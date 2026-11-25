const {chromium}=require('/opt/node22/lib/node_modules/playwright');const path=require('path');
const M=['login','home','listening','check','pay','upi','saved','bills','bill','udhaar','khata','maal','hisaab','settings','orders','assistant'];
const C=['ebill','khata','store','order'];const A=['overview','shops','shop','requests'];
const only=process.argv[2];
(async()=>{const b=await chromium.launch();
async function go(file,s,t,w,h,name){const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
await p.goto('file://'+path.resolve(file)+`?s=${s}&t=${t}`);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
await p.screenshot({path:'shots/'+name+'.png'});await p.close()}
if(!only||only=='m'){for(const [i,s] of M.entries())await go('merchant.html',s,'light',390,844,`m${String(i+1).padStart(2,'0')}-${s}`);
for(const s of ['home','check','pay','udhaar'])await go('merchant.html',s,'dark',390,844,`m-dark-${s}`);}
if(!only||only=='c')for(const [i,s] of C.entries())await go('customer.html',s,'light',390,844,`c0${i+1}-${s}`);
if(!only||only=='a')for(const [i,s] of A.entries())await go('admin.html',s,'light',1440,900,`a0${i+1}-${s}`);
await b.close()})();
