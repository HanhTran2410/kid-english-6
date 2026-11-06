// Lõi dữ liệu 0.1.2: chữ và âm, gói bài + kiểm tra, tiến độ + sao, nâng cấp IndexedDB, thay / xóa bài.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { spellGraphemes, learnedGraphemes, isDecodable, SOUND_IDS, GROUPS } from '../../app/js/phonics.js';
import { parseLessonText, validateLesson, itemsToReset } from '../../app/js/lesson.js';
import { RESULT, applyResult, emptyItem, starsFor, applyLessonDone, emptyLesson, recordItem, getItem, recordLessonDone, getLessonProgress, trickyRef, itemKey } from '../../app/js/progress.js';
import { openDatabase, MIGRATIONS, saveLesson, replaceLesson, deleteLesson } from '../../app/js/db.js';

// ---------- Chữ và âm ----------

test('ghép grapheme thành từ, kể cả split digraph: sh-i-p → ship, c-a_e-k → cake', () => {
  assert.equal(spellGraphemes(['s', 'a', 't']), 'sat');
  assert.equal(spellGraphemes(['sh', 'i', 'p']), 'ship');
  assert.equal(spellGraphemes(['d', 'u', 'ck']), 'duck');
  assert.equal(spellGraphemes(['r', 'ai', 'n']), 'rain');
  assert.equal(spellGraphemes(['c', 'a_e', 'k']), 'cake');
  assert.equal(spellGraphemes(['b', 'i_e', 'k']), 'bike');
  assert.equal(spellGraphemes(['c', 'a_e']), null);
});

test('7 nhóm âm: đủ mã âm (c/k chung "k", th và th-v, oo và oo-l); grapheme đã học cộng dồn theo nhóm', () => {
  assert.equal(GROUPS.length, 7);
  for (const s of ['s', 'k', 'sh', 'th', 'th-v', 'oo', 'oo-l', 'qu', 'ar']) assert.ok(SOUND_IDS.has(s), s);
  assert.ok(!SOUND_IDS.has('c'));
  const g1 = learnedGraphemes(1);
  assert.deepEqual([...g1].sort(), ['a', 'i', 'n', 'p', 's', 't']);
  assert.ok(learnedGraphemes(6).has('sh'));
  assert.ok(!learnedGraphemes(7).has('a_e'));
  assert.ok(learnedGraphemes(8).has('a_e'));
});

test('từ đọc được (decodable): mọi grapheme đã học, hoặc là tricky word đã học', () => {
  const sat = { en: 'sat', graphemes: ['s', 'a', 't'] };
  const ship = { en: 'ship', graphemes: ['sh', 'i', 'p'] };
  assert.equal(isDecodable(sat, learnedGraphemes(1)), true);
  assert.equal(isDecodable(ship, learnedGraphemes(5)), false);
  assert.equal(isDecodable(ship, learnedGraphemes(6)), true);
  assert.equal(isDecodable({ en: 'the' }, learnedGraphemes(1), new Set(['the'])), true);
});

// ---------- Gói bài ----------

const sample = () => ({
  version: 1,
  kind: 'lesson',
  id: 'phonics-g6',
  track: 'phonics',
  group: 6,
  title: 'Sounds ch sh th',
  titleVi: 'Âm ch sh th',
  newSounds: ['ch', 'sh', 'th'],
  words: [
    { id: 'ship', en: 'ship', graphemes: ['sh', 'i', 'p'], sounds: ['sh', 'i', 'p'], tags: ['digraph'], vi: 'con tàu', emoji: '🚢' },
    { id: 'thin', en: 'thin', graphemes: ['th', 'i', 'n'], sounds: ['th', 'i', 'n'], vi: 'mỏng' },
  ],
  sentences: [{ id: 's1', en: 'The ship is red.', vi: 'Con tàu màu đỏ.', chunks: ['The ship', 'is red.'] }],
  activities: [
    { type: 'sounds', sounds: ['ch', 'sh', 'th'] },
    { type: 'blend', items: ['ship', 'thin'] },
    { type: 'sentence', items: ['s1'] },
  ],
});

test('gói bài hợp lệ: chuẩn hóa, bài nhập vào luôn builtIn = false', () => {
  const r = validateLesson({ ...sample(), builtIn: true });
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
  assert.equal(r.lesson.builtIn, false);
  assert.equal(r.lesson.words[0].graphemes.join('|'), 'sh|i|p');
  assert.deepEqual(r.lesson.words[1].tags, []);
  assert.equal(r.lesson.book, null);
});

test('đọc JSON có bọc ```json của AI; JSON hỏng thì báo lỗi', () => {
  assert.equal(parseLessonText('```json\n{"a": 1}\n```').data.a, 1);
  assert.equal(parseLessonText('  {"a": 2} ').data.a, 2);
  assert.match(parseLessonText('{a: 1}').error, /Không đọc được JSON/);
  assert.match(parseLessonText('').error, /Chưa có nội dung/);
});

test('gói bài lỗi: chỉ rõ chỗ sai', () => {
  const errs = (mutate) => {
    const d = sample();
    mutate(d);
    return validateLesson(d).errors.join('\n');
  };
  assert.match(errs((d) => delete d.title), /Thiếu tên bài/);
  assert.match(errs((d) => { d.id = 'Bài 1'; }), /"id" chỉ gồm/);
  assert.match(errs((d) => { d.track = 'abc'; }), /"track"/);
  assert.match(errs((d) => { d.version = 2; }), /"version"/);
  assert.match(errs((d) => { d.words[1].id = 'ship'; }), /Từ số 2 \("thin"\): "id" "ship" bị trùng/);
  assert.match(errs((d) => { d.words[0].graphemes = ['s', 'h', 'i', 'p']; }), /4 ô nhưng "sounds" có 3/);
  assert.match(errs((d) => { d.words[0].graphemes = ['sh', 'o', 'p']; d.words[0].sounds = ['sh', 'o', 'p']; }), /ghép lại là "shop", không phải "ship"/);
  assert.match(errs((d) => { d.words[0].sounds = ['sh', 'i', 'c']; }), /không có âm "c"/);
  assert.match(errs((d) => { d.activities[1].items = ['ship', 'chop']; }), /không có từ mang id "chop"/);
  assert.match(errs((d) => { d.activities.push({ type: 'dance', items: [] }); }), /loại "dance" chưa hỗ trợ/);
  assert.match(errs((d) => { d.activities = []; }), /ít nhất một hoạt động/);
  assert.match(errs((d) => { d.sentences[0].chunks = ['The ship']; }), /"chunks"/);
  assert.match(errs((d) => { delete d.words[1].graphemes; delete d.words[1].sounds; }), /từ "thin" cần "graphemes"/);
  assert.match(errs((d) => { d.sentences[0].id = 'ship'; }), /trùng với id của một từ/);
  assert.equal(validateLesson([]).ok, false);
});

test('cảnh báo (vẫn lưu được): từ có âm chưa học tới nhóm của bài; tricky word thì không cảnh báo', () => {
  const d = sample();
  d.group = 5;
  d.words.push({ id: 'the', en: 'the', graphemes: ['th', 'e'], sounds: ['th-v', 'e'], tags: ['tricky'] });
  const r = validateLesson(d);
  assert.equal(r.ok, true);
  assert.equal(r.warnings.length, 2);
  assert.match(r.warnings[0], /"ship" có âm chưa học tới nhóm 5/);
});

test('thay bài: mục bị xóa hoặc đổi chữ thì reset tiến độ, mục giữ nguyên thì không', () => {
  const old = validateLesson(sample()).lesson;
  const d = sample();
  d.words = [d.words[0], { ...d.words[1], en: 'thick', graphemes: ['th', 'i', 'ck'], sounds: ['th', 'i', 'k'] }];
  d.sentences = [];
  d.activities = [{ type: 'blend', items: ['ship', 'thin'] }];
  assert.deepEqual(itemsToReset(old, validateLesson(d).lesson).sort(), ['s1', 'thin']);
});

// ---------- Tiến độ và sao ----------

test('tiến độ mục: khóa theo bài / hoạt động / mục; cộng đúng loại kết quả; chuỗi đúng', () => {
  const ref = { lessonId: 'phonics-g6', activity: 'blend', itemId: 'ship' };
  let p = emptyItem(ref);
  assert.equal(p.key, 'phonics-g6/blend/ship');
  p = applyResult(p, RESULT.INDEPENDENT, 1);
  p = applyResult(p, RESULT.HELPED, 2);
  assert.equal(p.streak, 2);
  p = applyResult(p, RESULT.PRACTICED, 3);
  assert.equal(p.streak, 2);
  p = applyResult(p, RESULT.MISSED, 4);
  assert.deepEqual([p.seen, p.independent, p.helped, p.practiced, p.missed, p.streak, p.lastAt], [4, 1, 1, 1, 1, 0, 4]);
  assert.throws(() => applyResult(p, 'correct'));
  assert.equal(itemKey(trickyRef(' The ').lessonId, 'card', trickyRef(' The ').itemId), 'tricky/card/the');
});

test('sao: 3 khi ≥ 90% độc lập; 2 khi ≥ 60% đạt và tối đa 1 mục xem đáp án; còn lại 1; bỏ qua mục không chấm', () => {
  const { INDEPENDENT: I, HELPED: H, MISSED: M, PRACTICED: P } = RESULT;
  assert.equal(starsFor([I, I, I, I, I, I, I, I, I, H]), 3);
  assert.equal(starsFor([I, I, I, I, I, I, I, I, H, H]), 2);
  assert.equal(starsFor([I, H, H, M, I]), 2);
  assert.equal(starsFor([I, I, I, M, M]), 1);
  assert.equal(starsFor([I, M, M, H, H]), 1);
  assert.equal(starsFor([I, I, P, P, P]), 3);
  assert.equal(starsFor([P, P]), null);
});

test('tiến độ bài: giữ sao tốt nhất, chơi lại không làm giảm', () => {
  let p = emptyLesson('phonics-g6');
  p = applyLessonDone(p, 2, 10);
  p = applyLessonDone(p, 1, 20);
  assert.deepEqual([p.key, p.plays, p.bestStars, p.lastStars, p.completedAt], ['lesson:phonics-g6', 2, 2, 1, 10]);
});

// ---------- IndexedDB ----------

test('nâng cấp từ bản 0.1.x (1 bước) lên bản mới: dữ liệu cũ còn nguyên, kho tiến độ có chỉ mục lessonId', async () => {
  const name = `upgrade-${Math.random()}`;
  const old = await new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => MIGRATIONS[0](req.result, req.transaction);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  await new Promise((resolve) => {
    const tx = old.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key: 'childName', value: 'Minh' });
    tx.oncomplete = resolve;
  });
  old.close();

  const db = await openDatabase(name);
  assert.equal(db.idb.version, MIGRATIONS.length);
  assert.equal((await db.get('settings', 'childName')).value, 'Minh');
  assert.ok(db.idb.transaction('progress').objectStore('progress').indexNames.contains('lessonId'));
  db.close();
});

test('lưu, thay, xóa bài: tiến độ theo đúng quy tắc; cùng từ ở hai bài không ghi đè nhau; tricky giữ nguyên', async () => {
  const db = await openDatabase(`lessons-${Math.random()}`);
  const lesson = await saveLesson(db, validateLesson(sample()).lesson, 100);
  assert.equal(lesson.createdAt, 100);

  const ship = { lessonId: 'phonics-g6', activity: 'blend', itemId: 'ship' };
  const thin = { lessonId: 'phonics-g6', activity: 'blend', itemId: 'thin' };
  const shipInUnit = { lessonId: 'book-u3', activity: 'blend', itemId: 'ship' };
  await recordItem(db, ship, RESULT.INDEPENDENT);
  await recordItem(db, thin, RESULT.HELPED);
  await recordItem(db, shipInUnit, RESULT.MISSED);
  await recordItem(db, trickyRef('the'), RESULT.INDEPENDENT);
  await recordLessonDone(db, 'phonics-g6', 2);
  assert.equal((await getItem(db, ship)).independent, 1);
  assert.equal((await getItem(db, shipInUnit)).missed, 1);
  assert.equal((await getItem(db, shipInUnit)).independent, 0);

  // Thay bài: "thin" đổi chữ → reset; "ship" giữ.
  const d = sample();
  d.words[1] = { ...d.words[1], en: 'thick', graphemes: ['th', 'i', 'ck'], sounds: ['th', 'i', 'k'] };
  const next = validateLesson(d).lesson;
  const replaced = await replaceLesson(db, next, itemsToReset(lesson, next), 200);
  assert.deepEqual([replaced.createdAt, replaced.updatedAt], [100, 200]);
  assert.equal((await getItem(db, ship)).independent, 1);
  assert.equal((await getItem(db, thin)).seen, 0);
  assert.equal((await getLessonProgress(db, 'phonics-g6')).bestStars, 2);

  // Xóa bài: mất tiến độ của bài (cả sao), ảnh, ghi âm; bài khác và tricky còn nguyên.
  await db.put('images', { id: 'img1', lessonId: 'phonics-g6', word: 'ship' });
  await db.put('recordings', { id: 'rec1', lessonId: 'phonics-g6', word: 'ship', date: 0 });
  const removed = await deleteLesson(db, 'phonics-g6');
  assert.deepEqual(removed, { progress: 2, images: 1, recordings: 1 });
  assert.equal(await db.get('lessons', 'phonics-g6'), undefined);
  assert.equal((await getItem(db, ship)).seen, 0);
  assert.equal((await getLessonProgress(db, 'phonics-g6')).plays, 0);
  assert.equal((await getItem(db, shipInUnit)).missed, 1);
  assert.equal((await getItem(db, trickyRef('the'))).independent, 1);

  await db.put('lessons', { ...lesson, id: 'built', builtIn: true });
  await assert.rejects(deleteLesson(db, 'built'), /không xóa được/);
  db.close();
});
