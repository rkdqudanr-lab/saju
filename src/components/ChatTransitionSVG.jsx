export default function ChatTransitionSVG() {
  return (
    <svg className="ct-svg" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="ctOrb" cx="42%" cy="36%" r="60%">
          <stop offset="0%"   stopColor="#FFECBE" stopOpacity="0.97" />
          <stop offset="34%"  stopColor="#E8B048" stopOpacity="0.88" />
          <stop offset="70%"  stopColor="#946CD6" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#120F1D" stopOpacity="0" />
        </radialGradient>
        <filter id="ctGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 팽창 링 */}
      <circle className="ct-ring ct-ring-a" cx="100" cy="100" r="60"
        fill="none" stroke="rgba(232,176,72,0.35)" strokeWidth="1" />
      <circle className="ct-ring ct-ring-b" cx="100" cy="100" r="75"
        fill="none" stroke="rgba(232,176,72,0.18)" strokeWidth="1" />

      {/* 코어 구 */}
      <circle className="ct-core" cx="100" cy="100" r="46"
        fill="url(#ctOrb)" filter="url(#ctGlow)" />

      {/* 별 심볼 */}
      <text className="ct-star" x="100" y="110"
        textAnchor="middle" fontSize="26" fill="#FFF7DE">✦</text>

      {/* 반짝이 점들 */}
      <circle className="ct-sp ct-sp-0" cx="64"  cy="49"  r="2"   fill="#E8B048" />
      <circle className="ct-sp ct-sp-1" cx="149" cy="63"  r="1.5" fill="#E8B048" />
      <circle className="ct-sp ct-sp-2" cx="40"  cy="124" r="1.5" fill="#946CD6" />
      <circle className="ct-sp ct-sp-3" cx="158" cy="134" r="2"   fill="#E8B048" />
      <circle className="ct-sp ct-sp-4" cx="83"  cy="158" r="1.5" fill="#E8B048" />
      <circle className="ct-sp ct-sp-5" cx="134" cy="151" r="1.2" fill="#946CD6" />
    </svg>
  );
}
