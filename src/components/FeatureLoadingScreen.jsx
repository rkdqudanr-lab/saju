/**
 * FeatureLoadingScreen — 기능별 풀스크린 로딩 화면
 * type: 'daily' | 'tarot' | 'dream' | 'compat' | 'report' | 'prophecy'
 *       | 'comprehensive' | 'name' | 'taegil' | 'letter' | 'group' | 'special' | 'diary'
 */

// ── 공통 래퍼 ──────────────────────────────────────────────
function Wrap({ children }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '68vh', gap: 28,
      animation: 'fadeIn .4s ease',
    }}>
      {children}
    </div>
  );
}
function Label({ title, subtitle }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'var(--lg)', fontWeight: 700, color: 'var(--t1)', marginBottom: 10 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 'var(--sm)', color: 'var(--t2)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ── 1. 일일 운세 (daily) — SVG 정밀 공전: 3점 120° 균등 배치 ──
function DailyAnim() {
  // SVG animateTransform: rotate(deg cx cy) 방식으로 중심(50,50) 기준 정확한 공전
  const ORBIT_R = 36; // 점이 도는 반경
  const cx = 50, cy = 50;
  const dots = [
    { r: 4.5, fill: 'var(--gold)',             filter: true,  begin: '0s',      dur: '2.4s' },
    { r: 3,   fill: 'rgba(200,160,255,.85)',    filter: false, begin: '-0.8s',   dur: '2.4s' },
    { r: 3.5, fill: 'rgba(232,176,72,.55)',     filter: false, begin: '-1.6s',   dur: '2.4s' },
  ];
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" overflow="visible">
      <defs>
        <filter id="dl-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* 궤도 링 */}
      <circle cx={cx} cy={cy} r={ORBIT_R} fill="none"
        stroke="rgba(232,176,72,.18)" strokeWidth="1" strokeDasharray="4 4"/>
      {/* 내부 링 */}
      <circle cx={cx} cy={cy} r={ORBIT_R * 0.55} fill="none"
        stroke="rgba(200,160,255,.1)" strokeWidth="0.8"/>
      {/* 역방향 느린 점 */}
      <g>
        <circle cx={cx + ORBIT_R * 0.55} cy={cy} r="2.2" fill="rgba(155,142,196,.5)"/>
        <animateTransform attributeName="transform" type="rotate"
          from={`0 ${cx} ${cy}`} to={`-360 ${cx} ${cy}`}
          dur="5s" repeatCount="indefinite"/>
      </g>
      {/* 공전하는 점 3개 — 120° 균등 배치 */}
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={cx + ORBIT_R} cy={cy} r={d.r}
            fill={d.fill} filter={d.filter ? 'url(#dl-glow)' : undefined}/>
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`}
            dur={d.dur} begin={d.begin} repeatCount="indefinite"/>
        </g>
      ))}
      {/* 중심 별 */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize="20" fill="var(--gold)"
        style={{ animation: 'fl-glow-soft 2s ease-in-out infinite' }}>✦</text>
    </svg>
  );
}

// ── 2. 타로 (tarot) — 카드 3장 + 빛 스윕 ─────────────────
function TarotAnim() {
  const cardBase = (delay, idx) => ({
    width: 46, height: 72,
    borderRadius: 7,
    background: 'linear-gradient(135deg,#1a1030,#2d1f50)',
    border: '1px solid rgba(232,176,72,.35)',
    position: 'relative',
    overflow: 'hidden',
    animation: `fl-float ${2.4 + idx * 0.2}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    boxShadow: '0 4px 16px rgba(0,0,0,.4)',
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 90 }}>
      {[[-9, 0], [0, 0.3], [9, 0.15]].map(([rot, delay], i) => (
        /* 회전 래퍼를 분리해야 fl-float 애니메이션이 rotate를 덮어쓰지 않음 */
        <div key={i} style={{ transform: `rotate(${rot}deg)` }}>
          <div style={cardBase(delay, i)}>
            {/* 카드 뒷면 별 문양 */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: i === 1 ? '1.3rem' : '1rem',
              color: 'rgba(232,176,72,.5)',
            }}>✦</div>
            {/* 빛 스윕 */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, width: '40%',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)',
              animation: `fl-card-shimmer ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 3. 꿈 해몽 (dream) — 달 위상 변화 + 떠다니는 Z ────────
function DreamAnim() {
  const moonPhases = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      {/* 달 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        fontSize: '3rem',
        animation: 'fl-float 2.8s ease-in-out infinite',
      }}>🌙</div>
      {/* 구름 느낌 작은 별들 */}
      {[[12, 18], [72, 28], [20, 65], [75, 58]].map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute',
          left: x + '%', top: y + '%',
          fontSize: '.5rem', color: 'rgba(232,176,72,.6)',
          animation: `fl-glow-soft ${1.5 + i * 0.4}s ease-in-out infinite`,
          animationDelay: `${i * 0.35}s`,
        }}>✦</div>
      ))}
      {/* 떠오르는 Z (꿈) */}
      {[0.6, 1.3, 2.1].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute',
          right: 10 + i * 8 + '%',
          top: 10 - i * 10 + '%',
          fontSize: `${0.6 + i * 0.15}rem`,
          color: 'rgba(200,160,255,.5)',
          fontWeight: 700,
          animation: `fl-float ${2 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        }}>z</div>
      ))}
    </div>
  );
}

// ── 4. 궁합 (compat) — 두 별이 서로 공전하며 가까워짐 ──────
function CompatAnim() {
  return (
    <div style={{ position: 'relative', width: 110, height: 110 }}>
      {/* 중심 가이드 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 80, height: 80, borderRadius: '50%',
        border: '1px dashed rgba(232,176,72,.15)',
      }} />
      {/* 별 A — 시계방향 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        animation: 'fl-orbit 2.2s linear infinite',
      }}>
        <div style={{
          width: 14, height: 14, marginTop: -7, marginLeft: -7,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--gold), rgba(232,176,72,.5))',
          boxShadow: '0 0 10px var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.5rem', color: '#0D0B14',
        }}>♡</div>
      </div>
      {/* 별 B — 반시계방향 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        animation: 'fl-orbit 2.2s linear infinite reverse',
      }}>
        <div style={{
          width: 11, height: 11, marginTop: -5, marginLeft: -5,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,160,255,.9), rgba(155,142,196,.4))',
          boxShadow: '0 0 8px rgba(200,160,255,.6)',
        }} />
      </div>
      {/* 중심 하트 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        fontSize: '1.2rem',
        animation: 'fl-glow-soft 2s ease-in-out infinite',
        color: 'rgba(232,176,72,.8)',
      }}>✦</div>
    </div>
  );
}

// ── 5. 월간 리포트 (report) — 별자리 선이 하나씩 연결됨 ─────
function ReportAnim() {
  const stars = [
    [20, 20], [50, 10], [80, 25], [90, 55], [65, 80], [35, 85], [10, 60], [30, 45],
  ];
  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <svg width="100" height="100" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* 별자리 선들 */}
        {stars.map((s, i) => {
          const next = stars[(i + 1) % stars.length];
          return (
            <line key={i}
              x1={s[0]} y1={s[1]} x2={next[0]} y2={next[1]}
              stroke="rgba(232,176,72,.25)" strokeWidth="1"
              strokeDasharray="60" strokeDashoffset="60"
              style={{ animation: `fl-constellation 1.5s ease forwards`, animationDelay: `${i * 0.18}s` }}
            />
          );
        })}
        {/* 별들 */}
        {stars.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3}
            fill="var(--gold)"
            style={{
              animation: `fl-star-appear .5s ease forwards`,
              animationDelay: `${i * 0.18}s`,
              opacity: 0,
              transformOrigin: `${x}px ${y}px`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// ── 6. 미래 예언 (prophecy) — 모래시계 ───────────────────────
function ProphecyAnim() {
  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      {/* 모래시계 — hourglass waist at SVG(25,40) → container(25,10) */}
      <svg width="50" height="80" viewBox="0 0 50 80" style={{ position: 'absolute', top: 10, left: 25 }}>
        <path d="M5,5 L45,5 L25,40 L45,75 L5,75 L25,40 Z"
          fill="none" stroke="rgba(232,176,72,.4)" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 위쪽 모래 */}
        <rect x="8" y="7" width="34" height="12" rx="2"
          fill="rgba(232,176,72,.25)"
          style={{ animation: 'fl-glow-soft 1.5s ease-in-out infinite' }} />
        {/* 흐르는 모래 */}
        <rect x="23" y="34" width="4" rx="2"
          fill="rgba(232,176,72,.7)"
          style={{ animation: 'fl-sand-flow 1.8s ease-in-out infinite', transformOrigin: '25px 34px', height: 0 }} />
        {/* 아래쪽 모래 쌓임 */}
        <path d="M20,68 L25,55 L30,68 Z" fill="rgba(232,176,72,.35)"
          style={{ animation: 'fl-glow-soft 1.5s ease-in-out infinite', animationDelay: '.5s' }} />
      </svg>
      {/* 회전하는 별 — top:50%,left:50% = (50,50) = hourglass waist center */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        animation: 'fl-orbit-rev 3s linear infinite',
      }}>
        <div style={{ fontSize: '.7rem', color: 'var(--gold)', marginTop: -6, marginLeft: -6 }}>✦</div>
      </div>
    </div>
  );
}

// ── 7. 종합 분석 (comprehensive) — 동서양 교차 궤도: 타원 두 개가 90° 엇갈림 ──
function ComprehensiveAnim() {
  // 가로 타원(서양 별자리) + 세로 타원(동양 사주) 두 궤도가 교차
  const cx = 50, cy = 50;
  const rx = 42, ry = 18; // 타원 반경
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" overflow="visible">
      <defs>
        <filter id="cp-glow-g" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cp-glow-p" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* 가로 타원 — 서양 별자리 (파랑-보라) */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
        fill="none" stroke="rgba(155,142,196,.3)" strokeWidth="1" strokeDasharray="5 3"/>
      {/* 세로 타원 — 동양 사주 (금색) */}
      <ellipse cx={cx} cy={cy} rx={ry} ry={rx}
        fill="none" stroke="rgba(232,176,72,.3)" strokeWidth="1" strokeDasharray="5 3"/>

      {/* 가로 타원 위 보라 점 (시계방향) */}
      <g>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none">
          <animate attributeName="stroke" values="none" dur="3.6s" repeatCount="indefinite"/>
        </ellipse>
        <circle r="4" fill="rgba(200,160,255,.9)" filter="url(#cp-glow-p)">
          <animateMotion dur="3.6s" repeatCount="indefinite">
            <mpath href="#cp-path-h"/>
          </animateMotion>
        </circle>
      </g>

      {/* 세로 타원 위 금색 점 (반시계방향) */}
      <g>
        <circle r="4.5" fill="var(--gold)" filter="url(#cp-glow-g)">
          <animateMotion dur="2.8s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
            <mpath href="#cp-path-v"/>
          </animateMotion>
        </circle>
      </g>

      {/* 경로 정의 (화면 밖 보이지 않음) */}
      <path id="cp-path-h" d={`M${cx+rx},${cy} A${rx},${ry} 0 1 1 ${cx+rx-0.01},${cy}`}
        fill="none" stroke="none"/>
      <path id="cp-path-v" d={`M${cx},${cy-rx} A${ry},${rx} 0 1 1 ${cx-0.01},${cy-rx}`}
        fill="none" stroke="none"/>

      {/* 교차점 4개에 작은 점 (정적) */}
      {[[cx+ry,cy],[cx-ry,cy],[cx,cy+ry],[cx,cy-ry]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1.5"
          fill="rgba(232,176,72,.4)"
          style={{ animation: `fl-glow-soft ${1.4+i*0.3}s ease-in-out infinite` }}/>
      ))}

      {/* 중심 별 */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize="16" fill="var(--gold)"
        style={{ animation: 'fl-glow-soft 2.2s ease-in-out infinite' }}>✦</text>
    </svg>
  );
}

// ── 8. 이름 풀이 (name) — 한글 자모가 하나씩 나타남 ─────────
function NameAnim() {
  const chars = ['ㅂ','ㅕ','ㄹ','ㅅ','ㅜ','ㅁ'];
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {chars.map((ch, i) => (
        <div key={i} style={{
          width: 32, height: 32,
          borderRadius: 6,
          border: '1px solid rgba(232,176,72,.4)',
          background: 'var(--bg2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--sm)', color: 'var(--gold)', fontWeight: 700,
          animation: `fl-star-appear .5s ease forwards, fl-glow .8s ease-in-out ${i * 0.15 + 0.5}s infinite`,
          opacity: 0,
          animationDelay: `${i * 0.12}s, ${i * 0.15 + 0.5}s`,
        }}>{ch}</div>
      ))}
    </div>
  );
}

// ── 9. 택일 (taegil) — 달력 날짜가 빛나며 선택됨 ────────────
function TaegilAnim() {
  const dates = [1,2,3,4,5,6,7,8,9,10,11,12];
  const luckyDates = [3, 7, 11];
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--line)',
      borderRadius: 10, padding: '12px 14px', width: 160,
    }}>
      <div style={{ fontSize: 'var(--xs)', color: 'var(--gold)', fontWeight: 700, marginBottom: 8, textAlign: 'center', letterSpacing: '.05em' }}>
        길일 찾는 중
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
        {dates.map(d => (
          <div key={d} style={{
            height: 28, borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--xs)', fontWeight: luckyDates.includes(d) ? 700 : 400,
            animation: luckyDates.includes(d)
              ? `fl-date-glow 1.8s ease-in-out infinite`
              : 'none',
            animationDelay: luckyDates.includes(d)
              ? `${luckyDates.indexOf(d) * 0.5}s`
              : '0s',
            background: 'transparent',
            color: luckyDates.includes(d) ? 'var(--gold)' : 'var(--t4)',
            border: luckyDates.includes(d) ? '1px solid rgba(232,176,72,.4)' : 'none',
            transition: 'all .3s',
          }}>{d}</div>
        ))}
      </div>
    </div>
  );
}

// ── 10. 별숨 편지 (letter) — 봉투가 열리며 편지가 올라옴 ─────
function LetterAnim() {
  return (
    <div style={{ position: 'relative', width: 100, height: 80 }}>
      {/* 봉투 본체 */}
      <div style={{
        width: 90, height: 60,
        border: '1.5px solid rgba(232,176,72,.5)',
        borderRadius: 8,
        background: 'linear-gradient(160deg,var(--bg2),var(--bg1))',
        position: 'absolute', bottom: 0, left: 5,
        overflow: 'visible',
      }}>
        {/* V자 라인 */}
        <svg width="90" height="30" style={{ position: 'absolute', top: 0 }}>
          <path d="M0,0 L45,20 L90,0" fill="none" stroke="rgba(232,176,72,.3)" strokeWidth="1" />
        </svg>
        {/* 봉인 ✦ */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          fontSize: '.9rem', color: 'rgba(232,176,72,.6)',
          animation: 'fl-glow-soft 2s ease-in-out infinite',
        }}>✦</div>
      </div>
      {/* 편지지가 올라옴 */}
      <div style={{
        position: 'absolute', bottom: 30, left: 18,
        width: 58, height: 50,
        background: 'var(--bg1)',
        border: '1px solid rgba(232,176,72,.3)',
        borderRadius: 4,
        animation: 'fl-letter-rise 2s ease-in-out infinite alternate',
        display: 'flex', flexDirection: 'column',
        gap: 4, padding: '8px 6px',
      }}>
        {[100, 85, 70].map((w, i) => (
          <div key={i} style={{
            height: 2, width: w + '%', borderRadius: 2,
            background: 'rgba(232,176,72,.3)',
            animation: `fl-glow-soft 1.5s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── 11. 그룹 별숨 (group) — 여러 별이 모여드는 클러스터 ───────
function GroupAnim() {
  const members = [
    { x: -36, y: -30, color: 'var(--gold)', size: 10 },
    { x: 36, y: -30, color: 'rgba(200,160,255,.9)', size: 8 },
    { x: -40, y: 20, color: 'rgba(232,176,72,.7)', size: 7 },
    { x: 40, y: 20, color: 'rgba(155,142,196,.8)', size: 9 },
    { x: 0, y: -44, color: 'rgba(232,200,100,.8)', size: 6 },
  ];
  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      {members.map(({ x, y, color, size }, i) => (
        /* transform 대신 left/top으로 위치를 잡아야 fl-float 애니메이션이 덮어쓰지 않음 */
        <div key={i} style={{
          position: 'absolute',
          left: 50 + x - size / 2,
          top: 50 + y - size / 2,
          width: size, height: size,
          borderRadius: '50%', background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: `fl-float ${1.8 + i * 0.3}s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      {/* 중심 별 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        fontSize: '1.1rem', color: 'var(--gold)',
        animation: 'fl-glow-soft 2s ease-in-out infinite',
      }}>✦</div>
    </div>
  );
}

// ── 12. 특별 기능 (special) — 수정구슬 + 소용돌이 ──────────
function SpecialAnim() {
  return (
    <div style={{ position: 'relative', width: 90, height: 90 }}>
      {/* 구슬 */}
      <div style={{
        position: 'absolute', inset: 8,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 28%, rgba(232,176,72,.6), rgba(155,142,196,.4), rgba(50,30,90,.95))',
        animation: 'orbPulse 3s ease-in-out infinite',
        boxShadow: '0 0 20px rgba(232,176,72,.3), inset 0 0 20px rgba(0,0,0,.5)',
      }} />
      {/* 테두리 링 */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: '1.5px solid rgba(232,176,72,.3)',
        animation: 'fl-ring-spin-1 4s linear infinite',
      }}>
        <div style={{
          position: 'absolute', top: -4, left: '50%', marginLeft: -4,
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--gold)',
          boxShadow: '0 0 8px var(--gold)',
        }} />
      </div>
      <div style={{
        position: 'absolute', inset: -10,
        borderRadius: '50%',
        border: '1px dashed rgba(200,160,255,.2)',
        animation: 'fl-ring-spin-2 7s linear infinite',
      }} />
      {/* 구슬 내부 빛 */}
      <div style={{
        position: 'absolute', top: '30%', left: '28%',
        width: '28%', height: '18%',
        borderRadius: '50%',
        background: 'rgba(255,255,255,.2)',
        transform: 'rotate(-30deg)',
      }} />
    </div>
  );
}

// ── 메인 export ──────────────────────────────────────────────
const FEATURE_MAP = {
  daily:         { Anim: DailyAnim,        title: '오늘의 기운을 읽고 있어요',    subtitle: '사주와 별자리로\n오늘 하루를 분석하는 중이에요' },
  tarot:         { Anim: TarotAnim,        title: '카드의 목소리를 듣고 있어요',   subtitle: '선택하신 타로 카드의 의미를\n해석하는 중이에요' },
  dream:         { Anim: DreamAnim,        title: '꿈속의 이야기를 읽고 있어요',   subtitle: '사주와 별자리로\n꿈의 메시지를 해독하는 중이에요' },
  compat:        { Anim: CompatAnim,       title: '두 별의 인연을 읽고 있어요',    subtitle: '두 사람의 사주를 맞대어\n인연의 깊이를 분석하는 중이에요' },
  report:        { Anim: ReportAnim,       title: '이달의 별자리를 그리고 있어요', subtitle: '한 달의 흐름을\n사주와 별자리로 분석하는 중이에요' },
  prophecy:      { Anim: ProphecyAnim,     title: '미래의 장막을 걷어내는 중이에요', subtitle: '사주와 점성술로\n앞으로의 흐름을 읽고 있어요' },
  comprehensive: { Anim: ComprehensiveAnim,title: '사주와 별자리를 교차 분석 중이에요', subtitle: '동양의 사주와 서양의 점성술을\n동시에 읽는 중이에요' },
  name:          { Anim: NameAnim,         title: '이름 속 기운을 읽고 있어요',    subtitle: '성명학과 사주로\n이름의 의미를 해석하는 중이에요' },
  taegil:        { Anim: TaegilAnim,       title: '별숨이 길일을 찾고 있어요',     subtitle: '사주와 절기를 분석해\n가장 좋은 날을 고르는 중이에요' },
  letter:        { Anim: LetterAnim,       title: '별숨이 편지를 쓰고 있어요',     subtitle: '사주와 별자리로 읽은\n이야기를 편지로 담는 중이에요' },
  group:         { Anim: GroupAnim,        title: '모두의 별빛을 읽고 있어요',     subtitle: '각자의 사주를 모아\n그룹의 별자리를 분석하는 중이에요' },
  special:       { Anim: SpecialAnim,      title: '별숨이 깊이 읽고 있어요',       subtitle: '사주와 별자리로\n집중 분석하는 중이에요' },
  diary:         { Anim: () => (
    <div style={{ position: 'relative', width: 72, height: 72 }}>
      <div style={{ width: 72, height: 72, border: '3px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'orbSpin 1.2s linear infinite' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '1.6rem' }}>✦</div>
    </div>
  ), title: '별숨이 오늘 하루를 읽고 있어요', subtitle: '사주와 별자리로\n오늘의 기운을 분석하는 중이에요' },
};

export default function FeatureLoadingScreen({ type = 'daily', fullPage = true, title: titleOverride, subtitle: subtitleOverride }) {
  const config = FEATURE_MAP[type] || FEATURE_MAP.daily;
  const { Anim, title, subtitle } = config;

  const inner = (
    <Wrap>
      <Anim />
      <Label title={titleOverride ?? title} subtitle={subtitleOverride ?? subtitle} />
    </Wrap>
  );

  if (!fullPage) return inner;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'var(--loading-overlay)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn .25s ease',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>{inner}</div>
    </div>
  );
}
