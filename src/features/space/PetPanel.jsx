import ZodiacPetGraphic from './pets/ZodiacPetGraphic.jsx';

export default function PetPanel({ pets = [], selectedPetId = null, onSelectPet = null }) {
  const selectedPet = pets.find((pet) => pet.id === selectedPetId) || pets[0] || null;

  return (
    <section style={{ borderRadius: 22, border: '1px solid var(--line)', background: 'var(--bg2)', padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 900, letterSpacing: '.08em', marginBottom: 4 }}>ZODIAC PET</div>
          <div style={{ fontSize: 'var(--sm)', color: 'var(--t1)', fontWeight: 900 }}>십이지신 동행 펫</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t4)' }}>SVG MVP</div>
      </div>

      {selectedPet && (
        <div style={{
          borderRadius: 18,
          border: '1px solid rgba(232,176,72,0.18)',
          background: `linear-gradient(135deg, ${selectedPet.accent}33, rgba(255,255,255,0.03))`,
          padding: 14,
          display: 'grid',
          gridTemplateColumns: '96px 1fr',
          gap: 12,
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <ZodiacPetGraphic pet={selectedPet} size={96} active />
          <div>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 900, letterSpacing: '.08em', marginBottom: 4 }}>
              {selectedPet.zodiac} · {selectedPet.title}
            </div>
            <div style={{ fontSize: 'var(--md)', color: 'var(--t1)', fontWeight: 900, marginBottom: 6 }}>{selectedPet.name}</div>
            <div style={{ fontSize: 'var(--xs)', color: 'var(--t3)', lineHeight: 1.65, marginBottom: 8 }}>{selectedPet.charm}</div>
            <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid var(--line)', padding: '5px 8px', color: 'var(--t4)', fontSize: 10, fontWeight: 800 }}>
              {selectedPet.passive?.label}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
        {pets.map((pet) => {
          const selected = pet.id === selectedPetId;
          return (
            <button
              type="button"
              key={pet.id}
              onClick={() => onSelectPet?.(pet)}
              style={{
                minHeight: 94,
                borderRadius: 16,
                border: selected ? '1px solid var(--gold)' : '1px solid var(--line)',
                background: selected ? 'var(--goldf)' : 'var(--bg1)',
                padding: '8px 5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontFamily: 'var(--ff)',
                cursor: 'pointer',
              }}
            >
              <ZodiacPetGraphic pet={pet} size={54} active={selected} />
              <div style={{ fontSize: 10, color: selected ? 'var(--gold)' : 'var(--t2)', fontWeight: 900, lineHeight: 1.2 }}>
                {pet.name}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
