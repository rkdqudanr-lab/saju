import { ON } from '../../utils/saju.js';
import { OHAENG_COLOR, REL_COLOR, calcNodePositions, calcNodeEnergy } from './groupUtils.js';

export default function RelationGraph({ members, pairs, selectedNode, onNodeClick }) {
  const W = 320, H = 300, cx = 160, cy = 150, r = 100;
  const positions = calcNodePositions(members.length, cx, cy, members.length === 1 ? 0 : r);
  const energies = calcNodeEnergy(members, pairs);
  const maxE = Math.max(...energies, 50);
  const minE = Math.min(...energies, 50);

  function nodeRadius(i) {
    const range = maxE - minE;
    const norm = range > 0 ? (energies[i] - minE) / range : 0.5;
    return 18 + Math.round(norm * 12);
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: 360, margin: '0 auto' }}>
      <defs>
        <filter id="glow-edge">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {pairs.map((pair, i) => {
        const posA = positions[pair.idxA];
        const posB = positions[pair.idxB];
        if (!posA || !posB) return null;
        const isHighlighted = selectedNode === null || pair.idxA === selectedNode || pair.idxB === selectedNode;
        const color = REL_COLOR[pair.type];
        const strokeWidth = pair.score >= 70 ? 2.5 : pair.score >= 50 ? 1.5 : 1;
        const isGood = pair.type === 'good';
        return (
          <line key={i}
            x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y}
            stroke={color} strokeWidth={strokeWidth}
            strokeOpacity={isHighlighted ? (isGood ? 0.85 : 0.65) : 0.12}
            strokeDasharray={pair.type === 'bad' ? '4 3' : undefined}
            filter={isGood && isHighlighted ? 'url(#glow-edge)' : undefined}
            style={{ transition: 'stroke-opacity 0.25s' }}
          >
            {isGood && isHighlighted && (
              <animate attributeName="stroke-opacity" values="0.85;0.35;0.85" dur="2s" repeatCount="indefinite" />
            )}
          </line>
        );
      })}

      {members.map((m, i) => {
        const pos = positions[i];
        if (!pos) return null;
        const isSelected = selectedNode === i;
        const isDimmed = selectedNode !== null && !isSelected;
        const nr = nodeRadius(i);
        const domColor = m.saju?.dom ? OHAENG_COLOR[m.saju.dom] : '#B4963C';
        return (
          <g key={i} style={{ cursor: 'pointer' }} onClick={() => onNodeClick(i)}>
            {isSelected && (
              <circle cx={pos.x} cy={pos.y} r={nr + 5}
                fill="none" stroke="#E8B048" strokeWidth={1.5} strokeOpacity={0.5}
              >
                <animate attributeName="r" values={`${nr+4};${nr+7};${nr+4}`} dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={pos.x} cy={pos.y} r={nr + 2} fill="transparent" />
            <circle cx={pos.x} cy={pos.y} r={nr}
              fill={isSelected ? `${domColor}20` : 'var(--bg2)'}
              stroke={isSelected ? domColor : `${domColor}88`}
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={isDimmed ? 0.3 : 1}
              style={{ transition: 'opacity 0.25s, r 0.4s' }}
            />
            <text x={pos.x} y={pos.y - 4} textAnchor="middle"
              fill={isDimmed ? 'var(--t4)' : 'var(--t1)'} fontSize={Math.max(9, nr * 0.42)} fontWeight={700} fontFamily="var(--ff)"
              style={{ transition: 'fill 0.25s' }}>
              {m.name.slice(0, 3)}
            </text>
            <text x={pos.x} y={pos.y + 9} textAnchor="middle"
              fill={isDimmed ? 'var(--t4)' : domColor} fontSize={8} fontFamily="var(--ff)"
              style={{ transition: 'fill 0.25s' }}>
              {m.saju ? ON[m.saju.dom] : ''}
            </text>
            <text x={pos.x} y={pos.y + nr + 13} textAnchor="middle"
              fill={isDimmed ? 'var(--t4)' : 'var(--t3)'} fontSize={8} fontFamily="var(--ff)"
              opacity={isDimmed ? 0.3 : 0.8}>
              {energies[i]}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
