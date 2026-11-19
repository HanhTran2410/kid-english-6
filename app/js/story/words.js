// 📚 Truyện ngắn — phân loại từ (SPEC-story.md 3.2) và bậc độ khó (3.1). Hàm thuần, chạy được trong Node (test, script
// sinh STORIES.md). Không có danh sách tricky riêng: dùng learnedPhonics / NOT_PHONETIC của Quest và NOT_DECODABLE
// của bảng câu đố — truyện có sẵn, màn chơi, Góc bố mẹ và prompt AI đều gọi các hàm ở đây.

import { normalizeWord } from '../text.js';
import { learnedGraphemes, toGraphemes } from '../phonics.js';
import { learnedPhonics, NOT_PHONETIC } from '../quest/content.js';
import { NOT_DECODABLE } from '../quest/riddles.js';

export const WORD_KIND = { DECODABLE: 'decodable', TRICKY: 'tricky', NEW: 'new' };

const ALL_GRAPHEMES = learnedGraphemes(7);
const NOT_READABLE = new Set([...NOT_PHONETIC, ...NOT_DECODABLE]);

/**
 * Cách viết CHƯA dạy ở nhóm 1–7 (3.2 bước 3): bảng grapheme không có các chữ ghép này nên `toGraphemes` tách thành
 * chữ đơn và coi là đọc được (*eat* = e-a-t, *cow* = c-o-w, *bike* = b-i-k-e) — sai. Chặn theo mẫu chính tả:
 * nguyên âm ghép / âm r chưa học, phụ âm ghép chưa học, c mềm, e câm cuối (split digraph — học sau nhóm 7),
 * y cuối đọc là nguyên âm (*happy*). Từ tricky đã học được xét trước nên không bị chặn (*the, he, they, my*).
 */
export const UNTAUGHT_SPELLING = /ea|ay|ey|oy|ow|ew|aw|au|igh|ir|ur|wh|ph|kn|wr|gh|tch|dge|c[eiy]|[aeiou][^aeiouy]e$|[^aeiou]y$/;

/** Bé đã đọc xong nhóm 1 → `group` (truyện Phonics nhóm N giả định bé đã xong nhóm 1 → N). */
export const learnedUpTo = (group) => learnedPhonics(Array.from({ length: Math.max(0, group) }, (_, i) => i + 1));

/**
 * Tách câu thành các từ để hiển thị + phân loại (3.2 bước 1–4): tách theo khoảng trắng, từ có gạch nối thành hai phần;
 * `text` giữ nguyên chữ hiển thị (cả dấu câu), `word` đã chuẩn hóa (chữ thường, bỏ dấu câu hai đầu, bỏ đuôi 's / s').
 * Từ chỉ có dấu câu ("—") bị bỏ.
 */
export function storyTokens(sentence) {
  const out = [];
  for (const chunk of String(sentence).trim().split(/\s+/).filter(Boolean)) {
    const parts = chunk.split('-');
    parts.forEach((p, i) => {
      const text = i < parts.length - 1 ? `${p}-` : p;
      let word = normalizeWord(p);
      if (/[a-z]'s$/.test(word)) word = word.slice(0, -2);
      else if (/s'$/.test(word)) word = word.slice(0, -1);
      if (word) out.push({ text, word });
    });
  }
  return out;
}

/**
 * Loại của một từ đã chuẩn hóa (3.2, dừng ở bước đầu tiên khớp):
 * 1. tricky / từ nhận diện đã học → tricky; 2. tricky chưa học / từ không đọc theo âm → new;
 * 3. cách viết chưa dạy (`UNTAUGHT_SPELLING`) → new;
 * 4. tách theo bảng grapheme đầy đủ và mọi grapheme đã học → decodable (kèm `graphemes`); 5. còn lại → new.
 * @param {string} word từ đã chuẩn hóa (`storyTokens`)
 * @param {{ graphemes: Set<string>, tricky: Set<string> }} lp `learnedPhonics(...)`
 */
export function classifyWord(word, lp) {
  if (lp.tricky.has(word)) return { kind: WORD_KIND.TRICKY };
  if (NOT_READABLE.has(word) || UNTAUGHT_SPELLING.test(word)) return { kind: WORD_KIND.NEW };
  const graphemes = toGraphemes(word, ALL_GRAPHEMES);
  if (graphemes && graphemes.every((g) => lp.graphemes.has(g))) return { kind: WORD_KIND.DECODABLE, graphemes };
  return { kind: WORD_KIND.NEW };
}

/** Câu → các từ kèm loại: `[{ text, word, kind, graphemes? }]`. */
export const classifySentence = (sentence, lp) => storyTokens(sentence).map((t) => ({ ...t, ...classifyWord(t.word, lp) }));

/** Mọi câu của truyện, theo thứ tự trang. */
export const storySentences = (story) => story.pages.flatMap((p) => p.sentences.map((s) => ({ ...s, pageId: p.id })));

/**
 * Bé đọc được bao nhiêu (3.2): tỉ lệ tính trên mọi LẦN xuất hiện; từ mới liệt kê mỗi từ một lần kèm số lần gặp.
 * @returns {{ total: number, readable: number, ratio: number, newWords: Array<{ word: string, count: number }> }}
 */
export function readability(story, lp) {
  let total = 0;
  let readable = 0;
  const fresh = new Map();
  for (const s of storySentences(story)) {
    for (const t of classifySentence(s.en, lp)) {
      total += 1;
      if (t.kind === WORD_KIND.NEW) fresh.set(t.word, (fresh.get(t.word) ?? 0) + 1);
      else readable += 1;
    }
  }
  return { total, readable, ratio: total ? readable / total : 1, newWords: [...fresh].map(([word, count]) => ({ word, count })) };
}

/**
 * Bậc độ khó theo nhóm âm (3.1). `words`: số từ mỗi câu [ít nhất, nhiều nhất]; `hardMax`: câu dài hơn `words[1]` tới mức
 * này được phép nếu có `chunks`; `noPronouns`: đại từ chưa được dùng ở bậc này (*it* dùng được từ bậc A: *It is…*).
 */
export const STORY_LEVELS = {
  A: { groups: [1, 2], words: [3, 5], hardMax: 5, noPronouns: ['he', 'she', 'they'], maxNewRatio: 0 },
  B: { groups: [3, 4], words: [3, 6], hardMax: 6, noPronouns: ['they'], maxNewRatio: 0 },
  C: { groups: [5, 6, 7], words: [4, 7], hardMax: 9, noPronouns: [], maxNewRatio: 0.1 },
};

export const levelOf = (group) => (group <= 2 ? 'A' : group <= 4 ? 'B' : 'C');

/**
 * Câu lệch bậc của truyện (cảnh báo khi nhập, lỗi với truyện có sẵn): độ dài câu, câu dài thiếu `chunks`, đại từ sớm.
 * Quy tắc "đại từ chỉ khi câu ngay trước nói về đúng người / vật đó" cần đọc nghĩa → bố mẹ duyệt ở STORIES.md.
 * @returns {string[]} mô tả từng chỗ lệch (tiếng Việt)
 */
export function levelProblems(story, group = story.group) {
  const name = levelOf(group);
  const lv = STORY_LEVELS[name];
  const out = [];
  for (const s of storySentences(story)) {
    const n = storyTokens(s.en).length;
    const where = `Trang ${s.pageId}, câu "${s.en}"`;
    if (n < lv.words[0]) out.push(`${where}: ${n} từ, bậc ${name} cần ≥ ${lv.words[0]}.`);
    if (n > lv.hardMax) out.push(`${where}: ${n} từ, bậc ${name} tối đa ${lv.hardMax}.`);
    else if (n > lv.words[1] && !s.chunks?.length) out.push(`${where}: ${n} từ — câu dài cần chia cụm (chunks).`);
    const early = storyTokens(s.en).map((t) => t.word).filter((w) => lv.noPronouns.includes(w));
    if (early.length) out.push(`${where}: bậc ${name} chưa dùng "${[...new Set(early)].join(', ')}".`);
  }
  return out;
}
