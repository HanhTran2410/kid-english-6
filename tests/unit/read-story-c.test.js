// 📚 Truyện ngắn — Story-c: kiểm tra truyện nhập vào, id, dấu nội dung, prompt viết truyện / ảnh lưới / vẽ lại một trang,
// lưu / thay / xóa truyện và ảnh trang (SPEC-story.md 7.2, 8.1–8.5).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { BUILTIN_STORIES } from '../../app/js/story/builtin-stories.js';
import { validateStory, storyIdFor, storyResets, questionHash, contentHash } from '../../app/js/story/validate.js';
import { storyGridPrompt, storyGridShape, storyRedrawPrompt, ratioLabel, storyWritingPrompt, STORY_ART_STYLE } from '../../app/js/story/prompts.js';
import { openDatabase } from '../../app/js/db.js';
import { saveStory, replaceStory, deleteStory, setPageImage, saveGridImages, STORY_GRID } from '../../app/js/story/store.js';
import { recordItem, recordLessonDone, RESULT } from '../../app/js/progress.js';

const aiStory = () => {
  const s = structuredClone(BUILTIN_STORIES[2]);
  delete s.builtIn;
  delete s.createdAt;
  delete s.updatedAt;
  return { ...s, id: 'auto' };
};

test('8.3 / ST-12 / ST-26: truyện hợp lệ qua; lỗi → từ chối, chỉ rõ chỗ', () => {
  const ok = validateStory(aiStory());
  assert.ok(ok.ok, ok.errors.join('\n'));
  assert.equal(ok.story.pages.length, 5);
  for (const s of BUILTIN_STORIES) assert.ok(validateStory(s).ok, s.id);
  const bad = (fn) => {
    const s = aiStory();
    fn(s);
    return validateStory(s);
  };
  assert.match(bad((s) => { s.kind = 'lesson'; }).errors[0], /kind/);
  assert.match(bad((s) => { s.pages = s.pages.slice(0, 3); }).errors.join(), /4–6 trang/);
  assert.match(bad((s) => { s.pages[1].sentences = []; }).errors.join(), /Trang 2: cần 1–2 câu/);
  assert.match(bad((s) => { s.questions[0].answer = 'fox'; }).errors.join(), /answer/);
  assert.match(bad((s) => { s.questions[2].pages = ['p1', 'p1', 'p9']; }).errors.join(), /3 trang khác nhau/);
  assert.match(bad((s) => { s.pages = s.pages.filter((p) => p.id !== 'p3'); }).errors.join(), /page/); // ST-26
  assert.match(bad((s) => { s.id = 'BAD ID'; }).errors.join(), /"id"/);
  assert.match(bad((s) => { s.track = 'phonics'; s.group = 9; }).errors.join(), /group/);
  assert.match(bad((s) => { delete s.characters; }).errors.join(), /characters/);
});

test('8.3: cảnh báo không chặn — thiếu vi, lệch bậc, nhiều từ mới, lựa chọn chưa có hình / chưa đọc được, hai câu hỏi cùng trang', () => {
  const s = aiStory();
  s.pages[0].sentences[0].vi = '';
  s.pages[1].sentences[0].en = 'The hat is on a log by the big green tree.';
  s.questions[0].emoji = {};
  s.questions[1].options = ['sad', 'happy'];
  s.questions[1].answer = 'happy';
  s.questions[1].page = 'p3';
  const r = validateStory(s);
  assert.ok(r.ok);
  const w = r.warnings.join('\n');
  assert.match(w, /thiếu dòng tiếng Việt/);
  assert.match(w, /bậc B tối đa 6/);
  assert.match(w, /chưa có emoji \/ ảnh: dog, cat, pig/);
  assert.match(w, /chưa đọc được lựa chọn happy/);
  assert.match(w, /hai câu hỏi cùng hỏi một trang/);
  assert.ok(!validateStory(s, { hasLibImage: (x) => ['dog', 'cat', 'pig'].includes(x) }).warnings.join().includes('chưa có emoji'));
  const many = aiStory();
  many.pages.forEach((p) => p.sentences.forEach((x) => { x.en = 'When they eat cake they say wow.'; }));
  assert.match(validateStory(many).warnings.join(), /nhiều từ mới/);
});

test('8.5 / ST-25: id auto → story-<gN | bài>-<tên>, trùng thì -2, -3', () => {
  const s = validateStory(aiStory()).story;
  const taken = new Set();
  const a = storyIdFor(s, taken);
  assert.equal(a, 'story-g3-the-red-hat');
  taken.add(a);
  assert.equal(storyIdFor(s, taken), 'story-g3-the-red-hat-2');
  taken.add('story-g3-the-red-hat-2');
  assert.equal(storyIdFor(s, taken), 'story-g3-the-red-hat-3');
  assert.equal(storyIdFor({ ...s, lessonId: 'book-global-success-unit-4' }, new Set()), 'story-global-success-unit-4-the-red-hat');
});

test('7.2 / ST-23: dấu câu hỏi đổi khi sửa chữ trang nó tham chiếu; sửa vi / tên / giải thích không đổi; storyResets đúng', () => {
  const old = validateStory(aiStory()).story;
  const edited = structuredClone(old);
  edited.title = 'A Red Hat';
  edited.pages[2].sentences[0].vi = 'khác';
  edited.questions[0].explainVi = 'khác';
  assert.equal(contentHash(edited), contentHash(old));
  assert.deepEqual(storyResets(old, edited), { readIds: [], quizIds: [], pageIds: [] });
  edited.pages[2].sentences[0].en = 'A big dog grabs the hat!'; // trang 3: pick (q1) và order (q3) tham chiếu
  assert.notEqual(questionHash(edited, edited.questions[0]), questionHash(old, old.questions[0]));
  assert.equal(questionHash(edited, edited.questions[1]), questionHash(old, old.questions[1])); // q2 hỏi trang 5
  assert.notEqual(contentHash(edited), contentHash(old));
  assert.deepEqual(storyResets(old, edited), { readIds: ['p3s1'], quizIds: ['q1', 'q3'], pageIds: [] });
  edited.pages = edited.pages.filter((p) => p.id !== 'p4');
  edited.questions = edited.questions.filter((q) => q.id !== 'q2');
  assert.deepEqual(storyResets(old, edited), { readIds: ['p3s1', 'p4s1', 'p4s2'], quizIds: ['q1', 'q2', 'q3'], pageIds: ['p4'] });
});

test('8.4 / ST-33 / ST-35: prompt ảnh lưới — khổ + bố cục cứng, nét vẽ chung, nhân vật, bối cảnh, ô thừa trắng; câu tiếng Anh khi thiếu imagePrompt', () => {
  assert.deepEqual([4, 5, 6].map((n) => storyGridShape(n).aspect), ['1:1 square', '3:2 landscape', '3:2 landscape']);
  const s = BUILTIN_STORIES[2];
  const p = storyGridPrompt(s);
  assert.match(p, /3:2 landscape image .* exactly 3 columns × 2 rows of EQUAL square panels/);
  assert.match(p, /not part of one wide panorama/);
  assert.ok(p.includes(STORY_ART_STYLE));
  assert.ok(p.includes(s.characters));
  assert.match(p, /same face, same hair colour, same clothes in every panel/);
  assert.ok(p.includes(`All panels take place in: ${s.setting}.`));
  assert.match(p, /Panel 3: A big dog gets the hat!/);
  assert.match(p, /Panel 6 is reserved: completely empty pure white \(#FFFFFF\)/);
  assert.match(p, /No text anywhere/);
  const withPrompt = structuredClone(s);
  withPrompt.pages[0].imagePrompt = 'Sam smiles in a red hat.';
  delete withPrompt.setting;
  const p2 = storyGridPrompt(withPrompt);
  assert.match(p2, /Panel 1: Sam smiles in a red hat\./);
  assert.ok(!p2.includes('All panels take place in'));
  const four = structuredClone(s);
  four.pages = four.pages.slice(0, 4);
  assert.match(storyGridPrompt(four), /1:1 square image .* 2 columns × 2 rows/);
  assert.ok(!storyGridPrompt(four).includes('reserved'));
});

test('8.4 / ST-34: prompt vẽ lại một trang — tỉ lệ theo ảnh trang hiện tại, giữ nhân vật / bối cảnh / nét vẽ, gửi kèm ảnh lưới', () => {
  assert.equal(ratioLabel(512, 512), 'square 1:1');
  assert.equal(ratioLabel(800, 600), '4:3 landscape');
  assert.equal(ratioLabel(900, 600), '3:2 landscape');
  assert.equal(ratioLabel(), 'square 1:1');
  const s = BUILTIN_STORIES[2];
  const p = storyRedrawPrompt(s, s.pages[3], { ratio: '4:3 landscape' });
  assert.match(p, /picture grid .* Draw ONLY the scene of Panel 4 again, as ONE single 4:3 landscape picture: Sam is sad\. He sits on the log\./);
  assert.match(p, /same number of characters/);
  assert.match(p, /no grid, no panel lines, no text/);
  assert.match(storyRedrawPrompt(s, s.pages[0], { hasGrid: false }), /a page from the same children's story/);
});

test('8.5: prompt viết truyện — âm + tricky đã học, bậc, 3 câu hỏi theo bảng 6.1, ảnh, id auto; nguồn Theo sách có từ của Unit', () => {
  const p = storyWritingPrompt({ group: 3, tricky: ['I', 'the', 'a'] });
  assert.match(p, /ONLY these letter sounds: s a t i p n c k ck e h r m d g o u l f b/);
  assert.match(p, /tricky words: I, the, a/);
  assert.match(p, /3–6 words/);
  assert.match(p, /Do not use the pronouns: they/);
  assert.match(p, /"pick"/);
  assert.match(p, /"setting"/);
  assert.match(p, /"id": ?"auto"/);
  const lesson = { id: 'book-x-unit-2', title: 'Unit 2: Toys', unit: 'Unit 2', words: [{ en: 'ball' }, { en: 'doll' }], sentences: [{ en: 'I have a ball.' }] };
  const b = storyWritingPrompt({ group: 5, lesson, idea: 'Bé chơi với bạn' });
  assert.match(b, /Unit words .*: ball, doll/);
  assert.match(b, /STORY IDEA .*Bé chơi với bạn/);
  assert.match(b, /"lessonId": ?"book-x-unit-2"/);
});

test('7.2 / 8.1 / ST-24 / ST-37: lưu truyện, ảnh lưới + gán ô, thay ảnh trang không để ảnh cũ, thay truyện xóa đúng tiến độ + ảnh trang bị xóa, xóa truyện dọn hết', async () => {
  const db = await openDatabase(`story-${Math.random()}`);
  const story = { ...validateStory(aiStory()).story, id: 'story-g3-x' };
  await saveStory(db, story);
  const img = (text, w = 10, hgt = 10) => ({ blob: new Blob([text], { type: 'image/jpeg' }), mimeType: 'image/jpeg', width: w, height: hgt });
  const tiles = ['t0', 't1', 't2', 't3', 't4', 't5'].map((t) => img(t));
  // Màn xem trước: đổi trang 2 ↔ 4, bỏ ô 3, gán ô 6 cho trang 3 → bảng ô → trang.
  const cells = ['p1', 'p4', null, 'p2', 'p5', 'p3'];
  await saveGridImages(db, story.id, { grid: img('grid', 1536, 1024), cols: 3, rows: 2, cells, tiles });
  const imgs = async () => new Map((await db.getAllByIndex('images', 'lessonId', story.id)).map((r) => [r.word, r]));
  let m = await imgs();
  assert.equal(m.size, 6); // 5 trang + ảnh lưới gốc
  assert.deepEqual(m.get(STORY_GRID).cells, cells);
  assert.equal(m.get('p4').gridCell, 1);
  assert.equal(m.get('p3').gridCell, 5);
  assert.equal(new TextDecoder().decode(m.get('p2').data), 't3');
  // Ảnh lẻ thay trang 4 (vẽ lại một trang): ảnh cũ của trang 4 bị xóa, ảnh lưới gốc giữ nguyên.
  await setPageImage(db, story.id, 'p4', img('redraw'));
  m = await imgs();
  assert.equal(m.size, 6);
  assert.equal(m.get('p4').source, 'single');
  assert.equal(new TextDecoder().decode(m.get('p4').data), 'redraw');
  assert.equal(new TextDecoder().decode(m.get(STORY_GRID).data), 'grid');

  // Tiến độ rồi thay truyện: sửa câu trang 3 + xóa trang 4 → xóa đúng câu đọc / câu hỏi + ảnh trang 4.
  for (const q of story.questions) await recordItem(db, { lessonId: story.id, activity: 'quiz', itemId: q.id }, RESULT.INDEPENDENT);
  for (const sid of ['p1s1', 'p3s1', 'p4s1']) await recordItem(db, { lessonId: story.id, activity: 'read', itemId: sid }, RESULT.PRACTICED);
  await recordLessonDone(db, story.id, 3);
  const next = structuredClone(story);
  next.pages[2].sentences[0].en = 'A big dog grabs the hat!';
  next.pages = next.pages.filter((p) => p.id !== 'p4');
  await replaceStory(db, next, storyResets(story, next));
  const keys = (await db.getAllByIndex('progress', 'lessonId', story.id)).map((p) => p.key).sort();
  assert.deepEqual(keys, ['lesson:story-g3-x', 'story-g3-x/quiz/q2', 'story-g3-x/read/p1s1']);
  m = await imgs();
  assert.ok(!m.has('p4'));
  assert.ok(m.has(STORY_GRID));
  assert.equal((await db.get('stories', story.id)).pages.length, 4);

  await deleteStory(db, story.id);
  assert.equal(await db.get('stories', story.id), undefined);
  assert.equal((await db.getAllByIndex('images', 'lessonId', story.id)).length, 0);
  assert.equal((await db.getAllByIndex('progress', 'lessonId', story.id)).length, 0);
  db.close();
});

test('10: gói chia sẻ có truyện + ảnh trang (không kèm ảnh lưới gốc); máy kia nhập đủ; nhập lại → thay, giữ tiến độ phần còn nguyên; trùng id truyện có sẵn → báo', async () => {
  const { makeSharePackage, installPackage, isSharePackage, installedText } = await import('../../app/js/share.js');
  const { installLesson } = await import('../../app/js/library.js');
  const src = await openDatabase(`share-story-src-${Math.random()}`);
  const story = { ...validateStory(aiStory()).story, id: 'story-g3-mine', title: 'My Hat' };
  await saveStory(src, story);
  const img = (text) => ({ blob: new Blob([text], { type: 'image/jpeg' }), mimeType: 'image/jpeg', width: 8, height: 8 });
  await saveGridImages(src, story.id, { grid: img('grid'), cols: 3, rows: 2, cells: ['p1', 'p2', null, null, null, null], tiles: ['a', 'b', 'c', 'd', 'e', 'f'].map(img) });
  const made = await makeSharePackage(src, { storyIds: [story.id, 'story-g1-pip'] });
  assert.deepEqual(made.counts, { lessons: 0, scenes: 0, stories: 1, images: 2 }); // truyện có sẵn không đi kèm
  const pkg = JSON.parse(JSON.stringify(made.package));
  assert.ok(isSharePackage(pkg));
  assert.equal(pkg.stories[0].createdAt, undefined);
  assert.ok(!pkg.images.some((i) => i.word === STORY_GRID));

  const dst = await openDatabase(`share-story-dst-${Math.random()}`);
  const r = await installPackage(dst, pkg, installLesson);
  assert.equal(r.stories, 1);
  assert.equal(r.images, 2);
  assert.equal(installedText(r), 'Đã nhập 1 truyện, 2 ảnh');
  assert.equal((await dst.get('stories', story.id)).title, 'My Hat');
  const pages = new Map((await dst.getAllByIndex('images', 'lessonId', story.id)).map((x) => [x.word, x]));
  assert.equal(new TextDecoder().decode(pages.get('p2').data), 'b');

  // Nhập lại bản sửa câu trang 3: thay truyện, xóa đúng tiến độ câu hỏi tham chiếu trang 3, giữ phần còn lại.
  await recordItem(dst, { lessonId: story.id, activity: 'quiz', itemId: 'q1' }, RESULT.INDEPENDENT);
  await recordItem(dst, { lessonId: story.id, activity: 'quiz', itemId: 'q2' }, RESULT.INDEPENDENT);
  const pkg2 = structuredClone(pkg);
  pkg2.stories[0].pages[2].sentences[0].en = 'A big dog grabs the hat!';
  const r2 = await installPackage(dst, pkg2, installLesson);
  assert.equal(r2.stories, 1);
  assert.equal(await dst.get('progress', `${story.id}/quiz/q1`), undefined);
  assert.ok(await dst.get('progress', `${story.id}/quiz/q2`));

  const clash = structuredClone(pkg);
  clash.stories[0].id = 'story-g1-pip';
  const r3 = await installPackage(dst, clash, installLesson);
  assert.equal(r3.stories, 0);
  assert.match(r3.problems[0], /trùng id truyện có sẵn/);
  src.close();
  dst.close();
});
