import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════
//  🀄 사주 엔진
// ═══════════════════════════════════════════════
const CG=["갑","을","병","정","무","기","경","신","임","계"];
const JJ=["자","축","인","묘","진","사","오","미","신","유","술","해"];
const CGH=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JJH=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CGO=["목","목","화","화","토","토","금","금","수","수"];
const JJO=["수","토","목","목","토","화","화","토","금","금","토","수"];
const OC={목:"#5FAD7A",화:"#E05A3A",토:"#C08830",금:"#B8A035",수:"#4A8EC4"};
const OE={목:"🌿",화:"🔥",토:"🍂",금:"✦",수:"💧"};
const ON={목:"나무",화:"불",토:"흙",금:"금",수:"물"};
const ILGAN={
  갑:{s:"🌱 선구자",feel:"새로운 길을 먼저 여는 사람이에요. 아무도 가지 않은 방향으로 첫 발을 내딛는 용기가 당신의 가장 큰 힘이에요.",today:"오늘은 내가 먼저 연락해볼까요?"},
  을:{s:"🎋 넝쿨",feel:"겉으로는 조용해 보여도 속엔 누구보다 강한 의지가 있어요. 넝쿨처럼 어떤 환경에서도 자기 길을 찾아요.",today:"작은 변화부터 시작해봐요"},
  병:{s:"☀️ 태양",feel:"당신이 있는 공간이 왠지 따뜻해지는 거, 느낀 적 있나요? 그게 바로 당신이에요.",today:"내 빛을 마음껏 발산해봐요"},
  정:{s:"🕯️ 촛불",feel:"자신을 태워서 주변을 밝혀요. 그 헌신적인 따뜻함이 당신의 가장 큰 매력이에요.",today:"나를 위한 시간도 꼭 가져봐요"},
  무:{s:"🌍 대지",feel:"어수선한 상황에서 옆에 있으면 왠지 마음이 놓이는 사람이에요. 그 든든함이 당신이에요.",today:"천천히, 하지만 확실하게"},
  기:{s:"🌸 정원",feel:"사람들 사이의 조화를 만드는 능력, 그거 아무나 못 하는데 당신은 자연스럽게 해요.",today:"오늘은 나를 좀 더 챙겨줄게요"},
  경:{s:"⚔️ 검",feel:"한 번 마음먹으면 끝까지 가는 사람, 때론 외롭지만 그 뚝심이 가장 멋진 모습이에요.",today:"내 기준을 믿어봐요"},
  신:{s:"💎 보석",feel:"세상을 아주 선명하게 보는 눈을 가졌어요. 그 예리한 감각이 당신의 강점이에요.",today:"완벽하지 않아도 충분히 빛나요"},
  임:{s:"🌊 강",feel:"말 많이 안 해도 느낌으로 다 아는 그 직관력, 주변 사람들이 다 느끼고 있어요.",today:"마음 가는 대로 흘러가봐요"},
  계:{s:"🌧️ 이슬",feel:"남들이 못 느끼는 걸 먼저 느끼는 사람이에요. 그 섬세함이 당신의 가장 큰 재능이에요.",today:"내 감정에 솔직해져봐요"},
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
  return{yeon:{g:CG[yg],j:JJ[yj],gh:CGH[yg],jh:JJH[yj]},wol:{g:CG[wg],j:JJ[wj],gh:CGH[wg],jh:JJH[wj]},il:{g:CG[ig],j:JJ[ij],gh:CGH[ig],jh:JJH[ij]},si:{g:CG[sg],j:JJ[si%12],gh:CGH[sg],jh:JJH[si%12]},ilgan:CG[ig],or,dom,lac};
}

// ═══════════════════════════════════════════════
//  ♈ 점성술 엔진
// ═══════════════════════════════════════════════
const SIGNS=[
  {n:"양자리",s:"♈",sm:3,sd:21,em:4,ed:19,feel:"뭔가 새로운 걸 시작하고 싶을 때 가장 빛나는 사람이에요",today:"망설이지 말고 일단 해봐요"},
  {n:"황소자리",s:"♉",sm:4,sd:20,em:5,ed:20,feel:"한 번 마음을 열면 세상 누구보다 깊이 사랑하는 사람이에요",today:"나를 위한 소소한 사치를 허락해줘요"},
  {n:"쌍둥이자리",s:"♊",sm:5,sd:21,em:6,ed:20,feel:"어떤 상황에서도 재미를 찾아내는 특별한 능력이 있어요",today:"새로운 사람을 만나봐요"},
  {n:"게자리",s:"♋",sm:6,sd:21,em:7,ed:22,feel:"한 번 소중하다고 생각한 사람은 끝까지 지키려는 마음이 있어요",today:"나를 먼저 돌봐줘요"},
  {n:"사자자리",s:"♌",sm:7,sd:23,em:8,ed:22,feel:"주목받을 때 가장 빛나는 사람, 그리고 그럴 자격이 충분해요",today:"내 매력을 마음껏 발산해봐요"},
  {n:"처녀자리",s:"♍",sm:8,sd:23,em:9,ed:22,feel:"남들이 그냥 지나치는 것도 꼼꼼하게 챙기는 사람이에요",today:"'이 정도면 됐어'를 연습해봐요"},
  {n:"천칭자리",s:"♎",sm:9,sd:23,em:10,ed:22,feel:"사람들 사이에서 균형을 맞춰주는, 없어서는 안 될 사람이에요",today:"내 마음대로 골라봐요"},
  {n:"전갈자리",s:"♏",sm:10,sd:23,em:11,ed:21,feel:"표면 아래의 진짜를 보는 눈, 그게 당신의 가장 큰 무기예요",today:"놓아주는 연습을 해봐요"},
  {n:"사수자리",s:"♐",sm:11,sd:22,em:12,ed:21,feel:"어디서든 자유롭게 살고 싶은, 그 마음이 당신을 특별하게 만들어요",today:"새로운 곳에 가봐요"},
  {n:"염소자리",s:"♑",sm:12,sd:22,em:1,ed:19,feel:"남들이 포기할 때도 묵묵히 가는 사람, 그게 가장 멋진 모습이에요",today:"잠깐 쉬어가도 돼요"},
  {n:"물병자리",s:"♒",sm:1,sd:20,em:2,ed:18,feel:"아무도 생각 못 한 아이디어를 내는 사람, 당신이 그래요",today:"내 이상한 아이디어를 믿어봐요"},
  {n:"물고기자리",s:"♓",sm:2,sd:19,em:3,ed:20,feel:"세상의 아픔을 함께 느끼는, 그 공감 능력이 당신의 가장 큰 선물이에요",today:"내 꿈에 귀 기울여봐요"},
];
function getSun(m,d){for(const z of SIGNS){if(z.sm<=z.em){if((m===z.sm&&d>=z.sd)||(m===z.em&&d<=z.ed)||(m>z.sm&&m<z.em))return z;}else{if((m===z.sm&&d>=z.sd)||(m===z.em&&d<=z.ed)||m>z.sm||m<z.em)return z;}}return SIGNS[0];}
function getMoon(y,m,d){const days=(new Date(y,m-1,d)-new Date(2000,0,1))/86400000;return SIGNS[Math.floor((((days%27.32)+27.32)%27.32/27.32)*12)%12];}
function getAsc(h,m){return SIGNS[(Math.floor(h/2)+m+6)%12];}

// ═══════════════════════════════════════════════
//  데이터
// ═══════════════════════════════════════════════
const CATS=[
  {id:"love",icon:"💕",label:"연애",qs:["요즘 좋아하는 사람이 생겼는데 이 감정이 맞는 건지 모르겠어요","언제쯤 새로운 인연이 찾아올까요?","지금 사귀는 사람이랑 미래가 있을까요?","짝사랑하는 사람이 나를 어떻게 생각할까요?","내가 먼저 고백해도 될까요?"]},
  {id:"work",icon:"💼",label:"일·커리어",qs:["이직을 고민 중인데 지금 타이밍이 맞을까요?","직장 상사 때문에 너무 힘들어요","나에게 진짜 잘 맞는 일이 뭔지 알고 싶어요","승진할 수 있는 운이 있을까요?","창업을 해도 될까요?"]},
  {id:"money",icon:"✦",label:"돈·재물",qs:["올해 돈 들어오는 운이 있을까요?","투자를 시작하기 좋은 시기인가요?","내 집 마련 언제쯤 가능할까요?","부업이나 사이드잡 시작해도 될까요?","돈이 계속 나가는데 언제 안정될까요?"]},
  {id:"health",icon:"🌿",label:"건강",qs:["요즘 너무 피곤한데 기운이 없는 이유가 있을까요?","특히 조심해야 할 건강 부위가 있나요?","스트레스가 너무 심해요","수면의 질을 높이려면 어떻게 해야 할까요?"]},
  {id:"relation",icon:"🫧",label:"인간관계",qs:["주변에 나한테 안 좋은 사람이 있는 것 같아요","친한 친구랑 사이가 멀어진 것 같아요","새로운 환경에서 잘 적응할 수 있을까요?","직장 동료와의 갈등을 어떻게 풀어야 할까요?"]},
  {id:"future",icon:"🔮",label:"미래·운명",qs:["올해 내 인생에서 가장 중요한 것이 뭔가요?","지금 걷고 있는 방향이 맞는지 불안해요","내가 진짜 잘할 수 있는 게 뭔지 모르겠어요","내 인생의 전환점이 언제쯤 올까요?"]},
];
const PKGS=[
  {id:"seed",e:"✦",n:"씨앗",p:"990원",q:1,chat:0,tag:"맛보기"},
  {id:"moon",e:"🌙",n:"달빛",p:"5,900원",q:3,chat:5,tag:"인기"},
  {id:"star",e:"⭐",n:"별빛",p:"9,900원",q:5,chat:10,tag:"베스트",hot:true},
  {id:"cosmos",e:"🌌",n:"우주",p:"19,900원",q:10,chat:20,tag:"풀패키지"},
];
const REVIEWS=[
  {star:"★★★★★",text:"사주 해석이 소름 돋을 정도로 정확해요. 특히 제 고민을 정확히 짚어줬어요",nick:"가을고양이 · 28세"},
  {star:"★★★★★",text:"베프한테 상담받는 느낌! 이렇게 자세한 운세 앱은 처음이에요",nick:"핑크라떼 · 25세"},
  {star:"★★★★★",text:"후속 채팅 기능이 진짜 유용해요. 궁금한 거 바로 물어볼 수 있어요",nick:"달밤산책 · 31세"},
  {star:"★★★★★",text:"글이 너무 잘 읽혀요. 전문용어 없이 내 얘기처럼 써줘서 좋아요",nick:"별빛소나기 · 26세"},
];
const SUGG=["좀 더 자세히 알고 싶어요","언제쯤 변화가 올까요?","어떻게 행동하면 좋을까요?","지금 당장 할 수 있는 게 뭔가요?"];
const LOAD_STATES=[
  {t:"별이 당신의 이름을 찾고 있어요",s:"잠깐만요 ✦"},
  {t:"태어난 순간의 기운을 불러오는 중이에요",s:"조금만 기다려줘요 🌙"},
  {t:"당신에게 전할 이야기를 고르고 있어요",s:"거의 다 왔어요 ✨"},
];

// ═══════════════════════════════════════════════
//  🎨 CSS
// ═══════════════════════════════════════════════
const CSS=`
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ff:'Pretendard',-apple-system,sans-serif;
  --bg:#0D0B14;--bg1:#13101E;--bg2:#1A1628;--bg3:#221E33;
  --line:rgba(255,255,255,.07);
  --t1:#F0EBF8;--t2:#B8AECE;--t3:#7A6F95;--t4:#4A4260;
  --gold:#E8B048;--gold2:#C89030;
  --goldf:rgba(232,176,72,.12);--golds:rgba(232,176,72,.06);--acc:rgba(232,176,72,.22);
  --sp1:8px;--sp2:16px;--sp3:24px;--sp4:32px;--sp5:48px;
  --r1:12px;--r2:20px;--r3:28px;
  --t-xl:1.75rem;--t-lg:1.125rem;--t-md:0.9375rem;--t-sm:0.8125rem;--t-xs:0.6875rem;
}
[data-theme="light"]{
  --bg:#F7F4EF;--bg1:#FFFFFF;--bg2:#F0EBE2;--bg3:#E8E0D5;
  --line:rgba(0,0,0,.07);
  --t1:#1A1420;--t2:#4A3F60;--t3:#8A7FA0;--t4:#C0B8CC;
  --gold:#B07820;--gold2:#8A5E14;
  --goldf:rgba(176,120,32,.1);--golds:rgba(176,120,32,.05);--acc:rgba(176,120,32,.2);
}
html,body{background:var(--bg);color:var(--t1);font-family:var(--ff);min-height:100vh;-webkit-font-smoothing:antialiased;transition:background .4s,color .4s}
::-webkit-scrollbar{width:0}
.app{min-height:100vh;position:relative;overflow-x:hidden}
.page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--sp3) var(--sp2) var(--sp5);position:relative;z-index:1}
.page-inner{width:100%;max-width:440px}
.bg-canvas{position:fixed;inset:0;pointer-events:none;z-index:0}

/* 테마 토글 */
.theme-btn{position:fixed;top:18px;right:18px;z-index:50;width:36px;height:36px;border-radius:50%;background:var(--bg2);border:1px solid var(--line);color:var(--t3);font-size:.9rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.theme-btn:hover{color:var(--gold);border-color:var(--gold)}
.back-btn{position:absolute;top:18px;left:18px;width:36px;height:36px;border-radius:50%;background:var(--bg2);border:1px solid var(--line);color:var(--t3);font-size:.8rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;z-index:20}
.back-btn:hover{color:var(--gold)}

/* 스텝 닷 */
.step-dots{display:flex;gap:6px;justify-content:center;margin-bottom:var(--sp3)}
.dot{height:4px;border-radius:2px;transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.dot.done{width:14px;background:var(--t4)}
.dot.active{width:28px;background:var(--gold)}
.dot.todo{width:4px;background:var(--t4);opacity:.4}

/* ══ LANDING ══ */
.land{text-align:center}
.land-wordmark{font-size:var(--t-xs);font-weight:300;letter-spacing:.35em;color:var(--t3);text-transform:lowercase;margin-bottom:var(--sp5);opacity:.7;animation:fadeUp .8s .1s both}
.land-orb{width:140px;height:140px;border-radius:50%;margin:0 auto var(--sp4);position:relative;animation:fadeUp .8s .2s both}
.orb-core{position:absolute;inset:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(232,176,72,.7),rgba(180,100,160,.5),rgba(60,40,100,.8),transparent);animation:orbPulse 5s infinite}
.orb-ring1{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(232,176,72,.2);animation:orbSpin 12s linear infinite}
.orb-ring1::after{content:'';position:absolute;top:-3px;left:50%;width:6px;height:6px;border-radius:50%;background:var(--gold);transform:translateX(-50%);box-shadow:0 0 10px var(--gold)}
.orb-ring2{position:absolute;inset:-14px;border-radius:50%;border:1px solid rgba(232,176,72,.08);animation:orbSpin 20s linear infinite reverse}
@keyframes orbPulse{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
@keyframes orbSpin{to{transform:rotate(360deg)}}
.land-copy{font-size:var(--t-lg);font-weight:300;color:var(--t1);line-height:1.7;letter-spacing:-.01em;margin-bottom:var(--sp1);animation:fadeUp .8s .35s both}
.land-copy em{font-style:normal;color:var(--gold);font-weight:500}
.land-sub{font-size:var(--t-sm);color:var(--t3);margin-bottom:var(--sp4);animation:fadeUp .8s .45s both;line-height:1.8}
.cta-primary{display:inline-flex;align-items:center;gap:.5rem;padding:15px 36px;border:none;border-radius:50px;background:var(--gold);color:#0D0B14;font-size:var(--t-sm);font-weight:700;font-family:var(--ff);cursor:pointer;letter-spacing:.02em;transition:transform .15s,opacity .15s;animation:fadeUp .8s .55s both;-webkit-tap-highlight-color:transparent}
.cta-primary:hover{opacity:.9}
.cta-primary:active{transform:scale(.97)}
.land-trust{display:flex;align-items:center;gap:var(--sp2);justify-content:center;margin-top:var(--sp3);font-size:var(--t-xs);color:var(--t4);animation:fadeUp .8s .65s both}
.reviews-wrap{margin-top:var(--sp3);overflow:hidden;animation:fadeUp .8s .75s both}
.reviews-track{display:flex;gap:var(--sp2);overflow-x:auto;padding-bottom:4px;scroll-snap-type:x mandatory;-ms-overflow-style:none;scrollbar-width:none}
.reviews-track::-webkit-scrollbar{display:none}
.rev-card{flex-shrink:0;width:210px;scroll-snap-align:start;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2);padding:var(--sp2);text-align:left}
.rev-stars{font-size:var(--t-xs);color:var(--gold);margin-bottom:6px;letter-spacing:2px}
.rev-text{font-size:var(--t-xs);color:var(--t2);line-height:1.7}
.rev-nick{font-size:var(--t-xs);color:var(--t4);margin-top:6px}

/* ══ CARD (입력) ══ */
.card{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3);padding:var(--sp4) var(--sp3);animation:fadeUp .5s cubic-bezier(.34,1.56,.64,1)}
.card-title{font-size:var(--t-lg);font-weight:600;color:var(--t1);margin-bottom:6px}
.card-sub{font-size:var(--t-sm);color:var(--t3);margin-bottom:var(--sp4);line-height:1.7}
.lbl{display:block;font-size:var(--t-xs);font-weight:600;color:var(--t3);letter-spacing:.06em;margin-bottom:8px}
.inp{width:100%;padding:13px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t1);font-size:var(--t-sm);font-family:var(--ff);transition:border-color .2s,background .2s;margin-bottom:var(--sp3);-webkit-appearance:none}
.inp:focus{outline:none;border-color:var(--gold);background:var(--bg3)}
.inp::placeholder{color:var(--t4)}
select.inp option{background:var(--bg2)}
.row{display:flex;gap:8px}
.row .inp{margin-bottom:0}
.col{flex:1;min-width:0}
.gender-group{display:flex;gap:8px;margin-bottom:var(--sp3)}
.gbtn{flex:1;padding:11px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t3);font-size:var(--t-sm);font-family:var(--ff);cursor:pointer;transition:all .2s}
.gbtn.on{background:var(--goldf);border-color:var(--gold);color:var(--gold);font-weight:600}
.gbtn:active{transform:scale(.97)}
.toggle-row{display:flex;align-items:center;gap:var(--sp2);padding:12px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);cursor:pointer;margin-bottom:var(--sp3);transition:border-color .2s}
.toggle{width:40px;height:22px;border-radius:11px;position:relative;flex-shrink:0;transition:background .25s;border:none;cursor:pointer;padding:0}
.toggle.on{background:var(--gold)}
.toggle.off{background:var(--bg3)}
.toggle::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:white;top:3px;transition:left .25s cubic-bezier(.34,1.56,.64,1);box-shadow:0 1px 3px rgba(0,0,0,.3)}
.toggle.on::after{left:21px}
.toggle.off::after{left:3px}
.toggle-label{font-size:var(--t-sm);color:var(--t2)}
.pillars-wrap{margin:var(--sp2) 0;animation:fadeUp .3s ease}
.pillars-hint{font-size:var(--t-xs);color:var(--t4);letter-spacing:.08em;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.pillars{display:flex;gap:6px}
.pillar{flex:1;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);padding:10px 4px;text-align:center}
.p-lbl{font-size:var(--t-xs);color:var(--t4);margin-bottom:3px}
.p-hj{font-size:1.1rem;color:var(--gold);font-weight:600;line-height:1.2}
.p-kr{font-size:var(--t-xs);color:var(--t3);margin-top:2px}
.ohaeng-bar{display:flex;height:3px;border-radius:2px;gap:2px;margin:8px 0 6px;overflow:hidden}
.oh-seg{border-radius:1px;transition:flex .6s}
.ohaeng-tags{display:flex;gap:4px;flex-wrap:wrap}
.oh-tag{padding:3px 8px;border-radius:6px;font-size:var(--t-xs);font-weight:600}
.il-preview{margin-top:var(--sp2);font-size:var(--t-xs);color:var(--t3);line-height:1.8;padding:10px 12px;background:var(--bg2);border-radius:var(--r1);border-left:2px solid var(--gold)}
.btn-main{width:100%;padding:14px;border:none;border-radius:var(--r1);background:var(--gold);color:#0D0B14;font-size:var(--t-sm);font-weight:700;font-family:var(--ff);cursor:pointer;transition:transform .15s,opacity .15s;margin-top:var(--sp2)}
.btn-main:hover{opacity:.9}
.btn-main:active{transform:scale(.98)}
.btn-main:disabled{opacity:.3;cursor:not-allowed;transform:none}

/* ══ 질문 선택 ══ */
.q-shell{animation:fadeUp .5s cubic-bezier(.34,1.56,.64,1)}
.seg-wrap{display:flex;gap:2px;background:var(--bg2);border-radius:10px;padding:3px;margin-bottom:var(--sp3)}
.seg-btn{flex:1;padding:9px;border-radius:8px;border:none;background:transparent;color:var(--t3);font-size:var(--t-sm);font-family:var(--ff);cursor:pointer;transition:all .25s;font-weight:500}
.seg-btn.on{background:var(--bg3);color:var(--gold);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.3)}
.energy-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:var(--sp3)}
.e-chip{padding:5px 12px;background:var(--goldf);border:1px solid var(--acc);border-radius:50px;font-size:var(--t-xs);color:var(--gold)}
.cat-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:var(--sp2)}
.cat-tab{padding:6px 12px;border-radius:50px;border:1px solid var(--line);background:transparent;color:var(--t3);font-size:var(--t-xs);font-family:var(--ff);cursor:pointer;white-space:nowrap;transition:all .2s}
.cat-tab.on{background:var(--goldf);border-color:var(--acc);color:var(--gold);font-weight:600}
.q-list{display:flex;flex-direction:column;gap:4px;margin-bottom:var(--sp3)}
.q-item{width:100%;text-align:left;padding:12px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t2);font-size:var(--t-sm);font-family:var(--ff);cursor:pointer;line-height:1.55;transition:all .2s}
.q-item:hover{border-color:var(--t4);color:var(--t1);transform:translateX(3px)}
.q-item.on{background:var(--goldf);border-color:var(--acc);color:var(--gold);font-weight:500}
.q-item.on::before{content:'✓  '}
.q-item:disabled{opacity:.3;cursor:not-allowed;transform:none}
.diy-wrap{margin-bottom:var(--sp3)}
.diy-inp{width:100%;padding:12px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t1);font-size:var(--t-sm);font-family:var(--ff);resize:none;height:64px;transition:border-color .2s}
.diy-inp:focus{outline:none;border-color:var(--gold)}
.diy-inp::placeholder{color:var(--t4)}
.diy-row{display:flex;justify-content:space-between;align-items:center;margin-top:5px}
.diy-add{padding:5px 12px;border-radius:8px;border:1px solid var(--acc);background:transparent;color:var(--gold);font-size:var(--t-xs);font-family:var(--ff);cursor:pointer;transition:background .2s}
.diy-add:hover{background:var(--goldf)}
.sel-qs{margin-bottom:var(--sp3)}
.sel-lbl{font-size:var(--t-xs);color:var(--t4);letter-spacing:.07em;margin-bottom:8px}
.sel-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;margin-bottom:4px;background:var(--goldf);border:1px solid var(--acc);border-radius:var(--r1);animation:fadeUp .2s ease}
.sel-n{width:18px;height:18px;border-radius:50%;background:var(--gold);color:#0D0B14;font-size:var(--t-xs);font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.sel-t{flex:1;font-size:var(--t-sm);color:var(--t1);line-height:1.5}
.sel-del{background:none;border:none;color:var(--t4);cursor:pointer;font-size:.85rem;padding:0;flex-shrink:0;transition:color .2s}
.sel-del:hover{color:var(--t2)}
.pkg-section{margin-bottom:var(--sp2)}
.pkg-lbl{font-size:var(--t-xs);color:var(--t4);letter-spacing:.07em;margin-bottom:8px}
.pkgs{display:flex;gap:5px}
.pkg{flex:1;padding:10px 4px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);text-align:center;cursor:pointer;transition:all .2s;position:relative}
.pkg:hover{border-color:var(--t4)}
.pkg.chosen{background:var(--goldf);border-color:var(--gold)}
.pkg-e{font-size:1rem;margin-bottom:2px}
.pkg-n{font-size:var(--t-xs);font-weight:600;color:var(--t2)}
.pkg-p{font-size:var(--t-xs);color:var(--gold);font-weight:700;margin-top:1px}
.pkg-hot{position:absolute;top:-7px;right:-3px;background:var(--gold);color:#0D0B14;font-size:.5rem;font-weight:800;padding:2px 5px;border-radius:4px}
.q-stat{font-size:var(--t-xs);color:var(--t4);text-align:center;margin:8px 0 var(--sp2)}
.q-stat strong{color:var(--gold)}
.free-note{font-size:var(--t-xs);color:var(--t4);text-align:center;margin-bottom:var(--sp2)}
.free-note span{color:var(--gold)}

/* ══ LOADING — Skeleton ══ */
.loading-page{padding:var(--sp4) var(--sp3);width:100%;max-width:440px}
.skel-header{display:flex;align-items:center;gap:var(--sp2);padding:var(--sp3);background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3) var(--r3) 0 0;margin-bottom:2px}
.skel-av{width:48px;height:48px;border-radius:50%;background:var(--bg2)}
.skel-lines{flex:1}
.skel-line{height:10px;border-radius:5px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
.skel-line.w60{width:60%;margin-bottom:8px}
.skel-line.w40{width:40%}
.skel-body{background:var(--bg1);border:1px solid var(--line);border-top:none;padding:var(--sp3);border-radius:0 0 var(--r3) var(--r3)}
.skel-para{display:flex;flex-direction:column;gap:8px;padding:var(--sp2) 0;border-bottom:1px solid var(--line)}
.skel-para:last-child{border-bottom:none}
.skel-line.full{width:100%}
.skel-line.w80{width:80%}
.skel-line.w55{width:55%}
.skel-status{text-align:center;margin-top:var(--sp3);font-size:var(--t-sm);color:var(--t3);animation:statusFade .5s ease}
.skel-status-sub{font-size:var(--t-xs);color:var(--t4);margin-top:5px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes statusFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* ══ RESULT ══ */
.result-wrap{animation:fadeUp .6s cubic-bezier(.34,1.56,.64,1)}
.res-card{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden}
.res-header{display:flex;align-items:center;gap:var(--sp2);padding:var(--sp3);border-bottom:1px solid var(--line)}
.res-av{width:44px;height:44px;border-radius:50%;background:var(--goldf);border:1px solid var(--acc);display:flex;align-items:center;justify-content:center;font-size:1.15rem;flex-shrink:0}
.res-name{font-size:var(--t-sm);font-weight:600;color:var(--t1)}
.res-meta{font-size:var(--t-xs);color:var(--t4);margin-top:3px;line-height:1.55}

/* 아코디언 */
.acc-item{border-bottom:1px solid var(--line)}
.acc-item:last-of-type{border-bottom:none}
.acc-trigger{width:100%;text-align:left;padding:var(--sp2) var(--sp3);background:transparent;border:none;cursor:pointer;color:var(--t2);display:flex;justify-content:space-between;align-items:center;transition:color .2s}
.acc-trigger:hover{color:var(--t1)}
.acc-trigger.open{color:var(--gold)}
.acc-q{font-size:var(--t-sm);line-height:1.55;text-align:left;flex:1;padding-right:var(--sp2)}
.acc-chevron{font-size:.65rem;color:var(--t4);flex-shrink:0;transition:transform .3s,color .3s}
.acc-chevron.open{transform:rotate(180deg);color:var(--gold)}
.acc-body{overflow:hidden;transition:max-height .45s cubic-bezier(.4,0,.2,1),opacity .35s ease}
.acc-body.closed{max-height:0;opacity:0}
.acc-body.open{max-height:3000px;opacity:1}
.acc-content{padding:0 var(--sp3) var(--sp3);font-size:var(--t-sm);color:var(--t2);line-height:2.15;white-space:pre-wrap}
.acc-content strong,.acc-content b{color:var(--gold);font-weight:600}
.acc-content::first-letter{font-size:2.2em;font-weight:700;color:var(--gold);float:left;line-height:.85;margin:.05em .1em 0 0}
.typing-cursor{display:inline-block;width:2px;height:1em;background:var(--gold);margin-left:2px;vertical-align:text-bottom;animation:blink .7s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

/* 채팅 */
.chat-zone{border-top:1px solid var(--line)}
.chat-msgs{padding:var(--sp2) var(--sp3);max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:var(--sp2)}
.msg{display:flex;gap:10px;animation:fadeUp .3s ease}
.msg.user{flex-direction:row-reverse}
.msg-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;flex-shrink:0;margin-top:2px}
.msg-av.ai{background:var(--goldf);border:1px solid var(--acc)}
.msg-av.user{background:var(--bg3);border:1px solid var(--line)}
.msg-bubble{max-width:78%;padding:10px 14px;font-size:var(--t-sm);line-height:1.75;border-radius:18px}
.msg.ai .msg-bubble{background:var(--bg2);border:1px solid var(--line);border-bottom-left-radius:4px;color:var(--t1)}
.msg.user .msg-bubble{background:var(--bg3);border:1px solid var(--line);border-bottom-right-radius:4px;color:var(--t1)}
.typing-dots{display:flex;gap:4px;padding:10px 14px}
.typing-dots span{width:6px;height:6px;border-radius:50%;background:var(--t4);animation:dot 1.2s infinite}
.typing-dots span:nth-child(2){animation-delay:.2s}
.typing-dots span:nth-child(3){animation-delay:.4s}
@keyframes dot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}
.chat-sugg{padding:var(--sp1) var(--sp3);display:flex;gap:5px;flex-wrap:wrap;border-top:1px solid var(--line)}
.sugg-btn{padding:5px 12px;background:transparent;border:1px solid var(--line);border-radius:50px;color:var(--t3);font-size:var(--t-xs);font-family:var(--ff);cursor:pointer;white-space:nowrap;transition:all .2s}
.sugg-btn:hover{border-color:var(--acc);color:var(--gold);background:var(--goldf)}
.chat-input-row{display:flex;gap:var(--sp1);padding:var(--sp2) var(--sp3);border-top:1px solid var(--line)}
.chat-inp{flex:1;padding:10px 16px;background:var(--bg2);border:1px solid var(--line);border-radius:50px;color:var(--t1);font-size:var(--t-sm);font-family:var(--ff);transition:border-color .2s}
.chat-inp:focus{outline:none;border-color:var(--acc)}
.chat-inp::placeholder{color:var(--t4)}
.chat-inp:disabled{opacity:.4}
.chat-send{width:38px;height:38px;border-radius:50%;border:none;background:var(--gold);color:#0D0B14;font-size:.85rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform .15s,opacity .15s}
.chat-send:hover{opacity:.85}
.chat-send:active{transform:scale(.93)}
.chat-send:disabled{opacity:.3;cursor:not-allowed}
.chat-limit{font-size:var(--t-xs);color:var(--t4);text-align:center;padding:6px;border-top:1px solid var(--line)}

/* 액션 */
.res-actions{padding:var(--sp3);border-top:1px solid var(--line)}
.upsell{padding:var(--sp2) var(--sp3);background:var(--golds);border:1px solid var(--acc);border-radius:var(--r2);text-align:center;margin-bottom:var(--sp2)}
.up-t{font-size:var(--t-sm);font-weight:600;color:var(--gold);margin-bottom:5px}
.up-d{font-size:var(--t-xs);color:var(--t3);margin-bottom:var(--sp2);line-height:1.7}
.up-btn{width:100%;padding:11px;border:1px solid var(--gold);border-radius:var(--r1);background:transparent;color:var(--gold);font-size:var(--t-sm);font-weight:600;font-family:var(--ff);cursor:pointer;transition:all .2s}
.up-btn:hover{background:var(--goldf)}
.up-btn:disabled{opacity:.4;cursor:not-allowed}
.res-btns{display:flex;gap:6px;flex-wrap:wrap}
.res-btn{flex:1;min-width:70px;padding:9px 6px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t3);font-size:var(--t-xs);font-family:var(--ff);cursor:pointer;transition:all .2s}
.res-btn:hover{border-color:var(--acc);color:var(--gold)}
.res-btn:active{transform:scale(.96)}

/* 모달 */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:flex-end;animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3) var(--r3) 0 0;width:100%;max-height:85vh;overflow-y:auto;animation:slideUp .4s cubic-bezier(.34,1.56,.64,1)}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.modal-handle{width:36px;height:4px;border-radius:2px;background:var(--line);margin:var(--sp2) auto var(--sp3)}
.modal-title{font-size:var(--t-lg);font-weight:600;color:var(--gold);text-align:center;margin-bottom:var(--sp3);padding:0 var(--sp3)}
.modal-body{padding:0 var(--sp3) var(--sp5)}
.modal-loading{text-align:center;padding:var(--sp5);color:var(--t3);font-size:var(--t-sm)}
.m-sec-title{font-size:var(--t-sm);font-weight:700;color:var(--gold);margin:var(--sp3) 0 var(--sp2);display:flex;align-items:center;gap:8px}
.m-text{font-size:var(--t-sm);color:var(--t2);line-height:2.15;white-space:pre-wrap}
.m-text strong{color:var(--gold)}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.hint{font-size:var(--t-xs);color:var(--t4)}
`;

// ═══════════════════════════════════════════════
//  🌌 별 캔버스
// ═══════════════════════════════════════════════
function StarCanvas({isDark}){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext('2d');let raf;
    const stars=Array.from({length:80},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.2+.2,a:Math.random(),da:(Math.random()-.5)*.004}));
    const draw=()=>{
      c.width=window.innerWidth;c.height=window.innerHeight;
      ctx.clearRect(0,0,c.width,c.height);
      stars.forEach(s=>{
        s.a=Math.max(.05,Math.min(.7,s.a+s.da));
        if(s.a<=.05||s.a>=.7)s.da*=-1;
        ctx.beginPath();ctx.arc(s.x*c.width,s.y*c.height,s.r,0,Math.PI*2);
        ctx.fillStyle=isDark?`rgba(255,255,255,${s.a})`:`rgba(180,160,100,${s.a*.4})`;
        ctx.fill();
      });
      raf=requestAnimationFrame(draw);
    };
    draw();return()=>cancelAnimationFrame(raf);
  },[isDark]);
  return <canvas ref={ref} className="bg-canvas"/>;
}

// ═══════════════════════════════════════════════
//  Skeleton 로더
// ═══════════════════════════════════════════════
function SkeletonLoader({qCount}){
  const [si,setSi]=useState(0);
  useEffect(()=>{const id=setInterval(()=>setSi(p=>(p+1)%LOAD_STATES.length),1800);return()=>clearInterval(id);},[]);
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

// ═══════════════════════════════════════════════
//  타이핑 훅
// ═══════════════════════════════════════════════
function useTyping(text,active,speed=14){
  const [shown,setShown]=useState('');
  const [done,setDone]=useState(false);
  useEffect(()=>{
    if(!active||!text)return;
    setShown('');setDone(false);let i=0;
    const id=setInterval(()=>{i++;setShown(text.slice(0,i));if(i>=text.length){clearInterval(id);setDone(true);}},speed);
    return()=>clearInterval(id);
  },[text,active,speed]);
  return{shown,done};
}

// ═══════════════════════════════════════════════
//  아코디언
// ═══════════════════════════════════════════════
function AccItem({q,text,idx,isOpen,onToggle,isTyping}){
  const{shown,done}=useTyping(text,isTyping);
  const display=isTyping?shown:(text||'');
  const fmt=t=>t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>');
  return(
    <div className="acc-item">
      <button className={`acc-trigger${isOpen?' open':''}`} onClick={onToggle}>
        <span className="acc-q">
          <span style={{color:'var(--gold)',fontWeight:700,marginRight:8,fontSize:'var(--t-xs)'}}>Q{idx+1}</span>{q}
        </span>
        <span className={`acc-chevron${isOpen?' open':''}`}>▼</span>
      </button>
      <div className={`acc-body${isOpen?' open':' closed'}`}>
        <div className="acc-content" dangerouslySetInnerHTML={{__html:fmt(display)+(isTyping&&!done?'<span class="typing-cursor"></span>':'')}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  🏠 메인 앱
// ═══════════════════════════════════════════════
export default function App(){
  const[isDark,setIsDark]=useState(true);
  const[step,setStep]=useState(0);
  const[form,setForm]=useState({name:'',by:'',bm:'',bd:'',bh:'',gender:'',noTime:false});
  const[mode,setMode]=useState('saju');
  const[cat,setCat]=useState(0);
  const[selQs,setSelQs]=useState([]);
  const[diy,setDiy]=useState('');
  const[pkg,setPkg]=useState('star');
  const[answers,setAnswers]=useState([]);
  const[openAcc,setOpenAcc]=useState(0);
  const[typingIdx,setTypingIdx]=useState(0);
  const[chatMsgs,setChatMsgs]=useState([]);
  const[chatInput,setChatInput]=useState('');
  const[chatLoading,setChatLoading]=useState(false);
  const[chatUsed,setChatUsed]=useState(0);
  const[showReport,setShowReport]=useState(false);
  const[reportContent,setReportContent]=useState('');
  const[reportLoading,setReportLoading]=useState(false);
  const chatEndRef=useRef(null);

  useEffect(()=>{document.documentElement.setAttribute('data-theme',isDark?'dark':'light');},[isDark]);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[chatMsgs,chatLoading]);

  const saju=(form.by&&form.bm&&form.bd)?getSaju(+form.by,+form.bm,+form.bd,form.noTime?12:+(form.bh||12)):null;
  const sun=(form.bm&&form.bd)?getSun(+form.bm,+form.bd):null;
  const moon=(form.by&&form.bm&&form.bd)?getMoon(+form.by,+form.bm,+form.bd):null;
  const asc=(!form.noTime&&form.bh&&form.bm)?getAsc(+form.bh,+form.bm):null;
  const il=saju?ILGAN[saju.ilgan]:null;
  const age=form.by?new Date().getFullYear()-+form.by:0;
  const formOk=form.by&&form.bm&&form.bd&&form.gender&&(form.noTime||form.bh);
  const curPkg=PKGS.find(p=>p.id===pkg)||PKGS[2];
  const maxQ=curPkg.q,maxChat=curPkg.chat,chatLeft=maxChat-chatUsed;

  const addQ=q=>{if(selQs.length<maxQ&&!selQs.includes(q)){setSelQs(p=>[...p,q]);setDiy('');}};
  const rmQ=i=>setSelQs(p=>p.filter((_,x)=>x!==i));

  const buildSys=useCallback(()=>`당신은 '별숨'의 AI 운세 상담가예요. 20년차 에세이 작가의 문체로, 사주와 별자리가 알려주는 이야기를 사람의 언어로 번역해서 들려줘요.

━━━ 핵심 철학 ━━━
사주와 별자리 데이터는 '취재 노트'예요. 노트를 보여주는 게 아니라, 그걸 바탕으로 쓴 이야기를 들려줘요.

━━━ 절대 쓰지 않는 단어 ━━━
갑목·을목·병화·정화·무토·기토·경금·신금·임수·계수·연주·월주·일주·시주·일간·일지·오행·상생·상극·대운·세운·용신·태양궁·달궁·상승궁·어센던트·트랜짓·천간·지지

━━━ 답변 구조 (750-950자) ━━━
① 공감 도입부 (3-4문장): 그 마음이 어떤 느낌인지 구체적으로 그려줘요. '맞아, 나 이런 기분이었어'라고 느끼게요.
② 운명의 렌즈 (4-5문장): 전문용어 없이 타고난 기질과 지금 시기를 이야기처럼 풀어줘요.
③ 이 시기의 의미 (3문장): 왜 지금 이런 상황인지, 이 시기가 필요한 이유로 재해석해줘요.
④ 오늘 행동 (2문장): 아주 구체적이고 작은 행동을 제안해요.
⑤ 응원 마무리 (2문장): 읽고 나서 힘이 나는 따뜻한 한 마디.

━━━ 말투 ━━━
친한 언니가 진심으로 들어주는 말투 / ~하죠, ~이에요, ~해봐요 / 이모지 문단 끝 1-2개 / **볼드**는 핵심 감정 키워드만 3-4개 / 공감 먼저, 분석 나중`,[]);

  const buildCtx=useCallback(()=>{
    let c=`[${form.name||'고객님'} · ${age}세 · ${form.gender}]\n`;
    if(mode==='saju'&&saju)c+=`연: ${saju.yeon.g}${saju.yeon.j} / 월: ${saju.wol.g}${saju.wol.j} / 일: ${saju.il.g}${saju.il.j} / 시: ${saju.si.g}${saju.si.j}\n강한 기운: ${saju.dom} / 약한 기운: ${saju.lac}\n`;
    else if(mode==='astro'&&sun)c+=`${sun.n}(${sun.s}) / 달: ${moon?.n||'?'} / 상승: ${asc?.n||'미입력'}\n`;
    return c;
  },[form,mode,saju,sun,moon,asc,age]);

  const askClaude=async()=>{
    if(!selQs.length)return;
    setStep(3);setAnswers([]);setTypingIdx(0);setOpenAcc(0);
    const sys=buildSys(),ctx=buildCtx();
    try{
      const newAnswers=[];
      for(let i=0;i<selQs.length;i++){
        const res=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:sys,userMessage:ctx+`\n[질문]\n${selQs[i]}`})});
        const data=await res.json();
        if(!res.ok)throw new Error(data.error||'API 오류');
        newAnswers.push(data.text||'');
      }
      setAnswers(newAnswers);setChatMsgs([{role:'ai',text:newAnswers[0]}]);setChatUsed(0);
      setStep(4);setTypingIdx(0);setOpenAcc(0);
    }catch(err){
      console.error(err);
      setAnswers(['별이 잠시 길을 잃었어요 🌙 네트워크를 확인하고 다시 시도해봐요!']);
      setStep(4);
    }
  };

  const handleAccToggle=i=>{
    const nowOpen=openAcc===i?-1:i;
    setOpenAcc(nowOpen);
    if(nowOpen>=0&&typingIdx<nowOpen)setTypingIdx(nowOpen);
  };

  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading||chatLeft<=0)return;
    const userMsg=chatInput.trim();setChatInput('');
    setChatMsgs(p=>[...p,{role:'user',text:userMsg}]);
    setChatLoading(true);setChatUsed(p=>p+1);
    const sys=buildSys()+'\n\n이미 첫 답변을 드린 상태예요. 후속 질문에 자연스럽게 이어서 답해줘요.';
    const history=chatMsgs.map(m=>`[${m.role==='ai'?'별숨':'고객'}]: ${m.text}`).join('\n\n');
    const ctx=buildCtx()+`\n[이전 대화]\n${history}\n\n[새 질문]\n${userMsg}`;
    try{
      const res=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:sys,userMessage:ctx})});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error);
      setChatMsgs(p=>[...p,{role:'ai',text:data.text||''}]);
    }catch{setChatMsgs(p=>[...p,{role:'ai',text:'앗, 잠깐 연결이 끊겼어요 🌙'}]);}
    finally{setChatLoading(false);}
  };

  const genReport=async()=>{
    setShowReport(true);setReportLoading(true);setReportContent('');
    const sys=buildSys()+'\n\n월간 종합 운세 리포트를 에세이 형식으로 작성해줘요. 연애운·직업운·재물운·건강운·이달의 주의사항·행운의 날짜/색깔/숫자 포함. 각 섹션 ## 제목으로 구분, 총 800-1000자. 전문용어 없이 감성적으로요.';
    try{
      const res=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:sys,userMessage:buildCtx()+'\n[요청] 이번 달 종합 운세 리포트'})});
      const data=await res.json();
      setReportContent(data.text||'');
    }catch{setReportContent('별이 잠시 쉬고 있어요 🌙 잠시 후 다시 시도해봐요!');}
    finally{setReportLoading(false);}
  };

  const fmtReport=t=>t.replace(/##\s*(.*)/g,'<div class="m-sec-title">✦ $1</div>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>');
  const fmtChat=t=>t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>');

  return(
    <>
      <style>{CSS}</style>
      <StarCanvas isDark={isDark}/>
      <button className="theme-btn" onClick={()=>setIsDark(p=>!p)}>{isDark?'☀':'◑'}</button>

      <div className="app">

        {/* ══ 0 랜딩 ══ */}
        {step===0&&(
          <div className="page">
            <div className="page-inner land">
              <div className="land-wordmark">byeolsoom</div>
              <div className="land-orb">
                <div className="orb-core"/><div className="orb-ring1"/><div className="orb-ring2"/>
              </div>
              <p className="land-copy">오늘 밤,<br/><em>당신의 별이 기다리고 있어요.</em></p>
              <p className="land-sub">말 못 한 그 고민,<br/>별한테 털어놔봐요</p>
              <button className="cta-primary" onClick={()=>setStep(1)}>지금 시작하기 ✦</button>
              <div className="land-trust">
                <span>★★★★★ 4.9</span><span>·</span>
                <span>32,841명</span><span>·</span>
                <span>무료 체험 가능</span>
              </div>
              <div className="reviews-wrap">
                <div className="reviews-track">
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
            <button className="back-btn" onClick={()=>setStep(0)}>←</button>
            <div className="page-inner">
              <div className="step-dots">
                {[0,1,2].map(i=><div key={i} className={`dot ${i===0?'active':'todo'}`}/>)}
              </div>
              <div className="card">
                <div className="card-title">반가워요 🌙</div>
                <div className="card-sub">생년월일만 있으면 바로 읽어드릴 수 있어요</div>

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
                    <div className="ohaeng-bar">
                      {Object.entries(saju.or).map(([k,v])=>v>0&&<div key={k} className="oh-seg" style={{flex:v,background:OC[k]}}/>)}
                    </div>
                    <div className="ohaeng-tags">
                      {Object.entries(saju.or).map(([k,v])=>v>0&&(
                        <span key={k} className="oh-tag" style={{background:`${OC[k]}18`,color:OC[k],border:`1px solid ${OC[k]}30`}}>{OE[k]} {ON[k]} {v}</span>
                      ))}
                    </div>
                    {il&&<div className="il-preview">{il.s} — {il.feel}</div>}
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
            <button className="back-btn" onClick={()=>setStep(1)}>←</button>
            <div className="page-inner">
              <div className="step-dots">
                {[0,1,2].map(i=><div key={i} className={`dot ${i<1?'done':i===1?'active':'todo'}`}/>)}
              </div>
              <div className="q-shell">
                <div className="seg-wrap">
                  <button className={`seg-btn ${mode==='saju'?'on':''}`} onClick={()=>setMode('saju')}>🀄 사주 기운</button>
                  <button className={`seg-btn ${mode==='astro'?'on':''}`} onClick={()=>setMode('astro')}>{sun?.s||'✨'} 별자리 기운</button>
                </div>

                <div className="energy-chips">
                  {mode==='saju'&&saju&&il&&<><div className="e-chip">✦ {il.s}</div><div className="e-chip">오늘 — {il.today}</div></>}
                  {mode==='astro'&&sun&&<><div className="e-chip">{sun.s} {sun.n}</div>{moon&&<div className="e-chip">🌙 달 {moon.n}</div>}{asc&&<div className="e-chip">↑ 상승 {asc.n}</div>}</>}
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

                <div className="pkg-section">
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
                  {selQs.length===maxQ&&<><strong>준비 완료!</strong> 별한테 물어볼게요 🌟</>}
                </div>
                <div className="free-note">지금은 <span>무료로 체험</span>할 수 있어요</div>
                <button className="btn-main" disabled={!selQs.length} onClick={askClaude}>
                  {selQs.length===0?'질문을 먼저 골라봐요':`✦ 별한테 물어보기 (${selQs.length}개)`}
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
            <div className="page-inner result-wrap">
              <div className="res-card">
                <div className="res-header">
                  <div className="res-av">{mode==='saju'?'🀄':sun?.s||'✨'}</div>
                  <div>
                    <div className="res-name">{form.name||'당신'}님께 보내는 별의 메시지</div>
                    <div className="res-meta">
                      {mode==='saju'?`${saju?.il.g}${saju?.il.j}의 기운 · ${age}세`:`${sun?.s} ${sun?.n} · 달 ${moon?.n||''} · ${age}세`}
                    </div>
                  </div>
                </div>

                {selQs.map((q,i)=>(
                  <AccItem key={i} q={q} text={answers[i]||''} idx={i} isOpen={openAcc===i} onToggle={()=>handleAccToggle(i)} isTyping={openAcc===i&&typingIdx===i}/>
                ))}

                {maxChat>0&&(
                  <div className="chat-zone">
                    <div className="chat-msgs">
                      {chatMsgs.slice(1).map((m,i)=>(
                        <div key={i} className={`msg ${m.role}`}>
                          <div className={`msg-av ${m.role}`}>{m.role==='ai'?'✦':'·'}</div>
                          <div className="msg-bubble" dangerouslySetInnerHTML={{__html:fmtChat(m.text)}}/>
                        </div>
                      ))}
                      {chatLoading&&(
                        <div className="msg ai">
                          <div className="msg-av ai">✦</div>
                          <div className="msg-bubble" style={{padding:0,background:'none',border:'none'}}>
                            <div className="typing-dots"><span/><span/><span/></div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef}/>
                    </div>
                    {chatLeft>0&&!chatLoading&&(
                      <div className="chat-sugg">
                        {SUGG.map((s,i)=><button key={i} className="sugg-btn" onClick={()=>setChatInput(s)}>{s}</button>)}
                      </div>
                    )}
                    <div className="chat-input-row">
                      <input className="chat-inp" placeholder={chatLeft>0?'더 궁금한 게 있어요? 🌙':'채팅 횟수를 모두 사용했어요'} value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();}}} disabled={chatLeft<=0||chatLoading}/>
                      <button className="chat-send" onClick={sendChat} disabled={!chatInput.trim()||chatLeft<=0||chatLoading}>✦</button>
                    </div>
                    <div className="chat-limit">채팅 {chatUsed}/{maxChat}회 · 남은 횟수 {chatLeft}회</div>
                  </div>
                )}

                <div className="res-actions">
                  <div className="upsell">
                    <div className="up-t">✦ 이번 달 전체 운세가 궁금해요</div>
                    <div className="up-d">연애 · 재물 · 건강 · 직업 종합 분석<br/>나만을 위한 월간 리포트를 받아봐요</div>
                    <button className="up-btn" onClick={genReport} disabled={reportLoading}>{reportLoading?'리포트 생성 중...':'월간 리포트 받기'}</button>
                  </div>
                  <div className="res-btns">
                    <button className="res-btn" onClick={()=>{setSelQs([]);setDiy('');setChatMsgs([]);setChatUsed(0);setStep(2);}}>다른 질문</button>
                    <button className="res-btn" onClick={()=>{navigator.clipboard?.writeText(answers.join('\n\n'));alert('복사됐어요 📋');}}>복사하기</button>
                    <button className="res-btn" onClick={()=>{setStep(0);setForm({name:'',by:'',bm:'',bd:'',bh:'',gender:'',noTime:false});setMode('saju');setSelQs([]);setAnswers([]);setChatMsgs([]);setChatUsed(0);}}>처음으로</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showReport&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className==='modal-overlay')setShowReport(false);}}>
          <div className="modal">
            <div className="modal-handle"/>
            <div className="modal-title">✦ {form.name||'당신'}님의 월간 운세 리포트</div>
            <div className="modal-body">
              {reportLoading
                ?<div className="modal-loading">별이 이달의 이야기를 정리하고 있어요 🌙</div>
                :<div className="m-text" dangerouslySetInnerHTML={{__html:fmtReport(reportContent)}}/>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
