import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
//  📅 날짜 유틸 (양력 + 음력 근사)
// ═══════════════════════════════════════════════════════════
// 음력 변환 테이블 (한국천문연구원 기준, 2020-2028)
const LUNAR_TABLE_FE = {
  2020: [[2020,1,25],  [30,29,30,29,30,30,29,30,29,30,29,30], 0],
  2021: [[2021,2,12],  [29,30,29,29,30,29,30,29,30,30,29,30,29], 4],
  2022: [[2022,2, 1],  [30,29,30,29,30,29,29,30,29,30,29,30], 0],
  2023: [[2023,1,22],  [29,30,29,30,29,30,29,30,30,29,30,29,30], 2],
  2024: [[2024,2,10],  [29,30,29,30,29,30,29,30,29,30,30,29], 0],
  2025: [[2025,1,29],  [30,29,30,29,30,29,30,29,30,29,30,30,29], 6],
  2026: [[2026,2,17],  [30,29,30,29,30,29,30,29,30,29,30,29], 0],
  2027: [[2027,2, 6],  [30,29,30,29,30,29,30,29,30,30,29,30,29], 5],
  2028: [[2028,1,26],  [30,29,30,29,30,30,29,30,29,30,29,30], 0],
};
function solarToLunarFE(y,m,d){
  const target=new Date(y,m-1,d);
  for(const ly of [y-1,y]){
    const row=LUNAR_TABLE_FE[ly];
    if(!row)continue;
    const[startArr,months,leap]=row;
    const newYear=new Date(startArr[0],startArr[1]-1,startArr[2]);
    if(target<newYear)continue;
    let diff=Math.round((target-newYear)/86400000);
    let cumul=0;
    for(let i=0;i<months.length;i++){
      if(diff<cumul+months[i]){
        const ld=diff-cumul+1;
        let lm,isLeap;
        if(leap>0){
          if(i<leap){lm=i+1;isLeap=false;}
          else if(i===leap){lm=leap;isLeap=true;}
          else{lm=i;isLeap=false;}
        }else{lm=i+1;isLeap=false;}
        return{lm,ld,isLeap};
      }
      cumul+=months[i];
    }
  }
  return{lm:1,ld:1,isLeap:false};
}

function getTodayInfo() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const week = ["일","월","화","수","목","금","토"][now.getDay()];
  const JEOLGI = ["소한","대한","입춘","우수","경칩","춘분","청명","곡우","입하","소만","망종","하지","소서","대서","입추","처서","백로","추분","한로","상강","입동","소설","대설","동지"];
  const jeolgi = JEOLGI[((m-1)*2+(d>20?1:0))%24];
  const{lm,ld,isLeap}=solarToLunarFE(y,m,d);
  const lunar=`음력 ${isLeap?'윤':''}${lm}월 ${ld}일`;
  return{
    solar:`${y}년 ${m}월 ${d}일 (${week}요일)`,
    lunar, jeolgi:`절기 근처: ${jeolgi}`,
    year:y, month:m, day:d
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


// ── 오늘의 한마디 (날짜 기반 순환) ──
const DAILY_WORDS = [
  "오늘은 오래 미룬 연락 하나를 보내기 좋은 날이에요.",
  "지금 느끼는 불안은 당신이 그만큼 진심이라는 뜻이에요.",
  "멈춰있는 것처럼 보여도, 당신은 분명히 자라고 있어요.",
  "오늘은 결정을 서두르지 않아도 괜찮은 날이에요.",
  "당신이 지나온 길이 지금 서 있는 곳을 만들었어요.",
  "작은 용기 하나가 오늘 당신의 하루를 바꿀 수 있어요.",
  "지금 당신 곁에 있는 사람들은 이유가 있어 거기 있어요.",
  "오늘은 남의 기준이 아닌 내 기준으로 판단해봐요.",
  "당신의 섬세함은 약점이 아니라 가장 강한 무기예요.",
  "기다림도 하나의 선택이에요. 흔들리지 않아도 돼요.",
  "오늘 하늘의 기운은 새로운 시작을 응원하고 있어요.",
  "당신이 지금 느끼는 감정, 충분히 그럴 만해요.",
  "오늘은 조금 느려도 괜찮은 날이에요. 숨 먼저 쉬어요.",
  "한 발이 작아 보여도, 방향이 맞으면 충분해요.",
  "당신의 직감은 생각보다 훨씬 정확해요.",
  "오늘 만나는 인연엔 조금 더 마음을 열어봐요.",
  "지금 힘든 건 당신이 뭔가를 간절히 원한다는 신호예요.",
  "완벽하지 않아도 충분히 빛나고 있어요.",
  "오늘은 비교하지 말고 어제의 나와만 대화해봐요.",
  "당신이 포기하지 않는 한, 이건 아직 끝이 아니에요.",
  "오늘의 작은 친절이 내일 당신에게 돌아와요.",
  "지금 이 순간이 나중엔 가장 빛나는 기억이 될 수 있어요.",
  "당신은 지금 당신이 생각하는 것보다 훨씬 괜찮아요.",
  "오늘은 무언가를 내려놓아도 좋은 날이에요.",
  "새로운 문이 열리기 전엔 늘 복도가 있어요. 지금은 복도예요.",
  "당신의 기다림은 반드시 의미 있는 형태로 돌아와요.",
  "오늘 하루의 끝, 스스로에게 수고했다고 말해줘요.",
  "당신이 선택한 길이 정답이에요. 믿어봐요.",
  "지금 이 시기는 씨앗을 심는 계절이에요. 조급해하지 않아도 돼요.",
  "오늘 당신의 별은 조용히, 하지만 분명히 빛나고 있어요.",
];
function getDailyWord(d){ return DAILY_WORDS[(d-1)%DAILY_WORDS.length]; }
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

// ══ 시나리오 궁합 장소 ══
const PLACES = [
  {id:'burger',emoji:'🍔',label:'버거킹',hint:'패스트푸드'},
  {id:'cafe',emoji:'☕',label:'카페',hint:'브런치'},
  {id:'cvs',emoji:'🏪',label:'편의점',hint:'야식'},
  {id:'cinema',emoji:'🎬',label:'영화관',hint:'데이트'},
  {id:'travel',emoji:'✈️',label:'여행',hint:'장거리'},
  {id:'pub',emoji:'🍺',label:'술집',hint:'밤'},
  {id:'market',emoji:'🛒',label:'마트',hint:'장보기'},
];

// ══ 별자리 무드 (결과 배너용) ══
const SIGN_MOOD = {
  '양자리':  {color:'#E8624A',bg:'rgba(232,98,74,.1)',word:'불꽃같은 에너지',emoji:'🔥'},
  '황소자리': {color:'#7CB87A',bg:'rgba(124,184,122,.1)',word:'포근하고 안정적',emoji:'🌿'},
  '쌍둥이자리':{color:'#6BBFB5',bg:'rgba(107,191,181,.1)',word:'호기심 가득한',emoji:'💫'},
  '게자리':  {color:'#6B9EC4',bg:'rgba(107,158,196,.1)',word:'감성이 풍부한',emoji:'🌙'},
  '사자자리': {color:'#E8B048',bg:'rgba(232,176,72,.1)',word:'당당하게 빛나는',emoji:'✨'},
  '처녀자리': {color:'#A8C87A',bg:'rgba(168,200,122,.1)',word:'섬세하고 성실한',emoji:'🌾'},
  '천칭자리': {color:'#C4A8D8',bg:'rgba(196,168,216,.1)',word:'균형잡힌 심미안',emoji:'⚖️'},
  '전갈자리': {color:'#9B4EC4',bg:'rgba(155,78,196,.1)',word:'깊고 강렬한',emoji:'🔮'},
  '사수자리': {color:'#E8A048',bg:'rgba(232,160,72,.1)',word:'자유롭고 낙천적',emoji:'🏹'},
  '염소자리': {color:'#8A8A8A',bg:'rgba(138,138,138,.1)',word:'묵직한 뚝심',emoji:'⛰️'},
  '물병자리': {color:'#48B4E8',bg:'rgba(72,180,232,.1)',word:'독창적인 시각',emoji:'⚡'},
  '물고기자리':{color:'#8EC4E8',bg:'rgba(142,196,232,.1)',word:'공감능력이 넘치는',emoji:'🌊'},
};

// ══ 랜딩 샘플 에세이 (20초 미리보기) ══
const SAMPLE_ESSAYS = [
  "물고기자리의 감성과 계수의 섬세함이 만나면, 마음 깊은 곳에서 세상을 느끼는 사람이 돼요. 오늘 느끼는 그 막막함은 사실 변화의 전조예요. 별이 방향을 바꾸는 중이라 잠깐 흔들리는 거예요. 그 흔들림 안에 오히려 답이 있어요...",
  "사주에 화(火) 기운이 강하게 흐를 때, 사자자리의 태양과 만나면 에너지가 선명해져요. 지금 고민하는 그 선택은 — 사실 이미 마음이 정해진 것 같아요. 두려움이 아닌 설렘으로 읽어봐요. 별이 등을 밀고 있거든요...",
  "천칭자리의 균형 감각과 기토의 조화로운 기질이 함께 속삭여요. 오늘은 조용히 자신을 돌아보기 좋은 날이에요. 너무 많은 것을 혼자 짊어지지 않아도 괜찮아요. 가볍게 내려놓는 것도 용기예요...",
];
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
  {star:"★★★★☆",text:"추가 질문도 계속할 수 있어서 더 깊이 파고들 수 있었어요. 진짜 대화하는 느낌",nick:"달밤산책 · 31세"},
  {star:"★★★★★",text:"글쓰는 방식이 달라요. AI 같지 않고 진짜 누가 써준 것 같은 느낌",nick:"별빛소나기 · 26세"},
  {star:"★★★★☆",text:"월간 리포트가 생각보다 구체적이에요. 매달 챙겨볼 것 같아요",nick:"새벽세시 · 29세"},
  {star:"★★★★★",text:"사이 별점 기능이 제일 좋아요. 친구랑 같이 봤는데 둘 다 공감했어요",nick:"달콩이 · 23세"},
];
const CHAT_SUGG=["좀 더 자세히 알고 싶어요","언제쯤 변화가 올까요?","어떻게 행동하면 좋을까요?","지금 당장 할 수 있는 게 뭔가요?","불안한 마음이 커요","긍정적인 부분도 알고 싶어요"];
const LOAD_STATES=[
  {t:"동양의 별과 서양의 별이 함께 당신을 읽고 있어요",s:"잠깐만요 ✦"},
  {t:"태어난 순간의 기운을 조용히 불러오는 중이에요",s:"조금만 기다려줘요 🌙"},
  {t:"당신에게 꼭 맞는 이야기를 고르고 있어요",s:"거의 다 왔어요 ✨"},
  {t:"오늘 당신의 별이 어떤 말을 건네는지 듣고 있어요",s:"잠깐만요 ✦"},
];

// ═══════════════════════════════════════════════════════════
//  ⏰ 시간대 유틸
// ═══════════════════════════════════════════════════════════
function getTimeSlot(){
  const h=new Date().getHours();
  if(h>=5&&h<12) return 'morning';   // 오전 5~12
  if(h>=12&&h<19) return 'afternoon'; // 오후 12~19
  if(h>=19&&h<24) return 'evening';  // 저녁 19~24
  return 'dawn';                      // 새벽 0~5
}
const TIME_CONFIG={
  morning:{
    label:'오늘을 여는 별숨',
    emoji:'🌅',
    color:'#E8B048',
    bg:'rgba(232,176,72,.08)',
    border:'rgba(232,176,72,.2)',
    ctaText:'오늘의 별숨에게 물어보기 ✦',
    ctaBg:'var(--gold)',ctaColor:'#0D0B14',
    greeting:(name)=>`${name||'당신'}의 오늘이 시작되고 있어요.`,
    prompt:'[오전 운세] 오늘 하루를 어떻게 시작하면 좋을지, 오늘의 기운과 방향을 따뜻하게 전해줘요.',
    inputPlaceholder:'오늘 하루 어떤 게 궁금해요?',
  },
  afternoon:{
    label:'오늘의 별숨',
    emoji:'✦',
    color:'var(--gold)',
    bg:'var(--goldf)',
    border:'var(--acc)',
    ctaText:'별숨에게 물어보기 ✦',
    ctaBg:'var(--gold)',ctaColor:'#0D0B14',
    greeting:(name)=>`${name||'당신'}의 오후, 별이 함께하고 있어요.`,
    prompt:'[오후 운세] 오늘 오후의 기운과 지금 이 순간 필요한 것을 전해줘요.',
    inputPlaceholder:'지금 마음속에 있는 것을 물어봐요',
  },
  evening:{
    label:'오늘을 마무리하는 별숨',
    emoji:'🌙',
    color:'#9B8EC4',
    bg:'rgba(155,142,196,.08)',
    border:'rgba(155,142,196,.2)',
    ctaText:'오늘을 별숨의 언어로 읽어보기 ✦',
    ctaBg:'var(--lav)',ctaColor:'#fff',
    greeting:(name)=>`${name||'당신'}의 오늘 하루, 수고했어요.`,
    prompt:'[저녁 회고] 오늘 하루를 돌아보며 별의 언어로 다시 읽어주는 이야기를 써줘요. 오늘 있었던 일들을 의미있게 재해석해요.',
    inputPlaceholder:'오늘 있었던 일을 별숨에게 털어놔요',
  },
  dawn:{
    label:'별이 가장 선명한 시간',
    emoji:'🌌',
    color:'#6BBFB5',
    bg:'rgba(107,191,181,.06)',
    border:'rgba(107,191,181,.15)',
    ctaText:'새벽의 별숨에게 물어보기 ✦',
    ctaBg:'var(--teal)',ctaColor:'#fff',
    greeting:(name)=>`별이 가장 선명한 새벽, ${name||'당신'}에게 전할 이야기가 있어요.`,
    prompt:'[새벽 운세] 잠 못 드는 새벽, 이 시간에 필요한 위로와 내일을 향한 이야기를 전해줘요.',
    inputPlaceholder:'새벽에 떠오른 생각을 적어봐요',
  },
};

// ═══════════════════════════════════════════════════════════
//  📚 히스토리 유틸
// ═══════════════════════════════════════════════════════════
const HIST_KEY='byeolsoom_history';
const MAX_HIST=30;
function loadHistory(){
  try{const h=localStorage.getItem(HIST_KEY);return h?JSON.parse(h):[];}catch{return[];}
}
function saveHistory(items){
  try{localStorage.setItem(HIST_KEY,JSON.stringify(items.slice(0,MAX_HIST)));}catch{}
}
function addHistory(questions,answers){
  const items=loadHistory();
  const now=new Date();
  const dateStr=`${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const newItem={id:Date.now(),date:dateStr,slot:getTimeSlot(),questions,answers};
  saveHistory([newItem,...items]);
}
function deleteHistory(id){
  const items=loadHistory().filter(i=>i.id!==id);
  saveHistory(items);
}

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
  --lav:#9B8EC4;--lavf:rgba(155,142,196,.1);--lavacc:rgba(155,142,196,.25);
  --teal:#6BBFB5;--tealf:rgba(107,191,181,.1);--tealacc:rgba(107,191,181,.25);
  --rose:#E87B8A;--rosef:rgba(232,123,138,.1);--roseacc:rgba(232,123,138,.25);
  --sp1:8px;--sp2:16px;--sp3:24px;--sp4:32px;--sp5:48px;--sp6:64px;
  --r1:12px;--r2:20px;--r3:28px;--r4:36px;
  --xl:1.75rem;--lg:1.125rem;--md:0.9375rem;--sm:0.8125rem;--xs:0.6875rem;
  --trans-fast:.15s ease;--trans:.25s ease;--trans-slow:.4s ease;
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
.back-btn{position:fixed;top:18px;left:62px;z-index:50;width:36px;height:36px;border-radius:50%;background:var(--bg2);border:1px solid var(--line);color:var(--t3);font-size:.8rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.back-btn:hover{color:var(--gold)}
.step-dots{display:flex;gap:6px;justify-content:center;margin-bottom:var(--sp3)}
.dot{height:4px;border-radius:2px;transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.dot.done{width:14px;background:var(--t4)}.dot.active{width:28px;background:var(--gold)}.dot.todo{width:4px;background:var(--t4);opacity:.4}

/* ══ LANDING ══ */
.land{text-align:center}
.land-wordmark{font-size:var(--xs);font-weight:300;letter-spacing:.35em;color:var(--t4);text-transform:lowercase;margin-bottom:52px;animation:fadeUp .8s .1s both}
.land-orb{width:120px;height:120px;border-radius:50%;margin:0 auto var(--sp2);position:relative;animation:fadeUp .8s .2s both}
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

/* ══ 오늘의 한마디 ══ */

/* ══ 별의 한 줄 요약 ══ */
.star-summary{padding:var(--sp2) var(--sp3);background:var(--goldf);border-bottom:1px solid var(--acc);display:flex;align-items:flex-start;gap:8px}
.star-summary-icon{color:var(--gold);flex-shrink:0;font-size:.9rem;margin-top:2px}
.star-summary-text{font-size:var(--sm);color:var(--gold);font-weight:500;line-height:1.65;font-style:italic}
.daily-word{margin:var(--sp3) 0 var(--sp2);padding:var(--sp2) var(--sp3);background:var(--goldf);border:1px solid var(--acc);border-radius:var(--r2);text-align:center;animation:fadeUp .8s .85s both}
.daily-label{font-size:var(--xs);color:var(--gold);letter-spacing:.1em;margin-bottom:5px}
.daily-text{font-size:var(--sm);color:var(--t1);line-height:1.75;font-weight:300}
.daily-date{font-size:var(--xs);color:var(--t4);margin-top:4px}


/* ══ 무드 배너 ══ */
.mood-banner{padding:12px var(--sp3);display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--line);animation:fadeUp .5s ease}
.mood-orb{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.1rem}
.mood-label{font-size:var(--xs);color:var(--t4);margin-bottom:2px;letter-spacing:.06em}
.mood-word{font-size:var(--sm);font-weight:600}

/* ══ 시나리오 궁합 ══ */
.compat-page{width:100%;max-width:480px;animation:fadeUp .5s ease}
.compat-header{text-align:center;padding:var(--sp4) var(--sp3) var(--sp3)}
.compat-title{font-size:var(--xl);font-weight:700;color:var(--t1);margin-bottom:6px}
.compat-sub{font-size:var(--sm);color:var(--t3);line-height:1.75}
.compat-section{margin-bottom:var(--sp3)}
.compat-label{font-size:var(--xs);font-weight:700;color:var(--t4);letter-spacing:.08em;margin-bottom:10px}
.person-cards{display:flex;gap:10px}
.person-card{flex:1;background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);padding:var(--sp2);position:relative}
.person-card.a-card{border-color:var(--lavacc)}
.person-card.b-card{border-color:var(--tealacc)}
.person-badge{font-size:var(--xs);font-weight:700;padding:2px 8px;border-radius:50px;margin-bottom:8px;display:inline-block}
.person-badge.a{background:var(--lavf);color:var(--lav)}
.person-badge.b{background:var(--tealf);color:var(--teal)}
.place-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.place-btn{padding:10px 4px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);text-align:center;cursor:pointer;transition:all var(--trans);font-family:var(--ff)}
.place-btn:hover{border-color:var(--t4);transform:translateY(-2px)}
.place-btn.on{background:var(--goldf);border-color:var(--gold)}
.place-emoji{font-size:1.4rem;display:block;margin-bottom:3px}
.place-label{font-size:var(--xs);color:var(--t3);display:block}
.place-btn.on .place-label{color:var(--gold)}
.scenario-wrap{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);overflow:hidden;margin-bottom:var(--sp3)}
.scenario-header{padding:var(--sp2) var(--sp3);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px}
.scenario-place-icon{font-size:1.3rem}
.scenario-place-name{font-size:var(--sm);font-weight:600;color:var(--t1)}
.scenario-sub{font-size:var(--xs);color:var(--t4)}
.bubble-list{padding:var(--sp3);display:flex;flex-direction:column;gap:10px}
.bubble-row{display:flex;gap:8px;animation:fadeUp .3s ease}
.bubble-row.b-row{flex-direction:row-reverse}
.bubble-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;flex-shrink:0;margin-top:2px}
.bubble-avatar.a-av{background:var(--lavf);border:1px solid var(--lavacc);color:var(--lav)}
.bubble-avatar.b-av{background:var(--tealf);border:1px solid var(--tealacc);color:var(--teal)}
.bubble-name{font-size:var(--xs);color:var(--t4);margin-bottom:3px}
.bubble-row.b-row .bubble-name{text-align:right}
.bubble-text{padding:10px 14px;border-radius:18px;font-size:var(--sm);line-height:1.65;max-width:78%}
.bubble-row.a-row .bubble-text{background:var(--bg2);border:1px solid var(--line);border-bottom-left-radius:4px;color:var(--t1)}
.bubble-row.b-row .bubble-text{background:var(--tealf);border:1px solid var(--tealacc);border-bottom-right-radius:4px;color:var(--t1)}
.scenario-summary{padding:var(--sp2) var(--sp3);background:var(--goldf);border-top:1px solid var(--acc);font-size:var(--xs);color:var(--gold);line-height:1.75;font-style:italic;text-align:center}
.scenario-loading{padding:var(--sp4);text-align:center;color:var(--t3);font-size:var(--sm)}
.scenario-typing-dots{display:flex;gap:5px;justify-content:center;margin:var(--sp2) 0}
.scenario-typing-dots span{width:7px;height:7px;border-radius:50%;background:var(--t4);animation:dot 1.2s infinite}
.scenario-typing-dots span:nth-child(2){animation-delay:.2s}
.scenario-typing-dots span:nth-child(3){animation-delay:.4s}
.compat-total{padding:var(--sp3);background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2);margin-bottom:var(--sp3);text-align:center}
.compat-total-label{font-size:var(--xs);color:var(--t4);margin-bottom:6px;letter-spacing:.08em}
.compat-total-text{font-size:var(--sm);color:var(--t1);line-height:1.75}
.kizmet-bar{height:6px;border-radius:3px;background:var(--bg3);overflow:hidden;margin:10px 0}
.kizmet-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--lav),var(--gold));transition:width 1.2s cubic-bezier(.34,1.56,.64,1)}
.kizmet-score{font-size:var(--xl);font-weight:700;color:var(--gold)}
.compat-btns{display:flex;gap:8px}

/* ══ 별의 편지 ══ */
.letter-page{width:100%;max-width:480px;animation:fadeUp .5s ease}
.letter-envelope{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden;margin-bottom:var(--sp3)}
.letter-env-top{height:80px;background:linear-gradient(135deg,var(--goldf),var(--lavf));display:flex;align-items:center;justify-content:center;font-size:2rem;border-bottom:1px solid var(--line)}
.letter-body{padding:var(--sp4) var(--sp3)}
.letter-date-to{font-size:var(--xs);color:var(--t4);margin-bottom:var(--sp2);letter-spacing:.06em}
.letter-date-to strong{color:var(--gold)}
.letter-content{font-size:var(--sm);color:var(--t2);line-height:2.2;white-space:pre-wrap;letter-spacing:-.005em}
.letter-content p:first-child::first-letter{font-size:2.4em;font-weight:700;color:var(--gold);float:left;line-height:.82;margin:.06em .1em 0 0}
.letter-seal{display:flex;flex-direction:column;align-items:center;gap:6px;padding:var(--sp3);border-top:1px solid var(--line)}
.seal-icon{font-size:1.5rem;animation:orbPulse 3s infinite}
.seal-text{font-size:var(--xs);color:var(--t4);letter-spacing:.08em}
.letter-actions{display:flex;gap:8px}

/* ══ 랜딩 샘플 미리보기 ══ */
.sample-preview{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);padding:var(--sp3);margin:var(--sp2) 0;position:relative;overflow:hidden;}
.sample-badge{display:inline-block;font-size:10px;color:var(--t4);letter-spacing:.08em;margin-bottom:8px;padding:3px 8px;background:var(--bg3);border-radius:10px;border:1px solid var(--border);}
.sample-name{font-size:var(--xs);color:var(--gold);margin-bottom:8px;letter-spacing:.06em;font-weight:600;}
.sample-text{font-size:var(--xs);color:var(--t2);line-height:1.9;min-height:60px}
.sample-cursor{display:inline-block;width:1.5px;height:.85em;background:var(--gold);margin-left:1px;vertical-align:text-(--sp3) 0;text-align:left;position:relative;overflow:hidden;animation:fadeUp .8s .7s both}

/* ══ 결과 액션 메뉴 확장 ══ */
.action-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:var(--sp2)}
.action-card{padding:var(--sp2);background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2);cursor:pointer;transition:all var(--trans);text-align:left}
.action-card:hover{border-color:var(--acc);background:var(--goldf);transform:translateY(-2px)}
.action-card-icon{font-size:1.3rem;margin-bottom:5px}
.action-card-title{font-size:var(--sm);font-weight:600;color:var(--t1);margin-bottom:2px}
.action-card-sub{font-size:var(--xs);color:var(--t3);line-height:1.5}
.action-card.compat{border-color:var(--lavacc)}
.action-card.compat:hover{background:var(--lavf);border-color:var(--lav)}
.action-card.letter{border-color:var(--roseacc)}
.action-card.letter:hover{background:var(--rosef);border-color:var(--rose)}

/* ══ 로딩 고도화 ══ */
.load-orb-wrap{display:flex;justify-content:center;margin:var(--sp4) 0}
.load-orb{width:80px;height:80px;border-radius:50%;position:relative;margin:0 auto}
.load-orb-core{position:absolute;inset:8px;border-radius:50%;background:radial-gradient(circle at 35% 28%,rgba(232,176,72,.6),rgba(155,142,196,.4),rgba(50,30,90,.9));animation:orbPulse 2s infinite}
.load-orb-ring{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(232,176,72,.3);animation:orbSpin 3s linear infinite}
.load-orb-ring2{position:absolute;inset:-8px;border-radius:50%;border:1px dashed rgba(155,142,196,.2);animation:orbSpin 7s linear infinite reverse}
.load-pillars{display:flex;gap:6px;justify-content:center;margin:var(--sp2) 0}
.load-pillar{width:36px;background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:8px 4px;text-align:center;animation:fadeUp .4s ease both}
.load-pillar:nth-child(1){animation-delay:.0s}
.load-pillar:nth-child(2){animation-delay:.1s}
.load-pillar:nth-child(3){animation-delay:.2s}
.load-pillar:nth-child(4){animation-delay:.3s}
.load-p-hj{font-size:.9rem;color:var(--gold);font-weight:600;line-height:1.2}
.load-p-lbl{font-size:.5rem;color:var(--t4);margin-top:2px}

/* ══ step 전환 fade ══ */
.step-fade{animation:stepFadeIn .45s cubic-bezier(.4,0,.2,1)}
@keyframes stepFadeIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}


/* ══ 결제 Toast 알림 ══ */
.pay-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:300;padding:12px 24px;border-radius:50px;font-size:var(--sm);font-weight:600;white-space:nowrap;animation:toastUp .35s cubic-bezier(.34,1.56,.64,1)}
.pay-toast.success{background:var(--gold);color:#0D0B14;box-shadow:0 4px 20px rgba(232,176,72,.4)}
.pay-toast.error{background:var(--rose,#E87B8A);color:#fff}
@keyframes toastUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* ══ 랜딩 — 로그인/개인화 섹션 ══ */
.land-login-section{margin:var(--sp3) 0;animation:fadeUp .8s .6s both}
.land-login-card{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);padding:var(--sp3);text-align:left;display:flex;flex-direction:column;gap:10px}
.land-login-card.logged{border-color:var(--acc);background:var(--goldf)}
.llc-top{display:flex;align-items:center;gap:var(--sp2);margin-bottom:var(--sp2)}
.llc-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--acc);flex-shrink:0}
.llc-avatar-placeholder{width:44px;height:44px;border-radius:50%;background:var(--bg2);border:1px dashed var(--acc);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}
.llc-name{font-size:var(--sm);font-weight:600;color:var(--t1)}
.llc-sub{font-size:var(--xs);color:var(--t3);margin-top:2px}
.llc-greeting{font-size:var(--sm);color:var(--gold);font-weight:500;margin-bottom:var(--sp2);line-height:1.65}
.llc-profile-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:var(--sp2)}
.llc-chip{display:flex;align-items:center;gap:4px;padding:4px 10px;background:var(--bg2);border:1px solid var(--line);border-radius:50px;font-size:var(--xs);color:var(--t2);cursor:pointer;transition:all .2s}
.llc-chip:hover{border-color:var(--acc);color:var(--gold)}
.llc-chip.filled{background:var(--goldf);border-color:var(--acc);color:var(--gold)}
.llc-actions{display:flex;gap:6px}
.kakao-login-full{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;border-radius:var(--r1);background:#FEE500;border:none;cursor:pointer;font-family:var(--ff);font-size:var(--sm);font-weight:700;color:#191919;transition:all .2s}
.kakao-login-full:hover{background:#F0D800;transform:translateY(-1px)}
.kakao-login-full:active{transform:scale(.97)}
.land-login-why{font-size:10px;color:var(--t4);text-align:center;line-height:1.6;margin-top:-4px}

/* ══ 프로필 모달 ══ */
.profile-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(5px);z-index:200;display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s ease}
.profile-sheet{width:100%;max-width:480px;background:var(--bg);border-radius:24px 24px 0 0;padding:var(--sp4) var(--sp3) 40px;animation:slideUp .3s cubic-bezier(.34,1.56,.64,1);max-height:85vh;overflow-y:auto}
.profile-handle{width:36px;height:4px;background:var(--line);border-radius:2px;margin:0 auto var(--sp3)}
.profile-title{font-size:var(--lg);font-weight:700;color:var(--t1);margin-bottom:4px}
.profile-sub{font-size:var(--xs);color:var(--t3);margin-bottom:var(--sp3);line-height:1.65}
.profile-section{margin-bottom:var(--sp3)}
.profile-section-title{font-size:var(--xs);font-weight:700;color:var(--t3);letter-spacing:.08em;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.profile-save-btn{width:100%;padding:14px;border:none;border-radius:var(--r1);background:var(--gold);color:#0D0B14;font-size:var(--sm);font-weight:700;font-family:var(--ff);cursor:pointer;transition:transform .15s,opacity .15s;margin-top:var(--sp2)}
.profile-save-btn:hover{opacity:.88}.profile-save-btn:active{transform:scale(.98)}
.profile-close-btn{width:100%;padding:11px;border:none;background:transparent;color:var(--t4);font-family:var(--ff);font-size:var(--xs);cursor:pointer;margin-top:6px}

/* ══ 카카오 로그인 ══ */
.kakao-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:12px;background:#FEE500;border:none;cursor:pointer;font-family:var(--ff);font-size:var(--sm);font-weight:600;color:#191919;transition:all .2s}
.kakao-btn:hover{background:#F0D800;transform:translateY(-1px)}
.kakao-btn svg{flex-shrink:0}
.kakao-nudge{padding:var(--sp2) var(--sp3);background:rgba(254,229,0,.1);border:1px solid rgba(254,229,0,.3);border-radius:var(--r2);margin-bottom:var(--sp2);display:flex;align-items:center;gap:10px}
.kakao-nudge-text{font-size:var(--xs);color:var(--t3);flex:1}
.user-chip{display:flex;align-items:center;gap:6px;padding:5px 10px 5px 5px;border-radius:50px;background:var(--goldf);border:1px solid var(--acc);cursor:pointer}
.user-chip img{width:22px;height:22px;border-radius:50%;object-fit:cover}
.user-chip span{font-size:var(--xs);color:var(--t2)}

/* ══ 결제 모달 ══ */
.pay-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s ease}
.pay-sheet{width:100%;max-width:480px;background:var(--bg);border-radius:24px 24px 0 0;padding:var(--sp4);animation:slideUp .3s ease}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.pay-handle{width:36px;height:4px;background:var(--line);border-radius:2px;margin:0 auto var(--sp3)}
.pay-title{font-size:1.1rem;font-weight:600;color:var(--t1);margin-bottom:4px}
.pay-desc{font-size:var(--xs);color:var(--t3);margin-bottom:var(--sp3)}
.pay-preview{background:var(--card);border-radius:var(--r2);padding:var(--sp2) var(--sp3);margin-bottom:var(--sp3)}
.pay-preview-item{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:var(--xs);color:var(--t2)}
.pay-preview-item::before{content:'✦';color:var(--gold);flex-shrink:0}
.pay-price{font-size:1.4rem;font-weight:700;color:var(--gold);text-align:center;margin-bottom:var(--sp3)}
.pay-kakao-btn{width:100%;padding:16px;border-radius:12px;background:#FEE500;border:none;cursor:pointer;font-family:var(--ff);font-size:1rem;font-weight:700;color:#191919;display:flex;align-items:center;justify-content:center;gap:8px}
.pay-kakao-btn:disabled{opacity:.6;cursor:not-allowed}
.pay-cancel{width:100%;padding:12px;border:none;background:transparent;color:var(--t4);font-family:var(--ff);font-size:var(--xs);cursor:pointer;margin-top:8px}
.share-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;border:1px solid var(--line);background:transparent;color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:all .2s}
.share-btn:hover{border-color:var(--acc);color:var(--gold);background:var(--goldf)}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.hint{font-size:var(--xs);color:var(--t4)}

/* ══ 사이드바 ══ */
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);z-index:100;animation:fadeIn .25s ease}
.sidebar{position:fixed;top:0;left:0;bottom:0;width:min(320px,88vw);background:var(--bg);border-right:1px solid var(--line);z-index:101;display:flex;flex-direction:column;animation:sideIn .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes sideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
.sidebar-head{padding:var(--sp4) var(--sp3) var(--sp3);border-bottom:1px solid var(--line)}
.sidebar-logo{font-size:var(--xs);letter-spacing:.3em;color:var(--gold);margin-bottom:var(--sp2)}
.sidebar-user{display:flex;align-items:center;gap:10px}
.sidebar-av{width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid var(--acc)}
.sidebar-av-ph{width:36px;height:36px;border-radius:50%;background:var(--bg2);border:1px dashed var(--acc);display:flex;align-items:center;justify-content:center;font-size:.85rem}
.sidebar-uname{font-size:var(--sm);font-weight:600;color:var(--t1)}
.sidebar-usub{font-size:var(--xs);color:var(--t4);margin-top:2px}
.sidebar-body{flex:1;overflow-y:auto;padding:var(--sp2) 0}
.sidebar-section{margin-bottom:var(--sp2)}
.sidebar-section-lbl{font-size:var(--xs);font-weight:700;color:var(--t4);letter-spacing:.1em;padding:6px var(--sp3) 4px}
.sidebar-menu-item{display:flex;align-items:center;gap:12px;padding:11px var(--sp3);cursor:pointer;transition:background .2s;border:none;background:transparent;width:100%;text-align:left;font-family:var(--ff)}
.sidebar-menu-item:hover{background:var(--bg2)}
.sidebar-menu-item.active{background:var(--goldf)}
.smi-icon{font-size:1rem;width:20px;text-align:center;flex-shrink:0}
.smi-text{font-size:var(--sm);color:var(--t2)}
.sidebar-menu-item.active .smi-text{color:var(--gold);font-weight:600}
.sidebar-hist-item{padding:10px var(--sp3);cursor:pointer;border-bottom:1px solid var(--line2);transition:background .2s}
.sidebar-hist-item:hover{background:var(--bg2)}
.shi-date{font-size:var(--xs);color:var(--t4);margin-bottom:3px}
.shi-q{font-size:var(--xs);color:var(--t2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sidebar-empty{padding:var(--sp3);text-align:center;color:var(--t4);font-size:var(--xs);line-height:2}
.sidebar-foot{padding:var(--sp2) var(--sp3);border-top:1px solid var(--line)}
.sidebar-foot-btn{width:100%;padding:9px;border:1px solid var(--line);border-radius:var(--r1);background:transparent;color:var(--t4);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:all .2s}
.sidebar-foot-btn:hover{border-color:var(--acc);color:var(--gold)}
.menu-btn{position:fixed;top:18px;left:18px;z-index:50;width:36px;height:36px;border-radius:50%;background:var(--bg2);border:1px solid var(--line);color:var(--t3);font-size:.9rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.menu-btn:hover{color:var(--gold);border-color:var(--gold)}

/* ══ 시간대별 배경 오버레이 ══ */
.time-overlay{position:fixed;inset:0;pointer-events:none;z-index:0;transition:opacity 1s ease}

/* ══ 오늘의 별숨 (시간대별) ══ */
.todaybyeol{margin:var(--sp3) 0;border-radius:var(--r2);overflow:hidden;animation:fadeUp .8s .5s both;border:1px solid var(--line)}
.todaybyeol-top{padding:var(--sp2) var(--sp3);display:flex;align-items:center;gap:10px}
.tbt-orb{width:32px;height:32px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.9rem}
.tbt-label{font-size:var(--xs);color:var(--t4);letter-spacing:.07em;margin-bottom:2px}
.tbt-title{font-size:var(--sm);font-weight:600}
.todaybyeol-body{padding:var(--sp2) var(--sp3) var(--sp3);border-top:1px solid var(--line)}
.tbt-text{font-size:var(--sm);color:var(--t2);line-height:1.85;margin-bottom:var(--sp2)}
.tbt-cta{width:100%;padding:11px;border:none;border-radius:var(--r1);font-size:var(--sm);font-weight:600;font-family:var(--ff);cursor:pointer;transition:all .2s}
.tbt-cta:active{transform:scale(.97)}

/* ══ 저녁 회고 입력 ══ */
.review-inp{width:100%;padding:11px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t1);font-size:var(--sm);font-family:var(--ff);resize:none;height:72px;margin-bottom:10px;transition:border-color .2s}
.review-inp:focus{outline:none;border-color:var(--gold)}.review-inp::placeholder{color:var(--t4)}

/* ══ 랜딩 퀵 질문 ══ */
.land-quick{margin:var(--sp3) 0;animation:fadeUp .8s .5s both}
.land-quick-title{font-size:var(--xs);color:var(--t4);letter-spacing:.07em;margin-bottom:8px;text-align:left}
.land-quick-inp-row{display:flex;gap:8px;margin-bottom:10px}
.land-quick-inp{flex:1;padding:13px 16px;background:var(--bg1);border:1px solid var(--line);border-radius:50px;color:var(--t1);font-size:var(--sm);font-family:var(--ff);transition:border-color .2s}
.land-quick-inp:focus{outline:none;border-color:var(--gold)}.land-quick-inp::placeholder{color:var(--t4)}
.land-quick-send{width:44px;height:44px;border-radius:50%;border:none;background:var(--gold);color:#0D0B14;font-size:.9rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform .15s,opacity .15s}
.land-quick-send:hover{opacity:.85}.land-quick-send:active{transform:scale(.93)}.land-quick-send:disabled{opacity:.3;cursor:not-allowed}
.land-cat-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px}
.land-cat-chip{padding:6px 13px;border-radius:50px;border:1px solid var(--line);background:transparent;color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer;white-space:nowrap;transition:all .2s}
.land-cat-chip:hover{border-color:var(--acc);color:var(--gold);background:var(--goldf)}
.land-cat-chip.on{background:var(--goldf);border-color:var(--acc);color:var(--gold);font-weight:600}

/* ══ 히스토리 뷰어 (step 9) ══ */
.hist-page{width:100%;max-width:480px;animation:fadeUp .5s ease}
.hist-header{padding:var(--sp4) var(--sp3) var(--sp2);border-bottom:1px solid var(--line)}
.hist-title{font-size:var(--lg);font-weight:700;color:var(--t1);margin-bottom:4px}
.hist-sub{font-size:var(--xs);color:var(--t3)}
.hist-search{padding:var(--sp2) var(--sp3);border-bottom:1px solid var(--line)}
.hist-search-inp{width:100%;padding:10px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:50px;color:var(--t1);font-size:var(--sm);font-family:var(--ff);transition:border-color .2s}
.hist-search-inp:focus{outline:none;border-color:var(--gold)}.hist-search-inp::placeholder{color:var(--t4)}
.hist-list{padding:var(--sp2) 0}
.hist-card{margin:0 var(--sp3) var(--sp2);background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);overflow:hidden;animation:fadeUp .3s ease}
.hist-card-head{padding:var(--sp2) var(--sp3);display:flex;justify-content:space-between;align-items:center;cursor:pointer;border-bottom:1px solid var(--line2)}
.hist-card-head:hover{background:var(--bg2)}
.hch-left{flex:1}
.hch-date{font-size:var(--xs);color:var(--t4);margin-bottom:3px}
.hch-q{font-size:var(--sm);color:var(--t1);font-weight:500;line-height:1.45}
.hch-right{display:flex;align-items:center;gap:8px}
.hch-chevron{font-size:.55rem;color:var(--t4);transition:transform .3s}
.hch-chevron.open{transform:rotate(180deg);color:var(--gold)}
.hist-card-body{padding:var(--sp2) var(--sp3) var(--sp3);font-size:var(--sm);color:var(--t2);line-height:2.1;white-space:pre-wrap;border-top:1px solid var(--line)}
.hist-del-btn{padding:3px 8px;border-radius:6px;border:1px solid var(--line);background:transparent;color:var(--t4);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:all .2s;flex-shrink:0}
.hist-del-btn:hover{border-color:#e05a3a;color:#e05a3a}
.hist-empty{padding:var(--sp5) var(--sp3);text-align:center;color:var(--t4);font-size:var(--sm);line-height:2.2}

/* ═══════════════════════════════════════════════
   PATCH: 44 missing classes (2026-03-11)
═══════════════════════════════════════════════ */

/* ── 랜딩 히어로존 ── */
.land-hero{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100svh;padding:var(--sp3) var(--sp3);gap:var(--sp1);position:relative;}
.land-scroll-hint{text-align:center;color:var(--t4);font-size:var(--xs);padding:var(--sp2) 0;animation:fadein 1.2s ease 0.8s both;}
.land-scroll-hint span{display:inline-block;animation:bounce-y 1.8s ease-in-out infinite;}
@keyframes bounce-y{0%,100%{transform:translateY(0);}50%{transform:translateY(6px);}}
.land-scroll-zone{padding:var(--sp4) 0;}

/* ── 랜딩 CTA 버튼 ── */
.land-start-primary{width:100%;padding:16px;background:var(--gold);color:#1A1420;font-size:var(--sm);font-weight:700;border:none;border-radius:var(--r2);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(232,176,72,0.4);transition:transform .15s,box-shadow .15s;}
.land-start-primary:hover{transform:translateY(-2px);box-shadow:0 6px 28px rgba(232,176,72,0.5);}
.land-start-primary:active{transform:translateY(0);}
.land-kakao-secondary{width:100%;padding:12px;background:transparent;color:var(--t3);font-size:var(--xs);font-weight:400;border:1px solid var(--border);border-radius:var(--r2);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:border-color .15s,color .15s;}
.land-kakao-secondary:hover{border-color:var(--gold);color:var(--gold);}
.land-ghost-link{background:none;border:none;color:var(--t4);font-size:var(--xs);cursor:pointer;text-decoration:underline;padding:8px 0;}
.land-ghost-link:hover{color:var(--gold);}
.kakao-icon-wrap{display:flex;align-items:center;justify-content:center;width:18px;height:18px;}

/* ── 랜딩 퀵질문 섹션 ── */
.land-quick-section{width:100%;max-width:480px;margin:0 auto;}
.land-quick-label{font-size:var(--sm);font-weight:600;color:var(--t2);margin-bottom:var(--sp1);padding:0 2px;}
.land-sugg-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;}
.land-sugg-chip{padding:5px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:20px;color:var(--t3);font-size:var(--xs);cursor:pointer;transition:border-color .15s,color .15s,background .15s;}
.land-sugg-chip:hover{border-color:var(--gold);color:var(--gold);background:var(--goldf);}

/* ── step2 추천 칩 ── */
.suggest-row{display:flex;flex-wrap:wrap;gap:7px;margin:var(--sp1) 0 var(--sp2);}
.suggest-chip{padding:6px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:20px;color:var(--t3);font-size:var(--xs);cursor:pointer;transition:border-color .15s,color .15s,background .15s;}
.suggest-chip:hover{border-color:var(--gold);color:var(--gold);background:var(--goldf);}

/* ── 결과 상단 공유바 ── */
.res-top-bar{display:flex;gap:8px;justify-content:flex-end;padding:0 0 var(--sp2);margin-bottom:var(--sp1);}
.res-top-btn{padding:8px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r1);color:var(--t3);font-size:var(--xs);cursor:pointer;display:flex;align-items:center;gap:5px;transition:border-color .15s,color .15s;}
.res-top-btn:hover{border-color:var(--gold);color:var(--gold);}
.res-top-btn.primary{background:var(--goldf);border-color:var(--gold);color:var(--gold);font-weight:600;}

/* ── 기능 소개 카드 그리드 ── */
.feature-guide{margin:var(--sp3) 0;padding:var(--sp3);background:var(--bg2);border-radius:var(--r2);border:1px solid var(--border);}
.feature-guide-title{font-size:var(--sm);font-weight:600;color:var(--t2);margin-bottom:var(--sp2);}
.feature-guide-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.fg-card{display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg1);border:1px solid var(--border);border-radius:var(--r1);cursor:pointer;text-align:left;transition:border-color .15s,background .15s;}
.fg-card:hover{border-color:var(--gold);background:var(--goldf);}
.fg-icon{font-size:22px;flex-shrink:0;}
.fg-info{display:flex;flex-direction:column;gap:2px;}
.fg-name{font-size:var(--xs);font-weight:600;color:var(--t2);}
.fg-desc{font-size:10px;color:var(--t4);line-height:1.4;}

/* ── 업그레이드 모달 ── */
.upgrade-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
.upgrade-modal{width:100%;max-width:480px;background:var(--bg2);border-radius:var(--r2) var(--r2) 0 0;padding:var(--sp3);max-height:90svh;overflow-y:auto;}
.upgrade-modal-title{font-size:var(--md);font-weight:700;color:var(--t1);margin-bottom:6px;}
.upgrade-modal-sub{font-size:var(--xs);color:var(--t3);margin-bottom:var(--sp2);line-height:1.5;}
.upgrade-pkgs{display:flex;flex-direction:column;gap:10px;}
.upgrade-pkg-hot{display:inline-block;background:var(--rose,#E87B8A);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;margin-bottom:4px;}
.upgrade-pkg-e{font-size:22px;margin-bottom:2px;}
.upgrade-pkg-n{font-size:var(--sm);font-weight:700;color:var(--t1);}
.upgrade-pkg-p{font-size:var(--md);font-weight:800;color:var(--gold);margin:2px 0;}
.upgrade-pkg-q{font-size:var(--xs);color:var(--t3);}

/* ── 다른 사람 추가 모달 ── */
.other-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
.other-modal{width:100%;max-width:480px;background:var(--bg2);border-radius:var(--r2) var(--r2) 0 0;padding:var(--sp3);max-height:90svh;overflow-y:auto;}
.other-modal-title{font-size:var(--md);font-weight:700;color:var(--t1);margin-bottom:6px;}
.other-modal-sub{font-size:var(--xs);color:var(--t3);line-height:1.5;margin-bottom:var(--sp2);}

/* ── 프로필 피커 카드 ── */
.ppc-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}
.ppc-av{width:36px;height:36px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;}
.ppc-av img{width:100%;height:100%;object-fit:cover;}
.ppc-name{font-size:var(--xs);font-weight:600;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ppc-sub{font-size:10px;color:var(--t4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.profile-pick-card{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--bg1);border:1px solid var(--border);border-radius:var(--r1);cursor:pointer;transition:border-color .15s,background .15s;margin-bottom:8px;}
.profile-pick-card:hover{border-color:var(--gold);background:var(--goldf);}
.profile-pick-card.active{border-color:var(--gold);background:var(--goldf);}

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
function SkeletonLoader({qCount,saju}){
  const[si,setSi]=useState(0);
  useEffect(()=>{const id=setInterval(()=>setSi(p=>(p+1)%LOAD_STATES.length),2000);return()=>clearInterval(id);},[]);
  const pillars=[['연','yeon'],['월','wol'],['일','il'],['시','si']];
  return(
    <div className="loading-page">
      {/* 오브 애니메이션 */}
      <div className="load-orb-wrap">
        <div className="load-orb">
          <div className="load-orb-core"/>
          <div className="load-orb-ring"/>
          <div className="load-orb-ring2"/>
        </div>
      </div>
      {/* 사주 기둥 등장 */}
      {saju&&(
        <div className="load-pillars">
          {pillars.map(([l,k],i)=>(
            <div key={l} className="load-pillar">
              <div className="load-p-hj" style={{color:OC[saju[k]?CGO[Object.values(saju[k]).length]||'금':'금']||'var(--gold)'}}>{saju[k]?.gh}</div>
              <div className="load-p-hj" style={{opacity:.7}}>{saju[k]?.jh}</div>
              <div className="load-p-lbl">{l}주</div>
            </div>
          ))}
        </div>
      )}
      {/* 스켈레톤 */}
      <div className="skel-body" style={{marginTop:'var(--sp2)'}}>
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

  // 마침표 호흡 딜레이 계산 — 편지 읽는 리듬
  const getDelay=(word,base)=>{
    const trimmed=word.trimEnd();
    if(/[.!?…]$/.test(trimmed)) return base+350; // 문장 끝 — 깊게 숨
    if(/[,]$/.test(trimmed))     return base+180; // 쉼표 — 살짝 쉬고
    if(/\n/.test(word))          return base+250; // 줄바꿈 — 문단 호흡
    return base;                                   // 일반 단어
  };

  useEffect(()=>{
    if(!active||!text) return;
    setShown('');setDone(false);
    const words=text.split(/(\s+)/);
    let idx=0;
    const tick=()=>{
      if(idx>=words.length){setDone(true);return;}
      const word=words[idx];
      idx++;
      setShown(words.slice(0,idx).join(''));
      timerRef.current=setTimeout(tick, getDelay(word,speed));
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
          {!isOpen&&!display&&<div style={{fontSize:'var(--xs)',color:'var(--t4)',marginTop:3}}>이 이야기도 기다리고 있어요 ✦</div>}
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
//  👤 개인화 프로필 모달 (연인 / 직장 / 고민)
// ═══════════════════════════════════════════════════════════
function ProfileModal({profile,setProfile,onClose}){
  const[local,setLocal]=useState({...profile});
  const partnerSaju=useMemo(()=>{
    if(local.partnerBy&&local.partnerBm&&local.partnerBd)
      return getSaju(+local.partnerBy,+local.partnerBm,+local.partnerBd,12);
    return null;
  },[local.partnerBy,local.partnerBm,local.partnerBd]);
  const partnerSun=useMemo(()=>{
    if(local.partnerBm&&local.partnerBd) return getSun(+local.partnerBm,+local.partnerBd);
    return null;
  },[local.partnerBm,local.partnerBd]);

  const save=()=>{setProfile(local);onClose();};
  const upd=(k,v)=>setLocal(p=>({...p,[k]:v}));

  return(
    <div className="profile-overlay" onClick={e=>{if(e.target.className==='profile-overlay')onClose();}}>
      <div className="profile-sheet">
        <div className="profile-handle"/>
        <div className="profile-title">✦ 나의 별자리 지도</div>
        <div className="profile-sub">저장하면 모든 운세에 자동으로 반영돼요.<br/>입력할수록 더 깊이 읽어드릴게요.</div>

        {/* 연인 */}
        <div className="profile-section">
          <div className="profile-section-title">💕 연인 정보</div>
          <input className="inp" placeholder="연인 이름 (선택)"
            value={local.partner} onChange={e=>upd('partner',e.target.value)}/>
          <div style={{fontSize:'var(--xs)',color:'var(--t4)',marginBottom:8,marginTop:-8}}>생년월일을 알면 더 깊이 볼 수 있어요</div>
          <div className="row" style={{marginBottom:'var(--sp2)'}}>
            <div className="col">
              <input className="inp" placeholder="출생년도" maxLength={4} inputMode="numeric"
                value={local.partnerBy} onChange={e=>upd('partnerBy',e.target.value.replace(/\D/,''))}
                style={{marginBottom:0}}/>
            </div>
            <div className="col">
              <select className="inp" value={local.partnerBm} onChange={e=>upd('partnerBm',e.target.value)} style={{marginBottom:0}}>
                <option value="">월</option>
                {[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}
              </select>
            </div>
            <div className="col">
              <select className="inp" value={local.partnerBd} onChange={e=>upd('partnerBd',e.target.value)} style={{marginBottom:0}}>
                <option value="">일</option>
                {[...Array(31)].map((_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}
              </select>
            </div>
          </div>
          {/* 연인 사주 미리보기 */}
          {partnerSaju&&(
            <div style={{padding:'10px 12px',background:'var(--bg2)',borderRadius:'var(--r1)',border:'1px solid var(--line)',marginBottom:'var(--sp2)'}}>
              <div style={{fontSize:'var(--xs)',color:'var(--gold)',marginBottom:4}}>✦ {local.partner||'연인'}의 기질</div>
              <div style={{fontSize:'var(--xs)',color:'var(--t2)',lineHeight:1.75}}>{partnerSaju.ilganDesc}</div>
              {partnerSun&&<div style={{fontSize:'var(--xs)',color:'var(--t3)',marginTop:3}}>{partnerSun.s} {partnerSun.n} · {ON[partnerSaju.dom]} 기운</div>}
            </div>
          )}
        </div>

        {/* 직장/상황 */}
        <div className="profile-section">
          <div className="profile-section-title">💼 직장 / 현재 상황</div>
          <input className="inp" placeholder="예: 스타트업 마케터, 공무원 준비 중, 프리랜서 디자이너..."
            value={local.workplace} onChange={e=>upd('workplace',e.target.value)}/>
        </div>

        {/* 요즘 고민 */}
        <div className="profile-section">
          <div className="profile-section-title">🌙 요즘 가장 큰 고민</div>
          <textarea className="diy-inp" placeholder="예: 이직을 할지 말지 고민 중이에요 / 연인이랑 자꾸 다퉈요 / 돈이 자꾸 나가요..."
            value={local.worryText} onChange={e=>upd('worryText',e.target.value)}
            style={{height:72,marginBottom:0}}/>
        </div>

        <button className="profile-save-btn" onClick={save}>저장하고 반영하기 ✦</button>
        <button className="profile-close-btn" onClick={onClose}>나중에 할게요</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  🗂️ 사이드바
// ═══════════════════════════════════════════════════════════
function Sidebar({user,step,onClose,onNav,onKakaoLogin,onKakaoLogout,onProfileOpen}){
  const[histItems,setHistItems]=useState(()=>loadHistory());
  const[search,setSearch]=useState('');

  const filtered=histItems.filter(h=>
    h.questions.some(q=>q.includes(search))||
    h.answers.some(a=>a.includes(search))
  );

  const del=(id,e)=>{
    e.stopPropagation();
    deleteHistory(id);
    setHistItems(loadHistory());
  };

  const SLOT_EMOJI={morning:'🌅',afternoon:'✦',evening:'🌙',dawn:'🌌'};

  return(
    <>
      <div className="sidebar-overlay" onClick={onClose}/>
      <div className="sidebar">
        {/* 헤더 */}
        <div className="sidebar-head">
          <div className="sidebar-logo">✦ byeolsoom</div>
          {user?(
            <div className="sidebar-user">
              {user.profileImage
                ?<img className="sidebar-av" src={user.profileImage} alt="프로필"/>
                :<div className="sidebar-av-ph">🌙</div>}
              <div>
                <div className="sidebar-uname">{user.nickname}님</div>
                <div className="sidebar-usub">별숨과 함께하는 중</div>
              </div>
            </div>
          ):(
            <div className="sidebar-user">
              <div className="sidebar-av-ph">✦</div>
              <div>
                <div className="sidebar-uname">게스트</div>
                <div className="sidebar-usub" style={{cursor:'pointer',color:'var(--gold)'}} onClick={onKakaoLogin}>카카오 로그인 →</div>
              </div>
            </div>
          )}
        </div>

        {/* 본문 */}
        <div className="sidebar-body">
          {/* 메뉴 */}
          <div className="sidebar-section">
            <div className="sidebar-section-lbl">메뉴</div>
            {[
              {icon:'🏠',label:'홈',s:0},
              {icon:'✦',label:'별숨에게 물어보기',s:1},
              {icon:'📅',label:'월간 리포트',s:6},
              {icon:'💞',label:'우리가 만나면',s:7},
              {icon:'💌',label:'별의 편지',s:8},
            ].map(m=>(
              <button key={m.s} className={`sidebar-menu-item ${step===m.s?'active':''}`}
                onClick={()=>{onNav(m.s);onClose();}}>
                <span className="smi-icon">{m.icon}</span>
                <span className="smi-text">{m.label}</span>
              </button>
            ))}
            {user&&(
              <button className="sidebar-menu-item" onClick={()=>{onProfileOpen();onClose();}}>
                <span className="smi-icon">⚙️</span>
                <span className="smi-text">나의 별자리 지도</span>
              </button>
            )}
          </div>

          {/* 히스토리 */}
          <div className="sidebar-section">
            <div className="sidebar-section-lbl">지난 이야기 ({histItems.length})</div>
            {histItems.length>0&&(
              <div style={{padding:'0 var(--sp3) 8px'}}>
                <input className="hist-search-inp" placeholder="🔍  지난 이야기 검색..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
            )}
            {filtered.length===0?(
              <div className="sidebar-empty">
                아직 별숨과 나눈 이야기가 없어요 🌙<br/>
                첫 질문을 던져봐요
              </div>
            ):(
              filtered.slice(0,15).map(h=>(
                <div key={h.id} className="sidebar-hist-item" onClick={()=>{onNav('history',h);onClose();}}>
                  <div className="shi-date">{SLOT_EMOJI[h.slot]||'✦'} {h.date}</div>
                  <div className="shi-q">{h.questions[0]}</div>
                  {h.questions.length>1&&<div style={{fontSize:'var(--xs)',color:'var(--t4)',marginTop:2}}>+{h.questions.length-1}개 더</div>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="sidebar-foot">
          {user&&<button className="sidebar-foot-btn" onClick={()=>{onKakaoLogout();onClose();}}>로그아웃</button>}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  📖 히스토리 상세 페이지 (step 9)
// ═══════════════════════════════════════════════════════════
function HistoryPage({item,onBack,onDelete}){
  const[openIdx,setOpenIdx]=useState(0);
  const[deleted,setDeleted]=useState(false);
  const SLOT_LABEL={morning:'오전 운세',afternoon:'오후 운세',evening:'저녁 회고',dawn:'새벽 별숨'};

  if(deleted) return null;

  return(
    <div className="page-top">
      <div className="hist-page">
        <div className="hist-header">
          <div style={{fontSize:'var(--xs)',color:'var(--t4)',marginBottom:6}}>
            {SLOT_LABEL[item.slot]||'별숨 이야기'} · {item.date}
          </div>
          <div className="hist-title">지난 이야기</div>
          <div className="hist-sub">{item.questions.length}개의 질문과 답변</div>
        </div>
        <div className="hist-list">
          {item.questions.map((q,i)=>(
            <div key={i} className="hist-card">
              <div className="hist-card-head" onClick={()=>setOpenIdx(openIdx===i?-1:i)}>
                <div className="hch-left">
                  <div className="hch-date">Q{i+1}</div>
                  <div className="hch-q">{q}</div>
                </div>
                <div className="hch-right">
                  <span className={`hch-chevron ${openIdx===i?'open':''}`}>▼</span>
                </div>
              </div>
              {openIdx===i&&(
                <div className="hist-card-body">{item.answers[i]||'답변을 불러올 수 없어요'}</div>
              )}
            </div>
          ))}
        </div>
        <div style={{padding:'0 var(--sp3) var(--sp5)',display:'flex',gap:8}}>
          <button className="res-btn" style={{flex:1}} onClick={onBack}>← 돌아가기</button>
          <button className="hist-del-btn" onClick={()=>{onDelete(item.id);setDeleted(true);onBack();}}>삭제</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  🌅 오늘의 별숨 컴포넌트 (시간대별)
// ═══════════════════════════════════════════════════════════
function TodayByeolsoom({slot,name,saju,sun,onAsk,onReview}){
  const cfg=TIME_CONFIG[slot];
  const[reviewText,setReviewText]=useState('');
  const isEvening=slot==='evening'||slot==='dawn';

  return(
    <div className="todaybyeol" style={{background:cfg.bg,borderColor:cfg.border}}>
      <div className="todaybyeol-top">
        <div className="tbt-orb" style={{background:cfg.bg,border:`1px solid ${cfg.border}`}}>{cfg.emoji}</div>
        <div>
          <div className="tbt-label" style={{color:cfg.color}}>{cfg.label}</div>
          <div className="tbt-title" style={{color:'var(--t1)'}}>{cfg.greeting(name)}</div>
        </div>
      </div>
      <div className="todaybyeol-body" style={{background:'var(--bg1)'}}>
        {isEvening&&(
          <>
            <div style={{fontSize:'var(--xs)',color:'var(--t3)',marginBottom:6,lineHeight:1.7}}>
              {slot==='evening'?'오늘 있었던 일을 적으면 별숨이 다시 읽어드릴게요':'잠 못 드는 이 새벽, 뭔가 마음에 걸리는 게 있나요?'}
            </div>
            <textarea className="review-inp"
              placeholder={cfg.inputPlaceholder}
              value={reviewText}
              onChange={e=>setReviewText(e.target.value)}/>
          </>
        )}
        <button className="tbt-cta"
          style={{background:cfg.ctaBg,color:cfg.ctaColor}}
          onClick={()=>{
            if(isEvening&&reviewText.trim()){onReview(reviewText,cfg.prompt);}
            else{onAsk(cfg.prompt);}
          }}>
          {cfg.ctaText}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  📖 랜딩 샘플 에세이 미리보기
// ═══════════════════════════════════════════════════════════
function SamplePreview(){
  const[text,setText]=useState('');
  const[essayIdx,setEssayIdx]=useState(0);
  const timerRef=useRef(null);
  const idxRef=useRef(0);

  useEffect(()=>{
    const essay=SAMPLE_ESSAYS[essayIdx];
    setText('');idxRef.current=0;
    const tick=()=>{
      if(idxRef.current>=essay.length){
        // 2초 후 다음 에세이
        timerRef.current=setTimeout(()=>{
          setEssayIdx(p=>(p+1)%SAMPLE_ESSAYS.length);
        },2000);
        return;
      }
      idxRef.current++;
      setText(essay.slice(0,idxRef.current));
      const ch=essay[idxRef.current-1];
      const delay=ch==='.'||ch==='!'||ch==='?'?280:ch===','?120:ch==='\n'?200:28;
      timerRef.current=setTimeout(tick,delay);
    };
    timerRef.current=setTimeout(tick,400);
    return()=>clearTimeout(timerRef.current);
  },[essayIdx]);

  // 익명 감성 이름 — 실제 이름처럼 보이지 않는 별자리 기반
  const signs=['물고기자리','사자자리','천칭자리'];
  return(
    <div className="sample-preview">
      <div className="sample-badge">✦ 별숨이 만든 예시 이야기예요</div>
      <div className="sample-name">{signs[essayIdx]}인 당신에게</div>
      <div className="sample-text">{text}<span className="sample-cursor"/></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  💌 별의 편지 페이지
// ═══════════════════════════════════════════════════════════
function LetterPage({form,saju,sun,moon,today,callApi,buildCtx,onBack}){
  const[letterText,setLetterText]=useState('');
  const[loading,setLoading]=useState(true);
  const futureDate=useMemo(()=>{
    const d=new Date();d.setDate(d.getDate()+92);
    return`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
  },[]);
  const{shown,done,skipToEnd}=useWordTyping(letterText,!!letterText&&!loading,35);

  useEffect(()=>{
    (async()=>{
      try{
        const res=await fetch('/api/ask',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            userMessage:`[요청] 3개월 후(${futureDate})의 나에게 보내는 별의 편지를 써줘요. "미래의 나에게"로 시작하는 편지 형식으로, 지금의 나에게 3개월 뒤가 어떤 모습일지, 어떤 변화가 있을지, 무엇을 기억하면 좋을지를 따뜻하게 담아줘요.`,
            context:buildCtx(),
            isChat:false,isReport:false,isLetter:true,
          }),
        });
        const data=await res.json();
        if(!res.ok)throw new Error(data.error);
        setLetterText(data.text||'');
      }catch{
        setLetterText('별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!');
      }finally{setLoading(false);}
    })();
  },[]);

  const saveImage=()=>{
    const canvas=document.createElement('canvas');
    canvas.width=900;canvas.height=600;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#0D0B14';ctx.fillRect(0,0,900,600);
    ctx.fillStyle='#E8B048';ctx.fillRect(0,0,900,3);
    ctx.font='500 18px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle='#E8B048';ctx.fillText('byeolsoom ✦ 별의 편지',48,50);
    ctx.font='400 15px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle='#8A7FA0';ctx.fillText(`${futureDate}에 열어봐요`,48,80);
    ctx.font='300 16px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle='#C8BEDE';
    const lines=letterText.slice(0,300).split('\n');
    let y=130;
    lines.forEach(line=>{
      if(y>520)return;
      const chunks=[];let tmp='';
      for(const ch of line){
        if(ctx.measureText(tmp+ch).width>800){chunks.push(tmp);tmp=ch;}else tmp+=ch;
      }
      if(tmp)chunks.push(tmp);
      chunks.forEach(chunk=>{ctx.fillText(chunk,48,y);y+=28;});
      y+=8;
    });
    ctx.font='400 13px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle='#4A4260';ctx.fillText('✦ 별숨이 당신에게 보낸 편지',48,570);
    const a=document.createElement('a');
    a.download=`byeolsoom_letter.png`;a.href=canvas.toDataURL('image/png');a.click();
  };

  return(
    <div className="page-top">
      <div className="letter-page">
        <div className="letter-envelope">
          <div className="letter-env-top">💌</div>
          <div className="letter-body">
            <div className="letter-date-to">
              <strong>{futureDate}</strong>의 {form.name||'당신'}에게 전하는 편지
            </div>
            {loading?(
              <div style={{textAlign:'center',padding:'var(--sp4)',color:'var(--t3)'}}>
                <div style={{fontSize:'1.5rem',marginBottom:'var(--sp2)',animation:'orbPulse 2s infinite'}}>✦</div>
                별이 당신의 3개월 뒤를 읽고 있어요...
              </div>
            ):(
              <div className="letter-content">
                <p>{shown}{!done&&<span className="typing-cursor"/>}</p>
              </div>
            )}
          </div>
          <div className="letter-seal">
            <span className="seal-icon">✦</span>
            <span className="seal-text">byeolsoom · 별숨이 씀</span>
          </div>
        </div>
        <div className="letter-actions">
          {done&&<button className="res-btn" onClick={saveImage} style={{flex:1}}>↗ 이미지 저장</button>}
          {!done&&letterText&&<button className="res-btn" onClick={skipToEnd} style={{flex:1}}>바로 보기 ✦</button>}
          <button className="res-btn" onClick={onBack} style={{flex:1}}>← 돌아가기</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  💞 시나리오 궁합 페이지
// ═══════════════════════════════════════════════════════════
function CompatPage({myForm,mySaju,mySun,callApi,buildCtx,onBack}){
  const[partner,setPartner]=useState({name:'',by:'',bm:'',bd:'',gender:''});
  const[place,setPlace]=useState('burger');
  const[result,setResult]=useState(null);
  const[loading,setLoading]=useState(false);
  const[phase,setPhase]=useState('input'); // 'input' | 'result'

  const partnerSaju=useMemo(()=>(partner.by&&partner.bm&&partner.bd)?getSaju(+partner.by,+partner.bm,+partner.bd,12):null,[partner]);
  const partnerSun=useMemo(()=>(partner.bm&&partner.bd)?getSun(+partner.bm,+partner.bd):null,[partner.bm,partner.bd]);
  const partnerOk=partner.by&&partner.bm&&partner.bd&&partner.gender;
  const selectedPlace=PLACES.find(p=>p.id===place)||PLACES[0];

  // 궁합 점수 계산 (오행 상생/상극 기반)
  const compatScore=useMemo(()=>{
    if(!mySaju||!partnerSaju)return 75;
    const SENG={목:['수','목'],화:['목','화'],토:['화','토'],금:['토','금'],수:['금','수']};
    const a=mySaju.dom,b=partnerSaju.dom;
    if(SENG[a]?.includes(b)||SENG[b]?.includes(a))return Math.floor(Math.random()*15)+80;
    if(a===b)return Math.floor(Math.random()*10)+75;
    return Math.floor(Math.random()*20)+60;
  },[mySaju,partnerSaju]);

  const buildPartnerCtx=()=>{
    let c=`[나 — ${myForm.name||'A'}]
`;
    c+=`${buildCtx()}
`;
    c+=`[상대방 — ${partner.name||'B'} · ${+new Date().getFullYear()-+partner.by}세 · ${partner.gender}]
`;
    if(partnerSaju){
      c+=`연주: ${partnerSaju.yeon.g}${partnerSaju.yeon.j} / 월주: ${partnerSaju.wol.g}${partnerSaju.wol.j} / 일주: ${partnerSaju.il.g}${partnerSaju.il.j}
`;
      c+=`기질: ${partnerSaju.ilganDesc}
강한 기운: ${ON[partnerSaju.dom]}

`;
    }
    if(partnerSun)c+=`별자리: ${partnerSun.n}(${partnerSun.s}) — ${partnerSun.desc}
`;
    return c;
  };

  const run=async()=>{
    setLoading(true);setPhase('result');setResult(null);
    const placeObj=PLACES.find(p=>p.id===place)||PLACES[0];
    try{
      const res=await fetch('/api/ask',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          userMessage:`[요청] 두 사람이 ${placeObj.label}에 갔을 때의 짧은 시나리오를 써줘요.

규칙:
- 말풍선 형식으로 6~8개 대사
- JSON 배열로만 응답: [{"who":"A","text":"..."}, {"who":"B","text":"..."},...,{"summary":"두 사람 관계 한 줄 총평"}]
- 두 사람의 기질 차이가 자연스럽게 드러나게
- 웃음 포인트 1개, 공감 포인트 1개
- 마지막 객체에 summary 키로 총평 한 문장`,
          context:buildPartnerCtx(),
          isChat:false,isReport:false,isScenario:true,
        }),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error);
      // JSON 파싱
      try{
        const raw=data.text.replace(/```json|```/g,'').trim();
        const parsed=JSON.parse(raw);
        setResult({bubbles:parsed.filter(b=>b.who),summary:parsed.find(b=>b.summary)?.summary||''});
      }catch{
        setResult({bubbles:[{who:'A',text:data.text}],summary:''});
      }
    }catch{
      setResult({bubbles:[{who:'A',text:'별이 잠시 쉬고 있어요 🌙 다시 시도해봐요!'}],summary:''});
    }finally{setLoading(false);}
  };

  if(phase==='result'){
    return(
      <div className="page-top">
        <div className="compat-page">
          <div className="compat-header">
            <div style={{fontSize:'2rem',marginBottom:8}}>{selectedPlace.emoji}</div>
            <div className="compat-title">{myForm.name||'나'} × {partner.name||'상대'}</div>
            <div className="compat-sub">{selectedPlace.label}에서 만났을 때</div>
          </div>

          {/* 궁합 점수 */}
          <div className="compat-total" style={{marginBottom:'var(--sp2)'}}>
            <div className="compat-total-label">✦ 두 별의 공명 지수</div>
            <div className="kizmet-score">{compatScore}%</div>
            <div className="kizmet-bar"><div className="kizmet-fill" style={{width:`${compatScore}%`}}/></div>
            {mySaju&&partnerSaju&&(
              <div style={{fontSize:'var(--xs)',color:'var(--t3)'}}>
                {ON[mySaju.dom]} 기운 × {ON[partnerSaju.dom]} 기운
              </div>
            )}
          </div>

          {/* 말풍선 시나리오 */}
          <div className="scenario-wrap">
            <div className="scenario-header">
              <span className="scenario-place-icon">{selectedPlace.emoji}</span>
              <div>
                <div className="scenario-place-name">{selectedPlace.label} 시나리오</div>
                <div className="scenario-sub">{myForm.name||'A'} × {partner.name||'B'}</div>
              </div>
            </div>
            {loading?(
              <div className="scenario-loading">
                <div className="scenario-typing-dots"><span/><span/><span/></div>
                두 별의 이야기를 쓰고 있어요...
              </div>
            ):(
              <div className="bubble-list">
                {result?.bubbles.map((b,i)=>(
                  <div key={i} className={`bubble-row ${b.who==='B'?'b-row':'a-row'}`} style={{animationDelay:`${i*0.1}s`}}>
                    <div className={`bubble-avatar ${b.who==='B'?'b-av':'a-av'}`}>
                      {b.who==='A'?(myForm.name||'A').slice(0,1):(partner.name||'B').slice(0,1)}
                    </div>
                    <div>
                      <div className="bubble-name">{b.who==='A'?myForm.name||'A':partner.name||'B'}</div>
                      <div className="bubble-text">{b.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {result?.summary&&(
              <div className="scenario-summary">✦ {result.summary}</div>
            )}
          </div>

          <div className="compat-btns">
            <button className="res-btn" style={{flex:1}} onClick={()=>{setPhase('input');setResult(null);}}>↩ 다시 하기</button>
            <button className="res-btn" style={{flex:1}} onClick={onBack}>← 결과로</button>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div className="page">
      <div className="inner">
        <div className="compat-page">
          <div className="compat-header">
            <div className="compat-title">우리가 만나면 💞</div>
            <div className="compat-sub">상대방의 생년월일을 입력하면<br/>두 별이 만나는 장면을 보여드려요</div>
          </div>

          {/* 나 카드 */}
          <div className="compat-section">
            <div className="compat-label">두 사람</div>
            <div className="person-cards">
              <div className="person-card a-card">
                <span className="person-badge a">나 (A)</span>
                <div style={{fontSize:'var(--xs)',color:'var(--t2)',lineHeight:1.7}}>
                  <div>{myForm.name||'나'} · {+new Date().getFullYear()-+myForm.by}세</div>
                  {mySun&&<div>{mySun.s} {mySun.n}</div>}
                  {mySaju&&<div>{ON[mySaju.dom]} 기운</div>}
                </div>
              </div>
              <div className="person-card b-card">
                <span className="person-badge b">상대 (B)</span>
                <input className="inp" placeholder="이름(선택)" value={partner.name}
                  onChange={e=>setPartner(p=>({...p,name:e.target.value}))}
                  style={{marginBottom:6,padding:'7px 10px',fontSize:'var(--xs)'}}/>
                <div className="row" style={{gap:4}}>
                  <input className="inp" placeholder="년도" maxLength={4} inputMode="numeric"
                    value={partner.by} onChange={e=>setPartner(p=>({...p,by:e.target.value.replace(/\D/,'')}))}
                    style={{marginBottom:0,padding:'7px 6px',fontSize:'var(--xs)'}}/>
                  <select className="inp" value={partner.bm} onChange={e=>setPartner(p=>({...p,bm:e.target.value}))}
                    style={{marginBottom:0,padding:'7px 4px',fontSize:'var(--xs)'}}>
                    <option value="">월</option>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                  <select className="inp" value={partner.bd} onChange={e=>setPartner(p=>({...p,bd:e.target.value}))}
                    style={{marginBottom:0,padding:'7px 4px',fontSize:'var(--xs)'}}>
                    <option value="">일</option>{[...Array(31)].map((_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </div>
                <div className="gender-group" style={{marginTop:6,marginBottom:0}}>
                  {['여성','남성','기타'].map(g=>(
                    <button key={g} className={`gbtn ${partner.gender===g?'on':''}`}
                      onClick={()=>setPartner(p=>({...p,gender:g}))}
                      style={{padding:'6px 4px',fontSize:'var(--xs)'}}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 장소 선택 */}
          <div className="compat-section">
            <div className="compat-label">어디서 만날까요?</div>
            <div className="place-grid">
              {PLACES.map(p=>(
                <button key={p.id} className={`place-btn ${place===p.id?'on':''}`} onClick={()=>setPlace(p.id)}>
                  <span className="place-emoji">{p.emoji}</span>
                  <span className="place-label">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="btn-main" disabled={!partnerOk||loading} onClick={run}>
            {loading?'두 별이 만나는 중...':'✦ 시나리오 보기'}
          </button>
          <button className="res-btn" style={{width:'100%',marginTop:8}} onClick={onBack}>← 돌아가기</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  🏠 메인 앱
// ═══════════════════════════════════════════════════════════
export default function App(){
  const[isDark,setIsDark]=useState(false);
  // ── 사이드바 / 히스토리 ──
  const[showSidebar,setShowSidebar]=useState(false);
  const[histItem,setHistItem]=useState(null);
  const[histItems,setHistItems]=useState(()=>loadHistory());
  const timeSlot=useMemo(()=>getTimeSlot(),[]);
  const[showUpgradeModal,setShowUpgradeModal]=useState(false);
  const[showOtherProfileModal,setShowOtherProfileModal]=useState(false);
  // 다른 사람 프로필 (최대 3개) — {name,by,bm,bd,bh,gender,noTime}[]
  const[otherProfiles,setOtherProfiles]=useState(()=>{
    try{const s=localStorage.getItem('byeolsoom_others');return s?JSON.parse(s):[];}catch{return[];}
  });
  const[activeProfileIdx,setActiveProfileIdx]=useState(0); // 0=나, 1~3=다른 사람
  const[otherForm,setOtherForm]=useState({name:'',by:'',bm:'',bd:'',bh:'',gender:'',noTime:false});
  // ── 카카오 유저 ──
  const[user,setUser]=useState(()=>{
    try{const u=localStorage.getItem('byeolsoom_user');return u?JSON.parse(u):null;}catch{return null;}
  });
  // ── 개인화 프로필 (연인/직장) ──
  const[profile,setProfile]=useState(()=>{
    try{const p=localStorage.getItem('byeolsoom_extra');return p?JSON.parse(p):{partner:'',partnerBy:'',partnerBm:'',partnerBd:'',workplace:'',worryText:''};}catch{return{partner:'',partnerBy:'',partnerBm:'',partnerBd:'',workplace:'',worryText:''};}
  });
  const[showProfileModal,setShowProfileModal]=useState(false);
  // ── 결제 ──
  const[payToast,setPayToast]=useState(null);
  const[step,setStep]=useState(0); // 0랜딩 1입력 2질문 3로딩 4결과 5채팅 6리포트 7궁합 8편지 9히스토리
  // ── 랜딩 퀵질문 ──
  const[quickQ,setQuickQ]=useState('');
  const[quickCat,setQuickCat]=useState(0);
  const[form,setForm]=useState(()=>{
    try{
      const saved=localStorage.getItem('byeolsoom_profile');
      if(saved){const p=JSON.parse(saved);return{name:p.name||'',by:p.by||'',bm:p.bm||'',bd:p.bd||'',bh:p.bh||'',gender:p.gender||'',noTime:p.noTime||false};}
    }catch(e){}
    return{name:'',by:'',bm:'',bd:'',bh:'',gender:'',noTime:false};
  });
  const[cat,setCat]=useState(0);
  const[selQs,setSelQs]=useState([]);
  const[diy,setDiy]=useState('');
  const[pkg,setPkg]=useState('free'); // 기본값: 무료 첫 번째 이야기
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



  // ── 카카오 SDK 동적 로드 ──
  useEffect(()=>{
    const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;
    if(!JS_KEY){
      console.warn('[별숨] VITE_KAKAO_JS_KEY 환경변수가 없어요. .env.local 확인해주세요.');
      return;
    }
    const initKakao = () => {
      if(window.Kakao && !window.Kakao.isInitialized()){
        window.Kakao.init(JS_KEY);
        console.log('[별숨] 카카오 SDK 초기화 완료');
      }
    };
    if(window.Kakao){
      initKakao();
      return;
    }
    if(document.getElementById('kakao-sdk')){
      // 스크립트 태그는 있지만 아직 로드 중 — onload 대기
      const existing = document.getElementById('kakao-sdk');
      const prev = existing.onload;
      existing.onload = () => { if(prev) prev(); initKakao(); };
      return;
    }
    const script = document.createElement('script');
    script.id = 'kakao-sdk';
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = initKakao;
    script.onerror = () => console.error('[별숨] 카카오 SDK 로드 실패. 네트워크 확인해주세요.');
    document.head.appendChild(script);
  },[]);

  // ── 카카오 로그인 리다이렉트 처리 (code 파라미터) ──
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if(!code) return;
    // URL에서 code 제거
    window.history.replaceState({}, '', window.location.pathname);
    (async()=>{
      try{
        const res = await fetch('/api/kakao-auth', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({code, redirectUri: window.location.origin}),
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error||'인증 실패');
        const userData = {id:String(data.id), nickname:data.nickname||'별님', profileImage:data.profileImage||null};
        setUser(userData);
        localStorage.setItem('byeolsoom_user', JSON.stringify(userData));
      }catch(err){
        console.error('[별숨] 카카오 code 처리 오류:', err);
      }
    })();
  },[]);

  useEffect(()=>{document.documentElement.setAttribute('data-theme',isDark?'dark':'light');},[isDark]);
  useEffect(()=>{
    if(form.by&&form.bm&&form.bd){
      try{localStorage.setItem('byeolsoom_profile',JSON.stringify(form));}catch(e){}
    }
  },[form]);
  useEffect(()=>{
    try{localStorage.setItem('byeolsoom_extra',JSON.stringify(profile));}catch(e){}
  },[profile]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'smooth'});},[step]);
  useEffect(()=>{
    try{localStorage.setItem('byeolsoom_others',JSON.stringify(otherProfiles));}catch{}
  },[otherProfiles]);
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
  // activeProfileIdx에 따라 올바른 프로필로 컨텍스트 생성
  const activeForm = activeProfileIdx===0 ? form : (otherProfiles[activeProfileIdx-1]||form);
  const activeSaju = useMemo(()=>{
    const f=activeForm;
    return (f.by&&f.bm&&f.bd)?getSaju(+f.by,+f.bm,+f.bd,f.noTime?12:+(f.bh||12)):null;
  },[activeForm]);
  const activeSun = useMemo(()=>(activeForm.bm&&activeForm.bd)?getSun(+activeForm.bm,+activeForm.bd):null,[activeForm]);
  const activeAge = activeForm.by?today.year-+activeForm.by:0;

  const buildCtx=useCallback(()=>{
    const af=activeForm;
    const as_=activeSaju;
    const asSun=activeSun;
    let c=`[${af.name||'고객님'} · ${activeAge}세 · ${af.gender||''}]\n\n`;
    if(activeProfileIdx>0) c=`[${af.name||'이 사람'}의 별숨 — 대신 물어봐주는 질문]\n` + c;
    if(as_){
      c+=`[사주 기운]\n`;
      c+=`연주: ${as_.yeon.g}${as_.yeon.j} / 월주: ${as_.wol.g}${as_.wol.j} / 일주: ${as_.il.g}${as_.il.j} / 시주: ${as_.si.g}${as_.si.j}\n`;
      c+=`타고난 기질: ${as_.ilganDesc}\n`;
      c+=`강한 기운: ${ON[as_.dom]} / 약한 기운: ${ON[as_.lac]}\n\n`;
    }
    if(asSun){
      c+=`[별자리 기운]\n`;
      c+=`태양: ${asSun.n}(${asSun.s}) — ${asSun.desc}\n`;
    }
    // 연인 정보
    if(profile.partner){
      c+=`[연인 정보]\n이름: ${profile.partner}\n`;
      if(profile.partnerBy&&profile.partnerBm&&profile.partnerBd){
        try{
          const ps=getSaju(+profile.partnerBy,+profile.partnerBm,+profile.partnerBd,12);
          const psun=getSun(+profile.partnerBm,+profile.partnerBd);
          c+=`연인 사주: 연${ps.yeon.g}${ps.yeon.j} 월${ps.wol.g}${ps.wol.j} 일${ps.il.g}${ps.il.j}\n`;
          c+=`연인 기질: ${ps.ilganDesc} / 강한 기운: ${ON[ps.dom]}\n`;
          c+=`연인 별자리: ${psun.n}(${psun.s})\n\n`;
        }catch(e){}
      }
    }
    // 직장/고민 정보
    if(profile.workplace) c+=`[직장/상황] ${profile.workplace}\n`;
    if(profile.worryText) c+=`[지금 고민] ${profile.worryText}\n`;
    return c;
  },[activeForm,activeSaju,activeSun,activeAge,profile,activeProfileIdx]);

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


  // ── 카카오 로그인 ──
  const kakaoLogin=useCallback(()=>{
    const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

    // ① 환경변수 없음
    if(!JS_KEY){
      alert('카카오 앱 키가 설정되지 않았어요.\n.env.local 에 VITE_KAKAO_JS_KEY 를 입력해주세요.');
      return;
    }

    // ② SDK 자체가 없음 (네트워크 오류 등)
    if(!window.Kakao){
      alert('카카오 SDK를 불러오지 못했어요 🌙\n잠시 후 다시 시도해봐요.');
      return;
    }

    // ③ 초기화 안 됨 → 재시도
    if(!window.Kakao.isInitialized()){
      try{
        window.Kakao.init(JS_KEY);
      }catch(e){
        console.error('[별숨] Kakao.init 실패:', e);
        alert('카카오 초기화에 실패했어요 🌙\n페이지를 새로고침 후 시도해봐요.');
        return;
      }
    }

    // ④ 로그인 실행 — SDK 2.x 방식 (Kakao.Auth.login 삭제됨)
    // getUserInfo로 액세스토큰 직접 획득
    window.Kakao.Auth.authorize({
      redirectUri: window.location.origin,
    });
  },[]);

  const kakaoLogout=useCallback(()=>{
    if(window.Kakao?.Auth) window.Kakao.Auth.logout(()=>{});
    setUser(null);
    localStorage.removeItem('byeolsoom_user');
  },[]);



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
    // 히스토리 저장
    addHistory(selQs,newAnswers);
    setHistItems(loadHistory());
    setLatestChatIdx(-1);
    setStep(4);setOpenAcc(0);
  };

  // 퀵질문 (랜딩에서 바로 질문)
  const askQuick=async(q)=>{
    if(!q.trim())return;
    if(!formOk){
      // 프로필 없으면 입력 먼저
      setSelQs([q.trim()]);
      setStep(1);
      return;
    }
    setSelQs([q.trim()]);
    setStep(3);setAnswers([]);setTypedSet(new Set());setOpenAcc(0);
    try{
      const ans=await callApi(`[질문]\n${q.trim()}`);
      setAnswers([ans]);
      addHistory([q.trim()],[ans]);
      setHistItems(loadHistory());
    }catch{
      setAnswers(['별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.']);
    }
    setStep(4);setOpenAcc(0);
  };

  // 시간대별 오늘의 별숨 ask
  const askTimeSlot=async(prompt)=>{
    if(!formOk){setStep(1);return;}
    const q=TIME_CONFIG[timeSlot].label;
    setSelQs([q]);
    setStep(3);setAnswers([]);setTypedSet(new Set());setOpenAcc(0);
    try{
      const ans=await callApi(`[질문]\n${prompt}`);
      setAnswers([ans]);
      addHistory([q],[ans]);
      setHistItems(loadHistory());
    }catch{
      setAnswers(['별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.']);
    }
    setStep(4);setOpenAcc(0);
  };

  // 저녁 회고
  const askReview=async(text,prompt)=>{
    if(!formOk){setStep(1);return;}
    const q=`오늘 하루 회고: ${text.slice(0,30)}${text.length>30?'…':''}`;
    setSelQs([q]);
    setStep(3);setAnswers([]);setTypedSet(new Set());setOpenAcc(0);
    try{
      const ans=await callApi(`[질문]\n${prompt}\n\n[오늘 있었던 일]\n${text}`);
      setAnswers([ans]);
      addHistory([q],[ans]);
      setHistItems(loadHistory());
    }catch{
      setAnswers(['별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.']);
    }
    setStep(4);setOpenAcc(0);
  };

  const handleTypingDone=useCallback((idx)=>{
    setTypedSet(p=>{const n=new Set(p);n.add(idx);return n;});
    // ✅ 타이핑 완료: 현재 답변 유지 (닫지 않음)
    // 다음 질문이 있으면 살짝 열었다가(500ms) 다시 닫기 — peek 효과
    const next=idx+1;
    if(next < selQs.length){
      setTimeout(()=>{
        setOpenAcc(next); // 다음 질문 살짝 열기
        setTimeout(()=>{
          setOpenAcc(p=>p===next?-1:p); // 0.8초 후 닫기 (이미 사용자가 바꿨으면 유지)
        },800);
      },400);
    }
  },[selQs.length]);

  const handleAccToggle=i=>{setOpenAcc(p=>p===i?-1:i);};

  // ✅ 더 물어보기 — 제대로 구현 (chatLeft 기반, 이용권 선택 넛지)
  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading)return;
    // 무료 플랜 채팅 소진 시 업그레이드 안내
    if(chatLeft<=0){
      setShowUpgradeModal(true);
      return;
    }
    const userMsg=chatInput.trim();
    setChatInput('');
    setChatHistory(p=>[...p,{role:'user',text:userMsg}]);
    setChatLoading(true);
    setChatUsed(p=>p+1);
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

      {/* 왼쪽 상단 메뉴 버튼 (항상 표시) */}
      <button className="menu-btn" onClick={()=>setShowSidebar(true)}>☰</button>

      {/* 사이드바 */}
      {showSidebar&&(
        <Sidebar
          user={user} step={step}
          onClose={()=>setShowSidebar(false)}
          onNav={(s,item)=>{
            if(s==='history'&&item){setHistItem(item);setStep(9);}
            else{setStep(s);}
          }}
          onKakaoLogin={kakaoLogin}
          onKakaoLogout={kakaoLogout}
          onProfileOpen={()=>setShowProfileModal(true)}
        />
      )}

      <button className="theme-btn" onClick={()=>setIsDark(p=>!p)}>{isDark?'☀':'◑'}</button>
      {/* 유저 칩 */}
      {/* step>=1 일 때만 상단 칩 표시 (랜딩은 카드로 처리) */}
      {step>=1&&user&&(
        <div className="user-chip" onClick={()=>setShowProfileModal(true)} title="내 정보 수정" style={{cursor:'pointer'}}>
          {user.profileImage?<img src={user.profileImage} alt="프로필"/>:<span style={{fontSize:'1rem'}}>🌙</span>}
          <span>{user.nickname}</span>
        </div>
      )}
      {step>=1&&!user&&(
        <button className="user-chip" onClick={kakaoLogin} style={{border:'1px solid #FEE500',background:'rgba(254,229,0,.1)'}}>
          <span style={{fontSize:'.75rem',color:'var(--t2)'}}>카카오 로그인</span>
        </button>
      )}
      {step>0&&step<5&&step!==9&&<button className="back-btn" onClick={()=>setStep(p=>Math.max(0,p-1))}>←</button>}
      {(step===5||step===6||step===7||step===8)&&<button className="back-btn" onClick={()=>setStep(4)}>←</button>}
      {step===9&&<button className="back-btn" onClick={()=>{setHistItem(null);setStep(0);}}>←</button>}

      <div className="app">

        {/* ══ 0 랜딩 ══ */}
        {step===0&&(
          <div className="page step-fade">
            {/* ═══ HERO ZONE — 첫 화면에서 보이는 전부 ═══ */}
            <div className="land-hero">
              <div className="land-wordmark">byeolsoom</div>
              <div className="land-orb">
                <div className="orb-core"/><div className="orb-r1"/><div className="orb-r2"/>
              </div>
              <p className="land-copy">오늘 밤,<br/><em>당신의 별이 기다리고 있어요.</em></p>
              <p className="land-sub">동양의 별과 서양의 별이 함께<br/>당신의 이야기를 읽어드릴게요</p>

              {/* 로그인 카드 — 히어로에 포함 */}
              <div className="land-login-section">
                {user ? (
                  <div className="land-login-card logged">
                    <div className="llc-top">
                      {user.profileImage
                        ? <img className="llc-avatar" src={user.profileImage} alt="프로필"/>
                        : <div className="llc-avatar-placeholder">🌙</div>}
                      <div>
                        <div className="llc-name">{user.nickname}님 ✦</div>
                        <div className="llc-sub">
                          {form.by && saju
                            ? `${ON[saju.dom]} 기운, 오늘의 별이 기다려요`
                            : '별숨이 당신을 기억하고 있어요'}
                        </div>
                      </div>
                    </div>
                    <div className="llc-profile-chips">
                      {form.by && <span className="llc-chip filled">🀄 사주</span>}
                      {profile.partner && <span className="llc-chip filled">💕 {profile.partner}</span>}
                      {profile.workplace && <span className="llc-chip filled">💼 {profile.workplace.slice(0,10)}{profile.workplace.length>10?'…':''}</span>}
                      {histItems.length>0&&<span className="llc-chip filled" onClick={()=>setShowSidebar(true)}>📖 {histItems.length}개</span>}
                      <span className="llc-chip" onClick={()=>setShowProfileModal(true)}>+ 추가</span>
                    </div>
                    <div className="llc-actions">
                      <button className="cta-main" style={{flex:1,justifyContent:'center'}} onClick={()=>setStep(formOk?2:1)}>
                        {form.by ? '별숨에게 물어보기 ✦' : '지금 시작하기 ✦'}
                      </button>
                      <button className="res-btn" style={{padding:'13px 14px',borderRadius:'var(--r1)'}} onClick={kakaoLogout} title="로그아웃">↩</button>
                    </div>
                  </div>
                ) : (
                  <div className="land-login-card">
                    {/* ── PRIMARY: 바로 시작 ── */}
                    <button className="land-start-primary" onClick={()=>setStep(1)}>
                      ✦ 지금 바로 물어보기
                    </button>

                    {/* ── 로그인 혜택 안내 ── */}
                    <div className="land-login-why">
                      연인 운세 · 직장 조언 · 기록 저장
                    </div>

                    {/* ── SECONDARY: 카카오 로그인 ── */}
                    <button className="land-kakao-secondary" onClick={kakaoLogin}>
                      <span className="kakao-icon-wrap">
                        <svg width="12" height="11" viewBox="0 0 18 18" fill="none">
                          <path d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.38c0 2.1 1.38 3.93 3.45 4.98L4.2 15l3.54-2.34c.39.06.81.09 1.26.09 4.14 0 7.5-2.64 7.5-5.88S13.14 1.5 9 1.5z" fill="#191919"/>
                        </svg>
                      </span>
                      카카오로 로그인하면 기록이 저장돼요
                    </button>

                    {import.meta.env.DEV&&(
                      <div style={{marginTop:8,padding:'8px 10px',background:'rgba(255,100,100,.08)',border:'1px solid rgba(255,100,100,.2)',borderRadius:8,fontSize:'var(--xs)',color:'#ff8080',lineHeight:1.7}}>
                        🔧 개발 환경 체크<br/>
                        키 설정: {import.meta.env.VITE_KAKAO_JS_KEY?'✅ 있음':'❌ 없음'}<br/>
                        SDK: {typeof window!=='undefined'&&window.Kakao?'✅ 로드됨':'⏳ 로딩 중'}<br/>
                        초기화: {typeof window!=='undefined'&&window.Kakao?.isInitialized?.()===true?'✅ 완료':'⏳ 대기'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 스크롤 힌트 */}
              <div className="land-scroll-hint">
                <span>↓</span>
              </div>
            </div>

            {/* ═══ SCROLL ZONE — 스크롤해야 보이는 부가 콘텐츠 ═══ */}
            <div className="inner land-scroll-zone">

              {/* 오늘의 별숨 — 시간대별 접힌 카드 */}
              <TodayByeolsoom
                slot={timeSlot}
                name={form.name||user?.nickname||''}
                saju={saju}
                sun={sun}
                onAsk={askTimeSlot}
                onReview={askReview}
              />

              {/* 퀵질문 입력창 */}
              <div className="land-quick-section">
                <div className="land-quick-label">✦ &nbsp; 별숨에게 바로 물어봐요</div>
                <div className="land-cat-chips">
                  {CATS.map((c,i)=>(
                    <button key={c.id} className={`land-cat-chip ${quickCat===i?'on':''}`} onClick={()=>setQuickCat(i)}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
                <div className="land-sugg-chips">
                  {CATS[quickCat].qs.slice(0,3).map((q,i)=>(
                    <button key={i} className="land-sugg-chip" onClick={()=>setQuickQ(q)}>
                      {q.length>24?q.slice(0,24)+'…':q}
                    </button>
                  ))}
                </div>
                <div className="land-quick-inp-row">
                  <input className="land-quick-inp"
                    placeholder={TIME_CONFIG[timeSlot].inputPlaceholder}
                    value={quickQ}
                    onChange={e=>setQuickQ(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&quickQ.trim())askQuick(quickQ);}}/>
                  <button className="land-quick-send" disabled={!quickQ.trim()} onClick={()=>askQuick(quickQ)}>✦</button>
                </div>
                <button className="land-ghost-link" onClick={()=>setStep(formOk?2:1)}>
                  질문 여러 개 한꺼번에 하기 →
                </button>
              </div>

              {/* 샘플 미리보기 */}
              <SamplePreview/>

              {/* 오늘의 한마디 */}
              <div className="daily-word">
                <div className="daily-label">✦ {today.month}월 {today.day}일의 별 메시지</div>
                <div className="daily-text">{'"'+getDailyWord(today.day)+'"'}</div>
              </div>

              {/* 리뷰 */}
              <div className="rev-wrap">
                <div className="rev-track">
                  {REVIEWS.map((r,i)=>(
                    <div key={i} className="rev-card">
                      <div className="rev-stars">{r.star}</div>
                      <div className="rev-text">{'"'+r.text+'"'}</div>
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
          <div className="page step-fade">
            <div className="inner">
              <div className="step-dots">
                {[0,1,2].map(i=><div key={i} className={`dot ${i===0?'active':'todo'}`}/>)}
              </div>

              {/* ── 이미 프로필 있으면: 프로필 선택 카드 ── */}
              {formOk&&(
                <div className="card" style={{marginBottom:'var(--sp2)'}}>
                  <div className="card-title" style={{fontSize:'var(--md)'}}>누구의 별숨을 볼까요?</div>

                  {/* 나 */}
                  <div className={`profile-pick-card ${activeProfileIdx===0?'active':''}`}
                    onClick={()=>setActiveProfileIdx(0)}>
                    <div className="ppc-left">
                      <div className="ppc-av">{user?.profileImage?<img src={user.profileImage} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>:'🌙'}</div>
                      <div>
                        <div className="ppc-name">{form.name||user?.nickname||'나'}</div>
                        <div className="ppc-sub">{form.by&&sun?`${sun.s} ${sun.n} · ${ON[saju?.dom||'금']} 기운`:'정보를 입력해줘요'}</div>
                      </div>
                    </div>
                    {activeProfileIdx===0&&<span style={{color:'var(--gold)'}}>✦</span>}
                  </div>

                  {/* 다른 사람 프로필들 */}
                  {otherProfiles.map((p,i)=>{
                    const pSaju=p.by&&p.bm&&p.bd?getSaju(+p.by,+p.bm,+p.bd,p.noTime?12:+(p.bh||12)):null;
                    const pSun=p.bm&&p.bd?getSun(+p.bm,+p.bd):null;
                    return(
                      <div key={i} className={`profile-pick-card ${activeProfileIdx===i+1?'active':''}`}
                        onClick={()=>setActiveProfileIdx(i+1)}>
                        <div className="ppc-left">
                          <div className="ppc-av" style={{background:'var(--bg3)'}}>✦</div>
                          <div>
                            <div className="ppc-name">{p.name||'이름 없이 저장됨'}</div>
                            <div className="ppc-sub">{pSun?`${pSun.s} ${pSun.n}`:'별자리 계산 가능해요'}</div>
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          {activeProfileIdx===i+1&&<span style={{color:'var(--gold)'}}>✦</span>}
                          <button style={{padding:'3px 8px',borderRadius:6,border:'1px solid var(--line)',background:'transparent',color:'var(--t4)',fontSize:'var(--xs)',fontFamily:'var(--ff)',cursor:'pointer'}}
                            onClick={e=>{e.stopPropagation();setOtherProfiles(p=>p.filter((_,j)=>j!==i));if(activeProfileIdx===i+1)setActiveProfileIdx(0);}}>삭제</button>
                        </div>
                      </div>
                    );
                  })}

                  {/* 다른 사람 추가 버튼 (최대 3명) */}
                  {otherProfiles.length<3&&(
                    <button className="res-btn" style={{width:'100%',marginTop:8,padding:12}}
                      onClick={()=>setShowOtherProfileModal(true)}>
                      + 다른 사람의 별숨 추가 (최대 3명)
                    </button>
                  )}

                  <button className="btn-main" style={{marginTop:'var(--sp3)'}}
                    onClick={()=>{setSelQs([]);setStep(2);}}>
                    {activeProfileIdx===0?`${form.name||'나'}의 별숨 보기 ✦`:`${otherProfiles[activeProfileIdx-1]?.name||'이 사람'}의 별숨 보기 ✦`}
                  </button>
                </div>
              )}

              {/* ── 정보 없으면: 기본 입력 폼 ── */}
              {!formOk&&(
              <div className="card">
                <div className="card-title">반가워요 🌙</div>
                <div className="card-sub">생년월일만 있으면 사주와 별자리를 함께 읽어드릴게요</div>

                <label className="lbl">이름 (선택)</label>
                <input className="inp" placeholder="뭐라고 불러드릴까요?" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>

                <label className="lbl">생년월일</label>
                <div className="row" style={{marginBottom:'var(--sp3)'}}>
                  <div className="col"><input className="inp" placeholder="1998" maxLength={4} inputMode="numeric" pattern="[0-9]*" value={form.by} onChange={e=>setForm(f=>({...f,by:e.target.value.replace(/\D/,'')}))} style={{marginBottom:0}}/></div>
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
              )}
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

                {/* ── 사주×별자리 통합 배너 + 시간대별 오늘의 별숨 ── */}
                <div className="combo-banner">
                  <div className="combo-title">✦ 사주 × 별자리 통합 분석</div>
                  <div className="combo-sub">
                    {activeProfileIdx===0
                      ? (saju&&sun?`${ON[saju.dom]} 기운의 ${sun.n} · 달 ${moon?.n||''}`:'동양과 서양의 별이 함께 읽어드려요')
                      : (()=>{
                          const op=otherProfiles[activeProfileIdx-1];
                          if(!op) return '동양과 서양의 별이 함께 읽어드려요';
                          const os=op.by&&op.bm&&op.bd?getSaju(+op.by,+op.bm,+op.bd,op.noTime?12:+(op.bh||12)):null;
                          const osun=op.bm&&op.bd?getSun(+op.bm,+op.bd):null;
                          return os&&osun?`${op.name||'이 사람'} · ${ON[os.dom]} 기운의 ${osun.n}`:`${op.name||'이 사람'}의 별숨`;
                        })()
                    }
                  </div>
                  {/* 시간대별 오늘의 별숨 인라인 표시 */}
                  <div style={{marginTop:10,padding:'10px 14px',background:TIME_CONFIG[timeSlot].bg,borderRadius:'var(--r1)',border:`1px solid ${TIME_CONFIG[timeSlot].border}`,display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:'1.1rem'}}>{TIME_CONFIG[timeSlot].emoji}</span>
                    <div>
                      <div style={{fontSize:'var(--xs)',color:TIME_CONFIG[timeSlot].color,fontWeight:600,marginBottom:2}}>{TIME_CONFIG[timeSlot].label}</div>
                      <div style={{fontSize:'var(--xs)',color:'var(--t3)',lineHeight:1.5}}>{TIME_CONFIG[timeSlot].greeting(activeProfileIdx===0?form.name:otherProfiles[activeProfileIdx-1]?.name||'')}</div>
                    </div>
                  </div>
                </div>

                {/* ── ① 직접 입력 (맨 위) ── */}
                <div className="diy-wrap" style={{marginBottom:'var(--sp2)'}}>
                  <div style={{fontSize:'var(--xs)',color:'var(--gold)',fontWeight:600,marginBottom:6,letterSpacing:'.06em'}}>✦ 직접 물어보기</div>
                  <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                    <textarea className="diy-inp" style={{flex:1,marginBottom:0}}
                      placeholder="직접 묻고 싶은 게 있어요? 자유롭게 써봐요 🌙"
                      maxLength={200} value={diy} onChange={e=>setDiy(e.target.value)}/>
                    <button
                      style={{padding:'11px 16px',borderRadius:'var(--r1)',border:'1px solid var(--acc)',background:diy.trim()&&selQs.length<maxQ?'var(--goldf)':'var(--bg2)',color:diy.trim()&&selQs.length<maxQ?'var(--gold)':'var(--t4)',fontFamily:'var(--ff)',fontSize:'var(--sm)',fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',transition:'all .2s',flexShrink:0,height:80}}
                      disabled={!diy.trim()||selQs.length>=maxQ}
                      onClick={()=>{if(diy.trim()&&selQs.length<maxQ){addQ(diy.trim());setDiy('');}}}>
                      추가
                    </button>
                  </div>
                  <div className="diy-row"><span className="hint">{diy.length}/200</span></div>
                </div>

                {/* ── ② 카테고리 탭 ── */}
                <div style={{fontSize:'var(--xs)',color:'var(--t4)',marginBottom:6,letterSpacing:'.06em'}}>또는 고민 카테고리에서 골라봐요</div>
                <div className="cat-tabs">
                  {CATS.map((c,i)=><button key={c.id} className={`cat-tab ${cat===i?'on':''}`} onClick={()=>setCat(i)}>{c.icon} {c.label}</button>)}
                </div>

                {/* ── 빠른 추천 칩 (상위 3개) ── */}
                {selQs.length<maxQ&&(
                  <div>
                    <div style={{fontSize:'var(--xs)',color:'var(--gold)',fontWeight:600,margin:'10px 0 6px',letterSpacing:'.04em'}}>✦ 이런 질문 어때요?</div>
                    <div className="suggest-row">
                      {CATS[cat].qs.slice(0,3).filter(q=>!selQs.includes(q)).map((q,i)=>(
                        <button key={i} className="suggest-chip" onClick={()=>addQ(q)}>
                          {q.length>22?q.slice(0,22)+'…':q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="q-list">
                  {CATS[cat].qs.map((q,i)=>{
                    const on=selQs.includes(q);
                    return<button key={i} className={`q-item ${on?'on':''}`}
                      disabled={!on&&selQs.length>=maxQ}
                      onClick={()=>on?rmQ(selQs.indexOf(q)):addQ(q)}>{q}</button>;
                  })}
                </div>

                {/* ── ③ 선택된 질문 목록 ── */}
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

                {/* ── ④ 이용권: 무료 첫 질문 체계 ── */}
                {pkg==='free'?(
                  <div style={{padding:'var(--sp2) var(--sp3)',background:'var(--goldf)',border:'1px solid var(--acc)',borderRadius:'var(--r2)',margin:'var(--sp2) 0',textAlign:'center'}}>
                    <div style={{fontSize:'var(--sm)',fontWeight:700,color:'var(--gold)',marginBottom:4}}>🌙 첫 번째 이야기는 무료예요</div>
                    <div style={{fontSize:'var(--xs)',color:'var(--t3)',lineHeight:1.7}}>답변을 보고 나서 더 궁금하면 그때 이용권을 선택해요<br/>지금은 부담없이 시작해봐요</div>
                  </div>
                ):(
                  <div className="pkg-sec">
                    <div className="pkg-lbl">이용권</div>
                    <div className="pkgs">
                      {PKGS.map(p=>p.isFree?null:(
                        <div key={p.id} className={`pkg ${pkg===p.id?'chosen':''}`}
                          onClick={()=>{setPkg(p.id);if(selQs.length>p.q)setSelQs(s=>s.slice(0,p.q));}}>
                          {p.hot&&<div className="pkg-hot">BEST</div>}
                          <div className="pkg-e">{p.e}</div>
                          <div className="pkg-n">{p.n}</div>
                          <div className="pkg-p">{p.p}</div>
                        </div>
                      ))}
                    </div>
                    <button style={{background:'none',border:'none',color:'var(--t4)',fontSize:'var(--xs)',fontFamily:'var(--ff)',cursor:'pointer',textDecoration:'underline',marginTop:6}}
                      onClick={()=>setPkg('free')}>↩ 무료로 먼저 시작하기</button>
                  </div>
                )}

                <div className="q-stat">
                  {selQs.length===0&&'질문을 하나 이상 골라봐요'}
                  {selQs.length>0&&selQs.length<maxQ&&<><strong>{maxQ-selQs.length}개</strong> 더 고를 수 있어요</>}
                  {selQs.length===maxQ&&<><strong>준비 완료!</strong> 두 별이 읽어드릴게요 🌟</>}
                </div>
                <button className="btn-main" disabled={!selQs.length} onClick={askClaude}>
                  {selQs.length===0?'질문을 먼저 골라봐요':`✦ 두 별에게 물어보기 (${selQs.length}개)`}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ══ 3 로딩 ══ */}
        {step===3&&<div className="page"><SkeletonLoader qCount={selQs.length} saju={saju}/></div>}

        {/* ══ 4 결과 ══ */}
        {step===4&&(
          <div className="page">
            <div className="res-wrap">
              <div className="res-card">
                {/* ── 상단 공유/복사 바 ── */}
                <div className="res-top-bar">
                  <button className="res-top-btn" onClick={()=>{navigator.clipboard?.writeText(answers.join('\n\n'));alert('복사됐어요 📋');}}>
                    📋 복사
                  </button>
                  {answers[0]&&(
                    <button className="res-top-btn primary" onClick={()=>shareCard(0)}>
                      ↗ 이미지 저장
                    </button>
                  )}
                </div>

                {/* 헤더 */}
                <div className="res-header">
                  <div className="res-av">✦</div>
                  <div>
                    <div className="res-name">{form.name ? `${form.name}에게 전하는 별의 이야기` : '오늘 밤 당신에게 전하는 이야기'}</div>
                    <div className="res-chips">
                      {saju&&<div className="res-chip">🀄 {ON[saju.dom]} 기운</div>}
                      {sun&&<div className="res-chip">{sun.s} {sun.n}</div>}
                      {moon&&<div className="res-chip">🌙 달 {moon.n}</div>}
                      {asc&&<div className="res-chip">↑ {asc.n}</div>}
                      <div className="res-chip">📅 {today.month}월 {today.day}일</div>
                    </div>
                  </div>
                </div>

                {/* 무드 배너 */}
                {sun&&(()=>{
                  const mood=SIGN_MOOD[sun.n]||{color:'var(--gold)',bg:'var(--goldf)',word:'신비로운',emoji:'✦'};
                  return(
                    <div className="mood-banner" style={{background:mood.bg,borderColor:mood.color+'33'}}>
                      <div className="mood-orb" style={{background:mood.color+'22',border:`1px solid ${mood.color}44`}}>{mood.emoji}</div>
                      <div>
                        <div className="mood-label">오늘의 별자리 기운</div>
                        <div className="mood-word" style={{color:mood.color}}>{mood.word} 하루예요</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 별의 한 줄 요약 — [요약] 태그 파싱 ── */}
                {answers[0]&&(()=>{
                  const parsed = parseAccSummary(answers[0]);
                  const summaryStr = parsed.summary;
                  return summaryStr?(
                    <div className="star-summary">
                      <span className="star-summary-icon">✦</span>
                      <span className="star-summary-text">{summaryStr}</span>
                    </div>
                  ):null;
                })()}

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
                          <button className="res-top-btn" style={{fontSize:'var(--xs)'}} onClick={()=>shareCard(i)}>
                            ↗ Q{i+1} 이미지 저장
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* 액션 */}
                <div className="res-actions">
                  {/* 액션 그리드 — 궁합 · 편지 */}
                  <div className="action-grid" style={{marginBottom:'var(--sp2)'}}>
                    <div className="action-card compat" onClick={()=>setStep(7)}>
                      <div className="action-card-icon">💞</div>
                      <div className="action-card-title">우리가 만나면</div>
                      <div className="action-card-sub">두 사람의 별이 만나는 시나리오</div>
                    </div>
                    <div className="action-card letter" onClick={()=>setStep(8)}>
                      <div className="action-card-icon">💌</div>
                      <div className="action-card-title">별의 편지</div>
                      <div className="action-card-sub">3개월 후 나에게 전하는 이야기</div>
                    </div>
                  </div>

                  {/* 로그인 넛지 */}
                  {!user&&(
                    <div className="kakao-nudge">
                      <span style={{fontSize:'1.1rem'}}>🌙</span>
                      <span className="kakao-nudge-text">로그인하면 연인 운세 · 직장 맞춤 · 내 기록이 모두 저장돼요</span>
                      <button className="kakao-btn" style={{width:'auto',padding:'6px 14px',fontSize:'var(--xs)'}} onClick={kakaoLogin}>카카오 로그인</button>
                    </div>
                  )}

                  <div className="upsell">
                    <div className="up-t">✦ 이번 달 전체 운세가 궁금해요</div>
                    <div className="up-d">연애 · 재물 · 건강 · 직업 종합 분석<br/>사주와 별자리가 함께 쓴 월간 에세이</div>
                    <button className="up-btn" onClick={()=>{
                      genReport();
                    }}>
                      '이달의 운세 리포트 보기 ✦'
                    </button>
                  </div>
                  {maxChat>0&&(
                    <button className="chat-cta" onClick={()=>{
                      if(chatLeft>0){setStep(5);}else{setStep(5);}
                    }} disabled={false}>
                      💬 {chatLeft>0?`더 물어보기 · 남은 ${chatLeft}회`:'더 물어보기 ✦'}
                      <span style={{fontSize:'var(--xs)',color:'var(--t4)'}}>{chatLeft>0?'무료':'무료 이용 중'}</span>
                    </button>
                  )}
                  <div className="res-btns">
                    <button className="res-btn" onClick={()=>{setSelQs([]);setDiy('');setChatHistory([]);setChatUsed(0);setStep(formOk?2:1);}}>다른 질문</button>
                    <button className="res-btn" onClick={()=>setShowSidebar(true)}>지난 이야기</button>
                    <button className="res-btn" onClick={()=>setStep(0)}>홈으로</button>
                  </div>

                  {/* ── 기능 소개 카드 ── */}
                  <div className="feature-guide">
                    <div className="feature-guide-title">✦ 별숨의 다른 기능들</div>
                    <div className="feature-guide-grid">
                      <button className="fg-card" onClick={()=>setStep(7)}>
                        <span className="fg-icon">💞</span>
                        <div className="fg-info">
                          <div className="fg-name">사이 별점</div>
                          <div className="fg-desc">두 사람의 사주+별자리로 관계 시나리오 읽기</div>
                        </div>
                      </button>
                      <button className="fg-card" onClick={()=>setStep(8)}>
                        <span className="fg-icon">💌</span>
                        <div className="fg-info">
                          <div className="fg-name">3개월 후 편지</div>
                          <div className="fg-desc">미래의 내가 지금 나에게 쓴 편지</div>
                        </div>
                      </button>
                      <button className="fg-card" onClick={()=>{genReport();}}>
                        <span className="fg-icon">📜</span>
                        <div className="fg-info">
                          <div className="fg-name">월간 리포트</div>
                          <div className="fg-desc">이달의 연애·재물·직업·건강 에세이</div>
                        </div>
                      </button>
                      <button className="fg-card" onClick={()=>{setStep(5);}}>
                        <span className="fg-icon">💬</span>
                        <div className="fg-info">
                          <div className="fg-name">더 물어보기</div>
                          <div className="fg-desc">답변 기반 후속 상담 채팅</div>
                        </div>
                      </button>
                      <button className="fg-card" onClick={()=>setShowSidebar(true)}>
                        <span className="fg-icon">🗂️</span>
                        <div className="fg-info">
                          <div className="fg-name">지난 이야기</div>
                          <div className="fg-desc">내가 별숨에 물었던 모든 질문 기록</div>
                        </div>
                      </button>
                      <button className="fg-card" onClick={()=>{navigator.clipboard?.writeText(answers.join('\n\n'));alert('복사됐어요 📋');}}>
                        <span className="fg-icon">📋</span>
                        <div className="fg-info">
                          <div className="fg-name">전체 복사</div>
                          <div className="fg-desc">오늘 받은 모든 답변 클립보드 복사</div>
                        </div>
                      </button>
                    </div>
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

        {/* ══ 7 시나리오 궁합 ══ */}
        {step===7&&(
          <CompatPage
            myForm={form}
            mySaju={saju}
            mySun={sun}
            callApi={callApi}
            buildCtx={buildCtx}
            onBack={()=>setStep(4)}
          />
        )}

        {/* ══ 8 별의 편지 ══ */}
        {step===8&&(
          <LetterPage
            form={form}
            saju={saju}
            sun={sun}
            moon={moon}
            today={today}
            callApi={callApi}
            buildCtx={buildCtx}
            onBack={()=>setStep(4)}
          />
        )}

        {/* ══ 9 히스토리 상세 ══ */}
        {step===9&&histItem&&(
          <HistoryPage
            item={histItem}
            onBack={()=>{setHistItem(null);setStep(0);}}
            onDelete={(id)=>{deleteHistory(id);setHistItems(loadHistory());}}
          />
        )}


      </div>
      {/* ══ 프로필 모달 ══ */}
      {showProfileModal&&(
        <ProfileModal
          profile={profile}
          setProfile={setProfile}
          onClose={()=>setShowProfileModal(false)}
        />
      )}
      {/* ══ 결제 Toast ══ */}
      {payToast&&<div className={`pay-toast ${payToast.type}`}>{payToast.msg}</div>}

      {/* ══ 업그레이드 모달 (채팅 소진 후) ══ */}
      {showUpgradeModal&&(
        <div className="upgrade-modal-bg" onClick={()=>setShowUpgradeModal(false)}>
          <div className="upgrade-modal" onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:'center',fontSize:'2rem',marginBottom:8}}>✦</div>
            <div className="upgrade-modal-title">더 많이 물어보고 싶어요?</div>
            <div className="upgrade-modal-sub">
              첫 번째 이야기가 마음에 들었다면<br/>더 깊이 대화할 수 있어요
            </div>
            <div className="upgrade-pkgs">
              {PKGS.filter(p=>!p.isFree).map(p=>(
                <div key={p.id} className={`upgrade-pkg ${pkg===p.id?'chosen':''}`}
                  onClick={()=>setPkg(p.id)}>
                  {p.hot&&<div className="upgrade-pkg-hot">BEST</div>}
                  <div className="upgrade-pkg-e">{p.e}</div>
                  <div className="upgrade-pkg-n">{p.n}</div>
                  <div className="upgrade-pkg-p">{p.p}</div>
                  <div className="upgrade-pkg-q">질문 {p.q}개 · 채팅 {p.chat}회</div>
                </div>
              ))}
            </div>
            <button className="btn-main" onClick={()=>{setShowUpgradeModal(false);setStep(5);}}>
              이 이용권으로 계속 대화하기 ✦
            </button>
            <button style={{width:'100%',padding:10,background:'none',border:'none',color:'var(--t4)',fontSize:'var(--xs)',fontFamily:'var(--ff)',cursor:'pointer',marginTop:8}}
              onClick={()=>setShowUpgradeModal(false)}>
              괜찮아요, 나중에 할게요
            </button>
          </div>
        </div>
      )}

      {/* ══ 다른 사람 프로필 추가 모달 ══ */}
      {showOtherProfileModal&&(
        <div className="other-modal-bg" onClick={()=>setShowOtherProfileModal(false)}>
          <div className="other-modal" onClick={e=>e.stopPropagation()}>
            <div className="other-modal-title">다른 사람의 별숨 추가</div>
            <div className="other-modal-sub">가족, 친구, 연인의 생년월일을 입력하면<br/>그 사람의 별숨을 대신 물어볼 수 있어요</div>

            <label className="lbl">이름</label>
            <input className="inp" placeholder="누구의 별숨인가요?" value={otherForm.name}
              onChange={e=>setOtherForm(f=>({...f,name:e.target.value}))}/>

            <label className="lbl">생년월일</label>
            <div className="row" style={{marginBottom:'var(--sp2)'}}>
              <div className="col"><input className="inp" placeholder="1998" maxLength={4} inputMode="numeric"
                value={otherForm.by} onChange={e=>setOtherForm(f=>({...f,by:e.target.value.replace(/\D/,'')}))} style={{marginBottom:0}}/></div>
              <div className="col"><select className="inp" value={otherForm.bm} onChange={e=>setOtherForm(f=>({...f,bm:e.target.value}))} style={{marginBottom:0}}>
                <option value="">월</option>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}</select></div>
              <div className="col"><select className="inp" value={otherForm.bd} onChange={e=>setOtherForm(f=>({...f,bd:e.target.value}))} style={{marginBottom:0}}>
                <option value="">일</option>{[...Array(31)].map((_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}</select></div>
            </div>
            <div className="toggle-row" onClick={()=>setOtherForm(f=>({...f,noTime:!f.noTime,bh:''}))}>
              <button className={`toggle ${otherForm.noTime?'on':'off'}`} onClick={e=>e.stopPropagation()}/>
              <span className="toggle-label">태어난 시간을 몰라요</span>
            </div>
            {!otherForm.noTime&&(
              <select className="inp" value={otherForm.bh} onChange={e=>setOtherForm(f=>({...f,bh:e.target.value}))}>
                <option value="">태어난 시각 (선택)</option>
                {[...Array(24)].map((_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}
              </select>
            )}
            <label className="lbl">성별</label>
            <div className="gender-group">
              {['여성','남성','기타'].map(g=>(
                <button key={g} className={`gbtn ${otherForm.gender===g?'on':''}`} onClick={()=>setOtherForm(f=>({...f,gender:g}))}>{g}</button>
              ))}
            </div>
            <button className="btn-main"
              disabled={!otherForm.by||!otherForm.bm||!otherForm.bd||!otherForm.gender}
              onClick={()=>{
                if(otherProfiles.length>=3)return;
                setOtherProfiles(p=>[...p,{...otherForm}]);
                setOtherForm({name:'',by:'',bm:'',bd:'',bh:'',gender:'',noTime:false});
                setShowOtherProfileModal(false);
              }}>
              추가하기 ✦
            </button>
            <button style={{width:'100%',padding:10,background:'none',border:'none',color:'var(--t4)',fontSize:'var(--xs)',fontFamily:'var(--ff)',cursor:'pointer',marginTop:6}}
              onClick={()=>setShowOtherProfileModal(false)}>취소</button>
          </div>
        </div>
      )}
    </>
  );
}
