/**
 * AppRouter — step 값에 따라 알맞은 페이지를 렌더링합니다.
 * step은 Zustand store에서 직접 읽고,
 * 나머지 의존성은 App.jsx가 만든 ctx 객체로 전달합니다.
 */
import { lazy, Suspense, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../store/useAppStore.js";
import { STEP } from "../utils/steps.js";

const PAGE_ANIM = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
};

// static imports (항상 로드)
import SkeletonLoader      from "./SkeletonLoader.jsx";
import TodayDetailPage     from "../pages/TodayDetailPage.jsx";
import ReportStep          from "../pages/ReportStep.jsx";
import ChatStep            from "../pages/ChatStep.jsx";
import ResultsStep         from "../pages/ResultsStep.jsx";
import QuestionStep        from "../pages/QuestionStep.jsx";
import ProfileStep         from "../pages/ProfileStep.jsx";
import LandingPage         from "../pages/LandingPage.jsx";

// lazy-loaded components
const SajuCalendar            = lazy(() => import("./SajuCalendar.jsx"));
const DeepInterviewPage       = lazy(() => import("./DeepInterviewPage.jsx"));
const HistoryPage             = lazy(() => import("./HistoryPage.jsx"));
const FutureProphecyPage      = lazy(() => import("./FutureProphecyPage.jsx"));
const CompatPage              = lazy(() => import("./CompatPage.jsx"));
const GroupBulseumPage        = lazy(() => import("./GroupBulseumPage.jsx"));
const AnniversaryPage         = lazy(() => import("./AnniversaryPage.jsx"));
const NatalInterpretationPage = lazy(() => import("./NatalInterpretationPage.jsx"));
const ComprehensivePage       = lazy(() => import("./ComprehensivePage.jsx"));
const OnboardingCards         = lazy(() => import("./OnboardingCards.jsx"));
const DiaryPage               = lazy(() => import("./DiaryPage.jsx"));
const DiaryListPage           = lazy(() => import("./DiaryListPage.jsx"));
const SajuCardPage            = lazy(() => import("./SajuCardPage.jsx"));
const SettingsPage            = lazy(() => import("./SettingsPage.jsx"));
const MyPage                  = lazy(() => import("./MyPage.jsx"));
const DreamPage               = lazy(() => import("./DreamPage.jsx"));
const InquiryPage             = lazy(() => import("./InquiryPage.jsx"));
const TaegillPage             = lazy(() => import("./TaegillPage.jsx"));
const NameFortunePage         = lazy(() => import("./NameFortunePage.jsx"));
const StatsPage               = lazy(() => import("./StatsPage.jsx"));
const CommunityPage           = lazy(() => import("./CommunityPage.jsx"));
const DaeunPage               = lazy(() => import("./DaeunPage.jsx"));
const AnonCompatPage          = lazy(() => import("./AnonCompatPage.jsx"));
const ShopPage                = lazy(() => import("./ShopPage.jsx"));
const SpecialReadingPage      = lazy(() => import("./SpecialReadingPage.jsx"));
const TarotPage               = lazy(() => import("./TarotPage.jsx"));
const ByeolsoomLetterPage     = lazy(() => import("./ByeolsoomLetterPage.jsx"));
const YearlyReportPage        = lazy(() => import("./YearlyReportPage.jsx"));
const GrowthDashboardPage     = lazy(() => import("./GrowthDashboardPage.jsx"));
const MissionPage             = lazy(() => import("../pages/MissionPage.jsx"));
const ByeolsoomSpacePage      = lazy(() => import("../pages/ByeolsoomSpacePage.jsx"));
const ItemInventoryPage       = lazy(() => import("./ItemInventoryPage.jsx"));
const LottoPage               = lazy(() => import("./LottoPage.jsx"));
const GachaPage               = lazy(() => import("./GachaPage.jsx"));
const SajuStoryPage           = lazy(() => import("./SajuStoryPage.jsx"));

function PageSpinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: 16 }}>
      <div className="land-orb" style={{ width: 40, height: 40 }}>
        <div className="orb-core" /><div className="orb-r1" /><div className="orb-r2" />
      </div>
      <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 500, letterSpacing: '0.05em', opacity: 0.8 }}>
        별의 기운을 불러오는 중...
      </div>
    </div>
  );
}

export default function AppRouter({ ctx }) {
  const step    = useAppStore((s) => s.step);
  const setStep = useAppStore((s) => s.setStep);

  // COMPREHENSIVE_REDIRECT: 렌더 중 setStep 호출을 피하기 위해 useEffect 사용
  useEffect(() => {
    if (step === STEP.COMPREHENSIVE_REDIRECT) setStep(STEP.COMPREHENSIVE);
  }, [step, setStep]);

  const {
    // userProfile
    user, profile, form, setForm, saju, sun, moon, asc,
    formOk, formOkApprox, onboardingDone,
    otherProfiles, setOtherProfiles, activeProfileIdx, setActiveProfileIdx,
    consentFlags, saveOtherProfile, saveProfileToSupabase,
    responseStyle, lifeStage, fontSize, instantTyping, saveSettings,
    setShowProfileModal, setShowOtherProfileModal,
    editingOtherIdx, setEditingOtherIdx, startEditOtherProfile,

    // sajuCtx
    today, buildCtx,

    // useModalState
    showToast, setShowSidebar, setShowUpgradeModal, setDiaryViewDate,

    // useConsultation
    selQs, setSelQs, diy, setDiy, pkg, curPkg,
    answers, openAcc, typedSet, chatHistory, chatInput, setChatInput, chatLoading,
    latestChatIdx, chatLeft, maxQ, reportText, reportLoading,
    histItem, setHistItem, chatEndRef, qLoadStatus,
    dailyResult, dailyLoading, dailyCount, DAILY_MAX,
    diaryReviewResult, diaryReviewLoading,
    timeSlot, loadingMsgIdx, cat, setCat, retryMsg,
    addQ, rmQ, askClaude, askQuick, askDailyHoroscope,
    askDiaryReview, askWeeklyReview, resetDiaryReview,
    handleAccToggle, retryAnswer, sendChat, sendStreamChat,
    genReport, callApi, resetSession, deleteHistoryItem,
    _handleTypingDone,

    // useAppHandlers
    copyDone, profileNudge, setProfileNudge, showSubNudge,
    handleTypingDone, handleOnboardingFinish,
    handleSendChat, handleCopyAll,
    shareCard, shareResult,
    handleSaveReportImage, handleSaveProphecyImage, handleSaveChatImage,
    handleShareFortuneCard, handleShareDreamCard, handleShareTaegilCard,

    // gamification
    gamificationState, earnBP, spendBP,
    handleBlockBadtime, isBlockingBadtime,
    handleCompleteMission, handleDiaryComplete,
    handleFreeRecharge, freeRechargeAvailable, freezeStreak,
    hasDiaryToday,

    // page-local state
    quiz, quizInput, setQuizInput,
    showDailyCard, setShowDailyCard,
    editingMyProfile, setEditingMyProfile,
    fieldTouched, setFieldTouched,
    showAllCats, setShowAllCats,
    sidebarPrefs, setSidebarPrefs,
    anonCompatShareData, setAnonCompatShareData,
    diaryViewDate,
    groupCode,
    resultsRef, askBtnRef,

    // misc
    ANNIVERSARY_PROMPT, saveAnalysisCache, kakaoLogin,
    anniversaryDate, setAnniversaryDate, anniversaryType, setAnniversaryType,
  } = ctx;

  return (
    <div className="app" id="main-content" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))' }}>
      <AnimatePresence mode="wait" initial={false}>
      <motion.div key={step} {...PAGE_ANIM} style={{ minHeight: '100%' }}>

      {/* HOME */}
      {step === STEP.HOME && (
        <LandingPage
          otherProfiles={otherProfiles}
          dailyResult={dailyResult}
          dailyLoading={dailyLoading}
          askDailyHoroscope={askDailyHoroscope}
          onFreeRecharge={handleFreeRecharge}
          freeRechargeAvailable={freeRechargeAvailable}
          onEarnBP={earnBP}
          hasDiaryToday={hasDiaryToday}
          setEditingMyProfile={setEditingMyProfile}
          setShowProfileModal={setShowProfileModal}
        />
      )}

      {/* PROFILE */}
      {step === STEP.PROFILE && (
        <ProfileStep
          form={form} setForm={setForm}
          user={user} saju={saju} sun={sun} moon={moon} asc={asc}
          formOk={formOk} editingMyProfile={editingMyProfile} setEditingMyProfile={setEditingMyProfile}
          fieldTouched={fieldTouched} setFieldTouched={setFieldTouched}
          otherProfiles={otherProfiles} setOtherProfiles={setOtherProfiles}
          activeProfileIdx={activeProfileIdx} setActiveProfileIdx={setActiveProfileIdx}
          onboardingDone={onboardingDone}
          startEditOtherProfile={startEditOtherProfile}
          setSelQs={setSelQs} setStep={setStep} setShowOtherProfileModal={setShowOtherProfileModal}
          saveProfileToSupabase={saveProfileToSupabase}
          showToast={showToast}
        />
      )}

      {/* QUESTION */}
      {step === STEP.QUESTION && (
        <QuestionStep
          form={form} saju={saju} sun={sun} moon={moon}
          otherProfiles={otherProfiles} activeProfileIdx={activeProfileIdx}
          timeSlot={timeSlot}
          diy={diy} setDiy={setDiy}
          selQs={selQs} maxQ={maxQ}
          cat={cat} setCat={setCat}
          showAllCats={showAllCats} setShowAllCats={setShowAllCats}
          addQ={addQ} rmQ={rmQ} askQuick={askQuick} askClaude={askClaude}
          askBtnRef={askBtnRef}
          user={user}
        />
      )}

      {/* LOADING */}
      {step === STEP.LOADING && (
        <div className="page" role="status" aria-live="polite" aria-busy="true" aria-label="질문 생성">
          <SkeletonLoader qCount={selQs.length} saju={saju} loadingMsgIdx={loadingMsgIdx} selQs={selQs} qLoadStatus={qLoadStatus} />
          {retryMsg && (
            <div style={{ marginTop: 12, padding: '10px 16px', background: 'var(--goldf)', border: '1px solid var(--acc)', borderRadius: 'var(--r1)', fontSize: 'var(--xs)', color: 'var(--gold)', textAlign: 'center', animation: 'fadeUp .3s ease' }}>
              {retryMsg}
            </div>
          )}
        </div>
      )}

      {/* RESULT */}
      {step === STEP.RESULT && (
        <ResultsStep
          selQs={selQs} answers={answers} openAcc={openAcc} typedSet={typedSet}
          cat={cat} pkg={pkg}
          chatLeft={chatLeft} curPkg={curPkg}
          showSubNudge={showSubNudge}
          copyDone={copyDone}
          resultsRef={resultsRef}
          handleAccToggle={handleAccToggle} handleTypingDone={handleTypingDone} retryAnswer={retryAnswer}
          shareCard={shareCard} handleCopyAll={handleCopyAll} shareResult={shareResult}
          handleShareFortuneCard={handleShareFortuneCard}
          spendBP={spendBP}
          setStep={setStep} setSelQs={setSelQs} setDiy={setDiy}
          setShowSidebar={setShowSidebar} setShowUpgradeModal={setShowUpgradeModal}
          kakaoLogin={kakaoLogin} genReport={genReport} resetSession={resetSession}
          onEnterChat={ctx.handleEnterChat}
        />
      )}

      {/* CHAT */}
      {step === STEP.CHAT && (
        <ChatStep
          chatHistory={chatHistory} chatInput={chatInput} setChatInput={setChatInput}
          chatLoading={chatLoading} chatLeft={chatLeft} latestChatIdx={latestChatIdx}
          selQs={selQs}
          profileNudge={profileNudge} setProfileNudge={setProfileNudge}
          setShowProfileModal={setShowProfileModal}
          handleSendChat={handleSendChat} handleSaveChatImage={handleSaveChatImage}
          chatEndRef={chatEndRef}
        />
      )}

      {/* DEEP_INTERVIEW */}
      {step === STEP.DEEP_INTERVIEW && (
        <Suspense fallback={<PageSpinner />}>
          <DeepInterviewPage form={form} today={today} callApi={callApi} shareResult={shareResult} saveReportImage={handleSaveReportImage} />
        </Suspense>
      )}

      {/* COMPAT */}
      {step === STEP.COMPAT && (
        <Suspense fallback={<PageSpinner />}>
          <CompatPage
            myForm={form} mySaju={saju} mySun={sun}
            callApi={callApi} buildCtx={buildCtx}
            onBack={() => setStep(STEP.RESULT)}
            shareResult={shareResult} user={user} consentFlags={consentFlags}
            otherProfiles={otherProfiles} saveOtherProfile={saveOtherProfile}
            onAnonShare={(data) => { setAnonCompatShareData(data); setStep(STEP.ANON_COMPAT); }}
          />
        </Suspense>
      )}

      {/* FUTURE_PROPHECY */}
      {step === STEP.FUTURE_PROPHECY && (
        <Suspense fallback={<PageSpinner />}>
          <FutureProphecyPage
            form={form} buildCtx={buildCtx} callApi={callApi}
            onBack={() => setStep(STEP.RESULT)}
            shareResult={shareResult} saveImage={handleSaveProphecyImage}
            user={user} consentFlags={consentFlags} showToast={showToast}
          />
        </Suspense>
      )}

      {/* HISTORY */}
      {step === STEP.HISTORY && histItem && (
        <Suspense fallback={<PageSpinner />}>
          <HistoryPage
            item={histItem}
            onBack={() => { setHistItem(null); setStep(STEP.HOME); }}
            onDelete={(id, supabaseId) => { deleteHistoryItem(id, supabaseId); }}
            onReplay={(targetStep) => { setHistItem(null); setStep(targetStep); }}
          />
        </Suspense>
      )}

      {/* CALENDAR */}
      {step === STEP.CALENDAR && (
        <Suspense fallback={<PageSpinner />}>
          <SajuCalendar form={form} setStep={setStep} askQuick={askQuick} user={user} callApi={callApi} showToast={showToast} setDiaryViewDate={setDiaryViewDate} />
        </Suspense>
      )}

      {/* GROUP */}
      {step === STEP.GROUP && (
        <Suspense fallback={<PageSpinner />}>
          <GroupBulseumPage form={form} saju={saju} sun={sun} setStep={setStep} initialCode={groupCode} user={user} />
        </Suspense>
      )}

      {/* ANNIVERSARY */}
      {step === STEP.ANNIVERSARY && (
        <Suspense fallback={<PageSpinner />}>
          <AnniversaryPage
            form={form} callApi={callApi}
            anniversaryDate={anniversaryDate} setAnniversaryDate={setAnniversaryDate}
            anniversaryType={anniversaryType} setAnniversaryType={setAnniversaryType}
            ANNIVERSARY_PROMPT={ANNIVERSARY_PROMPT} buildCtx={buildCtx}
          />
        </Suspense>
      )}

      {/* NATAL */}
      {step === STEP.NATAL && (
        <Suspense fallback={<PageSpinner />}>
          <NatalInterpretationPage saju={saju} sun={sun} moon={moon} asc={asc} form={form} onGoStep={setStep} />
        </Suspense>
      )}

      {/* COMPREHENSIVE */}
      {step === STEP.COMPREHENSIVE && (
        <Suspense fallback={<PageSpinner />}>
          <ComprehensivePage saju={saju} sun={sun} moon={moon} asc={asc} form={form} buildCtx={buildCtx} user={user} consentFlags={consentFlags} />
        </Suspense>
      )}

      {/* ONBOARDING */}
      {step === STEP.ONBOARDING && (
        <Suspense fallback={<PageSpinner />}>
          <OnboardingCards saju={saju} sun={sun} onFinish={handleOnboardingFinish} />
        </Suspense>
      )}

      {/* DIARY */}
      {step === STEP.DIARY && (
        <Suspense fallback={<PageSpinner />}>
          <DiaryPage
            askReview={askDiaryReview} setStep={setStep} setDiy={setDiy} callApi={callApi}
            viewDate={diaryViewDate}
            diaryReviewResult={diaryReviewResult} diaryReviewLoading={diaryReviewLoading}
            onDiaryComplete={handleDiaryComplete}
          />
        </Suspense>
      )}

      {/* DAILY_HOROSCOPE (18) — 레거시 진입점, TODAY_DETAIL과 동일 컴포넌트 */}
      {step === STEP.DAILY_HOROSCOPE && (
        <TodayDetailPage
          dailyResult={dailyResult} dailyLoading={dailyLoading}
          dailyCount={dailyCount} DAILY_MAX={DAILY_MAX}
          gamificationState={gamificationState}
          onBlockBadtime={handleBlockBadtime} isBlockingBadtime={isBlockingBadtime}
          setStep={setStep} onRefresh={askDailyHoroscope} onSpendBp={spendBP} showToast={showToast} callApi={callApi}
        />
      )}

      {/* SETTINGS */}
      {step === STEP.SETTINGS && (
        <Suspense fallback={<PageSpinner />}>
          <div className="page step-fade" style={{ paddingTop: 56 }}>
            <div className="inner" style={{ paddingTop: 16, paddingBottom: 60 }}>
            <SettingsPage
              form={form} setForm={setForm} user={user}
              saveProfileToSupabase={saveProfileToSupabase}
              onBack={() => setStep(STEP.HOME)}
              showToast={showToast}
              responseStyle={responseStyle}
              onStyleChange={(val) => saveSettings({ responseStyle: val })}
              instantTyping={instantTyping}
              onInstantTypingChange={(val) => saveSettings({ instantTyping: val })}
              sidebarPrefs={sidebarPrefs}
              onSidebarPrefsChange={(prefs) => {
                setSidebarPrefs(prefs);
                if (user?.id) saveAnalysisCache(user.id, 'sidebar_prefs', JSON.stringify(prefs));
              }}
              lifeStage={lifeStage}
              onLifeStageChange={(val) => saveSettings({ lifeStage: val })}
              fontSize={fontSize}
              onFontSizeChange={(val) => saveSettings({ fontSize: val })}
            />
            </div>
          </div>
        </Suspense>
      )}

      {/* DIARY_LIST */}
      {step === STEP.DIARY_LIST && (
        <Suspense fallback={<PageSpinner />}>
          <DiaryListPage user={user} setStep={setStep} onSelectEntry={(date) => setDiaryViewDate(date)} />
        </Suspense>
      )}

      {/* SAJU_CARD */}
      {step === STEP.SAJU_CARD && (
        <Suspense fallback={<PageSpinner />}>
          <SajuCardPage form={form} saju={saju} sun={sun} setStep={setStep} showToast={showToast} />
        </Suspense>
      )}

      {/* INQUIRY */}
      {step === STEP.INQUIRY && (
        <Suspense fallback={<PageSpinner />}>
          <InquiryPage />
        </Suspense>
      )}

      {/* TODAY_DETAIL */}
      {step === STEP.TODAY_DETAIL && (
        <TodayDetailPage
          dailyResult={dailyResult} dailyLoading={dailyLoading}
          dailyCount={dailyCount} DAILY_MAX={DAILY_MAX}
          gamificationState={gamificationState}
          onBlockBadtime={handleBlockBadtime} isBlockingBadtime={isBlockingBadtime}
          setStep={setStep} onRefresh={askDailyHoroscope} onSpendBp={spendBP} showToast={showToast} callApi={callApi}
        />
      )}

      {/* DREAM */}
      {step === STEP.DREAM && (
        <Suspense fallback={<PageSpinner />}>
          <DreamPage user={user} form={form} buildCtx={buildCtx} callApi={callApi} setStep={setStep} showToast={showToast} consentFlags={consentFlags} onShareCard={handleShareDreamCard} />
        </Suspense>
      )}

      {/* TAEGIL */}
      {step === STEP.TAEGIL && (
        <Suspense fallback={<PageSpinner />}>
          <TaegillPage form={form} buildCtx={buildCtx} callApi={callApi} showToast={showToast} onShareCard={handleShareTaegilCard} user={user} consentFlags={consentFlags} />
        </Suspense>
      )}

      {/* NAME_FORTUNE */}
      {step === STEP.NAME_FORTUNE && (
        <Suspense fallback={<PageSpinner />}>
          <NameFortunePage form={form} buildCtx={buildCtx} callApi={callApi} showToast={showToast} user={user} consentFlags={consentFlags} />
        </Suspense>
      )}

      {/* MY_PAGE */}
      {step === STEP.MY_PAGE && (
        <Suspense fallback={<PageSpinner />}>
          <MyPage onFreeRecharge={handleFreeRecharge} freeRechargeAvailable={freeRechargeAvailable} onFreezeStreak={freezeStreak} />
        </Suspense>
      )}

      {/* STATS */}
      {step === STEP.STATS && (
        <Suspense fallback={<PageSpinner />}>
          <StatsPage callApi={callApi} />
        </Suspense>
      )}

      {/* COMMUNITY */}
      {step === STEP.COMMUNITY && (
        <Suspense fallback={<PageSpinner />}>
          <CommunityPage showToast={showToast} dailyResult={dailyResult} />
        </Suspense>
      )}

      {/* DAEUN */}
      {step === STEP.DAEUN && (
        <Suspense fallback={<PageSpinner />}>
          <DaeunPage form={form} saju={saju} callApi={callApi} buildCtx={buildCtx} showToast={showToast} />
        </Suspense>
      )}

      {/* SHOP */}
      {step === STEP.SHOP && (
        <Suspense fallback={<PageSpinner />}>
          <ShopPage showToast={showToast} />
        </Suspense>
      )}

      {/* ANON_COMPAT */}
      {step === STEP.ANON_COMPAT && (
        <Suspense fallback={<PageSpinner />}>
          <AnonCompatPage showToast={showToast} shareData={anonCompatShareData} />
        </Suspense>
      )}

      {/* SPECIAL_READING */}
      {step === STEP.SPECIAL_READING && (
        <Suspense fallback={<PageSpinner />}>
          <SpecialReadingPage callApi={callApi} showToast={showToast} consentFlags={consentFlags} />
        </Suspense>
      )}

      {/* TAROT */}
      {step === STEP.TAROT && (
        <Suspense fallback={<PageSpinner />}>
          <TarotPage callApi={callApi} buildCtx={buildCtx} showToast={showToast} consentFlags={consentFlags} />
        </Suspense>
      )}

      {/* LETTER */}
      {step === STEP.LETTER && (
        <Suspense fallback={<PageSpinner />}>
          <ByeolsoomLetterPage showToast={showToast} />
        </Suspense>
      )}

      {/* YEARLY_REPORT */}
      {step === STEP.YEARLY_REPORT && (
        <Suspense fallback={<PageSpinner />}>
          <YearlyReportPage form={form} buildCtx={buildCtx} showToast={showToast} spendBP={spendBP} currentBp={gamificationState?.currentBp || 0} setStep={setStep} />
        </Suspense>
      )}

      {/* MISSIONS */}
      {step === STEP.MISSIONS && (
        <Suspense fallback={<PageSpinner />}>
          <MissionPage onCompleteMission={handleCompleteMission} hasDiaryToday={hasDiaryToday} />
        </Suspense>
      )}

      {/* GROWTH_DASHBOARD */}
      {step === STEP.GROWTH_DASHBOARD && (
        <Suspense fallback={<PageSpinner />}>
          <GrowthDashboardPage onRechargeFreeBP={handleFreeRecharge} />
        </Suspense>
      )}

      {/* BYEOLSOOM_SPACE */}
      {step === STEP.BYEOLSOOM_SPACE && (
        <Suspense fallback={<PageSpinner />}>
          <ByeolsoomSpacePage />
        </Suspense>
      )}

      {/* ITEM_INVENTORY */}
      {step === STEP.ITEM_INVENTORY && (
        <Suspense fallback={<PageSpinner />}>
          <ItemInventoryPage showToast={showToast} callApi={callApi} spendBP={spendBP} />
        </Suspense>
      )}

      {/* LOTTO */}
      {step === STEP.LOTTO && (
        <Suspense fallback={<PageSpinner />}>
          <LottoPage consentFlags={consentFlags} spendBP={spendBP} showToast={showToast} />
        </Suspense>
      )}

      {/* GACHA */}
      {step === STEP.GACHA && (
        <Suspense fallback={<PageSpinner />}>
          <GachaPage showToast={showToast} />
        </Suspense>
      )}

      {/* SAJU_STORY */}
      {step === STEP.SAJU_STORY && (
        <Suspense fallback={<PageSpinner />}>
          <SajuStoryPage callApi={callApi} showToast={showToast} />
        </Suspense>
      )}

      {/* REPORT */}
      {step === STEP.REPORT && (
        <ReportStep
          form={form} today={today}
          reportText={reportText} reportLoading={reportLoading}
          genReport={genReport} shareCard={shareCard} shareResult={shareResult}
          saveReportImage={handleSaveReportImage}
        />
      )}

      <div style={{ fontSize: '10px', color: 'var(--t4)', textAlign: 'center', padding: '20px 20px 40px', letterSpacing: '0.02em' }}>
        별숨의 모든 운세 및 점술 콘텐츠는 엔터테인먼트 목적이며, 결과에 따른 법적 책임을 지지 않습니다.
      </div>

      </motion.div>
      </AnimatePresence>
    </div>
  );
}

