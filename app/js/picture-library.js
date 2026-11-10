// 🖼️ Kho ảnh (SPEC 5.6, giống kid-english): ảnh gắn theo TỪ (hoặc CÂU) chứ không theo bài → đặt ảnh cho "cat" một lần,
// mọi bài có "cat" (Phonics, theo sách, Spell, Đọc câu) đều dùng. Lưu trong kho `images` với lessonId = "lib".
// Ảnh tranh của Tả tranh vẫn lưu riêng theo tranh (word "__scene").

import { normalizeWord } from './text.js';
import { setWordImage, removeWordImage, lessonImages, SCENE_IMAGE } from './db.js';
import { BUILTIN_LESSONS, BUILTIN_BY_ID } from './data/builtin-lessons.js';

export const LIB = 'lib';

/** Khóa ảnh: từ → "cat"; câu → "s:the cat can nap". */
export const wordKey = (en) => normalizeWord(en);
export const sentenceKey = (en) => `s:${normalizeWord(en).replace(/[.!?]+$/, '')}`;

/** Mọi ảnh trong kho: Map khóa → bản ghi. */
export const libraryImages = (db) => lessonImages(db, LIB);
export const setLibraryImage = (db, key, img) => setWordImage(db, { lessonId: LIB, wordId: key, ...img });
export const removeLibraryImage = (db, key) => removeWordImage(db, LIB, key);

/** Từ cần hình: mọi từ trừ tricky words (từ nhận diện mặt chữ). */
export const pictureWords = (lesson) => lesson.words.filter((w) => !w.tags?.includes('tricky'));

/**
 * Các mục cần hình của một / nhiều bài, gộp theo khóa (cùng từ ở nhiều bài = một mục):
 * [{ key, kind: 'word'|'sentence', en, vi, emoji, lessons: [tên bài] }]
 */
export function pictureItems(lessons) {
  const map = new Map();
  const add = (key, kind, x, lesson) => {
    const it = map.get(key) ?? { key, kind, en: x.en, vi: x.vi ?? '', emoji: x.emoji ?? null, lessons: [] };
    if (!it.vi && x.vi) it.vi = x.vi;
    if (!it.emoji && x.emoji) it.emoji = x.emoji;
    if (!it.lessons.includes(lesson.title)) it.lessons.push(lesson.title);
    map.set(key, it);
  };
  for (const l of lessons) {
    for (const w of pictureWords(l)) add(wordKey(w.en), 'word', w, l);
    for (const s of l.sentences ?? []) add(sentenceKey(s.en), 'sentence', s, l);
  }
  return [...map.values()];
}

/** Mọi bài (có sẵn + bố mẹ nhập). */
export async function allLessons(db) {
  const own = (await db.getAll('lessons')).filter((l) => !BUILTIN_BY_ID.has(l.id));
  return [...BUILTIN_LESSONS, ...own];
}

/**
 * Chuyển ảnh gắn theo bài của bản 0.3.3 (lessonId = id bài, word = id của từ) sang kho dùng chung (một lần).
 * Kho đã có ảnh cho từ đó thì giữ ảnh kho. Không đụng ảnh tranh của Tả tranh.
 */
export async function migrateLessonPictures(db) {
  const all = await db.getAll('images');
  const old = all.filter((r) => r.lessonId !== LIB && r.word !== SCENE_IMAGE);
  if (!old.length) return 0;
  const lib = new Set(all.filter((r) => r.lessonId === LIB).map((r) => r.word));
  let moved = 0;
  for (const r of old) {
    const lesson = BUILTIN_BY_ID.get(r.lessonId) ?? await db.get('lessons', r.lessonId);
    const w = lesson?.words.find((x) => x.id === r.word);
    if (!w) continue;
    const key = wordKey(w.en);
    await db.write(['images'], (tx) => {
      if (!lib.has(key)) tx.objectStore('images').put({ ...r, id: crypto.randomUUID(), lessonId: LIB, word: key });
      tx.objectStore('images').delete(r.id);
    });
    lib.add(key);
    moved++;
  }
  return moved;
}
