/**
 * ShopItemGraphic — SVG 기반 숍 아이템 비주얼
 * 테마 / 아바타 / 이펙트 각 카테고리별 SVG 디자인
 */

const RARITY_COLORS = {
  common:    '#9BADCE',
  rare:      '#B48EF0',
  legendary: '#E8B048',
};

// ─── 헬퍼 ─────────────────────────────────────────────────────
function nStarPts(cx, cy, or_, ir, n) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? or_ : ir;
    const a = (Math.PI / n) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

// ─── 테마: 색상 팔레트 디스크 ──────────────────────────────────
function ThemeGraphic({ item, size, rc }) {
  const c  = item.colors || {};
  const p  = c.primary || rc;
  const b2 = c.bg2     || '#1a1a2e';
  const ac = c.accent  || p;
  const cx = size / 2, cy = size / 2;
  const seed = (item.id.charCodeAt(7) || 5) % 8;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`td-${item.id}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stopColor={p}  stopOpacity="0.95" />
          <stop offset="65%"  stopColor={p}  stopOpacity="0.55" />
          <stop offset="100%" stopColor={b2} stopOpacity="0.75" />
        </radialGradient>
        <radialGradient id={`tg-${item.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={p} stopOpacity="0.28" />
          <stop offset="100%" stopColor={p} stopOpacity="0"    />
        </radialGradient>
      </defs>
      {/* backdrop glow */}
      <circle cx={cx} cy={cy} r={size * 0.44} fill={`url(#tg-${item.id})`} />
      {/* main colour disc */}
      <circle cx={cx} cy={cy - size * 0.03} r={size * 0.3} fill={`url(#td-${item.id})`} />
      {/* inner highlight */}
      <circle cx={cx - size * 0.09} cy={cy - size * 0.12} r={size * 0.08} fill="rgba(255,255,255,0.22)" />
      {/* rotating rarity ring */}
      <circle cx={cx} cy={cy} r={size * 0.4} fill="none" stroke={rc}
        strokeWidth="1" strokeDasharray="3 6" opacity="0.6"
        style={{ animation: `orbSpin ${10 + seed * 2}s linear infinite`, transformOrigin: 'center' }}
      />
      {/* palette chips */}
      {[p, ac, b2].map((col, i) => (
        <circle key={i}
          cx={cx + (i - 1) * size * 0.16}
          cy={cy + size * 0.34}
          r={size * 0.07}
          fill={col}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.6"
        />
      ))}
    </svg>
  );
}

// ─── 아바타: 캐릭터 실루엣 ─────────────────────────────────────
function AvatarGraphic({ item, size, rc }) {
  const cx = size / 2, cy = size / 2;
  const r  = size * 0.27;
  const seed = item.id.length % 7;

  let shape;
  switch (item.svgType) {
    case 'star_spirit':
      shape = <polygon points={nStarPts(cx, cy - size * 0.02, r, r * 0.42, 6)} fill={rc} opacity="0.88" />;
      break;
    case 'moon_elf':
      shape = (
        <path d={`M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx},${cy + r} A ${r * 0.65},${r * 0.65} 0 1,0 ${cx},${cy - r} Z`}
          fill={rc} opacity="0.88" />
      );
      break;
    case 'cloud_fox':
      shape = (
        <>
          <polygon points={`${cx - r*0.4},${cy - r*0.2} ${cx - r*0.12},${cy - r*0.9} ${cx + r*0.16},${cy - r*0.2}`} fill={rc} opacity="0.88" />
          <polygon points={`${cx + r*0.38},${cy - r*0.2} ${cx + r*0.66},${cy - r*0.9} ${cx + r*0.94},${cy - r*0.2}`} fill={rc} opacity="0.88" />
          <ellipse cx={cx + r * 0.27} cy={cy + r * 0.15} rx={r * 0.56} ry={r * 0.44} fill={rc} opacity="0.82" />
        </>
      );
      break;
    case 'wind_sprite':
      shape = (
        <path d={`M ${cx},${cy - r} C ${cx + r*1.25},${cy - r*0.5} ${cx + r*0.5},${cy + r*0.5} ${cx},${cy} C ${cx - r*0.5},${cy - r*0.5} ${cx - r*1.25},${cy + r*0.5} ${cx},${cy + r}`}
          fill="none" stroke={rc} strokeWidth="2.5" opacity="0.88" strokeLinecap="round" />
      );
      break;
    case 'galaxy_cat': {
      const eyeY = cy + r * 0.1;
      shape = (
        <>
          <polygon points={`${cx-r*0.52},${eyeY-r*0.3} ${cx-r*0.22},${eyeY-r*0.72} ${cx+r*0.07},${eyeY-r*0.3}`} fill={rc} opacity="0.85" />
          <polygon points={`${cx+r*0.52},${eyeY-r*0.3} ${cx+r*0.22},${eyeY-r*0.72} ${cx-r*0.07},${eyeY-r*0.3}`} fill={rc} opacity="0.85" />
          <circle cx={cx} cy={eyeY} r={r * 0.62} fill="none" stroke={rc} strokeWidth="1.8" opacity="0.85" />
          {[0,72,144,216,288].map(a => {
            const px = cx + r*0.62 * Math.cos(a * Math.PI/180);
            const py = eyeY + r*0.62 * Math.sin(a * Math.PI/180);
            return <circle key={a} cx={px} cy={py} r={size * 0.022} fill={rc} opacity="0.7" />;
          })}
        </>
      );
      break;
    }
    case 'time_owl':
      shape = (
        <>
          <ellipse cx={cx} cy={cy + r*0.18} rx={r*0.62} ry={r*0.7} fill={rc} opacity="0.18" stroke={rc} strokeWidth="1.5" />
          <circle  cx={cx - r*0.26} cy={cy - r*0.08} r={r * 0.22} fill={rc} opacity="0.88" />
          <circle  cx={cx + r*0.26} cy={cy - r*0.08} r={r * 0.22} fill={rc} opacity="0.88" />
          <polygon points={`${cx-r*0.08},${cy+r*0.14} ${cx+r*0.08},${cy+r*0.14} ${cx},${cy+r*0.32}`} fill={rc} opacity="0.6" />
          <polygon points={`${cx-r*0.6},${cy-r*0.58} ${cx-r*0.3},${cy-r*0.95} ${cx-r*0.05},${cy-r*0.58}`} fill={rc} opacity="0.85" />
          <polygon points={`${cx+r*0.6},${cy-r*0.58} ${cx+r*0.3},${cy-r*0.95} ${cx+r*0.05},${cy-r*0.58}`} fill={rc} opacity="0.85" />
        </>
      );
      break;
    case 'flame_phoenix':
      shape = (
        <>
          <path d={`M ${cx},${cy + r*0.4} C ${cx-r*0.25},${cy-r*0.35} ${cx-r*0.08},${cy-r*0.8} ${cx},${cy - r}`}
            fill="none" stroke={rc} strokeWidth="2.5" opacity="0.88" strokeLinecap="round" />
          <path d={`M ${cx},${cy - r*0.15} C ${cx-r*0.85},${cy-r*0.62} ${cx-r*1.1},${cy-r*0.08} ${cx-r*0.72},${cy+r*0.32}`}
            fill="none" stroke={rc} strokeWidth="2" opacity="0.72" strokeLinecap="round" />
          <path d={`M ${cx},${cy - r*0.15} C ${cx+r*0.85},${cy-r*0.62} ${cx+r*1.1},${cy-r*0.08} ${cx+r*0.72},${cy+r*0.32}`}
            fill="none" stroke={rc} strokeWidth="2" opacity="0.72" strokeLinecap="round" />
          {[-0.36, 0, 0.36].map((off, i) => (
            <line key={i} x1={cx + off*r} y1={cy+r*0.4} x2={cx + off*r*1.5} y2={cy+r*0.92} stroke={rc} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
          ))}
        </>
      );
      break;
    case 'abyss_dragon':
      shape = (
        <>
          <polygon points={nStarPts(cx, cy, r, r * 0.58, 6)} fill="none" stroke={rc} strokeWidth="1.8" opacity="0.85" />
          <polygon points={nStarPts(cx, cy, r*0.55, r*0.32, 6)} fill={rc} opacity="0.28" stroke={rc} strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r * 0.17} fill={rc} opacity="0.9" />
        </>
      );
      break;
    case 'cosmic_goddess':
    default:
      shape = (
        <>
          {[0,40,80,120,160,200,240,280,320].map((a, i) => {
            const len = i % 2 === 0 ? r * 0.95 : r * 0.62;
            const px  = cx + len * Math.cos((a - 90) * Math.PI/180);
            const py  = cy + len * Math.sin((a - 90) * Math.PI/180);
            return <line key={a} x1={cx} y1={cy} x2={px} y2={py} stroke={rc} strokeWidth={i%2===0 ? 1.8 : 1.2} opacity="0.68" strokeLinecap="round" />;
          })}
          <circle cx={cx} cy={cy} r={r * 0.29} fill={rc} opacity="0.9" />
          <circle cx={cx} cy={cy} r={r * 0.56} fill="none" stroke={rc} strokeWidth="1.3" opacity="0.45" strokeDasharray="2 4" />
        </>
      );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`ag-${item.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={rc} stopOpacity="0.22" />
          <stop offset="100%" stopColor={rc} stopOpacity="0"    />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={size * 0.44} fill={`url(#ag-${item.id})`} />
      {shape}
      {item.rarity !== 'common' && (
        <circle cx={cx} cy={cy} r={size * 0.4} fill="none" stroke={rc} strokeWidth="1"
          opacity="0.45" strokeDasharray="2 5"
          style={{
            animation: `orbSpin ${8 + seed}s linear infinite${item.rarity === 'legendary' ? '' : ' reverse'}`,
            transformOrigin: 'center',
          }}
        />
      )}
    </svg>
  );
}

// ─── 이펙트: 애니메이션 프리뷰 ─────────────────────────────────
function EffectGraphic({ item, size, rc }) {
  const cx = size / 2, cy = size / 2;
  const r  = size * 0.36;

  let pattern;
  switch (item.animType) {
    case 'star_particle':
      pattern = [0,60,120,180,240,300].map((a, i) => {
        const dist = r * (0.42 + (i % 3) * 0.16);
        const px = cx + dist * Math.cos((a - 15 + i*5) * Math.PI/180);
        const py = cy + dist * Math.sin((a - 15 + i*5) * Math.PI/180);
        const s = [6, 4, 5][i % 3];
        return <polygon key={a} points={nStarPts(px, py, s, s*0.42, 4)} fill={rc} opacity={0.48 + (i%3)*0.15} />;
      });
      break;
    case 'snowflake':
      pattern = (
        <>
          {[0,30,60,90,120,150].map(a => {
            const c = Math.cos(a*Math.PI/180), s = Math.sin(a*Math.PI/180);
            return <line key={a} x1={cx + r*0.38*c} y1={cy + r*0.38*s} x2={cx - r*0.38*c} y2={cy - r*0.38*s}
              stroke={rc} strokeWidth="1.5" opacity="0.75" strokeLinecap="round" />;
          })}
          {[0,60,120,180,240,300].map(a => {
            const px = cx + r*0.22 * Math.cos(a*Math.PI/180);
            const py = cy + r*0.22 * Math.sin(a*Math.PI/180);
            return <circle key={a} cx={px} cy={py} r="2.5" fill={rc} opacity="0.7" />;
          })}
        </>
      );
      break;
    case 'spring_rain':
      pattern = Array.from({length: 10}, (_, i) => {
        const x = cx - r + i * r * 0.22;
        const y = cy - r * 0.5 + (i % 3) * r * 0.25;
        return <line key={i} x1={x} y1={y} x2={x - r*0.09} y2={y + r*0.2}
          stroke={rc} strokeWidth="1.2" opacity="0.55" strokeLinecap="round" />;
      });
      break;
    case 'firefly':
      pattern = [0,55,115,175,235,295].map((a, i) => {
        const dist = r * (0.32 + (i%2)*0.2);
        const px = cx + dist * Math.cos(a*Math.PI/180);
        const py = cy + dist * Math.sin(a*Math.PI/180);
        return (
          <g key={a}>
            <circle cx={px} cy={py} r={size*0.055} fill={rc} opacity="0.14" />
            <circle cx={px} cy={py} r={size*0.024} fill={rc} opacity="0.88" />
          </g>
        );
      });
      break;
    case 'sakura': {
      const petals = [0,72,144,216,288].map((a, i) => {
        const baseA = (a + 36) * Math.PI/180;
        const ex = cx + r*0.2 * Math.cos(baseA);
        const ey = cy + r*0.2 * Math.sin(baseA);
        const midR = r * 0.3;
        const mx = ex + midR * Math.cos(baseA);
        const my = ey + midR * Math.sin(baseA);
        return (
          <ellipse key={a}
            cx={mx} cy={my}
            rx={r * 0.16} ry={r * 0.1}
            fill={rc} opacity="0.75"
            transform={`rotate(${a + 18}, ${mx}, ${my})`}
          />
        );
      });
      pattern = (<>{petals}<circle cx={cx} cy={cy} r={r*0.1} fill={rc} opacity="0.65" /></>);
      break;
    }
    case 'aurora':
      pattern = (
        <>
          {[[-0.3, 0.28], [0, 0.12], [0.22, -0.12]].map(([dy1, dy2], i) => (
            <path key={i}
              d={`M ${cx-r} ${cy+dy1*r} Q ${cx} ${cy+dy2*r} ${cx+r} ${cy+dy1*r}`}
              fill="none" stroke={rc} strokeWidth={2.5 - i*0.5} opacity={0.68 - i*0.14} strokeLinecap="round"
            />
          ))}
        </>
      );
      break;
    case 'orbit':
      pattern = (
        <>
          {[0.38, 0.27, 0.18].map((sc, i) => (
            <ellipse key={i} cx={cx} cy={cy}
              rx={r * sc * 2.2} ry={r * sc * 0.7}
              fill="none" stroke={rc} strokeWidth="1.2" opacity={0.38 + i*0.2}
              transform={`rotate(${i * 30}, ${cx}, ${cy})`}
            />
          ))}
          <circle cx={cx} cy={cy} r={size*0.06} fill={rc} opacity="0.82" />
          <circle cx={cx + r * 0.76*2.2 * Math.cos(30*Math.PI/180)} cy={cy + r*0.76*0.7 * Math.sin(30*Math.PI/180)} r={size*0.038} fill={rc} opacity="0.65" />
        </>
      );
      break;
    case 'supernova':
      pattern = (
        <>
          {[0,22.5,45,67.5,90,112.5,135,157.5].map((a, i) => {
            const len = i%2===0 ? r*0.85 : r*0.5;
            return (
              <line key={a}
                x1={cx + r*0.12*Math.cos(a*Math.PI/180)} y1={cy + r*0.12*Math.sin(a*Math.PI/180)}
                x2={cx + len*Math.cos(a*Math.PI/180)}     y2={cy + len*Math.sin(a*Math.PI/180)}
                stroke={rc} strokeWidth={i%2===0 ? 2 : 1.2} opacity={i%2===0 ? 0.85 : 0.55} strokeLinecap="round"
              />
            );
          })}
          <circle cx={cx} cy={cy} r={r*0.18} fill={rc} opacity="0.9" />
          <circle cx={cx} cy={cy} r={r*0.32} fill={rc} opacity="0.12" />
        </>
      );
      break;
    case 'divine_light':
    default:
      pattern = (
        <>
          {[-0.45,-0.2,0,0.2,0.45].map((off, i) => {
            const x = cx + off*r;
            const w = [1.2,2,3,2,1.2][i];
            return (
              <line key={i} x1={x} y1={cy - r} x2={x + off*r*0.15} y2={cy + r}
                stroke={rc} strokeWidth={w} opacity={0.3 + (2-Math.abs(i-2))*0.14} strokeLinecap="round"
              />
            );
          })}
          <circle cx={cx} cy={cy - r*0.65} r={r*0.17} fill={rc} opacity="0.82" />
        </>
      );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`eg-${item.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={rc} stopOpacity="0.18" />
          <stop offset="100%" stopColor={rc} stopOpacity="0"    />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={size * 0.44} fill={`url(#eg-${item.id})`} />
      {pattern}
    </svg>
  );
}

// ─── 기본 export ───────────────────────────────────────────────
export default function ShopItemGraphic({ item, size = 80 }) {
  if (!item) return null;
  const rc = RARITY_COLORS[item.rarity] || '#9BADCE';
  if (item.category === 'theme')  return <ThemeGraphic  item={item} size={size} rc={rc} />;
  if (item.category === 'avatar') return <AvatarGraphic item={item} size={size} rc={rc} />;
  if (item.category === 'effect') return <EffectGraphic item={item} size={size} rc={rc} />;
  return <div style={{ fontSize: size * 0.5, textAlign: 'center', lineHeight: `${size}px` }}>{item.emoji}</div>;
}
