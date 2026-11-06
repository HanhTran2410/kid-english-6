// Phụ đề khi bé / bố mẹ chạm 🔊 nghe lại (SPEC mục 4.5, giống kid-english): câu tiếng Anh + câu tiếng Việt.
// Câu hỏi của Olly chỉ dùng các mẫu trong QUESTIONS → mỗi mẫu có bản dịch (test kiểm tra đủ).

/** Mẫu câu hỏi của Olly. Hàm nhận từ / chữ cần hỏi. */
export const QUESTIONS = {
  whichLetter: () => 'Which letter says this sound?',
  sayTheSound: () => 'Your turn! Say the sound!',
  tapBlend: () => 'Tap the letters. Then tap Blend!',
  readIt: () => 'Your turn! Read it!',
  whichOne: (word) => `Which one is ${word}?`,
  findWord: (word) => `Find the word: ${word}!`,
  spellIt: (word) => `Spell: ${word}!`,
  whatsMissing: (word) => `What is missing in ${word}?`,
};

/**
 * Dịch câu hỏi của Olly sang tiếng Việt.
 * @param {string} en câu Olly hỏi
 * @param {string} [meaning] nghĩa tiếng Việt của từ trong câu hỏi
 * @returns {string} '' nếu không nhận ra mẫu câu và không có nghĩa
 */
export function translateQuestion(en, meaning = '') {
  const s = String(en ?? '').trim();
  const m = meaning ? ` (${meaning})` : '';
  const rules = [
    [/^Which letter says this sound\?$/, () => 'Âm này là của chữ nào? Bé nghe rồi chạm vào chữ đúng.'],
    [/^Your turn! Say the sound!$/, () => 'Đến lượt bé! Bé nói theo âm này nhé.'],
    [/^Tap the letters\. Then tap Blend!$/, () => 'Bé chạm từng ô để nghe âm, rồi bấm nút Ghép.'],
    [/^Your turn! Read it!$/, () => 'Đến lượt bé! Bé đọc to từ này nhé.'],
    [/^Which one is (.+)\?$/, (x) => `Hình nào là "${x}"${m}? Bé chạm vào hình đúng.`],
    [/^Find the word: (.+)!$/, (x) => `Tìm chữ "${x}"${m}! Bé chạm vào thẻ đúng.`],
    [/^Spell: (.+)!$/, (x) => `Xếp các ô thành từ "${x}"${m}. Bé chạm từng ô theo đúng thứ tự âm.`],
    [/^What is missing in (.+)\?$/, (x) => `Từ "${x}"${m} còn thiếu ô nào? Bé chạm vào ô đúng.`],
  ];
  for (const [re, fn] of rules) {
    const hit = s.match(re);
    if (hit) return fn(hit[1]);
  }
  return meaning ? `Nghĩa: ${meaning}` : '';
}
