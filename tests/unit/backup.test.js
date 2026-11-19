// 💾 Sao lưu / khôi phục (SPEC 6.2, OL-23, OL-24): file .zip có mọi kho (bài, tranh, truyện, ảnh, ghi âm, tiến độ, cài
// đặt); khôi phục ở máy khác đủ hết; gộp không làm bé mất sao; file hỏng / file của app khác bị từ chối trước khi ghi.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import 'fake-indexeddb/auto';
import { openDatabase, saveLesson, saveScene, setWordImage, addRecording, STORES } from '../../app/js/db.js';
import { saveStory } from '../../app/js/story/store.js';
import { validateStory } from '../../app/js/story/validate.js';
import { BUILTIN_STORIES } from '../../app/js/story/builtin-stories.js';
import { BUILTIN_LESSONS } from '../../app/js/data/builtin-lessons.js';
import { saveSetting, loadSettings } from '../../app/js/settings.js';
import { recordItem, recordLessonDone, RESULT } from '../../app/js/progress.js';
import { createBackup, readBackup, applyBackup, mergeProgress, clearLearningData, estimateBackupSize, BackupError } from '../../app/js/backup.js';

// JSZip của app (app/vendor/jszip.min.js, bản UMD) — chạy với biến `module` tự tạo vì package là "type": "module".
const mod = { exports: {} };
new Function('module', 'exports', 'define', readFileSync(new URL('../../app/vendor/jszip.min.js', import.meta.url), 'utf8'))(mod, mod.exports, undefined);
const JSZip = mod.exports;

const blob = (text, type = 'image/jpeg') => new Blob([new TextEncoder().encode(text)], { type });

async function sample() {
  const db = await openDatabase(`backup-src-${Math.random()}`);
  const lesson = { ...structuredClone(BUILTIN_LESSONS[0]), id: 'book-x-unit-1', track: 'book', builtIn: false };
  await saveLesson(db, lesson);
  await saveScene(db, { id: 'scene-a', title: 'Party', titleVi: '', level: 2, track: 'phonics', sentences: [{ sid: 'a', en: 'A cake.', vi: '', point: null, from: 'auto', hit: 0.08, keywords: [] }] });
  await saveStory(db, { ...validateStory({ ...structuredClone(BUILTIN_STORIES[1]), builtIn: undefined }).story, id: 'story-mine' });
  await setWordImage(db, { lessonId: 'lib', wordId: 'cat', blob: blob('cat-img'), mimeType: 'image/jpeg', width: 4, height: 4 });
  await setWordImage(db, { lessonId: 'story-mine', wordId: 'p1', blob: blob('page-1'), mimeType: 'image/jpeg', width: 4, height: 4 });
  await addRecording(db, { lessonId: lesson.id, word: 'cat', blob: blob('rec', 'audio/mp4'), mimeType: 'audio/mp4', durationMs: 900, text: 'cat' });
  await recordItem(db, { lessonId: lesson.id, activity: 'blend', itemId: 'cat' }, RESULT.INDEPENDENT);
  await recordLessonDone(db, 'story-mine', 3, 1000);
  await saveSetting(db, 'childName', 'Bông');
  await saveSetting(db, 'session', { day: 'x', ms: 5 });
  return db;
}

test('OL-23: sao lưu rồi khôi phục (thay toàn bộ) ở máy khác → đủ bài, tranh, truyện, ảnh, ghi âm, tiến độ, cài đặt', async () => {
  const src = await sample();
  const { blob: zip, filename, counts } = await createBackup(src, { now: Date.UTC(2026, 10, 19), appVersion: '0.13.0', JSZip });
  assert.equal(filename, 'olly-sao-luu-2026-11-19.zip');
  assert.deepEqual(counts, { lessons: 1, images: 2, recordings: 1, progress: 2, scenes: 1, stories: 1 });
  assert.ok(await estimateBackupSize(src) > 0);

  const dst = await openDatabase(`backup-dst-${Math.random()}`);
  await saveSetting(dst, 'session', { day: 'mine', ms: 99 }); // phiên học của máy này giữ nguyên
  const payload = await readBackup(zip, { JSZip });
  assert.equal(payload.manifest.appVersion, '0.13.0');
  await applyBackup(dst, payload, 'replace');
  assert.equal((await dst.get('lessons', 'book-x-unit-1')).title, BUILTIN_LESSONS[0].title);
  assert.equal((await dst.get('scenes', 'scene-a')).title, 'Party');
  assert.equal((await dst.get('stories', 'story-mine')).pages.length, 5);
  const imgs = await dst.getAll('images');
  assert.deepEqual(imgs.map((i) => new TextDecoder().decode(i.data)).sort(), ['cat-img', 'page-1']);
  assert.equal(new TextDecoder().decode((await dst.getAll('recordings'))[0].data), 'rec');
  assert.equal((await dst.get('progress', 'lesson:story-mine')).bestStars, 3);
  const s = await loadSettings(dst);
  assert.equal(s.childName, 'Bông');
  assert.deepEqual(s.session, { day: 'mine', ms: 99 });

  // Không kèm ghi âm.
  const noRec = await readBackup((await createBackup(src, { includeRecordings: false, JSZip })).blob, { JSZip });
  assert.equal(noRec.recordings.length, 0);
  src.close();
  dst.close();
});

test('gộp: bài / truyện mới thêm, ảnh mới hơn thắng, ghi âm thêm bản thiếu, tiến độ không mất sao, cài đặt giữ bản đang có', async () => {
  const src = await sample();
  const payload = await readBackup((await createBackup(src, { JSZip })).blob, { JSZip });
  const dst = await openDatabase(`backup-merge-${Math.random()}`);
  await saveSetting(dst, 'childName', 'Na');
  await setWordImage(dst, { lessonId: 'lib', wordId: 'cat', blob: blob('my-cat'), width: 4, height: 4 }, 9e15); // ảnh của máy này mới hơn
  await dst.put('progress', { key: 'lesson:story-mine', lessonId: 'story-mine', part: '', plays: 5, completedAt: 5000, bestStars: 1, lastStars: 1, lastAt: 9000 });
  const r = await applyBackup(dst, payload, 'merge');
  assert.deepEqual(r, { lessons: 1, scenes: 1, stories: 1, images: 1, recordings: 1 });
  assert.equal(new TextDecoder().decode((await dst.getAll('images')).find((i) => i.word === 'cat').data), 'my-cat');
  const p = await dst.get('progress', 'lesson:story-mine');
  assert.equal(p.bestStars, 3); // sao cao nhất của hai máy
  assert.equal(p.plays, 5); // bản có hoạt động sau cùng làm gốc
  assert.equal(p.completedAt, 1000); // lần đầu xong sớm nhất
  assert.equal((await loadSettings(dst)).childName, 'Na');
  // Gộp lần 2 không nhân đôi gì.
  const again = await applyBackup(dst, payload, 'merge');
  assert.deepEqual(again, { lessons: 0, scenes: 0, stories: 0, images: 0, recordings: 0 });
  assert.equal((await dst.getAll('recordings')).length, 1);
  src.close();
  dst.close();
});

test('mergeProgress: bản sau cùng làm gốc, sao cao nhất, xong sớm nhất; thiếu một bên → bên còn lại', () => {
  const a = { key: 'k', plays: 1, bestStars: 3, completedAt: 100, lastAt: 200 };
  const b = { key: 'k', plays: 4, bestStars: 1, completedAt: 300, lastAt: 500 };
  assert.deepEqual(mergeProgress(a, b), { key: 'k', plays: 4, bestStars: 3, completedAt: 100, lastAt: 500 });
  assert.equal(mergeProgress(undefined, b), b);
  assert.deepEqual(mergeProgress({ key: 'i', seen: 2, lastAt: 9 }, { key: 'i', seen: 1, lastAt: 3 }), { key: 'i', seen: 2, lastAt: 9 });
});

test('OL-24 / file hỏng: file của app khác, không phải zip, thiếu file ảnh → từ chối trước khi ghi, dữ liệu đang có giữ nguyên', async () => {
  const other = new JSZip();
  other.file('manifest.json', JSON.stringify({ app: 'kid-english', format: 2 }));
  await assert.rejects(readBackup(await other.generateAsync({ type: 'uint8array' }), { JSZip }), (e) => e instanceof BackupError && /không phải file sao lưu của Olly/.test(e.message));
  await assert.rejects(readBackup(new TextEncoder().encode('not a zip'), { JSZip }), /không mở được file zip/);
  const newer = new JSZip();
  newer.file('manifest.json', JSON.stringify({ app: 'kid-english-6', format: 99 }));
  await assert.rejects(readBackup(await newer.generateAsync({ type: 'uint8array' }), { JSZip }), /phiên bản app mới hơn/);
  const src = await sample();
  const zip = await JSZip.loadAsync(await (await createBackup(src, { JSZip })).blob.arrayBuffer());
  zip.remove(zip.file(/^images\//)[0].name);
  await assert.rejects(readBackup(await zip.generateAsync({ type: 'uint8array' }), { JSZip }), /bị hỏng \(thiếu images\//);
  src.close();
});

test('xóa toàn bộ dữ liệu học: tiến độ + ghi âm mất; bài, tranh, truyện, ảnh, cài đặt giữ nguyên', async () => {
  const db = await sample();
  await clearLearningData(db);
  assert.equal((await db.getAll('progress')).length, 0);
  assert.equal((await db.getAll('recordings')).length, 0);
  for (const s of ['lessons', 'scenes', 'stories', 'images']) assert.ok((await db.getAll(s)).length > 0, s);
  assert.equal((await loadSettings(db)).childName, 'Bông');
  assert.ok(STORES.includes('stories'));
  db.close();
});
