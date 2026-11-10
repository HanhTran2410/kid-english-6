// IndexedDB. Ảnh và ghi âm lưu dạng ArrayBuffer + mimeType (Safari iOS có lúc không đọc lại được Blob đã lưu).
// Lấy từ kid-english/app/js/db.js, bỏ phần riêng của app bé 3 tuổi (khung hình flipbook, sticker).

import { normalizeWord, dayKey } from './text.js';

export const DB_NAME = 'kid-english-6';
export const STORES = ['lessons', 'images', 'recordings', 'progress', 'settings', 'scenes'];

// Mỗi phần tử là một bước nâng cấp cấu trúc. Thêm bước mới vào CUỐI khi đổi cấu trúc; dữ liệu cũ tự chuyển khi mở app.
export const MIGRATIONS = [
  (db) => {
    db.createObjectStore('lessons', { keyPath: 'id' });
    const images = db.createObjectStore('images', { keyPath: 'id' });
    images.createIndex('lessonId', 'lessonId');
    images.createIndex('word', 'word');
    const recordings = db.createObjectStore('recordings', { keyPath: 'id' });
    recordings.createIndex('lessonId', 'lessonId');
    recordings.createIndex('word', 'word');
    db.createObjectStore('progress', { keyPath: 'key' });
    db.createObjectStore('settings', { keyPath: 'key' });
  },
  // 0.1.2: tiến độ theo bài / hoạt động / mục (SPEC 4.3) — chỉ mục lessonId để lấy / xóa tiến độ theo bài.
  // (Bản 0.1.x chưa ghi tiến độ nào nên không có dữ liệu cũ phải chuyển.)
  (db, tx) => {
    tx.objectStore('progress').createIndex('lessonId', 'lessonId');
  },
  // 0.4.1: kho tranh của Tả tranh (SPEC-ta-tranh mục 7.1) — chỉ thêm kho, không đụng dữ liệu cũ.
  (db) => {
    db.createObjectStore('scenes', { keyPath: 'id' });
  },
];

const request = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const done = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error ?? new DOMException('Transaction aborted', 'AbortError'));
});

export class Database {
  constructor(idb) {
    this.idb = idb;
  }

  async get(store, key) {
    return request(this.idb.transaction(store).objectStore(store).get(key));
  }

  async getAll(store) {
    return request(this.idb.transaction(store).objectStore(store).getAll());
  }

  async getAllByIndex(store, index, value) {
    return request(this.idb.transaction(store).objectStore(store).index(index).getAll(value));
  }

  async put(store, value) {
    const tx = this.idb.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    await done(tx);
    return value;
  }

  async delete(store, key) {
    const tx = this.idb.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    await done(tx);
  }

  /** Ghi nhiều thay đổi trong một transaction (tất cả hoặc không gì cả). `fn` chỉ gọi put/delete/clear đồng bộ. */
  async write(stores, fn) {
    const tx = this.idb.transaction(stores, 'readwrite');
    fn(tx);
    await done(tx);
  }

  close() {
    this.idb.close();
  }
}

export async function openDatabase(name = DB_NAME, factory = globalThis.indexedDB) {
  const req = factory.open(name, MIGRATIONS.length);
  req.onupgradeneeded = (event) => {
    const db = req.result;
    for (let v = event.oldVersion; v < MIGRATIONS.length; v++) MIGRATIONS[v](db, req.transaction);
  };
  return new Database(await request(req));
}

/** Blob để hiển thị / phát / xuất file, dựng từ dữ liệu đã lưu. */
export function mediaBlob(rec) {
  if (!rec?.data) return null;
  return new Blob([rec.data], { type: rec.mimeType || '' });
}

export const mediaSize = (rec) => rec?.data?.byteLength ?? 0;

export function isQuotaError(err) {
  return err?.name === 'QuotaExceededError' || /quota/i.test(err?.message ?? '');
}

// ---------- Ghi âm (bé đọc / nói) ----------

export async function addRecording(db, { lessonId, word, blob, mimeType, durationMs }, now = Date.now()) {
  const data = await blob.arrayBuffer();
  const record = { id: crypto.randomUUID(), lessonId, word: normalizeWord(word), date: now, data, mimeType: mimeType || blob.type, durationMs };
  await db.put('recordings', record);
  return record;
}

/** Hôm nay đã có bản ghi cho mục này chưa (mỗi mục mỗi ngày tối đa 1 bản ghi). */
export async function hasRecordingToday(db, word, now = Date.now()) {
  const today = dayKey(new Date(now));
  const list = await db.getAllByIndex('recordings', 'word', normalizeWord(word));
  return list.some((r) => dayKey(new Date(r.date)) === today);
}

// ---------- Bài học (SPEC 5.5) — tiến độ: xem progress.js ----------

/** Lưu bài mới (bài đã qua `validateLesson`). */
export async function saveLesson(db, lesson, now = Date.now()) {
  const record = { ...lesson, createdAt: lesson.createdAt ?? now, updatedAt: now };
  await db.put('lessons', record);
  return record;
}

/**
 * Thay bài cũ cùng id bằng bản mới. Mục bị xóa / đổi chữ thì xóa tiến độ của mục đó; mục còn nguyên giữ tiến độ.
 * @param {string[]} resetItemIds từ `itemsToReset(cũ, mới)`
 */
export async function replaceLesson(db, lesson, resetItemIds, now = Date.now()) {
  const old = await db.get('lessons', lesson.id);
  const reset = new Set(resetItemIds);
  const drop = reset.size ? (await db.getAllByIndex('progress', 'lessonId', lesson.id)).filter((p) => reset.has(p.itemId)) : [];
  const record = { ...lesson, createdAt: old?.createdAt ?? lesson.createdAt ?? now, updatedAt: now };
  await db.write(['lessons', 'progress'], (tx) => {
    tx.objectStore('lessons').put(record);
    for (const p of drop) tx.objectStore('progress').delete(p.key);
  });
  return record;
}

/** Xóa bài + tiến độ, ảnh, ghi âm của bài (tiến độ tricky words dùng chung giữ nguyên). Bài có sẵn không xóa. */
export async function deleteLesson(db, lessonId) {
  const lesson = await db.get('lessons', lessonId);
  if (lesson?.builtIn) throw new Error('Bài có sẵn của app không xóa được.');
  const [progress, images, recordings] = await Promise.all([
    db.getAllByIndex('progress', 'lessonId', lessonId),
    db.getAllByIndex('images', 'lessonId', lessonId),
    db.getAllByIndex('recordings', 'lessonId', lessonId),
  ]);
  await db.write(['lessons', 'progress', 'images', 'recordings'], (tx) => {
    tx.objectStore('lessons').delete(lessonId);
    for (const p of progress) tx.objectStore('progress').delete(p.key);
    for (const i of images) tx.objectStore('images').delete(i.id);
    for (const r of recordings) tx.objectStore('recordings').delete(r.id);
  });
  return { progress: progress.length, images: images.length, recordings: recordings.length };
}

// ---------- Ảnh của từ (SPEC 5.6): gắn theo (lessonId, id của từ) — dùng được cả cho bài có sẵn ----------

/** Lưu / thay ảnh cho một từ của bài. `blob` từ ảnh đã thu nhỏ / ô cắt từ ảnh lưới. */
export async function setWordImage(db, { lessonId, wordId, blob, mimeType, width, height }, now = Date.now()) {
  const old = (await db.getAllByIndex('images', 'lessonId', lessonId)).filter((r) => r.word === wordId);
  const record = { id: crypto.randomUUID(), lessonId, word: wordId, data: await blob.arrayBuffer(), mimeType: mimeType || blob.type, width, height, createdAt: now };
  await db.write(['images'], (tx) => {
    for (const r of old) tx.objectStore('images').delete(r.id);
    tx.objectStore('images').put(record);
  });
  return record;
}

export async function removeWordImage(db, lessonId, wordId) {
  const old = (await db.getAllByIndex('images', 'lessonId', lessonId)).filter((r) => r.word === wordId);
  await db.write(['images'], (tx) => {
    for (const r of old) tx.objectStore('images').delete(r.id);
  });
  return old.length;
}

/** Ảnh của các từ trong bài: Map id của từ → bản ghi ảnh. */
export async function lessonImages(db, lessonId) {
  return new Map((await db.getAllByIndex('images', 'lessonId', lessonId)).map((r) => [r.word, r]));
}
