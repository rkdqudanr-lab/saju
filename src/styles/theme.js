const CSS = `

@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ff:'Pretendard',-apple-system,sans-serif;
  --bg:#0D0B14;--bg1:#13101E;--bg2:#1A1628;--bg3:#221E33;--bg4:#2A2340;
  --line:rgba(255,255,255,.07);--line2:rgba(255,255,255,.04);
  --t1:#F0EBF8;--t2:#C8BEDE;--t3:#8A7FA0;--t4:#6B6090;
  --gold:#E8B048;--gold2:#C89030;
  --goldf:rgba(232,176,72,.1);--golds:rgba(232,176,72,.05);--acc:rgba(232,176,72,.2);
  --lav:#9B8EC4;--lavf:rgba(155,142,196,.1);--lavacc:rgba(155,142,196,.25);
  --teal:#6BBFB5;--tealf:rgba(107,191,181,.1);--tealacc:rgba(107,191,181,.25);
  --rose:#E87B8A;--rosef:rgba(232,123,138,.1);--roseacc:rgba(232,123,138,.25);
  --sp1:8px;--sp2:16px;--sp3:24px;--sp4:32px;--sp5:48px;--sp6:64px;
  --r1:12px;--r2:20px;--r3:28px;--r4:36px;
  --xl:1.75rem;--lg:1.125rem;--md:0.9375rem;--sm:0.8125rem;--xs:0.6875rem;
  --trans-fast:.15s ease;--trans:.25s ease;--trans-slow:.4s ease;
}
[data-theme="light"]{
  --bg:#F7F4EF;--bg1:#FFFFFF;--bg2:#F0EBE2;--bg3:#E8E0D5;--bg4:#DDD5C8;
  --line:rgba(0,0,0,.07);--line2:rgba(0,0,0,.04);
  --t1:#1A1420;--t2:#4A3F60;--t3:#8A7FA0;--t4:#C0B8CC;
  --gold:#B07820;--gold2:#8A5E14;
  --goldf:rgba(176,120,32,.09);--golds:rgba(176,120,32,.05);--acc:rgba(176,120,32,.18);
}
html,body{background:var(--bg);color:var(--t1);font-family:var(--ff);min-height:100vh;-webkit-font-smoothing:antialiased;transition:background .4s,color .4s}
::-webkit-scrollbar{width:0;height:0}

/* ══ 접근성 (AX) ══ */
.skip-link{position:absolute;top:-100%;left:16px;z-index:9999;padding:8px 16px;background:var(--gold);color:#0D0B14;font-size:var(--sm);font-weight:700;border-radius:0 0 var(--r1) var(--r1);text-decoration:none;transition:top .2s}
.skip-link:focus{top:0}
button:focus-visible,a:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--gold);outline-offset:2px;border-radius:4px}
input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--gold);outline-offset:0}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}

/* ══ 토스트 알림 ══ */
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:999;max-width:340px;width:90%;padding:12px 20px;border-radius:var(--r1);font-size:var(--sm);text-align:center;animation:fadeUp .3s ease;box-shadow:0 8px 32px rgba(0,0,0,.25)}
.toast-error{background:#e05a3a;color:#fff}
.toast-success{background:var(--gold);color:#0D0B14}
.toast-warn{background:var(--rose);color:#fff}
.toast-info{background:var(--bg3);border:1px solid var(--line);color:var(--t1)}

.app{min-height:100vh;position:relative;overflow-x:hidden}
.page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--sp3) var(--sp3) var(--sp5);position:relative;z-index:1}
.page-top{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:72px var(--sp3) var(--sp5);position:relative;z-index:1}
.inner{width:100%;max-width:460px}
.bg-canvas{position:fixed;inset:0;pointer-events:none;z-index:0}

/* 공통 UI */
.theme-btn{position:fixed;top:14px;right:18px;z-index:50;width:44px;height:44px;border-radius:50%;background:var(--bg2);border:1px solid var(--line);color:var(--t3);font-size:.9rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.theme-btn:hover{color:var(--gold);border-color:var(--gold)}
.back-btn{position:fixed;top:14px;left:66px;z-index:50;width:44px;height:44px;border-radius:50%;background:var(--bg2);border:1px solid var(--line);color:var(--t3);font-size:.8rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.back-btn:hover{color:var(--gold)}
.step-dots{display:flex;gap:6px;justify-content:center;margin-bottom:var(--sp3)}
.dot{height:4px;border-radius:2px;transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.dot.done{width:14px;background:var(--t4)}.dot.active{width:28px;background:var(--gold)}.dot.todo{width:4px;background:var(--t4);opacity:.4}

.user-chip{position:fixed;top:18px;right:62px;z-index:50;display:flex;align-items:center;gap:6px;padding:5px 10px 5px 5px;border-radius:50px;background:var(--goldf);border:1px solid var(--acc);cursor:pointer}
.user-chip img{width:22px;height:22px;border-radius:50%;object-fit:cover}
.user-chip span{font-size:var(--xs);color:var(--t2)}

/* ══ LANDING ══ */
.land{text-align:center}
.land-wordmark{font-size:var(--xs);font-weight:300;letter-spacing:.35em;color:var(--t4);text-transform:lowercase;margin-bottom:52px;animation:fadeUp .8s .1s both}
.land-orb{width:120px;height:120px;border-radius:50%;margin:0 auto var(--sp2);position:relative;animation:fadeUp .8s .2s both}
.orb-core{position:absolute;inset:14px;border-radius:50%;background:radial-gradient(circle at 35% 28%,rgba(232,176,72,.75),rgba(190,110,170,.5),rgba(50,30,90,.9),transparent);animation:orbPulse 5s infinite}
.orb-r1{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(232,176,72,.18);animation:orbSpin 14s linear infinite}
.orb-r1::after{content:'';position:absolute;top:-3px;left:50%;width:6px;height:6px;border-radius:50%;background:var(--gold);transform:translateX(-50%);box-shadow:0 0 12px var(--gold),0 0 24px rgba(232,176,72,.4)}
.orb-r2{position:absolute;inset:-16px;border-radius:50%;border:1px solid rgba(232,176,72,.06);animation:orbSpin 22s linear infinite reverse}
.orb-r2::after{content:'';position:absolute;bottom:-3px;right:20%;width:4px;height:4px;border-radius:50%;background:rgba(200,160,255,.7);box-shadow:0 0 8px rgba(200,160,255,.5)}
@keyframes orbPulse{0%,100%{opacity:.88;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
@keyframes orbSpin{to{transform:rotate(360deg)}}
.land-copy{font-size:var(--lg);font-weight:400;color:var(--gold);line-height:1.75;letter-spacing:-.015em;margin-bottom:4px;animation:fadeUp .8s .35s both}
.land-copy em{font-style:normal;color:var(--gold);font-weight:400}
.land-beta-notice{font-size:var(--xs);color:var(--t4);margin-bottom:var(--sp2);animation:fadeUp .8s .42s both;line-height:1.7}
.land-sub{font-size:var(--sm);color:var(--t3);margin-bottom:var(--sp4);animation:fadeUp .8s .45s both;line-height:1.85}
.cta-main{display:inline-flex;align-items:center;gap:.5rem;padding:15px 40px;border:none;border-radius:50px;background:var(--gold);color:#0D0B14;font-size:var(--sm);font-weight:700;font-family:var(--ff);cursor:pointer;letter-spacing:.02em;transition:transform .15s,opacity .15s;animation:fadeUp .8s .55s both}
.cta-main:hover{opacity:.88}
.cta-main:active{transform:scale(.97)}
.land-trust{display:flex;align-items:center;gap:var(--sp2);justify-content:center;margin-top:var(--sp3);font-size:var(--xs);color:var(--t4);animation:fadeUp .8s .65s both}

.land-hero{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100svh;padding:var(--sp3) var(--sp3);gap:8px;position:relative}
.land-scroll-hint{text-align:center;color:var(--t4);font-size:var(--xs);padding:4px 0;animation:fadeUp 1.2s ease 0.8s both}
.land-scroll-hint span{display:inline-block;animation:bounce-y 1.8s ease-in-out infinite}
@keyframes bounce-y{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
.land-scroll-zone{padding:var(--sp4) 0}

.land-login-section{margin:var(--sp3) 0;animation:fadeUp .8s .6s both;width:100%;max-width:460px}
.land-login-card{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);padding:var(--sp3);text-align:left;display:flex;flex-direction:column;gap:14px}
.land-login-card.logged{
  border-color:var(--acc);
  background:linear-gradient(135deg,var(--goldf),rgba(155,142,196,.06));
  box-shadow:0 4px 24px rgba(232,176,72,.08);
}
.llc-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--acc)}
.llc-avatar-placeholder{width:48px;height:48px;border-radius:50%;background:var(--bg2);border:2px solid var(--acc);display:flex;align-items:center;justify-content:center;font-size:1.3rem}
.llc-name{font-size:var(--md);font-weight:700;color:var(--t1)}
.llc-sub{font-size:var(--xs);color:var(--t3);margin-top:3px}

/* 화살표 아래 여백 제거 */
.land-scroll-zone{padding:var(--sp2) 0}

.kakao-login-full{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;border-radius:var(--r1);background:#FEE500;border:none;cursor:pointer;font-family:var(--ff);font-size:var(--sm);font-weight:700;color:#191919;transition:all .2s}
.kakao-login-full:hover{background:#F0D800;transform:translateY(-1px)}
.kakao-login-full:active{transform:scale(.97)}
.kakao-icon-wrap{display:flex;align-items:center;justify-content:center;width:18px;height:18px}

.land-ghost-link{background:none;border:none;color:var(--t4);font-size:var(--xs);cursor:pointer;text-decoration:underline;padding:8px 0;font-family:var(--ff)}
.land-ghost-link:hover{color:var(--gold)}

.daily-word{padding:var(--sp3);background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);margin:var(--sp3) 0;text-align:center;animation:fadeUp .8s .7s both}
.daily-label{font-size:var(--xs);color:var(--gold);font-weight:600;margin-bottom:8px;letter-spacing:.06em}
.daily-text{font-size:var(--sm);color:var(--t2);line-height:1.85}

.rev-wrap{margin-top:var(--sp3);overflow:hidden;animation:fadeUp .8s .75s both}
.rev-track{display:flex;gap:var(--sp2);overflow-x:auto;padding-bottom:4px;scroll-snap-type:x mandatory}
.rev-card{flex-shrink:0;width:210px;scroll-snap-align:start;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2);padding:var(--sp2)}
.rev-stars{font-size:var(--xs);color:var(--gold);margin-bottom:5px;letter-spacing:2px}
.rev-text{font-size:var(--xs);color:var(--t2);line-height:1.75}
.rev-nick{font-size:var(--xs);color:var(--t4);margin-top:5px}

/* ══ CARD (입력) ══ */
.card{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3);padding:var(--sp4) var(--sp3);animation:fadeUp .5s cubic-bezier(.34,1.56,.64,1)}
.card-title{font-size:var(--lg);font-weight:600;color:var(--t1);margin-bottom:5px}
.card-sub{font-size:var(--sm);color:var(--t3);margin-bottom:var(--sp4);line-height:1.75}
.lbl{display:block;font-size:var(--xs);font-weight:600;color:var(--t3);letter-spacing:.06em;margin-bottom:8px}
.inp{width:100%;padding:13px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t1);font-size:max(16px,var(--sm));font-family:var(--ff);transition:border-color .2s,background .2s;margin-bottom:var(--sp3);-webkit-appearance:none}
.inp:focus{outline:none;border-color:var(--gold);background:var(--bg3)}
.inp::placeholder{color:var(--t4)}
select.inp option{background:var(--bg2)}
.row{display:flex;gap:8px}.row .inp{margin-bottom:0}.col{flex:1;min-width:0}
.gender-group{display:flex;gap:8px;margin-bottom:var(--sp3)}
.gbtn{flex:1;padding:11px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t3);font-size:var(--sm);font-family:var(--ff);cursor:pointer;transition:all .2s}
.gbtn.on{background:var(--goldf);border-color:var(--gold);color:var(--gold);font-weight:600}
.gbtn:active{transform:scale(.97)}
.toggle-row{display:flex;align-items:center;gap:var(--sp2);padding:12px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);cursor:pointer;margin-bottom:var(--sp3)}
.toggle{width:40px;height:22px;border-radius:11px;position:relative;flex-shrink:0;transition:background .25s;border:none;cursor:pointer;padding:0}
.toggle.on{background:var(--gold)}.toggle.off{background:var(--bg3)}
.toggle::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:white;top:3px;transition:left .25s cubic-bezier(.34,1.56,.64,1);box-shadow:0 1px 3px rgba(0,0,0,.3)}
.toggle.on::after{left:21px}.toggle.off::after{left:3px}
.toggle-label{font-size:var(--sm);color:var(--t2)}
.pillars-wrap{margin:var(--sp2) 0}
.pillars-hint{font-size:var(--xs);color:var(--t4);letter-spacing:.07em;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.pillars{display:flex;gap:5px}
.pillar{flex:1;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);padding:10px 3px;text-align:center}
.p-lbl{font-size:var(--xs);color:var(--t4);margin-bottom:3px}.p-hj{font-size:1.05rem;color:var(--gold);font-weight:600;line-height:1.2}.p-kr{font-size:var(--xs);color:var(--t3);margin-top:2px}
.oh-bar{display:flex;height:3px;border-radius:2px;gap:2px;margin:12px 0 8px;overflow:hidden}
.oh-seg{border-radius:1px;transition:flex .6s}
.oh-tags{display:flex;gap:4px;flex-wrap:wrap}
.oh-tag{padding:3px 8px;border-radius:6px;font-size:var(--xs);font-weight:600}
.il-preview{margin-top:var(--sp2);font-size:var(--xs);color:var(--t3);line-height:1.85;padding:10px 12px;background:var(--bg2);border-radius:var(--r1);border-left:2px solid var(--gold)}
.astro-preview{margin-top:var(--sp2);display:flex;gap:8px;flex-wrap:wrap}
.a-chip{padding:5px 13px;background:var(--goldf);border:1px solid var(--acc);border-radius:50px;font-size:var(--xs);color:var(--gold);letter-spacing:.01em}
.btn-main{width:100%;padding:14px;border:none;border-radius:var(--r1);background:var(--gold);color:#0D0B14;font-size:var(--sm);font-weight:700;font-family:var(--ff);cursor:pointer;transition:transform .15s,opacity .15s;margin-top:var(--sp2)}
.btn-main:hover{opacity:.88}.btn-main:active{transform:scale(.98)}.btn-main:disabled{opacity:.3;cursor:not-allowed;transform:none}

.profile-pick-card{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--bg1);border:1px solid var(--line);border-radius:var(--r1);cursor:pointer;transition:border-color .15s,background .15s;margin-bottom:8px}
.profile-pick-card:hover{border-color:var(--gold);background:var(--goldf)}
.profile-pick-card.active{border-color:var(--gold);background:var(--goldf)}
.ppc-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.ppc-av{width:36px;height:36px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
.ppc-av img{width:100%;height:100%;object-fit:cover}
.ppc-name{font-size:var(--xs);font-weight:600;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ppc-sub{font-size:10px;color:var(--t4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ══ 질문 선택 ══ */
.q-shell{animation:fadeUp .5s cubic-bezier(.34,1.56,.64,1)}
.combo-banner{background:var(--goldf);border:1px solid var(--acc);border-radius:var(--r2);padding:12px var(--sp2);margin-bottom:var(--sp3);text-align:center}
.combo-title{font-size:var(--sm);font-weight:600;color:var(--gold);margin-bottom:3px}
.combo-sub{font-size:var(--xs);color:var(--t3);line-height:1.6}
.cat-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:var(--sp3)}
.cat-tab{padding:7px 16px;border-radius:50px;border:1px solid var(--line);background:transparent;color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer;white-space:nowrap;transition:all .2s}
.cat-tab.on{background:var(--goldf);border-color:var(--acc);color:var(--gold);font-weight:600}
.q-list{display:flex;flex-direction:column;gap:8px;margin-bottom:var(--sp4)}
.q-item{width:100%;text-align:left;padding:12px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t2);font-size:var(--sm);font-family:var(--ff);cursor:pointer;line-height:1.55;transition:all .2s}
.q-item:hover{border-color:var(--t4);color:var(--t1);transform:translateX(3px)}.q-item.on{background:var(--goldf);border-color:var(--acc);color:var(--gold);font-weight:500}.q-item.on::before{content:'✓  '}.q-item:disabled{opacity:.28;cursor:not-allowed;transform:none}

.suggest-row{display:flex;flex-wrap:wrap;gap:8px;margin:var(--sp2) 0 var(--sp3)}
.suggest-chip{padding:7px 16px;background:var(--bg2);border:1px solid var(--line);border-radius:50px;color:var(--t3);font-size:var(--xs);cursor:pointer;transition:border-color .15s,color .15s,background .15s;font-family:var(--ff)}
.suggest-chip:hover{border-color:var(--gold);color:var(--gold);background:var(--goldf)}

.diy-wrap{margin-bottom:var(--sp3)}
.diy-inp{width:100%;padding:12px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t1);font-size:var(--sm);font-family:var(--ff);resize:none;height:68px;transition:border-color .2s}
.diy-inp:focus{outline:none;border-color:var(--gold)}.diy-inp::placeholder{color:var(--t4)}
.diy-row{display:flex;justify-content:space-between;align-items:center;margin-top:5px}
.diy-add{padding:5px 12px;border-radius:8px;border:1px solid var(--acc);background:transparent;color:var(--gold);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:background .2s}
.diy-add:hover{background:var(--goldf)}
.sel-qs{margin-bottom:var(--sp3)}
.sel-lbl{font-size:var(--xs);color:var(--t4);letter-spacing:.07em;margin-bottom:8px}
.sel-item{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;margin-bottom:8px;background:var(--goldf);border:1px solid var(--acc);border-radius:var(--r1);animation:fadeUp .2s ease}
.sel-n{width:18px;height:18px;border-radius:50%;background:var(--gold);color:#0D0B14;font-size:var(--xs);font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.sel-t{flex:1;font-size:var(--sm);color:var(--t1);line-height:1.5}.sel-del{background:none;border:none;color:var(--t4);cursor:pointer;font-size:.85rem;padding:0;flex-shrink:0;transition:color .2s}.sel-del:hover{color:var(--t2)}
.pkg-sec{margin-bottom:var(--sp3)}.pkg-lbl{font-size:var(--xs);color:var(--t4);letter-spacing:.07em;margin-bottom:8px}
.pkgs{display:flex;gap:8px}
.pkg{flex:1;padding:10px 4px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);text-align:center;cursor:pointer;transition:all .2s;position:relative}
.pkg:hover{border-color:var(--t4)}.pkg.chosen{background:var(--goldf);border-color:var(--gold)}
.pkg-e{font-size:1rem;margin-bottom:2px}.pkg-n{font-size:var(--xs);font-weight:600;color:var(--t2)}.pkg-p{font-size:var(--xs);color:var(--gold);font-weight:700;margin-top:1px}
.pkg-hot{position:absolute;top:-7px;right:-3px;background:var(--gold);color:#0D0B14;font-size:.5rem;font-weight:800;padding:2px 5px;border-radius:4px}
.q-stat{font-size:var(--xs);color:var(--t4);text-align:center;margin:8px 0 var(--sp2)}.q-stat strong{color:var(--gold)}
.free-note{font-size:var(--xs);color:var(--t4);text-align:center;margin-bottom:var(--sp2)}.free-note span{color:var(--gold)}
.hint{font-size:var(--xs);color:var(--t4)}

/* ══ LOADING ══ */
.loading-page{padding:var(--sp4) var(--sp3);width:100%;max-width:460px}
.skel-header{display:flex;align-items:center;gap:var(--sp2);padding:var(--sp3);background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3) var(--r3) 0 0;margin-bottom:2px}
.skel-av{width:48px;height:48px;border-radius:50%;background:var(--bg2)}
.skel-lines{flex:1}
.skel-line{height:10px;border-radius:5px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
.skel-line.w60{width:60%;margin-bottom:8px}.skel-line.w40{width:40%}.skel-line.full{width:100%}.skel-line.w80{width:80%}.skel-line.w55{width:55%}
.skel-body{background:var(--bg1);border:1px solid var(--line);border-top:none;padding:var(--sp3);border-radius:0 0 var(--r3) var(--r3)}
.skel-para{display:flex;flex-direction:column;gap:8px;padding:var(--sp2) 0;border-bottom:1px solid var(--line)}.skel-para:last-child{border-bottom:none}
.skel-status{text-align:center;margin-top:var(--sp3);font-size:var(--sm);color:var(--t3);animation:statusFade .5s ease}
.skel-status-sub{font-size:var(--xs);color:var(--t4);margin-top:5px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes statusFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

.load-orb-wrap{display:flex;justify-content:center;margin:var(--sp4) 0}
.load-orb{width:80px;height:80px;border-radius:50%;position:relative;margin:0 auto}
.load-orb-core{position:absolute;inset:8px;border-radius:50%;background:radial-gradient(circle at 35% 28%,rgba(232,176,72,.6),rgba(155,142,196,.4),rgba(50,30,90,.9));animation:orbPulse 2s infinite}
.load-orb-ring{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(232,176,72,.3);animation:orbSpin 3s linear infinite}
.load-orb-ring2{position:absolute;inset:-8px;border-radius:50%;border:1px dashed rgba(155,142,196,.2);animation:orbSpin 7s linear infinite reverse}
.load-pillars{display:flex;gap:6px;justify-content:center;margin:var(--sp2) 0}
.load-pillar{width:36px;background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:8px 4px;text-align:center;animation:fadeUp .4s ease both}
.load-pillar:nth-child(1){animation-delay:.0s}
.load-pillar:nth-child(2){animation-delay:.1s}
.load-pillar:nth-child(3){animation-delay:.2s}
.load-pillar:nth-child(4){animation-delay:.3s}
.load-p-hj{font-size:.9rem;color:var(--gold);font-weight:600;line-height:1.2}
.load-p-lbl{font-size:.5rem;color:var(--t4);margin-top:2px}

/* ══ RESULT ══ */
.res-wrap{animation:fadeUp .6s cubic-bezier(.34,1.56,.64,1);width:100%;max-width:460px;margin-top:var(--sp2)}
.res-card{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden}

.res-top-bar{display:flex;gap:8px;justify-content:flex-end;padding:var(--sp2) var(--sp2) var(--sp2);margin-bottom:var(--sp1)}
.res-top-btn{padding:8px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t3);font-size:var(--xs);cursor:pointer;display:flex;align-items:center;gap:5px;transition:border-color .15s,color .15s;font-family:var(--ff)}
.res-top-btn:hover{border-color:var(--gold);color:var(--gold)}
.res-top-btn.primary{background:var(--goldf);border-color:var(--gold);color:var(--gold);font-weight:600}

.res-header{display:flex;align-items:flex-start;gap:var(--sp2);padding:var(--sp3) var(--sp4);border-bottom:1px solid var(--line)}
.res-av{width:44px;height:44px;border-radius:50%;background:var(--goldf);border:1px solid var(--acc);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
.res-name{font-size:var(--sm);font-weight:600;color:var(--t1);margin-bottom:4px}
.res-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:2px}
.res-chip{padding:5px 12px;background:var(--bg2);border:1px solid var(--line);border-radius:50px;font-size:var(--xs);color:var(--t3);letter-spacing:.01em}

.mood-banner{padding:16px var(--sp4);display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--line);animation:fadeUp .5s ease}
.mood-orb{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.1rem}
.mood-label{font-size:var(--xs);color:var(--t4);margin-bottom:2px;letter-spacing:.06em}
.mood-word{font-size:var(--sm);font-weight:600}

.star-summary{padding:28px 28px;background:linear-gradient(145deg,var(--goldf),rgba(232,176,72,0.02));border:1.5px solid rgba(232,176,72,0.4);border-radius:var(--r2);margin-bottom:var(--sp4);display:flex;align-items:flex-start;gap:12px;box-shadow:0 4px 20px rgba(232,176,72,0.1);animation:fadeUp .6s ease both}
.star-summary-icon{color:var(--gold);font-size:1.3rem;line-height:1;flex-shrink:0;margin-top:2px}
.star-summary-text{font-size:1.05rem;color:var(--gold);font-weight:600;line-height:1.6;letter-spacing:-0.01em}

/* 아코디언 */
.acc-item{border-bottom:1px solid var(--line)}.acc-item:last-of-type{border-bottom:none}
.acc-trigger{width:100%;text-align:left;padding:20px var(--sp4);background:transparent;border:none;cursor:pointer;color:var(--t2);display:flex;justify-content:space-between;align-items:center;transition:color .2s;gap:var(--sp2)}
.acc-trigger:hover{color:var(--t1)}.acc-trigger.open{color:var(--gold)}
.acc-q-wrap{flex:1;text-align:left}
.acc-q-num{font-size:var(--xs);color:var(--gold);font-weight:700;margin-bottom:2px}
.acc-q-text{font-size:var(--sm);color:inherit;line-height:1.55}
.acc-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.skip-btn{padding:10px 16px;border-radius:8px;border:1px solid var(--acc);background:transparent;color:var(--gold);font-size:var(--xs);font-family:var(--ff);cursor:pointer;white-space:nowrap;transition:background .2s;animation:fadeUp .2s ease;min-height:44px;display:inline-flex;align-items:center}
.skip-btn:hover{background:var(--goldf)}
.acc-chevron{font-size:.6rem;color:var(--t4);transition:transform .3s,color .3s}
.acc-chevron.open{transform:rotate(180deg);color:var(--gold)}
.acc-body{overflow:hidden;transition:max-height .5s cubic-bezier(.4,0,.2,1),opacity .4s ease}
.acc-body.closed{max-height:0!important;opacity:0!important;overflow:hidden!important}
.acc-body.open{max-height:3000px;opacity:1}
.acc-content{padding:var(--sp2) var(--sp4) var(--sp4);font-size:var(--sm);color:var(--t2);line-height:2.4;letter-spacing:-.005em;white-space:pre-wrap}
.acc-content p:first-child::first-letter{font-size:2.4em;font-weight:700;color:var(--gold);float:left;line-height:.82;margin:.06em .1em 0 0}
.typing-cursor{display:inline-block;width:2px;height:.9em;background:var(--gold);margin-left:2px;vertical-align:text-bottom;animation:blink .7s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

/* ══ 추가질문 STEP 5 (고정 레이아웃) ══ */
.chat-page{position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:500px;height:100dvh;height:100vh;display:flex;flex-direction:column;background:var(--bg);z-index:1;animation:fadeUp .5s ease}
.chat-page-header{padding:72px var(--sp3) var(--sp2);border-bottom:1px solid var(--line);background:var(--bg1);flex-shrink:0}
.chat-page-title{font-size:var(--lg);font-weight:600;color:var(--t1);margin-bottom:4px}
.chat-page-sub{font-size:var(--xs);color:var(--t3)}
.chat-limit-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--goldf);border:1px solid var(--acc);border-radius:50px;font-size:var(--xs);color:var(--gold);margin-top:8px}
.chat-history{flex:1;padding:var(--sp2) var(--sp3);display:flex;flex-direction:column;gap:var(--sp3);overflow-y:auto;-webkit-overflow-scrolling:touch}
.chat-msg{display:flex;flex-direction:column;gap:6px;animation:fadeUp .3s ease}
.chat-msg.user{align-items:flex-end}
.chat-msg.ai{align-items:flex-start}
.chat-role{font-size:var(--xs);color:var(--t4);padding:0 4px}
.chat-bubble{max-width:88%;padding:var(--sp2) var(--sp3);border-radius:var(--r2);font-size:var(--sm);line-height:2.1;letter-spacing:-.005em}
.chat-msg.ai .chat-bubble{background:var(--bg2);border:1px solid var(--line);border-bottom-left-radius:4px;color:var(--t1);white-space:pre-wrap}
.chat-msg.user .chat-bubble{background:var(--bg3);border:1px solid var(--line);border-bottom-right-radius:4px;color:var(--t1)}
.chat-bubble-actions{display:flex;justify-content:flex-end;margin-top:4px}
.typing-dots{display:flex;gap:4px;padding:10px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2) var(--r2) var(--r2) 4px;width:fit-content}
.typing-dots span{width:6px;height:6px;border-radius:50%;background:var(--t4);animation:dot 1.2s infinite}
.typing-dots span:nth-child(2){animation-delay:.2s}.typing-dots span:nth-child(3){animation-delay:.4s}
@keyframes dot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}
.chat-sugg-wrap{padding:var(--sp1) 0 var(--sp1);display:flex;gap:5px;flex-wrap:wrap;margin-bottom:var(--sp1)}
.sugg-btn{padding:6px 12px;background:transparent;border:1px solid var(--line);border-radius:50px;color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer;white-space:nowrap;transition:all .2s}
.sugg-btn:hover{border-color:var(--acc);color:var(--gold);background:var(--goldf)}
.chat-input-area{padding:var(--sp2) var(--sp3);padding-bottom:max(var(--sp2),env(safe-area-inset-bottom));border-top:1px solid var(--line);background:var(--bg1);flex-shrink:0}
.chat-inp-row{display:flex;gap:8px}
.chat-inp{flex:1;padding:11px 16px;background:var(--bg2);border:1px solid var(--line);border-radius:50px;color:var(--t1);font-size:var(--sm);font-family:var(--ff);transition:border-color .2s}
.chat-inp:focus{outline:none;border-color:var(--acc)}.chat-inp::placeholder{color:var(--t4)}.chat-inp:disabled{opacity:.4}
.chat-send{width:40px;height:40px;border-radius:50%;border:none;background:var(--gold);color:#0D0B14;font-size:.85rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform .15s,opacity .15s}
.chat-send:hover{opacity:.85}.chat-send:active{transform:scale(.93)}.chat-send:disabled{opacity:.3;cursor:not-allowed}

/* ══ 결과 액션 ══ */
.res-actions{padding:var(--sp3);border-top:1px solid var(--line)}
.upsell{padding:var(--sp2) var(--sp3);background:var(--golds);border:1px solid var(--acc);border-radius:var(--r2);text-align:center;margin-bottom:var(--sp2)}
.up-t{font-size:var(--sm);font-weight:600;color:var(--gold);margin-bottom:4px}
.up-d{font-size:var(--xs);color:var(--t3);margin-bottom:var(--sp2);line-height:1.75}
.up-btn{width:100%;padding:11px;border:1px solid var(--gold);border-radius:var(--r1);background:transparent;color:var(--gold);font-size:var(--sm);font-weight:600;font-family:var(--ff);cursor:pointer;transition:all .2s}
.up-btn:hover{background:var(--goldf)}.up-btn:disabled{opacity:.4;cursor:not-allowed}
.chat-cta{width:100%;padding:13px;border:none;border-radius:var(--r1);background:linear-gradient(135deg,rgba(232,176,72,.15),rgba(232,176,72,.05));border:1px solid var(--acc);color:var(--gold);font-size:var(--sm);font-weight:600;font-family:var(--ff);cursor:pointer;transition:all .2s;margin-bottom:var(--sp2);display:flex;align-items:center;justify-content:center;gap:8px}
.chat-cta:hover{background:var(--goldf)}.chat-cta:disabled{opacity:.4;cursor:not-allowed}
/* 크고 눈에 띄는 채팅 CTA */
.chat-cta-large{width:100%;padding:var(--sp2) var(--sp3);border:none;border-radius:var(--r2);background:linear-gradient(135deg,rgba(232,176,72,.18),rgba(232,176,72,.06));border:1px solid rgba(232,176,72,.4);font-family:var(--ff);cursor:pointer;transition:all .25s;margin-bottom:var(--sp2);display:flex;align-items:center;gap:var(--sp2);text-align:left}
.chat-cta-large:hover{background:linear-gradient(135deg,rgba(232,176,72,.28),rgba(232,176,72,.12));border-color:var(--gold);transform:translateY(-1px);box-shadow:0 4px 20px rgba(232,176,72,.15)}
.chat-cta-large:active{transform:translateY(0)}
.chat-cta-emoji{font-size:1.8rem;flex-shrink:0;line-height:1}
.chat-cta-info{flex:1}
.chat-cta-title{font-size:var(--md);font-weight:700;color:var(--gold);margin-bottom:3px}
.chat-cta-desc{font-size:var(--xs);color:var(--t3);line-height:1.5}
.res-btns{display:flex;gap:6px;flex-wrap:wrap}
.res-btn{flex:1;min-width:70px;padding:9px 6px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:all .2s}
.res-btn:hover{border-color:var(--acc);color:var(--gold)}.res-btn:active{transform:scale(.96)}

.action-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:var(--sp2)}
.action-card{padding:var(--sp2);background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2);cursor:pointer;transition:all var(--trans);text-align:left}
.action-card:hover{border-color:var(--acc);background:var(--goldf);transform:translateY(-2px)}
.action-card-icon{font-size:1.3rem;margin-bottom:5px}
.action-card-title{font-size:var(--sm);font-weight:600;color:var(--t1);margin-bottom:2px}
.action-card-sub{font-size:var(--xs);color:var(--t3);line-height:1.5}
.action-card.compat{border-color:var(--lavacc)}
.action-card.compat:hover{background:var(--lavf);border-color:var(--lav)}
.action-card.letter{border-color:var(--roseacc)}
.action-card.letter:hover{background:var(--rosef);border-color:var(--rose)}

.feature-guide{margin:var(--sp3) 0;padding:var(--sp3);background:var(--bg2);border-radius:var(--r2);border:1px solid var(--line)}
.feature-guide-title{font-size:var(--sm);font-weight:600;color:var(--t2);margin-bottom:var(--sp2)}
.feature-guide-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fg-card{display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg1);border:1px solid var(--line);border-radius:var(--r1);cursor:pointer;text-align:left;transition:border-color .15s,background .15s}
.fg-card:hover{border-color:var(--gold);background:var(--goldf)}
.fg-icon{font-size:22px;flex-shrink:0}
.fg-info{display:flex;flex-direction:column;gap:2px}
.fg-name{font-size:var(--xs);font-weight:600;color:var(--t2)}
.fg-desc{font-size:10px;color:var(--t4);line-height:1.4}

/* ══ REPORT STEP 6 ══ */
.report-page{width:100%;max-width:500px;animation:fadeUp .5s ease}
.report-header{text-align:center;padding:var(--sp4) var(--sp3) var(--sp3)}
.report-date{font-size:var(--xs);color:var(--t4);letter-spacing:.12em;margin-bottom:8px}
.report-title{font-size:var(--xl);font-weight:700;color:var(--gold);margin-bottom:6px;line-height:1.2}
.report-name{font-size:var(--sm);color:var(--t3)}
.report-content{padding:0 var(--sp3) var(--sp5)}
.report-text{font-size:var(--sm);color:var(--t2);line-height:2.2;letter-spacing:-.005em;white-space:pre-wrap}
.report-text p:first-child::first-letter{font-size:2.4em;font-weight:700;color:var(--gold);float:left;line-height:.82;margin:.06em .1em 0 0}
.report-skip{display:flex;justify-content:center;margin:var(--sp3) 0}
.report-skip-btn{padding:8px 20px;border-radius:50px;border:1px solid var(--acc);background:transparent;color:var(--gold);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:background .2s}
.report-skip-btn:hover{background:var(--goldf)}

/* ══ 시나리오 궁합 ══ */
.compat-page{width:100%;max-width:480px;animation:fadeUp .5s ease}
.compat-header{text-align:center;padding:var(--sp4) var(--sp3) var(--sp3)}
.compat-title{font-size:var(--xl);font-weight:700;color:var(--t1);margin-bottom:6px}
.compat-sub{font-size:var(--sm);color:var(--t3);line-height:1.75}
.compat-section{margin-bottom:var(--sp4)}
.compat-label{font-size:var(--xs);font-weight:700;color:var(--t4);letter-spacing:.08em;margin-bottom:10px}
.person-cards{display:flex;gap:10px}
.person-card{flex:1;background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);padding:var(--sp2);position:relative}
.person-card.a-card{border-color:var(--lavacc)}
.person-card.b-card{border-color:var(--tealacc)}
.person-badge{font-size:var(--xs);font-weight:700;padding:2px 8px;border-radius:50px;margin-bottom:8px;display:inline-block}
.person-badge.a{background:var(--lavf);color:var(--lav)}
.person-badge.b{background:var(--tealf);color:var(--teal)}
.place-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.place-btn{padding:10px 4px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);text-align:center;cursor:pointer;transition:all var(--trans);font-family:var(--ff)}
.place-btn:hover{border-color:var(--t4);transform:translateY(-2px)}
.place-btn.on{background:var(--goldf);border-color:var(--gold)}
.place-emoji{font-size:1.4rem;display:block;margin-bottom:3px}
.place-label{font-size:var(--xs);color:var(--t3);display:block}
.place-btn.on .place-label{color:var(--gold)}
.scenario-wrap{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);overflow:hidden;margin-bottom:var(--sp3)}
.scenario-header{padding:var(--sp2) var(--sp3);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px}
.scenario-place-icon{font-size:1.3rem}
.scenario-place-name{font-size:var(--sm);font-weight:600;color:var(--t1)}
.scenario-sub{font-size:var(--xs);color:var(--t4)}
.bubble-list{padding:var(--sp3);display:flex;flex-direction:column;gap:10px}
.bubble-row{display:flex;gap:8px;animation:fadeUp .3s ease}
.bubble-row.b-row{flex-direction:row-reverse}
.bubble-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;flex-shrink:0;margin-top:2px}
.bubble-avatar.a-av{background:var(--lavf);border:1px solid var(--lavacc);color:var(--lav)}
.bubble-avatar.b-av{background:var(--tealf);border:1px solid var(--tealacc);color:var(--teal)}
.bubble-name{font-size:var(--xs);color:var(--t4);margin-bottom:3px}
.bubble-row.b-row .bubble-name{text-align:right}
.bubble-text{padding:10px 14px;border-radius:18px;font-size:var(--sm);line-height:1.65;max-width:78%}
.bubble-row.a-row .bubble-text{background:var(--bg2);border:1px solid var(--line);border-bottom-left-radius:4px;color:var(--t1)}
.bubble-row.b-row .bubble-text{background:var(--tealf);border:1px solid var(--tealacc);border-bottom-right-radius:4px;color:var(--t1)}
.scenario-summary{padding:var(--sp2) var(--sp3);background:var(--goldf);border-top:1px solid var(--acc);font-size:var(--xs);color:var(--gold);line-height:1.75;font-style:italic;text-align:center}
.scenario-loading{padding:var(--sp4);text-align:center;color:var(--t3);font-size:var(--sm)}
.scenario-typing-dots{display:flex;gap:5px;justify-content:center;margin:var(--sp2) 0}
.scenario-typing-dots span{width:7px;height:7px;border-radius:50%;background:var(--t4);animation:dot 1.2s infinite}
.scenario-typing-dots span:nth-child(2){animation-delay:.2s}
.scenario-typing-dots span:nth-child(3){animation-delay:.4s}
.compat-total{padding:var(--sp3);background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2);margin-bottom:var(--sp3);text-align:center}
.compat-total-label{font-size:var(--xs);color:var(--t4);margin-bottom:6px;letter-spacing:.08em}
.compat-total-text{font-size:var(--sm);color:var(--t1);line-height:1.75}
.kizmet-bar{height:6px;border-radius:3px;background:var(--bg3);overflow:hidden;margin:10px 0}
.kizmet-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--lav),var(--gold));transition:width 1.2s cubic-bezier(.34,1.56,.64,1)}
.kizmet-score{font-size:var(--xl);font-weight:700;color:var(--gold)}
.compat-btns{display:flex;gap:8px}

/* ══ 별의 편지 ══ */
.letter-page{width:100%;max-width:480px;animation:fadeUp .5s ease}
.letter-envelope{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r3);overflow:hidden;margin-bottom:var(--sp3)}
.letter-env-top{height:80px;background:linear-gradient(135deg,var(--goldf),var(--lavf));display:flex;align-items:center;justify-content:center;font-size:2rem;border-bottom:1px solid var(--line)}
.letter-body{padding:var(--sp4) var(--sp3)}
.letter-date-to{font-size:var(--xs);color:var(--t4);margin-bottom:var(--sp2);letter-spacing:.06em}
.letter-date-to strong{color:var(--gold)}
.letter-content{font-size:var(--sm);color:var(--t2);line-height:2.2;white-space:pre-wrap;letter-spacing:-.005em}
.letter-content p:first-child::first-letter{font-size:2.4em;font-weight:700;color:var(--gold);float:left;line-height:.82;margin:.06em .1em 0 0}
.letter-seal{display:flex;flex-direction:column;align-items:center;gap:6px;padding:var(--sp3);border-top:1px solid var(--line)}
.seal-icon{font-size:1.5rem;animation:orbPulse 3s infinite}
.seal-text{font-size:var(--xs);color:var(--t4);letter-spacing:.08em}
.letter-actions{display:flex;gap:8px}

/* ══ 랜딩 샘플 미리보기 ══ */
.sample-preview{background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);padding:var(--sp3);margin:var(--sp2) 0;position:relative;overflow:hidden}
.sample-badge{display:inline-block;font-size:10px;color:var(--t4);letter-spacing:.08em;margin-bottom:8px;padding:3px 8px;background:var(--bg3);border-radius:10px;border:1px solid var(--line)}
.sample-name{font-size:var(--xs);color:var(--gold);margin-bottom:8px;letter-spacing:.06em;font-weight:600}
.sample-text{font-size:var(--xs);color:var(--t2);line-height:1.9;min-height:60px}
.sample-cursor{display:inline-block;width:1.5px;height:.85em;background:var(--gold);margin-left:1px;vertical-align:text-bottom;animation:blink .7s infinite}

/* ══ 피드백 ══ */
.fb-wrap{display:flex;align-items:center;gap:8px;justify-content:center;padding:var(--sp2) 0;border-top:1px solid var(--line);margin-top:var(--sp1)}
.fb-label{font-size:var(--xs);color:var(--t4)}
.fb-btn{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:transparent;font-size:.85rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.fb-btn:hover{border-color:var(--gold);transform:scale(1.1)}
.fb-btn.selected{background:var(--goldf);border-color:var(--gold)}
.fb-done{font-size:var(--xs);color:var(--gold);animation:fadeUp .3s ease}

/* ══ 프로필 모달 ══ */
.profile-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(5px);z-index:200;display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s ease}
.profile-sheet{width:100%;max-width:480px;background:var(--bg);border-radius:24px 24px 0 0;padding:var(--sp4) var(--sp3) 40px;animation:slideUp .3s cubic-bezier(.34,1.56,.64,1);max-height:85vh;overflow-y:auto}
.profile-handle{width:36px;height:4px;background:var(--line);border-radius:2px;margin:0 auto var(--sp3)}
.profile-title{font-size:var(--lg);font-weight:700;color:var(--t1);margin-bottom:4px}
.profile-sub{font-size:var(--xs);color:var(--t3);margin-bottom:var(--sp3);line-height:1.65}
.profile-section{margin-bottom:var(--sp4)}
.profile-section-title{font-size:var(--xs);font-weight:700;color:var(--t3);letter-spacing:.08em;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.profile-save-btn{width:100%;padding:14px;border:none;border-radius:var(--r1);background:var(--gold);color:#0D0B14;font-size:var(--sm);font-weight:700;font-family:var(--ff);cursor:pointer;transition:transform .15s,opacity .15s;margin-top:var(--sp2)}
.profile-save-btn:hover{opacity:.88}.profile-save-btn:active{transform:scale(.98)}
.profile-close-btn{width:100%;padding:11px;border:none;background:transparent;color:var(--t4);font-family:var(--ff);font-size:var(--xs);cursor:pointer;margin-top:6px}

.kakao-nudge{padding:var(--sp2) var(--sp3);background:rgba(254,229,0,.1);border:1px solid rgba(254,229,0,.3);border-radius:var(--r2);margin-bottom:var(--sp2);display:flex;align-items:center;gap:10px}
.kakao-nudge-text{font-size:var(--xs);color:var(--t3);flex:1}
.kakao-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:12px;background:#FEE500;border:none;cursor:pointer;font-family:var(--ff);font-size:var(--sm);font-weight:600;color:#191919;transition:all .2s}
.kakao-btn:hover{background:#F0D800;transform:translateY(-1px)}
.kakao-btn svg{flex-shrink:0}

/* ══ 업그레이드 모달 ══ */
.upgrade-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
.upgrade-modal{width:100%;max-width:480px;background:var(--bg);border-radius:var(--r2);padding:28px 24px;max-height:85svh;overflow-y:auto}
.upgrade-modal-title{font-size:var(--md);font-weight:700;color:var(--t1);margin-bottom:6px}
.upgrade-modal-sub{font-size:var(--xs);color:var(--t3);margin-bottom:var(--sp2);line-height:1.5}
.upgrade-pkgs{display:flex;flex-direction:column;gap:10px}
.upgrade-pkg{padding:var(--sp2);background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);cursor:pointer;transition:all .2s}
.upgrade-pkg:hover{border-color:var(--gold)}
.upgrade-pkg.chosen{background:var(--goldf);border-color:var(--gold)}
.upgrade-pkg-hot{display:inline-block;background:var(--rose,#E87B8A);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;margin-bottom:4px}
.upgrade-pkg-e{font-size:22px;margin-bottom:2px}
.upgrade-pkg-n{font-size:var(--sm);font-weight:700;color:var(--t1)}
.upgrade-pkg-p{font-size:var(--md);font-weight:800;color:var(--gold);margin:2px 0}
.upgrade-pkg-q{font-size:var(--xs);color:var(--t3)}

/* ══ 다른 사람 추가 모달 ══ */
.other-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:flex-end;justify-content:center}
.other-modal{width:100%;max-width:480px;background:var(--bg);border-radius:var(--r2) var(--r2) 0 0;padding:var(--sp3);max-height:90svh;overflow-y:auto}
.other-modal-title{font-size:var(--md);font-weight:700;color:var(--t1);margin-bottom:6px}
.other-modal-sub{font-size:var(--xs);color:var(--t3);line-height:1.5;margin-bottom:var(--sp2)}

/* ══ 사이드바 ══ */
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);z-index:100;animation:fadeIn .25s ease}
.sidebar{position:fixed;top:0;left:0;bottom:0;width:min(320px,88vw);background:var(--bg);border-right:1px solid var(--line);z-index:101;display:flex;flex-direction:column;animation:sideIn .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes sideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
.sidebar-head{padding:var(--sp4) var(--sp3) var(--sp3);border-bottom:1px solid var(--line)}
.sidebar-logo{font-size:var(--xs);letter-spacing:.3em;color:var(--gold);margin-bottom:var(--sp2)}
.sidebar-user{display:flex;align-items:center;gap:10px}
.sidebar-av{width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid var(--acc)}
.sidebar-av-ph{width:36px;height:36px;border-radius:50%;background:var(--bg2);border:1px dashed var(--acc);display:flex;align-items:center;justify-content:center;font-size:.85rem}
.sidebar-uname{font-size:var(--sm);font-weight:600;color:var(--t1)}
.sidebar-usub{font-size:var(--xs);color:var(--t4);margin-top:2px}
.sidebar-body{flex:1;overflow-y:auto;padding:var(--sp2) 0}
.sidebar-section{margin-bottom:var(--sp3)}
.sidebar-section-lbl{font-size:var(--xs);font-weight:700;color:var(--t4);letter-spacing:.1em;padding:6px var(--sp3) 4px}
.sidebar-menu-item{display:flex;align-items:center;gap:12px;padding:11px var(--sp3);cursor:pointer;transition:background .2s;border:none;background:transparent;width:100%;text-align:left;font-family:var(--ff)}
.sidebar-menu-item:hover{background:var(--bg2)}
.sidebar-menu-item.active{background:var(--goldf)}
.smi-icon{font-size:1rem;width:20px;text-align:center;flex-shrink:0}
.smi-text{font-size:var(--sm);color:var(--t2)}
.sidebar-menu-item.active .smi-text{color:var(--gold);font-weight:600}
.sidebar-hist-item{padding:10px var(--sp3);cursor:pointer;border-bottom:1px solid var(--line2);transition:background .2s}
.sidebar-hist-item:hover{background:var(--bg2)}
.shi-date{font-size:var(--xs);color:var(--t4);margin-bottom:3px}
.shi-q{font-size:var(--xs);color:var(--t2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sidebar-empty{padding:var(--sp3);text-align:center;color:var(--t4);font-size:var(--xs);line-height:2}
.sidebar-foot{padding:var(--sp2) var(--sp3);border-top:1px solid var(--line)}
.sidebar-foot-btn{width:100%;padding:9px;border:1px solid var(--line);border-radius:var(--r1);background:transparent;color:var(--t4);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:all .2s}
.sidebar-foot-btn:hover{border-color:var(--acc);color:var(--gold)}
.menu-btn{position:fixed;top:14px;left:18px;z-index:50;width:44px;height:44px;border-radius:50%;background:var(--bg2);border:1px solid var(--line);color:var(--t3);font-size:.9rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.menu-btn:hover{color:var(--gold);border-color:var(--gold)}

.hist-search-inp{width:100%;padding:10px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:50px;color:var(--t1);font-size:var(--sm);font-family:var(--ff);transition:border-color .2s}
.hist-search-inp:focus{outline:none;border-color:var(--gold)}.hist-search-inp::placeholder{color:var(--t4)}

/* ══ 히스토리 뷰어 (step 9) ══ */
.hist-page{width:100%;max-width:480px;animation:fadeUp .5s ease}
.hist-header{padding:var(--sp4) var(--sp3) var(--sp2);border-bottom:1px solid var(--line)}
.hist-title{font-size:var(--lg);font-weight:700;color:var(--t1);margin-bottom:4px}
.hist-sub{font-size:var(--xs);color:var(--t3)}
.hist-search{padding:var(--sp2) var(--sp3);border-bottom:1px solid var(--line)}
.hist-list{padding:var(--sp2) 0}
.hist-card{margin:0 var(--sp3) var(--sp2);background:var(--bg1);border:1px solid var(--line);border-radius:var(--r2);overflow:hidden;animation:fadeUp .3s ease}
.hist-card-head{padding:var(--sp2) var(--sp3);display:flex;justify-content:space-between;align-items:center;cursor:pointer;border-bottom:1px solid var(--line2)}
.hist-card-head:hover{background:var(--bg2)}
.hch-left{flex:1}
.hch-date{font-size:var(--xs);color:var(--t4);margin-bottom:3px}
.hch-q{font-size:var(--sm);color:var(--t1);font-weight:500;line-height:1.45}
.hch-right{display:flex;align-items:center;gap:8px}
.hch-chevron{font-size:.55rem;color:var(--t4);transition:transform .3s}
.hch-chevron.open{transform:rotate(180deg);color:var(--gold)}
.hist-card-body{padding:var(--sp2) var(--sp3) var(--sp3);font-size:var(--sm);color:var(--t2);line-height:2.1;white-space:pre-wrap;border-top:1px solid var(--line)}
.hist-del-btn{padding:3px 8px;border-radius:6px;border:1px solid var(--line);background:transparent;color:var(--t4);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:all .2s;flex-shrink:0}
.hist-del-btn:hover{border-color:#e05a3a;color:#e05a3a}
.hist-empty{padding:var(--sp5) var(--sp3);text-align:center;color:var(--t4);font-size:var(--sm);line-height:2.2}

/* ══ step 전환 fade ══ */
.step-fade{animation:stepFadeIn .45s cubic-bezier(.4,0,.2,1)}
@keyframes stepFadeIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}

.share-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:50px;border:1px solid var(--line);background:transparent;color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer;transition:all .2s}
.share-btn:hover{border-color:var(--acc);color:var(--gold);background:var(--goldf)}

.review-inp{width:100%;padding:11px 14px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r1);color:var(--t1);font-size:var(--sm);font-family:var(--ff);resize:none;height:72px;margin-bottom:10px;transition:border-color .2s}
.review-inp:focus{outline:none;border-color:var(--gold)}.review-inp::placeholder{color:var(--t4)}

/* ══ PWA 설치 배너 ══ */
.pwa-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--bg2);border-top:1px solid var(--line);animation:slideUp .3s ease}
.pwa-banner-icon{font-size:1.5rem;flex-shrink:0}
.pwa-banner-body{flex:1;min-width:0}
.pwa-banner-title{font-size:var(--sm);font-weight:600;color:var(--t1);margin-bottom:2px}
.pwa-banner-desc{font-size:var(--xs);color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pwa-banner-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}
.pwa-banner-install{padding:7px 14px;border-radius:50px;border:none;background:var(--gold);color:#0D0B14;font-size:var(--xs);font-family:var(--ff);font-weight:700;cursor:pointer}
.pwa-banner-later{padding:7px 10px;border-radius:50px;border:1px solid var(--line);background:transparent;color:var(--t3);font-size:var(--xs);font-family:var(--ff);cursor:pointer}
.pwa-banner-close{padding:4px 8px;border:none;background:none;color:var(--t4);font-size:var(--sm);cursor:pointer;line-height:1}

/* ══ 카카오 채널 리마인더 ══ */
.kakao-channel-remind{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--bg2);border:1px solid var(--line);border-radius:var(--r2);margin:var(--sp2) 0}
.kcr-icon{font-size:1.5rem;flex-shrink:0}
.kcr-body{flex:1;min-width:0}
.kcr-title{font-size:var(--sm);font-weight:600;color:var(--t1);margin-bottom:3px}
.kcr-desc{font-size:var(--xs);color:var(--t3)}
.kcr-btn{padding:8px 14px;border-radius:50px;border:none;background:#FEE500;color:#191919;font-size:var(--xs);font-family:var(--ff);font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap;flex-shrink:0}

/* ══ 별자리 슬롯 ══ */
.zodiac-slot{margin-top:var(--sp4);padding:0 0 var(--sp4)}
.zodiac-slot-title{font-size:var(--md);font-weight:700;color:var(--t1);margin-bottom:4px;padding:0 var(--sp3)}
.zodiac-slot-sub{font-size:var(--xs);color:var(--t4);margin-bottom:var(--sp2);padding:0 var(--sp3)}
.zodiac-slot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 var(--sp3)}
@media(min-width:480px){.zodiac-slot-grid{grid-template-columns:repeat(4,1fr)}}
.zs-card{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-radius:var(--r2);border:1px solid var(--line);background:var(--bg2);cursor:pointer;transition:all .2s;font-family:var(--ff);text-align:center}
.zs-card:hover,.zs-card:focus{border-color:var(--acc);background:var(--goldf);outline:none}
.zs-card.zs-luck-high{border-color:var(--acc)}
.zs-symbol{font-size:1.3rem;line-height:1}
.zs-name{font-size:var(--xs);color:var(--t2);font-weight:600;margin-top:2px}
.zs-phrase{font-size:10px;color:var(--t4);line-height:1.4;word-break:keep-all}

/* ══ 사이드바 날짜 필터 ══ */
.hist-date-filter{display:flex;gap:4px;margin-top:8px}
.hdf-tab{flex:1;padding:5px 0;border-radius:50px;border:1px solid var(--line);background:transparent;color:var(--t3);font-size:10px;font-family:var(--ff);cursor:pointer;transition:all .15s}
.hdf-tab.active{background:var(--goldf);border-color:var(--acc);color:var(--gold)}
.hdf-tab:hover:not(.active){border-color:var(--line2);color:var(--t2)}

/* ══ 별숨 일기 모달 ══ */
.diary-textarea{width:100%;box-sizing:border-box;padding:14px;border-radius:var(--r1);border:1px solid var(--line);background:var(--bg2);color:var(--t1);font-family:var(--ff);font-size:max(16px,var(--sm));line-height:1.7;resize:vertical;min-height:120px;outline:none;transition:border-color .2s;margin-bottom:4px}
.diary-textarea:focus{border-color:var(--gold)}
.diary-textarea::placeholder{color:var(--t4)}

/* ══ DAILY STAR CARD ══ */
@keyframes dsc-breathe{
  0%,100%{box-shadow:0 2px 16px rgba(232,176,72,.10),0 1px 4px rgba(0,0,0,.06)}
  50%{box-shadow:0 4px 28px rgba(232,176,72,.22),0 2px 8px rgba(155,142,196,.10)}
}
@keyframes dsc-item-in{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes dsc-spark{0%,100%{opacity:.15;transform:scale(.8)}50%{opacity:.7;transform:scale(1.2)}}
@keyframes dsc-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}

.dsc-wrap{position:relative;margin:var(--sp3) 0;animation:fadeUp .6s .2s both}
.dsc-spark{position:absolute;font-size:.55rem;color:var(--gold);pointer-events:none;animation:dsc-spark 3s ease-in-out infinite}
.dsc-spark-1{top:-6px;left:18%;animation-delay:0s}
.dsc-spark-2{top:30%;right:-4px;font-size:.8rem;color:var(--lav);animation-delay:.7s}
.dsc-spark-3{bottom:-4px;right:25%;animation-delay:1.4s}
.dsc-spark-4{bottom:20%;left:-4px;font-size:.8rem;color:var(--lav);animation-delay:2.1s}

.dsc-card{
  position:relative;overflow:hidden;
  background:linear-gradient(150deg,var(--bg1) 0%,var(--bg2) 55%,var(--bg3) 100%);
  border:1px solid var(--acc);
  border-radius:var(--r3);
  padding:var(--sp3) var(--sp3) var(--sp2);
  animation:dsc-breathe 5s ease-in-out infinite;
}
.dsc-top-shimmer{
  position:absolute;top:0;left:0;right:0;height:1px;overflow:hidden;
  background:linear-gradient(90deg,transparent 0%,rgba(232,176,72,.5) 50%,transparent 100%);
}
.dsc-top-shimmer::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);
  animation:dsc-shimmer 4s ease-in-out infinite 1.5s;
}
.dsc-header{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px}
.dsc-header-dot{width:4px;height:4px;border-radius:50%;background:var(--gold);opacity:.5;animation:dsc-spark 2.5s ease-in-out infinite}
.dsc-header-dot:last-child{animation-delay:1.25s}
.dsc-title{font-size:var(--xs);font-weight:600;letter-spacing:.14em;color:var(--t3);text-transform:uppercase}
.dsc-summary{
  text-align:center;font-size:var(--md);font-weight:600;color:var(--t1);
  line-height:1.65;margin-bottom:var(--sp3);padding:0 4px;
}
.dsc-items{display:flex;flex-direction:column;gap:14px}
.dsc-item{
  display:flex;align-items:flex-start;gap:12px;
  animation:dsc-item-in .45s ease both;
  animation-delay:var(--dsc-delay,0s);
}
.dsc-item-icon-wrap{
  width:34px;height:34px;border-radius:50%;flex-shrink:0;margin-top:1px;
  background:var(--bg3);border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;font-size:1rem;
}
.dsc-item:nth-child(1) .dsc-item-icon-wrap{background:var(--lavf);border-color:var(--lavacc)}
.dsc-item:nth-child(2) .dsc-item-icon-wrap{background:var(--tealf);border-color:var(--tealacc)}
.dsc-item:nth-child(3) .dsc-item-icon-wrap{background:var(--goldf);border-color:var(--acc)}
.dsc-item:nth-child(4) .dsc-item-icon-wrap{background:var(--goldf);border-color:var(--acc)}
.dsc-item:nth-child(5) .dsc-item-icon-wrap{background:var(--rosef);border-color:var(--roseacc)}
.dsc-item-text{font-size:var(--sm);color:var(--t1);line-height:1.72;flex:1}

/* 로딩 상태 버튼 */
.dsc-loading-btn{width:100%;padding:14px;border:none;border-radius:var(--r1);background:var(--goldf);border:1px solid var(--acc);color:var(--gold);font-size:var(--sm);font-weight:600;font-family:var(--ff);cursor:not-allowed;display:flex;align-items:center;justify-content:center;gap:8px;animation:fadeUp .4s both}
.dsc-loading-dot{width:5px;height:5px;border-radius:50%;background:var(--gold);animation:dsc-spark 1s ease-in-out infinite}
.dsc-loading-dot:nth-child(2){animation-delay:.2s}
.dsc-loading-dot:nth-child(3){animation-delay:.4s}
`;

export default CSS;
