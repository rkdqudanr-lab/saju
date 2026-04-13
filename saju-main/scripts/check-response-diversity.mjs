/**
 * 별숨 AI 응답 다양성 탐지 스크립트
 *
 * 실행: node scripts/check-response-diversity.mjs
 *
 * lib/prompts/buildSystem/main.js 에서 패턴 규칙을 추출한 뒤,
 * 하드코딩된 샘플 응답 10개를 정적 분석하여 4가지 중복 패턴을
 * 탐지하고 다양성 점수(0~100)를 출력한다.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAIN_JS_PATH = resolve(__dirname, '../lib/prompts/buildSystem/main.js');

// ── 1. main.js 에서 패턴 규칙 추출 ─────────────────────────────────────────

function extractPatternsFromMainJs() {
  const src = readFileSync(MAIN_JS_PATH, 'utf-8');

  // 블랙리스트 라인 추출
  // 예: 에너지, 파동, 우주적, 진동, 기운(단독 사용), 흐름(단독 사용), 우주, 영혼, 운명적, 신비로운, 빛의 흐름, 내면의 빛
  const blacklistMatch = src.match(/━━━ 추상명사 블랙리스트[^━]+━━━\n([^\n]+)/);
  let blacklist = [];
  if (blacklistMatch) {
    blacklist = blacklistMatch[1]
      .split(',')
      .map(w => w.replace(/\(.*?\)/g, '').trim()) // "(단독 사용)" 등 괄호 제거
      .filter(Boolean);
  } else {
    // 파싱 실패 시 하드코딩 폴백
    blacklist = ['에너지', '파동', '우주적', '진동', '기운', '흐름', '우주', '영혼', '운명적', '신비로운', '빛의 흐름', '내면의 빛'];
  }

  // 오행 메타포 추출
  // 예: 목(木) → "쭉 뻗은 나무 / 봄에 돋는 새싹 / 대나무"
  const metaphorMatches = [...src.matchAll(/[목화토금수]\(.\) → "([^"]+)"/g)];
  let metaphors = [];
  if (metaphorMatches.length > 0) {
    for (const m of metaphorMatches) {
      const items = m[1].split('/').map(s => s.trim()).filter(Boolean);
      metaphors.push(...items);
    }
  } else {
    // 파싱 실패 시 하드코딩 폴백
    metaphors = [
      '쭉 뻗은 나무', '봄에 돋는 새싹', '대나무',
      '활활 타는 불꽃', '따뜻한 촛불', '한낮의 태양',
      '깊고 단단한 흙', '묵직한 산', '황토',
      '단단한 서릿발', '맑고 차가운 쇠', '빛나는 금속',
      '맑은 시냇물', '깊은 바다', '고요한 빗물',
    ];
  }

  return { blacklist, metaphors };
}

// ── 2. 샘플 응답 10개 (하드코딩, 실제 API 호출 없음) ──────────────────────

const SAMPLE_RESPONSES = [
  // #1: 오행 오프닝 ✓ | 3단 구조 ✓ | 어미 반복 ✗ | 블랙리스트 ✗
  `[요약] 지금 이 흔들림은 새 방향을 찾는 중이라는 신호예요.

🀄 맑은 시냇물처럼 어느 틈이든 흘러가는 기운을 가진 당신은, 지금처럼 막힌 느낌이 드는 시기에 오히려 더 깊이 고여요. 그 고임이 나쁜 게 아니에요. 큰 물줄기가 방향을 바꾸기 직전의 모습이에요.

✦ 물병자리의 감각은 남들보다 반 박자 늦게 오지만, 한 번 방향이 정해지면 흔들리지 않아요. 지금 느끼는 답답함이 바로 그 직전 신호예요.

동양의 별도 서양의 별도 같은 방향을 가리키고 있어요 — 지금은 멈추는 게 아니라 모이는 중이에요. 오늘 저녁 창문 열고 바람 한 번 느껴봐요.`,

  // #2: 오행 오프닝 ✓ | 3단 구조 ✓ | 어미 반복 ✓ (~이에요 3회 연속) | 블랙리스트 ✗
  `[요약] 먼저 손 내밀어도 되는 날이에요.

🀄 쭉 뻗은 나무처럼 곧게 뻗어나가는 기운이 강한 지금은, 그동안 망설이던 연락을 먼저 해볼 타이밍이에요. 당신의 진심이 닿을 수 있는 날이에요. 상대도 기다리고 있는 날이에요.

✦ 천칭자리는 균형을 본능적으로 느껴요. 지금 느끼는 설렘이 일방적이지 않다는 신호를 이미 받았을 거예요. 관계의 온도가 올라가고 있는 중이에요.

두 관점이 같은 방향을 말해요. 오늘 짧은 메시지 하나, 거창하지 않아도 돼요 🌙`,

  // #3: 오행 오프닝 ✗ | 3단 구조 ✓ | 어미 반복 ✗ | 블랙리스트 ✗
  `[요약] 지금 지쳐있는 건 의지 부족이 아니에요.

🀄 꼼꼼하게 모든 걸 챙기다 보니 오히려 전체 흐름을 놓치고 있을 수 있어요. 일간의 기질이 지금처럼 과부하 상태일 때는 덜어내는 연습이 필요해요. 할 일 목록에서 가장 덜 중요한 것 하나를 지워봐요.

✦ 처녀자리의 분석력이 완벽주의와 맞물리면 시작 자체를 못 하는 패턴이 나와요. 지금이 딱 그 상태예요.

두 별 모두 오늘은 덜어내는 타이밍이라고 말해요. 퇴근길에 평소 안 가던 골목 한 번만 걸어봐요.`,

  // #4: 오행 오프닝 ✓ | 3단 구조 ✓ | 어미 반복 ✗ | 블랙리스트 ✓ (에너지)
  `[요약] 오늘은 지키는 날이에요.

🀄 활활 타는 불꽃 같은 기질을 가진 지금은 충동적인 결정이 나오기 쉬운 시기예요. 강한 에너지가 넘치는 날일수록 큰 결정은 3일 후로 미루는 게 좋아요. 감각이 예민하게 살아있는 건 좋지만, 그 방향을 잘 잡아야 해요.

✦ 황소자리의 소유욕이 지금 자극받고 있어요. 갖고 싶다는 감각과 진짜 필요하다는 판단을 오늘만큼은 분리해서 봐요.

두 별 모두 오늘은 지키는 날이라고 말해요. 통장 잔고를 먼저 확인하는 걸로 하루를 시작해봐요.`,

  // #5: 오행 오프닝 ✓ | 3단 구조 ✓ | 어미 반복 ✗ | 블랙리스트 ✗
  `[요약] 멀어진 게 아니라 계절이 달라진 거예요.

🀄 깊고 단단한 흙처럼 안정을 추구하는 기질이 강한 지금은, 관계에서 유연성이 필요한 시기예요. 단단히 버티는 것보다 조금 구부러지는 게 오히려 관계를 지키는 방법이에요.

✦ 물고기자리의 공감력이 지금 오히려 당신을 지치게 만들고 있어요. 상대의 감정을 다 흡수하려다 자기 감정을 잃은 건 아닌지 봐요.

동양의 별도 서양의 별도, 지금은 나를 먼저 채우는 게 관계를 살리는 길이에요. 오늘은 누군가를 위하기 전에 나를 위한 한 시간을 먼저 써봐요.`,

  // #6: 오행 오프닝 ✓ | 3단 구조 ✓ | 어미 반복 ✓ (~거든요 3회 연속) | 블랙리스트 ✗
  `[요약] 몸이 먼저 알아채고 있어요.

🀄 단단한 서릿발처럼 날카로운 감각을 지닌 당신은, 에너지가 넘칠 때와 완전히 방전될 때의 격차가 커요. 지금은 방전 직전의 경고등이 켜진 시기거든요. 몸이 보내는 신호를 무시하면 안 되거든요. 회복에 집중해야 할 때거든요.

✦ 사자자리는 무너지기 전까지 괜찮은 척하는 경향이 있어요. 지금 느끼는 피로는 단순한 피곤함이 아닐 수 있어요.

두 관점 모두 지금 당신에게 필요한 건 회복이라고 말해요. 오늘 저녁은 약속을 하나 줄이고 일찍 눕는 걸 허락해봐요.`,

  // #7: 오행 오프닝 ✗ | 3단 구조 ✓ | 어미 반복 ✗ | 블랙리스트 ✗
  `[요약] 막막한 게 당연해요. 지금은 복도예요.

🀄 방향이 보일 때 움직이는 기질을 가진 사람은, 지금처럼 안 보이는 시기에 에너지를 모아요. 낭비가 아니라 준비예요. 지금 조용히 있는 것도 이미 움직이고 있는 거예요.

✦ 물병자리는 남들보다 반 박자 늦게 출발해서 훨씬 멀리 가는 패턴이 있어요. 지금의 정체감이 도약 직전의 신호일 수 있어요.

두 별이 같은 말을 하고 있어요 — 지금은 씨앗을 심는 계절이에요. 오늘 딱 한 가지, 미래의 나에게 도움이 되는 행동 하나만 해봐요.`,

  // #8: 오행 오프닝 ✓ | 3단 구조 ✓ | 어미 반복 ✗ | 블랙리스트 ✗
  `[요약] 지금 새는 돈이 있어요. 오늘 한 번 확인해봐요.

🀄 봄에 돋는 새싹처럼 새로운 기회에 민감하게 반응하는 기질이 강한 지금, 충동적인 소비로 이어지기 쉬운 시기예요. 큰 결정은 사흘 후로 미뤄봐요. 지금 느끼는 구매 충동이 진짜 필요인지 한번 확인해봐요.

✦ 황소자리의 소유욕이 자극받고 있어요. 갖고 싶다는 감각과 실제로 필요하다는 판단을 오늘만큼은 분리해서 봐요.

두 별 모두 오늘은 지키는 날이라고 말해요. 지갑보다 통장 잔고를 먼저 확인하는 걸로 하루를 시작해봐요.`,

  // #9: 오행 오프닝 ✓ | 3단 구조 ✗ (구조 없음) | 어미 반복 ✓ (~더라고요 3회 연속) | 블랙리스트 ✗
  `맑은 시냇물이 어느 틈이든 흘러가듯, 지금 당신의 감정도 그렇게 조용히 흐르고 있어요.

지금 이 관계에서 느끼는 불균형이 생각보다 오래됐더라고요. 가까워질수록 뭔가 어긋나는 느낌이 있더라고요. 상대가 무심한 게 아니라 표현 방식이 다른 거더라고요.

오늘은 그 온도 차이를 탓하기보다 그냥 인정해봐요. 잠들기 전 좋아하는 향의 바디로션 바르고 자봐요.`,

  // #10: 오행 오프닝 ✓ | 3단 구조 ✓ | 어미 반복 ✗ | 블랙리스트 ✗
  `[요약] 오늘 그 선택, 맞아요.

🀄 활활 타는 불꽃의 기질을 가진 사람은 결단이 빠른 편이에요. 지금처럼 강한 확신이 올라올 때는 그 감각을 믿어도 돼요. 단, 주변 사람에게 한 마디 먼저 꺼내보는 것도 좋아요.

✦ 양자리의 추진력이 지금 좋은 방향으로 작동하고 있어요. 두려움보다 설렘이 크다면, 그게 신호예요.

동양의 별도 서양의 별도 같은 방향을 가리키고 있어요. 오늘 딱 한 걸음만 내디뎌봐요 — 생각보다 가볍게 느껴질 거예요.`,
];

// ── 3. 탐지 함수들 ──────────────────────────────────────────────────────────

/**
 * [패턴 1] 오행 메타포 오프닝 탐지
 * [요약] 내용 또는 첫 줄에 오행 메타포 키워드가 포함되는지 확인
 */
function detectOhaengOpening(text, metaphors) {
  // [요약] 태그 다음 내용 추출 (있으면), 없으면 첫 줄
  const summaryMatch = text.match(/\[요약\]\s*(.+)/);
  const firstLine = summaryMatch
    ? summaryMatch[1].trim()
    : text.split('\n')[0].trim();

  for (const m of metaphors) {
    if (firstLine.includes(m)) {
      return { detected: true, found: m, line: firstLine };
    }
  }
  return { detected: false, found: null, line: firstLine };
}

/**
 * [패턴 2] 3단 구조 고정 탐지
 * [요약] → 🀄 → ✦ 가 이 순서로 모두 존재하는지 확인
 */
function detectFixedStructure(text) {
  const idxSummary = text.indexOf('[요약]');
  const idxSaju = text.indexOf('🀄');
  const idxZodiac = text.indexOf('✦');

  const detected =
    idxSummary !== -1 &&
    idxSaju !== -1 &&
    idxZodiac !== -1 &&
    idxSummary < idxSaju &&
    idxSaju < idxZodiac;

  return { detected };
}

/**
 * [패턴 3] 어미 반복 탐지
 * 문장을 분리해 어미(마지막 3~5자)를 추출하고 연속 3회 이상 동일 패턴 탐지
 */
function detectEndingRepetition(text) {
  // 문장 분리: 마침표/느낌표/물음표 뒤 공백 또는 줄바꿈 기준
  const sentences = text
    .split(/(?<=[.!?。])\s+|(?<=요\.)\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 4);

  // 어미 추출: 마지막 5자 이내에서 주요 어미 패턴 매칭
  const ENDING_PATTERNS = [
    /이에요$/, /예요$/, /거든요$/, /더라고요$/, /하죠$/, /이죠$/, /네요$/,
    /해요$/, /봐요$/, /돼요$/, /줘요$/, /가요$/, /나요$/, /세요$/,
  ];

  function extractEnding(sentence) {
    // 태그·이모지 제거 후 순수 텍스트
    const clean = sentence.replace(/\[.*?\]|[🀄✦🌙🌟✨💫🌊]/g, '').trim();
    for (const pat of ENDING_PATTERNS) {
      if (pat.test(clean)) return pat.source.replace(/\$$/, '');
    }
    return null;
  }

  const endings = sentences.map(s => extractEnding(s));

  // 연속 3회 이상 동일 어미 탐지
  let i = 0;
  while (i < endings.length) {
    if (endings[i] === null) { i++; continue; }
    let count = 1;
    while (i + count < endings.length && endings[i + count] === endings[i]) count++;
    if (count >= 3) {
      return {
        detected: true,
        pattern: `~${endings[i]}`,
        positions: Array.from({ length: count }, (_, k) => i + k),
      };
    }
    i++;
  }

  return { detected: false, pattern: null, positions: [] };
}

/**
 * [패턴 4] 블랙리스트 단어 누출 탐지
 */
function detectBlacklist(text, blacklist) {
  const found = blacklist.filter(word => text.includes(word));
  return { detected: found.length > 0, words: found };
}

// ── 4. 위험도 분류 ───────────────────────────────────────────────────────────

function riskLabel(count, total) {
  const ratio = count / total;
  if (ratio >= 0.7) return '⚠  위험';
  if (ratio >= 0.3) return '⚡ 주의';
  return '✓  양호';
}

// ── 5. 메인 실행 ─────────────────────────────────────────────────────────────

function main() {
  const { blacklist, metaphors } = extractPatternsFromMainJs();
  const total = SAMPLE_RESPONSES.length;

  const results = {
    ohaeng: [],
    structure: [],
    ending: [],
    blacklist: [],
  };

  for (let i = 0; i < total; i++) {
    const text = SAMPLE_RESPONSES[i];
    results.ohaeng.push({ idx: i + 1, ...detectOhaengOpening(text, metaphors) });
    results.structure.push({ idx: i + 1, ...detectFixedStructure(text) });
    results.ending.push({ idx: i + 1, ...detectEndingRepetition(text) });
    results.blacklist.push({ idx: i + 1, ...detectBlacklist(text, blacklist) });
  }

  const counts = {
    ohaeng: results.ohaeng.filter(r => r.detected).length,
    structure: results.structure.filter(r => r.detected).length,
    ending: results.ending.filter(r => r.detected).length,
    blacklist: results.blacklist.filter(r => r.detected).length,
  };

  // 점수 계산
  const penalty =
    (counts.ohaeng / total) * 30 +
    (counts.structure / total) * 30 +
    (counts.ending / total) * 25 +
    (counts.blacklist / total) * 15;
  const score = Math.max(0, Math.round(100 - penalty));

  // ── 출력 ──
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('    별숨 AI 응답 다양성 분석 리포트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // [패턴 1] 오행 메타포 오프닝
  console.log('[오행 메타포 오프닝]');
  console.log(`  탐지 기준: main.js 오행 번역 메타포(${metaphors.length}개) 중 하나가 첫 문장에 등장`);
  for (const r of results.ohaeng) {
    if (r.detected) {
      console.log(`  #${r.idx}: "${r.found}" 탐지 → "${r.line.slice(0, 40)}..."`);
    }
  }
  console.log(`  → ${counts.ohaeng}/${total} 응답에서 탐지  ${riskLabel(counts.ohaeng, total)}\n`);

  // [패턴 2] 3단 구조 고정
  console.log('[3단 구조 고정]');
  console.log('  탐지 기준: [요약] → 🀄 → ✦ 순서로 모두 존재');
  const structureViolators = results.structure.filter(r => r.detected).map(r => `#${r.idx}`);
  if (structureViolators.length > 0) {
    console.log(`  해당 응답: ${structureViolators.join(', ')}`);
  }
  console.log(`  → ${counts.structure}/${total} 응답에서 탐지  ${riskLabel(counts.structure, total)}\n`);

  // [패턴 3] 어미 반복
  console.log('[어미 반복]');
  console.log('  탐지 기준: 동일 어미가 연속 3회 이상 등장');
  for (const r of results.ending) {
    if (r.detected) {
      console.log(`  #${r.idx}: "${r.pattern}" 연속 ${r.positions.length}회 탐지 (문장 위치: ${r.positions.map(p => p + 1).join(', ')})`);
    }
  }
  console.log(`  → ${counts.ending}/${total} 응답에서 탐지  ${riskLabel(counts.ending, total)}\n`);

  // [패턴 4] 블랙리스트 누출
  console.log('[블랙리스트 누출]');
  console.log(`  탐지 기준: main.js 추상명사 블랙리스트(${blacklist.length}개) 단어 포함`);
  for (const r of results.blacklist) {
    if (r.detected) {
      console.log(`  #${r.idx}: "${r.words.join('", "')}" 탐지`);
    }
  }
  console.log(`  → ${counts.blacklist}/${total} 응답에서 탐지  ${riskLabel(counts.blacklist, total)}\n`);

  // 종합 점수
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  종합 다양성 점수: ${score}/100`);
  console.log(`  (가중치: 오행오프닝×30 + 구조고정×30 + 어미반복×25 + 블랙리스트×15)`);

  let grade;
  if (score >= 80) grade = '양호 — 다양성이 충분히 확보되어 있어요.';
  else if (score >= 60) grade = '보통 — 일부 패턴 개선이 필요해요.';
  else if (score >= 40) grade = '주의 — 구조/오프닝 다양화가 필요해요.';
  else grade = '위험 — 프롬프트 개선이 시급해요.';

  console.log(`  진단: ${grade}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('  개선 제안: scripts/diversity-fix-suggestions.md 참고\n');
}

main();
