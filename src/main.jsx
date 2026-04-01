import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/theme.css'

const gaId = import.meta.env.VITE_GA_ID;
if (gaId) {
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gaId);
}

function isChunkLoadError(error) {
  const msg = error?.message || '';
  return (
    error?.name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, isChunkError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    const chunk = isChunkLoadError(error);
    return { hasError: true, isChunkError: chunk, error }
  }
  componentDidCatch(error) {
    // 청크 로드 오류 → 최대 3회 자동 재로드 (배포 후 CDN 캐시 무효화 대응)
    if (isChunkLoadError(error)) {
      const count = parseInt(sessionStorage.getItem('_chunkErrReloaded') || '0', 10);
      if (count < 3) {
        sessionStorage.setItem('_chunkErrReloaded', String(count + 1));
        window.location.reload();
      }
    }
  }
  render() {
    if (this.state.hasError) {
      // 청크 오류: 재로드 중이면 빈 화면(깜빡임 없이 reload 대기)
      if (this.state.isChunkError) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #eee', borderTopColor: '#c8b06e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )
      }
      // 그 외 오류: 재시작 버튼 표시
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#888', gap: 12 }}>
          <div style={{ fontSize: 40 }}>🌙</div>
          <div style={{ fontSize: 16 }}>별숨이 잠시 쉬고 있어요</div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '8px 20px', border: '1px solid #ccc', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 14 }}>
            다시 시작하기
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
