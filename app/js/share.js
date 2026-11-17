// Gói chia sẻ sang máy khác (SPEC 6.4, 0.11.7 — giống cách chia sẻ bài của kid-english): MỘT file .json chứa bài học
// (kèm ảnh Kho ảnh của các từ / câu trong bài) và tranh Tả tranh (kèm ảnh tranh, mũi tên, khung). Bố mẹ tải về → đưa
// vào app/shared/ trên GitHub (máy kia nhập ở Thư viện bài / chuông 🔔) hoặc gửi file qua Zalo / AirDrop (Chọn file…).
// Ảnh lưu dạng base64 ngay trong file (Olly không cần thư viện nén).

import { setWordImage, saveScene, SCENE_IMAGE } from './db.js';
import { LIB, libraryImages, pictureItems } from './picture-library.js';
import { validateScene } from './scene-data.js';
import { slug } from './lesson-prompts.js';

export const SHARE_KIND = 'olly-share';
export const SHARE_VERSION = 1;

/** Gói chia sẻ (khác file một bài JSON thường). */
export const isSharePackage = (data) => data?.kind === SHARE_KIND && Array.isArray(data.lessons) && Array.isArray(data.scenes);

const toBase64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
/** Bỏ trường riêng của máy này (ngày giờ, đánh dấu bài có sẵn, chỗ đang học dở). */
const clean = ({ createdAt, updatedAt, builtIn, resume, ...rest }) => rest;
const imageEntry = (lessonId, word, rec) => ({
  lessonId, word, mimeType: rec.mimeType, width: rec.width, height: rec.height, data: toBase64(rec.data),
});

/**
 * Tạo gói từ các bài / tranh đã chọn: bài + ảnh Kho ảnh của các từ / câu trong bài (nếu có), tranh + ảnh tranh.
 * @returns {Promise<{ package: object, filename: string, counts: { lessons: number, scenes: number, images: number } }>}
 */
export async function makeSharePackage(db, { lessonIds = [], sceneIds = [] } = {}, now = Date.now()) {
  const lessons = (await Promise.all(lessonIds.map((id) => db.get('lessons', id)))).filter((l) => l && !l.builtIn);
  const scenes = (await Promise.all(sceneIds.map((id) => db.get('scenes', id)))).filter((s) => s && !s.builtIn);
  const images = [];
  const lib = await libraryImages(db);
  for (const it of pictureItems(lessons)) {
    const rec = lib.get(it.key);
    if (rec) images.push(imageEntry(LIB, it.key, rec));
  }
  for (const s of scenes) {
    const rec = (await db.getAllByIndex('images', 'lessonId', s.id)).find((r) => r.word === SCENE_IMAGE);
    if (rec) images.push(imageEntry(s.id, SCENE_IMAGE, rec));
  }
  const titles = [...lessons.map((l) => l.title), ...scenes.map((s) => s.title)];
  const pkg = {
    kind: SHARE_KIND, version: SHARE_VERSION, createdAt: now,
    title: titles.join(', '),
    lessons: lessons.map(clean), scenes: scenes.map(clean), images,
  };
  const day = new Date(now).toISOString().slice(0, 10);
  const name = titles.length === 1 ? slug(titles[0]) : `${titles.length}-bai-tranh`;
  return { package: pkg, filename: `olly-${name || 'goi'}-${day}.json`, counts: { lessons: lessons.length, scenes: scenes.length, images: images.length } };
}

/** Tải gói về máy (iPhone / iPad: hiện bảng chia sẻ / lưu vào Tệp). */
export function downloadPackage({ package: pkg, filename }) {
  const blob = new Blob([`${JSON.stringify(pkg)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Cài gói vào máy: bài (như Thư viện bài: trùng id thì cập nhật, giữ kết quả học các mục còn nguyên), tranh (trùng id thì
 * thay), ảnh tranh, ảnh Kho ảnh — từ đã có ảnh trên máy này thì GIỮ ảnh của máy này (không đè ảnh bố mẹ đã chọn).
 * @param {(db: object, lesson: object) => Promise<object>} installLesson cài một bài (library.js)
 * @returns {Promise<{ lessons: number, scenes: number, images: number, kept: number, problems: string[] }>}
 */
export async function installPackage(db, pkg, installLesson) {
  const problems = [];
  let lessons = 0;
  let scenes = 0;
  for (const l of pkg.lessons) {
    try {
      await installLesson(db, l);
      lessons++;
    } catch (err) {
      problems.push(`Bài "${l?.title ?? '?'}": ${err.message}`);
    }
  }
  const sceneIds = new Set();
  for (const s of pkg.scenes) {
    const r = validateScene(s);
    if (!r.ok) {
      problems.push(`Tranh "${s?.title ?? '?'}": ${r.errors[0]}`);
      continue;
    }
    await saveScene(db, r.scene);
    sceneIds.add(r.scene.id);
    scenes++;
  }
  const lib = await libraryImages(db);
  let images = 0;
  let kept = 0;
  for (const img of pkg.images ?? []) {
    const isScene = img.word === SCENE_IMAGE;
    if (isScene ? !sceneIds.has(img.lessonId) : img.lessonId !== LIB) continue;
    if (!isScene && lib.has(img.word)) {
      kept++;
      continue;
    }
    try {
      const blob = new Blob([fromBase64(img.data)], { type: img.mimeType });
      await setWordImage(db, { lessonId: img.lessonId, wordId: img.word, blob, mimeType: img.mimeType, width: img.width, height: img.height });
      images++;
    } catch {
      problems.push(`Ảnh "${img.word}" bị lỗi, bỏ qua.`);
    }
  }
  return { lessons, scenes, images, kept, problems };
}

/** Câu báo kết quả nhập gói. */
export function installedText(r) {
  const parts = [r.lessons && `${r.lessons} bài`, r.scenes && `${r.scenes} tranh`, r.images && `${r.images} ảnh`].filter(Boolean);
  return `Đã nhập ${parts.join(', ') || 'gói'}${r.kept ? ` (giữ ${r.kept} ảnh đã có trên máy)` : ''}`;
}
