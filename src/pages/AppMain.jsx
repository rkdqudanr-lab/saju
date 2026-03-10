export default function App(){
  const[isDark,setIsDark]=useState(false);
  // ── 사이드바 / 히스토리 ──
  const[showSidebar,setShowSidebar]=useState(false);
  const[histItem,setHistItem]=useState(null);
  const[histItems,setHistItems]=useState(()=>loadHistory());
  const timeSlot=useMemo(()=>getTimeSlot(),[]);
  const[showUpgradeModal,setShowUpgradeModal]=useState(false);
  const[showOtherProfileModal,setShowOtherProfileModal]=useState(false);
  // 다른 사람 프로필 (최대 3개) — {name,by,bm,bd,bh,gender,noTime}[]
  const[otherProfiles,setOtherProfiles]=useState(()=>{
    try{const s=localStorage.getItem('byeolsoom_others');return s?JSON.parse(s):[];}catch{return[];}
  });
  const[activeProfileIdx,setActiveProfileIdx]=useState(0); // 0=나, 1~3=다른 사람
  const[otherForm,setOtherForm]=useState({name:'',by:'',bm:'',bd:'',bh:'',gender:'',noTime:false});
  // ── 카카오 유저 ──
  const[user,setUser]=useState(()=>{
    try{const u=localStorage.getItem('byeolsoom_user');return u?JSON.parse(u):null;}catch{return null;}
  });
  // ── 개인화 프로필 (연인/직장) ──
  const[profile,setProfile]=useState(()=>{
    try{const p=localStorage.getItem('byeolsoom_extra');return p?JSON.parse(p):{partner:'',partnerBy:'',partnerBm:'',partnerBd:'',workplace:'',worryText:''};}catch{return{partner:'',partnerBy:'',partnerBm:'',partnerBd:'',workplace:'',worryText:''};}
  });
  const[showProfileModal,setShowProfileModal]=useState(false);
  // ── 결제 ──
  const[payToast,setPayToast]=useState(null);
  const[step,setStep]=useState(0); // 0랜딩 1입력 2질문 3로딩 4결과 5채팅 6리포트 7궁합 8편지 9히스토리
  // ── 랜딩 퀵질문 ──
  const[quickQ,setQuickQ]=useState('');
  const[quickCat,setQuickCat]=useState(0);
  const[form,setForm]=useState(()=>{
    try{
      const saved=localStorage.getItem('byeolsoom_profile');
      if(saved){const p=JSON.parse(saved);return{name:p.name||'',by:p.by||'',bm:p.bm||'',bd:p.bd||'',bh:p.bh||'',gender:p.gender||'',noTime:p.noTime||false};}
    }catch(e){}
    return{name:'',by:'',bm:'',bd:'',bh:'',gender:'',noTime:false};
  });
  const[cat,setCat]=useState(0);
  const[selQs,setSelQs]=useState([]);
  const[diy,setDiy]=useState('');
  const[pkg,setPkg]=useState('free'); // 기본값: 무료 첫 번째 이야기
  const[answers,setAnswers]=useState([]);
  const[openAcc,setOpenAcc]=useState(0);
  const[typedSet,setTypedSet]=useState(new Set()); // 타이핑 완료된 idx 추적
  // 채팅
  const[chatHistory,setChatHistory]=useState([]);
  const[chatInput,setChatInput]=useState('');
  const[chatLoading,setChatLoading]=useState(false);
  const[chatUsed,setChatUsed]=useState(0);
  const[latestChatIdx,setLatestChatIdx]=useState(-1);
  // 리포트
  const[reportText,setReportText]=useState('');
  const[reportLoading,setReportLoading]=useState(false);
  const chatEndRef=useRef(null);
  const today=useMemo(()=>getTodayInfo(),[]);



  // ── 카카오 SDK 동적 로드 ──
  useEffect(()=>{
    const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;
    if(!JS_KEY){
      console.warn('[별숨] VITE_KAKAO_JS_KEY 환경변수가 없어요. .env.local 확인해주세요.');
      return;
    }
    const initKakao = () => {
      if(window.Kakao && !window.Kakao.isInitialized()){
        window.Kakao.init(JS_KEY);
        console.log('[별숨] 카카오 SDK 초기화 완료');
      }
    };
    if(window.Kakao){
      initKakao();
      return;
    }
    if(document.getElementById('kakao-sdk')){
      // 스크립트 태그는 있지만 아직 로드 중 — onload 대기
      const existing = document.getElementById('kakao-sdk');
      const prev = existing.onload;
      existing.onload = () => { if(prev) prev(); initKakao(); };
      return;
    }
    const script = document.createElement('script');
    script.id = 'kakao-sdk';
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = initKakao;
    script.onerror = () => console.error('[별숨] 카카오 SDK 로드 실패. 네트워크 확인해주세요.');
    document.head.appendChild(script);
  },[]);

  // ── 카카오 로그인 리다이렉트 처리 (code 파라미터) ──
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if(!code) return;
    // URL에서 code 제거
    window.history.replaceState({}, '', window.location.pathname);
    (async()=>{
      try{
        const res = await fetch('/api/kakao-auth', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({code, redirectUri: window.location.origin}),
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error||'인증 실패');
        const userData = {id:String(data.id), nickname:data.nickname||'별님', profileImage:data.profileImage||null};
        setUser(userData);
        localStorage.setItem('byeolsoom_user', JSON.stringify(userData));
      }catch(err){
        console.error('[별숨] 카카오 code 처리 오류:', err);
      }
    })();
  },[]);

  useEffect(()=>{document.documentElement.setAttribute('data-theme',isDark?'dark':'light');},[isDark]);
  useEffect(()=>{
    if(form.by&&form.bm&&form.bd){
      try{localStorage.setItem('byeolsoom_profile',JSON.stringify(form));}catch(e){}
    }
  },[form]);
  useEffect(()=>{
    try{localStorage.setItem('byeolsoom_extra',JSON.stringify(profile));}catch(e){}
  },[profile]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'smooth'});},[step]);
  useEffect(()=>{
    try{localStorage.setItem('byeolsoom_others',JSON.stringify(otherProfiles));}catch{}
  },[otherProfiles]);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[chatHistory,chatLoading]);

  const saju=useMemo(()=>(form.by&&form.bm&&form.bd)?getSaju(+form.by,+form.bm,+form.bd,form.noTime?12:+(form.bh||12)):null,[form]);
  const sun=useMemo(()=>(form.bm&&form.bd)?getSun(+form.bm,+form.bd):null,[form.bm,form.bd]);
  const moon=useMemo(()=>(form.by&&form.bm&&form.bd)?getMoon(+form.by,+form.bm,+form.bd):null,[form.by,form.bm,form.bd]);
  const asc=useMemo(()=>(!form.noTime&&form.bh&&form.bm)?getAsc(+form.bh,+form.bm):null,[form]);
  const age=form.by?today.year-+form.by:0;
  const formOk=form.by&&form.bm&&form.bd&&form.gender&&(form.noTime||form.bh);
  const curPkg=PKGS.find(p=>p.id===pkg)||PKGS[2];
  const maxQ=curPkg.q,maxChat=curPkg.chat,chatLeft=maxChat-chatUsed;

  const addQ=q=>{if(selQs.length<maxQ&&!selQs.includes(q)){setSelQs(p=>[...p,q]);setDiy('');}};
  const rmQ=i=>setSelQs(p=>p.filter((_,x)=>x!==i));

  // 통합 컨텍스트 빌더
  // 사용자 컨텍스트 (서버로 전달)
  // activeProfileIdx에 따라 올바른 프로필로 컨텍스트 생성
  const activeForm = activeProfileIdx===0 ? form : (otherProfiles[activeProfileIdx-1]||form);
  const activeSaju = useMemo(()=>{
    const f=activeForm;
    return (f.by&&f.bm&&f.bd)?getSaju(+f.by,+f.bm,+f.bd,f.noTime?12:+(f.bh||12)):null;
  },[activeForm]);
  const activeSun = useMemo(()=>(activeForm.bm&&activeForm.bd)?getSun(+activeForm.bm,+activeForm.bd):null,[activeForm]);
  const activeAge = activeForm.by?today.year-+activeForm.by:0;

  const buildCtx=useCallback(()=>{
    const af=activeForm;
    const as_=activeSaju;
    const asSun=activeSun;
    let c=`[${af.name||'고객님'} · ${activeAge}세 · ${af.gender||''}]\n\n`;
    if(activeProfileIdx>0) c=`[${af.name||'이 사람'}의 별숨 — 대신 물어봐주는 질문]\n` + c;
    if(as_){
      c+=`[사주 기운]\n`;
      c+=`연주: ${as_.yeon.g}${as_.yeon.j} / 월주: ${as_.wol.g}${as_.wol.j} / 일주: ${as_.il.g}${as_.il.j} / 시주: ${as_.si.g}${as_.si.j}\n`;
      c+=`타고난 기질: ${as_.ilganDesc}\n`;
      c+=`강한 기운: ${ON[as_.dom]} / 약한 기운: ${ON[as_.lac]}\n\n`;
    }
    if(asSun){
      c+=`[별자리 기운]\n`;
      c+=`태양: ${asSun.n}(${asSun.s}) — ${asSun.desc}\n`;
    }
    // 연인 정보
    if(profile.partner){
      c+=`[연인 정보]\n이름: ${profile.partner}\n`;
      if(profile.partnerBy&&profile.partnerBm&&profile.partnerBd){
        try{
          const ps=getSaju(+profile.partnerBy,+profile.partnerBm,+profile.partnerBd,12);
          const psun=getSun(+profile.partnerBm,+profile.partnerBd);
          c+=`연인 사주: 연${ps.yeon.g}${ps.yeon.j} 월${ps.wol.g}${ps.wol.j} 일${ps.il.g}${ps.il.j}\n`;
          c+=`연인 기질: ${ps.ilganDesc} / 강한 기운: ${ON[ps.dom]}\n`;
          c+=`연인 별자리: ${psun.n}(${psun.s})\n\n`;
        }catch(e){}
      }
    }
    // 직장/고민 정보
    if(profile.workplace) c+=`[직장/상황] ${profile.workplace}\n`;
    if(profile.worryText) c+=`[지금 고민] ${profile.worryText}\n`;
    return c;
  },[activeForm,activeSaju,activeSun,activeAge,profile,activeProfileIdx]);

  // API 공통 헬퍼 (프롬프트는 서버 ask.js에서 관리)
  const callApi=useCallback(async(userMessage,opts={})=>{
    const res=await fetch('/api/ask',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        userMessage,
        context:buildCtx(),
        isChat:opts.isChat||false,
        isReport:opts.isReport||false,
      }),
    });
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'API 오류');
    return stripMarkdown(data.text||'');
  },[buildCtx]);

  // ── 공유 이미지 생성 (canvas) ──
  const shareCard=useCallback((idx)=>{
    const q=selQs[idx]||'';
    const text=answers[idx]||'';
    const preview=text.slice(0,120)+'…';
    const canvas=document.createElement('canvas');
    canvas.width=900;canvas.height=520;
    const ctx=canvas.getContext('2d');
    const bg=isDark?'#0D0B14':'#F7F4EF';
    const t1=isDark?'#F0EBF8':'#1A1420';
    const t3=isDark?'#8A7FA0':'#8A7FA0';
    const gold='#E8B048';
    // 배경
    ctx.fillStyle=bg;ctx.fillRect(0,0,900,520);
    // 상단 골드 라인
    ctx.fillStyle=gold;ctx.fillRect(0,0,900,3);
    // 워터마크
    ctx.font='500 22px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=gold;ctx.letterSpacing='0.3em';
    ctx.fillText('byeolsoom  ✦',48,56);
    // 날짜
    ctx.font='400 16px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=t3;
    ctx.fillText(`${today.month}월 ${today.day}일의 이야기`,48,88);
    // 질문
    ctx.font='600 20px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=t1;
    ctx.fillText(q.length>36?q.slice(0,36)+'…':q,48,148);
    // 본문 미리보기
    ctx.font='300 17px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=t3;
    const words=preview.split('');
    let line='',y=200,lineH=32;
    for(const ch of words){
      const test=line+ch;
      if(ctx.measureText(test).width>800){
        ctx.fillText(line,48,y);y+=lineH;line=ch;
        if(y>360){ctx.fillText(line+'…',48,y);line='';break;}
      } else line=test;
    }
    if(line)ctx.fillText(line,48,y);
    // 별자리 칩
    const chips=[];
    if(sun)chips.push(sun.s+' '+sun.n);
    if(saju)chips.push('✦ '+['목','화','토','금','수'][['목','화','토','금','수'].indexOf(saju.dom[0])||0]||'✦');
    ctx.font='500 15px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=gold;
    chips.slice(0,2).forEach((chip,i)=>{
      const w=ctx.measureText(chip).width+24;
      const x=48+i*(w+10);
      ctx.strokeStyle='rgba(232,176,72,0.3)';
      ctx.lineWidth=1;
      ctx.beginPath();ctx.roundRect(x,400,w,30,15);ctx.stroke();
      ctx.fillText(chip,x+12,420);
    });
    // 하단 카피
    ctx.font='400 14px Pretendard,-apple-system,sans-serif';
    ctx.fillStyle=t3;
    ctx.fillText('✦ 별숨이 전하는 오늘의 이야기',48,480);
    // 다운로드
    const a=document.createElement('a');
    a.download=`byeolsoom_${today.month}${today.day}.png`;
    a.href=canvas.toDataURL('image/png');
    a.click();
  },[selQs,answers,isDark,today,sun,saju]);


  // ── 카카오 로그인 ──
  const kakaoLogin=useCallback(()=>{
    const JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

    // ① 환경변수 없음
    if(!JS_KEY){
      alert('카카오 앱 키가 설정되지 않았어요.\n.env.local 에 VITE_KAKAO_JS_KEY 를 입력해주세요.');
      return;
    }

    // ② SDK 자체가 없음 (네트워크 오류 등)
    if(!window.Kakao){
      alert('카카오 SDK를 불러오지 못했어요 🌙\n잠시 후 다시 시도해봐요.');
      return;
    }

    // ③ 초기화 안 됨 → 재시도
    if(!window.Kakao.isInitialized()){
      try{
        window.Kakao.init(JS_KEY);
      }catch(e){
        console.error('[별숨] Kakao.init 실패:', e);
        alert('카카오 초기화에 실패했어요 🌙\n페이지를 새로고침 후 시도해봐요.');
        return;
      }
    }

    // ④ 로그인 실행 — SDK 2.x 방식 (Kakao.Auth.login 삭제됨)
    // getUserInfo로 액세스토큰 직접 획득
    window.Kakao.Auth.authorize({
      redirectUri: window.location.origin,
    });
  },[]);

  const kakaoLogout=useCallback(()=>{
    if(window.Kakao?.Auth) window.Kakao.Auth.logout(()=>{});
    setUser(null);
    localStorage.removeItem('byeolsoom_user');
  },[]);



  // 메인 API 호출 — 병렬 처리 (순차 타임아웃 방지)
  const askClaude=async()=>{
    if(!selQs.length)return;
    setStep(3);setAnswers([]);setTypedSet(new Set());setOpenAcc(0);

    // 모든 질문을 동시에 호출 (순차 시 Vercel 30초 타임아웃 위험)
    const results=await Promise.allSettled(
      selQs.map(q=>callApi(`[질문]\n${q}`))
    );

    const newAnswers=results.map((r,i)=>
      r.status==='fulfilled'
        ? r.value
        : `Q${i+1} 답변을 불러오지 못했어요 🌙\n잠시 후 다시 시도해봐요.`
    );

    setAnswers(newAnswers);
    // 히스토리 저장
    addHistory(selQs,newAnswers);
    setHistItems(loadHistory());
    setLatestChatIdx(-1);
    setStep(4);setOpenAcc(0);
  };

  // 퀵질문 (랜딩에서 바로 질문)
  const askQuick=async(q)=>{
    if(!q.trim())return;
    if(!formOk){
      // 프로필 없으면 입력 먼저
      setSelQs([q.trim()]);
      setStep(1);
      return;
    }
    setSelQs([q.trim()]);
    setStep(3);setAnswers([]);setTypedSet(new Set());setOpenAcc(0);
    try{
      const ans=await callApi(`[질문]\n${q.trim()}`);
      setAnswers([ans]);
      addHistory([q.trim()],[ans]);
      setHistItems(loadHistory());
    }catch{
      setAnswers(['별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.']);
    }
    setStep(4);setOpenAcc(0);
  };

  // 시간대별 오늘의 별숨 ask
  const askTimeSlot=async(prompt)=>{
    if(!formOk){setStep(1);return;}
    const q=TIME_CONFIG[timeSlot].label;
    setSelQs([q]);
    setStep(3);setAnswers([]);setTypedSet(new Set());setOpenAcc(0);
    try{
      const ans=await callApi(`[질문]\n${prompt}`);
      setAnswers([ans]);
      addHistory([q],[ans]);
      setHistItems(loadHistory());
    }catch{
      setAnswers(['별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.']);
    }
    setStep(4);setOpenAcc(0);
  };

  // 저녁 회고
  const askReview=async(text,prompt)=>{
    if(!formOk){setStep(1);return;}
    const q=`오늘 하루 회고: ${text.slice(0,30)}${text.length>30?'…':''}`;
    setSelQs([q]);
    setStep(3);setAnswers([]);setTypedSet(new Set());setOpenAcc(0);
    try{
      const ans=await callApi(`[질문]\n${prompt}\n\n[오늘 있었던 일]\n${text}`);
      setAnswers([ans]);
      addHistory([q],[ans]);
      setHistItems(loadHistory());
    }catch{
      setAnswers(['별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요.']);
    }
    setStep(4);setOpenAcc(0);
  };

  const handleTypingDone=useCallback((idx)=>{
    setTypedSet(p=>{const n=new Set(p);n.add(idx);return n;});
    // ✅ 타이핑 완료: 현재 답변 유지 (닫지 않음)
    // 다음 질문이 있으면 살짝 열었다가(500ms) 다시 닫기 — peek 효과
    const next=idx+1;
    if(next < selQs.length){
      setTimeout(()=>{
        setOpenAcc(next); // 다음 질문 살짝 열기
        setTimeout(()=>{
          setOpenAcc(p=>p===next?-1:p); // 0.8초 후 닫기 (이미 사용자가 바꿨으면 유지)
        },800);
      },400);
    }
  },[selQs.length]);

  const handleAccToggle=i=>{setOpenAcc(p=>p===i?-1:i);};

  // ✅ 더 물어보기 — 제대로 구현 (chatLeft 기반, 이용권 선택 넛지)
  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading)return;
    // 무료 플랜 채팅 소진 시 업그레이드 안내
    if(chatLeft<=0){
      setShowUpgradeModal(true);
      return;
    }
    const userMsg=chatInput.trim();
    setChatInput('');
    setChatHistory(p=>[...p,{role:'user',text:userMsg}]);
    setChatLoading(true);
    setChatUsed(p=>p+1);
    const prevQAs=selQs.map((q,i)=>`[질문 ${i+1}] ${q}\n[답변] ${answers[i]||''}`).join('\n\n');
    const prevChat=chatHistory.map(m=>`[${m.role==='ai'?'별숨':'나'}] ${m.text}`).join('\n');
    const fullMsg=`[이전 상담]\n${prevQAs}\n\n[이전 대화]\n${prevChat}\n\n[새 질문]\n${userMsg}`;
    try{
      const aiText=await callApi(fullMsg,{isChat:true});
      setChatHistory(p=>{
        const updated=[...p,{role:'ai',text:aiText}];
        setLatestChatIdx(updated.length-1);
        return updated;
      });
    }catch{
      setChatHistory(p=>[...p,{role:'ai',text:'앗, 잠깐 연결이 끊겼어요 🌙 다시 시도해봐요!'}]);
    }finally{setChatLoading(false);}
  };

    // 리포트 생성
  const genReport=async()=>{
    setStep(6);setReportText('');setReportLoading(true);
    try{
      const text=await callApi('[요청] 이번 달 종합 운세 리포트',{isReport:true});
      setReportText(text);
    }catch{setReportText('별이 잠시 쉬고 있어요 🌙\n잠시 후 다시 시도해봐요!');}
    finally{setReportLoading(false);}
  };

  // ── 렌더 ──
  return(
    <>
      <style>{CSS}</style>
      <StarCanvas isDark={isDark}/>

      {/* 왼쪽 상단 메뉴 버튼 (항상 표시) */}
      <button className="menu-btn" onClick={()=>setShowSidebar(true)}>☰</button>

      {/* 사이드바 */}
      {showSidebar&&(
        <Sidebar
          user={user} step={step}
          onClose={()=>setShowSidebar(false)}
          onNav={(s,item)=>{
            if(s==='history'&&item){setHistItem(item);setStep(9);}
            else{setStep(s);}
          }}
          onKakaoLogin={kakaoLogin}
          onKakaoLogout={kakaoLogout}
          onProfileOpen={()=>setShowProfileModal(true)}
        />
      )}

      <button className="theme-btn" onClick={()=>setIsDark(p=>!p)}>{isDark?'☀':'◑'}</button>
      {/* 유저 칩 */}
      {/* step>=1 일 때만 상단 칩 표시 (랜딩은 카드로 처리) */}
      {step>=1&&user&&(
        <div className="user-chip" onClick={()=>setShowProfileModal(true)} title="내 정보 수정" style={{cursor:'pointer'}}>
          {user.profileImage?<img src={user.profileImage} alt="프로필"/>:<span style={{fontSize:'1rem'}}>🌙</span>}
          <span>{user.nickname}</span>
        </div>
      )}
      {step>=1&&!user&&(
        <button className="user-chip" onClick={kakaoLogin} style={{border:'1px solid #FEE500',background:'rgba(254,229,0,.1)'}}>
          <span style={{fontSize:'.75rem',color:'var(--t2)'}}>카카오 로그인</span>
        </button>
      )}
      {step>0&&step<5&&step!==9&&<button className="back-btn" onClick={()=>setStep(p=>Math.max(0,p-1))}>←</button>}
      {(step===5||step===6||step===7||step===8)&&<button className="back-btn" onClick={()=>setStep(4)}>←</button>}
      {step===9&&<button className="back-btn" onClick={()=>{setHistItem(null);setStep(0);}}>←</button>}

      <div className="app">

        {/* ══ 0 랜딩 ══ */}
        {step===0&&(
          <div className="page step-fade">
            {/* ═══ HERO ZONE — 첫 화면에서 보이는 전부 ═══ */}
            <div className="land-hero">
              <div className="land-wordmark">byeolsoom</div>
              <div className="land-orb">
                <div className="orb-core"/><div className="orb-r1"/><div className="orb-r2"/>
              </div>
              <p className="land-copy">오늘 밤,<br/><em>당신의 별이 기다리고 있어요.</em></p>
              <p className="land-sub">동양의 별과 서양의 별이 함께<br/>당신의 이야기를 읽어드릴게요</p>

              {/* 로그인 카드 — 히어로에 포함 */}
              <div className="land-login-section">
                {user ? (
                  <div className="land-login-card logged">
                    <div className="llc-top">
                      {user.profileImage
                        ? <img className="llc-avatar" src={user.profileImage} alt="프로필"/>
                        : <div className="llc-avatar-placeholder">🌙</div>}
                      <div>
                        <div className="llc-name">{user.nickname}님 ✦</div>
                        <div className="llc-sub">
                          {form.by && saju
                            ? `${ON[saju.dom]} 기운, 오늘의 별이 기다려요`
                            : '별숨이 당신을 기억하고 있어요'}
                        </div>
                      </div>
                    </div>
                    <div className="llc-profile-chips">
                      {form.by && <span className="llc-chip filled">🀄 사주</span>}
                      {profile.partner && <span className="llc-chip filled">💕 {profile.partner}</span>}
                      {profile.workplace && <span className="llc-chip filled">💼 {profile.workplace.slice(0,10)}{profile.workplace.length>10?'…':''}</span>}
                      {histItems.length>0&&<span className="llc-chip filled" onClick={()=>setShowSidebar(true)}>📖 {histItems.length}개</span>}
                      <span className="llc-chip" onClick={()=>setShowProfileModal(true)}>+ 추가</span>
                    </div>
                    <div className="llc-actions">
                      <button className="cta-main" style={{flex:1,justifyContent:'center'}} onClick={()=>setStep(formOk?2:1)}>
                        {form.by ? '별숨에게 물어보기 ✦' : '지금 시작하기 ✦'}
                      </button>
                      <button className="res-btn" style={{padding:'13px 14px',borderRadius:'var(--r1)'}} onClick={kakaoLogout} title="로그아웃">↩</button>
                    </div>
                  </div>
                ) : (
                  <div className="land-login-card">
                    {/* ── PRIMARY: 바로 시작 ── */}
                    <button className="land-start-primary" onClick={()=>setStep(1)}>
                      ✦ 지금 바로 물어보기
                    </button>

                    {/* ── 로그인 혜택 안내 ── */}
                    <div className="land-login-why">
                      연인 운세 · 직장 조언 · 기록 저장
                    </div>

                    {/* ── SECONDARY: 카카오 로그인 ── */}
                    <button className="land-kakao-secondary" onClick={kakaoLogin}>
                      <span className="kakao-icon-wrap">
                        <svg width="12" height="11" viewBox="0 0 18 18" fill="none">
                          <path d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.38c0 2.1 1.38 3.93 3.45 4.98L4.2 15l3.54-2.34c.39.06.81.09 1.26.09 4.14 0 7.5-2.64 7.5-5.88S13.14 1.5 9 1.5z" fill="#191919"/>
                        </svg>
                      </span>
                      카카오로 로그인하면 기록이 저장돼요
                    </button>

                    {import.meta.env.DEV&&(
                      <div style={{marginTop:8,padding:'8px 10px',background:'rgba(255,100,100,.08)',border:'1px solid rgba(255,100,100,.2)',borderRadius:8,fontSize:'var(--xs)',color:'#ff8080',lineHeight:1.7}}>
                        🔧 개발 환경 체크<br/>
                        키 설정: {import.meta.env.VITE_KAKAO_JS_KEY?'✅ 있음':'❌ 없음'}<br/>
                        SDK: {typeof window!=='undefined'&&window.Kakao?'✅ 로드됨':'⏳ 로딩 중'}<br/>
                        초기화: {typeof window!=='undefined'&&window.Kakao?.isInitialized?.()===true?'✅ 완료':'⏳ 대기'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 스크롤 힌트 */}
              <div className="land-scroll-hint">
                <span>✦</span>
              </div>
            </div>

            {/* ═══ SCROLL ZONE — 스크롤해야 보이는 부가 콘텐츠 ═══ */}
            <div className="inner land-scroll-zone">

              {/* 오늘의 별숨 — 시간대별 접힌 카드 */}
              <TodayByeolsoom
                slot={timeSlot}
                name={form.name||user?.nickname||''}
                saju={saju}
                sun={sun}
                onAsk={askTimeSlot}
                onReview={askReview}
              />

              {/* 퀵질문 입력창 */}
              <div className="land-quick-section">
                <div className="land-quick-label">✦ &nbsp; 별숨에게 바로 물어봐요</div>
                <div className="land-cat-chips">
                  {CATS.map((c,i)=>(
                    <button key={c.id} className={`land-cat-chip ${quickCat===i?'on':''}`} onClick={()=>setQuickCat(i)}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
                <div className="land-sugg-chips">
                  {CATS[quickCat].qs.slice(0,3).map((q,i)=>(
                    <button key={i} className="land-sugg-chip" onClick={()=>setQuickQ(q)}>
                      {q.length>24?q.slice(0,24)+'…':q}
                    </button>
                  ))}
                </div>
                <div className="land-quick-inp-row">
                  <input className="land-quick-inp"
                    placeholder={TIME_CONFIG[timeSlot].inputPlaceholder}
                    value={quickQ}
                    onChange={e=>setQuickQ(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&quickQ.trim())askQuick(quickQ);}}/>
                  <button className="land-quick-send" disabled={!quickQ.trim()} onClick={()=>askQuick(quickQ)}>✦</button>
                </div>
                <button className="land-ghost-link" onClick={()=>setStep(formOk?2:1)}>
                  질문 여러 개 한꺼번에 하기 →
                </button>
              </div>

              {/* 샘플 미리보기 */}
              <SamplePreview/>

              {/* 오늘의 한마디 */}
              <div className="daily-word">
                <div className="daily-label">✦ {today.month}월 {today.day}일의 별 메시지</div>
                <div className="daily-text">{'"'+getDailyWord(today.day)+'"'}</div>
              </div>

              {/* 리뷰 */}
              <div className="rev-wrap">
                <div className="rev-track">
                  {REVIEWS.map((r,i)=>(
                    <div key={i} className="rev-card">
                      <div className="rev-stars">{r.star}</div>
                      <div className="rev-text">{'"'+r.text+'"'}</div>
                      <div className="rev-nick">{r.nick}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
        {/* ══ 1 정보 입력 ══ */}
        {step===1&&(
          <div className="page step-fade">
            <div className="inner">
              <div className="step-dots">
                {[0,1,2].map(i=><div key={i} className={`dot ${i===0?'active':'todo'}`}/>)}
              </div>

              {/* ── 이미 프로필 있으면: 프로필 선택 카드 ── */}
              {formOk&&(
                <div className="card" style={{marginBottom:'var(--sp2)'}}>
                  <div className="card-title" style={{fontSize:'var(--md)'}}>누구의 별숨을 볼까요?</div>

                  {/* 나 */}
                  <div className={`profile-pick-card ${activeProfileIdx===0?'active':''}`}
                    onClick={()=>setActiveProfileIdx(0)}>
                    <div className="ppc-left">
                      <div className="ppc-av">{user?.profileImage?<img src={user.profileImage} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>:'🌙'}</div>
                      <div>
                        <div className="ppc-name">{form.name||user?.nickname||'나'}</div>
                        <div className="ppc-sub">{form.by&&sun?`${sun.s} ${sun.n} · ${ON[saju?.dom||'금']} 기운`:'내 정보'}</div>
                      </div>
                    </div>
                    {activeProfileIdx===0&&<span style={{color:'var(--gold)'}}>✦</span>}
                  </div>

                  {/* 다른 사람 프로필들 */}
                  {otherProfiles.map((p,i)=>{
                    const pSaju=p.by&&p.bm&&p.bd?getSaju(+p.by,+p.bm,+p.bd,p.noTime?12:+(p.bh||12)):null;
                    const pSun=p.bm&&p.bd?getSun(+p.bm,+p.bd):null;
                    return(
                      <div key={i} className={`profile-pick-card ${activeProfileIdx===i+1?'active':''}`}
                        onClick={()=>setActiveProfileIdx(i+1)}>
                        <div className="ppc-left">
                          <div className="ppc-av" style={{background:'var(--bg3)'}}>✦</div>
                          <div>
                            <div className="ppc-name">{p.name||'이름 없음'}</div>
                            <div className="ppc-sub">{pSun?`${pSun.s} ${pSun.n}`:'생년월일 있음'}</div>
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          {activeProfileIdx===i+1&&<span style={{color:'var(--gold)'}}>✦</span>}
                          <button style={{padding:'3px 8px',borderRadius:6,border:'1px solid var(--line)',background:'transparent',color:'var(--t4)',fontSize:'var(--xs)',fontFamily:'var(--ff)',cursor:'pointer'}}
                            onClick={e=>{e.stopPropagation();setOtherProfiles(p=>p.filter((_,j)=>j!==i));if(activeProfileIdx===i+1)setActiveProfileIdx(0);}}>삭제</button>
                        </div>
                      </div>
                    );
                  })}

                  {/* 다른 사람 추가 버튼 (최대 3명) */}
                  {otherProfiles.length<3&&(
                    <button className="res-btn" style={{width:'100%',marginTop:8,padding:12}}
                      onClick={()=>setShowOtherProfileModal(true)}>
                      + 다른 사람의 별숨 추가 (최대 3명)
                    </button>
                  )}

                  <button className="btn-main" style={{marginTop:'var(--sp3)'}}
                    onClick={()=>{setSelQs([]);setStep(2);}}>
                    {activeProfileIdx===0?`${form.name||'나'}의 별숨 보기 ✦`:`${otherProfiles[activeProfileIdx-1]?.name||'이 사람'}의 별숨 보기 ✦`}
                  </button>
                </div>
              )}

              {/* ── 정보 없으면: 기본 입력 폼 ── */}
              {!formOk&&(
              <div className="card">
                <div className="card-title">반가워요 🌙</div>
                <div className="card-sub">생년월일만 있으면 사주와 별자리를 함께 읽어드릴게요</div>

                <label className="lbl">이름 (선택)</label>
                <input className="inp" placeholder="뭐라고 불러드릴까요?" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>

                <label className="lbl">생년월일</label>
                <div className="row" style={{marginBottom:'var(--sp3)'}}>
                  <div className="col"><input className="inp" placeholder="1998" maxLength={4} inputMode="numeric" pattern="[0-9]*" value={form.by} onChange={e=>setForm(f=>({...f,by:e.target.value.replace(/\D/,'')}))} style={{marginBottom:0}}/></div>
                  <div className="col"><select className="inp" value={form.bm} onChange={e=>setForm(f=>({...f,bm:e.target.value}))} style={{marginBottom:0}}><option value="">월</option>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}</select></div>
                  <div className="col"><select className="inp" value={form.bd} onChange={e=>setForm(f=>({...f,bd:e.target.value}))} style={{marginBottom:0}}><option value="">일</option>{[...Array(31)].map((_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}</select></div>
                </div>

                <div className="toggle-row" onClick={()=>setForm(f=>({...f,noTime:!f.noTime,bh:''}))}>
                  <button className={`toggle ${form.noTime?'on':'off'}`} onClick={e=>e.stopPropagation()}/>
                  <span className="toggle-label">태어난 시간을 몰라요</span>
                </div>
                {!form.noTime&&(
                  <>
                    <label className="lbl">태어난 시각</label>
                    <select className="inp" value={form.bh} onChange={e=>setForm(f=>({...f,bh:e.target.value}))}>
                      <option value="">시각 선택</option>
                      {[...Array(24)].map((_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00 ~ {String(i+1).padStart(2,'0')}:00</option>)}
                    </select>
                  </>
                )}
                <label className="lbl">성별</label>
                <div className="gender-group">
                  {['여성','남성','기타'].map(g=>(
                    <button key={g} className={`gbtn ${form.gender===g?'on':''}`} onClick={()=>setForm(f=>({...f,gender:g}))}>{g}</button>
                  ))}
                </div>

                {saju&&(
                  <div className="pillars-wrap">
                    <div className="pillars-hint"><span style={{color:'var(--gold)'}}>✦</span> 사주 원국</div>
                    <div className="pillars">
                      {[['연','yeon'],['월','wol'],['일','il'],['시','si']].map(([l,k])=>(
                        <div key={l} className="pillar">
                          <div className="p-lbl">{l}주</div>
                          <div className="p-hj">{saju[k].gh}</div>
                          <div className="p-hj">{saju[k].jh}</div>
                          <div className="p-kr">{saju[k].g}{saju[k].j}</div>
                        </div>
                      ))}
                    </div>
                    <div className="oh-bar">
                      {Object.entries(saju.or).map(([k,v])=>v>0&&<div key={k} className="oh-seg" style={{flex:v,background:OC[k]}}/>)}
                    </div>
                    <div className="oh-tags">
                      {Object.entries(saju.or).map(([k,v])=>v>0&&(
                        <span key={k} className="oh-tag" style={{background:`${OC[k]}18`,color:OC[k],border:`1px solid ${OC[k]}28`}}>{OE[k]} {ON[k]} {v}</span>
                      ))}
                    </div>
                    <div className="il-preview">{saju.ilganDesc}</div>
                  </div>
                )}
                {sun&&(
                  <div className="astro-preview">
                    <div className="a-chip">{sun.s} {sun.n}</div>
                    {moon&&<div className="a-chip">🌙 달 {moon.n}</div>}
                    {asc&&<div className="a-chip">↑ 상승 {asc.n}</div>}
                  </div>
                )}
                <button className="btn-main" disabled={!formOk} onClick={()=>{setSelQs([]);setStep(2);}}>다음 단계 →</button>
              </div>
              )}
            </div>
          </div>
        )}
        {/* ══ 2 질문 선택 ══ */}
        {step===2&&(
          <div className="page">
            <div className="inner">
              <div className="step-dots">
                {[0,1,2].map(i=><div key={i} className={`dot ${i<1?'done':i===1?'active':'todo'}`}/>)}
              </div>
              <div className="q-shell">

                {/* ── 사주×별자리 통합 배너 + 시간대별 오늘의 별숨 ── */}
                <div className="combo-banner">
                  <div className="combo-title">✦ 사주 × 별자리 통합 분석</div>
                  <div className="combo-sub">
                    {activeProfileIdx===0
                      ? (saju&&sun?`${ON[saju.dom]} 기운의 ${sun.n} · 달 ${moon?.n||''}`:'동양과 서양의 별이 함께 읽어드려요')
                      : (()=>{
                          const op=otherProfiles[activeProfileIdx-1];
                          if(!op) return '동양과 서양의 별이 함께 읽어드려요';
                          const os=op.by&&op.bm&&op.bd?getSaju(+op.by,+op.bm,+op.bd,op.noTime?12:+(op.bh||12)):null;
                          const osun=op.bm&&op.bd?getSun(+op.bm,+op.bd):null;
                          return os&&osun?`${op.name||'이 사람'} · ${ON[os.dom]} 기운의 ${osun.n}`:`${op.name||'이 사람'}의 별숨`;
                        })()
                    }
                  </div>
                  {/* 시간대별 오늘의 별숨 인라인 표시 */}
                  <div style={{marginTop:10,padding:'10px 14px',background:TIME_CONFIG[timeSlot].bg,borderRadius:'var(--r1)',border:`1px solid ${TIME_CONFIG[timeSlot].border}`,display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:'1.1rem'}}>{TIME_CONFIG[timeSlot].emoji}</span>
                    <div>
                      <div style={{fontSize:'var(--xs)',color:TIME_CONFIG[timeSlot].color,fontWeight:600,marginBottom:2}}>{TIME_CONFIG[timeSlot].label}</div>
                      <div style={{fontSize:'var(--xs)',color:'var(--t3)',lineHeight:1.5}}>{TIME_CONFIG[timeSlot].greeting(activeProfileIdx===0?form.name:otherProfiles[activeProfileIdx-1]?.name||'')}</div>
                    </div>
                  </div>
                </div>

                {/* ── ① 직접 입력 (맨 위) ── */}
                <div className="diy-wrap" style={{marginBottom:'var(--sp2)'}}>
                  <div style={{fontSize:'var(--xs)',color:'var(--gold)',fontWeight:600,marginBottom:6,letterSpacing:'.06em'}}>✦ 직접 물어보기</div>
                  <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                    <textarea className="diy-inp" style={{flex:1,marginBottom:0}}
                      placeholder="직접 묻고 싶은 게 있어요? 자유롭게 써봐요 🌙"
                      maxLength={200} value={diy} onChange={e=>setDiy(e.target.value)}/>
                    <button
                      style={{padding:'11px 16px',borderRadius:'var(--r1)',border:'1px solid var(--acc)',background:diy.trim()&&selQs.length<maxQ?'var(--goldf)':'var(--bg2)',color:diy.trim()&&selQs.length<maxQ?'var(--gold)':'var(--t4)',fontFamily:'var(--ff)',fontSize:'var(--sm)',fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',transition:'all .2s',flexShrink:0,height:80}}
                      disabled={!diy.trim()||selQs.length>=maxQ}
                      onClick={()=>{if(diy.trim()&&selQs.length<maxQ){addQ(diy.trim());setDiy('');}}}>
                      추가
                    </button>
                  </div>
                  <div className="diy-row"><span className="hint">{diy.length}/200</span></div>
                </div>

                {/* ── ② 카테고리 탭 ── */}
                <div style={{fontSize:'var(--xs)',color:'var(--t4)',marginBottom:6,letterSpacing:'.06em'}}>또는 고민 카테고리에서 골라봐요</div>
                <div className="cat-tabs">
                  {CATS.map((c,i)=><button key={c.id} className={`cat-tab ${cat===i?'on':''}`} onClick={()=>setCat(i)}>{c.icon} {c.label}</button>)}
                </div>

                {/* ── 빠른 추천 칩 (상위 3개) ── */}
                {selQs.length<maxQ&&(
                  <div>
                    <div style={{fontSize:'var(--xs)',color:'var(--gold)',fontWeight:600,margin:'10px 0 6px',letterSpacing:'.04em'}}>✦ 이런 질문 어때요?</div>
                    <div className="suggest-row">
                      {CATS[cat].qs.slice(0,3).filter(q=>!selQs.includes(q)).map((q,i)=>(
                        <button key={i} className="suggest-chip" onClick={()=>addQ(q)}>
                          {q.length>22?q.slice(0,22)+'…':q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="q-list">
                  {CATS[cat].qs.map((q,i)=>{
                    const on=selQs.includes(q);
                    return<button key={i} className={`q-item ${on?'on':''}`}
                      disabled={!on&&selQs.length>=maxQ}
                      onClick={()=>on?rmQ(selQs.indexOf(q)):addQ(q)}>{q}</button>;
                  })}
                </div>

                {/* ── ③ 선택된 질문 목록 ── */}
                {selQs.length>0&&(
                  <div className="sel-qs">
                    <div className="sel-lbl">선택한 질문 ({selQs.length}/{maxQ})</div>
                    {selQs.map((q,i)=>(
                      <div key={i} className="sel-item">
                        <span className="sel-n">{i+1}</span>
                        <span className="sel-t">{q}</span>
                        <button className="sel-del" onClick={()=>rmQ(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── ④ 이용권: 무료 첫 질문 체계 ── */}
                {pkg==='free'?(
                  <div style={{padding:'var(--sp2) var(--sp3)',background:'var(--goldf)',border:'1px solid var(--acc)',borderRadius:'var(--r2)',margin:'var(--sp2) 0',textAlign:'center'}}>
                    <div style={{fontSize:'var(--sm)',fontWeight:700,color:'var(--gold)',marginBottom:4}}>🌙 첫 번째 이야기는 무료예요</div>
                    <div style={{fontSize:'var(--xs)',color:'var(--t3)',lineHeight:1.7}}>답변을 보고 나서 더 궁금하면 그때 이용권을 선택해요<br/>지금은 부담없이 시작해봐요</div>
                  </div>
                ):(
                  <div className="pkg-sec">
                    <div className="pkg-lbl">이용권</div>
                    <div className="pkgs">
                      {PKGS.map(p=>p.isFree?null:(
                        <div key={p.id} className={`pkg ${pkg===p.id?'chosen':''}`}
                          onClick={()=>{setPkg(p.id);if(selQs.length>p.q)setSelQs(s=>s.slice(0,p.q));}}>
                          {p.hot&&<div className="pkg-hot">BEST</div>}
                          <div className="pkg-e">{p.e}</div>
                          <div className="pkg-n">{p.n}</div>
                          <div className="pkg-p">{p.p}</div>
                        </div>
                      ))}
                    </div>
                    <button style={{background:'none',border:'none',color:'var(--t4)',fontSize:'var(--xs)',fontFamily:'var(--ff)',cursor:'pointer',textDecoration:'underline',marginTop:6}}
                      onClick={()=>setPkg('free')}>↩ 무료로 먼저 시작하기</button>
                  </div>
                )}

                <div className="q-stat">
                  {selQs.length===0&&'질문을 하나 이상 골라봐요'}
                  {selQs.length>0&&selQs.length<maxQ&&<><strong>{maxQ-selQs.length}개</strong> 더 고를 수 있어요</>}
                  {selQs.length===maxQ&&<><strong>준비 완료!</strong> 두 별이 읽어드릴게요 🌟</>}
                </div>
                <button className="btn-main" disabled={!selQs.length} onClick={askClaude}>
                  {selQs.length===0?'질문을 먼저 골라봐요':`✦ 두 별에게 물어보기 (${selQs.length}개)`}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ══ 3 로딩 ══ */}
        {step===3&&<div className="page"><SkeletonLoader qCount={selQs.length} saju={saju}/></div>}

        {/* ══ 4 결과 ══ */}
        {step===4&&(
          <div className="page">
            <div className="res-wrap">
              <div className="res-card">
                {/* ── 상단 공유/복사 바 ── */}
                <div className="res-top-bar">
                  <button className="res-top-btn" onClick={()=>{navigator.clipboard?.writeText(answers.join('\n\n'));alert('복사됐어요 📋');}}>
                    📋 복사
                  </button>
                  {answers[0]&&(
                    <button className="res-top-btn primary" onClick={()=>shareCard(0)}>
                      ↗ 이미지 저장
                    </button>
                  )}
                </div>

                {/* 헤더 */}
                <div className="res-header">
                  <div className="res-av">✦</div>
                  <div>
                    <div className="res-name">{form.name ? `${form.name}에게 전하는 별의 이야기` : '오늘 밤 당신에게 전하는 이야기'}</div>
                    <div className="res-chips">
                      {saju&&<div className="res-chip">🀄 {ON[saju.dom]} 기운</div>}
                      {sun&&<div className="res-chip">{sun.s} {sun.n}</div>}
                      {moon&&<div className="res-chip">🌙 달 {moon.n}</div>}
                      {asc&&<div className="res-chip">↑ {asc.n}</div>}
                      <div className="res-chip">📅 {today.month}월 {today.day}일</div>
                    </div>
                  </div>
                </div>

                {/* 무드 배너 */}
                {sun&&(()=>{
                  const mood=SIGN_MOOD[sun.n]||{color:'var(--gold)',bg:'var(--goldf)',word:'신비로운',emoji:'✦'};
                  return(
                    <div className="mood-banner" style={{background:mood.bg,borderColor:mood.color+'33'}}>
                      <div className="mood-orb" style={{background:mood.color+'22',border:`1px solid ${mood.color}44`}}>{mood.emoji}</div>
                      <div>
                        <div className="mood-label">오늘의 별자리 기운</div>
                        <div className="mood-word" style={{color:mood.color}}>{mood.word} 하루예요</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 별의 한 줄 요약 — [요약] 태그 파싱 ── */}
                {answers[0]&&(()=>{
                  const parsed = parseAccSummary(answers[0]);
                  const summaryStr = parsed.summary;
                  return summaryStr?(
                    <div className="star-summary">
                      <span className="star-summary-icon">✦</span>
                      <span className="star-summary-text">{summaryStr}</span>
                    </div>
                  ):null;
                })()}

                {/* 아코디언 */}
                {selQs.map((q,i)=>(
                  <div key={i}>
                    <AccItem
                      q={q} text={answers[i]||''} idx={i}
                      isOpen={openAcc===i}
                      onToggle={()=>handleAccToggle(i)}
                      shouldType={!typedSet.has(i)}
                      onTypingDone={handleTypingDone}
                    />
                    {/* Q 완료 후 피드백 + 공유 */}
                    {openAcc===i&&typedSet.has(i)&&answers[i]&&(
                      <div style={{padding:'0 var(--sp3) var(--sp2)',borderBottom:'1px solid var(--line)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <FeedbackBtn qIdx={i}/>
                          <button className="res-top-btn" style={{fontSize:'var(--xs)'}} onClick={()=>shareCard(i)}>
                            ↗ Q{i+1} 이미지 저장
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* 액션 */}
                <div className="res-actions">
                  {/* 액션 그리드 — 궁합 · 편지 */}
                  <div className="action-grid" style={{marginBottom:'var(--sp2)'}}>
                    <div className="action-card compat" onClick={()=>setStep(7)}>
                      <div className="action-card-icon">💞</div>
                      <div className="action-card-title">우리가 만나면</div>
                      <div className="action-card-sub">두 사람의 별이 만나는 시나리오</div>
                    </div>
                    <div className="action-card letter" onClick={()=>setStep(8)}>
                      <div className="action-card-icon">💌</div>
                      <div className="action-card-title">별의 편지</div>
                      <div className="action-card-sub">3개월 후 나에게 전하는 이야기</div>
                    </div>
                  </div>

                  {/* 로그인 넛지 */}
                  {!user&&(
                    <div className="kakao-nudge">
                      <span style={{fontSize:'1.1rem'}}>🌙</span>
                      <span className="kakao-nudge-text">로그인하면 연인 운세 · 직장 맞춤 · 내 기록이 모두 저장돼요</span>
                      <button className="kakao-btn" style={{width:'auto',padding:'6px 14px',fontSize:'var(--xs)'}} onClick={kakaoLogin}>카카오 로그인</button>
                    </div>
                  )}

                  <div className="upsell">
                    <div className="up-t">✦ 이번 달 전체 운세가 궁금해요</div>
                    <div className="up-d">연애 · 재물 · 건강 · 직업 종합 분석<br/>사주와 별자리가 함께 쓴 월간 에세이</div>
                    <button className="up-btn" onClick={()=>{
                      genReport();
                    }}>
                      '이달의 운세 리포트 보기 ✦'
                    </button>
                  </div>
                  {maxChat>0&&(
                    <button className="chat-cta" onClick={()=>{
                      if(chatLeft>0){setStep(5);}else{setStep(5);}
                    }} disabled={false}>
                      💬 {chatLeft>0?`더 물어보기 · 남은 ${chatLeft}회`:'더 물어보기 ✦'}
                      <span style={{fontSize:'var(--xs)',color:'var(--t4)'}}>{chatLeft>0?'무료':'무료 이용 중'}</span>
                    </button>
                  )}
                  <div className="res-btns">
                    <button className="res-btn" onClick={()=>{setSelQs([]);setDiy('');setChatHistory([]);setChatUsed(0);setStep(formOk?2:1);}}>다른 질문</button>
                    <button className="res-btn" onClick={()=>setShowSidebar(true)}>지난 이야기</button>
                    <button className="res-btn" onClick={()=>setStep(0)}>홈으로</button>
                  </div>

                  {/* ── 기능 소개 카드 ── */}
                  <div className="feature-guide">
                    <div className="feature-guide-title">✦ 별숨의 다른 기능들</div>
                    <div className="feature-guide-grid">
                      <button className="fg-card" onClick={()=>setStep(7)}>
                        <span className="fg-icon">💞</span>
                        <div className="fg-info">
                          <div className="fg-name">사이 별점</div>
                          <div className="fg-desc">두 사람의 사주+별자리로 관계 시나리오 읽기</div>
                        </div>
                      </button>
                      <button className="fg-card" onClick={()=>setStep(8)}>
                        <span className="fg-icon">💌</span>
                        <div className="fg-info">
                          <div className="fg-name">3개월 후 편지</div>
                          <div className="fg-desc">미래의 내가 지금 나에게 쓴 편지</div>
                        </div>
                      </button>
                      <button className="fg-card" onClick={()=>{genReport();}}>
                        <span className="fg-icon">📜</span>
                        <div className="fg-info">
                          <div className="fg-name">월간 리포트</div>
                          <div className="fg-desc">이달의 연애·재물·직업·건강 에세이</div>
                        </div>
                      </button>
                      <button className="fg-card" onClick={()=>{setStep(5);}}>
                        <span className="fg-icon">💬</span>
                        <div className="fg-info">
                          <div className="fg-name">더 물어보기</div>
                          <div className="fg-desc">답변 기반 후속 상담 채팅</div>
                        </div>
                      </button>
                      <button className="fg-card" onClick={()=>setShowSidebar(true)}>
                        <span className="fg-icon">🗂️</span>
                        <div className="fg-info">
                          <div className="fg-name">지난 이야기</div>
                          <div className="fg-desc">내가 별숨에 물었던 모든 질문 기록</div>
                        </div>
                      </button>
                      <button className="fg-card" onClick={()=>{navigator.clipboard?.writeText(answers.join('\n\n'));alert('복사됐어요 📋');}}>
                        <span className="fg-icon">📋</span>
                        <div className="fg-info">
                          <div className="fg-name">전체 복사</div>
                          <div className="fg-desc">오늘 받은 모든 답변 클립보드 복사</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ 5 추가 질문 (전체화면 채팅) ══ */}
        {step===5&&(
          <div className="page-top">
            <div className="chat-page">
              <div className="chat-page-header">
                <div className="chat-page-title">💬 추가 상담</div>
                <div className="chat-page-sub">
                  {selQs.slice(0,2).map((q,i)=><div key={i} style={{marginTop:3}}>Q{i+1}. {q.length>24?q.slice(0,24)+'…':q}</div>)}
                </div>
                <div className="chat-limit-badge">✦ 남은 횟수 {chatLeft}회</div>
              </div>

              <div className="chat-history">
                {chatHistory.length===0&&(
                  <div style={{color:'var(--t4)',fontSize:'var(--xs)',textAlign:'center',padding:'var(--sp3)'}}>
                    더 궁금한 게 있으면 자유롭게 물어봐요 🌙
                  </div>
                )}
                {chatHistory.map((m,i)=>(
                  <div key={i} className={`chat-msg ${m.role}`}>
                    <div className="chat-role">{m.role==='ai'?'✦ 별숨':'나'}</div>
                    {m.role==='ai'
                      ?<ChatBubble text={m.text} isNew={i===latestChatIdx}/>
                      :<div className="chat-bubble">{m.text}</div>
                    }
                  </div>
                ))}
                {chatLoading&&(
                  <div className="chat-msg ai">
                    <div className="chat-role">✦ 별숨</div>
                    <div className="typing-dots"><span/><span/><span/></div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              {chatLeft>0&&!chatLoading&&(
                <div className="chat-sugg-wrap">
                  {CHAT_SUGG.map((s,i)=><button key={i} className="sugg-btn" onClick={()=>setChatInput(s)}>{s}</button>)}
                </div>
              )}

              <div className="chat-input-area">
                <div className="chat-inp-row">
                  <input className="chat-inp"
                    placeholder={chatLeft>0?'더 궁금한 게 있어요? 🌙':'채팅 횟수를 모두 사용했어요'}
                    value={chatInput}
                    onChange={e=>setChatInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();}}}
                    disabled={chatLeft<=0||chatLoading}/>
                  <button className="chat-send" onClick={sendChat} disabled={!chatInput.trim()||chatLeft<=0||chatLoading}>✦</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ 6 월간 리포트 (전체화면) ══ */}
        {step===6&&(
          <div className="page-top">
            <div className="inner report-page">
              <div className="report-header">
                <div className="report-date">{today.year}년 {today.month}월 · {today.lunar}</div>
                <div className="report-title">{form.name||'당신'}님의<br/>이달의 이야기</div>
                <div className="report-name">사주 × 별자리 통합 운세</div>
              </div>
              {reportLoading?(
                <div style={{textAlign:'center',padding:'var(--sp5)',color:'var(--t3)',fontSize:'var(--sm)'}}>
                  <div style={{fontSize:'2rem',marginBottom:'var(--sp2)'}}>✦</div>
                  두 별이 이달의 이야기를 쓰고 있어요 🌙
                </div>
              ):(
                <ReportBody text={reportText}/>
              )}
            </div>
          </div>
        )}

        {/* ══ 7 시나리오 궁합 ══ */}
        {step===7&&(
          <CompatPage
            myForm={form}
            mySaju={saju}
            mySun={sun}
            callApi={callApi}
            buildCtx={buildCtx}
            onBack={()=>setStep(4)}
          />
        )}

        {/* ══ 8 별의 편지 ══ */}
        {step===8&&(
          <LetterPage
            form={form}
            saju={saju}
            sun={sun}
            moon={moon}
            today={today}
            callApi={callApi}
            buildCtx={buildCtx}
            onBack={()=>setStep(4)}
          />
        )}

        {/* ══ 9 히스토리 상세 ══ */}
        {step===9&&histItem&&(
          <HistoryPage
            item={histItem}
            onBack={()=>{setHistItem(null);setStep(0);}}
            onDelete={(id)=>{deleteHistory(id);setHistItems(loadHistory());}}
          />
        )}


      </div>
      {/* ══ 프로필 모달 ══ */}
      {showProfileModal&&(
        <ProfileModal
          profile={profile}
          setProfile={setProfile}
          onClose={()=>setShowProfileModal(false)}
        />
      )}
      {/* ══ 결제 Toast ══ */}
      {payToast&&<div className={`pay-toast ${payToast.type}`}>{payToast.msg}</div>}

      {/* ══ 업그레이드 모달 (채팅 소진 후) ══ */}
      {showUpgradeModal&&(
        <div className="upgrade-modal-bg" onClick={()=>setShowUpgradeModal(false)}>
          <div className="upgrade-modal" onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:'center',fontSize:'2rem',marginBottom:8}}>✦</div>
            <div className="upgrade-modal-title">더 많이 물어보고 싶어요?</div>
            <div className="upgrade-modal-sub">
              첫 번째 이야기가 마음에 들었다면<br/>더 깊이 대화할 수 있어요
            </div>
            <div className="upgrade-pkgs">
              {PKGS.filter(p=>!p.isFree).map(p=>(
                <div key={p.id} className={`upgrade-pkg ${pkg===p.id?'chosen':''}`}
                  onClick={()=>setPkg(p.id)}>
                  {p.hot&&<div className="upgrade-pkg-hot">BEST</div>}
                  <div className="upgrade-pkg-e">{p.e}</div>
                  <div className="upgrade-pkg-n">{p.n}</div>
                  <div className="upgrade-pkg-p">{p.p}</div>
                  <div className="upgrade-pkg-q">질문 {p.q}개 · 채팅 {p.chat}회</div>
                </div>
              ))}
            </div>
            <button className="btn-main" onClick={()=>{setShowUpgradeModal(false);setStep(5);}}>
              이 이용권으로 계속 대화하기 ✦
            </button>
            <button style={{width:'100%',padding:10,background:'none',border:'none',color:'var(--t4)',fontSize:'var(--xs)',fontFamily:'var(--ff)',cursor:'pointer',marginTop:8}}
              onClick={()=>setShowUpgradeModal(false)}>
              괜찮아요, 나중에 할게요
            </button>
          </div>
        </div>
      )}

      {/* ══ 다른 사람 프로필 추가 모달 ══ */}
      {showOtherProfileModal&&(
        <div className="other-modal-bg" onClick={()=>setShowOtherProfileModal(false)}>
          <div className="other-modal" onClick={e=>e.stopPropagation()}>
            <div className="other-modal-title">다른 사람의 별숨 추가</div>
            <div className="other-modal-sub">가족, 친구, 연인의 생년월일을 입력하면<br/>그 사람의 별숨을 대신 물어볼 수 있어요</div>

            <label className="lbl">이름</label>
            <input className="inp" placeholder="누구의 별숨인가요?" value={otherForm.name}
              onChange={e=>setOtherForm(f=>({...f,name:e.target.value}))}/>

            <label className="lbl">생년월일</label>
            <div className="row" style={{marginBottom:'var(--sp2)'}}>
              <div className="col"><input className="inp" placeholder="1998" maxLength={4} inputMode="numeric"
                value={otherForm.by} onChange={e=>setOtherForm(f=>({...f,by:e.target.value.replace(/\D/,'')}))} style={{marginBottom:0}}/></div>
              <div className="col"><select className="inp" value={otherForm.bm} onChange={e=>setOtherForm(f=>({...f,bm:e.target.value}))} style={{marginBottom:0}}>
                <option value="">월</option>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}</select></div>
              <div className="col"><select className="inp" value={otherForm.bd} onChange={e=>setOtherForm(f=>({...f,bd:e.target.value}))} style={{marginBottom:0}}>
                <option value="">일</option>{[...Array(31)].map((_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}</select></div>
            </div>
            <div className="toggle-row" onClick={()=>setOtherForm(f=>({...f,noTime:!f.noTime,bh:''}))}>
              <button className={`toggle ${otherForm.noTime?'on':'off'}`} onClick={e=>e.stopPropagation()}/>
              <span className="toggle-label">태어난 시간을 몰라요</span>
            </div>
            {!otherForm.noTime&&(
              <select className="inp" value={otherForm.bh} onChange={e=>setOtherForm(f=>({...f,bh:e.target.value}))}>
                <option value="">태어난 시각 (선택)</option>
                {[...Array(24)].map((_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}
              </select>
            )}
            <label className="lbl">성별</label>
            <div className="gender-group">
              {['여성','남성','기타'].map(g=>(
                <button key={g} className={`gbtn ${otherForm.gender===g?'on':''}`} onClick={()=>setOtherForm(f=>({...f,gender:g}))}>{g}</button>
              ))}
            </div>
            <button className="btn-main"
              disabled={!otherForm.by||!otherForm.bm||!otherForm.bd||!otherForm.gender}
              onClick={()=>{
                if(otherProfiles.length>=3)return;
                setOtherProfiles(p=>[...p,{...otherForm}]);
                setOtherForm({name:'',by:'',bm:'',bd:'',bh:'',gender:'',noTime:false});
                setShowOtherProfileModal(false);
              }}>
              추가하기 ✦
            </button>
            <button style={{width:'100%',padding:10,background:'none',border:'none',color:'var(--t4)',fontSize:'var(--xs)',fontFamily:'var(--ff)',cursor:'pointer',marginTop:6}}
              onClick={()=>setShowOtherProfileModal(false)}>취소</button>
          </div>
        </div>
      )}
    </>
  );
}
