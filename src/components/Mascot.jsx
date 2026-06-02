import '../styles/Mascot.css';

const SIZES = { sm: 64, md: 96, lg: 140, xl: 200 };

// mood → { file, alt }. file은 public/mascot/ 기준.
const MOODS = {
  normal:   { file: 'normal',     alt: '별숨이' },
  smile:    { file: 'smile',      alt: '활짝 웃는 별숨이' },
  celebrate:{ file: 'celebrate',  alt: '축하하는 별숨이' },
  sad:      { file: 'sad',        alt: '시무룩한 별숨이' },
  wave:     { file: 'wave',       alt: '인사하는 별숨이' },
  love:     { file: 'love',       alt: '하트 눈을 한 별숨이' },
  heart:    { file: 'takingheart',alt: '하트를 안은 별숨이' },
  guard:    { file: 'guard',      alt: '방패를 든 별숨이' },
  reward:   { file: 'reward',     alt: '보상을 건네는 별숨이' },
  thinking: { file: 'thinking',   alt: '생각하는 별숨이' },
  wink:     { file: 'wink',       alt: '윙크하는 별숨이' },
  sleepy:   { file: 'sleepy',     alt: '졸린 별숨이' },
  worry:    { file: 'worry',      alt: '걱정하는 별숨이' },
  surprise: { file: 'surprise',   alt: '놀란 별숨이' },
  confused: { file: 'confused',   alt: '갸웃하는 별숨이' },
  cheer:    { file: 'cheer',      alt: '응원하는 별숨이' },
  eureka:   { file: 'eureka',     alt: '별 지팡이를 든 별숨이' },
  head:     { file: 'head',       alt: '별숨이 얼굴' },
  pointing: { file: 'pointing',   alt: '가리키는 별숨이' },
  sign:     { file: 'sign',       alt: '팻말을 든 별숨이' },
  peek:     { file: 'peek',       alt: '빼꼼 보는 별숨이' },
  sleeping: { file: 'sleeping',   alt: '잠자는 별숨이' },
  shock:    { file: 'shock',      alt: '깜짝 놀란 별숨이' },
  walking:  { file: 'walking',    alt: '걸어가는 별숨이' },
};

export default function Mascot({
  mood = 'normal',
  size = 'md',
  float = false,
  className = '',
  style,
  ...rest
}) {
  const entry = MOODS[mood] || MOODS.normal;
  const px = typeof size === 'number' ? size : (SIZES[size] || SIZES.md);

  return (
    <img
      src={`/mascot/${entry.file}.png`}
      alt={entry.alt}
      width={px}
      height={px}
      className={`mascot${float ? ' mascot--float' : ''}${className ? ' ' + className : ''}`}
      style={style}
      draggable={false}
      {...rest}
    />
  );
}
