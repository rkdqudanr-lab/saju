import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
//  📅 날짜 유틸 (양력 + 음력 근사)
// ═══════════════════════════════════════════════════════════
function getTodayInfo() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const week = ["일","월","화","수","목","금","토"][now.getDay()];
  // 음력 근사 계산
  const lunarBase = new Date(2000, 0, 6); // 음력 2000년 1월 1일 = 양력 2000년 1월 6일
  const diff = Math.floor((now - lunarBase) / 86400000);
  const lunarDay = ((diff % 354) + 354) % 354;
  const lm = Math.floor(lunarDay / 29.5) + 1;
  const ld = Math.round(lunarDay % 29.5) + 1;
  // 절기 (24절기 근사)
  const JEOLGI = ["소한","대한","입춘","우수","경칩","춘분","청명","곡우","입하","소만","망종","하지","소서","대서","입추","처서","백로","추분","한로","상강","입동","소설","대설","동지"];
  const jIdx = Math.floor(((m - 1) * 2 + (d > 20 ? 1 : 0)));
  const jeolgi = JEOLGI[jIdx % 24];
  return {
    solar: `${y}년 ${m}월 ${d}일 (${week}요일)`,
    lunar: `음력 ${lm}월 ${ld}일`,
    jeolgi: `절기 근처: ${jeolgi}`,
    year: y, month: m, day: d
  };
}

// ═══════════════════════════════════════════════════════════
//  🀄 사주 엔진
// ═══════════════════════════════════════════════════════════
const CG=["갑","을","병","정","무","기","경","신","임","계"];
const JJ=["자","축","인","묘","진","사","오","미","신","유","술","해"];
const CGH=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JJH=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CGO=["목","목","화","화","토","토","금","금","수","수"];
const JJO=["수","토","목","목","토","화","화","토","금","금","토","수"];
const OC={목:"#5FAD7A",화:"#E05A3A",토:"#C08830",금:"#B8A035",수:"#4A8EC4"};
const OE={목:"🌿",화:"🔥",토:"🍂",금:"✦",수:"💧"};
const ON={목:"나무",화:"불",토:"흙",금:"금",수:"물"};

const ILGAN_DESC={
  갑:"새로운 길을 먼저 열고 싶은 선구자 기질",
  을:"유연하지만 끝까지 자기 길을 찾는 넝쿨 같은 기질",
  병:"주변을 따뜻하게 밝히는 태양 같은 기질",
  정:"가까운 사람을 위해 자신을 태우는 촛불 같은 기질",
  무:"모든 것을 안아주는 대지 같은 든든한 기질",
  기:"섬세하게 조화를 만드는 정원사 같은 기질",
  경:"한번 결심하면 끝까지 가는 검처럼 날카로운 기질",
  신:"세상을 선명하게 보는 보석 같은 예리한 기질",
  임:"깊이 흐르는 강처럼 지혜롭고 통찰력 있는 기질",
  계:"남들이 못 느끼는 것을 먼저 느끼는 이슬 같은 섬세한 기질",
};

function getSaju(y,m,d,h){
  const yg=((y-4)%10+10)%10,yj=((y-4)%12+12)%12;
  const mb=(y-1900)*12+(m-1),wg=((mb+2)%10+10)%10,wj=((m+1)%12+12)%12;
  const df=Math.floor((new Date(y,m-1,d)-new Date(1900,0,1))/86400000);
  const ig=((df+6)%10+10)%10,ij=((df+2)%12+12)%12;
  const si=Math.floor((h+1)/2)%12,sg=(((ig%5)*2+si)%10+10)%10;
  const all=[CGO[yg],JJO[yj],CGO[wg],JJO[wj],CGO[ig],JJO[ij],CGO[sg],JJO[si%12]];
  const or={목:0,화:0,토:0,금:0,수:0};
  all.forEach(o=>{if(or[o]!==undefined)or[o]++;});
  const dom=Object.entries(or).sort((a,b)=>b[1]-a[1])[0][0];
  const lac=Object.entries(or).sort((a,b)=>a[1]-b[1])[0][0];
  return{
    yeon:{g:CG[yg],j:JJ[yj],gh:CGH[yg],jh:JJH[yj]},
    wol:{g:CG[wg],j:JJ[wj],gh:CGH[wg],jh:JJH[wj]},
    il:{g:CG[ig],j:JJ[ij],gh:CGH[ig],jh:JJH[ij]},
    si:{g:CG[sg],j:JJ[si%12],gh:CGH[sg],jh:JJH[si%12]},
    ilgan:CG[ig],ilji:JJ[ij],ilganDesc:ILGAN_DESC[CG[ig]],or,dom,lac
  };
}

// ═══════════════════════════════════════════════════════════
//  ♈ 점성술 엔진
// ═══════════════════════════════════════════════════════════
const SIGNS=[
  {n:"양자리",s:"♈",sm:3,sd:21,em:4,ed:19,desc:"새로운 것을 먼저 시작하는 용기와 에너지",elem:"불"},
  {n:"황소자리",s:"♉",sm:4,sd:20,em:5,ed:20,desc:"깊고 안정적인 사랑과 감각적인 풍요로움",elem:"흙"},
  {n:"쌍둥이자리",s:"♊",sm:5,sd:21,em:6,ed:20,desc:"호기심과 재치로 세상을 탐험하는 자유로움",elem:"바람"},
  {n:"게자리",s:"♋",sm:6,sd:21,em:7,ed:22,desc:"소중한 사람을 끝까지 지키는 따뜻한 마음",elem:"물"},
  {n:"사자자리",s:"♌",sm:7,sd:23,em:8,ed:22,desc:"타고난 카리스마로 빛나는 당당한 존재감",elem:"불"},
  {n:"처녀자리",s:"♍",sm:8,sd:23,em:9,ed:22,desc:"섬세한 눈으로 완벽함을 추구하는 성실함",elem:"흙"},
  {n:"천칭자리",s:"♎",sm:9,sd:23,em:10,ed:22,desc:"아름다운 균형과 조화를 만드는 심미안",elem:"바람"},
  {n:"전갈자리",s:"♏",sm:10,sd:23,em:11,ed:21,desc:"깊은 곳까지 꿰뚫어보는 강렬한 통찰",elem:"물"},
  {n:"사수자리",s:"♐",sm:11,sd:22,em:12,ed:21,desc:"자유롭게 세상을 탐험하는 낙천적인 모험심",elem:"불"},
  {n:"염소자리",s:"♑",sm:12,sd:22,em:1,ed:19,desc:"묵묵한 인내로 결국 정상에 오르는 뚝심",elem:"흙"},
  {n:"물병자리",s:"♒",sm:1,sd:20,em:2,ed:18,desc:"남들이 못 보는 것을 보는 독창적인 시각",elem:"바람"},
  {n:"물고기자리",s:"♓",sm:2,sd:19,em:3,ed:20,desc:"세상의 감정을 함께 느끼는 풍부한 공감",elem:"물"},
];
function getSun(m,d){
  for(const z of SIGNS){
    if(z.sm<=z.em){if((m===z.sm&&d>=z.sd)||(m===z.em&&d<=z.ed)||(m>z.sm&&m<z.em))return z;}
    else{if((m===z.sm&&d>=z.sd)||(m===z.em&&d<=z.ed)||m>z.sm||m<z.em)return z;}
  }
  return SIGNS[0];
}
function getMoon(y,m,d){
  const days=(new Date(y,m-1,d)-new Date(2000,0,1))/86400000;
  return SIGNS[Math.abs(Math.floor((((days%27.32)+27.32)%27.32/27.32)*12))%12];
}
function getAsc(h,bm){return SIGNS[(Math.floor(h/2)+bm+6)%12];}

// ═══════════════════════════════════════════════════════════
//  🧹 마크다운 전처리기
// ═══════════════════════════════════════════════════════════
function stripMarkdown(text){
  return text
    .replace(/^#{1,6}\s+/gm,'')
    .replace(/---+/g,'')
    .replace(/\*\*(.*?)\*\*/g,'$1')
    .replace(/\*(.*?)\*/g,'$1')
    .replace(/^[-•*]\s+/gm,'')
    .replace(/^\d+\.\s+/gm,'')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}

// ═══════════════════════════════════════════════════════════
//  데이터
// ═══════════════════════════════════════════════════════════
const CATS=[
  {id:"love",icon:"💕",label:"연애",qs:["요즘 좋아하는 사람이 생겼는데 이 감정이 맞는 건지 모르겠어요","언제쯤 새로운 인연이 찾아올까요?","지금 사귀는 사람이랑 미래가 있을까요?","짝사랑하는 사람이 나를 어떻게 생각할까요?","내가 먼저 고백해도 될까요?","연애를 시작하기 좋은 시기인가요?"]},
  {id:"work",icon:"💼",label:"일·커리어",qs:["이직을 고민 중인데 지금 타이밍이 맞을까요?","직장 상사 때문에 너무 힘들어요","나에게 진짜 잘 맞는 일이 뭔지 알고 싶어요","승진할 수 있는 운이 있을까요?","창업을 해도 될까요?","지금 하는 일이 나한테 맞는지 모르겠어요"]},
  {id:"money",icon:"✦",label:"돈·재물",qs:["올해 돈 들어오는 운이 있을까요?","투자를 시작하기 좋은 시기인가요?","내 집 마련 언제쯤 가능할까요?","부업이나 사이드잡 시작해도 될까요?","돈이 계속 나가는데 언제 안정될까요?"]},
  {id:"health",icon:"🌿",label:"건강",qs:["요즘 너무 피곤한데 기운이 없는 이유가 있을까요?","특히 조심해야 할 건강 부위가 있나요?","스트레스가 너무 심해요","수면의 질을 높이려면 어떻게 해야 할까요?","운동을 시작하기 좋은 시기인가요?"]},
  {id:"relation",icon:"🫧",label:"인간관계",qs:["주변에 나한테 안 좋은 사람이 있는 것 같아요","친한 친구랑 사이가 멀어진 것 같아요","새로운 환경에서 잘 적응할 수 있을까요?","직장 동료와의 갈등을 어떻게 풀어야 할까요?","나는 어떤 사람들과 잘 맞나요?"]},
  {id:"future",icon:"🔮",label:"미래·운명",qs:["올해 내 인생에서 가장 중요한 것이 뭔가요?","지금 걷고 있는 방향이 맞는지 불안해요","내가 진짜 잘할 수 있는 게 뭔지 모르겠어요","내 인생의 전환점이 언제쯤 올까요?","요즘 모든 게 막막한데 어떻게 해야 할까요?"]},
];
const PKGS=[
  {id:"seed",e:"✦",n:"씨앗",p:"990원",q:1,chat:0},
  {id:"moon",e:"🌙",n:"달빛",p:"5,900원",q:3,chat:5},
  {id:"star",e:"⭐",n:"별빛",p:"9,900원",q:5,chat:10,hot:true},
  {id:"cosmos",e:"🌌",n:"우주",p:"19,900원",q:10,chat:20},
];
const REVIEWS=[
  {star:"★★★★★",text:"사주랑 별자리를 같이 봐줘서 너무 좋아요. 글이 진짜 내 얘기 같아서 읽다가 소름 돋았어요",nick:"가을고양이 · 28세"},
  {star:"★★★★★",text:"베프한테 상담받는 느낌! 전문용어 없이 쉽게 말해줘서 공감이 돼요",nick:"핑크라떼 · 25세"},
  {star:"★★★★★",text:"추가 질문도 계속할 수 있어서 더 깊이 파고들 수 있었어요. 진짜 대화하는 느낌",nick:"달밤산책 · 31세"},
  {star:"★★★★★",text:"글쓰는 방식이 달라요. AI 같지 않고 진짜 누가 써준 것 같은 느낌",nick:"별빛소나기 · 26세"},
];
const CHAT_SUGG=["좀 더 자세히 알고 싶어요","언제쯤 변화가 올까요?","어떻게 행동하면 좋을까요?","지금 당장 할 수 있는 게 뭔가요?","불안한 마음이 커요","긍정적인 부분도 알고 싶어요"];
const LOAD_STATES=[
  {t:"동양과 서양의 별이 함께 당신을 읽고 있어요",s:"잠깐만요 ✦"},
  {t:"태어난 순간의 기운을 불러오는 중이에요",s:"조금만 기다려줘요 🌙"},
  {t:"당신에게 전할 이야기를 고르고 있어요",s:"거의 다 왔어요 ✨"},
];

// ═══════════════════════════════════════════════════════════
//  🎨 CSS
// ═══════════════════════════════════════════════════════════
const CSS=`
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ff:'Pretendard',-apple-system,sans-serif;
  --bg:#0D0B14;--bg1:#13101E;--bg2:#1A1628;--bg3:#221E33;--bg4:#2A2340;
  --line:rgba(255,255,255,.07);--line2:rgba(255,255,255,.04);
  --t1:#F0EBF8;--t2:#C8BEDE;--t3:#8A7FA0;--t4:#4A4260;
  --gold:#E8B048;--gold2:#C89030;
  --goldf:rgba(232,176,72,.1);--golds:rgba(232,176,72,.05);--acc:rgba(232,176,72,.2);
  --sp1:8px;--sp2:16px;--sp3:24px;--sp4:32px;--sp5:48px;--sp6:64px;
  --r1:12px;--r2:20px;--r3:28px;--r4:36px;
  --xl:1.75rem;--lg:1.125rem;--md:0.9375rem;--sm:0.8125rem;--xs:0.6875rem;
}
[data-theme="light"]{
  --bg:#F7F4EF;--bg1:#FFFFFF;--bg2:#F0EBE2;--bg3:#E8E0D5;--bg4:#DDD5C8;
  --line:rgba(0,0,0,.07);--line2:rgba(0,0,0,.04);
  --t1:#1A1420;--t2:#4A3F60;--t3:#8A7FA0;--t4:#C0B8CC;
  --gold:#B07820;--gold2:#8A5E14;
  --goldf:rgba(176,120,32,.09);--golds:rgba(176,120,32,.05);--acc:rgba(176,120,32,.18);
}
html,body{background:var(--bg);color:var(--t1);font-family:var(--ff);min-height:100vh;-webkit-font-smoothing:antialiased;transition:background .4s,color .4s}
::-webkit-scrollbar{width:0;height:0}
.app{min-height:100vh;position:relative;overflow-x:hidden}
.page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--sp3) var(--sp2) var(--sp5);position:relative;z-index:1}
.page-top{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:72px var(--sp2) var(--sp5);position:relative;z-index:1}
.inner{width:100%;max-width:460px}
.bg-canvas{position:fixed;inset:0;pointer-events:none;z-index:0}

/* 공통 UI */
.theme-btn{position:fixed;top:18px;right:18px;z-index:50;width:36px;height:36px;border-radius:50%;background:var(--bg2);border:1px solid var(--line);color:var(--t3);font-size:.9rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.theme-btn:hover{color:var(--gold);border-color:var(--gold)}
.back-btn{position:fixed;top:18px;left:18px;z-index:50;width:36px;height:36px;border-radius:50%;background:var(--bg2);border:1px solid var(--line);color:var(--t3);font-size:.8rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.back-btn:hover{color:var(--gold)}
.step-dots{display:flex;gap:6px;justify-content:center;margin-bottom:var(--sp3)}
.dot{height:4px;border-radius:2px;transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.dot.done{width:14px;background:var(--t4)}.dot.active{width:28px;background:var(--gold)}.dot.todo{width:4px;background:var(--t4);opacity:.4}

/* ══ LANDING ══ */
.land{text-align:center}
.land-wordmark{font-size:var(--xs);font-weight:300;letter-spacing:.35em;color:var(--t4);text-transform:lowercase;margin-bottom:52px;animation:fadeUp .8s .1s both}
.land-orb{width:148px;height:148px;border-radius:50%;margin:0 auto var(--sp4);position:relative;animation:fadeUp .8s .2s both}
.orb-core{position:absolute;inset:14px;border-radius:50%;background:radial-gradient(circle at 35% 28%,rgba(232,176,72,.75),rgba(190,110,170,.5),rgba(50,30,90,.9),transparent);animation:orbPulse 5s infinite}
.orb-r1{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(232,176,72,.18);animation:orbSpin 14s linear infinite}
.orb-r1::after{content:'';position:absolute;top:-3px;left:50%;width:6px;height:6px;border-radius:50%;background:var(--gold);transform:translateX(-50%);box-shadow:0 0 12px var(--gold),0 0 24px rgba(232,176,72,.4)}
.orb-r2{position:absolute;inset:-16px;border-radius:50%;border:1px solid rgba(232,176,72,.06);animation:orbSpin 22s linear infinite reverse}
.orb-r2::after{content:'';position:absolute;bottom:-3px;right:20%;width:4px;height:4px;border-radius:50%;background:rgba(200,160,255,.7);box-shadow:0 0 8px rgba(200,160,255,.5)}
@keyframes orbPulse{0%,100%{opacity:.88;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
@keyframes orbSpin{to{transform:rotate(360deg)}}
.land-copy{font-size:var(--lg);font-weight:300;color:var(--t1);line-height:1.75;letter-spacing:-.015em;margin-bottom:6px;animation:fadeUp .8s .35s both}
.land-copy em{font-style:normal;color:var(--gold);font-weight:400}
.land-sub{font-size:var(--sm);color:var(--t3);margin-bottom:var(--sp4);animation:fadeUp .8s .45s both;line-height:1.85}
.cta-main{display:inline-flex;align-items:center;gap:.5rem;padding:15px 40px;border:none;border-radius:50px;background:var(--gold);color:#0D0B14;font-size:var(--sm);font-weight:700;font-family:var(--ff);cursor:pointer;letter-spacing:.02em;transition:transform .15s,opacity .15s;animation:fadeUp .8s .55s both}
.cta-main:hover{opacity:.88}
.cta-main:active{transform:scale(.97)}
.land-trust{display:flex;align-items:center;gap:var(--sp2);justify-content:center;margin-top:var(--sp3);font-size:var(--xs);color:var(--t4);animation:fadeUp .8s .65s both}
.rev-wrap{margin-top:var(--sp3);overflow:hidden;animation:fadeUp .8s .75s both}
.rev-track{display:flex;gap:var(--sp2);overflow-x:auto;padding-bottom:4px;scroll-snap-type:x mandatory}
.rev-card{flex-shrink:0;width:210px;scroll-snap-align:start;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2);padding:var(--sp2)}
.rev-stars{font-size:var(--xs);color:var(--gold);margin-bottom:5px;letter-spacing:2px}
.rev-text{font-size:var(--xs);color:var(--t2);line-height:1.75}
.rev-nick{font-size:var(--xs);color:var(--t4);margin-top:5px}

/* ══ CARD (입력) ══ */
.card{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3);padding:var(--sp4) var(--sp3);animation:fadeUp .5s cubic-bezier(.34,1.56,.64,1)}
.card-title{font-size:var(--lg);font-weight:600;color:var(--t1);margin-bottom:5px}
.card-sub{font-size:var(--sm);color:var(--t3);margin-bottom:var(--sp4);line-height:1.75}
.lbl{display:block;font-size:var(--xs);font-weight:600;color:var(--t3);letter-spacing:.06em;margin-bottom:8px}
.inp{width:100%;padding:13px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t1);font-size:var(--sm);font-family:var(--ff);transition:border-color .2s,background .2s;margin-bottom:var(--sp3);-webkit-appearance:none}
.inp:focus{outline:none;border-color:var(--gold);background:var(--bg3)}
.inp::placeholder{color:var(--t4)}
select.inp option{background:var(--bg2)}
.row{display:flex;gap:8px}.row .inp{margin-bottom:0}.col{flex:1;min-width:0}
.gender-group{display:flex;gap:8px;margin-bottom:var(--sp3)}
.gbtn{flex:1;padding:11px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t3);font-size:var(--sm);font-family:var(--ff);cursor:pointer;transition:all .2s}
.gbtn.on{background:var(--goldf);border-color:var(--gold);color:var(--gold);font-weight:600}
.gbtn:active{transform:scale(.97)}
.toggle-row{display:flex;align-items:center;gap:var(--sp2);padding:12px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);cursor:pointer;margin-bottom:var(--sp3)}
.toggle{width:40px;height:22px;border-radius:11px;position:relative;flex-shrink:0;transition:background .25s;border:none;cursor:pointer;padding:0}
.toggle.on{background:var(--gold)}.toggle.off{background:var(--bg3)}
.toggle::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:white;top:3px;transition:left .25s cubic-bezier(.34,1.56,.64,1);box-shadow:0 1px 3px rgba(0,0,0,.3)}
.toggle.on::after{left:21px}.toggle.off::after{left:3px}
.toggle-label{font-size:var(--sm);color:var(--t2)}
.pillars-wrap{margin:var(--sp2) 0}
.pillars-hint{font-size:var(--xs);color:var(--t4);letter-spacing:.07em;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.pillars{display:flex;gap:5px}
.pillar{flex:1;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);padding:10px 3px;text-align:center}
.p-lbl{font-size:var(--xs);color:var(--t4);margin-bottom:3px}.p-hj{font-size:1.05rem;color:var(--gold);font-weight:600;line-height:1.2}.p-kr{font-size:var(--xs);color:var(--t3);margin-top:2px}
.oh-bar{display:flex;height:3px;border-radius:2px;gap:2px;margin:8px 0 6px;overflow:hidden}
.oh-seg{border-radius:1px;transition:flex .6s}
.oh-tags{display:flex;gap:4px;flex-wrap:wrap}
.oh-tag{padding:3px 8px;border-radius:6px;font-size:var(--xs);font-weight:600}
.il-preview{margin-top:var(--sp2);font-size:var(--xs);color:var(--t3);line-height:1.85;padding:10px 12px;background:var(--bg2);border-radius:var(--r1);border-left:2px solid var(--gold)}
.astro-preview{margin-top:8px;display:flex;gap:5px;flex-wrap:wrap}
.a-chip{padding:4px 10px;background:var(--goldf);border:1px solid var(--acc);border-radius:50px;font-size:var(--xs);color:var(--gold)}
.btn-main{width:100%;padding:14px;border:none;border-radius:var(--r1);background:var(--gold);color:#0D0B14;font-size:var(--sm);font-weight:700;font-family:var(--ff);cursor:pointer;transition:transform .15s,opacity .15s;margin-top:var(--sp2)}
.btn-main:hover{opacity:.88}.btn-main:active{transform:scale(.98)}.btn-main:disabled{opacity:.3;cursor:not-allowed;transform:none}

/* ══ 질문 선택 ══ */
.q-shell{animation:fadeUp .5s cubic-bezier(.34,1.56,.64,1)}
.combo-banner{background:var(--goldf);border:1px solid var(--acc);border-radius:var(--r2);padding:12px var(--sp2);margin-bottom:var(--sp3);text-align:center}
.combo-title{font-size:var(--sm);font-weight:600;color:var(--gold);margin-bottom:3px}
.combo-sub{font-size:var(--xs);color:var(--t3);line-height:1.6}
.cat-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:var(--sp2)}
.cat-tab{padding:6px 12px;border-radius:50px;border:1px solid var(--line);background:transparent;color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer;white-space:nowrap;transition:all .2s}
.cat-tab.on{background:var(--goldf);border-color:var(--acc);color:var(--gold);font-weight:600}
.q-list{display:flex;flex-direction:column;gap:4px;margin-bottom:var(--sp3)}
.q-item{width:100%;text-align:left;padding:12px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t2);font-size:var(--sm);font-family:var(--ff);cursor:pointer;line-height:1.55;transition:all .2s}
.q-item:hover{border-color:var(--t4);color:var(--t1);transform:translateX(3px)}.q-item.on{background:var(--goldf);border-color:var(--acc);color:var(--gold);font-weight:500}.q-item.on::before{content:'✓  '}.q-item:disabled{opacity:.28;cursor:not-allowed;transform:none}
.diy-wrap{margin-bottom:var(--sp3)}
.diy-inp{width:100%;padding:12px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t1);font-size:var(--sm);font-family:var(--ff);resize:none;height:68px;transition:border-color .2s}
.diy-inp:focus{outline:none;border-color:var(--gold)}.diy-inp::placeholder{color:var(--t4)}
.diy-row{display:flex;justify-content:space-between;align-items:center;margin-top:5px}
.diy-add{padding:5px 12px;border-radius:8px;border:1px solid var(--acc);background:transparent;color:var(--gold);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:background .2s}
.diy-add:hover{background:var(--goldf)}
.sel-qs{margin-bottom:var(--sp3)}
.sel-lbl{font-size:var(--xs);color:var(--t4);letter-spacing:.07em;margin-bottom:8px}
.sel-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;margin-bottom:4px;background:var(--goldf);border:1px solid var(--acc);border-radius:var(--r1);animation:fadeUp .2s ease}
.sel-n{width:18px;height:18px;border-radius:50%;background:var(--gold);color:#0D0B14;font-size:var(--xs);font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.sel-t{flex:1;font-size:var(--sm);color:var(--t1);line-height:1.5}.sel-del{background:none;border:none;color:var(--t4);cursor:pointer;font-size:.85rem;padding:0;flex-shrink:0;transition:color .2s}.sel-del:hover{color:var(--t2)}
.pkg-sec{margin-bottom:var(--sp2)}.pkg-lbl{font-size:var(--xs);color:var(--t4);letter-spacing:.07em;margin-bottom:8px}
.pkgs{display:flex;gap:5px}
.pkg{flex:1;padding:10px 4px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);text-align:center;cursor:pointer;transition:all .2s;position:relative}
.pkg:hover{border-color:var(--t4)}.pkg.chosen{background:var(--goldf);border-color:var(--gold)}
.pkg-e{font-size:1rem;margin-bottom:2px}.pkg-n{font-size:var(--xs);font-weight:600;color:var(--t2)}.pkg-p{font-size:var(--xs);color:var(--gold);font-weight:700;margin-top:1px}
.pkg-hot{position:absolute;top:-7px;right:-3px;background:var(--gold);color:#0D0B14;font-size:.5rem;font-weight:800;padding:2px 5px;border-radius:4px}
.q-stat{font-size:var(--xs);color:var(--t4);text-align:center;margin:8px 0 var(--sp2)}.q-stat strong{color:var(--gold)}
.free-note{font-size:var(--xs);color:var(--t4);text-align:center;margin-bottom:var(--sp2)}.free-note span{color:var(--gold)}

/* ══ LOADING ══ */
.loading-page{padding:var(--sp4) var(--sp3);width:100%;max-width:460px}
.skel-header{display:flex;align-items:center;gap:var(--sp2);padding:var(--sp3);background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3) var(--r3) 0 0;margin-bottom:2px}
.skel-av{width:48px;height:48px;border-radius:50%;background:var(--bg2)}
.skel-lines{flex:1}
.skel-line{height:10px;border-radius:5px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
.skel-line.w60{width:60%;margin-bottom:8px}.skel-line.w40{width:40%}.skel-line.full{width:100%}.skel-line.w80{width:80%}.skel-line.w55{width:55%}
.skel-body{background:var(--bg1);border:1px solid var(--line);border-top:none;padding:var(--sp3);border-radius:0 0 var(--r3) var(--r3)}
.skel-para{display:flex;flex-direction:column;gap:8px;padding:var(--sp2) 0;border-bottom:1px solid var(--line)}.skel-para:last-child{border-bottom:none}
.skel-status{text-align:center;margin-top:var(--sp3);font-size:var(--sm);color:var(--t3);animation:statusFade .5s ease}
.skel-status-sub{font-size:var(--xs);color:var(--t4);margin-top:5px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes statusFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* ══ RESULT ══ */
.res-wrap{animation:fadeUp .6s cubic-bezier(.34,1.56,.64,1);width:100%;max-width:460px}
.res-card{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden}
.res-header{display:flex;align-items:flex-start;gap:var(--sp2);padding:var(--sp3);border-bottom:1px solid var(--line)}
.res-av{width:44px;height:44px;border-radius:50%;background:var(--goldf);border:1px solid var(--acc);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
.res-name{font-size:var(--sm);font-weight:600;color:var(--t1);margin-bottom:4px}
.res-chips{display:flex;gap:5px;flex-wrap:wrap}
.res-chip{padding:3px 8px;background:var(--bg2);border:1px solid var(--line);border-radius:50px;font-size:var(--xs);color:var(--t3)}

/* 아코디언 */
.acc-item{border-bottom:1px solid var(--line)}.acc-item:last-of-type{border-bottom:none}
.acc-trigger{width:100%;text-align:left;padding:var(--sp2) var(--sp3);background:transparent;border:none;cursor:pointer;color:var(--t2);display:flex;justify-content:space-between;align-items:center;transition:color .2s;gap:var(--sp2)}
.acc-trigger:hover{color:var(--t1)}.acc-trigger.open{color:var(--gold)}
.acc-q-wrap{flex:1;text-align:left}
.acc-q-num{font-size:var(--xs);color:var(--gold);font-weight:700;margin-bottom:2px}
.acc-q-text{font-size:var(--sm);color:inherit;line-height:1.55}
.acc-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.skip-btn{padding:4px 10px;border-radius:8px;border:1px solid var(--acc);background:transparent;color:var(--gold);font-size:var(--xs);font-family:var(--ff);cursor:pointer;white-space:nowrap;transition:background .2s;animation:fadeUp .2s ease}
.skip-btn:hover{background:var(--goldf)}
.acc-chevron{font-size:.6rem;color:var(--t4);transition:transform .3s,color .3s}
.acc-chevron.open{transform:rotate(180deg);color:var(--gold)}
.acc-body{overflow:hidden;transition:max-height .5s cubic-bezier(.4,0,.2,1),opacity .4s ease}
.acc-body.closed{max-height:0!important;opacity:0!important;overflow:hidden!important}
.acc-body.open{max-height:3000px;opacity:1}
.acc-content{padding:0 var(--sp3) var(--sp4);font-size:var(--sm);color:var(--t2);line-height:2.2;letter-spacing:-.005em;white-space:pre-wrap}
.acc-content p:first-child::first-letter{font-size:2.4em;font-weight:700;color:var(--gold);float:left;line-height:.82;margin:.06em .1em 0 0}
.typing-cursor{display:inline-block;width:2px;height:.9em;background:var(--gold);margin-left:2px;vertical-align:text-bottom;animation:blink .7s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

/* ══ 추가질문 STEP 5 ══ */
.chat-page{width:100%;max-width:500px;display:flex;flex-direction:column;min-height:100vh;animation:fadeUp .5s ease}
.chat-page-header{padding:var(--sp3) var(--sp3) var(--sp2);border-bottom:1px solid var(--line);background:var(--bg1)}
.chat-page-title{font-size:var(--lg);font-weight:600;color:var(--t1);margin-bottom:4px}
.chat-page-sub{font-size:var(--xs);color:var(--t3)}
.chat-limit-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--goldf);border:1px solid var(--acc);border-radius:50px;font-size:var(--xs);color:var(--gold);margin-top:8px}
.chat-history{flex:1;padding:var(--sp2) var(--sp3);display:flex;flex-direction:column;gap:var(--sp3);overflow-y:auto}
.chat-msg{display:flex;flex-direction:column;gap:6px;animation:fadeUp .3s ease}
.chat-msg.user{align-items:flex-end}
.chat-msg.ai{align-items:flex-start}
.chat-role{font-size:var(--xs);color:var(--t4);padding:0 4px}
.chat-bubble{max-width:88%;padding:var(--sp2) var(--sp3);border-radius:var(--r2);font-size:var(--sm);line-height:2.1;letter-spacing:-.005em}
.chat-msg.ai .chat-bubble{background:var(--bg2);border:1px solid var(--line);border-bottom-left-radius:4px;color:var(--t1);white-space:pre-wrap}
.chat-msg.user .chat-bubble{background:var(--bg3);border:1px solid var(--line);border-bottom-right-radius:4px;color:var(--t1)}
.chat-bubble-actions{display:flex;justify-content:flex-end;margin-top:4px}
.typing-dots{display:flex;gap:4px;padding:10px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2) var(--r2) var(--r2) 4px;width:fit-content}
.typing-dots span{width:6px;height:6px;border-radius:50%;background:var(--t4);animation:dot 1.2s infinite}
.typing-dots span:nth-child(2){animation-delay:.2s}.typing-dots span:nth-child(3){animation-delay:.4s}
@keyframes dot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}
.chat-sugg-wrap{padding:var(--sp1) var(--sp3);display:flex;gap:5px;flex-wrap:wrap;border-top:1px solid var(--line)}
.sugg-btn{padding:6px 12px;background:transparent;border:1px solid var(--line);border-radius:50px;color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer;white-space:nowrap;transition:all .2s}
.sugg-btn:hover{border-color:var(--acc);color:var(--gold);background:var(--goldf)}
.chat-input-area{padding:var(--sp2) var(--sp3);border-top:1px solid var(--line);background:var(--bg1)}
.chat-inp-row{display:flex;gap:8px}
.chat-inp{flex:1;padding:11px 16px;background:var(--bg2);border:1px solid var(--line);border-radius:50px;color:var(--t1);font-size:var(--sm);font-family:var(--ff);transition:border-color .2s}
.chat-inp:focus{outline:none;border-color:var(--acc)}.chat-inp::placeholder{color:var(--t4)}.chat-inp:disabled{opacity:.4}
.chat-send{width:40px;height:40px;border-radius:50%;border:none;background:var(--gold);color:#0D0B14;font-size:.85rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform .15s,opacity .15s}
.chat-send:hover{opacity:.85}.chat-send:active{transform:scale(.93)}.chat-send:disabled{opacity:.3;cursor:not-allowed}

/* ══ 결과 액션 ══ */
.res-actions{padding:var(--sp3);border-top:1px solid var(--line)}
.upsell{padding:var(--sp2) var(--sp3);background:var(--golds);border:1px solid var(--acc);border-radius:var(--r2);text-align:center;margin-bottom:var(--sp2)}
.up-t{font-size:var(--sm);font-weight:600;color:var(--gold);margin-bottom:4px}
.up-d{font-size:var(--xs);color:var(--t3);margin-bottom:var(--sp2);line-height:1.75}
.up-btn{width:100%;padding:11px;border:1px solid var(--gold);border-radius:var(--r1);background:transparent;color:var(--gold);font-size:var(--sm);font-weight:600;font-family:var(--ff);cursor:pointer;transition:all .2s}
.up-btn:hover{background:var(--goldf)}.up-btn:disabled{opacity:.4;cursor:not-allowed}
.chat-cta{width:100%;padding:13px;border:none;border-radius:var(--r1);background:linear-gradient(135deg,rgba(232,176,72,.15),rgba(232,176,72,.05));border:1px solid var(--acc);color:var(--gold);font-size:var(--sm);font-weight:600;font-family:var(--ff);cursor:pointer;transition:all .2s;margin-bottom:var(--sp2);display:flex;align-items:center;justify-content:center;gap:8px}
.chat-cta:hover{background:var(--goldf)}.chat-cta:disabled{opacity:.4;cursor:not-allowed}
.res-btns{display:flex;gap:6px;flex-wrap:wrap}
.res-btn{flex:1;min-width:70px;padding:9px 6px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:all .2s}
.res-btn:hover{border-color:var(--acc);color:var(--gold)}.res-btn:active{transform:scale(.96)}

/* ══ REPORT STEP 6 ══ */
.report-page{width:100%;max-width:500px;animation:fadeUp .5s ease}
.report-header{text-align:center;padding:var(--sp4) var(--sp3) var(--sp3)}
.report-date{font-size:var(--xs);color:var(--t4);letter-spacing:.12em;margin-bottom:8px}
.report-title{font-size:var(--xl);font-weight:700;color:var(--gold);margin-bottom:6px;line-height:1.2}
.report-name{font-size:var(--sm);color:var(--t3)}
.report-content{padding:0 var(--sp3) var(--sp5)}
.report-text{font-size:var(--sm);color:var(--t2);line-height:2.2;letter-spacing:-.005em;white-space:pre-wrap}
.report-text p:first-child::first-letter{font-size:2.4em;font-weight:700;color:var(--gold);float:left;line-height:.82;margin:.06em .1em 0 0}
.report-skip{display:flex;justify-content:center;margin:var(--sp3) 0}
.report-skip-btn{padding:8px 20px;border-radius:50px;border:1px solid var(--acc);background:transparent;color:var(--gold);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:background .2s}
.report-skip-btn:hover{background:var(--goldf)}


/* ══ 피드백 ══ */
.fb-wrap{display:flex;align-items:center;gap:8px;justify-content:center;padding:var(--sp2) 0;border-top:1px solid var(--line);margin-top:var(--sp1)}
.fb-label{font-size:var(--xs);color:var(--t4)}
.fb-btn{width:32px;height:32px;border-radius:50%;border:1px solid var(--line);background:transparent;font-size:.85rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.fb-btn:hover{border-color:var(--gold);transform:scale(1.1)}
.fb-btn.selected{background:var(--goldf);border-color:var(--gold)}
.fb-done{font-size:var(--xs);color:var(--gold);animation:fadeUp .3s ease}

/* ══ 공유 카드 ══ */
.share-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;border:1px solid var(--line);background:transparent;color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:all .2s}
.share-btn:hover{border-color:var(--acc);color:var(--gold);background:var(--goldf)}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.hint{font-size:var(--xs);color:var(--t4)}
`;

// ═══════════════════════════════════════════════════════════
//  🌌 별 캔버스
// ═══════════════════════════════════════════════════════════
function StarCanvas({isDark}){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext('2d');let raf;
    const stars=Array.from({length:90},()=>({
      x:Math.random(),y:Math.random(),
      r:Math.random()*1.3+.15,
      a:Math.random()*.6+.05,
      da:(Math.random()-.5)*.003,
    }));
    const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    resize();
    window.addEventListener('resize',resize);
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height);
      stars.forEach(s=>{
        s.a=Math.max(.04,Math.min(.65,s.a+s.da));
        if(s.a<=.04||s.a>=.65)s.da*=-1;
        ctx.beginPath();ctx.arc(s.x*c.width,s.y*c.height,s.r,0,Math.PI*2);
        ctx.fillStyle=isDark?`rgba(255,255,255,${s.a})`:`rgba(160,140,90,${s.a*.35})`;
        ctx.fill();
      });
      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[isDark]);
  return <canvas ref={ref} className="bg-canvas"/>;
}

// ═══════════════════════════════════════════════════════════
//  Skeleton 로더
// ═══════════════════════════════════════════════════════════
function SkeletonLoader({qCount}){
  const[si,setSi]=useState(0);
  useEffect(()=>{const id=setInterval(()=>setSi(p=>(p+1)%LOAD_STATES.length),2000);return()=>clearInterval(id);},[]);
  return(
    <div className="loading-page">
      <div className="skel-header">
        <div className="skel-av"/>
        <div className="skel-lines"><div className="skel-line w60"/><div className="skel-line w40"/></div>
      </div>
      <div className="skel-body">
        {Array.from({length:Math.min(qCount,2)}).map((_,i)=>(
          <div key={i} className="skel-para">
            <div className="skel-line full"/><div className="skel-line full"/><div className="skel-line w80"/>
            <div className="skel-line full"/><div className="skel-line w55"/>
          </div>
        ))}
      </div>
      <div className="skel-status" key={si}>
        <div>{LOAD_STATES[si].t}</div>
        <div className="skel-status-sub">{LOAD_STATES[si].s}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  단어 단위 타이핑 훅
// ═══════════════════════════════════════════════════════════
function useWordTyping(text, active, speed=130){
  const[shown,setShown]=useState('');
  const[done,setDone]=useState(false);
  const timerRef=useRef(null);

  useEffect(()=>{
    // active=false일 때 즉시 세팅 금지 — AccItem에서 직접 처리
    if(!active||!text) return;
    setShown('');setDone(false);
    const words=text.split(/(\s+)/);
    let idx=0;
    const tick=()=>{
      if(idx>=words.length){setDone(true);return;}
      idx++;
      setShown(words.slice(0,idx).join(''));
      timerRef.current=setTimeout(tick,speed);
    };
    timerRef.current=setTimeout(tick,speed);
    return()=>clearTimeout(timerRef.current);
  },[text,active,speed]);

  const skipToEnd=useCallback(()=>{
    clearTimeout(timerRef.current);
    setShown(text);setDone(true);
  },[text]);

  return{shown,done,skipToEnd};
}

// ═══════════════════════════════════════════════════════════
//  👍👎 피드백 버튼
// ═══════════════════════════════════════════════════════════
function FeedbackBtn({qIdx}){
  const[sel,setSel]=useState(null);
  if(sel!==null) return <div className="fb-wrap"><span className="fb-done">✦ 고마워요!</span></div>;
  return(
    <div className="fb-wrap">
      <span className="fb-label">이 이야기가 도움이 됐나요?</span>
      <button className="fb-btn" onClick={()=>setSel('up')}>👍</button>
      <button className="fb-btn" onClick={()=>setSel('down')}>👎</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  아코디언 아이템 (typedSet으로 재오픈 방지)
// ═══════════════════════════════════════════════════════════
function AccItem({q,text,idx,isOpen,onToggle,shouldType,onTypingDone}){
  // shouldType=false → 이미 완료된 항목, text 바로 표시
  // shouldType=true + isOpen=false → 아직 열리지 않은 항목, 빈 상태 유지 (즉시 세팅 금지)
  // shouldType=true + isOpen=true  → 타이핑 시작
  const isTyping = shouldType && isOpen;
  const{shown,done,skipToEnd}=useWordTyping(text, isTyping, 130);

  // 표시할 텍스트 결정
  const display = !shouldType ? text   // 이미 완료 → 전체
                : isOpen      ? shown  // 열려있음 → 타이핑 진행 중
                :               '';   // 아직 안 열림 → 비워둠

  const isDone = !shouldType || done;

  useEffect(()=>{if(done&&shouldType)onTypingDone(idx);},[done,shouldType,idx,onTypingDone]);

  return(
    <div className="acc-item">
      <button className={`acc-trigger${isOpen?' open':''}`} onClick={onToggle}>
        <div className="acc-q-wrap">
          <div className="acc-q-num">Q{idx+1}</div>
          <div className="acc-q-text">{q}</div>
        </div>
        <div className="acc-right">
          {isOpen&&!isDone&&<button className="skip-btn" onClick={e=>{e.stopPropagation();skipToEnd();}}>바로 보기</button>}
          <span className={`acc-chevron${isOpen?' open':''}`}>▼</span>
        </div>
      </button>
      <div className={`acc-body${isOpen?' open':' closed'}`}>
        <div className="acc-content">
          <p>{display}{isOpen&&!isDone&&<span className="typing-cursor"/>}</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  채팅 AI 버블 (타이핑 + 바로보기)
// ═══════════════════════════════════════════════════════════
function ChatBubble({text,isNew}){
  const{shown,done,skipToEnd}=useWordTyping(text,isNew,40);
  const display=isNew?shown:text;
  const isDone=!isNew||done;
  return(
    <div>
      <div className="chat-bubble">{display}{!isDone&&<span className="typing-cursor"/>}</div>
      {!isDone&&(
        <div className="chat-bubble-actions">
          <button className="skip-btn" onClick={skipToEnd}>바로 보기</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  리포트 타이핑
// ═══════════════════════════════════════════════════════════
function ReportBody({text}){
  const{shown,done,skipToEnd}=useWordTyping(text,true,35);
  return(
    <div className="report-content">
      {!done&&(
        <div className="report-skip">
          <button className="report-skip-btn" onClick={skipToEnd}>바로 보기 ✦</button>
        </div>
      )}
      <div className="report-text">
        <p>{shown}{!done&&<span className="typing-cursor"/>}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  🏠 메인 앱
// ═══════════════════════════════════════════════════════════
export default function App(){
  const[isDark,setIsDark]=useState(true);
  const[step,setStep]=useState(0); // 0랜딩 1입력 2질문 3로딩 4결과 5채팅 6리포트
  const[form,setForm]=useState({name:'',by:'',bm:'',bd:'',bh:'',gender:'',noTime:false});
  const[cat,setCat]=useState(0);
  const[selQs,setSelQs]=useState([]);
  const[diy,setDiy]=useState('');
  const[pkg,setPkg]=useState('star');
  const[answers,setAnswers]=useState([]);
  const[openAcc,setOpenAcc]=useState(0);
  const[typedSet,setTypedSet]=useState(new Set()); // 타이핑 완료된 idx 추적
  // 채팅
  const[chatHistory,setChatHistory]=useState([]);
  const[chatInput,setChatInput]=useState('');
  const[chatLoading,setChatLoading]=useState(false);
  const[chatUsed,setChatUsed]=useState(0);
  const[latestChatIdx,setLatestChatIdx]=useState(-1);
  // 리포트
  const[reportText,setReportText]=useState('');
  const[reportLoading,setReportLoading]=useState(false);
  const chatEndRef=useRef(null);
  const today=useMemo(()=>getTodayInfo(),[]);

  useEffect(()=>{document.documentElement.setAttribute('data-theme',isDark?'dark':'light');},[isDark]);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[chatHistory,chatLoading]);

  const saju=useMemo(()=>(form.by&&form.bm&&form.bd)?getSaju(+form.by,+form.bm,+form.bd,form.noTime?12:+(form.bh||12)):null,[form]);
  const sun=useMemo(()=>(form.bm&&form.bd)?getSun(+form.bm,+form.bd):null,[form.bm,form.bd]);
  const moon=useMemo(()=>(form.by&&form.bm&&form.bd)?getMoon(+form.by,+form.bm,+form.bd):null,[form.by,form.bm,form.bd]);
  const asc=useMemo(()=>(!form.noTime&&form.bh&&form.bm)?getAsc(+form.bh,+form.bm):null,[form]);
  const age=form.by?today.year-+form.by:0;
  const formOk=form.by&&form.bm&&form.bd&&form.gender&&(form.noTime||form.bh);
  const curPkg=PKGS.find(p=>p.id===pkg)||PKGS[2];
  const maxQ=curPkg.q,maxChat=curPkg.chat,chatLeft=maxChat-chatUsed;

  const addQ=q=>{if(selQs.length<maxQ&&!selQs.includes(q)){setSelQs(p=>[...p,q]);setDiy('');}};
  const rmQ=i=>setSelQs(p=>p.filter((_,x)=>x!==i));

  // 통합 컨텍스트 빌더
  // 사용자 컨텍스트 (서버로 전달)
  const buildCtx=useCallback(()=>{
    let c=`[${form.name||'고객님'} · ${age}세 · ${form.gender}]\n\n`;
    if(saju){
      c+=`[사주 기운]\n`;
      c+=`연주: ${saju.yeon.g}${saju.yeon.j} / 월주: ${saju.wol.g}${saju.wol.j} / 일주: ${saju.il.g}${saju.il.j} / 시주: ${saju.si.g}${saju.si.j}\n`;
      c+=`타고난 기질: ${saju.ilganDesc}\n`;
      c+=`강한 기운: ${ON[saju.dom]} / 약한 기운: ${ON[saju.lac]}\n\n`;
    }
    if(sun){
      c+=`[별자리 기운]\n`;
      c+=`태양: ${sun.n}(${sun.s}) — ${sun.desc}\n`;
      if(moon)c+=`달: ${moon.n}(${moon.s}) — ${moon.desc}\n`;
      if(asc)c+=`상승: ${asc.n}(${asc.s}) — ${asc.desc}\n`;
    }
    return c;
  },[form,saju,sun,moon,asc,age]);

  // API 공통 헬퍼 (프롬프트는 서버 ask.js에서 관리)
  const callApi=useCallback(async(userMessage,opts={})=>{
    const res=await fetch('/api/ask',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        userMessage,
        context:buildCtx(),
        isChat:opts.isChat||false,
        isReport:opts.isReport||false,
      }),
    });
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'API 오류');
    return stripMarkdown(data.text||'');
  },[buildCtx]);

  // ── 공유 이미지 생성 (canvas) ──
  const shareCard=useCallback((idx)=>{
    const q=selQs[idx]||'';
    const text=answers[idx]||'';
    const preview=text.slice(0,120)+'…';
    const canvas=document.createElement('canvas');
    canvas.width=900;canvas.height=520;
    const ctx=canvas.getContext('2d');
    const bg=isDark?'#0D0B14':'#F7F4EF';
    const t1=isDark?'#F0EBF8':'#1A1420';
    const t3=isDark?'#8A7FA0':'#8A7FA0';
    const gold='#E8B048';
    // 배경
    ctx.fillStyle=bg;ctx.fillRect(0,0,900,520);
    // 상단 골드 라인
    ctx.fillStyle=gold;ctx.fillRect(0,0,900,3);
    // 워터마크
    ctx.font='500 22px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=gold;ctx.letterSpacing='0.3em';
    ctx.fillText('byeolsoom  ✦',48,56);
    // 날짜
    ctx.font='400 16px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=t3;
    ctx.fillText(`${today.month}월 ${today.day}일의 이야기`,48,88);
    // 질문
    ctx.font='600 20px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=t1;
    ctx.fillText(q.length>36?q.slice(0,36)+'…':q,48,148);
    // 본문 미리보기
    ctx.font='300 17px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=t3;
    const words=preview.split('');
    let line='',y=200,lineH=32;
    for(const ch of words){
      const test=line+ch;
      if(ctx.measureText(test).width>800){
        ctx.fillText(line,48,y);y+=lineH;line=ch;
        if(y>360){ctx.fillText(line+'…',48,y);line='';break;}
      } else line=test;
    }
    if(line)ctx.fillText(line,48,y);
    // 별자리 칩
    const chips=[];
    if(sun)chips.push(sun.s+' '+sun.n);
    if(saju)chips.push('✦ '+['목','화','토','금','수'][['목','화','토','금','수'].indexOf(saju.dom[0])||0]||'✦');
    ctx.font='500 15px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=gold;
    chips.slice(0,2).forEach((chip,i)=>{
      const w=ctx.measureText(chip).width+24;
      const x=48+i*(w+10);
      ctx.strokeStyle='rgba(232,176,72,0.3)';
      ctx.lineWidth=1;
      ctx.beginPath();ctx.roundRect(x,400,w,30,15);ctx.stroke();
      ctx.fillText(chip,x+12,420);
    });
    // 하단 카피
    ctx.font='400 14px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=t3;
    ctx.fillText('✦ 별숨이 전하는 오늘의 이야기',48,480);
    // 다운로드
    const a=document.createElement('a');
    a.download=`byeolsoom_${today.month}${today.day}.png`;
    a.href=canvas.toDataURL('image/png');
    a.click();
  },[selQs,answers,isDark,today,sun,saju]);

  // 메인 API 호출 — 병렬 처리 (순차 타임아웃 방지)
  const askClaude=async()=>{
    if(!selQs.length)return;
    setStep(3);setAnswers([]);setTypedSet(new Set());setOpenAcc(0);

    // 모든 질문을 동시에 호출 (순차 시 Vercel 30초 타임아웃 위험)
    const results=await Promise.allSettled(
      selQs.map(q=>callApi(`[질문]\n${q}`))
    );

    const newAnswers=results.map((r,i)=>
      r.status==='fulfilled'
        ? r.value
        : `Q${i+1} 답변을 불러오지 못했어요 🌙\n잠시 후 다시 시도해봐요.`
    );

    setAnswers(newAnswers);
    setLatestChatIdx(-1);
    setStep(4);setOpenAcc(0);
  };

  const handleTypingDone=useCallback((idx)=>{
    setTypedSet(p=>{const n=new Set(p);n.add(idx);return n;});
    // Q 완료 후 다음 질문 자동 오픈 (있을 경우)
    setOpenAcc(p=>{
      const next=idx+1;
      if(p===idx) return next; // 현재 열린 게 방금 완료된 것이면 다음으로
      return p;
    });
  },[]);

  const handleAccToggle=i=>{setOpenAcc(p=>p===i?-1:i);};

  // 후속 채팅
  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading||chatLeft<=0)return;
    const userMsg=chatInput.trim();setChatInput('');
    setChatHistory(p=>[...p,{role:'user',text:userMsg}]);
    setChatLoading(true);setChatUsed(p=>p+1);
    const prevQAs=selQs.map((q,i)=>`[질문 ${i+1}] ${q}\n[답변] ${answers[i]||''}`).join('\n\n');
    const prevChat=chatHistory.map(m=>`[${m.role==='ai'?'별숨':'나'}] ${m.text}`).join('\n');
    const fullMsg=`[이전 상담]\n${prevQAs}\n\n[이전 대화]\n${prevChat}\n\n[새 질문]\n${userMsg}`;
    try{
      const aiText=await callApi(fullMsg,{isChat:true});
      setChatHistory(p=>{
        const updated=[...p,{role:'ai',text:aiText}];
        setLatestChatIdx(updated.length-1);
        return updated;
      });
    }catch{
      setChatHistory(p=>[...p,{role:'ai',text:'앗, 잠깐 연결이 끊겼어요 🌙 다시 시도해봐요!'}]);
    }finally{setChatLoading(false);}
  };

  // 리포트 생성
  const genReport=async()=>{
    setStep(6);setReportText('');setReportLoading(true);
    try{
      const text=await callApi('[요청] 이번 달 종합 운세 리포트',{isReport:true});
      setReportText(text);
    }catch{setReportText('별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!');}
    finally{setReportLoading(false);}
  };

  // ── 렌더 ──
  return(
    <>
      <style>{CSS}</style>
      <StarCanvas isDark={isDark}/>
      <button className="theme-btn" onClick={()=>setIsDark(p=>!p)}>{isDark?'☀':'◑'}</button>
      {step>0&&step<5&&<button className="back-btn" onClick={()=>setStep(p=>Math.max(0,p-1))}>←</button>}
      {(step===5||step===6)&&<button className="back-btn" onClick={()=>setStep(4)}>←</button>}

      <div className="app">

        {/* ══ 0 랜딩 ══ */}
        {step===0&&(
          <div className="page">
            <div className="inner land">
              <div className="land-wordmark">byeolsoom</div>
              <div className="land-orb">
                <div className="orb-core"/><div className="orb-r1"/><div className="orb-r2"/>
              </div>
              <p className="land-copy">오늘 밤,<br/><em>당신의 별이 기다리고 있어요.</em></p>
              <p className="land-sub">동양의 별과 서양의 별이 함께<br/>당신의 이야기를 읽어드릴게요</p>
              <button className="cta-main" onClick={()=>setStep(1)}>지금 시작하기 ✦</button>
              <div className="land-trust">
                <span>★★★★★ 4.9</span><span>·</span>
                <span>32,841명</span><span>·</span>
                <span>무료 체험 가능</span>
              </div>
              <div className="rev-wrap">
                <div className="rev-track">
                  {REVIEWS.map((r,i)=>(
                    <div key={i} className="rev-card">
                      <div className="rev-stars">{r.star}</div>
                      <div className="rev-text">"{r.text}"</div>
                      <div className="rev-nick">{r.nick}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ 1 정보 입력 ══ */}
        {step===1&&(
          <div className="page">
            <div className="inner">
              <div className="step-dots">
                {[0,1,2].map(i=><div key={i} className={`dot ${i===0?'active':'todo'}`}/>)}
              </div>
              <div className="card">
                <div className="card-title">반가워요 🌙</div>
                <div className="card-sub">생년월일만 있으면 사주와 별자리를 함께 읽어드릴게요</div>

                <label className="lbl">이름 (선택)</label>
                <input className="inp" placeholder="뭐라고 불러드릴까요?" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>

                <label className="lbl">생년월일</label>
                <div className="row" style={{marginBottom:'var(--sp3)'}}>
                  <div className="col"><input className="inp" placeholder="1998" maxLength={4} value={form.by} onChange={e=>setForm(f=>({...f,by:e.target.value.replace(/\D/,'')}))} style={{marginBottom:0}}/></div>
                  <div className="col"><select className="inp" value={form.bm} onChange={e=>setForm(f=>({...f,bm:e.target.value}))} style={{marginBottom:0}}><option value="">월</option>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}</select></div>
                  <div className="col"><select className="inp" value={form.bd} onChange={e=>setForm(f=>({...f,bd:e.target.value}))} style={{marginBottom:0}}><option value="">일</option>{[...Array(31)].map((_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}</select></div>
                </div>

                <div className="toggle-row" onClick={()=>setForm(f=>({...f,noTime:!f.noTime,bh:''}))}>
                  <button className={`toggle ${form.noTime?'on':'off'}`} onClick={e=>e.stopPropagation()}/>
                  <span className="toggle-label">태어난 시간을 몰라요</span>
                </div>
                {!form.noTime&&(
                  <>
                    <label className="lbl">태어난 시각</label>
                    <select className="inp" value={form.bh} onChange={e=>setForm(f=>({...f,bh:e.target.value}))}>
                      <option value="">시각 선택</option>
                      {[...Array(24)].map((_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00 ~ {String(i+1).padStart(2,'0')}:00</option>)}
                    </select>
                  </>
                )}

                <label className="lbl">성별</label>
                <div className="gender-group">
                  {['여성','남성','기타'].map(g=>(
                    <button key={g} className={`gbtn ${form.gender===g?'on':''}`} onClick={()=>setForm(f=>({...f,gender:g}))}>{g}</button>
                  ))}
                </div>

                {/* 사주+점성술 통합 미리보기 */}
                {saju&&(
                  <div className="pillars-wrap">
                    <div className="pillars-hint"><span style={{color:'var(--gold)'}}>✦</span> 사주 원국</div>
                    <div className="pillars">
                      {[['연','yeon'],['월','wol'],['일','il'],['시','si']].map(([l,k])=>(
                        <div key={l} className="pillar">
                          <div className="p-lbl">{l}주</div>
                          <div className="p-hj">{saju[k].gh}</div>
                          <div className="p-hj">{saju[k].jh}</div>
                          <div className="p-kr">{saju[k].g}{saju[k].j}</div>
                        </div>
                      ))}
                    </div>
                    <div className="oh-bar">
                      {Object.entries(saju.or).map(([k,v])=>v>0&&<div key={k} className="oh-seg" style={{flex:v,background:OC[k]}}/>)}
                    </div>
                    <div className="oh-tags">
                      {Object.entries(saju.or).map(([k,v])=>v>0&&(
                        <span key={k} className="oh-tag" style={{background:`${OC[k]}18`,color:OC[k],border:`1px solid ${OC[k]}28`}}>{OE[k]} {ON[k]} {v}</span>
                      ))}
                    </div>
                    <div className="il-preview">{saju.ilganDesc}</div>
                  </div>
                )}
                {sun&&(
                  <div className="astro-preview">
                    <div className="a-chip">{sun.s} {sun.n}</div>
                    {moon&&<div className="a-chip">🌙 달 {moon.n}</div>}
                    {asc&&<div className="a-chip">↑ 상승 {asc.n}</div>}
                  </div>
                )}

                <button className="btn-main" disabled={!formOk} onClick={()=>{setSelQs([]);setStep(2);}}>다음 단계 →</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ 2 질문 선택 ══ */}
        {step===2&&(
          <div className="page">
            <div className="inner">
              <div className="step-dots">
                {[0,1,2].map(i=><div key={i} className={`dot ${i<1?'done':i===1?'active':'todo'}`}/>)}
              </div>
              <div className="q-shell">
                <div className="combo-banner">
                  <div className="combo-title">✦ 사주 × 별자리 통합 분석</div>
                  <div className="combo-sub">동양과 서양의 별이 함께 당신의 이야기를 읽어요<br/>
                    {saju&&sun&&`${ON[saju.dom]} 기운의 ${sun.n} · 달 ${moon?.n||''}`}
                  </div>
                </div>

                <div className="cat-tabs">
                  {CATS.map((c,i)=><button key={c.id} className={`cat-tab ${cat===i?'on':''}`} onClick={()=>setCat(i)}>{c.icon} {c.label}</button>)}
                </div>

                <div className="q-list">
                  {CATS[cat].qs.map((q,i)=>{
                    const on=selQs.includes(q);
                    return<button key={i} className={`q-item ${on?'on':''}`} disabled={!on&&selQs.length>=maxQ} onClick={()=>on?rmQ(selQs.indexOf(q)):addQ(q)}>{q}</button>;
                  })}
                </div>

                <div className="diy-wrap">
                  <textarea className="diy-inp" placeholder="직접 물어보고 싶은 게 있어요? 자유롭게 써봐요 🌙" maxLength={200} value={diy} onChange={e=>setDiy(e.target.value)}/>
                  <div className="diy-row">
                    <span className="hint">{diy.length}/200</span>
                    {diy.trim()&&selQs.length<maxQ&&<button className="diy-add" onClick={()=>addQ(diy.trim())}>+ 추가</button>}
                  </div>
                </div>

                {selQs.length>0&&(
                  <div className="sel-qs">
                    <div className="sel-lbl">선택한 질문 ({selQs.length}/{maxQ})</div>
                    {selQs.map((q,i)=>(
                      <div key={i} className="sel-item">
                        <span className="sel-n">{i+1}</span>
                        <span className="sel-t">{q}</span>
                        <button className="sel-del" onClick={()=>rmQ(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pkg-sec">
                  <div className="pkg-lbl">이용권 선택</div>
                  <div className="pkgs">
                    {PKGS.map(p=>(
                      <div key={p.id} className={`pkg ${pkg===p.id?'chosen':''}`} onClick={()=>{setPkg(p.id);if(selQs.length>p.q)setSelQs(s=>s.slice(0,p.q));}}>
                        {p.hot&&<div className="pkg-hot">BEST</div>}
                        <div className="pkg-e">{p.e}</div>
                        <div className="pkg-n">{p.n}</div>
                        <div className="pkg-p">{p.p}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="q-stat">
                  {selQs.length===0&&'질문을 하나 이상 골라봐요'}
                  {selQs.length>0&&selQs.length<maxQ&&<><strong>{maxQ-selQs.length}개</strong> 더 고를 수 있어요</>}
                  {selQs.length===maxQ&&<><strong>준비 완료!</strong> 두 별이 읽어드릴게요 🌟</>}
                </div>
                <div className="free-note">지금은 <span>무료로 체험</span>할 수 있어요</div>
                <button className="btn-main" disabled={!selQs.length} onClick={askClaude}>
                  {selQs.length===0?'질문을 먼저 골라봐요':`✦ 두 별에게 물어보기 (${selQs.length}개)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ 3 로딩 ══ */}
        {step===3&&<div className="page"><SkeletonLoader qCount={selQs.length}/></div>}

        {/* ══ 4 결과 ══ */}
        {step===4&&(
          <div className="page">
            <div className="res-wrap">
              <div className="res-card">
                {/* 헤더 */}
                <div className="res-header">
                  <div className="res-av">✦</div>
                  <div>
                    <div className="res-name">{form.name||'당신'}님께 보내는 별의 메시지</div>
                    <div className="res-chips">
                      {saju&&<div className="res-chip">🀄 {ON[saju.dom]} 기운</div>}
                      {sun&&<div className="res-chip">{sun.s} {sun.n}</div>}
                      {moon&&<div className="res-chip">🌙 달 {moon.n}</div>}
                      {asc&&<div className="res-chip">↑ {asc.n}</div>}
                      <div className="res-chip">📅 {today.month}월 {today.day}일</div>
                    </div>
                  </div>
                </div>

                {/* 아코디언 */}
                {selQs.map((q,i)=>(
                  <div key={i}>
                    <AccItem
                      q={q} text={answers[i]||''} idx={i}
                      isOpen={openAcc===i}
                      onToggle={()=>handleAccToggle(i)}
                      shouldType={!typedSet.has(i)}
                      onTypingDone={handleTypingDone}
                    />
                    {/* Q 완료 후 피드백 + 공유 */}
                    {openAcc===i&&typedSet.has(i)&&answers[i]&&(
                      <div style={{padding:'0 var(--sp3) var(--sp2)',borderBottom:'1px solid var(--line)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <FeedbackBtn qIdx={i}/>
                          <button className="share-btn" onClick={()=>shareCard(i)}>
                            ↗ 이미지 저장
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* 액션 */}
                <div className="res-actions">
                  <div className="upsell">
                    <div className="up-t">✦ 이번 달 전체 운세가 궁금해요</div>
                    <div className="up-d">연애 · 재물 · 건강 · 직업 종합 분석<br/>사주와 별자리가 함께 쓴 월간 에세이</div>
                    <button className="up-btn" onClick={genReport}>월간 리포트 받기</button>
                  </div>
                  {maxChat>0&&(
                    <button className="chat-cta" onClick={()=>setStep(5)} disabled={chatLeft<=0}>
                      💬 더 물어보기
                      <span style={{fontSize:'var(--xs)',color:'var(--t4)'}}>남은 횟수 {chatLeft}회</span>
                    </button>
                  )}
                  <div className="res-btns">
                    <button className="res-btn" onClick={()=>{setSelQs([]);setDiy('');setChatHistory([]);setChatUsed(0);setStep(2);}}>다른 질문</button>
                    <button className="res-btn" onClick={()=>{navigator.clipboard?.writeText(answers.join('\n\n'));alert('복사됐어요 📋');}}>복사하기</button>
                    <button className="res-btn" onClick={()=>{setStep(0);setForm({name:'',by:'',bm:'',bd:'',bh:'',gender:'',noTime:false});setSelQs([]);setAnswers([]);setChatHistory([]);setChatUsed(0);setTypedSet(new Set());}}>처음으로</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ 5 추가 질문 (전체화면 채팅) ══ */}
        {step===5&&(
          <div className="page-top">
            <div className="chat-page">
              <div className="chat-page-header">
                <div className="chat-page-title">💬 추가 상담</div>
                <div className="chat-page-sub">
                  {selQs.slice(0,2).map((q,i)=><div key={i} style={{marginTop:3}}>Q{i+1}. {q.length>24?q.slice(0,24)+'…':q}</div>)}
                </div>
                <div className="chat-limit-badge">✦ 남은 횟수 {chatLeft}회</div>
              </div>

              <div className="chat-history">
                {chatHistory.length===0&&(
                  <div style={{color:'var(--t4)',fontSize:'var(--xs)',textAlign:'center',padding:'var(--sp3)'}}>
                    더 궁금한 게 있으면 자유롭게 물어봐요 🌙
                  </div>
                )}
                {chatHistory.map((m,i)=>(
                  <div key={i} className={`chat-msg ${m.role}`}>
                    <div className="chat-role">{m.role==='ai'?'✦ 별숨':'나'}</div>
                    {m.role==='ai'
                      ?<ChatBubble text={m.text} isNew={i===latestChatIdx}/>
                      :<div className="chat-bubble">{m.text}</div>
                    }
                  </div>
                ))}
                {chatLoading&&(
                  <div className="chat-msg ai">
                    <div className="chat-role">✦ 별숨</div>
                    <div className="typing-dots"><span/><span/><span/></div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              {chatLeft>0&&!chatLoading&&(
                <div className="chat-sugg-wrap">
                  {CHAT_SUGG.map((s,i)=><button key={i} className="sugg-btn" onClick={()=>setChatInput(s)}>{s}</button>)}
                </div>
              )}

              <div className="chat-input-area">
                <div className="chat-inp-row">
                  <input className="chat-inp"
                    placeholder={chatLeft>0?'더 궁금한 게 있어요? 🌙':'채팅 횟수를 모두 사용했어요'}
                    value={chatInput}
                    onChange={e=>setChatInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();}}}
                    disabled={chatLeft<=0||chatLoading}/>
                  <button className="chat-send" onClick={sendChat} disabled={!chatInput.trim()||chatLeft<=0||chatLoading}>✦</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ 6 월간 리포트 (전체화면) ══ */}
        {step===6&&(
          <div className="page-top">
            <div className="inner report-page">
              <div className="report-header">
                <div className="report-date">{today.year}년 {today.month}월 · {today.lunar}</div>
                <div className="report-title">{form.name||'당신'}님의<br/>이달의 이야기</div>
                <div className="report-name">사주 × 별자리 통합 운세</div>
              </div>
              {reportLoading?(
                <div style={{textAlign:'center',padding:'var(--sp5)',color:'var(--t3)',fontSize:'var(--sm)'}}>
                  <div style={{fontSize:'2rem',marginBottom:'var(--sp2)'}}>✦</div>
                  두 별이 이달의 이야기를 쓰고 있어요 🌙
                </div>
              ):(
                <ReportBody text={reportText}/>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
