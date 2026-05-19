// 비로그인 히어로 SVG — 황도12궁 + 십간 이중 회전 컴퍼스
const CX = 100, CY = 100;
const ZODIAC = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const STEMS  = ['甲','乙','丙','丁'];
const OUTER_R = 83;
const INNER_R = 55;

export default function CosmicCompass() {
  return (
    <div style={{ animation: 'fadeUp .8s .2s both', margin: '0 auto var(--sp2)' }}>
      <svg width="210" height="210" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <filter id="cc-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="cc-orb" cx="35%" cy="28%" r="70%">
            <stop offset="0%"   stopColor="rgba(232,176,72,.85)"/>
            <stop offset="45%"  stopColor="rgba(190,110,170,.55)"/>
            <stop offset="100%" stopColor="rgba(40,20,80,.9)"/>
          </radialGradient>
        </defs>

        {/* 가이드 링 */}
        <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="rgba(232,176,72,.08)" strokeWidth="1"/>
        <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke="rgba(200,160,255,.07)" strokeWidth="1" strokeDasharray="3 5"/>
        <circle cx={CX} cy={CY} r={31}      fill="none" stroke="rgba(232,176,72,.14)" strokeWidth="1"/>

        {/* 바깥 링: 12궁 기호 — 72s CW */}
        <g>
          {ZODIAC.map((z, i) => {
            const a = (i * 30 - 90) * Math.PI / 180;
            return (
              <text key={i}
                x={CX + OUTER_R * Math.cos(a)}
                y={CY + OUTER_R * Math.sin(a)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fill="rgba(232,176,72,.58)" fontFamily="serif"
              >{z}</text>
            );
          })}
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`}
            dur="72s" repeatCount="indefinite"/>
        </g>

        {/* 안쪽 링: 십간 4자 — 40s CCW */}
        <g>
          {STEMS.map((s, i) => {
            const a = (i * 90 - 45) * Math.PI / 180;
            return (
              <text key={i}
                x={CX + INNER_R * Math.cos(a)}
                y={CY + INNER_R * Math.sin(a)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fill="rgba(200,160,255,.55)" fontFamily="serif"
              >{s}</text>
            );
          })}
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${CX} ${CY}`} to={`-360 ${CX} ${CY}`}
            dur="40s" repeatCount="indefinite"/>
        </g>

        {/* 궤도 도트 3개 — 120° 간격, 10s */}
        {[0, 1, 2].map(i => (
          <g key={i}>
            <circle cx={CX + 69} cy={CY} r={i === 1 ? 2.6 : 1.9}
              fill={i === 1 ? '#E8B048' : 'rgba(232,176,72,.62)'}
              filter={i === 1 ? 'url(#cc-glow)' : undefined}
            />
            <animateTransform attributeName="transform" type="rotate"
              from={`${i * 120} ${CX} ${CY}`}
              to={`${i * 120 + 360} ${CX} ${CY}`}
              dur="10s" repeatCount="indefinite"/>
          </g>
        ))}

        {/* 중심 오브 */}
        <circle cx={CX} cy={CY} r={27} fill="url(#cc-orb)"/>
        <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize="20" fill="rgba(232,176,72,.95)" filter="url(#cc-glow)"
        >✦</text>
      </svg>
    </div>
  );
}
