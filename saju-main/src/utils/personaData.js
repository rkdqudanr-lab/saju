/**
 * 20가지 사용자 페르소나 데이터 및 프롬프트 가이드
 */

export const PERSONAS = {
  job_seeker: {
    name: '취준생',
    desc: '합격과 진로에 대한 간절함이 큰 유저',
    focus: '합격운, 면접 팁, 직무 적성, 시기적 운때',
    vibe: '격려와 구체적인 조언',
  },
  office_worker: {
    name: '직장인',
    desc: '성과, 이직, 인간관계에 집중하는 유저',
    focus: '승진운, 이직 타이밍, 상사/동료 궁합, 번아웃 방지',
    vibe: '현실적이고 효율적인 분석',
  },
  artist: {
    name: '예술가',
    desc: '창의성과 영감을 중시하는 유저',
    focus: '영감의 원천, 표현의 시기, 정신적 풍요, 독창성',
    vibe: '시적이고 은유적인 표현',
  },
  entrepreneur: {
    name: '창업가',
    desc: '리스크 관리와 확장이 중요한 유저',
    focus: '사업운, 파트너십, 투자 타이밍, 대운의 흐름',
    vibe: '결단력 있고 통찰력 있는 언어',
  },
  homemaker: {
    name: '주부',
    desc: '가족의 화목과 안정을 최우선으로 하는 유저',
    focus: '가족운, 자녀 적성, 주거 안정, 건강운',
    vibe: '따뜻하고 포용력 있는 공감',
  },
  indecisive: {
    name: '결정장애',
    desc: '선택의 순간에 확신이 필요한 유저',
    focus: '명확한 기로 분석, 우선순위 설정, 최적의 선택지',
    vibe: '단호하고 명쾌한 가이드',
  },
  healing_seeker: {
    name: '위로가 필요한 유저',
    desc: '정서적 지지와 공감이 절실한 유저',
    focus: '심리적 회복, 자존감 회복, 운의 전환점에서의 위로',
    vibe: '포근하고 깊은 정서적 지지',
  },
  skeptic: {
    name: '회의론자',
    desc: '논리적 근거와 설명을 요구하는 유저',
    focus: '사주 원국(Pillars) 분석, 별자리 각도(Aspects) 근거',
    vibe: '체계적이고 데이터 중심적인 설명',
  },
  heavy_user: {
    name: '헤비 유저',
    desc: '매일의 흐름을 기록하고 루틴화하는 유저',
    focus: '디테일한 일진 분석, 미세한 기운의 변화',
    vibe: '친근하고 연속성 있는 대화',
  },
  compatibility_seeker: {
    name: '궁합 유저',
    desc: '타인과의 관계성에 몰입하는 유저',
    focus: '상대방과의 기운 조화, 소통 방식, 인연의 깊이',
    vibe: '객관적이면서도 관계 중심적인 분석',
  },
  diary_centric: {
    name: '일기 유저',
    desc: '자신의 내면을 기록하며 성찰하는 유저',
    focus: '내면의 변화, 감정의 흐름, 일기 기반 맞춤 운세',
    vibe: '철학적이고 성찰적인 유도',
  },
  gen_z: {
    name: 'Z세대',
    desc: '트렌디하고 직관적인 정보를 원하는 유저',
    focus: '힙한 행운 아이템, MBTI 연계, SNS 공유용 포인트',
    vibe: '트렌디하고 간결한 말투',
  },
  senior: {
    name: '고령 유저',
    desc: '전통적인 가치와 건강, 가족을 중시하는 유저',
    focus: '무병장수, 자손 번창, 평온한 노후',
    vibe: '정중하고 예의 바른 고전적 표현',
  },
  investor: {
    name: '재테크 유저',
    desc: '자산 증식과 금전 흐름에 민감한 유저',
    focus: '편재/정재운, 투자 손실 주의보, 횡재수',
    vibe: '리스크 중심적이고 실리적인 관점',
  },
  health_conscious: {
    name: '건강 유저',
    desc: '신체적 컨디션과 예방에 집중하는 유저',
    focus: '오행별 취약 장기, 기력 보충 시기, 수면 루틴',
    vibe: '세심하고 예방적인 조언',
  },
  student: {
    name: '학생',
    desc: '공부와 시험, 교우 관계가 중요한 유저',
    focus: '학업운, 집중력 타이밍, 친구 관계',
    vibe: '친절한 선생님 같은 격려',
  },
  minimalist: {
    name: '미니멀리스트',
    desc: '핵심 정보만 깔끔하게 얻길 원하는 유저',
    focus: '한 줄 요약, 가장 중요한 한 가지 Action',
    vibe: '극도로 간결하고 명확한 요약',
  },
  social_butterfly: {
    name: '모임 주최자',
    desc: '인맥 관리와 모임을 즐기는 유저',
    focus: '사교운, 주목받는 시기, 인맥 확장 타이밍',
    vibe: '활발하고 에너지 넘치는 화법',
  },
  global_soul: {
    name: '글로벌 유저',
    desc: '해외 거주 중이거나 이동이 잦은 유저',
    focus: '역마살 활용, 해외운, 문화적 융합',
    vibe: '개방적이고 넓은 시야의 해석',
  },
  night_owl: {
    name: '밤샘 유저',
    desc: '심야 시간에 주로 활동하며 사색하는 유저',
    focus: '달의 에너지가 강한 시기, 정적인 성찰',
    vibe: '차분하고 몽환적인 심야 감성',
  },
};

/**
 * 페르소나에 따른 시스템 프롬프트 생성 함수
 */
export function getPersonaPrompt(personaKey) {
  const p = PERSONAS[personaKey];
  if (!p) return '';
  return `
[사용자 페르소나: ${p.name}]
- 핵심 관심사: ${p.focus}
- 답변 분위기: ${p.vibe}
- 해석 시 참고 사항: ${p.desc}
이 사용자의 특성에 맞춰 해석의 우선순위와 말투를 조정해주세요.
`;
}
