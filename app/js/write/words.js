// ✍️ Viết từ (SPEC-write.md mục 8) + gợi ý cho bố mẹ (9.4) — hàm thuần.

import { LETTERS } from './letters.js';

export const WRITE_WORDS_MAX = 2;
const LOWER = /^[a-z]+$/;

/**
 * Từ được viết cuối lượt học bài Spell (8.1): từ trong hoạt động `spell` của bài, bản ghi
 * "<lessonId>/spell/<id>" có streak ≥ 2, mọi ký tự là chữ thường a–z. Tối đa 2 từ, ít viết (`practiced` của
 * "<lessonId>/write/<id>") trước, rồi viết lâu nhất trước.
 * @param {{ id: string, activities: Array, words: Array }} lesson
 * @param {Array<{ key: string }>} records bản ghi tiến độ của bài
 */
export function pickWriteWords(lesson, records, max = WRITE_WORDS_MAX) {
  const byKey = new Map(records.map((r) => [r.key, r]));
  const ids = new Set(lesson.activities.filter((a) => a.type === 'spell').flatMap((a) => a.items));
  return lesson.words
    .filter((w) => ids.has(w.id) && LOWER.test(w.en) && (byKey.get(`${lesson.id}/spell/${w.id}`)?.streak ?? 0) >= 2)
    .map((w) => ({ w, rec: byKey.get(`${lesson.id}/write/${w.id}`) }))
    .sort((a, b) => (a.rec?.practiced ?? 0) - (b.rec?.practiced ?? 0) || (a.rec?.lastAt ?? 0) - (b.rec?.lastAt ?? 0))
    .slice(0, max)
    .map(({ w }) => w);
}

/** Mỗi chữ cái một ô, kể cả chữ lặp (8.2): "apple" → 5 ô. */
export const wordCells = (word) => [...word].filter((ch) => LETTERS[ch]);

/** Câu gợi ý cho bố mẹ theo lý do sai nhiều nhất của một chữ (9.4); chưa sai lần nào → null. */
export function letterTip(letter, reasons = {}) {
  const top = Object.entries(reasons).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const { vi } = LETTERS[letter];
  const what = {
    start: `Bé hay bắt đầu chữ ${letter} sai chỗ.`,
    reverse: `Bé hay viết chữ ${letter} ngược chiều.`,
    stray: `Bé hay viết chữ ${letter} lệch đường mẫu hoặc nhấc tay giữa chừng.`,
    dot: `Bé hay kéo nét ở chỗ chấm của chữ ${letter}.`,
  }[top[0]];
  const how = top[0] === 'dot' ? 'chỉ chạm một cái vào chấm, không kéo.' : vi.charAt(0).toLowerCase() + vi.slice(1);
  return { reason: top[0], count: top[1], text: `${what} Nhắc bé: ${how}` };
}
