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
