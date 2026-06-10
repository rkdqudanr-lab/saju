import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SAMPLE_ESSAYS } from "../utils/constants.js";

export default function SamplePreview() {
  const [essayIdx, setEssayIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setEssayIdx(p => (p + 1) % SAMPLE_ESSAYS.length), 4500);
    return () => clearTimeout(t);
  }, [essayIdx]);

  const signs = ['물고기자리', '사자자리', '천칭자리'];
  return (
    <div className="sample-preview">
      <div className="sample-badge">별숨이 만든 예시 이야기예요</div>
      <div className="sample-name">{signs[essayIdx]}인 당신에게</div>
      <AnimatePresence mode="wait">
        <motion.div
          key={essayIdx}
          className="sample-text"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        >
          {SAMPLE_ESSAYS[essayIdx]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
