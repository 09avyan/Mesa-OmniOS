const P={mic:"M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z M19 11a7 7 0 0 1-14 0 M12 18v3",
home:"M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",receipt:"M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z M9 8h6 M9 12h6",
book:"M4 5a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 2z M4 20a2 2 0 0 0 2 1h12v-3 M9 8h5",box:"M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10",
chart:"M4 20V11 M10 20V5 M16 20v-6 M21 20H3",cash:"M2 6h20v12H2z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M6 12h.01 M18 12h.01",
qr:"M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M17 17h4v4h-4z M6 6h1 M17 6h1 M6 17h1",
send:"M21 3L10 14 M21 3l-7 18-4-7-7-4z",check:"M5 12l5 5 9-10",x:"M6 6l12 12 M18 6L6 18",chevR:"M9 6l6 6-6 6",chevL:"M15 6l-6 6 6 6",chevD:"M6 9l6 6 6-6",
search:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4",sliders:"M4 6h9 M17 6h3 M4 12h3 M11 12h9 M4 18h11 M19 18h1 M15 4v4 M9 10v4 M17 16v4",
phone:"M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",bag:"M5 8h14l-1 12H6z M9 8a3 3 0 0 1 6 0",
user:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",plus:"M12 5v14 M5 12h14",minus:"M5 12h14",back:"M21 5H9l-6 7 6 7h12z M12 9l6 6 M18 9l-6 6",
clock:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2",truck:"M2 6h12v10H2z M14 10h4l3 3v3h-7 M6 19a2 2 0 1 0 0-.1 M17 19a2 2 0 1 0 0-.1",
download:"M12 4v11 M7 10l5 5 5-5 M5 20h14",lock:"M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4",store:"M3 9l2-5h14l2 5 M4 9v11h16V9 M3 9h18 M9 20v-6h6v6",
vol:"M4 9h4l5-4v14l-5-4H4z M17 9a4 4 0 0 1 0 6 M19.5 6.5a8 8 0 0 1 0 11",edit:"M4 20h4L19 9l-4-4L4 16z",more:"M5 12h.01 M12 12h.01 M19 12h.01",
globe:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18",up:"M7 17L17 7 M9 7h8v8",reset:"M4 4v6h6 M4 10a8 8 0 1 1 2 7",
grid:"M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",bell:"M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z M10 21h4",moon:"M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z",
logout:"M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10",filter:"M4 5h16l-6 8v6l-4-2v-4z",print:"M6 9V3h12v6 M6 17H4v-7h16v7h-2 M7 14h10v7H7z",alert:"M12 3l10 18H2z M12 10v4 M12 17h.01",
spark:"M3 12h3l3-8 6 16 3-8h3",
cloudOff:"M3 3l18 18 M9.5 5.4A6 6 0 0 1 17.7 9.2 4.5 4.5 0 0 1 20.5 17 M16 19H7a5 5 0 0 1-2.9-9.1",undo:"M9 14L4 9l5-5 M4 9h11a5 5 0 0 1 0 10h-3",
cal:"M4 6h16v15H4z M4 10h16 M8 3v4 M16 3v4",rows:"M4 6h16 M4 12h16 M4 18h16",rowsC:"M4 5h16 M4 9.5h16 M4 14h16 M4 18.5h16",csv:"M6 3h9l4 4v14H6z M14 3v5h5 M9 13h6 M9 17h6"};
function I(n,c=''){return `<svg class="i ${c}" viewBox="0 0 24 24"><path d="${P[n]}"/></svg>`}
// Logo A (Voice "O"): ink tile, white ring, teal wave bars. <=24px uses the simplified one-bar mark.
function LOGO(s=36){if(s<=24)return `<svg width="${s}" height="${s}" viewBox="0 0 96 96" style="flex:none" aria-hidden="true"><rect width="96" height="96" rx="22" fill="var(--logo-tile,#141517)"/><circle cx="48" cy="48" r="25" fill="none" stroke="#fff" stroke-width="11"/><rect x="42" y="35" width="12" height="26" rx="6" fill="#5FC3B6"/></svg>`;
return `<svg width="${s}" height="${s}" viewBox="0 0 96 96" style="flex:none" aria-hidden="true"><rect x=".5" y=".5" width="95" height="95" rx="23.5" fill="var(--logo-tile,#141517)" stroke="var(--logo-rim,transparent)"/><circle cx="48" cy="48" r="24" fill="none" stroke="#fff" stroke-width="7"/><g fill="#5FC3B6"><rect x="38" y="40" width="5" height="16" rx="2.5"/><rect x="46" y="34" width="5" height="28" rx="2.5"/><rect x="54" y="42" width="5" height="12" rx="2.5"/></g></svg>`}
const Q=new URLSearchParams(location.search);if(Q.get('t')==='dark')document.documentElement.dataset.theme='dark';
// Hindi (Devanagari) mode: ?l=hi. Cash / UPI / WhatsApp / Bill stay in English.
const HI=Q.get('l')==='hi';if(HI){document.documentElement.lang='hi';document.documentElement.dataset.script='deva'}
const t=(en,hi)=>HI&&hi!=null?hi:en;
function QR(n=25,seed=7){let r=seed,o='';const rnd=()=>(r=(r*9301+49297)%233280)/233280;const f=(x,y)=>(x<7&&y<7)||(x>=n-7&&y<7)||(x<7&&y>=n-7);
for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(f(x,y))continue;if(rnd()>.52)o+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}
const fd=(x,y)=>`<path d="M${x} ${y}h7v7h-7z M${x+1} ${y+1}v5h5v-5z" fill-rule="evenodd"/><rect x="${x+2}" y="${y+2}" width="3" height="3"/>`;
return `<svg viewBox="-1 -1 ${n+2} ${n+2}" shape-rendering="crispEdges" style="width:100%;height:100%;display:block"><rect x="-1" y="-1" width="${n+2}" height="${n+2}" fill="#fff"/><g fill="#141517">${o}${fd(0,0)}${fd(n-7,0)}${fd(0,n-7)}</g></svg>`}
