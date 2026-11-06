// Khu Read 0.2: bài có sẵn nhóm 1–3, thông tin âm, phụ đề 🔊, ôn tricky words, chọn đáp án nhiễu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BUILTIN_LESSONS } from '../../app/js/data/builtin-lessons.js';
import { validateLesson } from '../../app/js/lesson.js';
import { RECORDED_SOUNDS, SOUND_INFO, learnedGraphemes, isDecodable, toGraphemes } from '../../app/js/phonics.js';
import { QUESTIONS, translateQuestion } from '../../app/js/captions.js';
import { RESULT, applyTricky, emptyItem, trickyRef, TRICKY_BOX_DAYS } from '../../app/js/progress.js';
import { shuffle, distractors, countSteps, isReadable } from '../../app/js/read/stages.js';

test('bài có sẵn nhóm 1–3: hợp lệ, không cảnh báo, mọi từ đọc được bằng âm đã học, mọi âm có file', () => {
  assert.deepEqual(BUILTIN_LESSONS.map((l) => l.id), ['phonics-g1', 'phonics-g2', 'phonics-g3']);
  for (const l of BUILTIN_LESSONS) {
    const r = validateLesson(l, { builtIn: true });
    assert.deepEqual([r.errors, r.warnings], [[], []], l.id);
    assert.equal(l.builtIn, true);
    assert.ok(isReadable(l));
    const learned = learnedGraphemes(l.group);
    for (const w of l.words.filter((x) => x.graphemes)) {
      assert.ok(isDecodable(w, learned), `${l.id}: ${w.en}`);
      for (const s of w.sounds) assert.ok(RECORDED_SOUNDS.has(s), `${l.id}: ${w.en} cần file âm ${s}`);
      assert.ok(w.vi, `${w.en} thiếu nghĩa`);
    }
    for (const s of l.newSounds) assert.ok(RECORDED_SOUNDS.has(s) && SOUND_INFO[s], s);
    assert.ok(l.words.filter((w) => w.emoji).length >= 3, `${l.id}: cần ≥ 3 hình để chọn`);
    assert.ok(countSteps(l) > 10);
  }
});

test('ô chữ: ck, sh là một ô (duck → d-u-ck, ship → sh-i-p); c và ck cùng âm k', () => {
  assert.deepEqual(toGraphemes('duck', learnedGraphemes(3)), ['d', 'u', 'ck']);
  assert.deepEqual(toGraphemes('ship', learnedGraphemes(6)), ['sh', 'i', 'p']);
  assert.equal(toGraphemes('fox', learnedGraphemes(3)), null); // x học ở nhóm 6
  const cat = BUILTIN_LESSONS[1].words.find((w) => w.en === 'cat');
  assert.deepEqual(cat.sounds, ['k', 'a', 't']);
});

test('mỗi âm đã có file có thông tin hiển thị + lời giải thích tiếng Việt; không viết cứng tên nhân vật', () => {
  for (const s of RECORDED_SOUNDS) {
    const info = SOUND_INFO[s];
    assert.ok(info?.letters && info.word && info.emoji && info.vi, s);
    assert.ok(!/Olly/.test(info.vi), s);
  }
  for (const l of BUILTIN_LESSONS) assert.ok(!/Olly/.test(JSON.stringify(l)), l.id);
});

test('phụ đề 🔊 (SPEC 4.5): mọi mẫu câu hỏi của Olly đều có bản dịch tiếng Việt, kèm nghĩa của từ', () => {
  for (const [name, make] of Object.entries(QUESTIONS)) {
    assert.ok(translateQuestion(make('ship')), name);
  }
  assert.equal(translateQuestion(QUESTIONS.whichOne('ship'), 'con tàu'), 'Hình nào là "ship" (con tàu)? Bé chạm vào hình đúng.');
  assert.equal(translateQuestion('Something else', 'con tàu'), 'Nghĩa: con tàu');
});

test('màn học chỉ dùng câu hỏi trong QUESTIONS (để phụ đề luôn dịch được)', async () => {
  for (const f of ['read/stages.js', 'read/teacher.js']) {
    const src = await readFile(new URL(`../../app/js/${f}`, import.meta.url), 'utf8');
    for (const m of src.matchAll(/(?:ask|choose)\(\s*\{?[^)]*?question:\s*([^,}]+)/g)) {
      assert.match(m[1].trim(), /^QUESTIONS\./, `${f}: câu hỏi "${m[1].trim()}" phải lấy từ QUESTIONS`);
    }
  }
});

test('ôn tricky words theo hộp: sai → hộp 0 (gặp lại trong buổi); có gợi ý → giữ hộp, buổi sau; độc lập → +1', () => {
  const day = 24 * 60 * 60 * 1000;
  let p = emptyItem(trickyRef('the'));
  p = applyTricky(p, RESULT.INDEPENDENT, 0);
  assert.deepEqual([p.box, p.nextAt], [1, TRICKY_BOX_DAYS[1] * day]);
  p = applyTricky(p, RESULT.INDEPENDENT, 0);
  assert.equal(p.box, 2);
  p = applyTricky(p, RESULT.HELPED, 0);
  assert.deepEqual([p.box, p.nextAt], [2, 3 * day]);
  p = applyTricky(p, RESULT.MISSED, 0);
  assert.deepEqual([p.box, p.nextAt], [0, 0]);
  p = applyTricky(emptyItem(trickyRef('the')), RESULT.HELPED, 0);
  assert.equal(p.nextAt, day);
  for (let i = 0; i < 9; i++) p = applyTricky(p, RESULT.INDEPENDENT, 0);
  assert.equal(p.box, 4);
});

test('đáp án nhiễu: khác đáp án đúng, không trùng nhau, ưu tiên trong bài; trộn giữ đủ phần tử', () => {
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 50; i++) {
    const d = distractors('s', ['s', 'a', 't'], ['s', 'a', 't', 'i', 'p', 'n'], 2, rand);
    assert.equal(d.length, 2);
    assert.ok(!d.includes('s') && d[0] !== d[1]);
    assert.ok(d.every((x) => ['a', 't'].includes(x)));
  }
  assert.deepEqual(distractors('x', ['x'], ['x', 'y', 'z'], 2, rand).sort(), ['y', 'z']);
  assert.deepEqual(shuffle([1, 2, 3, 4], rand).sort(), [1, 2, 3, 4]);
});
