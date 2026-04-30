const DETAIL = {
  rat: 'rat',
  ox: 'ox',
  tiger: 'tiger',
  rabbit: 'rabbit',
  dragon: 'dragon',
  snake: 'snake',
  horse: 'horse',
  goat: 'goat',
  monkey: 'monkey',
  rooster: 'rooster',
  dog: 'dog',
  pig: 'pig',
};

function PetDetail({ type, color, accent }) {
  switch (type) {
    case DETAIL.rat:
      return (
        <>
          <circle cx="38" cy="47" r="13" fill={accent} />
          <circle cx="90" cy="47" r="13" fill={accent} />
          <path d="M98 77 C122 80 122 42 103 47" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <path d="M45 69 H27 M83 69 H101" stroke="#6f607d" strokeWidth="2" strokeLinecap="round" opacity=".65" />
        </>
      );
    case DETAIL.ox:
      return (
        <>
          <path d="M39 45 C20 24 20 58 37 60" fill="#F7E5BE" stroke="#A98647" strokeWidth="3" />
          <path d="M89 45 C108 24 108 58 91 60" fill="#F7E5BE" stroke="#A98647" strokeWidth="3" />
          <rect x="48" y="78" width="32" height="16" rx="8" fill={accent} opacity=".9" />
        </>
      );
    case DETAIL.tiger:
      return (
        <>
          <path d="M43 40 L34 27 L32 50 Z" fill={color} />
          <path d="M85 40 L94 27 L96 50 Z" fill={color} />
          <path d="M52 44 L58 58 M64 39 V57 M76 44 L70 58" stroke={accent} strokeWidth="5" strokeLinecap="round" opacity=".85" />
          <path d="M45 77 L28 83 M83 77 L100 83" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case DETAIL.rabbit:
      return (
        <>
          <path d="M48 47 C35 14 51 9 58 44" fill={accent} stroke={color} strokeWidth="4" />
          <path d="M80 47 C93 14 77 9 70 44" fill={accent} stroke={color} strokeWidth="4" />
          <ellipse cx="64" cy="82" rx="9" ry="6" fill="#fff" opacity=".9" />
        </>
      );
    case DETAIL.dragon:
      return (
        <>
          <path d="M43 45 L36 27 L53 38" fill="#F4D27A" />
          <path d="M85 45 L92 27 L75 38" fill="#F4D27A" />
          <path d="M42 31 C55 22 74 22 87 31" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <path d="M40 75 C26 70 25 57 37 54 M88 75 C102 70 103 57 91 54" fill="none" stroke="#F4D27A" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case DETAIL.snake:
      return (
        <>
          <path d="M43 85 C28 82 31 61 51 63 H78 C98 63 101 86 81 89 H55 C39 91 38 75 54 75 H84" fill="none" stroke={color} strokeWidth="13" strokeLinecap="round" />
          <path d="M87 63 C100 55 100 41 84 39" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" />
          <path d="M83 50 L96 46" stroke="#E85B6C" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case DETAIL.horse:
      return (
        <>
          <path d="M48 41 L41 26 L58 36" fill={color} />
          <path d="M80 41 L87 26 L70 36" fill={color} />
          <path d="M58 35 C52 50 52 63 58 76" stroke={accent} strokeWidth="8" strokeLinecap="round" />
          <path d="M37 79 C23 84 22 99 37 102" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case DETAIL.goat:
      return (
        <>
          <path d="M45 44 C28 34 31 17 48 24 C60 29 53 47 42 46" fill="none" stroke="#F5E6C8" strokeWidth="7" strokeLinecap="round" />
          <path d="M83 44 C100 34 97 17 80 24 C68 29 75 47 86 46" fill="none" stroke="#F5E6C8" strokeWidth="7" strokeLinecap="round" />
          <circle cx="48" cy="58" r="6" fill={accent} opacity=".9" />
          <circle cx="80" cy="58" r="6" fill={accent} opacity=".9" />
        </>
      );
    case DETAIL.monkey:
      return (
        <>
          <circle cx="35" cy="61" r="12" fill={accent} />
          <circle cx="93" cy="61" r="12" fill={accent} />
          <path d="M48 55 C54 44 74 44 80 55 C84 68 76 81 64 81 C52 81 44 68 48 55Z" fill={accent} opacity=".95" />
          <path d="M91 86 C112 92 112 62 96 66" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case DETAIL.rooster:
      return (
        <>
          <circle cx="56" cy="31" r="7" fill="#F55363" />
          <circle cx="66" cy="27" r="8" fill="#F55363" />
          <circle cx="76" cy="32" r="7" fill="#F55363" />
          <path d="M84 62 L104 70 L84 78 Z" fill="#F4C45E" />
          <path d="M38 77 C24 68 25 52 41 45" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" />
        </>
      );
    case DETAIL.dog:
      return (
        <>
          <path d="M43 42 C23 47 28 76 44 74" fill={accent} />
          <path d="M85 42 C105 47 100 76 84 74" fill={accent} />
          <ellipse cx="64" cy="80" rx="13" ry="9" fill={accent} opacity=".9" />
          <path d="M92 88 C109 88 108 66 95 70" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case DETAIL.pig:
      return (
        <>
          <path d="M43 42 L34 31 L33 51 Z" fill={accent} />
          <path d="M85 42 L94 31 L95 51 Z" fill={accent} />
          <ellipse cx="64" cy="78" rx="15" ry="10" fill={accent} />
          <circle cx="58" cy="78" r="2.5" fill="#9B6D78" />
          <circle cx="70" cy="78" r="2.5" fill="#9B6D78" />
        </>
      );
    default:
      return null;
  }
}

export default function ZodiacPetGraphic({ pet, size = 96, active = false }) {
  if (!pet) return null;
  const id = `zodiac-pet-${pet.id}`;
  const type = DETAIL[pet.animalKey] || pet.animalKey;

  return (
    <svg width={size} height={size} viewBox="0 0 128 128" role="img" aria-label={pet.name} style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`${id}-body`} cx="42%" cy="34%" r="66%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".95" />
          <stop offset="42%" stopColor={pet.accent} stopOpacity=".98" />
          <stop offset="100%" stopColor={pet.color} />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={pet.accent} stopOpacity=".55" />
          <stop offset="100%" stopColor={pet.color} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor={pet.color} floodOpacity=".28" />
        </filter>
      </defs>

      <circle cx="64" cy="68" r={active ? 58 : 52} fill={`url(#${id}-glow)`} />
      <ellipse cx="64" cy="106" rx="38" ry="8" fill="#24182A" opacity=".12" />
      <g filter={`url(#${id}-shadow)`}>
        <PetDetail type={type} color={pet.color} accent={pet.accent} />
        <ellipse cx="64" cy="64" rx="34" ry="36" fill={`url(#${id}-body)`} />
        <circle cx="52" cy="62" r="4" fill="#35263A" />
        <circle cx="76" cy="62" r="4" fill="#35263A" />
        <circle cx="50.5" cy="60.5" r="1.3" fill="#fff" opacity=".9" />
        <circle cx="74.5" cy="60.5" r="1.3" fill="#fff" opacity=".9" />
        <path d="M58 74 C61 78 67 78 70 74" fill="none" stroke="#5B435F" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M46 91 C52 100 76 100 82 91" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity=".45" />
      </g>

      <path d="M25 29 L28 35 L35 36 L30 41 L31 48 L25 44 L19 48 L20 41 L15 36 L22 35 Z" fill="#F7C96B" opacity=".82" />
      <path d="M96 22 L99 27 L105 28 L101 32 L102 38 L96 35 L91 38 L92 32 L88 28 L94 27 Z" fill="#FFFFFF" opacity=".8" />
      <circle cx="100" cy="95" r="3" fill={pet.accent} opacity=".9" />
      <circle cx="28" cy="91" r="2.5" fill={pet.color} opacity=".65" />
    </svg>
  );
}
