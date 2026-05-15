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
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const CASES = [
  {
    id: 'love-contact',
    label: '연애 연락 결정',
    body: {
      userMessage: '썸타는 사람이 있는데 오늘 먼저 연락해도 될까?',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 1997년 8월 12일 오후 3시 20분',
        '성별: 여성',
        '사주 요약: 표현은 조심스럽지만 한번 마음이 가면 오래 보는 편.',
        '별자리 요약: 태양 사자자리, 달 물고기자리.',
        '현재 관심사: 연애, 관계, 커리어',
      ].join('\n'),
      responseStyle: 'M',
      kakaoId: 'local-test',
      clientHour: 16,
    },
  },
  {
    id: 'career-move',
    label: '커리어 결정',
    body: {
      userMessage: '지금 회사 계속 다닐지 이직 준비를 시작할지 모르겠어.',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 1992년 3월 4일 오전 9시 10분',
        '성별: 남성',
        '사주 요약: 안정감을 중요하게 보지만 답답함이 쌓이면 한 번에 결정을 내리는 편.',
        '별자리 요약: 태양 물고기자리, 달 처녀자리.',
        '현재 관심사: 직장, 돈, 건강',
      ].join('\n'),
      responseStyle: 'M',
      kakaoId: 'local-test',
      clientHour: 21,
    },
  },
  {
    id: 'food-tonight',
    label: '일상 음식',
    body: {
      userMessage: '오늘 저녁 뭐 먹으면 좋을까?',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 2001년 11월 22일 오후 6시 40분',
        '성별: 여성',
        '사주 요약: 컨디션이 떨어지면 자극적인 선택으로 기분 전환하려는 편.',
        '별자리 요약: 태양 사수자리, 달 황소자리.',
        '현재 관심사: 일상, 컨디션, 인간관계',
      ].join('\n'),
      responseStyle: 'M',
      kakaoId: 'local-test',
      clientHour: 18,
    },
  },
  {
    id: 'money-spend',
    label: '소비 결정',
    body: {
      userMessage: '이번 주에 30만원짜리 코트를 사도 괜찮을까?',
      context: [
        '[사용자 기본 정보]',
        '생년월일: 1989년 1월 18일 오전 1시 5분',
        '성별: 여성',
        '사주 요약: 필요한 물건에는 과감하지만 나중에 예산 압박을 느끼기 쉬운 편.',
        '별자리 요약: 태양 염소자리, 달 쌍둥이자리.',
        '현재 관심사: 재정, 쇼핑, 자기관리',
      ].join('\n'),
      responseStyle: 'M',
      kakaoId: 'local-test',
      clientHour: 13,
    },
  },
];

function pickCase() {
  const arg = process.argv[2] || 'love-contact';
  const found = CASES.find((item) => item.id === arg);
  if (!found) {
    console.error(`Unknown case: ${arg}`);
    console.error(`Available: ${CASES.map((item) => item.id).join(', ')}`);
    process.exit(1);
  }
  return found;
}

async function main() {
  loadEnv();
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY가 .env에 없습니다.');
  }

  const testCase = pickCase();
  const validation = validateAiRequest(testCase.body);
  if (!validation.ok) throw new Error(validation.reason);

  const { systemWithContext, maxTokens } = await buildAiRequestContext(validation.data);
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
      messages: [{ role: 'user', content: validation.data.userMessage }],
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));

  console.log(`--- ${testCase.label} (${testCase.id}) ---`);
  console.log(json.content?.[0]?.text || '');
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
