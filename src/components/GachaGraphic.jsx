import React from 'react';

// 속성에 따른 기본 테마 색상 (fallback)
const ASPECT_COLORS = {
  overall: '#FFFFFF', // 흰빛
  wealth:  '#FFD700', // 골드
  love:    '#FF69B4', // 핑크
  career:  '#9370DB', // 보라
  study:   '#1E90FF', // 파랑
  health:  '#32CD32', // 초록
  social:  '#FFA500', // 주황
  travel:  '#00CED1', // 시안
};

// 등급별 코어 도형 크기
const GRADE_SIZES = {
  satellite: 0.5,
  planet: 0.7,
  galaxy: 0.85,
  nebula: 1.0,
  ohaeng: 0.5,
  cheongan: 0.7,
  jiji: 0.85,
  gapja: 1.0,
};

function GachaGraphic({ item, size = 80 }) {
  if (!item) return null;

  // 파싱 및 상태 추출
  const affixId = item.id.includes('::') ? item.id.split('::')[1] : 'normal';
  const grade = item.grade || 'satellite';
  const themeColor = item.affixColor || ASPECT_COLORS[item.aspectKey] || '#FFFFFF';
  
  // 크기 배율
  const sizeMultiplier = GRADE_SIZES[grade] || 0.6;
  const emojiSize = size * 0.45 * sizeMultiplier;
  
  // 회전 중심
  const cx = size / 2;
  const cy = size / 2;

  // Affix 기반 내부 필터
  let coreFilter = '';
  if (affixId === 'ancient') coreFilter = 'grayscale(100%) contrast(150%) brightness(0.8)';
  if (affixId === 'resonating') coreFilter = 'saturate(200%) drop-shadow(0 0 8px rgba(255,200,0,0.8))';
  
  // 랜덤 시드 (애니메이션 엇갈림 방지 방지용)
  const seed = (item.id.charCodeAt(0) + item.id.length) % 10;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`glow-${item.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={themeColor} stopOpacity="0.4" />
            <stop offset="60%" stopColor={themeColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
          </radialGradient>
          
          <filter id={`blur-${item.id}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 1. Backdrop Glow (Aura) */}
        <circle cx={cx} cy={cy} r={size * 0.45} fill={`url(#glow-${item.id})`} />

        {/* 2. Grade-specific Geometry Layer */}
        {['galaxy', 'jiji'].includes(grade) && (
          <g style={{ animation: `orbSpin ${8 + seed}s linear infinite`, transformOrigin: 'center' }}>
            <circle cx={cx} cy={cy} r={size * 0.4} fill="none" stroke={themeColor} strokeWidth="1" strokeDasharray="4 8" opacity="0.6"/>
            <circle cx={cx} cy={cy} r={size * 0.3} fill="none" stroke={themeColor} strokeWidth="0.5" strokeDasharray="2 12" opacity="0.4"/>
          </g>
        )}
        
        {['planet', 'cheongan'].includes(grade) && (
          <g style={{ animation: 'floatGently 4s ease-in-out infinite' }}>
            <ellipse cx={cx} cy={cy} rx={size * 0.35} ry={size * 0.15} fill="none" stroke={themeColor} strokeWidth="1.5" opacity="0.6" transform={`rotate(15, ${cx}, ${cy})`} />
          </g>
        )}

        {['nebula', 'gapja'].includes(grade) && (
          <g style={{ animation: `pulseSlow ${4 + seed}s ease-in-out infinite`, transformOrigin: 'center' }}>
            <path d={`M ${cx} ${cy - size*0.4} Q ${cx + size*0.4} ${cy} ${cx} ${cy + size*0.4} Q ${cx - size*0.4} ${cy} ${cx} ${cy - size*0.4} Z`} fill={themeColor} opacity="0.15" />
            <circle cx={cx} cy={cy} r={size * 0.38} fill="none" stroke={themeColor} strokeWidth="1.5" strokeDasharray="1 6" opacity="0.8"/>
            {/* 추가 광원 */}
            <circle cx={cx} cy={cy} r={size * 0.25} fill={`url(#glow-${item.id})`} opacity="0.5"/>
          </g>
        )}

        {/* 3. Affix Particles */}
        {affixId === 'shining' && (
          <g style={{ animation: 'orbSpin 6s linear infinite', transformOrigin: 'center' }}>
            {[0, 90, 180, 270].map(deg => {
               const r = size * 0.38;
               const px = cx + r * Math.cos(deg * Math.PI / 180);
               const py = cy + r * Math.sin(deg * Math.PI / 180);
               return (
                 <path key={deg} d={`M ${px} ${py-4} L ${px+1} ${py-1} L ${px+4} ${py} L ${px+1} ${py+1} L ${px} ${py+4} L ${px-1} ${py+1} L ${px-4} ${py} L ${px-1} ${py-1} Z`} fill="#FFF" filter={`url(#blur-${item.id})`} />
               )
            })}
          </g>
        )}

        {affixId === 'ancient' && (
          <circle cx={cx} cy={cy} r={size * 0.42} fill="none" stroke="#666" strokeWidth="2" strokeDasharray="10 4 2 4" opacity="0.7"/>
        )}

        {/* 4. Core Emoji Text */}
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          dominantBaseline="central" 
          fontSize={emojiSize}
          style={{
            filter: coreFilter,
            animation: affixId === 'resonating' ? 'pulseSlow 2.5s ease-in-out infinite' : 'none'
          }}
        >
          {item.emoji || '❓'}
        </text>

        {affixId === 'resonating' && (
          <circle 
            cx={cx} cy={cy} r={size * 0.3} 
            fill="none" stroke={themeColor} strokeWidth="2" 
            style={{ animation: 'rippleOut 2s ease-out infinite' }} 
          />
        )}
      </svg>
      {/* 
        global CSS에 추가할 커스텀 애니메이션:
        @keyframes rippleOut { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
      */}
    </div>
  );
}

export default GachaGraphic;
