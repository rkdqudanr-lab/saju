import { motion, AnimatePresence } from 'framer-motion';

const OPTIONS = [
  { value: 'match', emoji: '😊', label: '비슷했어요', bp: '+2 BP' },
  { value: 'unsure', emoji: '😐', label: '모르겠어요', bp: null },
  { value: 'miss',  emoji: '😮', label: '달랐어요',   bp: null },
];

export default function ReflectionPopup({ yesterdayScore, yesterdayDate, onAnswer }) {
  const dateStr = yesterdayDate ? yesterdayDate.slice(5).replace('-', '/') : '';

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.55)',
          zIndex: 9200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 24px',
        }}
        onClick={() => onAnswer('skip')}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          style={{
            background: 'var(--bg1)',
            border: '1px solid var(--acc)',
            borderRadius: 'var(--r2)',
            padding: '24px 20px',
            maxWidth: 320,
            width: '100%',
            textAlign: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 10 }}>
            {dateStr} 어제의 별숨
          </div>

          <div style={{ fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>
            {yesterdayScore}점
          </div>
          <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.7, marginBottom: 20 }}>
            어제 운세, 실제 하루와 얼마나 맞았나요?
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {OPTIONS.map(({ value, emoji, label, bp }) => (
              <button
                key={value}
                onClick={() => onAnswer(value)}
                style={{
                  flex: 1, padding: '10px 4px',
                  background: 'var(--bg2)', border: '1px solid var(--line)',
                  borderRadius: 'var(--r1)', cursor: 'pointer',
                  fontFamily: 'var(--ff)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4,
                  transition: 'border-color .15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--acc)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600 }}>{label}</span>
                {bp && (
                  <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>{bp}</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => onAnswer('skip')}
            style={{
              background: 'none', border: 'none', color: 'var(--t4)',
              fontSize: 11, fontFamily: 'var(--ff)', cursor: 'pointer',
            }}
          >
            나중에 하기
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
