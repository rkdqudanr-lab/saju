// ═══════════════════════════════════════════════════════════
//  ♈ 점성술 엔진
// ═══════════════════════════════════════════════════════════
export const SIGNS=[
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

export function getSun(m,d){
  for(const z of SIGNS){
    if(z.sm<=z.em){if((m===z.sm&&d>=z.sd)||(m===z.em&&d<=z.ed)||(m>z.sm&&m<z.em))return z;}
    else{if((m===z.sm&&d>=z.sd)||(m===z.em&&d<=z.ed)||m>z.sm||m<z.em)return z;}
  }
  return SIGNS[0];
}

export function getMoon(y,m,d){
  const days=(new Date(y,m-1,d)-new Date(2000,0,1))/86400000;
  return SIGNS[Math.abs(Math.floor((((days%27.32)+27.32)%27.32/27.32)*12))%12];
}

export function getAsc(h,bm){return SIGNS[(Math.floor(h/2)+bm+6)%12];}
