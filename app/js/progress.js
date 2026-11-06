// Tiến độ (SPEC mục 4.3) và sao (mục 4.4). Ba loại bản ghi trong kho `progress`:
//   mục:   "<lessonId>/<activity>/<itemId>"  — ví dụ "phonics-g6/blend/ship"; cùng từ ở hai bài là hai bản ghi
//   tricky: "tricky/card/<từ>"               — bộ thẻ dùng chung cho mọi bài (lessonId "tricky")
//   bài:   "lesson:<lessonId>" (khu Read), "lesson:<lessonId>/spell" (khu Spell — sao riêng)
// Mọi bản ghi có `lessonId` (chỉ mục) để lấy / xóa theo bài.

import { normalizeWord } from './text.js';

/** Kết quả một mục có chấm / không chấm. */
export const RESULT = {
  INDEPENDENT: 'independent', // đúng ngay lần đầu, không gợi ý
  HELPED: 'helped', // đúng sau khi thử lại / nghe gợi ý
  MISSED: 'missed', // phải xem đáp án, hoặc nghe ra "miss"
  PRACTICED: 'practiced', // làm xong phần không chấm (đọc to không có mic…)
};

export const TRICKY_LESSON = 'tricky';

export const itemKey = (lessonId, activity, itemId) => `${lessonId}/${activity}/${itemId}`;
/** Khóa tiến độ bài; `part` = khu khác Read (vd. 'spell') → sao riêng của khu đó: "lesson:<id>/spell". */
export const lessonKey = (lessonId, part = '') => `lesson:${lessonId}${part ? `/${part}` : ''}`;
export const trickyRef = (word) => ({ lessonId: TRICKY_LESSON, activity: 'card', itemId: normalizeWord(word) });

export const emptyItem = ({ lessonId, activity, itemId }) => ({
  key: itemKey(lessonId, activity, itemId),
  lessonId,
  activity,
  itemId,
  seen: 0,
  independent: 0,
  helped: 0,
  missed: 0,
  practiced: 0,
  streak: 0,
  lastAt: null,
});

export const emptyLesson = (lessonId, part = '') => ({
  key: lessonKey(lessonId, part), lessonId, part, plays: 0, completedAt: null, bestStars: 0, lastStars: 0, lastAt: null,
});

/** Cộng một kết quả vào tiến độ mục (hàm thuần). */
export function applyResult(p, result, now = Date.now()) {
  if (!Object.values(RESULT).includes(result)) throw new Error(`Kết quả không hợp lệ: ${result}`);
  const streak = result === RESULT.MISSED ? 0 : result === RESULT.PRACTICED ? p.streak : p.streak + 1;
  return { ...p, seen: p.seen + 1, [result]: p[result] + 1, streak, lastAt: now };
}

/**
 * Sao của một lượt chơi (SPEC 4.4), tính trên các mục CÓ CHẤM (bỏ `practiced`).
 * 3: ≥ 90% độc lập · 2: ≥ 60% độc lập hoặc có gợi ý và tối đa 1 mục phải xem đáp án · 1: làm xong.
 * Không có mục nào được chấm → null (không hiện sao).
 * @param {string[]} results
 */
export function starsFor(results) {
  const scored = results.filter((r) => r !== RESULT.PRACTICED);
  if (!scored.length) return null;
  const count = (r) => scored.filter((x) => x === r).length;
  const independent = count(RESULT.INDEPENDENT) / scored.length;
  const passed = (count(RESULT.INDEPENDENT) + count(RESULT.HELPED)) / scored.length;
  if (independent >= 0.9) return 3;
  if (passed >= 0.6 && count(RESULT.MISSED) <= 1) return 2;
  return 1;
}

/** Ghi lượt chơi xong một bài (hàm thuần): giữ sao tốt nhất, không giảm khi chơi lại. */
export function applyLessonDone(p, stars, now = Date.now()) {
  return {
    ...p,
    plays: p.plays + 1,
    completedAt: p.completedAt ?? now,
    bestStars: Math.max(p.bestStars, stars ?? 0),
    lastStars: stars ?? 0,
    lastAt: now,
  };
}

/** Hộp ôn tricky words (SPEC 3.1.4): số ngày tới lần gặp lại theo hộp 0–4. Hộp 0 = gặp lại trong buổi. */
export const TRICKY_BOX_DAYS = [0, 1, 3, 7, 14];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Cập nhật hộp ôn của một thẻ tricky (hàm thuần): sai → hộp 0; có gợi ý → giữ hộp; độc lập → +1. */
export function applyTricky(p, result, now = Date.now()) {
  const box = p.box ?? 0;
  const next = result === RESULT.MISSED ? 0 : result === RESULT.INDEPENDENT ? Math.min(box + 1, TRICKY_BOX_DAYS.length - 1) : box;
  const days = result === RESULT.HELPED ? Math.max(1, TRICKY_BOX_DAYS[next]) : TRICKY_BOX_DAYS[next];
  return { ...applyResult(p, result, now), box: next, nextAt: now + days * DAY_MS };
}

// ---------- Đọc / ghi trong IndexedDB ----------

export async function getItem(db, ref) {
  return (await db.get('progress', itemKey(ref.lessonId, ref.activity, ref.itemId))) ?? emptyItem(ref);
}

export async function recordItem(db, ref, result, now = Date.now()) {
  const next = applyResult(await getItem(db, ref), result, now);
  await db.put('progress', next);
  return next;
}

export async function recordTricky(db, word, result, now = Date.now()) {
  const next = applyTricky(await getItem(db, trickyRef(word)), result, now);
  await db.put('progress', next);
  return next;
}

export async function getLessonProgress(db, lessonId, part = '') {
  return (await db.get('progress', lessonKey(lessonId, part))) ?? emptyLesson(lessonId, part);
}

export async function recordLessonDone(db, lessonId, stars, now = Date.now(), part = '') {
  const next = applyLessonDone(await getLessonProgress(db, lessonId, part), stars, now);
  await db.put('progress', next);
  return next;
}
