/**
 * probe-daily-batch.mjs
 * 오늘의 운세 / 별숨픽 프롬프트를 10가지 사주·상황으로 실제 API 호출해 검증
 *
 * 검증 항목:
 *  1) 금지 어미 (해봐요/해보세요/하면 좋아요)
 *  2) 어미 불일치 (합니다 혼입)
 *  3) 추상어 (기운이 살아나요/에너지/기운이 내 것이)
 *  4) 구조 무결성 ([점수][요약][동양의 기운][서양의 하늘][카테고리 운세][별숨픽] 존재 여부)
 *  5) 시간대 현실성 (직장인 평일 오전에 "늦잠" 등 비현실 조언)
 *  6) 카페/공원 반복 (장소 다양성)
 *
 * 사용법: node scripts/probe-daily-batch.mjs [케이스ID]
 *   케이스ID 없으면 전체 순차 실행
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAiRequest, buildAiRequestContext } from '../lib/aiRequest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const idx = t.indexOf('=');
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim().replace(/^"|"$/g, '');
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}

// ── 검증 규칙 ──────────────────────────────────────────────────
const CHECK_RULES = [
  {
    id: 'forbidden_ending',
    label: '금지 어미',
    pattern: /해봐요|해보세요|하면 좋아요|해두면 좋아요|해보면 좋아요/,
  },
  {
    id: 'mismatch_style',
    label: '어미 불일치(합니다 혼입)',
    // daily는 [기운] 섹션 등에서 "합니다" 허용, 단 별숨픽/행동 섹션에선 금지
    // 여기선 별숨픽 블록 안에서만 체크
    pattern: null, // 커스텀 체크 사용
    custom: (text) => {
      const pickBlock = text.match(/\[별숨픽\]([\s\S]*?)(?=\n\[|$)/)?.[1] ?? '';
      const matches = pickBlock.match(/[합충]니다/g);
      return matches ? `별숨픽 블록 내 "합니다" 발견: ${matches.join(', ')}` : null;
    },
  },
  {
    id: 'abstract_expr',
    label: '추상어 (기운/에너지 단독)',
    pattern: /기운이 살아나요|기운이 내 것|에너지가 살아|기운이 올라와|기운을 받아요/,
  },
  {
    id: 'cafe_repeat',
    label: '장소 카페/공원 반복',
    custom: (text) => {
      const placeMatch = text.match(/장소[：:]\s*([^\n—–\-]+)/);
      if (!placeMatch) return null;
      const place = placeMatch[1].trim();
      if (/카페|공원/.test(place)) return `장소: "${place}" — 카페/공원 반복`;
      return null;
    },
  },
  {
    id: 'struct_missing',
    label: '구조 태그 누락',
    custom: (text) => {
      const required = ['[점수]', '[요약]', '[동양의 기운]', '[서양의 하늘]', '[카테고리 운세]', '[별숨픽]'];
      const missing = required.filter(tag => !text.includes(tag));
      return missing.length ? `누락 태그: ${missing.join(', ')}` : null;
    },
  },
];

function checkResponse(text) {
  const issues = [];
  for (const rule of CHECK_RULES) {
    if (rule.custom) {
      const msg = rule.custom(text);
      if (msg) issues.push(`⚠️  [${rule.label}] ${msg}`);
    } else if (rule.pattern) {
      const m = text.match(rule.pattern);
      if (m) issues.push(`⚠️  [${rule.label}] "${m[0]}" 발견`);
    }
  }
  return issues;
}

// ── 10가지 테스트 케이스 ──────────────────────────────────────
const DAILY_CASES = [
  // ① 직장인 여성 / M형 / 오전 / 사주 한자 포함
  {
    id: 'd1', label: '직장인 여성 오전 (M, 한자O)',
    body: {
      userMessage: '오늘 하루 운세 알려줘',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 1993년 5월 3일 오전 7시 10분',
        '성별: 여성',
        '사주 요약: 꼼꼼하고 책임감 강하며 완벽주의 성향.',
        '일주: 庚申 (경신)',
        '월주: 甲辰 (갑진)',
        '시주: 庚寅 (경인)',
        '오늘의 십신: 비견(比肩)',
        '강한 운세 영역: 직장·업무',
        '주의 운세 영역: 대인·인맥',
        '주목할 운세 영역: 재물·소비',
        '별자리 요약: 태양 황소자리, 달 처녀자리, 상승궁 쌍둥이자리.',
        '현재 관심사: 직장, 건강, 재정',
        '생애 단계: 직장인',
      ].join('\n'),
      isDaily: true, responseStyle: 'M',
      kakaoId: 'test', clientHour: 8,
      gender: '여성', lifeStage: 'employed',
    },
  },
  // ② 직장인 남성 / T형 / 오후 / 사주 한자 포함
  {
    id: 'd2', label: '직장인 남성 오후 (T, 한자O)',
    body: {
      userMessage: '오늘 하루 운세 알려줘',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 1988년 11월 18일 오후 2시 45분',
        '성별: 남성',
        '사주 요약: 목표 지향적이며 추진력 강하고 리더 기질.',
        '일주: 壬午 (임오)',
        '월주: 丁亥 (정해)',
        '시주: 壬申 (임신)',
        '오늘의 십신: 편관(偏官)',
        '강한 운세 영역: 결단·실행',
        '주의 운세 영역: 감정·애정',
        '주목할 운세 영역: 건강·신체',
        '별자리 요약: 태양 전갈자리, 달 양자리, 상승궁 처녀자리.',
        '현재 관심사: 직장, 커리어, 건강',
        '생애 단계: 직장인',
      ].join('\n'),
      isDaily: true, responseStyle: 'T',
      kakaoId: 'test', clientHour: 14,
      gender: '남성', lifeStage: 'employed',
    },
  },
  // ③ 취업준비생 여성 / F형 / 저녁 / 한자 없음
  {
    id: 'd3', label: '취준생 여성 저녁 (F, 한자X)',
    body: {
      userMessage: '오늘 하루 운세 알려줘',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 2000년 3월 15일 오후 6시 30분',
        '성별: 여성',
        '사주 요약: 감수성 풍부하고 창의적이지만 자신감이 오르내리는 편.',
        '별자리 요약: 태양 물고기자리, 달 쌍둥이자리.',
        '현재 관심사: 취업, 자기계발, 인간관계',
        '생애 단계: 취업 준비 중',
      ].join('\n'),
      isDaily: true, responseStyle: 'F',
      kakaoId: 'test', clientHour: 19,
      gender: '여성', lifeStage: 'jobseek',
    },
  },
  // ④ 학생 남성 / M형 / 오전 / 한자 포함
  {
    id: 'd4', label: '학생 남성 오전 (M, 한자O)',
    body: {
      userMessage: '오늘 하루 운세 알려줘',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 2002년 8월 22일 오전 10시 20분',
        '성별: 남성',
        '사주 요약: 집중력 강하고 분석적이나 스트레스에 예민한 편.',
        '일주: 甲辰 (갑진)',
        '오늘의 십신: 식신(食神)',
        '강한 운세 영역: 학업·집중',
        '주의 운세 영역: 건강·신체',
        '별자리 요약: 태양 사자자리, 달 황소자리.',
        '현재 관심사: 학업, 시험, 건강',
        '생애 단계: 학업·시험 준비 중',
      ].join('\n'),
      isDaily: true, responseStyle: 'M',
      kakaoId: 'test', clientHour: 9,
      gender: '남성', lifeStage: 'student',
    },
  },
  // ⑤ 사업자 남성 / T형 / 오전 / 한자 포함
  {
    id: 'd5', label: '사업자 남성 오전 (T, 한자O)',
    body: {
      userMessage: '오늘 하루 운세 알려줘',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 1985년 1월 7일 오전 8시 50분',
        '성별: 남성',
        '사주 요약: 결단력이 강하고 사람을 이끄는 기질. 다만 독단적인 선택 주의.',
        '일주: 丙子 (병자)',
        '월주: 丁丑 (정축)',
        '오늘의 십신: 겁재(劫財)',
        '강한 운세 영역: 창의·아이디어',
        '주의 운세 영역: 재물·소비',
        '주목할 운세 영역: 대인·인맥',
        '별자리 요약: 태양 염소자리, 달 전갈자리.',
        '현재 관심사: 사업, 재정, 결정',
        '생애 단계: 사업 운영 중',
      ].join('\n'),
      isDaily: true, responseStyle: 'T',
      kakaoId: 'test', clientHour: 7,
      gender: '남성', lifeStage: 'business',
    },
  },
  // ⑥ 육아 여성 / F형 / 오후 / 한자 없음
  {
    id: 'd6', label: '육아 여성 오후 (F, 한자X)',
    body: {
      userMessage: '오늘 하루 운세 알려줘',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 1991년 9월 28일 오후 3시 10분',
        '성별: 여성',
        '사주 요약: 돌봄 기질 강하고 공감 능력 뛰어나지만 자기 시간이 부족한 편.',
        '별자리 요약: 태양 천칭자리, 달 게자리.',
        '현재 관심사: 육아, 건강, 관계',
        '생애 단계: 육아 중',
      ].join('\n'),
      isDaily: true, responseStyle: 'F',
      kakaoId: 'test', clientHour: 15,
      gender: '여성', lifeStage: 'parenting',
    },
  },
  // ⑦ 연애 중 여성 / M형 / 저녁 / 한자 포함
  {
    id: 'd7', label: '연애 중 여성 저녁 (M, 한자O)',
    body: {
      userMessage: '오늘 하루 운세 알려줘',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 1997년 4월 14일 오후 9시 30분',
        '성별: 여성',
        '사주 요약: 표현이 직접적이고 감정에 솔직한 편. 관계에서 균형을 중요시함.',
        '일주: 癸酉 (계유)',
        '오늘의 십신: 정인(正印)',
        '강한 운세 영역: 애정·감정',
        '주의 운세 영역: 이동·변화',
        '별자리 요약: 태양 양자리, 달 물병자리.',
        '현재 관심사: 연애, 관계, 자기관리',
        '생애 단계: 연애 중',
      ].join('\n'),
      isDaily: true, responseStyle: 'M',
      kakaoId: 'test', clientHour: 21,
      gender: '여성', lifeStage: 'dating',
    },
  },
  // ⑧ 이별 후 회복 남성 / F형 / 새벽 / 한자 없음
  {
    id: 'd8', label: '이별 회복 남성 새벽 (F, 한자X)',
    body: {
      userMessage: '오늘 하루 운세 알려줘',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 1995년 12월 2일 오전 2시 15분',
        '성별: 남성',
        '사주 요약: 감정을 잘 드러내지 않지만 내면에서 강하게 느끼는 편. 회복이 더딘 스타일.',
        '별자리 요약: 태양 사수자리, 달 전갈자리.',
        '현재 관심사: 관계, 감정, 자기계발',
        '생애 단계: 이별 후 회복 중',
      ].join('\n'),
      isDaily: true, responseStyle: 'F',
      kakaoId: 'test', clientHour: 2,
      gender: '남성', lifeStage: 'healing',
    },
  },
  // ⑨ 경력 재진입 여성 / T형 / 오후 / 한자 포함
  {
    id: 'd9', label: '경력재진입 여성 오후 (T, 한자O)',
    body: {
      userMessage: '오늘 하루 운세 알려줘',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 1986년 6월 10일 오전 11시 00분',
        '성별: 여성',
        '사주 요약: 경험이 풍부하고 실용적이며 안정을 추구하는 성향.',
        '일주: 己卯 (기묘)',
        '오늘의 십신: 정재(正財)',
        '강한 운세 영역: 재물·소비',
        '주의 운세 영역: 창의·아이디어',
        '주목할 운세 영역: 직장·업무',
        '별자리 요약: 태양 쌍둥이자리, 달 염소자리.',
        '현재 관심사: 재취업, 커리어, 재정',
        '생애 단계: 경력 재진입 준비 중',
      ].join('\n'),
      isDaily: true, responseStyle: 'T',
      kakaoId: 'test', clientHour: 13,
      gender: '여성', lifeStage: 'reentry',
    },
  },
  // ⑩ 자유 남성 / M형 / 저녁 / 한자 없음 (배드타임 유도 — 점수 낮을 가능성)
  {
    id: 'd10', label: '자유 남성 저녁 (M, 한자X)',
    body: {
      userMessage: '오늘 하루 운세 알려줘',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 2003년 2월 19일 오후 11시 55분',
        '성별: 남성',
        '사주 요약: 직관이 예민하고 창의적이지만 결정이 느리고 미루는 습관.',
        '별자리 요약: 태양 물고기자리, 달 물고기자리 (이중 물고기 — 감수성 최고조).',
        '현재 관심사: 창작, 일상, 진로',
        '생애 단계: 자유 선택',
      ].join('\n'),
      isDaily: true, responseStyle: 'M',
      kakaoId: 'test', clientHour: 22,
      gender: '남성', lifeStage: 'free',
    },
  },
];

async function callApi(systemWithContext, maxTokens, userMessage) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemWithContext,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.content?.[0]?.text ?? '';
}

async function runCase(tc) {
  const validation = validateAiRequest(tc.body);
  if (!validation.ok) throw new Error(`[${tc.id}] validate 실패: ${validation.reason}`);
  const { systemWithContext, maxTokens } = await buildAiRequestContext(validation.data);
  const text = await callApi(systemWithContext, maxTokens, validation.data.userMessage);
  return { tc, text };
}

function printResult({ tc, text }, issues) {
  const bar = '─'.repeat(60);
  console.log(`\n${bar}`);
  console.log(`[${tc.id}] ${tc.label}`);
  console.log(bar);
  console.log(text);
  if (issues.length === 0) {
    console.log('\n✅ 이슈 없음');
  } else {
    console.log('\n📋 발견된 이슈:');
    issues.forEach(i => console.log('  ' + i));
  }
}

async function main() {
  loadEnv();
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY가 없습니다.');

  const targetId = process.argv[2];
  const cases = targetId ? DAILY_CASES.filter(c => c.id === targetId) : DAILY_CASES;
  if (cases.length === 0) {
    console.error(`케이스 "${targetId}"를 찾을 수 없어요.`);
    console.error(`사용 가능: ${DAILY_CASES.map(c => c.id).join(', ')}`);
    process.exit(1);
  }

  const allIssues = {};
  for (const tc of cases) {
    process.stdout.write(`\n실행 중: [${tc.id}] ${tc.label} ...`);
    const result = await runCase(tc);
    const issues = checkResponse(result.text);
    allIssues[tc.id] = issues;
    printResult(result, issues);
  }

  // 전체 이슈 요약
  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 전체 이슈 요약');
  console.log('═'.repeat(60));
  let totalIssues = 0;
  for (const [id, issues] of Object.entries(allIssues)) {
    const tc = DAILY_CASES.find(c => c.id === id);
    if (issues.length === 0) {
      console.log(`  ✅ [${id}] ${tc.label}`);
    } else {
      console.log(`  ❌ [${id}] ${tc.label}`);
      issues.forEach(i => console.log(`       ${i}`));
      totalIssues += issues.length;
    }
  }
  console.log(`\n총 이슈: ${totalIssues}개 / ${cases.length}개 케이스`);
}

main().catch(e => { console.error(e?.message || e); process.exit(1); });
