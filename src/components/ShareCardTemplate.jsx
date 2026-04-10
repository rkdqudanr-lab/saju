import { forwardRef } from "react";

/**
 * 인스타그램 1:1 (1080x1080) 카드뉴스 템플릿
 * position: fixed + left: -9999px 로 off-screen에 숨겨두고
 * html2canvas 로 캡처해 이미지로 저장하는 용도.
 */
const ShareCardTemplate = forwardRef(function ShareCardTemplate(
  { name, saju, summary },
  ref
) {
  const ilgan = saju?.il?.g || '';
  const ilji  = saju?.il?.j || '';

  // 별 위치를 고정 시드로 분산 (Math.random 쓰면 리렌더마다 달라짐)
  const stars = [
    { top: '8%',  left: '12%',  size: 3, opacity: 0.7 },
    { top: '5%',  left: '72%',  size: 2, opacity: 0.5 },
    { top: '14%', left: '88%',  size: 4, opacity: 0.9 },
    { top: '22%', left: '5%',   size: 2, opacity: 0.6 },
    { top: '30%', left: '93%',  size: 3, opacity: 0.8 },
    { top: '42%', left: '3%',   size: 2, opacity: 0.5 },
    { top: '55%', left: '95%',  size: 3, opacity: 0.7 },
    { top: '68%', left: '8%',   size: 2, opacity: 0.6 },
    { top: '75%', left: '85%',  size: 4, opacity: 0.9 },
    { top: '83%', left: '18%',  size: 3, opacity: 0.8 },
    { top: '90%', left: '60%',  size: 2, opacity: 0.5 },
    { top: '18%', left: '50%',  size: 2, opacity: 0.4 },
    { top: '62%', left: '45%',  size: 2, opacity: 0.4 },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: '-9999px',
        top: '-9999px',
        width:  '1080px',
        height: '1080px',
        overflow: 'hidden',
        fontFamily: 'Pretendard, -apple-system, sans-serif',
        background: 'linear-gradient(160deg, #0D0B14 0%, #13101E 40%, #1A1628 100%)',
        boxSizing: 'border-box',
      }}
    >
      {/* 별 오버레이 */}
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            width:  s.size,
            height: s.size,
            borderRadius: '50%',
            background: '#ffffff',
            opacity: s.opacity,
          }}
        />
      ))}

      {/* 상단 장식선 */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, transparent, #E8B048, transparent)',
      }} />

      {/* 내용 컨테이너 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '90px 80px 70px',
      }}>

        {/* 상단: 브랜드 + 로고 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '26px',
            letterSpacing: '0.25em',
            color: '#E8B048',
            fontWeight: 600,
            marginBottom: '10px',
          }}>
            ✦ 별숨
          </div>
          <div style={{
            width: '48px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #E8B048, transparent)',
            margin: '0 auto',
          }} />
        </div>

        {/* 중앙: 닉네임 + 일간, 운세 요약 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '48px',
          width: '100%',
        }}>
          {/* 닉네임 + 일간 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '52px',
              fontWeight: 700,
              color: '#F0EBF8',
              letterSpacing: '-0.01em',
              marginBottom: '16px',
              lineHeight: 1.1,
            }}>
              {name || '별숨 유저'}
            </div>
            {ilgan && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(232,176,72,0.12)',
                border: '1px solid rgba(232,176,72,0.35)',
                borderRadius: '100px',
                padding: '10px 28px',
              }}>
                <span style={{ fontSize: '22px', color: '#E8B048', fontWeight: 600 }}>
                  {ilgan}{ilji}
                </span>
                <span style={{ fontSize: '18px', color: '#C8BEDE' }}>일주</span>
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div style={{
            width: '280px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(232,176,72,0.5), transparent)',
          }} />

          {/* 운세 요약 */}
          <div style={{
            maxWidth: '820px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '14px',
              letterSpacing: '0.2em',
              color: '#E8B048',
              fontWeight: 600,
              marginBottom: '24px',
              textTransform: 'uppercase',
            }}>
              오늘의 운세
            </div>
            <p style={{
              fontSize: '34px',
              fontWeight: 400,
              color: '#F0EBF8',
              lineHeight: 1.75,
              margin: 0,
              wordBreak: 'keep-all',
              whiteSpace: 'pre-wrap',
            }}>
              {summary || '오늘 하루도 별이 당신을 지켜보고 있어요.'}
            </p>
          </div>
        </div>

        {/* 하단: 브랜딩 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(232,176,72,0.4), transparent)',
            margin: '0 auto 24px',
          }} />
          <div style={{
            fontSize: '22px',
            color: '#C8BEDE',
            fontWeight: 400,
            marginBottom: '10px',
            letterSpacing: '0.02em',
          }}>
            나만의 수호별, 별숨에서 확인하기 ✨
          </div>
          <div style={{
            fontSize: '17px',
            color: '#6B6090',
            letterSpacing: '0.05em',
          }}>
            byeolsoom.com
          </div>
        </div>
      </div>

      {/* 하단 장식선 */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, transparent, #E8B048, transparent)',
      }} />
    </div>
  );
});

export default ShareCardTemplate;
