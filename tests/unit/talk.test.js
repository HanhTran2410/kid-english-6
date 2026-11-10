// Khu 💬 Talk (SPEC 3.3): dữ liệu hội thoại, phần đầu câu, từ khóa, tên bé, kết quả nghe; ghi âm (6.2); prompt AI (5.7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateLesson, itemsToReset } from '../../app/js/lesson.js';
import { TALK, talkOutcome, turnKeywords, starterOf, withName, playableTurns, suggestedLevel, needsName } from '../../app/js/talk.js';
import { BUILTIN_TALKS, BUILTIN_BY_ID } from '../../app/js/data/builtin-lessons.js';
import { recordingsToPrune } from '../../app/js/db.js';
import { lessonPrompt } from '../../app/js/lesson-prompts.js';
import { ZONE_TYPES, isPlayable, countSteps } from '../../app/js/read/stages.js';

const lessonWith = (dialogues, activities = [{ type: 'talk', items: ['d1'] }]) => ({
  version: 1, id: 'talk-x', track: 'book', title: 'X', words: [], dialogues, activities,
});
const turn = (extra = {}) => ({ id: 't1', ask: 'What is it?', answer: 'It is a cat.', ...extra });

test('hội thoại hợp lệ: chuẩn hóa lượt, bạn hỏi mặc định Mimi 🐱, hoạt động talk trỏ tới hội thoại', () => {
  const r = validateLesson(lessonWith([{ id: 'd1', title: 'Pets', turns: [turn({ keywords: ['cat'] })] }]));
  assert.equal(r.ok, true, r.errors.join('; '));
  const d = r.lesson.dialogues[0];
  assert.deepEqual(d.partner, { name: 'Mimi', emoji: '🐱' });
  assert.deepEqual(d.turns[0], { id: 't1', ask: 'What is it?', askVi: '', answer: 'It is a cat.', answerVi: '', starter: '', keywords: ['cat'], emoji: null, reply: '' });
  assert.ok(isPlayable(r.lesson, 'talk'));
  assert.equal(isPlayable(r.lesson, 'read'), false);
  assert.equal(countSteps(r.lesson, 'talk'), 1);
  assert.ok(ZONE_TYPES.talk.has('talk'));
});

test('hội thoại lỗi: thiếu câu hỏi / câu mẫu, quá dài, trùng lượt, talk trỏ tới hội thoại không có → báo rõ chỗ', () => {
  const long = Array.from({ length: 16 }, () => 'cat').join(' ');
  const r = validateLesson(lessonWith([
    { id: 'd1', title: 'A', turns: [turn({ ask: '' }), turn({ answer: '' }), turn({ id: 't3', answer: long })] },
  ], [{ type: 'talk', items: ['d1', 'd9'] }]));
  assert.equal(r.ok, false);
  const all = r.errors.join('\n');
  assert.match(all, /lượt 1: thiếu câu hỏi/);
  assert.match(all, /lượt 2: "id" "t1" bị trùng/);
  assert.match(all, /lượt 2: thiếu câu mẫu/);
  assert.match(all, /lượt 3: "answer" dài quá 15 từ/);
  assert.match(all, /không có hội thoại mang id "d9"/);
  assert.equal(validateLesson(lessonWith([{ id: 'd1', title: 'A', turns: [] }])).ok, false);
});

test('thay bài: lượt bị xóa / đổi câu mẫu → xóa tiến độ "<hội thoại>-<lượt>"; lượt giữ nguyên → giữ', () => {
  const old = validateLesson(lessonWith([{ id: 'd1', title: 'A', turns: [turn(), turn({ id: 't2', answer: 'It is a dog.' }), turn({ id: 't3' })] }])).lesson;
  const next = validateLesson(lessonWith([{ id: 'd1', title: 'A', turns: [turn(), turn({ id: 't2', answer: 'It is a hen.' })] }])).lesson;
  assert.deepEqual(itemsToReset(old, next), ['d1-t2', 'd1-t3']);
});

test('phần đầu câu (mức 2): có starter thì dùng; không có thì các từ trước từ khóa; từ khóa đầu câu → nửa đầu', () => {
  assert.equal(starterOf(turn({ starter: 'It is a…' })), 'It is a');
  assert.equal(starterOf(turn({ keywords: ['cat'] })), 'It is a');
  assert.equal(starterOf(turn({ answer: 'Yes, I do.', keywords: ['do'] })), 'Yes, I');
  assert.equal(starterOf(turn({ answer: 'She is my mother.' })), 'She is my'); // từ khóa tự lấy: "mother"
  assert.equal(starterOf(turn({ answer: 'My name is {name}.', keywords: ['{name}'] }), 'Lan'), 'My name is');
});

test('từ khóa: có sẵn (thay {name}); không có thì lấy từ chính của câu mẫu', () => {
  assert.deepEqual(turnKeywords(turn({ keywords: ['{name}', 'name'] }), 'Lan'), ['Lan', 'name']);
  assert.deepEqual(turnKeywords(turn()), ['cat']);
  assert.equal(withName('My name is {name}.', ' Lan '), 'My name is Lan.');
});

test('lượt có {name}: chưa nhập tên bé → bỏ qua lượt đó', () => {
  const d = { turns: [turn({ answer: 'My name is {name}.' }), turn({ id: 't2' })] };
  assert.equal(needsName(d.turns[0]), true);
  assert.deepEqual(playableTurns(d, '').map((t) => t.id), ['t2']);
  assert.deepEqual(playableTurns(d, 'Lan').map((t) => t.id), ['t1', 't2']);
});

test('kết quả nghe ở Talk (4.2): không phán sai — từ khóa → MATCH; chữ khác → OTHER; có tiếng không ra chữ → UNHEARD / SAID', () => {
  const keys = ['cat'];
  const s = (x) => ({ micReady: true, recognizing: true, voiced: true, heard: [], ...x });
  assert.equal(talkOutcome(s({ heard: ['it is a cat'] }), keys), TALK.MATCH);
  assert.equal(talkOutcome(s({ heard: ['a cats'] }), keys), TALK.MATCH);
  assert.equal(talkOutcome(s({ heard: ['banana'] }), keys), TALK.OTHER);
  assert.equal(talkOutcome(s({}), keys), TALK.UNHEARD);
  assert.equal(talkOutcome(s({ recognizing: false }), keys), TALK.SAID);
  assert.equal(talkOutcome(s({ voiced: false }), keys), TALK.SILENT);
  assert.equal(talkOutcome(s({ micReady: false }), keys), TALK.NONE);
});

test('mức gợi ý: mức kế tiếp chưa làm, tối đa 3', () => {
  assert.deepEqual([0, 1, 2, 3].map(suggestedLevel), [1, 2, 3, 3]);
});

test('bài Talk có sẵn: 6 bài, mỗi bài 1 hội thoại 4 lượt; câu ngắn; có từ khóa + câu tiếng Việt; không viết cứng tên nhân vật chính', () => {
  assert.equal(BUILTIN_TALKS.length, 6);
  for (const l of BUILTIN_TALKS) {
    assert.ok(BUILTIN_BY_ID.get(l.id) === l);
    assert.ok(isPlayable(l, 'talk') && !isPlayable(l, 'read') && !isPlayable(l, 'spell'), l.id);
    assert.equal(l.dialogues.length, 1);
    for (const t of l.dialogues[0].turns) {
      assert.ok(t.keywords.length && t.askVi && t.answerVi, `${l.id}/${t.id}`);
      assert.ok(t.answer.split(/\s+/).length <= 8, `${l.id}/${t.id}: câu mẫu dài`);
      assert.doesNotMatch(`${t.ask} ${t.answer} ${t.reply}`, /Olly/);
      // Câu mẫu phải chứa ít nhất một từ khóa (bé nói theo câu mẫu là đạt).
      assert.equal(talkOutcome({ micReady: true, recognizing: true, voiced: true, heard: [withName(t.answer, 'Lan')] }, turnKeywords(t, 'Lan')), TALK.MATCH, `${l.id}/${t.id}`);
    }
  }
});

test('ghi âm vượt 150 MB: xóa bản cũ nhất, giữ bản đầu tiên của mỗi câu', () => {
  const MB = 1024 * 1024;
  const list = [
    { id: 'a1', word: 'a', date: 1, size: 60 * MB },
    { id: 'b1', word: 'b', date: 2, size: 60 * MB },
    { id: 'a2', word: 'a', date: 3, size: 20 * MB },
    { id: 'a3', word: 'a', date: 4, size: 20 * MB },
    { id: 'b2', word: 'b', date: 5, size: 20 * MB },
  ];
  assert.deepEqual(recordingsToPrune(list, 150 * MB), ['a2', 'a3']);
  assert.deepEqual(recordingsToPrune(list.slice(0, 3), 150 * MB), []);
});

test('prompt AI bài theo sách có hội thoại + hoạt động talk; ví dụ trong prompt là bài hợp lệ', () => {
  const p = lessonPrompt({ book: 'Global Success 1', unit: 'Unit 1', words: 'cat', group: 3 });
  assert.match(p, /"dialogues": MỘT hội thoại 3–5 lượt/);
  const json = JSON.parse(p.slice(p.indexOf('{', p.indexOf('VÍ DỤ CẤU TRÚC'))));
  const r = validateLesson(json);
  assert.equal(r.ok, true, r.errors.join('; '));
  assert.ok(isPlayable(r.lesson, 'talk'));
});

test('màn Talk chỉ dùng giọng thứ hai cho bạn hỏi (role alt), không có câu chê', async () => {
  const src = await readFile(new URL('../../app/js/read/talk-stages.js', import.meta.url), 'utf8');
  assert.match(src, /role: 'alt'/);
  assert.doesNotMatch(src, /Wrong|No, no|Try again/);
});
