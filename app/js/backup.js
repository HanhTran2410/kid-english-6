// Sao lưu / khôi phục ra file .zip (SPEC mục 6.2 — cách làm chép từ kid-english/app/js/backup.js, gọn lại cho Olly).
// JSZip nạp sẵn từ app/vendor/jszip.min.js (biến toàn cục JSZip); test trong Node truyền vào qua tham số.
// File gồm MỌI kho: bài, tranh, truyện, ảnh, ghi âm (tùy chọn), tiến độ, cài đặt. Khôi phục: kiểm tra TOÀN BỘ file trước
// rồi mới ghi (một giao dịch) — file hỏng thì dữ liệu đang có không bị đụng tới.

import { STORES, mediaSize } from './db.js';
import { dayKey } from './text.js';

export const BACKUP_FORMAT = 1;
/** Khác kid-english ('kid-english') → file sao lưu của app kia bị từ chối (SPEC OL-24: hai app không đụng dữ liệu nhau). */
export const BACKUP_APP = 'kid-english-6';
const RECORD_STORES = ['lessons', 'scenes', 'stories', 'progress', 'settings']; // lưu thành <kho>.json
const MEDIA_STORES = ['images', 'recordings']; // dữ liệu nhị phân → file riêng trong zip
/** Cài đặt chỉ của máy này: không vào file sao lưu (phiên học đang đếm giờ). */
export const LOCAL_SETTINGS = ['session'];

const EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav',
};
export const extensionFor = (mimeType) => EXT[String(mimeType ?? '').split(';')[0].trim()] ?? 'bin';

export class BackupError extends Error {}

const withoutData = ({ data, ...meta }) => meta;

async function readAll(db) {
  const data = Object.fromEntries(await Promise.all(STORES.map(async (s) => [s, await db.getAll(s)])));
  data.settings = data.settings.filter((s) => !LOCAL_SETTINGS.includes(s.key));
  return data;
}

/** Dung lượng ước tính của file sao lưu (byte), để hiện trước cho bố mẹ. */
export async function estimateBackupSize(db, { includeRecordings = true } = {}) {
  const data = await readAll(db);
  const blobs = (list) => list.reduce((sum, r) => sum + mediaSize(r), 0);
  const json = JSON.stringify([...RECORD_STORES.map((s) => data[s]), ...MEDIA_STORES.map((s) => data[s].map(withoutData))]).length;
  return json + blobs(data.images) + (includeRecordings ? blobs(data.recordings) : 0);
}

/**
 * Tạo file sao lưu.
 * @returns {Promise<{ blob: Blob, filename: string, counts: object }>}
 */
export async function createBackup(db, { includeRecordings = true, now = Date.now(), appVersion = '', JSZip = globalThis.JSZip } = {}) {
  if (!JSZip) throw new BackupError('Thiếu thư viện tạo file zip.');
  const data = await readAll(db);
  if (!includeRecordings) data.recordings = [];
  const zip = new JSZip();
  const counts = Object.fromEntries(STORES.filter((s) => s !== 'settings').map((s) => [s, data[s].length]));
  zip.file('manifest.json', JSON.stringify({ app: BACKUP_APP, format: BACKUP_FORMAT, appVersion, exportedAt: now, includeRecordings, counts }, null, 2));
  for (const s of RECORD_STORES) zip.file(`${s}.json`, JSON.stringify(data[s]));
  for (const s of MEDIA_STORES) {
    const meta = [];
    for (const item of data[s]) {
      const file = `${s}/${item.id}.${extensionFor(item.mimeType)}`;
      zip.file(file, new Uint8Array(item.data ?? new ArrayBuffer(0)));
      meta.push({ ...withoutData(item), file });
    }
    zip.file(`${s}.json`, JSON.stringify(meta));
  }
  // Ảnh / ghi âm đã nén sẵn → không nén lại (nhanh, ít tốn pin trên iPad).
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'STORE' });
  return { blob: new Blob([bytes], { type: 'application/zip' }), filename: `olly-sao-luu-${dayKey(new Date(now))}.zip`, counts };
}

async function toArrayBuffer(input) {
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) return input;
  if (typeof input?.arrayBuffer === 'function') return input.arrayBuffer();
  throw new BackupError('Không đọc được file.');
}

/**
 * Đọc và kiểm tra TOÀN BỘ file sao lưu trước khi ghi gì vào máy.
 * @returns {Promise<object>} { manifest, lessons, scenes, stories, progress, settings, images, recordings }
 */
export async function readBackup(input, { JSZip = globalThis.JSZip } = {}) {
  let zip;
  try {
    zip = await JSZip.loadAsync(await toArrayBuffer(input));
  } catch {
    throw new BackupError('File không phải file sao lưu hợp lệ (không mở được file zip).');
  }
  const readJson = async (path, required = true) => {
    const file = zip.file(path);
    if (!file) {
      if (required) throw new BackupError(`File sao lưu thiếu ${path}.`);
      return null;
    }
    try {
      return JSON.parse(await file.async('string'));
    } catch {
      throw new BackupError(`File sao lưu bị hỏng (${path}).`);
    }
  };
  const manifest = await readJson('manifest.json');
  if (manifest?.app !== BACKUP_APP) throw new BackupError('Đây không phải file sao lưu của Olly English.');
  if (!(manifest.format <= BACKUP_FORMAT)) throw new BackupError('File sao lưu được tạo từ phiên bản app mới hơn. Hãy cập nhật app rồi thử lại.');

  const list = async (name) => {
    const v = (await readJson(`${name}.json`, false)) ?? [];
    if (!Array.isArray(v)) throw new BackupError(`File sao lưu bị hỏng (${name}.json).`);
    return v;
  };
  const out = { manifest };
  for (const s of RECORD_STORES) out[s] = await list(s);
  const need = (items, name, key, ok = () => true) => {
    for (const x of items) if (!x?.[key] || !ok(x)) throw new BackupError(`File sao lưu bị hỏng (${name}.json).`);
  };
  need(out.lessons, 'lessons', 'id', (l) => l.title && Array.isArray(l.activities));
  need(out.scenes, 'scenes', 'id', (s) => Array.isArray(s.sentences));
  need(out.stories, 'stories', 'id', (s) => Array.isArray(s.pages) && Array.isArray(s.questions));
  need(out.progress, 'progress', 'key');
  need(out.settings, 'settings', 'key');
  for (const s of MEDIA_STORES) {
    const items = [];
    for (const meta of await list(s)) {
      const file = zip.file(meta?.file ?? '');
      if (!meta?.id || !file) throw new BackupError(`File sao lưu bị hỏng (thiếu ${meta?.file ?? s}).`);
      const { file: _path, ...rest } = meta;
      items.push({ ...rest, data: await file.async('arraybuffer') });
    }
    out[s] = items;
  }
  return out;
}

/**
 * Gộp tiến độ của cùng một khóa (hàm thuần): bản có hoạt động sau cùng làm gốc; sao tốt nhất lấy cao nhất; lần đầu xong lấy
 * sớm nhất — khôi phục không bao giờ làm bé mất sao.
 */
export function mergeProgress(mine, theirs) {
  if (!mine) return theirs;
  if (!theirs) return mine;
  const base = (theirs.lastAt ?? 0) > (mine.lastAt ?? 0) ? theirs : mine;
  const out = { ...base };
  if (mine.bestStars != null || theirs.bestStars != null) out.bestStars = Math.max(mine.bestStars ?? 0, theirs.bestStars ?? 0);
  const done = [mine.completedAt, theirs.completedAt].filter((x) => x != null);
  if (done.length) out.completedAt = Math.min(...done);
  return out;
}

const editedAt = (x) => x.updatedAt ?? x.createdAt ?? 0;

/**
 * Ghi dữ liệu sao lưu vào máy trong MỘT giao dịch.
 * @param {'merge'|'replace'} mode gộp với dữ liệu hiện có / thay toàn bộ
 *   gộp: bài / tranh / truyện trùng id → bản sửa sau cùng thắng; ảnh cùng (bài, từ) → ảnh mới hơn thắng; ghi âm thêm bản
 *   còn thiếu; tiến độ gộp (mergeProgress); cài đặt giữ bản đang có, chỉ thêm khóa còn thiếu.
 * @returns {Promise<{ lessons: number, scenes: number, stories: number, images: number, recordings: number }>}
 */
export async function applyBackup(db, payload, mode) {
  const settings = (payload.settings ?? []).filter((s) => !LOCAL_SETTINGS.includes(s.key));
  if (mode === 'replace') {
    const keep = (await db.getAll('settings')).filter((s) => LOCAL_SETTINGS.includes(s.key));
    await db.write(STORES, (tx) => {
      for (const s of STORES) tx.objectStore(s).clear();
      for (const s of STORES) for (const item of (s === 'settings' ? settings : payload[s] ?? [])) tx.objectStore(s).put(item);
      for (const item of keep) tx.objectStore('settings').put(item);
    });
    return Object.fromEntries(['lessons', 'scenes', 'stories', 'images', 'recordings'].map((s) => [s, (payload[s] ?? []).length]));
  }
  const current = await readAll(db);
  const writes = Object.fromEntries(STORES.map((s) => [s, []]));
  const deletes = [];
  const counts = { lessons: 0, scenes: 0, stories: 0, images: 0, recordings: 0 };
  for (const s of ['lessons', 'scenes', 'stories']) {
    const have = new Map(current[s].map((x) => [x.id, x]));
    for (const x of payload[s] ?? []) {
      const mine = have.get(x.id);
      if (mine && editedAt(mine) >= editedAt(x)) continue;
      writes[s].push(x);
      counts[s]++;
    }
  }
  const imgKey = (r) => `${r.lessonId}|${r.word}`;
  const imgIds = new Set(current.images.map((r) => r.id));
  const byWord = new Map(current.images.map((r) => [imgKey(r), r]));
  for (const img of payload.images ?? []) {
    if (imgIds.has(img.id)) continue;
    const mine = byWord.get(imgKey(img));
    if (mine && (mine.createdAt ?? 0) >= (img.createdAt ?? 0)) continue;
    if (mine) deletes.push(mine.id);
    byWord.set(imgKey(img), img);
    writes.images.push(img);
    counts.images++;
  }
  const recIds = new Set(current.recordings.map((r) => r.id));
  writes.recordings = (payload.recordings ?? []).filter((r) => !recIds.has(r.id));
  counts.recordings = writes.recordings.length;
  const progress = new Map(current.progress.map((p) => [p.key, p]));
  writes.progress = (payload.progress ?? []).map((p) => mergeProgress(progress.get(p.key), p));
  const have = new Set(current.settings.map((s) => s.key));
  writes.settings = settings.filter((s) => !have.has(s.key));
  await db.write(STORES, (tx) => {
    for (const id of deletes) tx.objectStore('images').delete(id);
    for (const s of STORES) for (const item of writes[s]) tx.objectStore(s).put(item);
  });
  return counts;
}

/** Xóa toàn bộ dữ liệu học (SPEC 6.2): tiến độ + ghi âm. Bài, tranh, truyện, ảnh, cài đặt giữ nguyên. */
export async function clearLearningData(db) {
  await db.write(['progress', 'recordings'], (tx) => {
    tx.objectStore('progress').clear();
    tx.objectStore('recordings').clear();
  });
}
