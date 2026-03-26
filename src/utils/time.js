// ═══════════════════════════════════════════════════════════
//  ⏰ 시간대 유틸
// ═══════════════════════════════════════════════════════════
import { getServerHour } from './serverTime.js';

export function getTimeSlot(){
  const h = getServerHour();
  if(h>=5&&h<12) return 'morning';
  if(h>=12&&h<19) return 'afternoon';
  if(h>=19&&h<24) return 'evening';
  return 'dawn';
}

export const TIME_CONFIG={
  morning:{
    label:'오늘을 여는 별숨',
    emoji:'🌅',
    color:'#E8B048',
    bg:'rgba(232,176,72,.08)',
    border:'rgba(232,176,72,.2)',
    ctaText:'오늘의 별숨에게 물어보기 ✦',
    ctaBg:'var(--gold)',ctaColor:'#0D0B14',
    greeting:(name)=>`${name||'당신'}의 오늘이 시작되고 있어요.`,
    prompt:'[오전 운세] 오늘 하루를 어떻게 시작하면 좋을지, 오늘의 기운과 방향을 따뜻하게 전해줘요.',
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
    prompt:'[오후 운세] 오늘 오후의 기운과 지금 이 순간 필요한 것을 전해줘요.',
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
    prompt:'[저녁 회고] 오늘 하루를 돌아보며 별의 언어로 다시 읽어주는 이야기를 써줘요. 오늘 있었던 일들을 의미있게 재해석해요.',
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
    prompt:'[새벽 운세] 잠 못 드는 새벽, 이 시간에 필요한 위로와 내일을 향한 이야기를 전해줘요.',
    inputPlaceholder:'새벽에 떠오른 생각을 적어봐요',
  },
};
