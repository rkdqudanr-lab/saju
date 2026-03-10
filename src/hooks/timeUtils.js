// ═══════════════════════════════════════════════════════════
//  ⏰ 시간대 유틸
// ═══════════════════════════════════════════════════════════
function getTimeSlot(){
  const h=new Date().getHours();
  if(h>=5&&h<12) return 'morning';   // 오전 5~12
  if(h>=12&&h<19) return 'afternoon'; // 오후 12~19
  if(h>=19&&h<24) return 'evening';  // 저녁 19~24
  return 'dawn';                      // 새벽 0~5
}
const TIME_CONFIG={
  morning:{
    label:'오늘을 여는 별숨',
    emoji:'🌅',
    color:'#E8B048',
    bg:'rgba(232,176,72,.08)',
    border:'rgba(232,176,72,.2)',
    ctaText:'오늘의 별숨에게 물어보기 ✦',
    ctaBg:'var(--gold)',ctaColor:'#0D0B14',
    greeting:(name)=>`${name||'당신'}의 오늘이 시작되고 있어요.`,
    prompt:'[오전·100자] 오늘 하루를 시작하는 사람에게 가장 필요한 한 가지 방향을 100자 내외로 가볍게 전해줘요. 따뜻하고 짧게, 일상어로.',
    inputPlaceholder:'오늘 하루 어떤 게 궁금해요?',
  },
  afternoon:{
    label:'오늘의 별숨',
    emoji:'✦',
    color:'var(--gold)',
    bg:'var(--goldf)',
    border:'var(--acc)',
    ctaText:'별숨에게 물어보기 ✦',
    ctaBg:'var(--gold)',ctaColor:'#0D0B14',
    greeting:(name)=>`${name||'당신'}의 오후, 별이 함께하고 있어요.`,
    prompt:'[오후·100자] 지금 이 순간 가장 필요한 한 가지를 100자 내외로 가볍게 전해줘요. 짧고 명확하게.',
    inputPlaceholder:'지금 마음속에 있는 것을 물어봐요',
  },
  evening:{
    label:'오늘을 마무리하는 별숨',
    emoji:'🌙',
    color:'#9B8EC4',
    bg:'rgba(155,142,196,.08)',
    border:'rgba(155,142,196,.2)',
    ctaText:'오늘을 별숨의 언어로 읽어보기 ✦',
    ctaBg:'var(--lav)',ctaColor:'#fff',
    greeting:(name)=>`${name||'당신'}의 오늘 하루, 수고했어요.`,
    prompt:'[저녁·100자] 오늘 하루를 한 문장으로 다시 읽어줘요. 100자 내외, 따뜻하고 짧게.',
    inputPlaceholder:'오늘 있었던 일을 별숨에게 털어놔요',
  },
  dawn:{
    label:'별이 가장 선명한 시간',
    emoji:'🌌',
    color:'#6BBFB5',
    bg:'rgba(107,191,181,.06)',
    border:'rgba(107,191,181,.15)',
    ctaText:'새벽의 별숨에게 물어보기 ✦',
    ctaBg:'var(--teal)',ctaColor:'#fff',
    greeting:(name)=>`별이 가장 선명한 새벽, ${name||'당신'}에게 전할 이야기가 있어요.`,
    prompt:'[새벽·100자] 잠 못 드는 이 새벽에 필요한 위로 한 마디를 100자 내외로 전해줘요.',
    inputPlaceholder:'새벽에 떠오른 생각을 적어봐요',
  },
};

// ═══════════════════════════════════════════════════════════
//  📚 히스토리 유틸
// ═══════════════════════════════════════════════════════════
const HIST_KEY='byeolsoom_history';
const MAX_HIST=30;
function loadHistory(){
  try{const h=localStorage.getItem(HIST_KEY);return h?JSON.parse(h):[];}catch{return[];}
}
function saveHistory(items){
  try{localStorage.setItem(HIST_KEY,JSON.stringify(items.slice(0,MAX_HIST)));}catch{}
}
function addHistory(questions,answers){
  const items=loadHistory();
  const now=new Date();
  const dateStr=`${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const newItem={id:Date.now(),date:dateStr,slot:getTimeSlot(),questions,answers};
  saveHistory([newItem,...items]);
}
function deleteHistory(id){
  const items=loadHistory().filter(i=>i.id!==id);
  saveHistory(items);
}


export { getTimeSlot, loadHistory, saveHistory };
