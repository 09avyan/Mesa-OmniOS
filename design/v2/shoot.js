// node shoot.js [m|c|a|logo]  → design/v2/shots/*.png
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const path=require('path');
const M=['login','home','home-loading','home-offline','listening','check','pay','upi','saved','bills','bills-empty','bill','udhaar','udhaar-empty','khata','jama','maal','hisaab','settings','orders','assistant'];
const HIN=['home','check','pay','saved','assistant'];const EDGE=['home','bills'];
const C=['ebill','khata','store','order'];
const A=[['overview',''],['shops','&scroll=120'],['shops-compact','&d=compact'],['shop',''],['requests','']];
const only=process.argv[2];
(async()=>{const b=await chromium.launch();
async function go(file,q,w,h,name){const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
await p.goto('file://'+path.resolve(__dirname,file)+'?'+q);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
await p.screenshot({path:path.join(__dirname,'shots',name+'.png'),animations:'disabled'});await p.close()}
const n=i=>String(i+1).padStart(2,'0');
if(!only||only=='m'){for(const [i,s] of M.entries()){await go('merchant.html',`s=${s}`,390,844,`m${n(i)}-${s}`);await go('merchant.html',`s=${s}&t=dark`,390,844,`d${n(i)}-${s}`)}
for(const [i,s] of HIN.entries())await go('merchant.html',`s=${s}&l=hi`,390,844,`h${n(i)}-${s}`);
for(const [i,s] of EDGE.entries())await go('merchant.html',`s=${s}&edge=1`,390,844,`e${n(i)}-${s}-long`);}
if(!only||only=='c')for(const [i,s] of C.entries()){await go('customer.html',`s=${s}`,390,844,`c${n(i)}-${s}`);await go('customer.html',`s=${s}&t=dark`,390,844,`cd${n(i)}-${s}`)}
if(!only||only=='a')for(const [i,[s,x]] of A.entries())await go('admin.html',`s=${s.replace('-compact','')}${x}`,1440,900,`a${n(i)}-${s}`);
await b.close()})();
