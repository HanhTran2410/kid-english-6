// Gói chia sẻ sang máy khác (SPEC 6.4, 0.11.7 — giống cách chia sẻ bài của kid-english): MỘT file .json chứa bài học
// (kèm ảnh Kho ảnh của các từ / câu trong bài), tranh Tả tranh (kèm ảnh tranh, mũi tên, khung) và truyện ngắn bố mẹ tạo
// (kèm ảnh từng trang — SPEC-story 10; ảnh lưới gốc không đi kèm cho file nhẹ), ảnh bố mẹ thay cho truyện có sẵn (chỉ
// ảnh trang — máy kia đã có nội dung truyện). Bố mẹ tải về → đưa
// vào app/shared/ trên GitHub (máy kia nhập ở Thư viện bài / chuông 🔔) hoặc gửi file qua Zalo / AirDrop (Chọn file…).
// Ảnh lưu dạng base64 ngay trong file (Olly không cần thư viện nén).

import { setWordImage, saveScene, SCENE_IMAGE } from './db.js';
import { LIB, libraryImages, pictureItems } from './picture-library.js';
import { validateScene } from './scene-data.js';
import { slug } from './lesson-prompts.js';
import { validateStory, storyResets } from './story/validate.js';
import { saveStory, replaceStory, STORY_GRID } from './story/store.js';
import { BUILTIN_STORIES } from './story/builtin-stories.js';

const STORY_IDS_BUILTIN = new Set(BUILTIN_STORIES.map((s) => s.id));
const BUILTIN_STORY_PAGES = new Map(BUILTIN_STORIES.map((s) => [s.id, new Set(s.pages.map((p) => p.id))]));

/** Ảnh trang (không gồm ảnh lưới gốc) của một truyện trên máy này. */
async function storyPageImages(db, story) {
  const pageIds = new Set(story.pages.map((p) => p.id));
  return (await db.getAllByIndex('images', 'lessonId', story.id)).filter((r) => r.word !== STORY_GRID && pageIds.has(r.word));
}

/** Truyện có sẵn mà bố mẹ đã thay ảnh trang (để đưa vào gói chia sẻ). */
export async function builtinStoriesWithImages(db) {
  const ids = [];
  for (const s of BUILTIN_STORIES) if ((await storyPageImages(db, s)).length) ids.push(s.id);
  return ids;
}

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
export async function makeSharePackage(db, { lessonIds = [], sceneIds = [], storyIds = [] } = {}, now = Date.now()) {
  const lessons = (await Promise.all(lessonIds.map((id) => db.get('lessons', id)))).filter((l) => l && !l.builtIn);
  const scenes = (await Promise.all(sceneIds.map((id) => db.get('scenes', id)))).filter((s) => s && !s.builtIn);
  const stories = (await Promise.all(storyIds.filter((id) => !STORY_IDS_BUILTIN.has(id)).map((id) => db.get('stories', id)))).filter((s) => s && !s.builtIn);
  // Truyện có sẵn: chỉ ảnh trang bố mẹ đã thay (nội dung máy kia đã có).
  const builtinStories = BUILTIN_STORIES.filter((s) => storyIds.includes(s.id));
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
  for (const s of stories) {
    for (const rec of await storyPageImages(db, s)) images.push(imageEntry(s.id, rec.word, rec));
  }
  let storyImageSets = 0;
  for (const s of builtinStories) {
    const recs = await storyPageImages(db, s);
    if (!recs.length) continue;
    storyImageSets++;
    for (const rec of recs) images.push(imageEntry(s.id, rec.word, rec));
  }
  const withImages = builtinStories.filter((s) => images.some((i) => i.lessonId === s.id));
  const titles = [...lessons.map((l) => l.title), ...scenes.map((s) => s.title), ...stories.map((s) => s.title), ...withImages.map((s) => `${s.title} (ảnh)`)];
  const pkg = {
    kind: SHARE_KIND, version: SHARE_VERSION, createdAt: now,
    title: titles.join(', '),
    lessons: lessons.map(clean), scenes: scenes.map(clean), stories: stories.map(clean), images,
  };
  const day = new Date(now).toISOString().slice(0, 10);
  const name = titles.length === 1 ? slug(titles[0]) : `${titles.length}-bai-tranh`;
  return { package: pkg, filename: `olly-${name || 'goi'}-${day}.json`, counts: { lessons: lessons.length, scenes: scenes.length, stories: stories.length, storyImages: storyImageSets, images: images.length } };
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
 * Truyện (SPEC-story 10): trùng id truyện bố mẹ tạo → thay (giữ tiến độ phần còn nguyên, 7.2); trùng id truyện có sẵn → bỏ
 * qua và báo. Ảnh trang của truyện vừa nhập thay ảnh cũ của trang đó. Ảnh trang của truyện có sẵn (bố mẹ máy kia đã thay)
 * cũng thay ảnh của trang đó trên máy này.
 * @returns {Promise<{ lessons: number, scenes: number, stories: number, images: number, kept: number, problems: string[] }>}
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
  const storyPages = new Map();
  let stories = 0;
  for (const st of pkg.stories ?? []) {
    const r = validateStory(st);
    if (!r.ok) {
      problems.push(`Truyện "${st?.title ?? '?'}": ${r.errors[0]}`);
      continue;
    }
    const story = r.story;
    if (story.id === 'auto') {
      problems.push(`Truyện "${story.title}": thiếu id.`);
      continue;
    }
    const old = await db.get('stories', story.id);
    if (old?.builtIn || STORY_IDS_BUILTIN.has(story.id)) {
      problems.push(`Truyện "${story.title}": trùng id truyện có sẵn của app.`);
      continue;
    }
    if (old) await replaceStory(db, story, storyResets(old, story));
    else await saveStory(db, story);
    storyPages.set(story.id, new Set(story.pages.map((p) => p.id)));
    stories++;
  }
  const lib = await libraryImages(db);
  let images = 0;
  let kept = 0;
  for (const img of pkg.images ?? []) {
    const isScene = img.word === SCENE_IMAGE;
    const isPage = (storyPages.get(img.lessonId) ?? BUILTIN_STORY_PAGES.get(img.lessonId))?.has(img.word) ?? false;
    if (!isPage && (isScene ? !sceneIds.has(img.lessonId) : img.lessonId !== LIB)) continue;
    if (!isScene && !isPage && lib.has(img.word)) {
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
  return { lessons, scenes, stories, images, kept, problems };
}

/** Câu báo kết quả nhập gói. */
export function installedText(r) {
  const parts = [r.lessons && `${r.lessons} bài`, r.scenes && `${r.scenes} tranh`, r.stories && `${r.stories} truyện`, r.images && `${r.images} ảnh`].filter(Boolean);
  return `Đã nhập ${parts.join(', ') || 'gói'}${r.kept ? ` (giữ ${r.kept} ảnh đã có trên máy)` : ''}`;
}
