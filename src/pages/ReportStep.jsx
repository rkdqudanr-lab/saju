import { ReportBody } from "../components/AccItem.jsx";

export default function ReportStep({
  form, today,
  reportText, reportLoading,
  genReport, shareCard, shareResult,
}) {
  return (
    <div className="page-top">
      <div className="inner report-page">
        <div className="report-header">
          <div className="report-date">{today.year}년 {today.month}월 · {today.lunar}</div>
          <div className="report-title">{form.name || '당신'}님의<br />심층 리포트</div>
          <div className="report-name">사주 × 별자리 통합 운세</div>
        </div>
        {!reportLoading && !reportText ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp4) var(--sp3) var(--sp5)' }}>
            <div style={{ fontSize: 'var(--sm)', color: 'var(--t3)', lineHeight: 1.8, marginBottom: 'var(--sp4)' }}>
              이번 달 별과 사주가 전하는<br />연애 · 재물 · 건강 · 직업 종합 에세이
            </div>
            <button className="up-btn" style={{ maxWidth: 320, margin: '0 auto' }} onClick={genReport}>
              당신의 이번달 별숨은? ✦
            </button>
          </div>
        ) : reportLoading ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp5)', color: 'var(--t3)', fontSize: 'var(--sm)' }}>
            <div className="load-orb-wrap">
              <div className="load-orb">
                <div className="load-orb-core" /><div className="load-orb-ring" /><div className="load-orb-ring2" />
              </div>
            </div>
            별의 움직임을 분석하여<br />심층 리포트를 작성하고 있습니다...
          </div>
        ) : (
          <>
            <ReportBody text={reportText} />
            {reportText && (
              <div style={{ display: 'flex', gap: 8, marginTop: 'var(--sp3)' }}>
                <button className="res-top-btn" style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)' }} onClick={() => shareCard(0)}>🖼 이미지 저장</button>
                <button className="res-top-btn primary" style={{ flex: 1, padding: 12, borderRadius: 'var(--r1)' }} onClick={() => shareResult('report', reportText, '월간 리포트')}>↗ 공유하기</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
