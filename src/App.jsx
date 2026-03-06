import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════
//  🀄 사주 계산 엔진 (60갑자 기반 고도화)
// ═══════════════════════════════════════════════════════
const CG=["갑","을","병","정","무","기","경","신","임","계"];
const JJ=["자","축","인","묘","진","사","오","미","신","유","술","해"];
const CGH=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JJH=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CGO=["목","목","화","화","토","토","금","금","수","수"];
const JJO=["수","토","목","목","토","화","화","토","금","금","토","수"];
const OC={목:"#6BAE7F",화:"#E8604A",토:"#C4924A",금:"#C8A840",수:"#5A9EC4"};
const OE={목:"🌿",화:"🔥",토:"🍂",금:"✨",수:"💧"};
const ONAME={목:"나무",화:"불",토:"흙",금:"금속",수:"물"};

// 일간별 상세 캐릭터 (MZ 감성 고도화)
const ILGAN={
  갑:{short:"🌱 새싹 리더",who:"새로운 길을 여는 선구자",
    feel:"어딜 가도 '내가 먼저'인 사람이에요. 그 첫발의 용기가 당신의 가장 큰 무기예요.",
    love:"연애에서도 먼저 다가가고 싶지만, 자존심이 한 발 막아서곤 해요 💕",
    money:"목표를 세우면 돈은 따라오는 타입이에요. 다만 '시작'에 투자가 많아요 💛",
    work:"리더십은 타고났어요. 남들이 못 보는 가능성을 보는 눈이 있어요 ✨",
    health:"스트레스를 안으로 삭이는 타입이라 간·눈 건강을 챙겨줘요 🌿",
    today:"오늘은 내가 먼저 연락해볼까요?",
    vibe:"#E8F5E9"},
  을:{short:"🎋 섬세한 넝쿨",who:"부드럽지만 절대 꺾이지 않는 사람",
    feel:"겉으로는 조용해 보여도 마음속엔 누구보다 강한 의지가 있어요. 넝쿨처럼 자기 길을 꼭 찾아요.",
    love:"사랑하면 깊이 의존하고 싶어해요. 그 진심이 당신의 매력이에요 🌸",
    money:"꾸준함으로 모으는 타입이에요. 한 방보다 적금이 더 잘 맞아요 💛",
    work:"협업 능력이 뛰어나요. 어떤 조직에서도 없어서는 안 될 사람이 돼요 ✨",
    health:"위장과 소화 기능에 신경써요. 스트레스가 위로 가는 타입이에요 🌿",
    today:"작은 변화부터 시작해봐요",
    vibe:"#F1F8E9"},
  병:{short:"☀️ 따뜻한 태양",who:"주변을 밝히는 에너지 덩어리",
    feel:"당신이 있는 공간이 왠지 따뜻해지는 거, 느낀 적 있나요? 그게 바로 당신이에요.",
    love:"사랑할 때 온 에너지를 쏟는 타입이에요. 그래서 가끔 지치기도 해요 💕",
    money:"돈이 들어오고 나가는 게 큰 타입이에요. 지출 관리가 관건이에요 💛",
    work:"무대 위에서 빛나는 사람이에요. 발표, 강의, 영업 분야에서 탁월해요 ✨",
    health:"심장과 혈압을 챙겨요. 너무 열정적으로 달리면 번아웃이 와요 🌿",
    today:"내 빛을 마음껏 발산해봐요",
    vibe:"#FFF8E1"},
  정:{short:"🕯️ 촛불 같은 마음",who:"가까운 사람을 헌신으로 감싸는 사람",
    feel:"촛불처럼 자신을 태워서 주변을 밝혀요. 그 따뜻함이 당신의 가장 큰 매력이에요.",
    love:"사랑하면 모든 걸 주고 싶어해요. 받는 것보다 주는 게 더 자연스러운 사람이에요 💕",
    money:"감정적 소비가 있어요. 좋아하는 사람 위해선 아낌없이 써요 💛",
    work:"팀의 분위기 메이커예요. 감정지능이 높아서 중재 역할을 잘해요 ✨",
    health:"소장, 눈 건강을 챙겨요. 감정 소진이 몸으로 나타나요 🌿",
    today:"나를 위한 시간도 꼭 가져봐요",
    vibe:"#FFF3E0"},
  무:{short:"🌍 든든한 대지",who:"중심을 잡아주는 든든한 사람",
    feel:"어수선한 상황에서 옆에 있으면 왠지 마음이 놓이는 사람, 그게 바로 당신이에요.",
    love:"안정적인 연애를 원해요. 감정 기복이 적고 믿음직스러운 파트너예요 💕",
    money:"재물을 모으는 능력이 있어요. 부동산이나 장기 투자에 강해요 💛",
    work:"조직의 허리 역할이에요. 실무 능력과 신뢰감으로 인정받아요 ✨",
    health:"소화기, 위장을 챙겨요. 과식하거나 불규칙한 식습관을 조심해요 🌿",
    today:"천천히, 하지만 확실하게",
    vibe:"#F9FBE7"},
  기:{short:"🌸 정원 같은 사람",who:"섬세하게 가꾸고 돌보는 사람",
    feel:"사람들 사이의 조화를 만드는 능력, 그거 아무나 못 하는데 당신은 자연스럽게 해요.",
    love:"상대방의 감정을 세심하게 읽어요. 그 배려심이 연애의 무기예요 💕",
    money:"알뜰하게 모으는 타입이에요. 가계부 쓰면 의외로 잘 맞아요 💛",
    work:"세부사항을 놓치지 않는 꼼꼼함이 강점이에요. 기획, 관리직에 최적화예요 ✨",
    health:"비장, 소화 기능을 챙겨요. 걱정이 많으면 소화가 안 되는 타입이에요 🌿",
    today:"오늘은 나를 좀 더 챙겨줄게요",
    vibe:"#F3E5F5"},
  경:{short:"⚔️ 날카로운 검",who:"결단력 있고 원칙을 지키는 사람",
    feel:"한 번 마음먹으면 끝까지 가는 사람, 때론 외롭지만 그 뚝심이 가장 멋진 모습이에요.",
    love:"연애에서도 원칙이 있어요. 애매한 관계를 싫어하고 명확함을 원해요 💕",
    money:"투자 감각이 있어요. 결단력 있게 들어가고 나오는 타이밍을 잘 잡아요 💛",
    work:"리더 기질이 있어요. 어떤 상황에서도 흔들리지 않는 강단이 있어요 ✨",
    health:"폐, 호흡기를 챙겨요. 감기에 자주 걸린다면 기력이 떨어진 신호예요 🌿",
    today:"내 기준을 믿어봐요",
    vibe:"#E8EAF6"},
  신:{short:"💎 빛나는 보석",who:"완벽을 추구하는 감각적인 사람",
    feel:"세상을 아주 선명하게 보는 눈을 가졌어요. 그 예리한 감각이 당신의 강점이에요.",
    love:"완벽한 사랑을 꿈꿔요. 현실과 이상의 괴리로 상처받을 때도 있어요 💕",
    money:"심미안이 있어서 좋은 것에 투자하는 타입이에요. 명품 소비 조심 ㅋㅋ 💛",
    work:"심미적 감각이 필요한 분야에서 두각을 나타내요. 디자인, 예술, 뷰티 계열 강세 ✨",
    health:"폐, 피부를 챙겨요. 스트레스가 피부로 나타나는 타입이에요 🌿",
    today:"완벽하지 않아도 충분히 빛나요",
    vibe:"#EDE7F6"},
  임:{short:"🌊 깊은 강물",who:"넓은 지혜와 통찰을 가진 사람",
    feel:"말 많이 안 해도 느낌으로 다 아는 그 직관력, 주변 사람들이 다 느끼고 있어요.",
    love:"감정의 깊이가 있어요. 표현은 서툴지만 사랑하면 진심으로 해요 💕",
    money:"재물 흐름을 크게 보는 편이에요. 작게 쪼개기보다 큰 그림을 그려요 💛",
    work:"전략적 사고가 뛰어나요. 복잡한 문제를 단번에 꿰뚫는 능력이 있어요 ✨",
    health:"신장, 방광을 챙겨요. 수분 섭취와 따뜻하게 하는 것이 중요해요 🌿",
    today:"마음 가는 대로 흘러가봐요",
    vibe:"#E3F2FD"},
  계:{short:"🌧️ 이슬 같은 감성",who:"예민하고 풍부한 직관의 소유자",
    feel:"남들이 못 느끼는 걸 먼저 느끼는 사람이에요. 그 섬세함이 당신의 가장 큰 재능이에요.",
    love:"사랑할 때 상대의 감정을 스펀지처럼 흡수해요. 경계 설정도 연습해봐요 💕",
    money:"직관적 투자 감각이 있어요. 다만 감정적 소비를 조심해요 💛",
    work:"창의적이고 예술적인 분야에서 빛나요. 글쓰기, 음악, 상담 분야 강세 ✨",
    health:"신장, 호르몬 균형을 챙겨요. 감정이 몸에 바로 영향을 주는 타입이에요 🌿",
    today:"내 감정에 솔직해져봐요",
    vibe:"#E1F5FE"},
};

// 오행 과다/부족 해석
const OHAENG_MSG={
  목:{over:"나무 기운이 넘쳐요 🌿 추진력이 강하지만 고집이 세질 수 있어요. 유연함을 연습해봐요.",
     lack:"나무 기운이 부족해요 🌱 결단력을 키우는 연습이 필요해요. 새로운 시작을 두려워하지 마요."},
  화:{over:"불 기운이 넘쳐요 🔥 열정이 폭발하지만 감정 기복이 클 수 있어요. 숨 고르는 시간이 필요해요.",
     lack:"불 기운이 부족해요 🕯️ 표현력과 자신감을 더 키워봐요. 당신의 빛을 숨기지 마요."},
  토:{over:"흙 기운이 넘쳐요 🍂 안정감은 최고지만 변화에 저항할 수 있어요. 새로운 것도 받아들여봐요.",
     lack:"흙 기운이 부족해요 🌍 중심 잡는 연습이 필요해요. 루틴을 만들어봐요."},
  금:{over:"금속 기운이 넘쳐요 ✨ 완벽주의가 강해요. 나 자신에게 좀 더 너그러워져봐요.",
     lack:"금속 기운이 부족해요 💎 결단력과 의지력을 키워봐요. 한번 시작하면 끝까지 가봐요."},
  수:{over:"물 기운이 넘쳐요 💧 지혜롭지만 우유부단해질 수 있어요. 때론 직감을 믿고 행동해봐요.",
     lack:"물 기운이 부족해요 🌊 직관력과 감수성을 더 깨워봐요. 멈추고 느끼는 시간을 가져봐요."},
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
  const dominant=Object.entries(or).sort((a,b)=>b[1]-a[1])[0][0];
  const lacking=Object.entries(or).sort((a,b)=>a[1]-b[1])[0][0];
  return{yeon:{g:CG[yg],j:JJ[yj],gh:CGH[yg],jh:JJH[yj]},
    wol:{g:CG[wg],j:JJ[wj],gh:CGH[wg],jh:JJH[wj]},
    il:{g:CG[ig],j:JJ[ij],gh:CGH[ig],jh:JJH[ij]},
    si:{g:CG[sg],j:JJ[si%12],gh:CGH[sg],jh:JJH[si%12]},
    ilgan:CG[ig],ilji:JJ[ij],or,dominant,lacking};
}

// ═══════════════════════════════════════════════════════
//  ♈ 점성술 엔진 (달궁·상승궁 고도화)
// ═══════════════════════════════════════════════════════
const SIGNS=[
  {n:"양자리",s:"♈",sm:3,sd:21,em:4,ed:19,el:"🔥",elem:"불",vibe:"나는 먼저야!",
   feel:"뭔가 새로운 걸 시작하고 싶을 때 가장 빛나는 사람이에요",
   love:"첫눈에 반하고 전력 질주하는 타입이에요. 지루한 건 못 참아요 💕",
   work:"선구자 기질이 있어요. 아무도 안 한 걸 먼저 해보는 용기가 있어요 💼",
   money:"벌고 쓰는 속도가 둘 다 빨라요. 충동구매 조심 ㅋㅋ 💛",
   health:"머리, 얼굴 부위 조심해요. 무리하면 두통이 잦아져요 🌿",
   moon:"감정이 빠르게 타오르고 빠르게 식어요. 그 열정 자체가 매력이에요 🌙",
   rising:"첫인상이 강렬하고 에너지가 넘쳐 보여요. 사람들이 먼저 말을 걸어요 ✨",
   charm:"폭발적인 첫인상",today:"망설이지 말고 일단 해봐요"},
  {n:"황소자리",s:"♉",sm:4,sd:20,em:5,ed:20,el:"🌿",elem:"흙",vibe:"편안함이 최고야",
   feel:"한 번 마음을 열면 세상 누구보다 깊이 사랑하는 사람이에요",
   love:"천천히 신중하게, 하지만 한 번 사랑하면 끝까지 가요. 소유욕도 있어요 💕",
   work:"꾸준함과 인내심으로 결국 성공하는 타입이에요. 재정 감각도 뛰어나요 💼",
   money:"모으는 재주가 있어요. 부동산, 실물 자산에 관심이 많아요 💛",
   health:"목, 갑상선 부위 챙겨요. 맛있는 것에 약해서 과식 주의 🌿",
   moon:"안정감을 최우선으로 해요. 변화보다 익숙함이 마음의 평화예요 🌙",
   rising:"안정적이고 믿음직스러운 첫인상이에요. 편안하게 해주는 분위기가 있어요 ✨",
   charm:"든든한 안정감",today:"나를 위한 소소한 사치를 허락해줘요"},
  {n:"쌍둥이자리",s:"♊",sm:5,sd:21,em:6,ed:20,el:"💨",elem:"바람",vibe:"다 궁금해!",
   feel:"어떤 상황에서도 재미를 찾아내는 특별한 능력이 있어요",
   love:"대화가 통해야 사랑해요. 지적 자극이 없으면 금방 식어버려요 💕",
   work:"멀티태스킹의 달인이에요. 아이디어가 넘쳐나고 커뮤니케이션이 최강이에요 💼",
   money:"정보로 돈을 버는 타입이에요. 다만 집중력이 흩어지면 기회를 놓쳐요 💛",
   health:"폐, 팔, 손 부위 챙겨요. 신경이 예민해서 수면의 질을 관리해야 해요 🌿",
   moon:"감정보다 생각이 먼저예요. 감정을 분석하고 언어화하는 걸 좋아해요 🌙",
   rising:"재치 있고 말이 잘 통하는 첫인상이에요. 금방 친해지는 분위기가 있어요 ✨",
   charm:"재치 있는 말솜씨",today:"새로운 사람을 만나봐요"},
  {n:"게자리",s:"♋",sm:6,sd:21,em:7,ed:22,el:"💧",elem:"물",vibe:"소중한 사람이 전부야",
   feel:"한 번 소중하다고 생각한 사람은 끝까지 지키려는 마음이 있어요",
   love:"감정 이입이 강해요. 상대의 아픔을 내 아픔처럼 느끼는 깊은 사랑을 해요 💕",
   work:"돌보고 양육하는 역할에서 빛나요. 팀원들을 챙기는 따뜻한 리더예요 💼",
   money:"가족과 집을 위해 열심히 모아요. 감정적 소비가 있을 수 있어요 💛",
   health:"위장, 가슴 부위 챙겨요. 감정 스트레스가 소화로 이어져요 🌿",
   moon:"감정이 풍부하고 직관이 강해요. 집과 가족이 감정의 안식처예요 🌙",
   rising:"따뜻하고 부드러운 첫인상이에요. 사람들이 속마음을 털어놓게 만들어요 ✨",
   charm:"따뜻한 공감 능력",today:"나를 먼저 돌봐줘요"},
  {n:"사자자리",s:"♌",sm:7,sd:23,em:8,ed:22,el:"🔥",elem:"불",vibe:"나 좀 봐줘!",
   feel:"주목받을 때 가장 빛나는 사람, 그리고 그럴 자격이 충분해요",
   love:"사랑받고 싶은 욕구가 커요. 상대가 나를 특별하게 대해줄 때 행복해요 💕",
   work:"무대 위에서 타고난 재능을 발휘해요. 리더십과 카리스마로 사람을 이끌어요 💼",
   money:"크게 쓰고 크게 버는 타입이에요. 자신을 위한 투자를 아끼지 않아요 💛",
   health:"심장, 등 부위 챙겨요. 자존심 상하는 일이 심장에 영향을 줘요 🌿",
   moon:"감정 표현이 화끈해요. 기쁠 땐 최고로 기쁘고 슬플 땐 최고로 슬퍼요 🌙",
   rising:"존재감이 압도적인 첫인상이에요. 방에 들어서면 시선이 쏠려요 ✨",
   charm:"타고난 카리스마",today:"내 매력을 마음껏 발산해봐요"},
  {n:"처녀자리",s:"♍",sm:8,sd:23,em:9,ed:22,el:"🌿",elem:"흙",vibe:"제대로 해야 해",
   feel:"남들이 그냥 지나치는 것도 꼼꼼하게 챙기는 사람이에요",
   love:"완벽한 파트너를 원해요. 상대의 단점이 눈에 잘 보이는 게 고민이에요 💕",
   work:"분석력과 완벽주의로 최고의 결과를 만들어요. 세부사항의 달인이에요 💼",
   money:"실용적이고 알뜰해요. 가성비를 따지는 소비 습관이 있어요 💛",
   health:"소화기, 장 건강을 챙겨요. 걱정이 많으면 배가 아픈 타입이에요 🌿",
   moon:"감정을 분석하고 이해하려 해요. '왜 이런 감정이지?'를 자주 생각해요 🌙",
   rising:"차분하고 신뢰가 가는 첫인상이에요. 믿고 맡길 수 있을 것 같은 느낌 ✨",
   charm:"섬세함과 실용성",today:"'이 정도면 됐어'를 연습해봐요"},
  {n:"천칭자리",s:"♎",sm:9,sd:23,em:10,ed:22,el:"💨",elem:"바람",vibe:"모두가 행복하면 좋겠어",
   feel:"사람들 사이에서 균형을 맞춰주는, 없어서는 안 될 사람이에요",
   love:"아름다운 관계를 원해요. 갈등을 피하려다 본심을 숨기는 경우가 있어요 💕",
   work:"협상과 중재의 천재예요. 모든 사람을 만족시키는 방법을 찾아요 💼",
   money:"예쁘고 아름다운 것에 지갑이 열려요. 심미안이 있어서 안목 투자가 잘 맞아요 💛",
   health:"신장, 허리 부위 챙겨요. 결정 못 하는 스트레스가 몸에 쌓여요 🌿",
   moon:"감정적 조화를 원해요. 주변이 불편하면 내 마음도 불편해져요 🌙",
   rising:"우아하고 매력적인 첫인상이에요. 세련되고 품위 있어 보여요 ✨",
   charm:"뛰어난 심미안",today:"내 마음대로 골라봐요"},
  {n:"전갈자리",s:"♏",sm:10,sd:23,em:11,ed:21,el:"💧",elem:"물",vibe:"다 꿰뚫어보고 있어",
   feel:"표면 아래의 진짜를 보는 눈, 그게 당신의 가장 큰 무기예요",
   love:"All or nothing 스타일이에요. 한 번 빠지면 집착에 가까울 정도로 사랑해요 💕",
   work:"연구, 탐정, 심리 분야에서 두각을 나타내요. 비밀을 파헤치는 능력이 있어요 💼",
   money:"재물을 모으고 불리는 능력이 있어요. 투자에서 남들이 못 보는 것을 봐요 💛",
   health:"생식기, 면역 시스템을 챙겨요. 감정을 억누르면 몸으로 나와요 🌿",
   moon:"감정의 깊이가 바다처럼 깊어요. 쉽게 속마음을 보여주지 않아요 🌙",
   rising:"신비롭고 강렬한 첫인상이에요. 무언가 숨긴 것 같은 매력이 있어요 ✨",
   charm:"날카로운 통찰",today:"놓아주는 연습을 해봐요"},
  {n:"사수자리",s:"♐",sm:11,sd:22,em:12,ed:21,el:"🔥",elem:"불",vibe:"세상이 다 내 무대야!",
   feel:"어디서든 자유롭게 살고 싶은, 그 마음이 당신을 특별하게 만들어요",
   love:"자유로운 연애를 원해요. 구속이나 소유는 질색이에요. 친구 같은 연인이 최고예요 💕",
   work:"철학, 교육, 여행, 출판 분야에서 빛나요. 큰 그림을 보는 능력이 있어요 💼",
   money:"낙관적이라 돈이 들어오면 금방 나가요. 미래를 위한 저축을 의식적으로 해요 💛",
   health:"허벅지, 엉덩이, 간 건강을 챙겨요. 음주를 즐기는 타입이라면 더욱이요 🌿",
   moon:"자유로움이 감정의 기본값이에요. 억압받는 느낌이 들면 탈출하고 싶어해요 🌙",
   rising:"밝고 낙천적인 첫인상이에요. 함께 있으면 신나고 재미있을 것 같은 분위기예요 ✨",
   charm:"낙천적인 모험심",today:"새로운 곳에 가봐요"},
  {n:"염소자리",s:"♑",sm:12,sd:22,em:1,ed:19,el:"🌿",elem:"흙",vibe:"결국엔 내가 이겨",
   feel:"남들이 포기할 때도 묵묵히 가는 사람, 그게 가장 멋진 모습이에요",
   love:"신중하고 책임감 있는 연애를 해요. 감정보다 조건을 먼저 따지는 경향이 있어요 💕",
   work:"야망이 있고 목표 지향적이에요. 인내심으로 결국 정상에 올라가는 타입이에요 💼",
   money:"재물 축적 능력이 최고예요. 장기적 안목으로 투자하고 절약하는 습관이 있어요 💛",
   health:"무릎, 관절, 피부 건강을 챙겨요. 과로하는 경향이 있어서 휴식이 필요해요 🌿",
   moon:"감정을 통제하려 해요. 의존하는 것을 약함으로 볼 수 있어요. 허용해줘요 🌙",
   rising:"성숙하고 신뢰감 있는 첫인상이에요. 나이보다 어른스러워 보이는 매력이 있어요 ✨",
   charm:"끈기와 목표 달성력",today:"잠깐 쉬어가도 돼요"},
  {n:"물병자리",s:"♒",sm:1,sd:20,em:2,ed:18,el:"💨",elem:"바람",vibe:"남들과 달라야 해",
   feel:"아무도 생각 못 한 아이디어를 내는 사람, 당신이 그래요",
   love:"자유롭고 평등한 관계를 원해요. 친구 같은 파트너가 최고예요 💕",
   work:"혁신적이고 창의적인 분야에서 두각을 나타내요. 미래를 먼저 보는 눈이 있어요 💼",
   money:"독창적인 방법으로 돈을 벌어요. 남들이 주목 안 하는 분야에서 기회를 찾아요 💛",
   health:"발목, 순환계를 챙겨요. 스트레스를 받으면 경련이나 근육 긴장이 올 수 있어요 🌿",
   moon:"감정을 객관적으로 보려 해요. '나 왜 이러지?'를 분석하는 걸 좋아해요 🌙",
   rising:"독특하고 개성 있는 첫인상이에요. 어딘가 남다른 분위기가 있어요 ✨",
   charm:"독창성과 진보적 사고",today:"내 이상한 아이디어를 믿어봐요"},
  {n:"물고기자리",s:"♓",sm:2,sd:19,em:3,ed:20,el:"💧",elem:"물",vibe:"다 느껴져요",
   feel:"세상의 아픔을 함께 느끼는, 그 공감 능력이 당신의 가장 큰 선물이에요",
   love:"경계가 없을 만큼 완전히 녹아드는 사랑을 해요. 현실과 이상의 괴리가 아픔이 될 수 있어요 💕",
   work:"예술, 치유, 영성 분야에서 빛나요. 사람의 마음을 읽는 능력이 있어요 💼",
   money:"돈에 집착하기보단 의미 있게 쓰려 해요. 무형의 가치에 투자하는 타입이에요 💛",
   health:"발, 면역 시스템을 챙겨요. 감정 소진이 가장 큰 건강의 적이에요 🌿",
   moon:"감정이 파도처럼 밀려와요. 직관과 꿈이 강하고 영적 감수성이 높아요 🌙",
   rising:"부드럽고 몽환적인 첫인상이에요. 왠지 신비로운 분위기가 있어요 ✨",
   charm:"풍부한 감수성",today:"내 꿈에 귀 기울여봐요"},
];

function getSun(m,d){
  for(let z of SIGNS){
    if(z.sm<=z.em){if((m===z.sm&&d>=z.sd)||(m===z.em&&d<=z.ed)||(m>z.sm&&m<z.em))return z;}
    else{if((m===z.sm&&d>=z.sd)||(m===z.em&&d<=z.ed)||m>z.sm||m<z.em)return z;}
  }
  return SIGNS[0];
}
function getMoon(y,m,d){
  const days=(new Date(y,m-1,d)-new Date(2000,0,1))/86400000;
  return SIGNS[Math.floor((((days%27.32)+27.32)%27.32/27.32)*12)%12];
}
function getAsc(h,m){return SIGNS[(Math.floor(h/2)+m+6)%12];}

// ═══════════════════════════════════════════════════════
//  💬 질문 카테고리
// ═══════════════════════════════════════════════════════
const CATS=[
  {id:"love",icon:"💕",label:"연애",qs:["요즘 좋아하는 사람이 생겼는데 이 감정이 맞는 걸까요?","언제쯤 새로운 인연이 찾아올까요?","지금 사귀는 사람이랑 미래가 있을까요?","짝사랑하는 사람이 나를 어떻게 생각할까요?","전 남자친구랑 다시 될 수 있을까요?","내가 먼저 고백해도 될까요?"]},
  {id:"work",icon:"💼",label:"직장·커리어",qs:["이직을 고민 중인데 지금 타이밍이 맞을까요?","직장 상사 때문에 너무 힘들어요. 어떻게 해야 할까요?","나에게 진짜 잘 맞는 일이 뭔지 알고 싶어요","승진할 수 있는 운이 있을까요?","이 회사에서 계속 다녀야 할까요?","창업을 해도 될까요?"]},
  {id:"money",icon:"✨",label:"돈·재물",qs:["올해 돈 들어오는 운이 있을까요?","투자를 시작하기 좋은 시기인가요?","내 집 마련 언제쯤 가능할까요?","부업이나 사이드 잡 시작해도 될까요?","돈이 계속 나가는데 언제 안정될까요?","나한테 잘 맞는 재테크 방법이 뭔가요?"]},
  {id:"health",icon:"🌸",label:"건강",qs:["요즘 너무 피곤한데 기운이 없는 이유가 있을까요?","몸에서 특히 조심해야 할 부분이 있나요?","스트레스가 너무 심해요. 해소 방법이 있을까요?","다이어트나 운동 지금 시작해도 될까요?","수면의 질을 높이려면 어떻게 해야 할까요?"]},
  {id:"relation",icon:"🫧",label:"인간관계",qs:["주변에 나한테 안 좋은 사람이 있는 것 같아요","친한 친구랑 사이가 멀어진 것 같아요","새로운 환경에서 잘 적응할 수 있을까요?","나는 어떤 사람들과 잘 맞나요?","직장 동료와의 갈등을 어떻게 풀어야 할까요?"]},
  {id:"family",icon:"🏡",label:"가족·결혼",qs:["가족이랑 갈등이 생겼어요. 어떻게 풀어야 할까요?","결혼하기 좋은 시기가 언제인가요?","지금 연인과 결혼해도 될까요?","부모님과의 관계 좋아질 수 있을까요?","독립을 해야 할까요?"]},
  {id:"future",icon:"🔮",label:"미래·운명",qs:["올해 내 인생에서 가장 중요한 것이 뭔가요?","지금 걷고 있는 방향이 맞는지 불안해요","내가 진짜 잘할 수 있는 게 뭔지 모르겠어요","올해 좋은 일이 생길까요?","나의 전반적인 2025년 운세가 궁금해요","내 인생의 전환점이 언제쯤 올까요?"]},
  {id:"move",icon:"🗺️",label:"이사·여행",qs:["이사를 고민 중인데 지금 시기가 맞을까요?","이 동네가 나한테 맞는 곳일까요?","해외로 나가는 게 나에게 도움이 될까요?","유학이나 워킹홀리데이 가도 될까요?","이사 방향이 어디가 좋을까요?"]},
];

// ═══════════════════════════════════════════════════════
//  💎 패키지 (BM 차별화)
// ═══════════════════════════════════════════════════════
const PKGS=[
  {id:"seed",emoji:"🌱",name:"씨앗",price:"990원",stars:1,
   features:["질문 1개","AI 답변 1회","후속 채팅 없음"],
   limit:{q:1,chat:0},hot:false,tag:"맛보기"},
  {id:"moon",emoji:"🌙",name:"달빛",price:"5,900원",stars:7,
   features:["질문 최대 3개","AI 답변 3회","후속 채팅 5회"],
   limit:{q:3,chat:5},hot:false,tag:"인기"},
  {id:"star",emoji:"⭐",name:"별빛",price:"9,900원",stars:13,
   features:["질문 최대 5개","AI 답변 5회","후속 채팅 10회"],
   limit:{q:5,chat:10},hot:true,tag:"베스트"},
  {id:"cosmos",emoji:"🌌",name:"우주",price:"19,900원",stars:28,
   features:["질문 최대 10개","AI 답변 10회","후속 채팅 20회","프리미엄 리포트 포함"],
   limit:{q:10,chat:20},hot:false,tag:"풀패키지"},
];

const LOAD_MSGS=[
  {t:"별빛이 당신의 이름을 찾고 있어요 🌟",s:"잠깐만요, 거의 다 왔어요"},
  {t:"하늘이 당신의 기운을 읽고 있어요 ✨",s:"태어난 순간의 에너지를 불러오는 중이에요"},
  {t:"사주와 별자리가 만나고 있어요 💫",s:"두 세계가 당신 이야기를 나누고 있어요"},
  {t:"당신에게 전할 말을 고르고 있어요 🌙",s:"오래 기다렸죠? 거의 다 됐어요"},
  {t:"기운이 모였어요! 이제 들려드릴게요 🎊",s:"당신의 이야기가 준비됐어요"},
];

// ═══════════════════════════════════════════════════════
//  🎨 CSS
// ═══════════════════════════════════════════════════════
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --cream:#FFFAF6;--peach:#FFF3EC;--lav:#F6F0FF;--white:#FFFFFF;
  --pp:#7C5CBF;--pp2:#9B7DD6;--pp3:#C4AAEE;--pp4:#EDE6FF;--pp5:#F8F4FF;
  --pk:#E8627A;--pk2:#F5899A;--pk3:#FFD6DD;--pk4:#FFF0F3;
  --gold:#C08820;--gold2:#E8B048;--gold3:#FFF6E0;
  --teal:#3A9BAE;--sage:#5A9A6A;--mint:#E8F8F5;
  --txt:#26193A;--txt2:#52466A;--txt3:#8A7FA0;--txt4:#BEB5CC;
  --bdr:#EBE3FF;--bdr2:#DDD4F0;
  --serif:'Noto Serif KR',serif;--sans:'Noto Sans KR',sans-serif;
  --sh1:0 2px 12px rgba(124,92,191,.09);
  --sh2:0 4px 28px rgba(124,92,191,.13);
  --sh3:0 8px 48px rgba(124,92,191,.18);
  --r1:16px;--r2:24px;--r3:32px;
}
html,body{background:var(--cream);color:var(--txt);font-family:var(--sans);min-height:100vh;-webkit-font-smoothing:antialiased}
.app{min-height:100vh;position:relative;overflow-x:hidden}

/* 배경 */
.bg{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.blob{position:absolute;border-radius:50%;filter:blur(80px);animation:bfloat var(--d,20s) var(--dl,0s) infinite alternate ease-in-out}
@keyframes bfloat{0%{transform:translate(0,0)}100%{transform:translate(var(--tx,15px),var(--ty,20px))}}
.spark{position:absolute;animation:sparkle var(--d,4s) var(--dl,0s) infinite}
@keyframes sparkle{0%,100%{opacity:0;transform:scale(0) rotate(0deg)}45%,55%{opacity:.7;transform:scale(1) rotate(180deg)}}
.rel{position:relative;z-index:1}
.page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 14px 40px}

/* 뒤로 버튼 */
.bk{position:absolute;top:14px;left:14px;width:36px;height:36px;border-radius:50%;background:var(--white);border:1.5px solid var(--bdr);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--txt3);font-size:.85rem;box-shadow:var(--sh1);transition:all .22s;z-index:20}
.bk:hover{border-color:var(--pp);color:var(--pp);transform:scale(1.08)}

/* 스텝바 */
.stps{display:flex;gap:5px;justify-content:center;margin-bottom:.4rem}
.sd{height:5px;border-radius:3px;transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.sd.done{width:18px;background:var(--pp2)}.sd.act{width:28px;background:linear-gradient(90deg,var(--pk),var(--pp));box-shadow:0 2px 8px rgba(124,92,191,.3)}.sd.todo{width:7px;background:var(--bdr2)}
.stplbl{font-size:.65rem;color:var(--txt4);text-align:center;margin-bottom:1.1rem;letter-spacing:.08em}

/* ═══ 랜딩 ═══ */
.land{text-align:center;max-width:390px}
.lbadge{display:inline-flex;align-items:center;gap:.4rem;background:linear-gradient(135deg,rgba(232,98,122,.1),rgba(124,92,191,.1));border:1.5px solid rgba(124,92,191,.2);border-radius:50px;padding:.42rem 1.1rem;font-size:.74rem;color:var(--pp);margin-bottom:1.6rem;animation:fup .8s .1s both;font-weight:500}
.ltitle{font-family:var(--serif);font-size:clamp(5rem,15vw,8.5rem);font-weight:700;letter-spacing:.25em;line-height:1;background:linear-gradient(140deg,var(--gold2) 0%,var(--pk) 35%,var(--pp) 70%,#4AC8C8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-size:200%;animation:shimmer 5s linear infinite,fup .8s .2s both}
@keyframes shimmer{0%{background-position:0%}100%{background-position:200%}}
.lsub{font-size:.73rem;color:var(--txt4);letter-spacing:.45em;text-transform:uppercase;margin-bottom:1.2rem;animation:fup .8s .3s both;font-weight:300}
.lcopy{font-size:.96rem;color:var(--txt2);line-height:2.05;margin-bottom:2.3rem;font-weight:300;animation:fup .8s .4s both}
.lcopy em{font-style:normal;color:var(--pp);font-weight:600}
.lcta{display:inline-flex;align-items:center;gap:.55rem;padding:1rem 2.6rem;border:none;border-radius:50px;background:linear-gradient(135deg,var(--pk),var(--pp));color:#fff;font-size:.97rem;font-weight:700;font-family:var(--sans);cursor:pointer;letter-spacing:.02em;box-shadow:0 4px 24px rgba(124,92,191,.32);transition:all .3s;animation:fup .8s .5s both,lcpulse 3.5s 1.3s infinite}
@keyframes lcpulse{0%,100%{box-shadow:0 4px 24px rgba(124,92,191,.32)}50%{box-shadow:0 4px 36px rgba(124,92,191,.5),0 0 0 8px rgba(124,92,191,.07)}}
.lcta:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 8px 36px rgba(124,92,191,.44)}
.ltags{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin-top:1.9rem;animation:fup .8s .6s both}
.ltag{padding:.35rem .85rem;background:var(--white);border:1.5px solid var(--bdr);border-radius:50px;font-size:.72rem;color:var(--txt3);box-shadow:var(--sh1)}
.lrev{display:flex;gap:.5rem;align-items:center;justify-content:center;margin-top:1.4rem;font-size:.72rem;color:var(--txt4);animation:fup .8s .7s both}
.lreviews{margin-top:1.6rem;animation:fup .8s .8s both}
.lrcard{background:var(--white);border:1.5px solid var(--bdr);border-radius:16px;padding:.7rem 1rem;margin-bottom:.5rem;text-align:left;box-shadow:var(--sh1)}
.lrstar{font-size:.68rem;color:var(--gold2);margin-bottom:.2rem}
.lrtxt{font-size:.74rem;color:var(--txt2);line-height:1.6}
.lrnick{font-size:.62rem;color:var(--txt4);margin-top:.25rem}

/* ═══ 입력 카드 ═══ */
.card{background:var(--white);border:1.5px solid var(--bdr);border-radius:var(--r3);padding:1.8rem 1.6rem;width:100%;max-width:470px;box-shadow:var(--sh2);animation:fup .5s cubic-bezier(.34,1.56,.64,1)}
.ct{font-family:var(--serif);font-size:1.18rem;color:var(--pp);text-align:center;margin-bottom:.35rem;font-weight:700}
.cs{font-size:.79rem;color:var(--txt3);text-align:center;margin-bottom:1.6rem;line-height:1.9}
.lbl{font-size:.67rem;color:var(--txt3);margin-bottom:.3rem;display:block;font-weight:600;letter-spacing:.05em}
.inp{width:100%;background:var(--lav);border:1.5px solid var(--bdr);border-radius:14px;padding:.68rem .9rem;color:var(--txt);font-size:.85rem;font-family:var(--sans);transition:all .2s;margin-bottom:.85rem}
.inp:focus{outline:none;border-color:var(--pp);background:var(--white);box-shadow:0 0 0 3px rgba(124,92,191,.1)}
.inp::placeholder{color:var(--txt4)}
select.inp option{background:#fff}
.row{display:flex;gap:.6rem}
.col{flex:1;min-width:0}
.grow{display:flex;gap:.5rem;margin-bottom:.85rem}
.gbtn{flex:1;padding:.65rem 2px;border-radius:13px;border:1.5px solid var(--bdr);background:transparent;color:var(--txt3);cursor:pointer;font-size:.79rem;transition:all .2s;font-family:var(--sans);font-weight:500}
.gbtn.on{border-color:var(--pp);background:var(--pp4);color:var(--pp);font-weight:700}
.togrow{display:flex;align-items:center;gap:.7rem;margin-bottom:.85rem;padding:.6rem .9rem;background:var(--lav);border-radius:14px;cursor:pointer;border:1.5px solid var(--bdr)}
.tog{width:38px;height:21px;border-radius:11px;border:none;cursor:pointer;position:relative;transition:background .25s;flex-shrink:0}
.tog.on{background:linear-gradient(135deg,var(--pp),var(--pk))}.tog.off{background:var(--bdr2)}
.tog::after{content:"";position:absolute;width:15px;height:15px;background:#fff;border-radius:50%;top:3px;transition:left .25s;box-shadow:0 1px 4px rgba(0,0,0,.15)}
.tog.on::after{left:20px}.tog.off::after{left:3px}
.toglbl{font-size:.78rem;color:var(--txt2)}

/* 팔자 표시 */
.pillars{display:flex;gap:5px;margin:.8rem 0 .4rem}
.pillar{flex:1;background:linear-gradient(180deg,var(--gold3),var(--lav));border:1.5px solid rgba(192,136,32,.2);border-radius:15px;padding:.6rem 3px;text-align:center}
.plbl{font-size:.53rem;color:var(--txt4);font-weight:600;letter-spacing:.04em;margin-bottom:.2rem}
.phj{font-size:1.08rem;font-family:serif;color:var(--gold);font-weight:700;line-height:1.18}
.pkr{font-size:.58rem;color:var(--txt3);margin-top:.12rem}
.orbar{height:5px;border-radius:3px;overflow:hidden;display:flex;gap:2px;margin-top:.4rem}
.obs{border-radius:2px;transition:flex .6s}
.ortags{display:flex;gap:4px;flex-wrap:wrap;margin-top:.4rem}
.ortag{padding:.2rem .5rem;border-radius:7px;font-size:.6rem;font-weight:700}
.ohmsg{font-size:.7rem;color:var(--txt3);background:var(--lav);border-radius:10px;padding:.5rem .8rem;margin-top:.5rem;line-height:1.7;border-left:3px solid var(--pp3)}

/* ═══ 기운 선택 ═══ */
.epage{width:100%;max-width:540px}
.eintro{text-align:center;margin-bottom:1.2rem}
.etitle{font-family:var(--serif);font-size:1.28rem;color:var(--pp);font-weight:700;margin-bottom:.35rem}
.esub{font-size:.8rem;color:var(--txt3);line-height:1.95}
.esub em{font-style:normal;color:var(--pk);font-weight:600}
.mychips{display:flex;gap:.45rem;flex-wrap:wrap;justify-content:center;margin-bottom:1rem}
.chip{padding:.3rem .7rem;background:var(--white);border:1.5px solid var(--bdr);border-radius:50px;font-size:.71rem;color:var(--txt2);box-shadow:var(--sh1)}
.chip b{color:var(--pp)}
.ecards{display:flex;gap:11px}
.ecard{flex:1;border-radius:26px;padding:1.4rem 1rem 1.1rem;cursor:pointer;transition:all .35s cubic-bezier(.34,1.56,.64,1);border:2px solid var(--bdr);background:var(--white);position:relative;overflow:hidden}
.ecard::after{content:"";position:absolute;inset:0;opacity:0;transition:opacity .35s;border-radius:inherit;pointer-events:none}
.ecard.sj::after{background:linear-gradient(155deg,rgba(192,136,32,.07),rgba(124,92,191,.05))}
.ecard.as::after{background:linear-gradient(155deg,rgba(58,155,174,.07),rgba(90,154,106,.05))}
.ecard.sj:hover,.ecard.sj.picked{border-color:var(--gold2);box-shadow:0 8px 30px rgba(192,136,32,.2);transform:translateY(-6px) rotate(-1.3deg)}
.ecard.as:hover,.ecard.as.picked{border-color:var(--teal);box-shadow:0 8px 30px rgba(58,155,174,.2);transform:translateY(-6px) rotate(1.3deg)}
.ecard:hover::after,.ecard.picked::after{opacity:1}
.eicon{font-size:2.1rem;text-align:center;margin-bottom:.6rem;display:block}
.ekind{font-size:.58rem;text-transform:uppercase;letter-spacing:.12em;text-align:center;font-weight:700;margin-bottom:.24rem}
.ecard.sj .ekind{color:var(--gold)}.ecard.as .ekind{color:var(--teal)}
.ename{font-family:var(--serif);font-size:.97rem;font-weight:700;text-align:center;color:var(--txt);margin-bottom:.48rem}
.ewho{font-size:.7rem;text-align:center;padding:.3rem .5rem;border-radius:9px;margin-bottom:.42rem;font-weight:600;line-height:1.55}
.ecard.sj .ewho{background:rgba(192,136,32,.1);color:var(--gold)}
.ecard.as .ewho{background:rgba(58,155,174,.1);color:var(--teal)}
.efeel{font-size:.7rem;color:var(--txt3);text-align:center;line-height:1.8;margin-bottom:.42rem}
.etoday{font-size:.67rem;text-align:center;padding:.38rem .55rem;border-radius:10px;background:var(--pp4);color:var(--pp);margin-bottom:.8rem;line-height:1.65}
.eor{display:flex;gap:3px;justify-content:center;flex-wrap:wrap;margin-bottom:.8rem}
.eorbadge{padding:.16rem .44rem;border-radius:6px;font-size:.58rem;font-weight:700}
.epbtn{width:100%;padding:.62rem;border-radius:12px;font-size:.77rem;font-weight:700;cursor:pointer;transition:all .28s;font-family:var(--sans)}
.ecard.sj .epbtn{border:2px solid var(--gold2);color:var(--gold);background:transparent}
.ecard.sj .epbtn:hover,.ecard.sj.picked .epbtn{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(192,136,32,.3)}
.ecard.as .epbtn{border:2px solid var(--teal);color:var(--teal);background:transparent}
.ecard.as .epbtn:hover,.ecard.as.picked .epbtn{background:linear-gradient(135deg,var(--teal),#2A8FA0);color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(58,155,174,.3)}
.eboth{text-align:center;font-size:.68rem;color:var(--txt4);margin-top:.9rem}

/* ═══ 채팅 선택 화면 ═══ */
.chatshell{width:100%;max-width:510px;border-radius:var(--r3);overflow:hidden;box-shadow:var(--sh3);animation:fup .5s cubic-bezier(.34,1.56,.64,1)}
.chtop{background:linear-gradient(135deg,#7C5CBF,#E8627A);padding:1rem 1.4rem}
.chtitle{font-family:var(--serif);font-size:1.02rem;color:#fff;font-weight:700}
.chsub{font-size:.7rem;color:rgba(255,255,255,.72);margin-top:.2rem}
.chbody{background:var(--peach);padding:.9rem;max-height:38vh;overflow-y:auto;min-height:180px}
.cats{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:.8rem}
.catbtn{padding:.32rem .68rem;border-radius:50px;border:1.5px solid var(--bdr2);background:var(--white);color:var(--txt3);cursor:pointer;font-size:.7rem;font-family:var(--sans);white-space:nowrap;transition:all .2s}
.catbtn.on{background:linear-gradient(135deg,var(--pp),var(--pk));border-color:transparent;color:#fff;font-weight:700;box-shadow:0 2px 10px rgba(124,92,191,.24)}
.qlist{display:flex;flex-direction:column;gap:5px}
.qitem{background:var(--white);border:1.5px solid var(--bdr);border-radius:14px 14px 14px 4px;padding:.55rem .85rem;cursor:pointer;font-size:.78rem;color:var(--txt2);text-align:left;font-family:var(--sans);line-height:1.58;transition:all .2s;box-shadow:0 1px 5px rgba(124,92,191,.05)}
.qitem:hover{border-color:var(--pp3);color:var(--pp);transform:translateX(3px)}
.qitem.on{border-color:var(--pp);background:var(--pp4);color:var(--pp);font-weight:600}
.qitem.on::before{content:"✓  "}
.qitem:disabled{opacity:.38;cursor:not-allowed;transform:none}
.ort{display:flex;align-items:center;gap:.65rem;margin:.7rem 0;color:var(--txt4);font-size:.68rem}
.ort::before,.ort::after{content:"";flex:1;height:1px;background:var(--bdr2)}
.diyinp{width:100%;background:var(--white);border:1.5px solid var(--bdr);border-radius:13px;padding:.65rem .85rem;color:var(--txt);font-size:.8rem;resize:none;height:68px;font-family:var(--sans);transition:border-color .2s}
.diyinp:focus{outline:none;border-color:var(--pp);box-shadow:0 0 0 3px rgba(124,92,191,.09)}
.diyrow{display:flex;justify-content:space-between;align-items:center;margin-top:.28rem}
.addbtn{font-size:.68rem;padding:.28rem .65rem;border-radius:8px;border:1.5px solid var(--pp3);background:transparent;color:var(--pp);cursor:pointer;font-family:var(--sans);transition:all .2s;font-weight:600}
.addbtn:hover{background:var(--pp4)}

/* 풋터 */
.chfooter{background:var(--white);padding:.95rem 1.15rem;border-top:1.5px solid var(--bdr)}
.sellbl{font-size:.66rem;color:var(--pp);font-weight:700;letter-spacing:.06em;margin-bottom:.42rem}
.selitem{display:flex;align-items:flex-start;gap:.48rem;background:var(--pp4);border:1px solid var(--pp3);border-radius:10px;padding:.42rem .7rem;margin-bottom:.3rem}
.selnum{background:linear-gradient(135deg,var(--pp),var(--pk));color:#fff;border-radius:50%;width:17px;height:17px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.57rem;font-weight:700;margin-top:1px}
.seltxt{flex:1;font-size:.74rem;color:var(--txt);line-height:1.48}
.seldel{background:none;border:none;color:var(--txt4);cursor:pointer;font-size:.8rem;padding:0;line-height:1;flex-shrink:0}
.seldel:hover{color:var(--pk)}
.qstat{font-size:.7rem;color:var(--txt3);text-align:center;margin:.58rem 0;line-height:1.68}
.qstat strong{color:var(--pp)}

/* 패키지 선택 */
.pkghead{font-size:.66rem;color:var(--txt3);font-weight:600;letter-spacing:.05em;margin-bottom:.5rem}
.pkgs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:.6rem}
.pkg{background:var(--lav);border:2px solid var(--bdr);border-radius:14px;padding:.6rem .38rem;cursor:pointer;transition:all .25s;text-align:center;position:relative}
.pkg:hover{transform:translateY(-2px);border-color:var(--pp3)}
.pkg.hot{border-color:var(--pk3)}
.pkg.chosen{border-color:var(--pp);background:var(--pp4);box-shadow:0 3px 12px rgba(124,92,191,.16)}
.pkgemoji{font-size:1.15rem;margin-bottom:.15rem}
.pkgname{font-size:.68rem;font-weight:700;color:var(--txt);margin-bottom:.1rem}
.pkgprice{font-size:.84rem;font-weight:700;color:var(--gold)}
.pkgtag{font-size:.55rem;color:var(--txt4);margin-top:.06rem}
.pkghot{position:absolute;top:-7px;right:-4px;background:linear-gradient(135deg,var(--pk),var(--pp));color:#fff;font-size:.52rem;padding:.12rem .38rem;border-radius:50px;font-weight:700}
.pkgdetail{background:var(--lav);border-radius:12px;padding:.65rem .9rem;margin-bottom:.6rem;animation:fup .3s ease}
.pkgdtitle{font-size:.68rem;font-weight:700;color:var(--pp);margin-bottom:.35rem}
.pkgdlist{display:flex;flex-direction:column;gap:.2rem}
.pkgditem{font-size:.68rem;color:var(--txt2);display:flex;align-items:center;gap:.35rem}
.pkgditem::before{content:"✦";color:var(--pp3);font-size:.6rem;flex-shrink:0}
.freenote{font-size:.65rem;color:var(--txt4);text-align:center;line-height:1.68;margin-bottom:.65rem}
.askcta{width:100%;padding:.82rem;border:none;border-radius:14px;font-size:.92rem;font-weight:700;cursor:pointer;transition:all .3s;font-family:var(--sans);letter-spacing:.02em;margin-bottom:.4rem}
.askcta.main{background:linear-gradient(135deg,var(--pk),var(--pp));color:#fff;box-shadow:0 4px 20px rgba(124,92,191,.3)}
.askcta.main:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 26px rgba(124,92,191,.4)}
.askcta.main:disabled{opacity:.38;cursor:not-allowed;transform:none}
.askcta.free{background:transparent;border:2px solid var(--bdr2);color:var(--txt3);font-size:.79rem;padding:.6rem}
.askcta.free:hover{border-color:var(--pp3);color:var(--pp)}

/* ═══ 로딩 ═══ */
.loadpage{text-align:center;padding:2rem 1rem;animation:fup .6s ease}
.loadcrystal{width:100px;height:100px;margin:0 auto 1.8rem;position:relative}
.lci{width:80px;height:80px;border-radius:50%;background:radial-gradient(circle at 30% 28%,#FFF0A0,var(--pk),var(--pp),#1A0F2E);box-shadow:0 0 36px rgba(124,92,191,.4),inset 0 0 18px rgba(255,255,255,.08);animation:cpulse 2s infinite;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
@keyframes cpulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
.lcr1{position:absolute;inset:-5px;border-radius:50%;border:2.5px solid transparent;border-top-color:var(--pk);border-right-color:var(--pp);animation:spin 2.5s linear infinite}
.lcr2{position:absolute;inset:-12px;border-radius:50%;border:2px solid transparent;border-bottom-color:var(--gold2);border-left-color:var(--teal);animation:spin 4s linear infinite reverse}
@keyframes spin{to{transform:rotate(360deg)}}
.loadmsg{font-family:var(--serif);font-size:1.04rem;color:var(--pp);margin-bottom:.45rem;animation:msgfade .5s ease;line-height:1.55}
@keyframes msgfade{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
.loadsub{font-size:.77rem;color:var(--txt3);margin-bottom:1.4rem;line-height:1.75}
.progwrap{width:190px;margin:0 auto;background:var(--bdr);border-radius:4px;height:4px;overflow:hidden}
.progfill{height:100%;background:linear-gradient(90deg,var(--pk),var(--pp),var(--gold2));border-radius:4px;transition:width 1s ease}
.progpct{font-size:.65rem;color:var(--txt4);margin-top:.45rem}
.fstars{display:flex;gap:.5rem;justify-content:center;margin-top:1.2rem}
.fstar{font-size:.85rem;animation:fstaranim 1.4s var(--dl,0s) infinite}
@keyframes fstaranim{0%,100%{opacity:.12;transform:translateY(0)}50%{opacity:1;transform:translateY(-6px)}}

/* ═══ 결과 + 채팅 ═══ */
.respage{width:100%;max-width:560px;animation:fup .6s cubic-bezier(.34,1.56,.64,1)}
.rescard{background:var(--white);border:1.5px solid var(--bdr);border-radius:var(--r3);box-shadow:var(--sh3);overflow:hidden}
.restop{display:flex;align-items:center;gap:.8rem;padding:1.3rem 1.5rem;background:linear-gradient(135deg,var(--pp5),var(--pk4));border-bottom:1.5px solid var(--bdr)}
.resav{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0}
.resav.sj{background:linear-gradient(135deg,var(--gold3),var(--lav));border:2px solid var(--gold2)}
.resav.as{background:linear-gradient(135deg,rgba(58,155,174,.13),var(--lav));border:2px solid var(--teal)}
.reswho{font-family:var(--serif);font-size:.9rem;color:var(--txt);font-weight:700}
.resmeta{font-size:.67rem;color:var(--txt4);margin-top:.24rem;line-height:1.55}
.resbody-wrap{padding:1.2rem 1.5rem;max-height:38vh;overflow-y:auto}
.resqwrap{margin-bottom:.9rem}
.resq{display:flex;gap:.48rem;align-items:flex-start;background:var(--lav);border:1px solid var(--bdr);border-radius:10px;padding:.48rem .8rem;margin-bottom:.3rem}
.rqn{font-size:.62rem;font-weight:700;color:var(--pp);flex-shrink:0;padding-top:.04rem}
.rqt{font-size:.75rem;color:var(--txt2);line-height:1.58}
.resbody{font-size:.84rem;line-height:2.15;color:var(--txt2);white-space:pre-wrap}
.resbody strong,.resbody b{color:var(--pp);font-weight:700}
.resbody em{font-style:normal;color:var(--pk)}

/* 채팅 영역 */
.chatzone{border-top:1.5px solid var(--bdr);background:var(--peach)}
.chatmsgs{padding:.8rem 1rem;max-height:28vh;overflow-y:auto;display:flex;flex-direction:column;gap:.6rem}
.msg{display:flex;gap:.55rem;animation:fup .3s ease}
.msg.user{flex-direction:row-reverse}
.msgav{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0;margin-top:2px}
.msgav.ai{background:linear-gradient(135deg,var(--pp),var(--pk))}
.msgav.user{background:linear-gradient(135deg,var(--gold2),var(--pk))}
.msgbubble{max-width:78%;padding:.62rem .85rem;border-radius:18px;font-size:.79rem;line-height:1.75;color:var(--txt)}
.msg.ai .msgbubble{background:var(--white);border:1px solid var(--bdr);border-bottom-left-radius:5px;box-shadow:var(--sh1)}
.msg.user .msgbubble{background:linear-gradient(135deg,var(--pp),var(--pk));color:#fff;border-bottom-right-radius:5px}
.msgbubble strong{color:var(--pp);font-weight:700}
.msg.user .msgbubble strong{color:#fff}
.typing{display:flex;gap:4px;padding:.5rem .8rem;background:var(--white);border:1px solid var(--bdr);border-radius:18px;border-bottom-left-radius:5px;width:fit-content}
.typing span{width:6px;height:6px;background:var(--pp3);border-radius:50%;animation:typingdot 1.2s infinite}
.typing span:nth-child(2){animation-delay:.2s}
.typing span:nth-child(3){animation-delay:.4s}
@keyframes typingdot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}

/* 채팅 추천 질문 */
.chatsugg{padding:.6rem 1rem;display:flex;gap:.4rem;flex-wrap:wrap;border-top:1px solid var(--bdr)}
.suggbtn{padding:.28rem .65rem;background:var(--white);border:1.5px solid var(--pp3);border-radius:50px;font-size:.68rem;color:var(--pp);cursor:pointer;font-family:var(--sans);transition:all .2s;white-space:nowrap}
.suggbtn:hover{background:var(--pp4)}

/* 채팅 입력 */
.chatinput{display:flex;gap:.5rem;padding:.75rem 1rem;border-top:1px solid var(--bdr);background:var(--white)}
.chatinp{flex:1;background:var(--lav);border:1.5px solid var(--bdr);border-radius:50px;padding:.55rem 1rem;color:var(--txt);font-size:.8rem;font-family:var(--sans);transition:border-color .2s}
.chatinp:focus{outline:none;border-color:var(--pp);background:var(--white)}
.chatinp::placeholder{color:var(--txt4)}
.chatsend{width:36px;height:36px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--pp),var(--pk));color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;transition:all .2s}
.chatsend:hover:not(:disabled){transform:scale(1.1)}
.chatsend:disabled{opacity:.38;cursor:not-allowed}
.chatlimit{font-size:.65rem;color:var(--txt4);text-align:center;padding:.35rem;border-top:1px solid var(--bdr)}

/* 업셀 + 액션 */
.resactions{padding:1rem 1.5rem;border-top:1.5px solid var(--bdr);background:var(--white)}
.upsell{background:linear-gradient(135deg,rgba(192,136,32,.08),rgba(124,92,191,.08));border:1.5px solid rgba(192,136,32,.24);border-radius:15px;padding:.95rem;margin-bottom:.85rem;text-align:center}
.upt{font-family:var(--serif);font-size:.89rem;color:var(--gold);font-weight:700;margin-bottom:.3rem}
.upd{font-size:.74rem;color:var(--txt3);margin-bottom:.8rem;line-height:1.75}
.upbtn{width:100%;padding:.68rem;border:none;border-radius:12px;background:linear-gradient(135deg,var(--gold2),var(--gold));color:#fff;font-size:.81rem;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .25s}
.upbtn:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(192,136,32,.35)}
.upbtn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.racts{display:flex;gap:.48rem;flex-wrap:wrap}
.ract{flex:1;min-width:80px;padding:.58rem .38rem;border-radius:12px;border:1.5px solid var(--bdr);background:transparent;color:var(--txt3);cursor:pointer;font-size:.71rem;transition:all .2s;font-family:var(--sans)}
.ract:hover{border-color:var(--pp3);color:var(--pp);background:var(--pp5)}

/* 리포트 모달 */
.modal-overlay{position:fixed;inset:0;background:rgba(26,15,58,.6);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;animation:fup .3s ease}
.modal{background:var(--white);border-radius:var(--r3);width:100%;max-width:500px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(26,15,58,.3);animation:modalup .4s cubic-bezier(.34,1.56,.64,1)}
@keyframes modalup{from{opacity:0;transform:translateY(40px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
.mhdr{background:linear-gradient(135deg,var(--pp),var(--pk));padding:1.3rem 1.5rem;border-radius:var(--r3) var(--r3) 0 0;display:flex;justify-content:space-between;align-items:center}
.mhtitle{font-family:var(--serif);font-size:1.05rem;color:#fff;font-weight:700}
.mhclose{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.2);border:none;color:#fff;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;transition:all .2s}
.mhclose:hover{background:rgba(255,255,255,.35)}
.mbody{padding:1.4rem 1.5rem}
.mloading{text-align:center;padding:2rem}
.msec{margin-bottom:1.3rem}
.msectitle{font-family:var(--serif);font-size:.92rem;color:var(--pp);font-weight:700;margin-bottom:.6rem;display:flex;align-items:center;gap:.4rem}
.mtext{font-size:.82rem;line-height:2.1;color:var(--txt2);white-space:pre-wrap}
.mtext strong{color:var(--pp)}

/* 공통 */
@keyframes fup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.hint{font-size:.62rem;color:var(--txt4)}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--pp3);border-radius:2px}
`;

// ═══════════════════════════════════════════════════════
//  🔮 스텝 인디케이터
// ═══════════════════════════════════════════════════════
function Stps({cur}){
  const labels=["내 정보 입력","기운 선택","질문 고르기"];
  return(
    <div>
      <div className="stps">{[0,1,2].map(i=><div key={i} className={`sd ${i<cur?"done":i===cur?"act":"todo"}`}/>)}</div>
      <div className="stplbl">{labels[cur]}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  🌟 메인 앱
// ═══════════════════════════════════════════════════════
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
  // 채팅 상태
  const [chatMsgs,setChatMsgs]=useState([]);
  const [chatInput,setChatInput]=useState("");
  const [chatLoading,setChatLoading]=useState(false);
  const [chatUsed,setChatUsed]=useState(0);
  // 리포트 모달
  const [showReport,setShowReport]=useState(false);
  const [reportContent,setReportContent]=useState("");
  const [reportLoading,setReportLoading]=useState(false);
  const chatEndRef=useRef(null);

  const [blobs]=useState(()=>[
    {w:380,h:380,x:"-8%",y:"-12%",c:"rgba(232,176,72,.14)",d:"19s",dl:"0s",tx:"24px",ty:"34px"},
    {w:320,h:320,x:"58%",y:"2%",c:"rgba(124,92,191,.12)",d:"23s",dl:"2s",tx:"-20px",ty:"28px"},
    {w:260,h:260,x:"10%",y:"58%",c:"rgba(232,98,122,.11)",d:"27s",dl:"4s",tx:"22px",ty:"-18px"},
    {w:200,h:200,x:"68%",y:"63%",c:"rgba(58,155,174,.09)",d:"21s",dl:"3s",tx:"-18px",ty:"22px"},
    {w:150,h:150,x:"35%",y:"80%",c:"rgba(90,158,106,.08)",d:"25s",dl:"1s",tx:"16px",ty:"-14px"},
  ]);
  const [sparks]=useState(()=>Array.from({length:16},(_,i)=>({
    x:Math.random()*100,y:Math.random()*100,
    s:["✦","✧","⋆","·","˚","✿"][i%6],
    sz:.7+Math.random()*.7,d:3+Math.random()*4,dl:Math.random()*3.5,
  })));

  const saju=(form.by&&form.bm&&form.bd)?getSaju(+form.by,+form.bm,+form.bd,form.noTime?12:+(form.bh||12)):null;
  const sun=(form.bm&&form.bd)?getSun(+form.bm,+form.bd):null;
  const moon=(form.by&&form.bm&&form.bd)?getMoon(+form.by,+form.bm,+form.bd):null;
  const asc=(!form.noTime&&form.bh&&form.bm)?getAsc(+form.bh,+form.bm):null;
  const age=form.by?new Date().getFullYear()-+form.by:0;
  const il=saju?ILGAN[saju.ilgan]:null;
  const formOk=form.by&&form.bm&&form.bd&&form.gender&&(form.noTime||form.bh);
  const curPkg=PKGS.find(p=>p.id===pkg)||PKGS[2];
  const maxQ=curPkg.limit.q;
  const maxChat=curPkg.limit.chat;
  const chatLeft=maxChat-chatUsed;

  const addQ=q=>{if(selQs.length<maxQ&&!selQs.includes(q)){setSelQs(p=>[...p,q]);setDiy("");}};
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

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatMsgs,chatLoading]);

  // ── 시스템 프롬프트 생성
  const buildSys=()=>{
    const base=`당신은 '별숨(Byeolsoom)'의 AI 운세 상담가예요. 한국 전통 사주 명리학과 서양 점성술을 깊이 이해하는 따뜻한 전문가예요.
말투 규칙:
- 친근한 경어체로, 베프가 진심으로 들어주듯이 말해줘요
- 이모지를 자연스럽게 활용해요 (과하지 않게)
- "~하죠", "~이에요", "~해봐요" 같은 부드러운 어미를 써요
- 딱딱하거나 공식적인 표현은 피해요
- 먼저 감정에 공감하고, 그 다음 운세 해석을 해요
- **중요 키워드**는 볼드로 강조해요
답변 구조 (질문당):
1. 그 마음에 공감 (1-2문장)
2. 사주/점성술 근거로 따뜻한 해석 (3-4문장, 실제 데이터 활용)
3. 구체적이고 실천 가능한 조언 (1-2문장)
한 질문당 250-320자로 답해요. 여러 질문이면 각각 번호 붙여요.`;
    return base;
  };

  const buildCtx=()=>{
    let ctx=`[${form.name||"고객님"} 정보]\n나이: ${age}세 / 성별: ${form.gender}\n`;
    if(mode==="saju"&&saju){
      ctx+=`[사주 원국]\n연주: ${saju.yeon.g}${saju.yeon.j}(${saju.yeon.gh}${saju.yeon.jh}) / 월주: ${saju.wol.g}${saju.wol.j}(${saju.wol.gh}${saju.wol.jh})\n일주: ${saju.il.g}${saju.il.j}(${saju.il.gh}${saju.il.jh}) / 시주: ${saju.si.g}${saju.si.j}(${saju.si.gh}${saju.si.jh})\n일간: ${saju.ilgan} / 오행분포: ${Object.entries(saju.or).map(([k,v])=>k+v+"개").join(" ")}\n강한오행: ${saju.dominant} / 약한오행: ${saju.lacking}\n`;
    }else if(mode==="astro"&&sun){
      ctx+=`[점성술 정보]\n태양궁: ${sun.n}(${sun.s}) / 달궁: ${moon?.n||"?"} / 상승궁: ${asc?.n||"시각 미입력"}\n`;
    }
    return ctx;
  };

  // ── 메인 답변 API 호출
  const askClaude=async()=>{
    if(!selQs.length)return;
    setStep(4);
    const sys=buildSys();
    const ctx=buildCtx()+`\n[질문]\n${selQs.map((q,i)=>(i+1)+". "+q).join("\n")}`;
    try{
      const res=await fetch("/api/ask",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:sys,userMessage:ctx}),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"API 오류");
      setLp(100);setLm(4);
      setTimeout(()=>{
        setResult(data.text||"해석 중 오류가 났어요 🌙");
        setChatMsgs([{role:"ai",text:data.text||""}]);
        setChatUsed(0);
        setStep(5);
      },900);
    }catch(err){
      console.error(err);
      setLp(100);setLm(4);
      setTimeout(()=>{
        const fallback="별이 잠시 길을 잃었어요 🌙 네트워크 연결을 확인하고 다시 시도해봐요!";
        setResult(fallback);
        setChatMsgs([{role:"ai",text:fallback}]);
        setStep(5);
      },900);
    }
  };

  // ── 후속 채팅 API 호출
  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading||chatLeft<=0)return;
    const userMsg=chatInput.trim();
    setChatInput("");
    setChatMsgs(p=>[...p,{role:"user",text:userMsg}]);
    setChatLoading(true);
    setChatUsed(p=>p+1);
    const sys=buildSys()+"\n\n이미 첫 답변을 드린 상태예요. 후속 질문에 자연스럽게 이어서 답해줘요. 이전 맥락을 기억하고 일관성 있게 답해줘요.";
    const history=chatMsgs.map(m=>`[${m.role==="ai"?"별숨":"고객"}]: ${m.text}`).join("\n\n");
    const ctx=buildCtx()+`\n[이전 대화]\n${history}\n\n[새 질문]\n${userMsg}`;
    try{
      const res=await fetch("/api/ask",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:sys,userMessage:ctx}),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error);
      setChatMsgs(p=>[...p,{role:"ai",text:data.text||""}]);
    }catch(err){
      setChatMsgs(p=>[...p,{role:"ai",text:"앗, 잠깐 연결이 끊겼어요 🌙 다시 시도해봐요!"}]);
    }finally{setChatLoading(false);}
  };

  // ── 프리미엄 리포트 생성
  const genReport=async()=>{
    setShowReport(true);
    setReportLoading(true);
    setReportContent("");
    const sys=buildSys()+"\n\n월간 종합 운세 리포트를 작성해줘요. 연애운, 직업운, 재물운, 건강운, 이달의 주의사항, 행운의 날짜·색깔·숫자를 포함해요. 각 섹션은 제목(##)으로 구분하고, 총 600-800자로 써요.";
    const ctx=buildCtx()+"\n[요청] 이번 달 종합 운세 리포트 작성";
    try{
      const res=await fetch("/api/ask",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:sys,userMessage:ctx}),
      });
      const data=await res.json();
      setReportContent(data.text||"리포트 생성에 실패했어요 🌙");
    }catch{
      setReportContent("별이 잠시 쉬고 있어요 🌙 잠시 후 다시 시도해봐요!");
    }finally{setReportLoading(false);}
  };

  const fmt=t=>t
    .replace(/##\s*(.*)/g,"<div class='msectitle'>✦ $1</div>")
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
    .replace(/\n/g,"<br/>");

  const CHAT_SUGG={
    love:["좀 더 자세히 알고 싶어요","언제쯤 변화가 올까요?","어떻게 행동하는 게 좋을까요?"],
    work:["구체적인 방법이 있을까요?","타이밍이 언제가 좋을까요?","주의해야 할 점은요?"],
    money:["어떤 분야가 좋을까요?","지금 당장 할 수 있는 게 뭔가요?","더 자세히 알려줘요"],
    future:["불안한 마음이 커요","더 구체적으로 알고 싶어요","긍정적인 부분만 봐도 될까요?"],
  };
  const getSugg=()=>{
    const catId=selQs.length?CATS.find(c=>c.qs.includes(selQs[0]))?.id||"future":"future";
    return CHAT_SUGG[catId]||CHAT_SUGG.future;
  };

  const REVIEWS=[
    {star:"⭐⭐⭐⭐⭐",txt:"사주 해석이 소름 돋을 정도로 정확해요 ㄷㄷ 특히 오행 분석이 진짜 저 얘기 같았어요",nick:"가을고양이 · 28세"},
    {star:"⭐⭐⭐⭐⭐",txt:"별자리 달궁 해석이 이렇게 디테일한 앱은 처음이에요. 베프한테 상담받는 느낌!",nick:"핑크라떼 · 25세"},
    {star:"⭐⭐⭐⭐⭐",txt:"후속 채팅 기능이 진짜 유용해요. 궁금한 거 바로 물어볼 수 있어서 좋아요 💕",nick:"달밤산책 · 31세"},
  ];

  return(
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* 배경 */}
        <div className="bg">
          {blobs.map((b,i)=>(
            <div key={i} className="blob" style={{width:b.w,height:b.h,left:b.x,top:b.y,background:`radial-gradient(circle,${b.c},transparent 70%)`}}
              ref={el=>{if(el){el.style.setProperty("--d",b.d);el.style.setProperty("--dl",b.dl);el.style.setProperty("--tx",b.tx);el.style.setProperty("--ty",b.ty);}}}/>
          ))}
          {sparks.map((s,i)=>(
            <div key={i} className="spark" style={{left:`${s.x}%`,top:`${s.y}%`,fontSize:`${s.sz}rem`,color:"rgba(124,92,191,.25)"}}
              ref={el=>{if(el){el.style.setProperty("--d",`${s.d}s`);el.style.setProperty("--dl",`${s.dl}s`);}}}>{s.s}</div>
          ))}
        </div>

        <div className="rel">

          {/* ══════ 0 랜딩 ══════ */}
          {step===0&&(
            <div className="page">
              <div className="land">
                <div className="lbadge">✦ AI 사주 × 점성술 ✦</div>
                <h1 className="ltitle">별숨</h1>
                <p className="lsub">Byeolsoom · Your Star Whisper</p>
                <p className="lcopy">오늘 마음 한켠에 <em>뭔가 걸려요?</em><br/>생년월일 하나로 지금 당신에게<br/>꼭 필요한 이야기를 들려드릴게요 🌙</p>
                <button className="lcta" onClick={()=>setStep(1)}>✨ 내 별이 하는 말 듣기</button>
                <div className="ltags">
                  <span className="ltag">🀄 사주명리</span>
                  <span className="ltag">♈ 서양점성술</span>
                  <span className="ltag">💬 후속채팅</span>
                  <span className="ltag">📊 월간리포트</span>
                </div>
                <div className="lrev">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span>4.9점</span>
                  <span>·</span>
                  <span>3,241명의 별숨인</span>
                </div>
                <div className="lreviews">
                  {REVIEWS.map((r,i)=>(
                    <div key={i} className="lrcard">
                      <div className="lrstar">{r.star}</div>
                      <div className="lrtxt">"{r.txt}"</div>
                      <div className="lrnick">{r.nick}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════ 1 정보 입력 ══════ */}
          {step===1&&(
            <div className="page">
              <button className="bk" onClick={()=>setStep(0)}>←</button>
              <div className="card">
                <Stps cur={0}/>
                <div className="ct">반가워요! 먼저 알려주세요 🌸</div>
                <div className="cs">생년월일만 있으면 사주와 별자리를<br/>바로 읽어드릴 수 있어요</div>

                <label className="lbl">이름 (선택이에요)</label>
                <input className="inp" placeholder="뭐라고 불러드릴까요?" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>

                <label className="lbl">생년월일</label>
                <div className="row">
                  <div className="col"><input className="inp" placeholder="1998" maxLength={4} value={form.by} onChange={e=>setForm(f=>({...f,by:e.target.value.replace(/\D/,"")}))} style={{marginBottom:0}}/></div>
                  <div className="col"><select className="inp" value={form.bm} onChange={e=>setForm(f=>({...f,bm:e.target.value}))} style={{marginBottom:0}}>
                    <option value="">월</option>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}
                  </select></div>
                  <div className="col"><select className="inp" value={form.bd} onChange={e=>setForm(f=>({...f,bd:e.target.value}))} style={{marginBottom:0}}>
                    <option value="">일</option>{[...Array(31)].map((_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}
                  </select></div>
                </div>
                <div style={{height:".85rem"}}/>

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
                    <div className="ortags">{Object.entries(saju.or).map(([k,v])=>v>0&&<span key={k} className="ortag" style={{background:`${OC[k]}18`,color:OC[k],border:`1px solid ${OC[k]}35`}}>{OE[k]}{ONAME[k]} {v}</span>)}</div>
                    {saju.or[saju.dominant]>=4&&<div className="ohmsg">{OHAENG_MSG[saju.dominant]?.over}</div>}
                    {saju.or[saju.lacking]===0&&<div className="ohmsg">{OHAENG_MSG[saju.lacking]?.lack}</div>}
                  </>
                )}

                <button className="lcta" style={{width:"100%",marginTop:"1.3rem",justifyContent:"center",borderRadius:15,padding:".8rem"}}
                  disabled={!formOk} onClick={()=>{setSelQs([]);setStep(2);}}>
                  내 기운 보러가기 ✨
                </button>
              </div>
            </div>
          )}

          {/* ══════ 2 기운 선택 ══════ */}
          {step===2&&(
            <div className="page">
              <button className="bk" onClick={()=>setStep(1)}>←</button>
              <div className="epage">
                <Stps cur={1}/>
                <div className="eintro">
                  <div className="etitle">{form.name?`${form.name}님은 어떤 사람인가요? 🌟`:"당신은 어떤 사람인가요? 🌟"}</div>
                  <div className="esub">사주와 별자리가 바라본 <em>{form.name||"당신"}</em>이에요<br/>더 잘 맞는 기운으로 물어봐요</div>
                </div>
                <div className="mychips">
                  {form.name&&<div className="chip">👤 <b>{form.name}</b></div>}
                  <div className="chip">🎂 <b>{form.by}.{form.bm}.{form.bd}</b></div>
                  {sun&&<div className="chip">{sun.s} <b>{sun.n}</b></div>}
                  {saju&&<div className="chip">🀄 <b>{saju.ilgan}일간</b></div>}
                  {moon&&<div className="chip">🌙 <b>{moon.n}</b></div>}
                </div>
                <div className="ecards">
                  {/* 사주 카드 */}
                  <div className={`ecard sj ${mode==="saju"?"picked":""}`} onClick={()=>setMode("saju")}>
                    <span className="eicon">🀄</span>
                    <div className="ekind">사주 기운</div>
                    <div className="ename">전통 명리학</div>
                    {il&&(<>
                      <div className="ewho">{il.short}<br/><span style={{fontSize:".62rem",fontWeight:400}}>{il.who}</span></div>
                      <div className="efeel">{il.feel}</div>
                      <div className="etoday">💌 오늘의 한마디<br/>"{il.today}"</div>
                      {saju&&<div className="eor">{Object.entries(saju.or).map(([k,v])=>v>0&&<span key={k} className="eorbadge" style={{background:`${OC[k]}18`,color:OC[k],border:`1px solid ${OC[k]}28`}}>{OE[k]}{ONAME[k]}</span>)}</div>}
                    </>)}
                    <button className="epbtn" onClick={e=>{e.stopPropagation();setMode("saju");setStep(3);}}>{mode==="saju"?"✓ 선택됨":"이 기운으로 →"}</button>
                  </div>
                  {/* 점성술 카드 */}
                  <div className={`ecard as ${mode==="astro"?"picked":""}`} onClick={()=>setMode("astro")}>
                    <span className="eicon">{sun?.s||"✨"}</span>
                    <div className="ekind">점성술 기운</div>
                    <div className="ename">서양 점성학</div>
                    {sun&&(<>
                      <div className="ewho">{sun.n}<br/><span style={{fontSize:".62rem",fontWeight:400}}>{sun.vibe}</span></div>
                      <div className="efeel">{sun.feel}</div>
                      <div className="etoday">💌 오늘의 한마디<br/>"{sun.today}"</div>
                      <div className="eor">
                        <span className="eorbadge" style={{background:"rgba(58,155,174,.1)",color:"var(--teal)",border:"1px solid rgba(58,155,174,.22)"}}>{sun.el} {sun.charm}</span>
                      </div>
                      {moon&&<div style={{fontSize:".62rem",color:"var(--txt4)",textAlign:"center",marginBottom:".8rem"}}>달궁 {moon.s} {moon.n} · {moon.moon}{asc?` · 상승 ${asc.s} ${asc.n}`:""}</div>}
                    </>)}
                    <button className="epbtn" onClick={e=>{e.stopPropagation();setMode("astro");setStep(3);}}>{mode==="astro"?"✓ 선택됨":"이 기운으로 →"}</button>
                  </div>
                </div>
                <div className="eboth">✦ 둘 다 궁금하면 각각 따로 물어볼 수 있어요</div>
              </div>
            </div>
          )}

          {/* ══════ 3 질문 선택 ══════ */}
          {step===3&&(
            <div className="page">
              <button className="bk" onClick={()=>setStep(2)}>←</button>
              <div className="chatshell">
                <div className="chtop">
                  <Stps cur={2}/>
                  <div className="chtitle">{mode==="saju"?"🀄 사주에게 물어봐요":"✨ 별자리에게 물어봐요"}</div>
                  <div className="chsub">카테고리 누르고 질문 골라봐요 · 최대 {maxQ}개</div>
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
                      return<button key={i} className={`qitem ${on?"on":""}`} disabled={!on&&selQs.length>=maxQ} onClick={()=>on?rmQ(selQs.indexOf(q)):addQ(q)}>{q}</button>;
                    })}
                  </div>
                  <div className="ort">또는 직접 써봐요</div>
                  <textarea className="diyinp" placeholder="예: 요즘 이 사람이 나를 어떻게 생각하는지 너무 궁금해요ㅠ" maxLength={200} value={diy} onChange={e=>setDiy(e.target.value)}/>
                  <div className="diyrow">
                    <span className="hint">{diy.length}/200</span>
                    {diy.trim()&&selQs.length<maxQ&&<button className="addbtn" onClick={()=>addQ(diy.trim())}>+ 추가</button>}
                  </div>
                </div>

                <div className="chfooter">
                  {selQs.length>0&&(
                    <>
                      <div className="sellbl">📌 고른 질문 ({selQs.length}/{maxQ})</div>
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
                    {selQs.length>0&&selQs.length<maxQ&&<><strong>{maxQ-selQs.length}개</strong> 더 고를 수 있어요</>}
                    {selQs.length===maxQ&&"질문 준비 완료! 🎊"}
                  </div>

                  <div className="pkghead">🌟 이용권 선택</div>
                  <div className="pkgs">
                    {PKGS.map(p=>(
                      <div key={p.id} className={`pkg ${p.hot?"hot":""} ${pkg===p.id?"chosen":""}`} onClick={()=>{setPkg(p.id);if(selQs.length>p.limit.q)setSelQs(s=>s.slice(0,p.limit.q));}}>
                        {p.hot&&<div className="pkghot">💕 베스트</div>}
                        <div className="pkgemoji">{p.emoji}</div>
                        <div className="pkgname">{p.name}</div>
                        <div className="pkgprice">{p.price}</div>
                        <div className="pkgtag">{p.tag}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pkgdetail">
                    <div className="pkgdtitle">{curPkg.emoji} {curPkg.name}팩 혜택</div>
                    <div className="pkgdlist">
                      {curPkg.features.map((f,i)=><div key={i} className="pkgditem">{f}</div>)}
                    </div>
                  </div>

                  <div className="freenote">⭐ 별 1개 = 질문 1회 · <span style={{color:"var(--pk)"}}>지금은 무료로 체험할 수 있어요!</span></div>
                  <button className="askcta main" disabled={!selQs.length} onClick={askClaude}>
                    {selQs.length===0?"질문을 먼저 골라봐요 💕":`🔮 별에게 물어볼게요 (★${selQs.length}개)`}
                  </button>
                  <button className="askcta free" onClick={askClaude} disabled={!selQs.length}>무료로 체험해보기 →</button>
                </div>
              </div>
            </div>
          )}

          {/* ══════ 4 로딩 ══════ */}
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

          {/* ══════ 5 결과 + 채팅 ══════ */}
          {step===5&&(
            <div className="page">
              <div className="respage">
                <div className="rescard">
                  {/* 헤더 */}
                  <div className="restop">
                    <div className={`resav ${mode}`}>{mode==="saju"?"🀄":"✨"}</div>
                    <div>
                      <div className="reswho">{form.name||"당신"}님께 보내는 별의 메시지 💌</div>
                      <div className="resmeta">{mode==="saju"?`일간 ${saju?.ilgan} · ${saju?.ilji} · ${age}세 · 사주 기준`:`${sun?.s} ${sun?.n} · 달궁 ${moon?.s||""} ${moon?.n||""} · ${age}세`}</div>
                    </div>
                  </div>

                  {/* 결과 본문 */}
                  <div className="resbody-wrap">
                    <div className="resqwrap">
                      {selQs.map((q,i)=>(
                        <div key={i} className="resq"><span className="rqn">Q{i+1}</span><span className="rqt">{q}</span></div>
                      ))}
                    </div>
                    <div className="resbody" dangerouslySetInnerHTML={{__html:fmt(result)}}/>
                  </div>

                  {/* 채팅 영역 */}
                  {maxChat>0&&(
                    <div className="chatzone">
                      <div className="chatmsgs">
                        {chatMsgs.slice(1).map((m,i)=>(
                          <div key={i} className={`msg ${m.role}`}>
                            <div className={`msgav ${m.role}`}>{m.role==="ai"?"🔮":"✦"}</div>
                            <div className="msgbubble" dangerouslySetInnerHTML={{__html:fmt(m.text)}}/>
                          </div>
                        ))}
                        {chatLoading&&(
                          <div className="msg ai">
                            <div className="msgav ai">🔮</div>
                            <div className="typing"><span/><span/><span/></div>
                          </div>
                        )}
                        <div ref={chatEndRef}/>
                      </div>

                      {chatLeft>0&&!chatLoading&&(
                        <div className="chatsugg">
                          {getSugg().map((s,i)=>(
                            <button key={i} className="suggbtn" onClick={()=>{setChatInput(s);}}>{s}</button>
                          ))}
                        </div>
                      )}

                      <div className="chatinput">
                        <input className="chatinp" placeholder={chatLeft>0?"더 궁금한 게 있어요? 물어봐요 🌙":"채팅 횟수를 모두 사용했어요"} value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} disabled={chatLeft<=0||chatLoading}/>
                        <button className="chatsend" onClick={sendChat} disabled={!chatInput.trim()||chatLeft<=0||chatLoading}>✦</button>
                      </div>
                      <div className="chatlimit">채팅 {chatUsed}/{maxChat}회 사용 · 남은 횟수 {chatLeft}회</div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="resactions">
                    <div className="upsell">
                      <div className="upt">✨ 이번 달 전체 운세가 궁금해요</div>
                      <div className="upd">연애·재물·건강·직업 종합 분석 + 행운의 날짜<br/>나만을 위한 맞춤 월간 리포트를 받아봐요</div>
                      <button className="upbtn" onClick={genReport} disabled={reportLoading}>
                        {reportLoading?"✦ 리포트 생성 중...":"🌟 월간 리포트 받기 (★15개)"}
                      </button>
                    </div>
                    <div className="racts">
                      <button className="ract" onClick={()=>{setSelQs([]);setDiy("");setChatMsgs([]);setChatUsed(0);setStep(3);}}>🔄 다른 질문</button>
                      <button className="ract" onClick={()=>{setMode("");setStep(2);}}>🔀 기운 바꾸기</button>
                      <button className="ract" onClick={()=>{navigator.clipboard?.writeText(result);alert("복사됐어요! 📋");}}>📋 복사</button>
                      <button className="ract" onClick={()=>{setStep(0);setForm({name:"",by:"",bm:"",bd:"",bh:"",gender:"",noTime:false});setMode("");setSelQs([]);setResult("");setChatMsgs([]);setChatUsed(0);}}>🏠 처음으로</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════ 프리미엄 리포트 모달 ══════ */}
      {showReport&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className==="modal-overlay")setShowReport(false);}}>
          <div className="modal">
            <div className="mhdr">
              <div className="mhtitle">🌟 {form.name||"당신"}님의 월간 운세 리포트</div>
              <button className="mhclose" onClick={()=>setShowReport(false)}>✕</button>
            </div>
            <div className="mbody">
              {reportLoading?(
                <div className="mloading">
                  <div style={{fontSize:"2rem",marginBottom:"1rem"}}>🔮</div>
                  <div style={{fontSize:".85rem",color:"var(--txt3)"}}>별이 이달의 이야기를 정리하고 있어요...<br/>잠깐만 기다려줘요 🌙</div>
                </div>
              ):(
                <div className="mtext" dangerouslySetInnerHTML={{__html:fmt(reportContent)}}/>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
