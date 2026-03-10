// ═══════════════════════════════════════════════════════════
//  🧹 마크다운 전처리기
// ═══════════════════════════════════════════════════════════
function stripMarkdown(text){
  return text
    .replace(/^#{1,6}\s+/gm,'')
    .replace(/---+/g,'')
    .replace(/\*\*(.*?)\*\*/g,'$1')
    .replace(/\*(.*?)\*/g,'$1')
    .replace(/^[-•*]\s+/gm,'')
    .replace(/^\d+\.\s+/gm,'')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}


export { CATS };
