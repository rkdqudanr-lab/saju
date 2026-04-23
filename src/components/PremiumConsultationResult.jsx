import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon.jsx';

/**
 * PremiumConsultationResult — 특별 기능 전용 프리미엄 결과 오버레이
 * [점수], [한줄평], [별숨픽], [주의], [본문] 태그를 파싱하여 렌더링해요.
 */

function parsePremiumResult(text) {
  if (!text) return null;

  const scoreMatch = text.match(/\[점수\]\s*(\d+)/);
  const summaryMatch = text.match(/\[한줄평\]\s*([^\n]+)/);
  const pickMatch = text.match(/\[별숨픽\]\s*([^\n]+)/);
  const cautionMatch = text.match(/\[주의\]\s*([^\n]+)/);
  const contentMatch = text.match(/\[본문\]\s*([\s\S]+)/);

  return {
    score: scoreMatch ? parseInt(scoreMatch[1], 10) : null,
    summary: summaryMatch ? summaryMatch[1].trim() : '',
    pick: pickMatch ? pickMatch[1].trim() : '',
    caution: cautionMatch ? cautionMatch[1].trim() : '',
    content: contentMatch ? contentMatch[1].trim() : text, // 본문 태그 없으면 전체 텍스트
  };
}

export default function PremiumConsultationResult({
  text,
  type = 'special',
  onClose,
  onAction,
  actionLabel = '다른 상담 하기',
  title = '별숨의 통찰',
  icon = 'sparkles',
}) {
  const parsed = useMemo(() => parsePremiumResult(text), [text]);

  if (!parsed) return null;

  const { score, summary, pick, caution, content } = parsed;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="premium-result-overlay"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: 'linear-gradient(180deg, rgba(15,11,29,0.98) 0%, rgba(22,17,38,0.99) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflowY: 'auto',
        padding: 'env(safe-area-inset-top, 20px) 20px calc(env(safe-area-inset-bottom, 20px) + 80px)',
      }}
    >
      <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
        {/* 헤더 섹션 */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: 32, paddingTop: 40 }}>
          <div style={{ 
            fontSize: '10px', 
            color: 'var(--gold)', 
            fontWeight: 700, 
            letterSpacing: '.2em', 
            textTransform: 'uppercase', 
            marginBottom: 12,
            opacity: 0.8
          }}>
            ✦ B Y E O L S O O M &nbsp; I N S I G H T ✦
          </div>
          <h2 style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', marginBottom: 8, lineHeight: 1.2 }}>
            {title}
          </h2>
          {summary && (
            <div style={{ 
              fontSize: 'var(--sm)', 
              color: 'var(--gold)', 
              fontWeight: 600, 
              padding: '8px 16px',
              background: 'var(--goldf)',
              borderRadius: 30,
              display: 'inline-block',
              marginTop: 8,
              border: '1px solid var(--acc)'
            }}>
              "{summary}"
            </div>
          )}
        </motion.div>

        {/* 점수 & 주요 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: score ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
          {score && (
            <motion.div variants={itemVariants} style={{
              background: 'linear-gradient(135deg, rgba(232,176,72,0.12), rgba(232,176,72,0.04))',
              border: '1px solid var(--acc)',
              borderRadius: 20,
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '10px', color: 'var(--t4)', fontWeight: 700, marginBottom: 4 }}>기운의 점수</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', opacity: 0.7, marginTop: 4 }}>Stellar Score</div>
            </motion.div>
          )}

          {(pick || caution) && (
            <motion.div variants={itemVariants} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {pick && (
                <div style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(232,176,72,0.2)',
                  borderRadius: 16,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--goldf)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="sparkles" size={16} color="var(--gold)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: 800, marginBottom: 2 }}>별숨픽</div>
                    <div style={{ fontSize: '11px', color: 'var(--t2)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pick.split('-')[0].trim()}</div>
                  </div>
                </div>
              )}
              {caution && (
                <div style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(224,92,122,0.2)',
                  borderRadius: 16,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(224,92,122,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="shield-exclamation" size={16} color="var(--rose)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '10px', color: 'var(--rose)', fontWeight: 800, marginBottom: 2 }}>주의</div>
                    <div style={{ fontSize: '11px', color: 'var(--t2)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caution}</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* 상세 본문 */}
        <motion.div variants={itemVariants} style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: '28px 24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 장식용 빛 */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, var(--golda), transparent 70%)', zIndex: 0 }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 24, height: 1, background: 'var(--gold)', opacity: 0.4 }} />
              <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 800, letterSpacing: '.1em' }}>상세 별숨 풀이</div>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>
            
            <div style={{ 
              fontSize: 'var(--sm)', 
              color: 'var(--t2)', 
              lineHeight: 1.95, 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'keep-all',
              textAlign: 'justify'
            }}>
              {content}
            </div>
          </div>
        </motion.div>

        {/* 별숨픽 상세 (따로 강조) */}
        {pick && pick.includes('-') && (
          <motion.div variants={itemVariants} style={{
            background: 'linear-gradient(135deg, rgba(232,176,72,0.08), rgba(22,17,38,0.5))',
            border: '1px solid var(--acc)',
            borderRadius: 20,
            padding: '20px',
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <div style={{ fontSize: '2rem' }}>✨</div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 800, marginBottom: 4 }}>이것을 기억하세요: 별숨픽</div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 700, marginBottom: 4 }}>{pick.split('-')[0].trim()}</div>
              <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.5 }}>{pick.split('-')[1].trim()}</div>
            </div>
          </motion.div>
        )}

        {/* 하단 액션 버튼 */}
        <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={onAction || onClose}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, var(--gold), #c8953a)',
              border: 'none',
              borderRadius: 50,
              color: '#1a1208',
              fontWeight: 800,
              fontSize: 'var(--sm)',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(200,165,80,0.3)',
              letterSpacing: '.02em'
            }}
          >
            {actionLabel}
          </button>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              background: 'none',
              border: '1px solid var(--line)',
              borderRadius: 50,
              color: 'var(--t4)',
              fontWeight: 600,
              fontSize: 'var(--xs)',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </motion.div>
      </div>

      {/* 배경 장식 애니메이션 */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 }}>
        <div className="bg-orb" style={{ top: '10%', left: '10%', animationDelay: '0s' }} />
        <div className="bg-orb" style={{ bottom: '20%', right: '5%', animationDelay: '-2s' }} />
      </div>

      <style>{`
        .bg-orb {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(232,176,72,0.05), transparent 70%);
          border-radius: 50%;
          animation: orbFloat 10s ease-in-out infinite alternate;
        }
        @keyframes orbFloat {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(30px, 40px) scale(1.2); }
        }
      `}</style>
    </motion.div>
  );
}
