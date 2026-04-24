import { getMonthJijiIndex } from '../../lib/jeolgi.js';

// ═══════════════════════════════════════════════════════════
//  📅 날짜 유틸 (양력 + 음력 근사)
// ═══════════════════════════════════════════════════════════
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
  2029: [[2029,2,13],  [30,29,30,29,30,29,30,29,30,29,30,29], 0],
  2030: [[2030,2, 3],  [29,30,29,30,29,30,29,30,29,30,29,30], 0],
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

// ── 일진(日辰) 계산 — 60甲子 순환 ─────────────────────────────
// 기준: 2000-01-01 = 甲戌日 (천간 0=갑, 지지 10=술)
const _IC_GANS = ['갑','을','병','정','무','기','경','신','임','계'];
const _IC_JIS  = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const _IC_EL   = { 갑:'목',을:'목',병:'화',정:'화',무:'토',기:'토',경:'금',신:'금',임:'수',계:'수' };
const _IC_DESC = { 목:'추진·시작하기 좋은 날', 화:'표현·활발하게 나서기 좋은 날', 토:'신중하게 기다리기 좋은 날', 금:'결단·마무리하기 좋은 날', 수:'직관을 믿고 조용히 준비하기 좋은 날' };

function _calcIlchin(y, m, d) {
  const diff = Math.round((Date.UTC(y, m-1, d) - Date.UTC(2000, 0, 1)) / 86400000);
  const gan  = _IC_GANS[((diff)    % 10 + 10) % 10];
  const ji   = _IC_JIS [((10+diff) % 12 + 12) % 12];
  return { gan, ji, text: `${gan}${ji}일`, element: _IC_EL[gan], desc: _IC_DESC[_IC_EL[gan]] };
}

// ── 십신(十神) 계산 — 사용자 일간 × 오늘 천간 ─────────────────
const _SHENG = { 목:'화', 화:'토', 토:'금', 금:'수', 수:'목' }; // 상생(내가 생하는)
const _KE    = { 목:'토', 화:'금', 토:'수', 금:'목', 수:'화' }; // 상극(내가 극하는)

/**
 * 사용자 일간과 오늘 천간으로 십신을 계산해요.
 * @param {string} myGan 사용자 일간 (예: '임')
 * @param {string} todayGan 오늘 일진 천간 (예: '갑')
 * @returns {{ name, meaning, strongAreas, weakAreas } | null}
 */
export function calcSipsin(myGan, todayGan) {
  if (!myGan || !todayGan) return null;
  const myEl    = _IC_EL[myGan];
  const todayEl = _IC_EL[todayGan];
  if (!myEl || !todayEl) return null;
  const myIdx    = _IC_GANS.indexOf(myGan);
  const todayIdx = _IC_GANS.indexOf(todayGan);
  const same = (myIdx % 2) === (todayIdx % 2); // 음양 동일 여부

  if (myEl === todayEl)
    return same
      ? { name:'비견', meaning:'자립·독립심 활성화',          strongAreas:'이동운·건강운',      weakAreas:'금전운' }
      : { name:'겁재', meaning:'경쟁심·돌파력 자극',          strongAreas:'직장운·이동운',      weakAreas:'금전운·대인운' };
  if (_SHENG[myEl] === todayEl)
    return same
      ? { name:'식신', meaning:'재능·표현·여유 활성화',       strongAreas:'창의운·학업운·대인운', weakAreas:'직장운' }
      : { name:'상관', meaning:'창의·자기표현·변화 충동',     strongAreas:'창의운·이동운',      weakAreas:'직장운·대인운' };
  if (_KE[myEl] === todayEl)
    return same
      ? { name:'편재', meaning:'새로운 재물·활발한 외부활동', strongAreas:'금전운·이동운',      weakAreas:'학업운' }
      : { name:'정재', meaning:'안정적 재물·꼼꼼한 관리',    strongAreas:'금전운·직장운',      weakAreas:'이동운' };
  if (_KE[todayEl] === myEl)
    return same
      ? { name:'편관', meaning:'규율·압박·도전',              strongAreas:'직장운·건강운',      weakAreas:'대인운·애정운' }
      : { name:'정관', meaning:'명예·인정·체계',              strongAreas:'직장운·대인운',      weakAreas:'창의운' };
  if (_SHENG[todayEl] === myEl)
    return same
      ? { name:'편인', meaning:'학습·분석·직관력',            strongAreas:'학업운·이동운',      weakAreas:'애정운' }
      : { name:'정인', meaning:'지혜·배움·귀인',              strongAreas:'학업운·대인운',      weakAreas:'이동운' };
  return null;
}

export function getTodayInfo() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const week = ["일","월","화","수","목","금","토"][now.getDay()];
  const JEOLGI = ["소한","대한","입춘","우수","경칩","춘분","청명","곡우","입하","소만","망종","하지","소서","대서","입추","처서","백로","추분","한로","상강","입동","소설","대설","동지"];
  const jeolgi = JEOLGI[((m-1)*2+(d>20?1:0))%24];
  const{lm,ld,isLeap}=solarToLunarFE(y,m,d);
  const lunar=`음력 ${isLeap?'윤':''}${lm}월 ${ld}일`;
  const ilchin = _calcIlchin(y, m, d);
  return{
    solar:`${y}년 ${m}월 ${d}일 (${week}요일)`,
    lunar, jeolgi:`절기 근처: ${jeolgi}`,
    year:y, month:m, day:d, week, ilchin
  };
}

// ═══════════════════════════════════════════════════════════
//  🀄 사주 엔진
// ═══════════════════════════════════════════════════════════
export const CG=["갑","을","병","정","무","기","경","신","임","계"];
export const JJ=["자","축","인","묘","진","사","오","미","신","유","술","해"];
export const CGH=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
export const JJH=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
export const CGO=["목","목","화","화","토","토","금","금","수","수"];
export const JJO=["수","토","목","목","토","화","화","토","금","금","토","수"];
export const OC={목:"#5FAD7A",화:"#E05A3A",토:"#C08830",금:"#B8A035",수:"#4A8EC4"};
export const OE={목:"🌿",화:"🔥",토:"🍂",금:"✦",수:"💧"};
export const ON={목:"나무",화:"불",토:"흙",금:"금",수:"물"};

export const ILGAN_DESC={
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

// 일간별 시적 표현 (타고난 기운을 생생하게)
export const ILGAN_POETIC={
  갑:"쭉 뻗은 나무",
  을:"부드러운 넝쿨",
  병:"타오르는 태양",
  정:"은은한 촛불",
  무:"드넓은 대지",
  기:"기름진 흙",
  경:"단단한 쇠",
  신:"빛나는 보석",
  임:"깊은 강물",
  계:"촉촉한 이슬",
};

// 60갑자 배열 (기준: 1900-01-01 = 甲子 = index 0)
export const GAPJA_60 = [
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥',
];

// 일간 오행 에너지 (양간 5→1, 음간 4→1)
const ILGAN_ENERGY = { 갑:5,을:4,병:4,정:3,무:3,기:2,경:2,신:1,임:2,계:1 };

// getDailyInfo: 특정 날짜의 일진 정보 반환
export function getDailyInfo(date) {
  const y = date.getFullYear(), m = date.getMonth()+1, d = date.getDate();
  // 만세력 기준 에포크 보정: 1900-01-01 실제 일진 = 甲戌(index 10), +10 오프셋 적용
  // Date.UTC 사용: 브라우저 로컬 타임존(Asia/Seoul의 역사적 LMT +8:27:52)에 의한
  // 1900년 날짜 오프셋 32분 오차를 제거. Math.round로 부동소수점 방어.
  const df = Math.round((Date.UTC(y,m-1,d) - Date.UTC(1900,0,1)) / 86400000) + 10;
  const ig = (df % 10 + 10) % 10;
  const ij = (df % 12 + 12) % 12;
  const idx60 = ((df % 60) + 60) % 60;
  return {
    iljin: GAPJA_60[idx60],
    cheongan: CG[ig],
    jiji: JJ[ij],
    ohaeng: CGO[ig],
    energy: ILGAN_ENERGY[CG[ig]] || 3,
  };
}

export function getSaju(y,m,d,h,min=0){
  // 입력값 범위 가드 — 비정상 값으로 인한 오작동 방지
  if(!Number.isInteger(y)||!Number.isInteger(m)||!Number.isInteger(d)||!Number.isInteger(h)) return null;
  if(m<1||m>12||d<1||d>31||h<0||h>23) return null;

  // 자시(子時) 경계 처리: 23:00 이후는 사주상 다음날 자시에 해당
  // (전통 사주에서 23:00~01:00가 자시이며, 23:00부터 날이 바뀜)
  if(h===23){
    const next=new Date(y,m-1,d+1);
    y=next.getFullYear(); m=next.getMonth()+1; d=next.getDate();
    h=0;
  }
  const yg=((y-4)%10+10)%10,yj=((y-4)%12+12)%12;
  // 월지: 절기(입절) 기준 월주 지지
  const wj = getMonthJijiIndex(y, m, d, h, min);
  // 월간: 오호둔월법 — 인월(寅月) 천간 = (연간%5)*2+2, 이후 月마다 +1
  const wg = (((yg % 5) * 2 + 2) + (wj - 2 + 12) % 12) % 10;
  // 만세력 기준 에포크 보정: 1900-01-01 실제 일진 = 甲戌(index 10), +10 오프셋 적용
  // Date.UTC 사용: Asia/Seoul LMT(+8:27:52) 오프셋 오차 제거, Math.round로 부동소수점 방어
  const df=Math.round((Date.UTC(y,m-1,d)-Date.UTC(1900,0,1))/86400000)+10;
  const ig=(df%10+10)%10,ij=(df%12+12)%12;
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
    ilgan:CG[ig],ilji:JJ[ij],ilganDesc:ILGAN_DESC[CG[ig]],ilganEl:CGO[ig],ilganPoetic:ILGAN_POETIC[CG[ig]],or,dom,lac
  };
}
