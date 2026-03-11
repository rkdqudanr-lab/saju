import { getTimeSlot } from './time.js';

// ═══════════════════════════════════════════════════════════
//  📚 히스토리 유틸
// ═══════════════════════════════════════════════════════════
const HIST_KEY='byeolsoom_history';
const MAX_HIST=30;

export function loadHistory(){
  try{const h=localStorage.getItem(HIST_KEY);return h?JSON.parse(h):[];}catch{return[];}
}

export function saveHistory(items){
  try{localStorage.setItem(HIST_KEY,JSON.stringify(items.slice(0,MAX_HIST)));}catch{}
}

export function addHistory(questions,answers){
  const items=loadHistory();
  const now=new Date();
  const dateStr=`${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const newItem={id:Date.now(),date:dateStr,slot:getTimeSlot(),questions,answers};
  saveHistory([newItem,...items]);
}

export function deleteHistory(id){
  const items=loadHistory().filter(i=>i.id!==id);
  saveHistory(items);
}
