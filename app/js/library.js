// Thư viện bài (SPEC mục 6.3): các gói bài JSON đặt trong app/shared/ trên GitHub (bố mẹ tải file lên repo),
// app/shared/index.json do scripts/make-shared-index.mjs tạo lúc deploy. KHÔNG lưu offline: tải từ mạng khi cần.

import { parseLessonText, validateLesson, itemsToReset } from './lesson.js';
import { saveLesson, replaceLesson } from './db.js';

export const SHARED_DIR = 'shared/';
export const SHARED_INDEX = `${SHARED_DIR}index.json`;

export class LibraryError extends Error {}

/** Danh sách bài trong thư viện: [{ file, size, id, title, titleVi, track, emoji }]. */
export async function fetchLibrary(fetchFn = (...a) => fetch(...a)) {
  const res = await fetchFn(SHARED_INDEX, { cache: 'no-store' });
  if (!res.ok) throw new LibraryError('Không tải được danh sách Thư viện bài.');
  return (await res.json())?.files ?? [];
}

/**
 * Cài một gói bài (đã đọc thành object) vào máy: bài mới → lưu; đã có bài cùng id → thay, giữ tiến độ các mục còn nguyên.
 * @returns {Promise<{ lesson: object, replaced: boolean, warnings: string[] }>}
 */
export async function installLesson(db, data) {
  const r = validateLesson(data);
  if (!r.ok) throw new LibraryError(`Bài bị lỗi: ${r.errors[0]}${r.errors.length > 1 ? ` (và ${r.errors.length - 1} lỗi khác)` : ''}`);
  const existing = await db.get('lessons', r.lesson.id);
  if (existing?.builtIn) throw new LibraryError(`Trùng id với bài có sẵn của app ("${r.lesson.id}").`);
  const lesson = existing
    ? await replaceLesson(db, r.lesson, itemsToReset(existing, r.lesson))
    : await saveLesson(db, r.lesson);
  return { lesson, replaced: Boolean(existing), warnings: r.warnings };
}

/** Tải một file trong thư viện và cài vào máy. */
export async function installShared(db, file, fetchFn = (...a) => fetch(...a)) {
  let res;
  try {
    res = await fetchFn(`${SHARED_DIR}${file}`, { cache: 'no-store' });
  } catch {
    throw new LibraryError('Không có mạng — thử lại sau.');
  }
  if (!res.ok) throw new LibraryError('Không tải được bài này.');
  const parsed = parseLessonText(await res.text());
  if (parsed.error) throw new LibraryError(parsed.error);
  return installLesson(db, parsed.data);
}
