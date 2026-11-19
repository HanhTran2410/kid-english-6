// 📚 Truyện ngắn — dữ liệu dùng chung cho màn bé và Góc bố mẹ (SPEC-story.md): danh sách truyện, nhóm âm bé đã học,
// câu hỏi chơi được, chấm xếp thứ tự, sao (6.3), tiến độ nghe / đọc (7.1). Phần thuần (không DOM) chạy được trong Node.

import { BUILTIN_STORIES } from './builtin-stories.js';
import { BUILTIN_LESSONS } from '../data/builtin-lessons.js';
import { learnedPhonics } from '../quest/content.js';
import { getLessonProgress, getItem, itemKey, RESULT } from '../progress.js';

export const STORY_BY_ID = new Map(BUILTIN_STORIES.map((s) => [s.id, s]));

/** Truyện có sẵn (theo nhóm) rồi truyện bố mẹ tạo (Phonics theo nhóm, rồi Theo sách, cũ trước). */
export async function allStories(db) {
  const own = (await db.getAll('stories')).filter((s) => !STORY_BY_ID.has(s.id) && s.pages?.length);
  const order = (s) => [s.track === 'phonics' ? 0 : 1, s.group ?? 99, s.createdAt ?? 0];
  own.sort((a, b) => {
    const x = order(a);
    const y = order(b);
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  });
  return [...BUILTIN_STORIES, ...own];
}

export async function getStory(db, id) {
  return STORY_BY_ID.get(id) ?? (await db.get('stories', id)) ?? null;
}

/** Nhóm âm bé đã đọc xong bài Phonics có sẵn (giống Quest) → kiến thức để phân loại từ (SPEC-story 3.2). */
export async function learnedNow(db) {
  const groups = [];
  for (const l of BUILTIN_LESSONS) {
    if (l.track === 'phonics' && (await getLessonProgress(db, l.id)).completedAt) groups.push(l.group);
  }
  return learnedPhonics(groups.length ? groups : [1]);
}

/**
 * Hình của trang để xếp thứ tự (6.1): ảnh trang, không thì emoji của trang. Trang chỉ còn emoji bìa (`cover`) thì không
 * phân biệt được với trang khác → không có hình riêng.
 * @param {(pageId: string) => boolean} hasImage
 */
export const pageVisual = (page, hasImage) => (hasImage(page.id) ? `img:${page.id}` : page.emoji ? `emoji:${page.emoji}` : null);

/**
 * Câu hỏi chơi được (6.1): `order` bị bỏ khi một trong 3 trang không có hình riêng, hoặc hai trang trùng hình
 * (bé không phân biệt được hai thẻ).
 */
export function playableQuestions(story, hasImage = () => false) {
  return story.questions.filter((q) => {
    if (q.type !== 'order') return true;
    const visuals = q.pages.map((id) => story.pages.find((p) => p.id === id)).map((p) => (p ? pageVisual(p, hasImage) : null));
    return visuals.every(Boolean) && new Set(visuals).size === visuals.length;
  });
}

/** Chấm xếp thứ tự (6.2): `placed[k]` = id trang bé đặt ở ô k → ô nào đúng. */
export const orderCorrect = (placed, answer) => answer.map((id, k) => placed[k] === id);

/**
 * Sao của lượt câu hỏi (6.3): mọi câu độc lập → 3; không câu nào phải xem đáp án → 2; có → 1. Không câu nào → null.
 * @param {string[]} results
 */
export function storyStars(results) {
  if (!results.length) return null;
  if (results.every((r) => r === RESULT.INDEPENDENT)) return 3;
  if (!results.includes(RESULT.MISSED)) return 2;
  return 1;
}

/** Nghe tới hết trang cuối (7.1): `listened + 1` trên bản ghi bài `lesson:<storyId>`. */
export async function recordListened(db, storyId, now = Date.now()) {
  const p = await getLessonProgress(db, storyId);
  const next = { ...p, listened: (p.listened ?? 0) + 1, lastAt: now };
  await db.put('progress', next);
  return next;
}

/** Mức đọc của một câu (SPEC 3.1.5) từ tập từ máy nghe được: ≥ 80% từ → cả câu; có cụm + nghe được một phần → cụm; còn lại → từ. */
export const READ_LEVELS = ['word', 'chunk', 'sentence'];
export function readLevel(words, heard, hasChunks = false) {
  if (!heard || !words.length) return null;
  const got = words.filter((w) => heard.has(w)).length;
  if (got / words.length >= 0.8) return 'sentence';
  if (got > 0 && hasChunks) return 'chunk';
  return got > 0 ? 'word' : null;
}
const higher = (a, b) => (READ_LEVELS.indexOf(a) >= READ_LEVELS.indexOf(b) ? a : b);

/**
 * Bé đọc một câu ở ② (5, 7.1): `<storyId>/read/<sid>` — đọc xong → `practiced + 1` + mức cao nhất; bỏ qua → `skipped + 1`.
 * `en` lưu chữ câu lúc ghi để biết câu đã bị sửa (7.2).
 */
export async function recordStoryRead(db, storyId, sentence, { skipped = false, level = null } = {}, now = Date.now()) {
  const p = await getItem(db, { lessonId: storyId, activity: 'read', itemId: sentence.id });
  const next = {
    ...p,
    key: itemKey(storyId, 'read', sentence.id),
    practiced: p.practiced + (skipped ? 0 : 1),
    skipped: (p.skipped ?? 0) + (skipped ? 1 : 0),
    bestLevel: level ? (p.bestLevel ? higher(level, p.bestLevel) : level) : p.bestLevel ?? null,
    en: sentence.en,
    lastAt: now,
  };
  await db.put('progress', next);
  return next;
}
