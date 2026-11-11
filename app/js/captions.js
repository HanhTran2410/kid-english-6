// Phụ đề khi bé / bố mẹ chạm 🔊 nghe lại (SPEC mục 4.5, giống kid-english): câu tiếng Anh + câu tiếng Việt.
// Câu hỏi của Olly chỉ dùng các mẫu trong QUESTIONS → mỗi mẫu có bản dịch (test kiểm tra đủ).

import { LETTERS, WRITE_LINES } from './write/letters.js';

/** ✍️ Tập viết (SPEC-write 5.5, 4): câu Olly nói khi chấm nét / chuyển lượt. */
const WRITE_VI = {
  [WRITE_LINES.start]: 'Bé bắt đầu ở chấm xanh nhé!',
  [WRITE_LINES.reverse]: 'Bé đi theo mũi tên nhé!',
  [WRITE_LINES.stray]: 'Bé thử lại, đi theo đường chữ mẫu nhé.',
  [WRITE_LINES.lifted]: 'Bé viết liền một mạch, đừng nhấc tay giữa chừng nhé!',
  [WRITE_LINES.dot]: 'Bé chỉ cần chạm vào chấm thôi!',
  [WRITE_LINES.again]: 'Giỏi lắm! Tô lại lần nữa nhé!',
  [WRITE_LINES.yourTurn]: 'Giờ bé tự viết nhé!',
  [WRITE_LINES.theDot]: 'Giờ bé chấm lên trên nhé!',
};

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
  readSentence: () => 'Your turn! Read the sentence!',
  whichPicture: () => 'Which picture shows it?',
  findInPicture: () => 'Where is it? Tap the picture!',
  // Khu 🔢 Math (SPEC-math 7)
  whichBigger: () => 'Which number is bigger?',
  whichSmaller: () => 'Which number is smaller?',
  whichMore: () => 'Which group has more?',
  whichFewer: () => 'Which group has fewer?',
  whichSign: () => 'Which sign goes in the middle?',
  makeNumber: (n) => `Make ${n}!`,
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
  const letter = Object.values(LETTERS).find((l) => l.say === s);
  if (letter) return letter.vi;
  if (WRITE_VI[s]) return WRITE_VI[s];
  const rules = [
    [/^Which letter says this sound\?$/, () => 'Âm này là của chữ nào? Bé nghe rồi chạm vào chữ đúng.'],
    [/^Your turn! Say the sound!$/, () => 'Đến lượt bé! Bé nói theo âm này nhé.'],
    [/^Tap the letters\. Then tap Blend!$/, () => 'Bé chạm từng ô để nghe âm, rồi bấm nút Ghép.'],
    [/^Your turn! Read it!$/, () => 'Đến lượt bé! Bé đọc to từ này nhé.'],
    [/^Your turn! Read the sentence!$/, () => 'Đến lượt bé! Bé đọc to cả câu nhé.'],
    [/^Where is it\? Tap the picture!$/, () => `Câu này tả chỗ nào trong tranh${m}? Bé chạm vào đúng chỗ đó.`],
    [/^Which picture shows it\?$/, () => `Hình nào đúng với câu này${m}? Bé chạm vào hình đúng.`],
    [/^Which one is (.+)\?$/, (x) => `Hình nào là "${x}"${m}? Bé chạm vào hình đúng.`],
    [/^Find the word: (.+)!$/, (x) => `Tìm chữ "${x}"${m}! Bé chạm vào thẻ đúng.`],
    [/^Spell: (.+)!$/, (x) => `Xếp các ô thành từ "${x}"${m}. Bé chạm từng ô theo đúng thứ tự âm.`],
    [/^What is missing in (.+)\?$/, (x) => `Từ "${x}"${m} còn thiếu ô nào? Bé chạm vào ô đúng.`],
    [/^Which number is bigger\?$/, () => 'Số nào lớn hơn? Bé chạm vào số lớn hơn.'],
    [/^Which number is smaller\?$/, () => 'Số nào nhỏ hơn? Bé chạm vào số nhỏ hơn.'],
    [/^Which group has more\?$/, () => 'Nhóm nào nhiều hơn? Bé đếm từng con rồi chạm nút dưới nhóm đó (bằng nhau thì chạm "= The same").'],
    [/^Which group has fewer\?$/, () => 'Nhóm nào ít hơn? Bé đếm từng con rồi chạm nút dưới nhóm đó (bằng nhau thì chạm "= The same").'],
    [/^Which sign goes in the middle\?$/, () => 'Dấu nào điền vào ô giữa: lớn hơn (>), bé hơn (<) hay bằng (=)? Bé chạm dấu trong khay.'],
    [/^Make (.+)!$/, (x) => `Bé xếp số ${x}: thêm thanh chục và khối lẻ, rồi bấm ✅.`],
  ];
  for (const [re, fn] of rules) {
    const hit = s.match(re);
    if (hit) return fn(hit[1]);
  }
  return meaning ? `Nghĩa: ${meaning}` : '';
}
