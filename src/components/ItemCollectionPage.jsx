import React, { useState, useMemo } from 'react';
import { ALL_GACHA_POOL, GACHA_POOL, SAJU_POOL, GRADE_CONFIG, SAJU_GRADE_CONFIG } from '../utils/gachaItems.js';
import GachaGraphic from './GachaGraphic.jsx';

export default function ItemCollectionPage({ inventoryItems, onClose }) {
  const [tab, setTab] = useState('space'); // 'space' | 'saju'
  const [selectedItem, setSelectedItem] = useState(null);

  // 보유한 베이스 아이템 ID Set (접두사 무시)
  const ownedBaseIds = useMemo(() => {
    const set = new Set();
    inventoryItems.forEach(item => {
      if (item.item_id) {
        const baseId = item.item_id.split('::')[0];
        set.add(baseId);
      }
    });
    return set;
  }, [inventoryItems]);

  const pool = tab === 'space' ? GACHA_POOL : SAJU_POOL;
  const config = tab === 'space' ? GRADE_CONFIG : SAJU_GRADE_CONFIG;

  // 진척도
  const ownedCount = pool.filter(i => ownedBaseIds.has(i.id)).length;
  const totalCount = pool.length;
  const progressPercent = ((ownedCount / totalCount) * 100).toFixed(1);

  // 등급별 분류
  const itemsByGrade = useMemo(() => {
    const map = {};
    pool.forEach(item => {
      if (!map[item.grade]) map[item.grade] = [];
      map[item.grade].push(item);
    });
    return map;
  }, [pool]);

  const gradeOrder = Object.keys(config).slice().reverse(); // 높은 등급부터 출력

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 8500,
      background: 'var(--bg)', display: 'flex', flexDirection: 'column',
      animation: 'fadeUp .4s ease'
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--bg2)',
            border: '1px solid var(--line)', color: 'var(--t3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
          <div style={{ fontSize: 'var(--md)', fontWeight: 700, color: 'var(--t1)' }}>별숨 도감</div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 600, background: 'var(--goldf)', padding: '4px 10px', borderRadius: 20 }}>
          {ownedCount} / {totalCount} ({progressPercent}%)
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
        <button
          onClick={() => setTab('space')}
          style={{
            flex: 1, padding: '14px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: `2px solid ${tab === 'space' ? 'var(--gold)' : 'transparent'}`,
            color: tab === 'space' ? 'var(--gold)' : 'var(--t4)', fontWeight: tab === 'space' ? 700 : 400,
            fontSize: 'var(--sm)', transition: 'all .2s'
          }}
        >🌌 우주 도감</button>
        <button
          onClick={() => setTab('saju')}
          style={{
            flex: 1, padding: '14px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: `2px solid ${tab === 'saju' ? 'var(--gold)' : 'transparent'}`,
            color: tab === 'saju' ? 'var(--gold)' : 'var(--t4)', fontWeight: tab === 'saju' ? 700 : 400,
            fontSize: 'var(--sm)', transition: 'all .2s'
          }}
        >☯️ 사주 도감</button>
      </div>

      {/* 목록 컨테이너 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 60px' }}>
        {gradeOrder.map(grade => {
          const catItems = itemsByGrade[grade];
          if (!catItems || catItems.length === 0) return null;
          const cfg = config[grade];

          return (
            <div key={grade} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: cfg.bg, border: `1px solid ${cfg.border}` }} />
                <div style={{ fontSize: 'var(--sm)', fontWeight: 700, color: cfg.color, letterSpacing: '.04em' }}>{cfg.label}</div>
                <div style={{ height: 1, flex: 1, background: 'var(--line2)' }} />
                <div style={{ fontSize: '11px', color: 'var(--t4)' }}>
                  {catItems.filter(i => ownedBaseIds.has(i.id)).length} / {catItems.length}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 10 }}>
                {catItems.map((item, idx) => {
                  const isOwned = ownedBaseIds.has(item.id);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedItem({ ...item, isOwned, cfg })}
                      style={{
                        background: isOwned ? 'var(--bg2)' : 'var(--bg)',
                        border: `1px solid ${isOwned ? cfg.border : 'var(--line)'}`,
                        borderRadius: 12, padding: '12px 4px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        cursor: 'pointer', transition: 'all .2s',
                        filter: isOwned ? 'none' : 'grayscale(1) opacity(0.4)',
                      }}
                    >
                      <GachaGraphic item={item} size={42} />
                      <div style={{
                        fontSize: '9px', fontWeight: 600, color: isOwned ? 'var(--t2)' : 'var(--t4)',
                        textAlign: 'center', wordBreak: 'keep-all', lineHeight: 1.2, height: 22
                      }}>
                        {isOwned ? item.name : '???'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 모달: 아이템 상세 */}
      {selectedItem && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          animation: 'fadeIn .2s ease'
        }}>
          {selectedItem.isOwned ? (
            <div style={{
              width: '100%', maxWidth: 340, background: 'var(--bg1)',
              borderRadius: 24, border: `1px solid ${selectedItem.cfg.border}`,
              padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center',
              animation: 'gacha-card-in .4s cubic-bezier(.34,1.56,.64,1)',
              boxShadow: `0 8px 32px ${selectedItem.cfg.bg}`
            }}>
              <div style={{ fontSize: '11px', color: selectedItem.cfg.color, fontWeight: 700, letterSpacing: '.06em', marginBottom: 16 }}>
                {selectedItem.cfg.label}
              </div>
              <GachaGraphic item={selectedItem} size={110} />
              
              <div style={{ marginTop: 24, fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t1)' }}>
                {selectedItem.name}
              </div>
              
              <div style={{ 
                margin: '16px 0', padding: '12px 16px', borderRadius: 12, background: 'var(--bg2)',
                fontSize: 'var(--sm)', color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.6, textAlign: 'center'
              }}>
                "{selectedItem.lore || '우주의 신비로운 에너지를 지닌 파편입니다.'}"
              </div>

              <div style={{ fontSize: '11px', color: selectedItem.cfg.color, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: `1px dashed ${selectedItem.cfg.border}` }}>
                {selectedItem.effectLabel}
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  marginTop: 32, width: '100%', padding: 14, borderRadius: 50,
                  background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 'var(--sm)',
                  border: 'none', cursor: 'pointer'
                }}
              >닫기</button>
            </div>
          ) : (
            <div style={{
              width: '100%', maxWidth: 340, background: 'var(--bg1)',
              borderRadius: 24, border: '1px solid var(--line)',
              padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--t4)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 16 }}>
                미발견
              </div>
              <div style={{ filter: 'brightness(0) opacity(0.3)' }}>
                <GachaGraphic item={selectedItem} size={110} />
              </div>
              
              <div style={{ marginTop: 24, fontSize: 'var(--lg)', fontWeight: 800, color: 'var(--t4)' }}>
                ???
              </div>
              <div style={{ margin: '16px 0', fontSize: 'var(--xs)', color: 'var(--t4)' }}>아직 발견하지 못한 기운입니다.</div>

              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  marginTop: 32, width: '100%', padding: 14, borderRadius: 50,
                  background: 'var(--bg2)', color: 'var(--t2)', fontWeight: 700, fontSize: 'var(--sm)',
                  border: '1px solid var(--line)', cursor: 'pointer'
                }}
              >닫기</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
