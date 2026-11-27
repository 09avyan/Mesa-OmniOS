// node logo-export.js → renders PNG icons + favicon-check.png in design/v2/logo/
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const path=require('path');const d=path.join(__dirname,'logo');
(async()=>{const b=await chromium.launch();
for(const [src,size,out] of [['favicon.svg',16,'favicon-16.png'],['favicon.svg',32,'favicon-32.png'],['favicon.svg',48,'favicon-48.png'],['logo-a.svg',192,'icon-192.png'],['logo-a.svg',512,'icon-512.png'],['icon-square.svg',180,'apple-touch-180.png'],['icon-square.svg',512,'maskable-512.png']]){
const p=await b.newPage({viewport:{width:size,height:size}});const tmp=path.join(d,'.tmp.html');require('fs').writeFileSync(tmp,`<html><body style="margin:0;background:transparent"><img src="${src}" width="${size}" height="${size}" style="display:block"></body></html>`);await p.goto('file://'+tmp);await p.waitForTimeout(200);require('fs').unlinkSync(tmp);
await p.screenshot({path:path.join(d,out),omitBackground:true});await p.close()}
const p=await b.newPage({viewport:{width:1180,height:400},deviceScaleFactor:2});await p.goto('file://'+path.join(d,'check.html'));await p.waitForTimeout(800);
await p.screenshot({path:path.join(d,'favicon-check.png'),fullPage:true});await b.close()})();
