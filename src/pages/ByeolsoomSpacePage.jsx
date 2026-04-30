import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { getAuthenticatedClient } from '../lib/supabase.js';
import { STEP } from '../utils/steps.js';
import { findItem } from '../utils/gachaItems.js';
import { SPACE_OBJECTS, SPACE_SERIES, getSpaceObjectsBySeries, mapLegacyGachaToSpaceObject } from '../utils/byeolsoomSpaceItems.js';
import { ZODIAC_PETS, findZodiacPet } from '../utils/zodiacPets.js';
import { claimStardust, readSpaceProgress, saveSpaceProgress } from '../utils/spaceProgress.js';
import ByeolsoomCore from '../features/space/ByeolsoomCore.jsx';
import SpaceLayoutPreview, { DEFAULT_SPACE_LAYOUT, SPACE_SLOT_META } from '../features/space/SpaceLayoutPreview.jsx';
import SeriesCollectionPanel from '../features/space/SeriesCollectionPanel.jsx';
import PetPanel from '../features/space/PetPanel.jsx';
import StardustPanel from '../features/space/StardustPanel.jsx';

function getLayoutStorageKey(kakaoId) {
  return `byeolsoom_space_layout_${kakaoId || 'guest'}`;
}

function getPetStorageKey(kakaoId) {
  return `byeolsoom_space_pet_${kakaoId || 'guest'}`;
}

function MiniObject({ item }) {
  return (
    <div style={{
      minWidth: 72,
      borderRadius: 14,
      border: '1px solid var(--line)',
      background: 'var(--bg1)',
      padding: '10px 8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, marginBottom: 7 }}>{item.emoji}</div>
      <div style={{ fontSize: 10, color: 'var(--t2)', lineHeight: 1.35, fontWeight: 700 }}>{item.name}</div>
    </div>
  );
}

export default function ByeolsoomSpacePage() {
  const setStep = useAppStore((s) => s.setStep);
  const user = useAppStore((s) => s.user);
  const saju = useAppStore((s) => s.saju);
  const kakaoId = user?.kakaoId || user?.id;
  const [layout, setLayout] = useState(DEFAULT_SPACE_LAYOUT);
  const [selectedSlotKey, setSelectedSlotKey] = useState('large2');
  const [selectedPetId, setSelectedPetId] = useState('rabbit_pet');
  const [spaceProgress, setSpaceProgress] = useState(() => readSpaceProgress(null));
  const [ownedObjects, setOwnedObjects] = useState([]);
  const [loadingOwned, setLoadingOwned] = useState(false);

  const featuredSeries = useMemo(() => SPACE_SERIES.slice(0, 3), []);
  const sampleObjects = useMemo(() => SPACE_OBJECTS.slice(0, 8), []);
  const selectedSlot = SPACE_SLOT_META.find((slot) => slot.key === selectedSlotKey) || null;
  const selectedPet = findZodiacPet(selectedPetId) || ZODIAC_PETS[3] || ZODIAC_PETS[0] || null;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(getLayoutStorageKey(kakaoId)) || '{}');
      setLayout({ ...DEFAULT_SPACE_LAYOUT, ...(saved && typeof saved === 'object' ? saved : {}) });
    } catch {
      setLayout(DEFAULT_SPACE_LAYOUT);
    }
  }, [kakaoId]);

  useEffect(() => {
    try {
      const savedPetId = localStorage.getItem(getPetStorageKey(kakaoId));
      if (findZodiacPet(savedPetId)) setSelectedPetId(savedPetId);
      else setSelectedPetId('rabbit_pet');
    } catch {
      setSelectedPetId('rabbit_pet');
    }
  }, [kakaoId]);

  useEffect(() => {
    setSpaceProgress(readSpaceProgress(kakaoId));
  }, [kakaoId]);

  useEffect(() => {
    let cancelled = false;
    if (!kakaoId) {
      setOwnedObjects([]);
      return undefined;
    }
    setLoadingOwned(true);
    getAuthenticatedClient(String(kakaoId))
      ?.from('user_shop_inventory')
      .select('item_id')
      .eq('kakao_id', String(kakaoId))
      .then(({ data }) => {
        if (cancelled) return;
        const mapped = (data || [])
          .map((row) => mapLegacyGachaToSpaceObject(findItem(String(row.item_id))))
          .filter(Boolean);
        const deduped = Array.from(new Map(mapped.map((item) => [item.id, item])).values());
        setOwnedObjects(deduped);
      })
      .catch(() => {
        if (!cancelled) setOwnedObjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOwned(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kakaoId]);

  const saveLayout = useCallback((nextLayout) => {
    setLayout(nextLayout);
    try {
      localStorage.setItem(getLayoutStorageKey(kakaoId), JSON.stringify(nextLayout));
    } catch {}
  }, [kakaoId]);

  const handlePlaceObject = useCallback((object) => {
    if (!selectedSlot || !object) return;
    if (selectedSlot.type !== object.slotType) return;
    saveLayout({ ...layout, [selectedSlot.key]: object.id });
  }, [layout, saveLayout, selectedSlot]);

  const handleClearSlot = useCallback(() => {
    if (!selectedSlot) return;
    saveLayout({ ...layout, [selectedSlot.key]: null });
  }, [layout, saveLayout, selectedSlot]);

  const handleSelectPet = useCallback((pet) => {
    if (!pet) return;
    setSelectedPetId(pet.id);
    setSelectedSlotKey('pet');
    try {
      localStorage.setItem(getPetStorageKey(kakaoId), pet.id);
    } catch {}
  }, [kakaoId]);

  const handleClaimStardust = useCallback(() => {
    const { nextProgress, amount } = claimStardust(spaceProgress);
    if (amount <= 0) return;
    setSpaceProgress(nextProgress);
    saveSpaceProgress(kakaoId, nextProgress);
  }, [kakaoId, spaceProgress]);

  const compatibleObjects = useMemo(() => {
    if (!selectedSlot) return [];
    return ownedObjects.filter((item) => item.slotType === selectedSlot.type);
  }, [ownedObjects, selectedSlot]);

  return (
    <div className="page">
      <div className="inner" style={{ paddingBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setStep(STEP.HOME)}
            aria-label="홈으로 돌아가기"
            style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--bg2)', color: 'var(--t3)', cursor: 'pointer' }}
          >
            ←
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--lg)', color: 'var(--t1)', fontWeight: 900 }}>별숨공간</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', marginTop: 3 }}>가구와 오브제로 채우는 나만의 별숨</div>
          </div>
          <div style={{ width: 40 }} />
        </div>

        <ByeolsoomCore saju={saju} />

        <StardustPanel progress={spaceProgress} onClaim={handleClaimStardust} />

        <SpaceLayoutPreview
          layout={layout}
          selectedSlotKey={selectedSlotKey}
          equippedPet={selectedPet}
          onSelectSlot={(slot) => setSelectedSlotKey(slot.key)}
        />

        <PetPanel
          pets={ZODIAC_PETS}
          selectedPetId={selectedPet?.id}
          onSelectPet={handleSelectPet}
        />

        <section style={{ borderRadius: 22, border: '1px solid var(--line)', background: 'var(--bg2)', padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 900, letterSpacing: '.08em', marginBottom: 4 }}>PLACE OBJECT</div>
              <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 900 }}>
                {selectedSlot ? `${selectedSlot.label} 슬롯 꾸미기` : '슬롯을 선택해 주세요'}
              </div>
            </div>
            {selectedSlot && selectedSlotKey !== 'pet' && (
              <button
                type="button"
                onClick={handleClearSlot}
                style={{ flexShrink: 0, border: '1px solid var(--line)', background: 'transparent', color: 'var(--t4)', borderRadius: 999, padding: '6px 10px', fontSize: 10, fontWeight: 800, fontFamily: 'var(--ff)', cursor: 'pointer' }}
              >
                비우기
              </button>
            )}
          </div>

          {selectedSlotKey === 'pet' ? (
            <div style={{ borderRadius: 16, border: '1px dashed var(--line)', padding: 16, color: 'var(--t4)', fontSize: 'var(--xs)', lineHeight: 1.7 }}>
              펫 슬롯은 아래 십이지신 동행 펫에서 바로 선택해요. 선택한 펫은 별숨공간의 동행 슬롯에 항상 표시됩니다.
            </div>
          ) : loadingOwned ? (
            <div style={{ padding: 18, textAlign: 'center', color: 'var(--t4)', fontSize: 'var(--xs)' }}>내 오브제를 불러오는 중...</div>
          ) : compatibleObjects.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              {compatibleObjects.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handlePlaceObject(item)}
                  style={{
                    borderRadius: 14,
                    border: layout[selectedSlotKey] === item.id ? '1px solid var(--gold)' : '1px solid var(--line)',
                    background: layout[selectedSlotKey] === item.id ? 'var(--goldf)' : 'var(--bg1)',
                    padding: '10px 8px',
                    textAlign: 'center',
                    fontFamily: 'var(--ff)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 7 }}>{item.emoji}</div>
                  <div style={{ fontSize: 10, color: 'var(--t2)', lineHeight: 1.35, fontWeight: 800 }}>{item.name}</div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ borderRadius: 16, border: '1px dashed var(--line)', padding: 16, textAlign: 'center', color: 'var(--t4)', fontSize: 'var(--xs)', lineHeight: 1.7 }}>
              {selectedSlot ? `${selectedSlot.label}에 놓을 수 있는 보유 오브제가 아직 없어요.` : '배치할 슬롯을 먼저 선택해 주세요.'}
            </div>
          )}
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setStep(STEP.GACHA)}
            style={{ padding: '13px 14px', borderRadius: 16, border: '1px solid var(--acc)', background: 'var(--goldf)', color: 'var(--gold)', fontWeight: 800, fontFamily: 'var(--ff)', cursor: 'pointer' }}
          >
            오브제 뽑기
          </button>
          <button
            type="button"
            onClick={() => setStep(STEP.ITEM_INVENTORY)}
            style={{ padding: '13px 14px', borderRadius: 16, border: '1px solid var(--line)', background: 'var(--bg2)', color: 'var(--t2)', fontWeight: 800, fontFamily: 'var(--ff)', cursor: 'pointer' }}
          >
            내 오브제
          </button>
        </div>

        <section style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 800, letterSpacing: '.08em', marginBottom: 10 }}>SERIES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {featuredSeries.map((series) => {
              const objects = getSpaceObjectsBySeries(series.id);
              return (
                <article key={series.id} style={{ border: '1px solid var(--line)', borderRadius: 18, background: 'var(--bg2)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 900 }}>{series.emoji} {series.name}</div>
                      <div style={{ fontSize: 'var(--xs)', color: 'var(--t4)', lineHeight: 1.55, marginTop: 3 }}>{series.description}</div>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 11, color: 'var(--gold)', fontWeight: 800 }}>{objects.length}종</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                    {objects.slice(0, 4).map((item) => <MiniObject key={item.id} item={item} />)}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <SeriesCollectionPanel ownedObjects={ownedObjects} />

        <section>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 800, letterSpacing: '.08em', marginBottom: 10 }}>OBJECT PREVIEW</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
            {sampleObjects.map((item) => <MiniObject key={item.id} item={item} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
