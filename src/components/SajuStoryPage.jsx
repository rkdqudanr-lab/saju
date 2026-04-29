/**
 * SajuStoryPage — 사주 스토리 (step 42)
 * 사용자의 사주를 주인공으로 한 단편 서사를 챕터별로 순차 생성합니다.
 * 각 챕터는 별도 Haiku 호출로 생성되며, 이전 챕터 요약이 다음 챕터 컨텍스트로 전달됩니다.
 */

import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { STEP } from '../utils/steps.js';

const CHAPTERS = [
  { id: 'childhood', title: '유년기',       icon: '🌱', desc: '씨앗이 처음 땅에 닿던 시절' },
  { id: 'youth',     title: '청년기',       icon: '🌿', desc: '뿌리를 내리고 자라던 계절' },
  { id: 'present',   title: '현재',         icon: '🌳', desc: '온전히 피어난 지금 이 순간' },
  { id: 'future',    title: '미래',         icon: '🌟', desc: '아직 쓰이지 않은 별의 이야기' },
  { id: 'destiny',   title: '운명의 교차점', icon: '✦',  desc: '모든 별이 하나로 만나는 곳' },
];

function buildChapterPrompt(chapter, index, prevSummary) {
  const parts = [
    `[챕터 ${index + 1} — ${chapter.title}]`,
    `주제: ${chapter.desc}`,
  ];
  if (prevSummary) {
    parts.push(`\n[이전 챕터 흐름]\n${prevSummary}`);
  }
  parts.push(`\n위 사주·별자리 맥락과 흐름을 바탕으로, "${chapter.title}" 챕터를 써주세요.`);
  return parts.join('\n');
}

function extractSummary(text) {
  // 첫 문단(최대 120자)을 다음 챕터 컨텍스트로 사용
  return text.split('\n').filter(Boolean)[0]?.slice(0, 120) || text.slice(0, 120);
}

function ChapterCard({ chapter, index, content, isGenerating }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg1) 82%, white 18%) 0%, var(--bg1) 100%)',
        border: '1px solid color-mix(in srgb, var(--line) 55%, var(--gold) 18%)',
        borderRadius: 20,
        overflow: 'hidden',
        animation: content ? 'fadeUp .4s ease' : 'none',
      }}
    >
      {/* 챕터 헤더 */}
      <div
        style={{
          padding: '14px 18px 12px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'var(--goldf)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {chapter.icon}
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '.08em' }}>
            CHAPTER {index + 1}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--t1)', lineHeight: 1.3 }}>
            {chapter.title}
          </div>
        </div>
      </div>

      {/* 챕터 본문 */}
      <div style={{ padding: '16px 18px 18px' }}>
        {isGenerating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="land-orb" style={{ width: 22, height: 22, flexShrink: 0 }}>
              <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 600 }}>
              {chapter.title} 이야기를 쓰고 있어요...
            </span>
          </div>
        ) : content ? (
          <div
            style={{
              fontSize: '14px',
              lineHeight: 1.9,
              color: 'var(--t2)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {content}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--t4)', fontStyle: 'italic' }}>
            {chapter.desc}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SajuStoryPage({ callApi, showToast }) {
  const setStep = useAppStore((s) => s.setStep);
  const [chapters, setChapters] = useState(Array(CHAPTERS.length).fill(null));
  const [generatingIdx, setGeneratingIdx] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(false);
  const abortRef = useRef(false);

  const generate = useCallback(async () => {
    if (isRunning) return;
    abortRef.current = false;
    setIsRunning(true);
    setDone(false);
    setChapters(Array(CHAPTERS.length).fill(null));

    let prevSummary = '';

    for (let i = 0; i < CHAPTERS.length; i++) {
      if (abortRef.current) break;
      setGeneratingIdx(i);

      try {
        const prompt = buildChapterPrompt(CHAPTERS[i], i, prevSummary);
        const text = await callApi(prompt, { isSajuChapter: true });

        if (abortRef.current) break;

        setChapters((prev) => {
          const next = [...prev];
          next[i] = text;
          return next;
        });
        prevSummary = extractSummary(text);
      } catch (err) {
        if (err?.message === 'SESSION_EXPIRED' || err?.message === 'LOGIN_REQUIRED') break;
        if (showToast) showToast('챕터 생성 중 오류가 발생했어요. 다시 시도해주세요.', 'warn');
        setGeneratingIdx(-1);
        setIsRunning(false);
        return;
      }
    }

    setGeneratingIdx(-1);
    setIsRunning(false);
    if (!abortRef.current) setDone(true);
  }, [callApi, isRunning, showToast]);

  const handleStop = () => {
    abortRef.current = true;
  };

  const allGenerated = chapters.every(Boolean);

  return (
    <div className="page step-fade" style={{ padding: '22px 16px 36px', justifyContent: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* 헤더 */}
        <div
          style={{
            background: 'radial-gradient(circle at top right, rgba(176,120,32,0.12) 0%, transparent 40%), linear-gradient(180deg, color-mix(in srgb, var(--bg1) 86%, white 14%) 0%, var(--bg1) 100%)',
            border: '1px solid color-mix(in srgb, var(--line) 55%, var(--gold) 18%)',
            borderRadius: 20,
            padding: '22px 18px',
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold)', letterSpacing: '.08em', marginBottom: 6 }}>
            BYEOLSOOM STORY
          </div>
          <div style={{ fontSize: 'var(--xl)', lineHeight: 1.2, fontWeight: 900, color: 'var(--t1)', marginBottom: 10 }}>
            나의 별숨 이야기
          </div>
          <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--t3)' }}>
            사주와 별자리를 바탕으로, 나만의 서사를 {CHAPTERS.length}개의 챕터로 풀어드려요.
            각 챕터는 이전 이야기를 이어받아 하나의 흐름으로 완성됩니다.
          </div>

          {/* 챕터 목록 미리보기 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {CHAPTERS.map((ch, i) => (
              <div
                key={ch.id}
                style={{
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: chapters[i]
                    ? 'var(--goldf)'
                    : generatingIdx === i
                    ? 'rgba(176,120,32,0.1)'
                    : 'var(--bg3)',
                  border: chapters[i]
                    ? '1px solid rgba(176,120,32,0.3)'
                    : generatingIdx === i
                    ? '1px solid rgba(176,120,32,0.2)'
                    : '1px solid var(--line)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: chapters[i] ? 'var(--gold)' : generatingIdx === i ? 'var(--gold)' : 'var(--t4)',
                }}
              >
                {ch.icon} {ch.title}
                {chapters[i] ? ' ✓' : ''}
              </div>
            ))}
          </div>
        </div>

        {/* 생성 버튼 */}
        {!isRunning && !allGenerated && (
          <button
            onClick={generate}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 18,
              border: '1px solid rgba(176,120,32,0.25)',
              background: 'linear-gradient(135deg, var(--goldf), color-mix(in srgb, var(--bg1) 85%, var(--gold) 15%))',
              color: 'var(--gold)',
              fontSize: '14px',
              fontWeight: 900,
              fontFamily: 'var(--ff)',
              cursor: 'pointer',
              marginBottom: 16,
              boxShadow: '0 10px 24px rgba(176,120,32,0.1)',
            }}
          >
            ✦ 이야기 생성하기
          </button>
        )}

        {isRunning && !allGenerated && (
          <button
            onClick={handleStop}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 18,
              border: '1px solid var(--line)',
              background: 'var(--bg2)',
              color: 'var(--t3)',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--ff)',
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            생성 중단
          </button>
        )}

        {/* 다시 생성 버튼 (완료 후) */}
        {allGenerated && done && (
          <button
            onClick={generate}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 18,
              border: '1px solid var(--line)',
              background: 'var(--bg2)',
              color: 'var(--t3)',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--ff)',
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            다시 생성하기
          </button>
        )}

        {/* 챕터 카드들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CHAPTERS.map((chapter, i) => {
            const hasContent = Boolean(chapters[i]);
            const isGenerating = generatingIdx === i;
            if (!hasContent && !isGenerating) return null;
            return (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                index={i}
                content={chapters[i]}
                isGenerating={isGenerating}
              />
            );
          })}
        </div>

        {/* 완료 메시지 */}
        {done && allGenerated && (
          <div
            style={{
              marginTop: 20,
              padding: '18px',
              borderRadius: 18,
              background: 'var(--goldf)',
              border: '1px solid rgba(176,120,32,0.2)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>✦</div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--gold)', marginBottom: 6 }}>
              이야기가 완성됐어요
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.7, color: 'var(--t3)' }}>
              이것은 당신의 별이 써내려간 이야기예요. 언제든 다시 읽을 수 있어요.
            </div>
          </div>
        )}

        {/* 뒤로 가기 */}
        <button
          onClick={() => setStep(STEP.HOME)}
          style={{
            marginTop: 24,
            width: '100%',
            padding: '13px',
            borderRadius: 18,
            border: '1px solid var(--line)',
            background: 'transparent',
            color: 'var(--t4)',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'var(--ff)',
            cursor: 'pointer',
          }}
        >
          홈으로 돌아가기
        </button>

      </div>
    </div>
  );
}
