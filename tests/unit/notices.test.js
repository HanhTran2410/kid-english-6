// Chuông thông báo + Thư viện bài (SPEC 6.3): so phiên bản, bài mới / cập nhật, script index, cài bài từ thư viện.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseSwVersion, isNewer, libraryNews, fileKey, checkNotices, notices, noticeCount } from '../../app/js/notices.js';
import { installLesson, installShared, LibraryError } from '../../app/js/library.js';
import { openDatabase } from '../../app/js/db.js';
import { recordItem, getItem, RESULT } from '../../app/js/progress.js';
import { describeShared } from '../../scripts/make-shared-index.mjs';
import { APP_VERSION } from '../../app/js/app.js';

const lesson = (over = {}) => ({
  version: 1,
  id: 'phonics-g1',
  track: 'phonics',
  title: 'Sounds s a t',
  words: [
    { id: 'sat', en: 'sat', graphemes: ['s', 'a', 't'], sounds: ['s', 'a', 't'] },
    { id: 'pin', en: 'pin', graphemes: ['p', 'i', 'n'], sounds: ['p', 'i', 'n'], emoji: '📌' },
  ],
  activities: [{ type: 'blend', items: ['sat', 'pin'] }],
  ...over,
});

test('phiên bản: đọc VERSION trong sw.js; so từng số (0.1.10 > 0.1.9)', () => {
  assert.equal(parseSwVersion("const VERSION = '0.1.12';"), '0.1.12');
  assert.equal(parseSwVersion('không có'), null);
  assert.equal(isNewer('0.1.10', '0.1.9'), true);
  assert.equal(isNewer('0.2', '0.1.9'), true);
  assert.equal(isNewer('0.1.2', '0.1.2'), false);
  assert.equal(isNewer('0.1.1', '0.1.2'), false);
});

test('thư viện: lần đầu không báo gì (cả thư viện thành mốc); sau đó báo bài mới và bài cập nhật (đổi dung lượng)', () => {
  const files = [{ file: 'a.json', size: 10 }, { file: 'b.json', size: 20 }];
  assert.deepEqual(libraryNews(files, null), []);
  const seen = [fileKey({ file: 'a.json', size: 10 }), fileKey({ file: 'b.json', size: 15 })];
  const news = libraryNews([...files, { file: 'c.json', size: 5 }], seen);
  assert.deepEqual(news.map((f) => [f.file, f.updated]), [['b.json', true], ['c.json', false]]);
});

test('kiểm tra thông báo: bản mới trên mạng + bài mới; lỗi mạng thì im lặng giữ kết quả cũ', async () => {
  const settings = { librarySeen: null };
  const app = { settings, setSetting: async (k, v) => { settings[k] = v; } };
  const index = { files: [{ file: 'a.json', size: 10, title: 'A' }] };
  const fetchOk = async (url) => ({
    ok: true,
    text: async () => `const VERSION = '9.9.9';`,
    json: async () => (url.endsWith('index.json') ? index : null),
  });
  await checkNotices(app, fetchOk);
  assert.equal(notices().update, '9.9.9');
  assert.deepEqual(settings.librarySeen, ['a.json|10']); // lần đầu: thành mốc
  assert.equal(noticeCount(), 1);

  index.files.push({ file: 'b.json', size: 7, title: 'B' });
  await checkNotices(app, fetchOk);
  assert.equal(noticeCount(), 2);

  await checkNotices(app, async () => { throw new TypeError('offline'); });
  assert.equal(noticeCount(), 2);

  await checkNotices(app, async (url) => ({ ok: true, text: async () => `const VERSION = '${APP_VERSION}';`, json: async () => index }));
  assert.equal(notices().update, null);
});

test('cài bài từ thư viện: bài mới → lưu; đã có → thay và giữ tiến độ mục còn nguyên; bài lỗi → báo lỗi dễ hiểu', async () => {
  const db = await openDatabase(`lib-${Math.random()}`);
  const first = await installLesson(db, lesson());
  assert.equal(first.replaced, false);
  await recordItem(db, { lessonId: 'phonics-g1', activity: 'blend', itemId: 'sat' }, RESULT.INDEPENDENT);
  await recordItem(db, { lessonId: 'phonics-g1', activity: 'blend', itemId: 'pin' }, RESULT.HELPED);

  const second = await installLesson(db, lesson({ title: 'Sounds s a t (mới)', words: [lesson().words[0]], activities: [{ type: 'blend', items: ['sat'] }] }));
  assert.equal(second.replaced, true);
  assert.equal((await db.get('lessons', 'phonics-g1')).title, 'Sounds s a t (mới)');
  assert.equal((await getItem(db, { lessonId: 'phonics-g1', activity: 'blend', itemId: 'sat' })).independent, 1);
  assert.equal((await getItem(db, { lessonId: 'phonics-g1', activity: 'blend', itemId: 'pin' })).seen, 0);

  await assert.rejects(installLesson(db, lesson({ title: '' })), (err) => err instanceof LibraryError && /Thiếu tên bài/.test(err.message));
  await assert.rejects(installShared(db, 'x.json', async () => { throw new TypeError('offline'); }), /Không có mạng/);
  const viaFetch = await installShared(db, 'y.json', async () => ({ ok: true, text: async () => `\`\`\`json\n${JSON.stringify(lesson({ id: 'phonics-g1-b' }))}\n\`\`\`` }));
  assert.equal(viaFetch.lesson.id, 'phonics-g1-b');
  db.close();
});

test('script thư viện: liệt kê bài hợp lệ (id, tên, dung lượng, emoji); bài lỗi / trùng id thì báo', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'shared-'));
  await writeFile(path.join(dir, '01-sat.json'), JSON.stringify(lesson()));
  await writeFile(path.join(dir, '02-broken.json'), '{ "version": 1');
  await writeFile(path.join(dir, '03-dup.json'), JSON.stringify(lesson({ title: 'Trùng' })));
  await writeFile(path.join(dir, 'index.json'), '{"files": []}');
  const { files, problems } = await describeShared(dir);
  assert.deepEqual(files.map((f) => [f.file, f.id, f.emoji]), [['01-sat.json', 'phonics-g1', '📌'], ['03-dup.json', 'phonics-g1', '📌']]);
  assert.ok(files[0].size > 100);
  assert.equal(problems.length, 2);
  assert.match(problems[0], /02-broken\.json: Không đọc được JSON/);
  assert.match(problems[1], /trùng id "phonics-g1"/);
});

test('thư viện thật trong repo (app/shared/) không có bài lỗi', async () => {
  const { problems } = await describeShared();
  assert.deepEqual(problems, []);
});
