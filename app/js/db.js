// IndexedDB. Ảnh và ghi âm lưu dạng ArrayBuffer + mimeType (Safari iOS có lúc không đọc lại được Blob đã lưu).
// Lấy từ kid-english/app/js/db.js, bỏ phần riêng của app bé 3 tuổi (khung hình flipbook, sticker).

import { normalizeWord, dayKey } from './text.js';

export const DB_NAME = 'kid-english-6';
export const STORES = ['lessons', 'images', 'recordings', 'progress', 'settings'];

// Mỗi phần tử là một bước nâng cấp cấu trúc. Thêm bước mới vào CUỐI khi đổi cấu trúc; dữ liệu cũ tự chuyển khi mở app.
const MIGRATIONS = [
  (db) => {
    db.createObjectStore('lessons', { keyPath: 'id' });
    const images = db.createObjectStore('images', { keyPath: 'id' });
    images.createIndex('lessonId', 'lessonId');
    images.createIndex('word', 'word');
    const recordings = db.createObjectStore('recordings', { keyPath: 'id' });
    recordings.createIndex('lessonId', 'lessonId');
    recordings.createIndex('word', 'word');
    // Tiến độ theo "mục" (từ đọc, từ đánh vần, câu…): key dạng "<loại>:<nội dung>", ví dụ "read:ship", "spell:cat".
    db.createObjectStore('progress', { keyPath: 'key' });
    db.createObjectStore('settings', { keyPath: 'key' });
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

// ---------- Tiến độ ----------

/** Khóa tiến độ: "read:ship", "spell:cat", "talk:greetings/1"… */
export const progressKey = (kind, item) => `${kind}:${normalizeWord(item)}`;

export const emptyProgress = (key) => ({ key, seen: 0, correct: 0, streak: 0, lastAt: null });

export async function getProgress(db, key) {
  return (await db.get('progress', key)) ?? emptyProgress(key);
}

/** Đọc → biến đổi → lưu tiến độ một mục. */
export async function updateProgress(db, key, fn) {
  const next = fn(await getProgress(db, key));
  await db.put('progress', next);
  return next;
}
