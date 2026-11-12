// Phụ đề khi bé / bố mẹ chạm 🔊 nghe lại (SPEC mục 4.5, giống kid-english): câu tiếng Anh + câu tiếng Việt.
// Câu hỏi của Olly chỉ dùng các mẫu trong QUESTIONS → mỗi mẫu có bản dịch (test kiểm tra đủ).

import { LETTERS, WRITE_LINES } from './write/letters.js';
import { T7_PEOPLE, T7_THINGS } from './math/math.js';

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
  [WRITE_LINES.noDot]: 'Lần này không có chấm xanh — bé tự nhớ chỗ bắt đầu nhé!',
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
  smallestFirst: () => 'Put the smallest number first.',
  biggestFirst: () => 'Put the biggest number first.',
  comesAfter: (n) => `What number comes after ${n}?`,
  comesBefore: (n) => `What number comes before ${n}?`,
  between: (n, m) => `What number is between ${n} and ${m}?`,
  oneMore: (n) => `What is one more than ${n}?`,
  oneLess: (n) => `What is one less than ${n}?`,
  // 🧩 Quest (SPEC-quest 9)
  readAndDo: () => 'Read it and do it!',
  makeSentence: () => 'Make the sentence!',
  whatIsIt: () => 'What is it?',
  startsWith: () => 'It starts with…',
  tapPicture: () => 'Tap a picture!',
  spellPicture: () => 'Spell the picture!',
  // ✍️ Viết từ cuối bài Spell (SPEC-write 8.2)
  writeWord: (word) => `Write ${word}. ${[...word].join(' – ')}.`,
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
    [/^Write ([a-z]+)\. /, (x) => `Bé chép từ "${x}"${m} vào các ô: mỗi ô một chữ, viết theo chữ mờ. Viết xong bấm ✅.`],
    [/^Put the smallest number first\.$/, () => 'Bé chạm số nhỏ nhất trước, rồi lần lượt các số lớn dần, xếp vào hàng (first → next → last).'],
    [/^Put the biggest number first\.$/, () => 'Bé chạm số lớn nhất trước, rồi lần lượt các số nhỏ dần, xếp vào hàng (first → next → last).'],
    [/^What number comes after (.+)\?$/, (x) => `Số nào đứng ngay sau số ${x}? Bé chạm số đó trên tia số (ếch nhảy 1 bước sang phải).`],
    [/^What number comes before (.+)\?$/, (x) => `Số nào đứng ngay trước số ${x}? Bé chạm số đó trên tia số (ếch nhảy 1 bước sang trái).`],
    [/^What number is between (.+) and (.+)\?$/, (x, y) => `Số nào nằm giữa ${x} và ${y}? Bé chạm số đó trên tia số.`],
    [/^What is one more than (.+)\?$/, (x) => `Số nào hơn ${x} một? Hơn một = nhảy 1 bước tới trước (sang phải).`],
    [/^What is one less than (.+)\?$/, (x) => `Số nào kém ${x} một? Kém một = nhảy 1 bước lùi lại (sang trái).`],
    [/^(\w+) has (\d+) (\w+)\. (\w+) has (\d+) \w+\. Who has (more|fewer)\?$/, (a, x, thing, b, y, ask) => {
      const vi = (name) => T7_PEOPLE[name]?.vi ?? name;
      const t = T7_THINGS[thing]?.vi ?? thing;
      return `${vi(a)} có ${x} ${t}. ${vi(b)} có ${y} ${t}. Ai có ${ask === 'more' ? 'nhiều' : 'ít'} hơn? Bé chạm vào người đúng.`;
    }],
    [/^Read it and do it!$/, () => 'Bé đọc câu rồi làm theo: chạm đồ vật, rồi chạm chỗ đặt.'],
    [/^Make the sentence!$/, () => 'Bé chạm các thẻ từ theo đúng thứ tự để thành câu.'],
    [/^What is it\?$/, () => `Đó là gì? Bé đọc 2 câu gợi ý${m} rồi chạm đáp án đúng.`],
    [/^It starts with…$/, () => 'Từ này bắt đầu bằng âm Olly vừa đọc. Bé tìm từ có âm đầu đó nhé.'],
    [/^Tap a picture!$/, () => 'Bé chạm một hình gợi ý để chọn từ, rồi xếp chữ vào các ô của từ đó.'],
    [/^Spell the picture!$/, () => 'Bé nhìn hình, nhớ từ tiếng Anh rồi xếp chữ vào ô. Bấm 🔊 để nghe Olly đọc từ.'],
    [/^Put the (\w+) (in|on|under) the (\w+)(?: and the (\w+) (in|on|under) the (\w+))?\.$/, (a, w1, p1, b, w2, p2) => {
      const pos = { in: 'vào trong', on: 'lên trên', under: 'xuống dưới' };
      const one = `đặt "${a}" ${pos[w1]} "${p1}"`;
      return `Câu chỉ dẫn: ${b ? `${one}, và đặt "${b}" ${pos[w2]} "${p2}"` : one}. Bé chạm đồ vật, rồi chạm chỗ đặt.`;
    }],
    [/^Make (.+)!$/, (x) => `Bé xếp số ${x}: thêm thanh chục và khối lẻ, rồi bấm ✅.`],
  ];
  for (const [re, fn] of rules) {
    const hit = s.match(re);
    if (hit) return fn(...hit.slice(1));
  }
  return meaning ? `Nghĩa: ${meaning}` : '';
}
