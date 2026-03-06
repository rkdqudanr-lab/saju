import { useState, useEffect } from "react";

// ═══════════════════════════════════════
//  사주 계산 엔진
// ═══════════════════════════════════════
const CG=["갑","을","병","정","무","기","경","신","임","계"];
const JJ=["자","축","인","묘","진","사","오","미","신","유","술","해"];
const CGH=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JJH=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CGO=["목","목","화","화","토","토","금","금","수","수"];
const JJO=["수","토","목","목","토","화","화","토","금","금","토","수"];
const OC={목:"#5B9E6A",화:"#E8604A",토:"#C4924A",금:"#C8A840",수:"#4A8EC4"};
const OE={목:"🌿",화:"🔥",토:"🍂",금:"✨",수:"💧"};

const ILGAN={
  갑:{short:"새싹 리더",who:"새로운 길을 여는 사람이에요",feel:"어딜 가도 첫 번째가 되고 싶은, 그 설레는 마음을 가진 사람이에요 🌱",today:"오늘은 내가 먼저 연락해볼까요?"},
  을:{short:"섬세한 나무",who:"부드럽지만 강한 사람이에요",feel:"겉으로는 조용해 보여도, 마음속엔 누구보다 강한 의지가 있는 사람이에요 🎋",today:"작은 변화부터 시작해봐요"},
  병:{short:"따뜻한 태양",who:"주변을 밝히는 에너지예요",feel:"당신이 있는 공간이 왠지 밝아지는 걸 느낀 적 있나요? 그게 바로 당신의 기운이에요 ☀️",today:"내 빛을 마음껏 발산해봐요"},
  정:{short:"촛불 같은 마음",who:"헌신적이고 따뜻한 사람이에요",feel:"가까운 사람을 온기로 감싸주는 그 마음이 당신의 가장 큰 매력이에요 🕯️",today:"나를 위한 시간도 가져봐요"},
  무:{short:"든든한 대지",who:"중심을 잡아주는 사람이에요",feel:"어수선할 때 옆에 있으면 왜인지 마음이 놓이는 사람, 그게 바로 당신이에요 🌍",today:"천천히, 하지만 확실하게"},
  기:{short:"정원 같은 사람",who:"섬세하게 가꾸는 사람이에요",feel:"사람들 사이에서 조화를 만드는 능력, 그거 아무나 못 하는데 당신은 자연스럽게 해요 🌸",today:"오늘은 나를 좀 더 챙겨줄게요"},
  경:{short:"날카로운 검",who:"결단력 있는 사람이에요",feel:"한 번 마음먹으면 끝까지 가는 사람, 때론 외롭지만 가장 멋진 모습이에요 ⚔️",today:"내 기준을 믿어봐요"},
  신:{short:"빛나는 보석",who:"완벽을 추구하는 사람이에요",feel:"세상을 아주 선명하게 보는 눈을 가졌어요. 그 눈이 당신의 강점이에요 💎",today:"완벽하지 않아도 괜찮아요"},
  임:{short:"깊은 강물",who:"넓은 지혜를 가진 사람이에요",feel:"말 많이 안 해도 느낌으로 다 아는 그 직관력, 주변 사람들이 다 느끼고 있어요 🌊",today:"마음 가는 대로 흘러가봐요"},
  계:{short:"이슬 같은 감성",who:"예민하고 직관적인 사람이에요",feel:"남들이 못 느끼는 걸 먼저 느끼는 사람이에요. 그 섬세함이 당신의 가장 큰 재능이에요 🌧️",today:"내 감정에 솔직해져봐요"},
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
  return{yeon:{g:CG[yg],j:JJ[yj],gh:CGH[yg],jh:JJH[yj]},wol:{g:CG[wg],j:JJ[wj],gh:CGH[wg],jh:JJH[wj]},il:{g:CG[ig],j:JJ[ij],gh:CGH[ig],jh:JJH[ij]},si:{g:CG[sg],j:JJ[si%12],gh:CGH[sg],jh:JJH[si%12]},ilgan:CG[ig],or};
}

// ═══════════════════════════════════════
//  점성술
// ═══════════════════════════════════════
const SIGNS=[
  {n:"양자리",s:"♈",sm:3,sd:21,em:4,ed:19,el:"🔥",vibe:"나는 먼저야!",feel:"뭔가 새로운 걸 시작하고 싶을 때 가장 빛나는 사람이에요",charm:"폭발적인 첫인상",today:"망설이지 말고 일단 해봐요"},
  {n:"황소자리",s:"♉",sm:4,sd:20,em:5,ed:20,el:"🌿",vibe:"편안함이 최고야",feel:"한 번 마음을 열면 세상 누구보다 깊이 사랑하는 사람이에요",charm:"든든한 안정감",today:"나를 위한 소소한 사치를 허락해줘요"},
  {n:"쌍둥이자리",s:"♊",sm:5,sd:21,em:6,ed:20,el:"💨",vibe:"다 궁금해!",feel:"어떤 상황에서도 재미를 찾아내는 특별한 능력이 있어요",charm:"재치 있는 말솜씨",today:"새로운 사람을 만나봐요"},
  {n:"게자리",s:"♋",sm:6,sd:21,em:7,ed:22,el:"💧",vibe:"소중한 사람이 전부야",feel:"한 번 소중하다고 생각한 사람은 끝까지 지키려는 마음이 있어요",charm:"따뜻한 공감 능력",today:"나를 먼저 돌봐줘요"},
  {n:"사자자리",s:"♌",sm:7,sd:23,em:8,ed:22,el:"🔥",vibe:"나 좀 봐줘!",feel:"주목받을 때 가장 빛나는 사람, 그리고 그럴 자격이 충분해요",charm:"타고난 카리스마",today:"내 매력을 마음껏 발산해봐요"},
  {n:"처녀자리",s:"♍",sm:8,sd:23,em:9,ed:22,el:"🌿",vibe:"제대로 해야 해",feel:"남들이 그냥 지나치는 것도 꼼꼼하게 챙기는 사람이에요",charm:"섬세함과 실용성",today:"'이 정도면 됐어'를 연습해봐요"},
  {n:"천칭자리",s:"♎",sm:9,sd:23,em:10,ed:22,el:"💨",vibe:"모두가 행복하면 좋겠어",feel:"사람들 사이에서 균형을 맞춰주는, 없어서는 안 될 사람이에요",charm:"뛰어난 심미안",today:"내 마음대로 골라봐요"},
  {n:"전갈자리",s:"♏",sm:10,sd:23,em:11,ed:21,el:"💧",vibe:"다 꿰뚫어보고 있어",feel:"표면 아래의 진짜를 보는 눈, 그게 당신의 가장 큰 무기예요",charm:"날카로운 통찰",today:"놓아주는 연습을 해봐요"},
  {n:"사수자리",s:"♐",sm:11,sd:22,em:12,ed:21,el:"🔥",vibe:"세상이 다 내 무대야!",feel:"어디서든 자유롭게 살고 싶은, 그 마음이 당신을 특별하게 만들어요",charm:"낙천적인 모험심",today:"새로운 곳에 가봐요"},
  {n:"염소자리",s:"♑",sm:12,sd:22,em:1,ed:19,el:"🌿",vibe:"결국엔 내가 이겨",feel:"남들이 포기할 때도 묵묵히 가는 사람, 그게 가장 멋진 모습이에요",charm:"끈기와 목표 달성력",today:"잠깐 쉬어가도 돼요"},
  {n:"물병자리",s:"♒",sm:1,sd:20,em:2,ed:18,el:"💨",vibe:"남들과 달라야 해",feel:"아무도 생각 못 한 아이디어를 내는 사람, 당신이 그래요",charm:"독창성과 진보적 사고",today:"내 이상한 아이디어를 믿어봐요"},
  {n:"물고기자리",s:"♓",sm:2,sd:19,em:3,ed:20,el:"💧",vibe:"다 느껴져요",feel:"세상의 아픔을 함께 느끼는, 그 공감 능력이 당신의 가장 큰 선물이에요",charm:"풍부한 감수성",today:"내 꿈에 귀 기울여봐요"},
];
function getSun(m,d){for(let z of SIGNS){if(z.sm<=z.em){if((m===z.sm&&d>=z.sd)||(m===z.em&&d<=z.ed)||(m>z.sm&&m<z.em))return z;}else{if((m===z.sm&&d>=z.sd)||(m===z.em&&d<=z.ed)||m>z.sm||m<z.em)return z;}}return SIGNS[0];}
function getMoon(y,m,d){const days=(new Date(y,m-1,d)-new Date(2000,0,1))/86400000;return SIGNS[Math.floor((((days%27.32)+27.32)%27.32/27.32)*12)%12];}
function getAsc(h,m){return SIGNS[(Math.floor(h/2)+m+6)%12];}

// ═══════════════════════════════════════
//  질문 카테고리
// ═══════════════════════════════════════
const CATS=[
  {id:"love",icon:"💕",label:"연애",qs:["요즘 좋아하는 사람이 생겼어요. 이 감정이 맞는 걸까요?","언제쯤 새로운 인연이 찾아올까요?","지금 사귀는 사람이랑 미래가 있을까요?","짝사랑하는 사람이 나를 어떻게 생각할까요?","전 남자친구랑 다시 될 수 있을까요?"]},
  {id:"work",icon:"🌙",label:"직장",qs:["이직을 고민 중인데 지금 타이밍이 맞을까요?","직장 상사가 너무 힘들어요. 어떻게 해야 할까요?","나에게 진짜 맞는 일이 뭔지 알고 싶어요","승진할 수 있는 운이 있을까요?","이 회사에서 계속 다녀야 할까요?"]},
  {id:"money",icon:"✨",label:"돈·재물",qs:["올해 돈 들어오는 운이 있을까요?","투자를 시작하기 좋은 시기인가요?","내 집 마련, 언제쯤 가능할까요?","부업이나 사이드 잡을 시작해도 될까요?","돈이 계속 나가는데 언제 안정될까요?"]},
  {id:"health",icon:"🌸",label:"건강",qs:["요즘 너무 피곤한데 기운이 없는 이유가 있을까요?","몸에서 특히 조심해야 할 부분이 있나요?","스트레스가 너무 심해요. 해소 방법이 있을까요?","다이어트나 운동, 지금 시작해도 될까요?"]},
  {id:"relation",icon:"🫧",label:"인간관계",qs:["주변에 나한테 안 좋은 사람이 있는 것 같아요","친한 친구랑 사이가 멀어진 것 같아요","새로운 환경에서 잘 적응할 수 있을까요?","나는 어떤 사람들과 잘 맞나요?"]},
  {id:"family",icon:"🏡",label:"가족",qs:["가족이랑 갈등이 생겼어요. 어떻게 풀어야 할까요?","결혼하기 좋은 시기가 언제인가요?","지금 연인과 결혼해도 될까요?","부모님과의 관계, 좋아질 수 있을까요?"]},
  {id:"future",icon:"🔮",label:"미래",qs:["올해 내 인생에서 가장 중요한 것이 뭔가요?","지금 걷고 있는 방향이 맞는지 불안해요","내가 진짜 잘할 수 있는 게 뭔지 모르겠어요","올해 좋은 일이 생길까요?","10년 후 나는 어떤 모습일까요?"]},
  {id:"move",icon:"🗺️",label:"이사·여행",qs:["이사를 고민 중인데 지금 시기가 맞을까요?","이 동네가 나한테 맞는 곳일까요?","해외로 나가는 게 나에게 도움이 될까요?","유학이나 워킹홀리데이, 가도 될까요?"]},
];

const PKGS=[
  {id:"seed",emoji:"🌱",name:"새싹팩",price:"990원",stars:1,per:"990원/회",hot:false},
  {id:"moon",emoji:"🌙",name:"달빛팩",price:"5,900원",stars:7,per:"843원/회",hot:false},
  {id:"star",emoji:"⭐",name:"별빛팩",price:"9,900원",stars:13,per:"762원/회",hot:true},
  {id:"cosmos",emoji:"🌟",name:"우주팩",price:"19,900원",stars:28,per:"711원/회",hot:false},
];

const LOAD_MSGS=[
  {t:"별빛이 당신의 이름을 찾고 있어요 🌟",s:"잠깐만요, 거의 다 왔어요"},
  {t:"하늘이 당신의 기운을 읽고 있어요 ✨",s:"태어난 순간의 에너지를 불러오는 중이에요"},
  {t:"사주와 별자리가 만나고 있어요 💫",s:"두 세계가 당신 이야기를 나누고 있어요"},
  {t:"당신에게 전할 말을 고르고 있어요 🌙",s:"오래 기다렸죠? 거의 다 됐어요"},
  {t:"기운이 모였어요! 이제 들려드릴게요 🎊",s:"당신의 이야기가 준비됐어요"},
];

// ═══════════════════════════════════════
//  CSS
// ═══════════════════════════════════════
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --cream:#FFFAF6;--peach:#FFF3EC;--lav:#F6F0FF;--white:#FFFFFF;
  --pp:#7C5CBF;--pp2:#9B7DD6;--pp3:#C4AAEE;--pp4:#EDE6FF;--pp5:#F8F4FF;
  --pk:#E8627A;--pk2:#F5899A;--pk3:#FFD6DD;--pk4:#FFF0F3;
  --gold:#C08820;--gold2:#E8B048;--gold3:#FFF6E0;
  --teal:#3A9BAE;--sage:#5A9A6A;
  --txt:#26193A;--txt2:#52466A;--txt3:#8A7FA0;--txt4:#BEB5CC;
  --bdr:#EBE3FF;--bdr2:#DDD4F0;
  --serif:'Noto Serif KR',serif;--sans:'Noto Sans KR',sans-serif;
  --sh1:0 2px 12px rgba(124,92,191,.09);
  --sh2:0 4px 28px rgba(124,92,191,.13);
  --sh3:0 8px 48px rgba(124,92,191,.18);
}
html,body{background:var(--cream);color:var(--txt);font-family:var(--sans);min-height:100vh;-webkit-font-smoothing:antialiased}
.app{min-height:100vh;position:relative;overflow-x:hidden}
.bg{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.blob{position:absolute;border-radius:50%;filter:blur(70px);animation:bfloat var(--d,20s) var(--dl,0s) infinite alternate ease-in-out}
@keyframes bfloat{0%{transform:translate(0,0)}100%{transform:translate(var(--tx,15px),var(--ty,20px))}}
.spark{position:absolute;animation:sparkle var(--d,4s) var(--dl,0s) infinite}
@keyframes sparkle{0%,100%{opacity:0;transform:scale(0)}45%,55%{opacity:.6;transform:scale(1)}}
.rel{position:relative;z-index:1}
.page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 14px 36px}

/* 뒤로 */
.bk{position:absolute;top:14px;left:14px;width:34px;height:34px;border-radius:50%;background:var(--white);border:1.5px solid var(--bdr);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--txt3);font-size:.82rem;box-shadow:var(--sh1);transition:all .22s;z-index:20}
.bk:hover{border-color:var(--pp);color:var(--pp);transform:scale(1.08)}

/* 스텝 */
.stps{display:flex;gap:5px;justify-content:center;margin-bottom:.4rem}
.sd{height:5px;border-radius:3px;transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.sd.done{width:18px;background:var(--pp2)}.sd.act{width:26px;background:linear-gradient(90deg,var(--pk),var(--pp));box-shadow:0 2px 8px rgba(124,92,191,.28)}.sd.todo{width:7px;background:var(--bdr2)}
.stplbl{font-size:.65rem;color:var(--txt4);text-align:center;margin-bottom:1.1rem;letter-spacing:.07em}

/* 랜딩 */
.land{text-align:center;max-width:380px}
.lbadge{display:inline-flex;align-items:center;gap:.4rem;background:linear-gradient(135deg,rgba(232,98,122,.1),rgba(124,92,191,.1));border:1.5px solid rgba(124,92,191,.18);border-radius:50px;padding:.4rem 1rem;font-size:.75rem;color:var(--pp);margin-bottom:1.5rem;animation:fup .8s .1s both}
.ltitle{font-family:var(--serif);font-size:clamp(4.5rem,14vw,8rem);font-weight:700;letter-spacing:.2em;line-height:1;background:linear-gradient(140deg,var(--gold2) 0%,var(--pk) 38%,var(--pp) 72%,#4AC8C8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-size:200%;animation:shimmer 5s linear infinite,fup .8s .2s both}
@keyframes shimmer{0%{background-position:0%}100%{background-position:200%}}
.len{font-size:.75rem;color:var(--txt4);letter-spacing:.42em;text-transform:uppercase;margin-bottom:1.1rem;animation:fup .8s .3s both;font-weight:300}
.lcopy{font-size:.95rem;color:var(--txt2);line-height:2;margin-bottom:2.2rem;font-weight:300;animation:fup .8s .4s both}
.lcopy em{font-style:normal;color:var(--pp);font-weight:600}
.lcta{display:inline-flex;align-items:center;gap:.5rem;padding:.95rem 2.4rem;border:none;border-radius:50px;background:linear-gradient(135deg,var(--pk),var(--pp));color:#fff;font-size:.95rem;font-weight:700;font-family:var(--sans);cursor:pointer;letter-spacing:.02em;box-shadow:0 4px 24px rgba(124,92,191,.32);transition:all .3s;animation:fup .8s .5s both,lcpulse 3.5s 1.3s infinite}
@keyframes lcpulse{0%,100%{box-shadow:0 4px 24px rgba(124,92,191,.32)}50%{box-shadow:0 4px 32px rgba(124,92,191,.48),0 0 0 6px rgba(124,92,191,.08)}}
.lcta:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 8px 32px rgba(124,92,191,.42)}
.ltags{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin-top:1.8rem;animation:fup .8s .6s both}
.ltag{padding:.35rem .8rem;background:var(--white);border:1.5px solid var(--bdr);border-radius:50px;font-size:.72rem;color:var(--txt3);box-shadow:var(--sh1)}
.lrev{display:flex;gap:.45rem;align-items:center;justify-content:center;margin-top:1.3rem;font-size:.72rem;color:var(--txt4);animation:fup .8s .7s both}

/* 카드 (입력) */
.card{background:var(--white);border:1.5px solid var(--bdr);border-radius:28px;padding:1.7rem 1.5rem;width:100%;max-width:460px;box-shadow:var(--sh2);animation:fup .5s cubic-bezier(.34,1.56,.64,1)}
.ct{font-family:var(--serif);font-size:1.15rem;color:var(--pp);text-align:center;margin-bottom:.3rem;font-weight:700}
.cs{font-size:.78rem;color:var(--txt3);text-align:center;margin-bottom:1.5rem;line-height:1.85}
.lbl{font-size:.67rem;color:var(--txt3);margin-bottom:.28rem;display:block;font-weight:600;letter-spacing:.05em}
.inp{width:100%;background:var(--lav);border:1.5px solid var(--bdr);border-radius:13px;padding:.65rem .85rem;color:var(--txt);font-size:.84rem;font-family:var(--sans);transition:all .2s;margin-bottom:.8rem}
.inp:focus{outline:none;border-color:var(--pp);background:var(--white);box-shadow:0 0 0 3px rgba(124,92,191,.09)}
.inp::placeholder{color:var(--txt4)}
select.inp option{background:#fff}
.row{display:flex;gap:.55rem}
.col{flex:1;min-width:0}
.grow{display:flex;gap:.45rem;margin-bottom:.8rem}
.gbtn{flex:1;padding:.62rem 2px;border-radius:12px;border:1.5px solid var(--bdr);background:transparent;color:var(--txt3);cursor:pointer;font-size:.78rem;transition:all .2s;font-family:var(--sans);font-weight:500}
.gbtn.on{border-color:var(--pp);background:var(--pp4);color:var(--pp);font-weight:700}
.togrow{display:flex;align-items:center;gap:.65rem;margin-bottom:.8rem;padding:.58rem .85rem;background:var(--lav);border-radius:13px;cursor:pointer;border:1.5px solid var(--bdr)}
.tog{width:36px;height:20px;border-radius:10px;border:none;cursor:pointer;position:relative;transition:background .25s;flex-shrink:0}
.tog.on{background:linear-gradient(135deg,var(--pp),var(--pk))}.tog.off{background:var(--bdr2)}
.tog::after{content:"";position:absolute;width:14px;height:14px;background:#fff;border-radius:50%;top:3px;transition:left .25s;box-shadow:0 1px 3px rgba(0,0,0,.14)}
.tog.on::after{left:19px}.tog.off::after{left:3px}
.toglbl{font-size:.77rem;color:var(--txt2)}
/* 팔자 */
.pillars{display:flex;gap:4px;margin:.75rem 0 .35rem}
.pillar{flex:1;background:linear-gradient(180deg,var(--gold3),var(--lav));border:1.5px solid rgba(192,136,32,.18);border-radius:14px;padding:.55rem 3px;text-align:center}
.plbl{font-size:.53rem;color:var(--txt4);font-weight:600;letter-spacing:.04em;margin-bottom:.18rem}
.phj{font-size:1.05rem;font-family:serif;color:var(--gold);font-weight:700;line-height:1.15}
.pkr{font-size:.58rem;color:var(--txt3);margin-top:.12rem}
.orbar{height:4px;border-radius:3px;overflow:hidden;display:flex;gap:2px;margin-top:.35rem}
.obs{border-radius:2px;transition:flex .6s}
.ortags{display:flex;gap:3px;flex-wrap:wrap;margin-top:.35rem}
.ortag{padding:.18rem .45rem;border-radius:6px;font-size:.6rem;font-weight:700}
/* 기운 카드 */
.epage{width:100%;max-width:530px}
.eintro{text-align:center;margin-bottom:1.1rem}
.etitle{font-family:var(--serif);font-size:1.25rem;color:var(--pp);font-weight:700;margin-bottom:.3rem}
.esub{font-size:.79rem;color:var(--txt3);line-height:1.9}
.esub em{font-style:normal;color:var(--pk);font-weight:600}
.mychips{display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;margin-bottom:.95rem}
.chip{padding:.28rem .65rem;background:var(--white);border:1.5px solid var(--bdr);border-radius:50px;font-size:.7rem;color:var(--txt2);box-shadow:var(--sh1)}
.chip b{color:var(--pp)}
.ecards{display:flex;gap:10px}
.ecard{flex:1;border-radius:24px;padding:1.3rem .95rem 1rem;cursor:pointer;transition:all .35s cubic-bezier(.34,1.56,.64,1);border:2px solid var(--bdr);background:var(--white);position:relative;overflow:hidden}
.ecard::after{content:"";position:absolute;inset:0;opacity:0;transition:opacity .35s;border-radius:inherit;pointer-events:none}
.ecard.sj::after{background:linear-gradient(155deg,rgba(192,136,32,.06),rgba(124,92,191,.04))}
.ecard.as::after{background:linear-gradient(155deg,rgba(58,155,174,.06),rgba(90,154,106,.04))}
.ecard.sj:hover,.ecard.sj.picked{border-color:var(--gold2);box-shadow:0 6px 26px rgba(192,136,32,.18);transform:translateY(-5px) rotate(-1.2deg)}
.ecard.as:hover,.ecard.as.picked{border-color:var(--teal);box-shadow:0 6px 26px rgba(58,155,174,.18);transform:translateY(-5px) rotate(1.2deg)}
.ecard:hover::after,.ecard.picked::after{opacity:1}
.eicon{font-size:2rem;text-align:center;margin-bottom:.55rem;display:block}
.ekind{font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;text-align:center;font-weight:700;margin-bottom:.22rem}
.ecard.sj .ekind{color:var(--gold)}.ecard.as .ekind{color:var(--teal)}
.ename{font-family:var(--serif);font-size:.95rem;font-weight:700;text-align:center;color:var(--txt);margin-bottom:.45rem}
.ewho{font-size:.7rem;text-align:center;padding:.28rem .45rem;border-radius:8px;margin-bottom:.4rem;font-weight:600;line-height:1.5}
.ecard.sj .ewho{background:rgba(192,136,32,.09);color:var(--gold)}
.ecard.as .ewho{background:rgba(58,155,174,.09);color:var(--teal)}
.efeel{font-size:.7rem;color:var(--txt3);text-align:center;line-height:1.75;margin-bottom:.4rem}
.etoday{font-size:.67rem;text-align:center;padding:.35rem .5rem;border-radius:9px;background:var(--pp4);color:var(--pp);margin-bottom:.75rem;line-height:1.6}
.eor{display:flex;gap:3px;justify-content:center;flex-wrap:wrap;margin-bottom:.75rem}
.eorbadge{padding:.15rem .42rem;border-radius:5px;font-size:.58rem;font-weight:700}
.epbtn{width:100%;padding:.58rem;border-radius:11px;font-size:.76rem;font-weight:700;cursor:pointer;transition:all .25s;font-family:var(--sans)}
.ecard.sj .epbtn{border:2px solid var(--gold2);color:var(--gold);background:transparent}
.ecard.sj .epbtn:hover,.ecard.sj.picked .epbtn{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#fff;border-color:transparent}
.ecard.as .epbtn{border:2px solid var(--teal);color:var(--teal);background:transparent}
.ecard.as .epbtn:hover,.ecard.as.picked .epbtn{background:linear-gradient(135deg,var(--teal),#2A8FA0);color:#fff;border-color:transparent}
.eboth{text-align:center;font-size:.68rem;color:var(--txt4);margin-top:.85rem}
/* 채팅 */
.chatshell{width:100%;max-width:500px;border-radius:28px;overflow:hidden;box-shadow:var(--sh3);animation:fup .5s cubic-bezier(.34,1.56,.64,1)}
.chtop{background:linear-gradient(135deg,#7C5CBF,#E8627A);padding:.9rem 1.3rem}
.chtitle{font-family:var(--serif);font-size:1rem;color:#fff;font-weight:700}
.chsub{font-size:.7rem;color:rgba(255,255,255,.7);margin-top:.18rem}
.chbody{background:var(--peach);padding:.85rem .9rem;max-height:40vh;overflow-y:auto;min-height:170px}
.cats{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:.75rem}
.catbtn{padding:.3rem .65rem;border-radius:50px;border:1.5px solid var(--bdr2);background:var(--white);color:var(--txt3);cursor:pointer;font-size:.7rem;font-family:var(--sans);white-space:nowrap;transition:all .2s}
.catbtn.on{background:linear-gradient(135deg,var(--pp),var(--pk));border-color:transparent;color:#fff;font-weight:700;box-shadow:0 2px 10px rgba(124,92,191,.22)}
.qlist{display:flex;flex-direction:column;gap:4px}
.qitem{background:var(--white);border:1.5px solid var(--bdr);border-radius:13px 13px 13px 3px;padding:.52rem .8rem;cursor:pointer;font-size:.77rem;color:var(--txt2);text-align:left;font-family:var(--sans);line-height:1.55;transition:all .2s;box-shadow:0 1px 4px rgba(124,92,191,.04)}
.qitem:hover{border-color:var(--pp3);color:var(--pp);box-shadow:0 2px 10px rgba(124,92,191,.09)}
.qitem.on{border-color:var(--pp);background:var(--pp4);color:var(--pp);font-weight:600}
.qitem.on::before{content:"✓  "}
.qitem:disabled{opacity:.38;cursor:not-allowed}
.ort{display:flex;align-items:center;gap:.6rem;margin:.65rem 0;color:var(--txt4);font-size:.68rem}
.ort::before,.ort::after{content:"";flex:1;height:1px;background:var(--bdr2)}
.diyinp{width:100%;background:var(--white);border:1.5px solid var(--bdr);border-radius:12px;padding:.62rem .82rem;color:var(--txt);font-size:.8rem;resize:none;height:65px;font-family:var(--sans);transition:border-color .2s}
.diyinp:focus{outline:none;border-color:var(--pp);box-shadow:0 0 0 3px rgba(124,92,191,.08)}
.diyrow{display:flex;justify-content:space-between;align-items:center;margin-top:.25rem}
.addbtn{font-size:.68rem;padding:.25rem .6rem;border-radius:7px;border:1.5px solid var(--pp3);background:transparent;color:var(--pp);cursor:pointer;font-family:var(--sans);transition:all .2s}
.addbtn:hover{background:var(--pp4)}
.chfooter{background:var(--white);padding:.9rem 1.1rem;border-top:1.5px solid var(--bdr)}
.sellbl{font-size:.66rem;color:var(--pp);font-weight:700;letter-spacing:.05em;margin-bottom:.4rem}
.selitem{display:flex;align-items:flex-start;gap:.45rem;background:var(--pp4);border:1px solid var(--pp3);border-radius:9px;padding:.4rem .65rem;margin-bottom:.28rem}
.selnum{background:linear-gradient(135deg,var(--pp),var(--pk));color:#fff;border-radius:50%;width:16px;height:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.57rem;font-weight:700;margin-top:1px}
.seltxt{flex:1;font-size:.73rem;color:var(--txt);line-height:1.45}
.seldel{background:none;border:none;color:var(--txt4);cursor:pointer;font-size:.78rem;padding:0;line-height:1;flex-shrink:0}
.seldel:hover{color:var(--pk)}
.qstat{font-size:.7rem;color:var(--txt3);text-align:center;margin:.55rem 0;line-height:1.65}
.qstat strong{color:var(--pp)}
.pkgs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:.55rem}
.pkg{background:var(--lav);border:2px solid var(--bdr);border-radius:13px;padding:.55rem .35rem;cursor:pointer;transition:all .25s;text-align:center;position:relative}
.pkg:hover{transform:translateY(-2px);border-color:var(--pp3)}
.pkg.hot{border-color:var(--pp3)}
.pkg.chosen{border-color:var(--pp);background:var(--pp4);box-shadow:0 2px 10px rgba(124,92,191,.14)}
.pkgemoji{font-size:1.1rem;margin-bottom:.15rem}
.pkgname{font-size:.67rem;font-weight:700;color:var(--txt);margin-bottom:.1rem}
.pkgprice{font-size:.82rem;font-weight:700;color:var(--gold)}
.pkgper{font-size:.57rem;color:var(--txt4);margin-top:.08rem}
.pkghot{position:absolute;top:-7px;right:-4px;background:linear-gradient(135deg,var(--pk),var(--pp));color:#fff;font-size:.52rem;padding:.12rem .35rem;border-radius:50px;font-weight:700}
.freenote{font-size:.65rem;color:var(--txt4);text-align:center;line-height:1.65;margin-bottom:.6rem}
.askcta{width:100%;padding:.8rem;border:none;border-radius:13px;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .3s;font-family:var(--sans);letter-spacing:.02em;margin-bottom:.38rem}
.askcta.main{background:linear-gradient(135deg,var(--pk),var(--pp));color:#fff;box-shadow:0 4px 18px rgba(124,92,191,.28)}
.askcta.main:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 24px rgba(124,92,191,.38)}
.askcta.main:disabled{opacity:.38;cursor:not-allowed;transform:none}
.askcta.free{background:transparent;border:2px solid var(--bdr2);color:var(--txt3);font-size:.78rem;padding:.58rem}
.askcta.free:hover{border-color:var(--pp3);color:var(--pp)}
/* 로딩 */
.loadpage{text-align:center;padding:2rem 1rem;animation:fup .6s ease}
.loadcrystal{width:96px;height:96px;margin:0 auto 1.7rem;position:relative}
.lci{width:78px;height:78px;border-radius:50%;background:radial-gradient(circle at 30% 28%,#FFF0A0,var(--pk),var(--pp),#1A0F2E);box-shadow:0 0 32px rgba(124,92,191,.38),inset 0 0 16px rgba(255,255,255,.08);animation:cpulse 2s infinite;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
@keyframes cpulse{0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 32px rgba(124,92,191,.38)}50%{transform:translate(-50%,-50%) scale(1.1);box-shadow:0 0 52px rgba(124,92,191,.58)}}
.lcr1{position:absolute;inset:-5px;border-radius:50%;border:2px solid transparent;border-top-color:var(--pk);border-right-color:var(--pp);animation:spin 2.5s linear infinite}
.lcr2{position:absolute;inset:-11px;border-radius:50%;border:1.5px solid transparent;border-bottom-color:var(--gold2);border-left-color:var(--teal);animation:spin 4s linear infinite reverse}
@keyframes spin{to{transform:rotate(360deg)}}
.loadmsg{font-family:var(--serif);font-size:1.02rem;color:var(--pp);margin-bottom:.4rem;animation:msgfade .5s ease;line-height:1.5}
@keyframes msgfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.loadsub{font-size:.76rem;color:var(--txt3);margin-bottom:1.3rem;line-height:1.7}
.progwrap{width:180px;margin:0 auto;background:var(--bdr);border-radius:4px;height:4px;overflow:hidden}
.progfill{height:100%;background:linear-gradient(90deg,var(--pk),var(--pp),var(--gold2));border-radius:4px;transition:width 1s ease}
.progpct{font-size:.65rem;color:var(--txt4);margin-top:.4rem}
.fstars{display:flex;gap:.45rem;justify-content:center;margin-top:1.1rem}
.fstar{font-size:.82rem;animation:fstaranim 1.4s var(--dl,0s) infinite}
@keyframes fstaranim{0%,100%{opacity:.12;transform:translateY(0)}50%{opacity:1;transform:translateY(-5px)}}
/* 결과 */
.resshell{width:100%;max-width:540px;animation:fup .6s cubic-bezier(.34,1.56,.64,1)}
.rescard{background:var(--white);border:1.5px solid var(--bdr);border-radius:26px;padding:1.6rem 1.4rem;box-shadow:var(--sh3);max-height:88vh;overflow-y:auto}
.restop{display:flex;align-items:center;gap:.75rem;padding-bottom:.9rem;margin-bottom:.9rem;border-bottom:1.5px solid var(--bdr)}
.resav{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0}
.resav.sj{background:linear-gradient(135deg,var(--gold3),var(--lav));border:2px solid var(--gold2)}
.resav.as{background:linear-gradient(135deg,rgba(58,155,174,.12),var(--lav));border:2px solid var(--teal)}
.reswho{font-family:var(--serif);font-size:.88rem;color:var(--txt);font-weight:700}
.resmeta{font-size:.67rem;color:var(--txt4);margin-top:.22rem;line-height:1.5}
.resqwrap{margin-bottom:.85rem}
.resq{display:flex;gap:.45rem;align-items:flex-start;background:var(--lav);border:1px solid var(--bdr);border-radius:9px;padding:.45rem .75rem;margin-bottom:.28rem}
.rqn{font-size:.62rem;font-weight:700;color:var(--pp);flex-shrink:0;padding-top:.04rem}
.rqt{font-size:.74rem;color:var(--txt2);line-height:1.55}
.resbody{font-size:.83rem;line-height:2.1;color:var(--txt2);white-space:pre-wrap;padding:.4rem 0}
.resbody strong,.resbody b{color:var(--pp);font-weight:700}
.resbody em{font-style:normal;color:var(--pk)}
.upsell{background:linear-gradient(135deg,rgba(192,136,32,.07),rgba(124,92,191,.07));border:1.5px solid rgba(192,136,32,.22);border-radius:14px;padding:.9rem;margin-top:1rem;text-align:center}
.upt{font-family:var(--serif);font-size:.87rem;color:var(--gold);font-weight:700;margin-bottom:.28rem}
.upd{font-size:.73rem;color:var(--txt3);margin-bottom:.75rem;line-height:1.7}
.upbtn{width:100%;padding:.65rem;border:none;border-radius:11px;background:linear-gradient(135deg,var(--gold2),var(--gold));color:#fff;font-size:.8rem;font-weight:700;cursor:pointer;font-family:var(--sans)}
.racts{display:flex;gap:.45rem;margin-top:.85rem;flex-wrap:wrap}
.ract{flex:1;min-width:80px;padding:.55rem .35rem;border-radius:11px;border:1.5px solid var(--bdr);background:transparent;color:var(--txt3);cursor:pointer;font-size:.7rem;transition:all .2s;font-family:var(--sans)}
.ract:hover{border-color:var(--pp3);color:var(--pp)}
/* 공통 */
@keyframes fup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.hint{font-size:.61rem;color:var(--txt4)}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--pp3);border-radius:2px}
`;

// ═══════════════════════════════════════
//  앱
// ═══════════════════════════════════════
function Stps({cur}){
  const labels=["내 정보 입력","기운 선택","질문 고르기"];
  return(
    <div>
      <div className="stps">{[0,1,2].map(i=><div key={i} className={`sd ${i<cur?"done":i===cur?"act":"todo"}`}/>)}</div>
      <div className="stplbl">{labels[cur]}</div>
    </div>
  );
}

export default function App(){
  const [step,setStep]=useState(0);
  const [form,setForm]=useState({name:"",by:"",bm:"",bd:"",bh:"",gender:"",noTime:false});
  const [mode,setMode]=useState("");
  const [selQs,setSelQs]=useState([]);
  const [cat,setCat]=useState(0);
  const [diy,setDiy]=useState("");
  const [pkg,setPkg]=useState("star");
  const [result,setResult]=useState("");
  const [lp,setLp]=useState(0);
  const [lm,setLm]=useState(0);

  const [blobs]=useState(()=>[
    {w:350,h:350,x:"-6%",y:"-10%",c:"rgba(232,176,72,.16)",d:"19s",dl:"0s",tx:"22px",ty:"32px"},
    {w:300,h:300,x:"60%",y:"3%",c:"rgba(124,92,191,.13)",d:"23s",dl:"2s",tx:"-18px",ty:"26px"},
    {w:240,h:240,x:"12%",y:"60%",c:"rgba(232,98,122,.12)",d:"27s",dl:"4s",tx:"20px",ty:"-16px"},
    {w:180,h:180,x:"70%",y:"65%",c:"rgba(58,155,174,.1)",d:"21s",dl:"3s",tx:"-16px",ty:"20px"},
  ]);
  const [sparks]=useState(()=>Array.from({length:14},(_,i)=>({
    x:Math.random()*100,y:Math.random()*100,
    s:["✦","✧","⋆","·","˚"][i%5],
    sz:.75+Math.random()*.65,d:3+Math.random()*4,dl:Math.random()*3.5,
  })));

  const saju=(form.by&&form.bm&&form.bd)?getSaju(+form.by,+form.bm,+form.bd,form.noTime?12:+(form.bh||12)):null;
  const sun=(form.bm&&form.bd)?getSun(+form.bm,+form.bd):null;
  const moon=(form.by&&form.bm&&form.bd)?getMoon(+form.by,+form.bm,+form.bd):null;
  const asc=(!form.noTime&&form.bh&&form.bm)?getAsc(+form.bh,+form.bm):null;
  const age=form.by?new Date().getFullYear()-+form.by:0;
  const il=saju?ILGAN[saju.ilgan]:null;
  const formOk=form.by&&form.bm&&form.bd&&form.gender&&(form.noTime||form.bh);

  const addQ=q=>{if(selQs.length<3&&!selQs.includes(q)){setSelQs(p=>[...p,q]);setDiy("");}};
  const rmQ=i=>setSelQs(p=>p.filter((_,x)=>x!==i));

  useEffect(()=>{
    if(step!==4)return;
    setLp(0);setLm(0);
    const ts=[[0,500],[22,900],[48,900],[72,700],[92,500]];
    const ids=ts.map(([p,dur],i)=>{
      const delay=ts.slice(0,i).reduce((s,[,d])=>s+d,300);
      return setTimeout(()=>{setLp(p);setLm(i);},delay);
    });
    return()=>ids.forEach(clearTimeout);
  },[step]);

  // ── 시뮬레이션 응답 풀 (카테고리별 × 사주/점성술)
  const SIM_POOL = {
    love: {
      saju: [
        "**좋아하는 마음이 생겼을 때의 그 설렘**, 저도 느껴져요 💕\n\n지금 당신의 사주를 보면 **일간의 기운이 외향적으로 뻗어나가는 시기**예요. 관계에서 먼저 다가가도 좋은 흐름이 형성돼 있어요. 특히 이번 달은 인연의 기운이 활성화되어 있어서, 마음속에 담아두기보다 **가볍게 표현해보는 것**이 훨씬 유리해요.\n\n용기 내서 작은 것부터 시작해봐요. 밥 한 번 같이 먹자는 말 한마디가 생각보다 큰 변화를 만들 수 있어요 🌸",
        "새로운 인연에 대한 기대감, 정말 소중한 감정이에요 🌙\n\n**오행 흐름상 목(木)의 기운**이 강하게 작용 중인 시기라, 새로운 시작과 만남에 굉장히 유리한 운세예요. 다만 너무 급하게 결론을 내리려 하지 말고, **천천히 상대를 알아가는 과정**을 즐기면 더 깊은 인연으로 이어질 가능성이 높아요.\n\n지금 주변에서 자주 마주치는 사람에게 집중해봐요. 인연은 생각보다 가까이 있을 수 있거든요 ✨",
      ],
      astro: [
        "그 두근거림, 정말 소중한 신호예요 💕\n\n**태양궁의 에너지가 지금 감정을 증폭**시키고 있어서, 평소보다 감정이 더 생생하게 느껴지는 시기예요. 이건 나쁜 게 아니라, 지금 당신이 그만큼 열려 있다는 뜻이에요. **달궁의 직관**을 믿어봐요 — 왠지 끌린다는 느낌, 그냥 지나치면 아쉬울 수 있어요.\n\n별자리는 지금 당신에게 '한 번 가봐'라고 속삭이고 있어요. 망설임보다 설렘을 선택해봐요 🌟",
      ],
    },
    work: {
      saju: [
        "이직 고민, 그 마음이 얼마나 무거울지 알 것 같아요 🌙\n\n사주를 보면 지금은 **변화의 기운이 서서히 준비되는 단계**예요. 당장 움직이기보다 앞으로 1~2달 사이에 더 명확한 기회가 보일 거예요. 현재 직장에서 마무리 지을 것들을 정리하면서 **동시에 조용히 준비**하는 게 가장 좋은 전략이에요.\n\n이직 결정 전에 '왜 떠나고 싶은가'보다 '어디로 가고 싶은가'를 먼저 정해봐요. 방향이 있으면 타이밍은 자연스럽게 따라와요 ✨",
        "직장에서 힘든 시간을 보내고 계시는군요. 정말 수고 많으세요 💙\n\n**일간의 기운과 현재 흐름**을 보면, 이 갈등은 영구적인 상황이 아니에요. 오히려 지금의 어려움이 당신을 더 단단하게 만들어주는 과정이에요. **상사와의 관계**에서는 직접 충돌보다 '제3의 방법'을 찾는 게 이번 운세에서 더 효과적이에요.\n\n오늘 퇴근 후 딱 30분, 나만의 회복 루틴을 만들어봐요. 작은 것부터 채워가다 보면 상황이 달라져요 🌸",
      ],
      astro: [
        "커리어 고민, 혼자 안고 있었던 거 아닌가요? 이제 털어봐요 🌙\n\n**태양궁 에너지 특성상** 지금 당신은 더 큰 무대를 원하는 시기예요. 현재 환경이 답답하게 느껴진다면 그건 당신이 성장했다는 신호일 수 있어요. **상승궁의 흐름**이 외부적인 변화를 지지하고 있어서, 이직을 고려하고 있다면 나쁜 타이밍은 아니에요.\n\n단, 충동적으로 결정하지 말고 3개월 안에 구체적인 조건을 정해두고 움직여봐요 ✨",
      ],
    },
    money: {
      saju: [
        "돈 걱정은 정말 지치게 하죠. 그 마음 충분히 이해해요 💛\n\n**재물운을 보면 현재는 지출이 많은 사이클**에 있어요. 하지만 이 흐름은 오래 가지 않아요. 앞으로 2~3달 내에 **금(金)의 기운이 올라오면서 수입이 안정**되는 구간이 있어요. 지금은 새로운 투자보다 현금을 지키는 데 집중하는 게 훨씬 현명해요.\n\n당장 돈을 '버는' 방법보다 '새는 곳을 막는' 것부터 시작해봐요. 고정 지출 항목 하나만 줄여봐도 체감이 달라져요 ✨",
      ],
      astro: [
        "재물 운, 솔직히 제일 궁금한 거잖아요 😄💛\n\n**태양궁의 흙 원소 에너지**가 안정적인 재물 축적을 도와주는 성향이에요. 지금 시기는 한 방을 노리기보다 **꾸준한 저축과 작은 수입원을 늘려가는 전략**이 별자리 흐름과 잘 맞아요. 달궁의 감각을 믿고 직관적으로 '좋다' 느끼는 방향으로 천천히 움직여봐요.\n\n이번 달 안에 자동이체 하나라도 만들어봐요. 의지보다 시스템이 돈을 모아줘요 🌟",
      ],
    },
    health: {
      saju: [
        "피곤하다는 느낌, 몸이 보내는 신호를 잘 캐치하셨어요 🌿\n\n**오행 중 수(水)의 기운이 약해진 상태**예요. 신장과 방광, 그리고 전반적인 활력 에너지가 고갈되고 있는 흐름이에요. 지금 가장 필요한 건 '열심히 하기'가 아니라 **충분한 수분 섭취와 숙면**이에요. 특히 밤 11시 이전에 자는 루틴이 지금 당신에게 가장 효과적인 보약이에요.\n\n이번 주말, 아무 계획 없이 그냥 쉬어봐요. 죄책감 없이 쉬는 게 가장 큰 치료예요 🌸",
      ],
      astro: [
        "몸이 힘들다고 말하고 있는데 잘 들어주고 있나요? 🌿\n\n**달궁의 에너지**는 몸의 리듬에 굉장히 민감해요. 지금 피로가 쌓인 건 물리적인 이유만이 아니라 **감정적인 소진**도 함께 작용하고 있을 가능성이 높아요. 억지로 에너지를 끌어올리려 하기보다, 지금은 **회복의 시간**으로 받아들이는 게 더 현명해요.\n\n오늘 저녁, 폰을 내려놓고 10분만 조용히 누워있어봐요. 생각보다 많은 게 풀릴 거예요 💙",
      ],
    },
    relation: {
      saju: [
        "인간관계 스트레스, 때론 일보다 더 힘들 때 있잖아요 🫧\n\n**사주 흐름상 지금은 관계를 정리하고 재편하는 시기**예요. 맞지 않는 인연이 자연스럽게 멀어지고, 진짜 내 편이 보이는 구간이에요. 불편한 관계 때문에 에너지 낭비하지 말고, **나와 진짜 맞는 사람 1~2명에게 집중**하는 게 훨씬 나아요.\n\n지금 당신 곁에서 묵묵히 있어주는 사람에게 먼저 연락해봐요. 그 사람이 진짜예요 🌸",
      ],
      astro: [
        "관계에서 에너지를 많이 쓰고 있는 것 같아요 🫧\n\n**태양궁 특성상** 당신은 관계에서 많이 주는 타입이에요. 근데 지금 달궁의 흐름을 보면 **경계선을 만들어야 하는 시기**예요. 다 맞춰주려다 지치는 패턴, 그게 지금 반복되고 있지 않나요? 잠깐 멈추고 '내가 진짜 원하는 게 뭔지'를 먼저 생각해봐요.\n\n'노'라고 말하는 연습을 해봐요. 처음엔 어색해도 괜찮아요 💪",
      ],
    },
    family: {
      saju: [
        "가족 갈등은 마음이 더 복잡하죠. 다 알면서도 힘든 거잖아요 🏡\n\n**사주에서 가족 관계는 일주(日柱)와 월주(月柱)의 상호작용**으로 읽어요. 지금은 서로 다른 흐름에 있어서 충돌이 생기는 시기예요. 하지만 이 긴장감은 오래가지 않아요. **먼저 한 발 물러서는 사람이 관계의 주도권**을 갖게 돼요.\n\n오늘은 말보다 작은 행동 하나로 마음을 표현해봐요. 밥 같이 먹자는 한마디가 생각보다 큰 다리가 될 수 있어요 💛",
      ],
      astro: [
        "가족이랑 갈등이 있을 때 그 답답함, 정말 알아요 🏡\n\n**태양궁과 달궁의 조합**을 보면 지금 당신은 감정적으로 많이 예민해진 상태예요. 상대방 말이 더 크게 들리고, 작은 것도 상처로 남는 시기예요. 이럴 때 대화는 오히려 갈등을 키울 수 있어요. **잠시 물리적 거리를 두는 것**이 가장 현명한 방법이에요.\n\n지금 당장 해결하려 하지 말고, 일주일만 각자의 시간을 가져봐요 🌿",
      ],
    },
    future: {
      saju: [
        "방향을 잃은 것 같은 느낌, 그거 정말 외로운 감각이에요 🔮\n\n**사주 전체 흐름을 보면 지금은 '준비의 계절'**이에요. 당장 눈에 보이는 결과가 없어도, 지금 쌓고 있는 것들이 나중에 한꺼번에 꽃을 피우는 구조예요. 초조하게 속도를 높이기보다 **지금 내가 즐길 수 있는 것에 집중**하는 게 훨씬 현명해요.\n\n오늘 딱 한 가지만 물어봐요 — '오늘 뭐하면 기분이 나아질까?' 그 대답이 방향이에요 🌱",
        "올해 어떻게 흘러갈지 궁금하죠 🔮\n\n**올해 운의 큰 흐름은 '관계와 내면의 균형'**이에요. 외부적인 성취보다 내가 진짜 원하는 게 뭔지 알아가는 해예요. 특히 상반기엔 **자신을 재정비하는 기회**가 많이 생기고, 하반기로 갈수록 그 준비가 구체적인 결과로 이어지기 시작해요.\n\n지금 잘 하고 있어요. 느리게 가는 것처럼 보여도, 방향이 맞으면 결국 도착해요 ✨",
      ],
      astro: [
        "지금 걷고 있는 길이 맞는지 불안한 거, 정말 자연스러운 감정이에요 🔮\n\n**태양궁의 에너지**는 원래 깊은 질문을 즐기는 성향이에요. 그게 때로는 불안처럼 느껴지지만, 사실은 **더 좋은 삶을 향한 레이더**가 작동하고 있는 거예요. 달궁의 직관을 믿어봐요 — 지금 '뭔가 아닌 것 같다'는 느낌이 있다면, 그 느낌이 맞을 가능성이 높아요.\n\n오늘 밤 조용히 앉아서 '1년 후 나는 어떤 모습이면 좋을까'를 적어봐요 🌙",
      ],
    },
    move: {
      saju: [
        "이사 타이밍 고민, 생각보다 많은 분들이 물어보는 질문이에요 🗺️\n\n**방위와 시기 모두 중요한데**, 지금 당신의 사주 흐름상 변화에 대한 기운이 우호적으로 열려 있어요. 특히 **북쪽이나 동쪽 방향**으로의 이동이 긍정적인 기운을 가져다줄 가능성이 높아요. 다만 계약이나 서류 작업은 서두르지 말고 꼼꼼하게 확인하는 게 중요해요.\n\n새 공간을 고를 때 '여기서 아침을 맞이하고 싶다'는 느낌이 드는 곳을 선택해봐요 🏡",
      ],
      astro: [
        "새로운 곳으로 가고 싶다는 마음, 변화를 원하는 신호예요 🗺️\n\n**태양궁의 탐험 에너지**가 지금 활성화되어 있어요. 새로운 환경에 대한 적응력이 평소보다 높은 시기라 이사나 여행을 계획하기 좋아요. **달궁의 감각**으로 '느낌이 오는 공간'을 찾아봐요 — 논리보다 직관이 더 좋은 선택을 만들어줄 시기예요.\n\n주말에 이사 고려 중인 동네를 한 번 산책해봐요. 발이 편한 곳이 마음도 편한 곳이에요 🌿",
      ],
    },
  };

  const getSimResult = () => {
    const name = form.name || "당신";
    const modeLabel = mode === "saju" ? "사주" : "별자리";
    const parts = selQs.map((q, idx) => {
      // 카테고리 맞추기
      let catId = "future";
      for(const c of CATS){ if(c.qs.includes(q)){ catId=c.id; break; } }
      const pool = SIM_POOL[catId]?.[mode] || SIM_POOL.future[mode] || SIM_POOL.future.saju;
      const answer = pool[idx % pool.length];
      return selQs.length > 1 ? `**${idx+1}번 질문** — ${q}\n\n${answer}` : answer;
    });
    const header = `안녕하세요, ${name}님 💫 ${modeLabel} 기운으로 답해드릴게요.\n\n`;
    return header + parts.join("\n\n---\n\n");
  };

  // ── 실제 Claude API 호출 ──
  const askClaude = async () => {
    if (!selQs.length) return;
    setStep(4);

    const sys = `당신은 한국 전통 사주 명리학과 서양 점성술을 깊이 이해하는 따뜻한 AI 상담가예요.
말투는 친근한 경어체로, 마치 오랜 친구가 진심으로 들어주듯이 답해주세요.
이모지를 자연스럽게 써주시고, 딱딱하거나 너무 공식적인 표현은 피해주세요.
각 질문에 대해:
1. 그 마음에 공감해주세요 (1-2문장)
2. 사주/점성술 데이터를 바탕으로 따뜻하게 해석해주세요 (3-4문장)
3. 구체적이고 실천 가능한 조언을 해주세요 (1-2문장)
한 질문당 220-280자, 여러 질문이면 각각 번호 붙여서 답해주세요. **중요 키워드**는 볼드로 강조해주세요.`;

    const age = form.by ? new Date().getFullYear() - +form.by : 0;
    let ctx = `[${form.name || "고객님"}에 대한 정보]\n나이: ${age}세 / 성별: ${form.gender}\n`;
    if (mode === "saju" && saju) {
      ctx += `[사주 정보]\n연주:${saju.yeon.g}${saju.yeon.j} 월주:${saju.wol.g}${saju.wol.j} 일주:${saju.il.g}${saju.il.j} 시주:${saju.si.g}${saju.si.j}\n일간:${saju.ilgan} / 오행분포:${Object.entries(saju.or).map(([k,v]) => k+v+"개").join(" ")}\n`;
    } else if (mode === "astro" && sun) {
      ctx += `[점성술 정보]\n태양궁:${sun.n}(${sun.s}) / 달궁:${moon?.n || "?"} / 상승궁:${asc?.n || "시각 미입력"}\n`;
    }
    ctx += `\n[오늘의 질문]\n${selQs.map((q, i) => (i+1)+". "+q).join("\n")}`;

    try {
      // 로컬: vite proxy → /api/ask
      // Vercel 배포: /api/ask (serverless function)
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys, userMessage: ctx }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "API 오류");
      }

      setLp(100); setLm(4);
      setTimeout(() => {
        setResult(data.text || "해석 중 오류가 났어요. 다시 시도해봐요 🌙");
        setStep(5);
      }, 900);

    } catch (err) {
      console.error("askClaude error:", err);
      // API 실패 시 시뮬 결과로 폴백
      setLp(100); setLm(4);
      setTimeout(() => {
        setResult(getSimResult() + "\n\n*(현재 데모 모드예요. API 키 연동 후 실제 AI 답변을 받을 수 있어요 🌙)*");
        setStep(5);
      }, 900);
    }
  };

  const fmt=t=>t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>");



  return(
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="bg">
          {blobs.map((b,i)=>(
            <div key={i} className="blob" style={{width:b.w,height:b.h,left:b.x,top:b.y,background:`radial-gradient(circle,${b.c},transparent 70%)`}}
              ref={el=>{if(el){el.style.setProperty("--d",b.d);el.style.setProperty("--dl",b.dl);el.style.setProperty("--tx",b.tx);el.style.setProperty("--ty",b.ty);}}}/>
          ))}
          {sparks.map((s,i)=>(
            <div key={i} className="spark" style={{left:`${s.x}%`,top:`${s.y}%`,fontSize:`${s.sz}rem`,color:"rgba(124,92,191,.28)"}}
              ref={el=>{if(el){el.style.setProperty("--d",`${s.d}s`);el.style.setProperty("--dl",`${s.dl}s`);}}}>{s.s}</div>
          ))}
        </div>

        <div className="rel">

          {/* ── 0 랜딩 ── */}
          {step===0&&(
            <div className="page">
              <div className="land">
                <div className="lbadge">✦ AI 사주 × 점성술 ✦</div>
                <h1 className="ltitle">민중</h1>
                <p className="len">Minjung · Your Fortune Guide</p>
                <p className="lcopy">요즘 <em>마음 한켠에</em> 걸리는 게 있나요?<br/>생년월일 하나로 지금 당신에게<br/>꼭 필요한 이야기를 들려드릴게요 🌙</p>
                <button className="lcta" onClick={()=>setStep(1)}>✨ 나의 기운 알아보기</button>
                <div className="ltags">
                  <span className="ltag">🀄 사주</span>
                  <span className="ltag">♈ 점성술</span>
                  <span className="ltag">💬 3문 상담</span>
                  <span className="ltag">⭐ 별 코인</span>
                </div>
                <div className="lrev">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span>"진짜 소름이에요 ㄷㄷ"</span>
                  <span>·</span>
                  <span>4.9점 (2,847명)</span>
                </div>
              </div>
            </div>
          )}

          {/* ── 1 입력 ── */}
          {step===1&&(
            <div className="page">
              <button className="bk" onClick={()=>setStep(0)}>←</button>
              <div className="card">
                <Stps cur={0}/>
                <div className="ct">반가워요! 먼저 알려주세요 🌸</div>
                <div className="cs">생년월일을 입력하면 사주와 별자리를<br/>바로 확인할 수 있어요</div>

                <label className="lbl">이름 (선택이에요)</label>
                <input className="inp" placeholder="뭐라고 불러드릴까요?" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>

                <label className="lbl">생년월일</label>
                <div className="row">
                  <div className="col"><input className="inp" placeholder="1995" maxLength={4} value={form.by} onChange={e=>setForm(f=>({...f,by:e.target.value.replace(/\D/,"")}))} style={{marginBottom:0}}/></div>
                  <div className="col">
                    <select className="inp" value={form.bm} onChange={e=>setForm(f=>({...f,bm:e.target.value}))} style={{marginBottom:0}}>
                      <option value="">월</option>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}
                    </select>
                  </div>
                  <div className="col">
                    <select className="inp" value={form.bd} onChange={e=>setForm(f=>({...f,bd:e.target.value}))} style={{marginBottom:0}}>
                      <option value="">일</option>{[...Array(31)].map((_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}
                    </select>
                  </div>
                </div>
                <div style={{height:".8rem"}}/>

                <div className="togrow" onClick={()=>setForm(f=>({...f,noTime:!f.noTime,bh:""}))}>
                  <button className={`tog ${form.noTime?"on":"off"}`} onClick={e=>e.stopPropagation()}/>
                  <span className="toglbl">태어난 시간을 몰라요</span>
                </div>
                {!form.noTime&&(
                  <>
                    <label className="lbl">태어난 시각</label>
                    <select className="inp" value={form.bh} onChange={e=>setForm(f=>({...f,bh:e.target.value}))}>
                      <option value="">시각을 선택해주세요</option>
                      {[...Array(24)].map((_,i)=><option key={i} value={i}>{String(i).padStart(2,"0")}:00 ~ {String(i+1).padStart(2,"0")}:00</option>)}
                    </select>
                  </>
                )}

                <label className="lbl">성별</label>
                <div className="grow">
                  {["여성","남성","기타"].map(g=>(
                    <button key={g} className={`gbtn ${form.gender===g?"on":""}`} onClick={()=>setForm(f=>({...f,gender:g}))}>{g}</button>
                  ))}
                </div>

                {saju&&(
                  <>
                    <div className="pillars">
                      {[["연","yeon"],["월","wol"],["일","il"],["시","si"]].map(([l,k])=>(
                        <div key={l} className="pillar">
                          <div className="plbl">{l}주</div>
                          <div className="phj">{saju[k].gh}</div>
                          <div className="phj">{saju[k].jh}</div>
                          <div className="pkr">{saju[k].g}{saju[k].j}</div>
                        </div>
                      ))}
                    </div>
                    <div className="orbar">{Object.entries(saju.or).map(([k,v])=>v>0&&<div key={k} className="obs" style={{flex:v,background:OC[k]}}/>)}</div>
                    <div className="ortags">{Object.entries(saju.or).map(([k,v])=>v>0&&<span key={k} className="ortag" style={{background:`${OC[k]}18`,color:OC[k],border:`1px solid ${OC[k]}35`}}>{OE[k]}{k} {v}</span>)}</div>
                  </>
                )}

                <button className="lcta" style={{width:"100%",marginTop:"1.2rem",justifyContent:"center",borderRadius:14,padding:".78rem"}} disabled={!formOk}
                  onClick={()=>{setSelQs([]);setStep(2);}}>
                  나의 기운 보러가기 ✨
                </button>
              </div>
            </div>
          )}

          {/* ── 2 기운 선택 ── */}
          {step===2&&(
            <div className="page">
              <button className="bk" onClick={()=>setStep(1)}>←</button>
              <div className="epage">
                <Stps cur={1}/>
                <div className="eintro">
                  <div className="etitle">{form.name?`${form.name}님은 어떤 사람인가요? 🌟`:"당신은 어떤 사람인가요? 🌟"}</div>
                  <div className="esub">사주와 별자리가 바라본 <em>{form.name||"당신"}</em>이에요<br/>더 잘 맞는 기운을 골라서 질문해봐요</div>
                </div>
                <div className="mychips">
                  {form.name&&<div className="chip">👤 <b>{form.name}</b></div>}
                  <div className="chip">🎂 <b>{form.by}.{form.bm}.{form.bd}</b></div>
                  {sun&&<div className="chip">{sun.s} <b>{sun.n}</b></div>}
                  {saju&&<div className="chip">🀄 <b>{saju.ilgan}일간</b></div>}
                </div>
                <div className="ecards">
                  <div className={`ecard sj ${mode==="saju"?"picked":""}`} onClick={()=>setMode("saju")}>
                    <span className="eicon">🀄</span>
                    <div className="ekind">사주 기운</div>
                    <div className="ename">전통 명리학</div>
                    {il&&(
                      <>
                        <div className="ewho">{il.short}<br/>{il.who}</div>
                        <div className="efeel">{il.feel}</div>
                        <div className="etoday">💌 오늘의 한마디<br/>"{il.today}"</div>
                        {saju&&<div className="eor">{Object.entries(saju.or).map(([k,v])=>v>0&&<span key={k} className="eorbadge" style={{background:`${OC[k]}18`,color:OC[k],border:`1px solid ${OC[k]}28`}}>{OE[k]}{k}</span>)}</div>}
                      </>
                    )}
                    <button className="epbtn" onClick={e=>{e.stopPropagation();setMode("saju");setStep(3);}}>{mode==="saju"?"✓ 선택됨":"이 기운으로 →"}</button>
                  </div>

                  <div className={`ecard as ${mode==="astro"?"picked":""}`} onClick={()=>setMode("astro")}>
                    <span className="eicon">{sun?.s||"✨"}</span>
                    <div className="ekind">점성술 기운</div>
                    <div className="ename">서양 점성학</div>
                    {sun&&(
                      <>
                        <div className="ewho">{sun.n}<br/>{sun.vibe}</div>
                        <div className="efeel">{sun.feel}</div>
                        <div className="etoday">💌 오늘의 한마디<br/>"{sun.today}"</div>
                        <div className="eor">
                          <span className="eorbadge" style={{background:"rgba(58,155,174,.1)",color:"var(--teal)",border:"1px solid rgba(58,155,174,.2)"}}>{sun.el} {sun.charm}</span>
                        </div>
                        {moon&&<div style={{fontSize:".62rem",color:"var(--txt4)",textAlign:"center",marginBottom:".75rem"}}>달궁 {moon.s} {moon.n}{asc?` · 상승 ${asc.s} ${asc.n}`:""}</div>}
                      </>
                    )}
                    <button className="epbtn" onClick={e=>{e.stopPropagation();setMode("astro");setStep(3);}}>{mode==="astro"?"✓ 선택됨":"이 기운으로 →"}</button>
                  </div>
                </div>
                <div className="eboth">둘 다 궁금하면 각각 따로 물어볼 수 있어요 ✦</div>
              </div>
            </div>
          )}

          {/* ── 3 채팅 3문 ── */}
          {step===3&&(
            <div className="page">
              <button className="bk" onClick={()=>setStep(2)}>←</button>
              <div className="chatshell">
                <div className="chtop">
                  <Stps cur={2}/>
                  <div className="chtitle">{mode==="saju"?"🀄 사주에게 물어봐요":"✨ 별자리에게 물어봐요"}</div>
                  <div className="chsub">카테고리 누르고 질문 골라봐요 · 최대 3개</div>
                </div>
                <div className="chbody">
                  <div className="cats">
                    {CATS.map((c,i)=>(
                      <button key={c.id} className={`catbtn ${cat===i?"on":""}`} onClick={()=>setCat(i)}>{c.icon} {c.label}</button>
                    ))}
                  </div>
                  <div className="qlist">
                    {CATS[cat].qs.map((q,i)=>{
                      const on=selQs.includes(q);
                      return<button key={i} className={`qitem ${on?"on":""}`} disabled={!on&&selQs.length>=3} onClick={()=>on?rmQ(selQs.indexOf(q)):addQ(q)}>{q}</button>;
                    })}
                  </div>
                  <div className="ort">또는 직접 입력해봐요</div>
                  <textarea className="diyinp" placeholder="예: 요즘 이 사람이 나를 어떻게 생각하는지 너무 궁금해요ㅠ" maxLength={200} value={diy} onChange={e=>setDiy(e.target.value)}/>
                  <div className="diyrow">
                    <span className="hint">{diy.length}/200</span>
                    {diy.trim()&&selQs.length<3&&<button className="addbtn" onClick={()=>addQ(diy.trim())}>+ 추가</button>}
                  </div>
                </div>
                <div className="chfooter">
                  {selQs.length>0&&(
                    <>
                      <div className="sellbl">📌 고른 질문 ({selQs.length}/3)</div>
                      {selQs.map((q,i)=>(
                        <div key={i} className="selitem">
                          <span className="selnum">{i+1}</span>
                          <span className="seltxt">{q}</span>
                          <button className="seldel" onClick={()=>rmQ(i)}>✕</button>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="qstat">
                    {selQs.length===0&&"질문을 하나 이상 골라봐요 💕"}
                    {selQs.length===1&&<><strong>2개</strong> 더 고를 수 있어요 (지금 바로 물어봐도 돼요!)</>}
                    {selQs.length===2&&<><strong>1개</strong> 더 추가할 수 있어요</>}
                    {selQs.length===3&&"질문 준비 완료! 🎊 이제 물어봐요"}
                  </div>
                  <div className="pkgs">
                    {PKGS.map(p=>(
                      <div key={p.id} className={`pkg ${p.hot?"hot":""} ${pkg===p.id?"chosen":""}`} onClick={()=>setPkg(p.id)}>
                        {p.hot&&<div className="pkghot">💕 인기</div>}
                        <div className="pkgemoji">{p.emoji}</div>
                        <div className="pkgname">{p.name}</div>
                        <div className="pkgprice">{p.price}</div>
                        <div className="pkgper">{p.per}</div>
                      </div>
                    ))}
                  </div>
                  <div className="freenote">⭐ 별 1개 = 질문 1회 · 충전한 별은 언제든 써요<br/><span style={{color:"var(--pk)"}}>데모라 지금은 무료로 체험할 수 있어요!</span></div>
                  <button className="askcta main" disabled={!selQs.length} onClick={askClaude}>
                    {selQs.length===0?"질문을 먼저 골라봐요 💕":`🔮 지금 물어볼게요 (★${selQs.length}개)`}
                  </button>
                  <button className="askcta free" onClick={askClaude} disabled={!selQs.length}>무료로 체험해보기 →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── 4 로딩 ── */}
          {step===4&&(
            <div className="page">
              <div className="loadpage">
                <div className="loadcrystal">
                  <div className="lci"/>
                  <div className="lcr1"/>
                  <div className="lcr2"/>
                </div>
                <div className="loadmsg">{LOAD_MSGS[lm].t}</div>
                <div className="loadsub">{LOAD_MSGS[lm].s}</div>
                <div className="progwrap"><div className="progfill" style={{width:`${lp}%`}}/></div>
                <div className="progpct">{lp}%</div>
                <div className="fstars">{["🌟","✨","💫","⭐","🌙"].map((s,i)=><span key={i} className="fstar" ref={el=>{if(el)el.style.setProperty("--dl",`${i*.28}s`)}}>{s}</span>)}</div>
              </div>
            </div>
          )}

          {/* ── 5 결과 ── */}
          {step===5&&(
            <div className="page">
              <div className="resshell">
                <div className="rescard">
                  <div className="restop">
                    <div className={`resav ${mode}`}>{mode==="saju"?"🀄":"✨"}</div>
                    <div>
                      <div className="reswho">{form.name||"당신"}의 운세 이야기 {mode==="saju"?"🀄":"✨"}</div>
                      <div className="resmeta">{mode==="saju"?`일간 ${saju?.ilgan} · ${age}세 · 사주 기준`:`${sun?.s} ${sun?.n} · ${age}세 · 점성술 기준`}</div>
                    </div>
                  </div>
                  <div className="resqwrap">
                    {selQs.map((q,i)=>(
                      <div key={i} className="resq"><span className="rqn">Q{i+1}</span><span className="rqt">{q}</span></div>
                    ))}
                  </div>
                  <div className="resbody" dangerouslySetInnerHTML={{__html:fmt(result)}}/>
                  <div className="upsell">
                    <div className="upt">✨ 더 깊이 알고 싶어요</div>
                    <div className="upd">이번 달 전체 운세, 연애·재물·건강 종합 분석,<br/>나와 잘 맞는 사람 유형까지 한 번에 알아봐요</div>
                    <button className="upbtn">🌟 프리미엄 리포트 보기 (★15개)</button>
                  </div>
                  <div className="racts">
                    <button className="ract" onClick={()=>{setSelQs([]);setDiy("");setStep(3);}}>🔄 다른 질문</button>
                    <button className="ract" onClick={()=>{setMode("");setStep(2);}}>🔀 기운 바꾸기</button>
                    <button className="ract" onClick={()=>{setStep(0);setForm({name:"",by:"",bm:"",bd:"",bh:"",gender:"",noTime:false});setMode("");setSelQs([]);setResult("");}}>🏠 처음으로</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
