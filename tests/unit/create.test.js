// Tạo bài theo sách bằng AI (SPEC 5.7): id bài, 2 prompt, điều chỉnh bài lúc học (từ có âm chưa có file → tricky).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slug, bookLessonId, wordListPrompt, lessonPrompt, adaptForPlay } from '../../app/js/lesson-prompts.js';
import { validateLesson } from '../../app/js/lesson.js';
import { BUILTIN_LESSONS } from '../../app/js/data/builtin-lessons.js';

test('id bài theo sách: bỏ dấu, chữ thường, gạch ngang', () => {
  assert.equal(slug('Tiếng Anh 1 Global Success'), 'tieng-anh-1-global-success');
  assert.equal(slug('Đọc  & viết!'), 'doc-viet');
  assert.equal(bookLessonId('i-Learn Smart Start 1', 'Unit 3'), 'book-i-learn-smart-start-1-unit-3');
  assert.equal(bookLessonId('', ''), 'book-sach-unit');
});

test('prompt 1 chỉ xin chép lại từ + mẫu câu có trong ảnh', () => {
  const p = wordListPrompt({ book: 'Tiếng Anh 1 Global Success', unit: 'Unit 3' });
  assert.match(p, /Global Success, Unit 3/);
  assert.match(p, /CHỈ chép lại/);
  assert.match(p, /Không thêm từ/);
});

test('prompt 2: có id cố định, danh sách từ, nhóm âm đã học, quy tắc tách ô; ví dụ trong prompt là bài hợp lệ', () => {
  const p = lessonPrompt({ book: 'Tiếng Anh 1 Global Success', unit: 'Unit 3', unitTitle: 'At the zoo', words: 'cat - con mèo\nship - con tàu', patterns: 'What is it?', group: 2 });
  assert.match(p, /"id": "book-tieng-anh-1-global-success-unit-3"/);
  assert.match(p, /cat - con mèo\nship - con tàu/);
  assert.match(p, /What is it\?/);
  assert.match(p, /Nhóm 2: c k ck e h r m d \(bé ĐÃ học\)/);
  assert.doesNotMatch(p, /Nhóm 3: [^\n]*ĐÃ học/);
  assert.match(p, /c, k, ck → "k"/);
  const example = JSON.parse(p.slice(p.indexOf('{', p.indexOf('VÍ DỤ CẤU TRÚC'))));
  const r = validateLesson(example);
  assert.deepEqual(r.errors, []);
  assert.equal(r.lesson.track, 'book');
});

test('lúc học: từ có âm chưa có file ghi âm rời ghép âm / xếp ô sang tricky; bài có sẵn giữ nguyên; dữ liệu gốc không đổi', () => {
  // Đã đủ 42 âm nên giả lập một âm chưa có file ("zz") để kiểm tra cơ chế.
  const data = {
    version: 1, id: 'book-x-unit-1', track: 'book', title: 'Unit 1',
    words: [
      { id: 'cat', en: 'cat', emoji: '🐱', graphemes: ['c', 'a', 't'], sounds: ['k', 'a', 't'] },
      { id: 'ship', en: 'ship', emoji: '🚢', graphemes: ['sh', 'i', 'p'], sounds: ['zz', 'i', 'p'] },
      { id: 'hello', en: 'hello', tags: ['tricky'] },
    ],
    activities: [
      { type: 'blend', items: ['cat', 'ship'] },
      { type: 'tricky', items: ['hello'] },
      { type: 'spell', items: ['ship'] },
      { type: 'fill', items: ['cat', 'ship'] },
    ],
  };
  const before = JSON.stringify(data);
  const play = adaptForPlay(data);
  assert.deepEqual(play.activities.map((a) => [a.type, a.items]), [
    ['blend', ['cat']], ['tricky', ['hello', 'ship']], ['fill', ['cat']],
  ]);
  assert.equal(JSON.stringify(data), before);
  for (const l of BUILTIN_LESSONS) assert.equal(adaptForPlay(l), l);
});

test('prompt ảnh lưới: đúng số cột × hàng, thứ tự ô, nghĩa tiếng Việt, ô thừa để trống, không có chữ', async () => {
  const { gridImagePrompt } = await import('../../app/js/lesson-prompts.js');
  const p = gridImagePrompt([{ en: 'ant', vi: 'con kiến' }, { en: 'pin' }, { en: 'pan', vi: 'cái chảo' }], { cols: 2, rows: 2 });
  assert.match(p, /exact 2-column × 2-row grid of 4 equal square cells/);
  assert.match(p, /Cell 1: one ant \(meaning in Vietnamese: con kiến\)/);
  assert.match(p, /Cell 2: one pin\. Only/);
  assert.match(p, /Cell 4: EMPTY/);
  assert.match(p, /Exactly 3 illustrations/);
  assert.match(p, /No text anywhere/);
});

test('ảnh của từ: lưu / thay / xóa theo (bài, từ); xóa bài thì xóa ảnh', async () => {
  await import('fake-indexeddb/auto');
  const { openDatabase, setWordImage, removeWordImage, lessonImages, deleteLesson, saveLesson } = await import('../../app/js/db.js');
  const db = await openDatabase(`pics-${Math.random()}`);
  const blob = (s) => new Blob([s], { type: 'image/jpeg' });
  await setWordImage(db, { lessonId: 'phonics-g1', wordId: 'ant', blob: blob('a1'), width: 10, height: 10 });
  await setWordImage(db, { lessonId: 'phonics-g1', wordId: 'ant', blob: blob('a2'), width: 10, height: 10 });
  await setWordImage(db, { lessonId: 'phonics-g1', wordId: 'pin', blob: blob('p'), width: 10, height: 10 });
  let imgs = await lessonImages(db, 'phonics-g1');
  assert.deepEqual([...imgs.keys()].sort(), ['ant', 'pin']);
  assert.equal(new TextDecoder().decode(imgs.get('ant').data), 'a2');
  assert.equal(await removeWordImage(db, 'phonics-g1', 'pin'), 1);
  imgs = await lessonImages(db, 'phonics-g1');
  assert.deepEqual([...imgs.keys()], ['ant']);

  const lesson = validateLesson({ version: 1, id: 'book-x', track: 'book', title: 'X', words: [{ id: 'cat', en: 'cat', graphemes: ['c', 'a', 't'], sounds: ['k', 'a', 't'] }], activities: [{ type: 'blend', items: ['cat'] }] }).lesson;
  await saveLesson(db, lesson);
  await setWordImage(db, { lessonId: 'book-x', wordId: 'cat', blob: blob('c'), width: 1, height: 1 });
  await deleteLesson(db, 'book-x');
  assert.equal((await lessonImages(db, 'book-x')).size, 0);
  db.close();
});

test('Kho ảnh: gộp theo từ (cùng từ ở nhiều bài = 1 mục), bỏ tricky, có câu; khóa từ / câu; chuyển ảnh theo bài cũ sang kho', async () => {
  const { pictureItems, wordKey, sentenceKey, migrateLessonPictures, libraryImages, LIB } = await import('../../app/js/picture-library.js');
  const { BUILTIN_LESSONS } = await import('../../app/js/data/builtin-lessons.js');
  const { openDatabase, setWordImage, SCENE_IMAGE } = await import('../../app/js/db.js');
  const book = { title: 'Unit 1', words: [{ id: 'pin-1', en: 'Pin', vi: '', emoji: '📍' }, { id: 'the', en: 'the', tags: ['tricky'] }], sentences: [] };
  const items = pictureItems([...BUILTIN_LESSONS, book]);
  assert.ok(!items.some((it) => it.en === 'the'));
  const pin = items.filter((it) => it.key === 'pin');
  assert.equal(pin.length, 1);
  assert.deepEqual(pin[0].lessons, [BUILTIN_LESSONS[0].title, 'Unit 1']);
  assert.equal(pin[0].vi, 'cái ghim'); // nghĩa lấy từ bài có nghĩa
  assert.equal(pin[0].emoji, '📌');
  assert.equal(wordKey(' Cat! '), 'cat');
  assert.equal(sentenceKey('The cat can nap.'), 's:the cat can nap');
  assert.ok(items.some((it) => it.kind === 'sentence' && it.key === 's:the cat can nap'));

  const db = await openDatabase(`lib-${Math.random()}`);
  const blob = (s) => new Blob([s], { type: 'image/jpeg' });
  await setWordImage(db, { lessonId: 'phonics-g1', wordId: 'ant', blob: blob('old-ant'), width: 1, height: 1 });
  await setWordImage(db, { lessonId: LIB, wordId: 'pin', blob: blob('lib-pin'), width: 1, height: 1 });
  await setWordImage(db, { lessonId: 'phonics-g1', wordId: 'pin', blob: blob('old-pin'), width: 1, height: 1 });
  await setWordImage(db, { lessonId: 'scene-x', wordId: SCENE_IMAGE, blob: blob('scene'), width: 1, height: 1 });
  assert.equal(await migrateLessonPictures(db), 2);
  const lib = await libraryImages(db);
  assert.equal(new TextDecoder().decode(lib.get('ant').data), 'old-ant');
  assert.equal(new TextDecoder().decode(lib.get('pin').data), 'lib-pin'); // kho đã có → giữ ảnh kho
  assert.equal((await db.getAll('images')).filter((r) => r.lessonId === 'phonics-g1').length, 0);
  assert.equal((await db.getAll('images')).filter((r) => r.word === SCENE_IMAGE).length, 1);
  assert.equal(await migrateLessonPictures(db), 0);
  db.close();
});

test('prompt vẽ tranh Tả tranh theo các câu: đủ mọi câu, cảnh chung, không chữ', async () => {
  const { scenePicturePrompt } = await import('../../app/js/scene-data.js');
  const { SCENE_BY_ID } = await import('../../app/js/data/builtin-scenes.js');
  const p = scenePicturePrompt(SCENE_BY_ID.get('scene-park'));
  assert.match(p, /The scene: "It is a sunny day in the park\."/);
  for (const s of SCENE_BY_ID.get('scene-park').sentences.slice(1)) assert.ok(p.includes(`- ${s.en}`), s.en);
  assert.match(p, /No text anywhere/);
});

test('SPEC 5.7 (0.11.6) — một bước: prompt gửi kèm ảnh (AI đọc Unit + từ trong ảnh, không thêm từ, lỗi → {"error"}); id "auto" → app đặt theo sách + Unit; bỏ một từ khỏi mọi hoạt động; nhóm âm tự động', async () => {
  const { bookPhotoPrompt, fillBookId, withoutWord, learnedGroupOf, AUTO_ID } = await import('../../app/js/lesson-prompts.js');
  const p = bookPhotoPrompt({ book: 'Tiếng Anh 1 Global Success', group: 2 });
  assert.match(p, /ảnh các trang của MỘT Unit trong sách tiếng Anh lớp 1 "Tiếng Anh 1 Global Success"/);
  assert.match(p, /chỉ dựa vào ảnh, không dựa vào trí nhớ về sách/);
  assert.match(p, /KHÔNG thêm từ không có trong ảnh/);
  assert.match(p, /\{"error": "lý do bằng tiếng Việt"\}/);
  assert.match(p, /"id": "auto", "track": "book", "book": "Tiếng Anh 1 Global Success"/);
  assert.match(p, /Tách ô chữ \(Phonics kiểu Jolly\)/);
  const example = JSON.parse(p.slice(p.indexOf('{', p.indexOf('VÍ DỤ CẤU TRÚC'))));
  assert.equal(example.id, AUTO_ID);
  const v = validateLesson(fillBookId(example));
  assert.equal(v.ok, true, (v.errors ?? []).join('; '));
  assert.equal(v.lesson.id, 'book-tieng-anh-1-global-success-unit-3');
  assert.equal(fillBookId({ track: 'book', book: 'B', unit: 'Unit 1' }).id, 'book-b-unit-1'); // thiếu id
  assert.equal(fillBookId({ track: 'book', id: 'my-id', book: 'B', unit: 'Unit 1' }).id, 'my-id'); // có id thì giữ
  assert.equal(fillBookId({ track: 'phonics', id: 'auto' }).id, 'auto');
  const l = withoutWord(v.lesson, 'cat');
  assert.deepEqual(l.words.map((w) => w.id), ['hello']);
  assert.ok(l.activities.every((a) => !a.items?.includes('cat')));
  assert.ok(!l.activities.some((a) => a.type === 'blend'), 'hoạt động rỗng bị bỏ');
  assert.ok(l.activities.some((a) => a.type === 'talk'));
  assert.equal(validateLesson(l).ok, true);
  assert.equal(learnedGroupOf([1, 2, 4]), 4);
  assert.equal(learnedGroupOf([]), 1);
});

test('SPEC 6.4 — gói chia sẻ: bài + ảnh Kho ảnh của từ / câu trong bài + tranh + ảnh tranh → một file; nhập ở máy khác đủ cả; máy kia đã có ảnh cho từ thì giữ ảnh của máy đó; gói lỗi một mục vẫn nhập phần còn lại', async () => {
  await import('fake-indexeddb/auto');
  const { openDatabase, saveLesson, saveScene, setWordImage, lessonImages, SCENE_IMAGE } = await import('../../app/js/db.js');
  const { makeSharePackage, installPackage, isSharePackage, installedText } = await import('../../app/js/share.js');
  const { setLibraryImage, libraryImages } = await import('../../app/js/picture-library.js');
  const { installLesson } = await import('../../app/js/library.js');
  const blob = (text) => new Blob([new TextEncoder().encode(text)], { type: 'image/png' });
  const src = await openDatabase(`share-src-${Math.random()}`);
  const lesson = validateLesson({
    version: 1, kind: 'lesson', id: 'book-b-unit-1', track: 'book', book: 'B', unit: 'Unit 1', title: 'Unit 1: Pets',
    words: [{ id: 'cat', en: 'cat', vi: 'mèo', emoji: '🐱', graphemes: ['c', 'a', 't'], sounds: ['k', 'a', 't'] }, { id: 'dog', en: 'dog', vi: 'chó', emoji: '🐶', graphemes: ['d', 'o', 'g'], sounds: ['d', 'o', 'g'] }],
    sentences: [{ id: 's1', en: 'I see a cat.', vi: 'Tớ thấy con mèo.' }], activities: [{ type: 'blend', items: ['cat', 'dog'] }],
  }).lesson;
  await saveLesson(src, lesson);
  await setLibraryImage(src, 'cat', { blob: blob('cat-img'), mimeType: 'image/png', width: 10, height: 10 });
  await setLibraryImage(src, 'dog', { blob: blob('dog-img'), mimeType: 'image/png', width: 10, height: 10 });
  await setLibraryImage(src, 's:i see a cat', { blob: blob('sentence-img'), mimeType: 'image/png', width: 10, height: 10 });
  await setLibraryImage(src, 'fish', { blob: blob('fish-img'), mimeType: 'image/png', width: 10, height: 10 }); // không thuộc bài
  await saveScene(src, { id: 'scene-x', title: 'Party', titleVi: '', level: 2, track: 'phonics', sentences: [{ sid: 'a1', en: 'Balloons.', vi: '', point: { x: 0.1, y: 0.1 }, box: { x: 0, y: 0, w: 0.2, h: 0.3 }, more: [{ x: 0.5, y: 0, w: 0.2, h: 0.3 }], from: 'right', hit: 0.08, keywords: [] }] });
  await setWordImage(src, { lessonId: 'scene-x', wordId: SCENE_IMAGE, blob: blob('scene-img'), mimeType: 'image/jpeg', width: 1200, height: 900 });

  const made = await makeSharePackage(src, { lessonIds: [lesson.id], sceneIds: ['scene-x'] }, Date.UTC(2026, 10, 17));
  assert.equal(made.filename, 'olly-2-bai-tranh-2026-11-17.json');
  assert.deepEqual(made.counts, { lessons: 1, scenes: 1, stories: 0, storyImages: 0, images: 4 });
  const pkg = JSON.parse(JSON.stringify(made.package)); // như đọc lại từ file
  assert.ok(isSharePackage(pkg));
  assert.equal(pkg.lessons[0].createdAt, undefined);
  assert.ok(!pkg.images.some((i) => i.word === 'fish'));

  // Máy kia đã có ảnh "dog" riêng.
  const dst = await openDatabase(`share-dst-${Math.random()}`);
  await setLibraryImage(dst, 'dog', { blob: blob('my-dog'), mimeType: 'image/png', width: 5, height: 5 });
  const r = await installPackage(dst, pkg, installLesson);
  assert.deepEqual({ ...r, problems: r.problems.length }, { lessons: 1, scenes: 1, stories: 0, images: 3, kept: 1, problems: 0 });
  assert.equal(installedText(r), 'Đã nhập 1 bài, 1 tranh, 3 ảnh (giữ 1 ảnh đã có trên máy)');
  assert.equal((await dst.get('lessons', lesson.id)).title, 'Unit 1: Pets');
  const sc = await dst.get('scenes', 'scene-x');
  assert.equal(sc.sentences[0].more.length, 1);
  const lib = await libraryImages(dst);
  assert.equal(new TextDecoder().decode(lib.get('cat').data), 'cat-img');
  assert.equal(new TextDecoder().decode(lib.get('dog').data), 'my-dog');
  assert.equal(new TextDecoder().decode((await lessonImages(dst, 'scene-x')).get(SCENE_IMAGE).data), 'scene-img');

  // Một mục lỗi không chặn phần còn lại.
  const broken = { ...pkg, lessons: [{ ...pkg.lessons[0], id: 'BAD ID' }] };
  const r2 = await installPackage(await openDatabase(`share-b-${Math.random()}`), broken, installLesson);
  assert.equal(r2.lessons, 0);
  assert.equal(r2.scenes, 1);
  assert.match(r2.problems[0], /Bài "Unit 1: Pets"/);
  src.close();
  dst.close();
});
