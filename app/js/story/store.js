// 📚 Truyện ngắn — lưu / thay / xóa truyện và ảnh trang trong IndexedDB (SPEC-story 7.2, 8.1, 8.4). Mỗi thao tác là MỘT
// giao dịch: lỗi giữa chừng → không đổi gì. Ảnh trang: kho `images`, lessonId = id truyện, word = id trang (+ `source`,
// `gridCell`); ảnh lưới gốc: word = `_grid` (+ `cols`, `rows`, `cells` = ô → id trang / null).

import { lessonKey, itemKey } from '../progress.js';

export const STORY_GRID = '_grid';

const imageRecord = ({ blob, mimeType, width, height }, data, extra) => ({
  id: crypto.randomUUID(), mimeType: mimeType || blob?.type || 'image/jpeg', width, height, data, createdAt: Date.now(), ...extra,
});

/** Lưu truyện mới (đã qua validateStory, id thật). */
export async function saveStory(db, story, now = Date.now()) {
  const record = { ...story, createdAt: story.createdAt ?? now, updatedAt: now };
  await db.put('stories', record);
  return record;
}

/**
 * Thay truyện cùng id (7.2): xóa tiến độ câu đọc / câu hỏi trong `resets`, ảnh của trang bị xóa và ảnh mồ côi (không còn
 * trang nào, không phải ảnh lưới gốc). Truyện có sẵn của app không thay được.
 * @param {{ readIds: string[], quizIds: string[], pageIds: string[] }} resets từ `storyResets(cũ, mới)`
 */
export async function replaceStory(db, story, resets, now = Date.now()) {
  const old = await db.get('stories', story.id);
  if (old?.builtIn) throw new Error('Truyện có sẵn của app không thay được.');
  const keep = new Set(story.pages.map((p) => p.id));
  const images = (await db.getAllByIndex('images', 'lessonId', story.id)).filter((r) => r.word !== STORY_GRID && !keep.has(r.word));
  const record = { ...story, createdAt: old?.createdAt ?? story.createdAt ?? now, updatedAt: now };
  await db.write(['stories', 'progress', 'images'], (tx) => {
    tx.objectStore('stories').put(record);
    for (const sid of resets.readIds) tx.objectStore('progress').delete(itemKey(story.id, 'read', sid));
    for (const qid of resets.quizIds) tx.objectStore('progress').delete(itemKey(story.id, 'quiz', qid));
    for (const r of images) tx.objectStore('images').delete(r.id);
  });
  return record;
}

/** Xóa truyện + tiến độ + ảnh trang + ảnh lưới (một giao dịch). */
export async function deleteStory(db, storyId) {
  const story = await db.get('stories', storyId);
  if (story?.builtIn) throw new Error('Truyện có sẵn của app không xóa được.');
  const [progress, images] = await Promise.all([
    db.getAllByIndex('progress', 'lessonId', storyId),
    db.getAllByIndex('images', 'lessonId', storyId),
  ]);
  await db.write(['stories', 'progress', 'images'], (tx) => {
    tx.objectStore('stories').delete(storyId);
    for (const p of progress) tx.objectStore('progress').delete(p.key);
    tx.objectStore('progress').delete(lessonKey(storyId));
    for (const i of images) tx.objectStore('images').delete(i.id);
  });
}

/** Thay ảnh MỘT trang bằng ảnh lẻ (chọn / chụp, hoặc ảnh vẽ lại một trang) — ảnh cũ của trang bị xóa cùng giao dịch. */
export async function setPageImage(db, storyId, pageId, img) {
  const old = (await db.getAllByIndex('images', 'lessonId', storyId)).filter((r) => r.word === pageId);
  const record = imageRecord(img, await img.blob.arrayBuffer(), { lessonId: storyId, word: pageId, source: 'single' });
  await db.write(['images'], (tx) => {
    for (const r of old) tx.objectStore('images').delete(r.id);
    tx.objectStore('images').put(record);
  });
  return record;
}

/** Xóa ảnh của một trang (trang quay về emoji). */
export async function removePageImage(db, storyId, pageId) {
  const old = (await db.getAllByIndex('images', 'lessonId', storyId)).filter((r) => r.word === pageId);
  await db.write(['images'], (tx) => old.forEach((r) => tx.objectStore('images').delete(r.id)));
}

/**
 * Lưu ảnh lưới (8.4 "Lưu ảnh"): ảnh lưới gốc + bảng ô → trang, và ảnh từng trang được gán ô (`source: 'grid'`, `gridCell`).
 * Trang không được gán ô giữ ảnh cũ. Một giao dịch.
 * @param {{ grid: object, cols: number, rows: number, cells: (string|null)[], tiles: object[] }} opts
 */
export async function saveGridImages(db, storyId, { grid, cols, rows, cells, tiles }) {
  const assigned = cells.map((pageId, cell) => (pageId ? { pageId, cell } : null)).filter(Boolean);
  const replaceWords = new Set([STORY_GRID, ...assigned.map((a) => a.pageId)]);
  const old = (await db.getAllByIndex('images', 'lessonId', storyId)).filter((r) => replaceWords.has(r.word));
  const gridRec = imageRecord(grid, await grid.blob.arrayBuffer(), { lessonId: storyId, word: STORY_GRID, cols, rows, cells: [...cells] });
  const pageRecs = [];
  for (const a of assigned) {
    const t = tiles[a.cell];
    pageRecs.push(imageRecord(t, await t.blob.arrayBuffer(), { lessonId: storyId, word: a.pageId, source: 'grid', gridCell: a.cell }));
  }
  await db.write(['images'], (tx) => {
    for (const r of old) tx.objectStore('images').delete(r.id);
    tx.objectStore('images').put(gridRec);
    for (const r of pageRecs) tx.objectStore('images').put(r);
  });
}

/** Xóa ảnh lưới gốc (ảnh các trang giữ nguyên). */
export const removeGridImage = (db, storyId) => removePageImage(db, storyId, STORY_GRID);
