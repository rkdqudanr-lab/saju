import { SPACE_SLOT_TYPES, findSpaceObject } from '../../utils/byeolsoomSpaceItems.js';
import ZodiacPetGraphic from './pets/ZodiacPetGraphic.jsx';

export const DEFAULT_SPACE_LAYOUT = {
  background: 'gemini_wallpaper',
  floor: 'wood_bamboo_floor',
  large1: 'gemini_star_desk',
  large2: null,
  small1: 'rabbit_moon_cushion',
  small2: 'pisces_dream_diary',
  light1: 'leo_spotlight',
  deco1: 'wood_star_planter',
  pet: null,
};

export const SPACE_SLOT_META = [
  { key: 'background', label: '배경', type: SPACE_SLOT_TYPES.BACKGROUND, area: '배경' },
  { key: 'floor', label: '바닥', type: SPACE_SLOT_TYPES.FLOOR, area: '바닥' },
  { key: 'large1', label: '큰 가구', type: SPACE_SLOT_TYPES.LARGE, area: '좌측' },
  { key: 'large2', label: '큰 가구', type: SPACE_SLOT_TYPES.LARGE, area: '우측' },
  { key: 'small1', label: '소품', type: SPACE_SLOT_TYPES.SMALL, area: '앞줄' },
  { key: 'small2', label: '소품', type: SPACE_SLOT_TYPES.SMALL, area: '앞줄' },
  { key: 'light1', label: '조명', type: SPACE_SLOT_TYPES.LIGHT, area: '천장' },
  { key: 'deco1', label: '장식', type: SPACE_SLOT_TYPES.DECO, area: '중앙' },
  { key: 'pet', label: '펫', type: SPACE_SLOT_TYPES.PET, area: '동행' },
];

function SlotCard({ slot, item, pet, selected, onSelect }) {
  const filled = Boolean(item || pet);
  return (
    <button type="button" onClick={() => onSelect?.(slot)} style={{
      minHeight: 76,
      borderRadius: 14,
      border: selected ? '1px solid var(--gold)' : `1px ${filled ? 'solid var(--line)' : 'dashed var(--line)'}`,
      background: selected ? 'var(--goldf)' : filled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
      padding: 9,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: 5,
      fontFamily: 'var(--ff)',
      cursor: 'pointer',
    }}>
      {pet ? (
        <ZodiacPetGraphic pet={pet} size={44} active={selected} />
      ) : (
        <div style={{ fontSize: filled ? 22 : 18, opacity: filled ? 1 : 0.45 }}>
          {filled ? item.emoji : '＋'}
        </div>
      )}
      <div style={{ fontSize: 10, color: filled ? 'var(--t2)' : 'var(--t4)', fontWeight: 800, lineHeight: 1.25 }}>
        {pet ? pet.name : filled ? item.name : slot.label}
      </div>
      <div style={{ fontSize: 9, color: 'var(--t4)' }}>{slot.area}</div>
    </button>
  );
}

export default function SpaceLayoutPreview({ layout = DEFAULT_SPACE_LAYOUT, selectedSlotKey = null, onSelectSlot = null, equippedPet = null }) {
  const resolvedLayout = { ...DEFAULT_SPACE_LAYOUT, ...(layout || {}) };

  return (
    <section style={{
      borderRadius: 22,
      border: '1px solid var(--line)',
      background: 'var(--bg2)',
      padding: 16,
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 900, letterSpacing: '.08em', marginBottom: 4 }}>LAYOUT SLOTS</div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 900 }}>별숨 배치 슬롯</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t4)' }}>MVP 미리보기</div>
      </div>

      <div style={{
        borderRadius: 18,
        border: '1px solid rgba(232,176,72,0.18)',
        background: 'linear-gradient(180deg, rgba(232,176,72,0.05), rgba(255,255,255,0.015))',
        padding: 12,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {SPACE_SLOT_META.map((slot) => (
            <SlotCard
              key={slot.key}
              slot={slot}
              item={findSpaceObject(resolvedLayout[slot.key])}
              pet={slot.key === 'pet' ? equippedPet : null}
              selected={selectedSlotKey === slot.key}
              onSelect={onSelectSlot}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
