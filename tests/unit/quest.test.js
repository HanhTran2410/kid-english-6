// 🧩 Quest (SPEC-quest.md mục 12.1): kiến thức đã học theo đúng nhóm, bộ kiểm tra đọc được, kho không đủ mục,
// Quest 1 (bảng cặp, cân bằng in / on / under, mức 3, chấm 3 trường, câu hai việc), Quest 2 (thẻ từ, chấm theo chữ).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_LESSONS } from '../../app/js/data/builtin-lessons.js';
import { GROUPS } from '../../app/js/phonics.js';
import { learnedPhonics, canRead, questPool, fillTo, lookAlike, QUEST_WORDS, wordsOf } from '../../app/js/quest/content.js';
import {
  BUILTIN_QUESTS, PAIRS, PLACES, makeQ1, makeQ2, judgeQ1, q1WrongLine, q1Text, sentenceWords, q2Wrong, q2Prefix,
  questKindsAt, questRef, questExplainVi, QUEST_ITEMS, makeQ3, firstSoundOf, questSentence,
} from '../../app/js/quest/quest.js';
import { seeded } from '../../app/js/math/math.js';
import { TRAITS, RIDDLE_BY_WORD } from '../../app/js/quest/riddles.js';
import { QUESTIONS, translateQuestion } from '../../app/js/captions.js';

const RUNS = 300;
const setup = (groups) => {
  const lp = learnedPhonics(groups);
  return { lp, pool: questPool(BUILTIN_LESSONS, lp) };
};
const ALL = [1, 2, 3, 4, 5, 6, 7];

test('4 trò (đợt Q-a, Q-b, Q-c), khóa quest-q*', () => {
  assert.deepEqual(BUILTIN_QUESTS.map((q) => q.id), ['quest-q1', 'quest-q2', 'quest-q3', 'quest-q4']);
});

test('learnedPhonics (2.2): chỉ gộp grapheme / tricky của ĐÚNG các nhóm đã xong (QU-09)', () => {
  const lp = learnedPhonics([4, 1]);
  const g2 = GROUPS.find((g) => g.group === 2).graphemes;
  for (const g of g2) assert.equal(lp.graphemes.has(g), false, g);
  assert.ok(lp.graphemes.has('ai') && lp.graphemes.has('s'));
  assert.ok(lp.tricky.has('the') && lp.tricky.has('you') && !lp.tricky.has('he'));
  assert.deepEqual(lp.completedGroups, [1, 4]);
});

test('canRead (2.3): tricky / từ Quest / không đọc theo âm / tách grapheme; một từ không đọc được → loại (QU-10)', () => {
  const lp = learnedPhonics([1, 2, 3]);
  assert.equal(canRead('The cat is on the bed.', lp).ok, true); // o (on) là nhóm 3
  assert.deepEqual(canRead('It is in the sky.', lp).bad, ['sky']);
  assert.deepEqual(canRead('Put the cat in the bag.', lp).bad, ['put']);
  assert.equal(canRead('Put the cat in the bag.', lp, QUEST_WORDS).ok, true);
  assert.deepEqual(canRead('You can see it.', lp).bad.sort(), ['see', 'you']);
  assert.equal(canRead('You can see it.', learnedPhonics(ALL)).ok, true);
  assert.deepEqual(wordsOf("The dog's bed."), ['the', "dog's", 'bed']);
  // Kho: mọi từ và câu đều đọc được với đúng các nhóm đã xong.
  for (const groups of [[1], [1, 2, 3], [1, 3, 5], ALL]) {
    const { lp: l, pool } = setup(groups);
    for (const w of pool.words) assert.ok(canRead(w.en, l).ok, w.en);
    for (const s of pool.sentences) assert.ok(canRead(s.en, l).ok, s.en);
  }
  assert.equal(setup([4]).pool.words.length, 0, 'chỉ xong nhóm 4: từ nhóm 4 cần âm nhóm 1–3 → kho rỗng');
});

test('fillTo (2.5): đủ thì không lặp; thiếu thì lặp, không hai mục liền giống nhau; rỗng → [] (QU-11)', () => {
  const r = seeded(1);
  assert.deepEqual(fillTo([], 8, r), []);
  const many = fillTo([1, 2, 3, 4, 5, 6, 7, 8, 9], 8, r);
  assert.equal(new Set(many).size, 8);
  for (const list of [[1, 2], [1, 2, 3], [1, 2, 3, 4, 5]]) {
    const out = fillTo(list, 8, seeded(list.length));
    assert.equal(out.length, 8);
    assert.ok(out.every((x, i) => !i || x !== out[i - 1]), String(list));
  }
  assert.deepEqual(fillTo([7], 3, r), [7, 7, 7]);
  assert.ok(lookAlike('cat', 'hat') && !lookAlike('cat', 'dog') && !lookAlike('cat', 'cats'));
});

test('Quest 1: chỉ cặp trong bảng 4.4, câu đọc được, in / on cân bằng, kệ đúng cỡ, đồ nhiễu giống chữ chỉ từ mức 2', () => {
  for (const groups of [[1, 2, 3], [1, 2, 3, 5, 6], ALL]) {
    const { lp, pool } = setup(groups);
    for (const level of [1, 2, 3]) {
      for (let seed = 1; seed <= RUNS; seed++) {
        const items = makeQ1(level, seeded(seed), pool, lp);
        assert.equal(items.length, QUEST_ITEMS);
        items.forEach((it, i) => {
          for (const a of it.actions) {
            assert.ok(PAIRS[a.thing]?.[a.where]?.includes(a.place), `${a.thing} ${a.where} ${a.place}`);
            assert.ok(it.shelf.includes(a.thing) && it.places.includes(a.place));
            if (level < 3) assert.notEqual(a.where, 'under');
          }
          assert.ok(canRead(it.text, lp, QUEST_WORDS).ok, it.text);
          assert.equal(it.text, q1Text(it.actions, pool.byWord).en);
          assert.ok(it.vi.startsWith('Đặt '));
          assert.equal(it.shelf.length, level === 1 ? 4 : level === 2 ? 5 : it.actions.length > 1 ? 6 : 5, `kệ mức ${level}`);
          assert.ok(it.places.length >= 3 && it.places.every((p) => PLACES.includes(p)));
          if (level === 1) assert.ok(!it.shelf.some((w) => it.actions.some((a) => lookAlike(a.thing, w))), 'mức 1 không có đồ giống chữ');
          if (i) assert.notEqual(items[i - 1].actions[0].thing, it.actions[0].thing, 'không hai mục liền cùng đồ');
        });
        if (level < 3) {
          const n = (w) => items.filter((x) => x.actions[0].where === w).length;
          assert.ok(Math.abs(n('in') - n('on')) <= 2, 'in / on cân bằng');
        } else {
          assert.ok(items.slice(0, 5).every((x) => x.actions.length === 1), 'mức 3: 5 câu một việc trước');
          assert.ok(items.slice(0, 5).filter((x) => x.actions[0].where === 'under').length >= 2, '≥ 2 câu under');
          for (const x of items.slice(5)) {
            assert.equal(x.actions.length, 2, 'mức 3: 3 câu hai việc cuối lượt');
            const [a, b] = x.actions;
            assert.ok(a.thing !== b.thing && a.place !== b.place && a.where !== 'under' && b.where !== 'under');
            assert.ok(x.shelf.includes(a.thing) && x.shelf.includes(b.thing));
          }
        }
        if (level >= 2 && groups.length >= 3) {
          // Mức 2–3 có đồ nhiễu giống chữ khi kho có (cat / hat, pen / hen…): không bắt buộc từng mục, nhưng phải có trong lượt.
          assert.ok(items.some((it) => it.shelf.some((w) => it.actions.some((a) => lookAlike(a.thing, w)))), 'có đồ giống chữ');
        }
      }
    }
  }
  const { lp, pool } = setup([1]);
  assert.deepEqual(makeQ1(1, seeded(1), pool, lp), [], 'nhóm 1 chưa có chỗ đặt đọc được → không mở lượt');
});

test('Quest 1 chấm 3 trường: thing → place → where; câu hai việc chấm theo việc chưa xong (QU-12, 13, 14)', () => {
  const acts = [{ thing: 'cat', where: 'in', place: 'box' }, { thing: 'hat', where: 'on', place: 'bed' }];
  assert.deepEqual(judgeQ1(acts, [false, false], { thing: 'cat', where: 'in', place: 'box' }), { index: 0, error: null });
  assert.deepEqual(judgeQ1(acts, [false, false], { thing: 'hat', where: 'on', place: 'bed' }), { index: 1, error: null });
  assert.deepEqual(judgeQ1(acts, [false, false], { thing: 'dog', where: 'in', place: 'box' }), { index: 0, error: 'thing' });
  assert.deepEqual(judgeQ1(acts, [true, false], { thing: 'dog', where: 'in', place: 'box' }), { index: 1, error: 'thing' });
  assert.deepEqual(judgeQ1(acts, [false, false], { thing: 'cat', where: 'in', place: 'bag' }), { index: 0, error: 'place' });
  assert.deepEqual(judgeQ1(acts, [false, false], { thing: 'cat', where: 'on', place: 'box' }), { index: 0, error: 'where' });
  // Việc đã xong không chấm lại: đặt lại con mèo (đã xong) → coi như sai đồ của việc còn lại.
  assert.deepEqual(judgeQ1(acts, [true, false], { thing: 'cat', where: 'in', place: 'box' }), { index: 1, error: 'thing' });
  assert.equal(q1WrongLine(acts[0], { thing: 'ant' }, 'thing'), 'That is an ant. Find the cat!');
  assert.equal(q1WrongLine(acts[0], { place: 'bag' }, 'place'), 'That is the bag. Put it in the box!');
  assert.equal(q1WrongLine(acts[0], { where: 'on', place: 'box' }, 'where'), 'The cat is on the box. Put it IN the box!');
  const byWord = new Map([['cat', { vi: 'con mèo' }], ['box', { vi: 'cái hộp' }], ['hat', { vi: 'cái mũ' }], ['bed', { vi: 'cái giường' }]]);
  assert.deepEqual(q1Text(acts, byWord), { en: 'Put the cat in the box and the hat on the bed.', vi: 'Đặt con mèo vào trong cái hộp, và cái mũ lên trên cái giường.' });
  assert.match(questExplainVi('q1', { actions: acts }, { action: acts[0], error: 'where', byWord }), /VÀO TRONG/);
});

test('Quest 2: thẻ từ (chữ hoa đầu câu, bỏ dấu chấm), chấm theo chữ, thẻ cùng chữ đổi chỗ vẫn đúng (QU-16, 17, 18)', () => {
  assert.deepEqual(sentenceWords('The dog is on the bed.'), ['The', 'dog', 'is', 'on', 'the', 'bed']);
  assert.equal(sentenceWords('Hi, Tom.'), null);
  const words = ['The', 'cat', 'is', 'on', 'the', 'mat'];
  assert.deepEqual(q2Wrong(['The', 'cat', 'on', 'is', 'the', 'mat'], words), [2, 3]);
  assert.deepEqual(q2Wrong([...words], words), []);
  assert.deepEqual(q2Prefix(['The', 'cat', 'on', 'is', 'the', 'mat'], words), ['The', 'cat']);
  for (const groups of [[1], [1, 2, 3], ALL]) {
    const { lp, pool } = setup(groups);
    for (const level of [1, 2, 3]) {
      for (let seed = 1; seed <= RUNS; seed++) {
        const items = makeQ2(level, seeded(seed), pool, lp);
        assert.equal(items.length, QUEST_ITEMS);
        items.forEach((it, i) => {
          assert.ok(it.words.length >= 3 && it.words.length <= 7);
          assert.ok(canRead(it.en, lp).ok);
          assert.equal(it.given, level < 3 ? 1 : 0);
          if (level === 3 && it.extra) {
            assert.ok(!it.words.map((w) => w.toLowerCase()).includes(it.extra) && canRead(it.extra, lp).ok);
          } else if (level < 3) assert.equal(it.extra, null);
          if (i && new Set(items.map((x) => x.id)).size > 1) assert.notEqual(items[i - 1].id, it.id, 'không lặp liền');
        });
        if (groups === ALL) {
          const starts = new Map();
          for (const it of items) {
            const k = it.words.slice(0, 2).join(' ').toLowerCase();
            starts.set(k, (starts.get(k) ?? 0) + 1);
          }
          assert.ok(Math.max(...starts.values()) <= 3, '≤ 3 câu cùng 2 từ đầu');
        }
      }
    }
  }
  assert.match(questExplainVi('q2', { en: 'The ant sat.', vi: 'Con kiến ngồi.', words: ['The', 'ant', 'sat'] }), /The – ant – sat/);
});

test('khóa tiến độ, kiểu câu, phụ đề câu hỏi Quest', () => {
  assert.deepEqual(questRef(BUILTIN_QUESTS[0], { id: 'q1-cat-in-box' }), { lessonId: 'quest-q1', activity: 'do', itemId: 'q1-cat-in-box' });
  assert.deepEqual(questRef(BUILTIN_QUESTS[1], { id: 'phonics-g3-s1' }), { lessonId: 'quest-q2', activity: 'build', itemId: 'phonics-g3-s1' });
  assert.deepEqual(questKindsAt('q1', 3), ['q1:in', 'q1:on', 'q1:under', 'q1:two']);
  for (const q of ['readAndDo', 'makeSentence']) assert.ok(translateQuestion(QUESTIONS[q]()), q);
  assert.ok(translateQuestion('Put the cat in the box.'));
  assert.ok(translateQuestion('Put the cat in the box and the hat on the bed.'));
});

test('Quest 3 (6, RD-08 / 14 / 15 / 17, QU-19): 8 mục, nhiễu đã học + sai câu 2 + khác chữ đầu; kho < 3 từ → []', () => {
  assert.deepEqual(makeQ3(1, seeded(1), setup([1]).pool, setup([1]).lp), []);
  assert.deepEqual(makeQ3(1, seeded(1), setup([1, 2]).pool, setup([1, 2]).lp), []);
  for (const groups of [[1, 2, 3], [1, 2, 3, 4], ALL, [3, 5]]) {
    const { lp, pool } = setup(groups);
    const learned = new Set(pool.words.map((w) => w.en));
    for (const level of [1, 2, 3]) {
      const positions = [];
      for (let run = 0; run < 60; run++) {
        const items = makeQ3(level, seeded(run * 7 + level), pool, lp);
        if (!items.length) continue;
        assert.equal(items.length, QUEST_ITEMS);
        items.forEach((it, i) => {
          if (i) assert.notEqual(it.word, items[i - 1].word, 'không hai mục liền giống nhau');
          assert.ok(it.show <= level);
          assert.ok(canRead(it.en.join(' '), lp).ok, `${it.word}: gợi ý đọc được`);
          assert.ok(learned.has(it.word));
          assert.equal(it.options.filter((w) => w === it.word).length, 1);
          if (it.show < 3) assert.equal(it.options.length, 3);
          assert.ok(it.options.length >= 3 && it.options.length <= 4);
          assert.equal(new Set(it.options.map((w) => w[0])).size, it.options.length, 'khác chữ đầu');
          const kind = RIDDLE_BY_WORD.get(it.word).kind;
          for (const d of it.distractors) {
            assert.ok(learned.has(d), `RD-08: ${d} chưa học`);
            assert.ok(!TRAITS[it.trait][1].includes(d), `QU-19: ${d} cũng đúng "${it.en[1]}"`);
            assert.equal(RIDDLE_BY_WORD.get(d).kind === kind, it.show > 1);
          }
          assert.equal(it.sumReadable, canRead(it.sum, lp).ok);
          positions.push(it.options.indexOf(it.word));
        });
        // RD-15: từ lặp lại trong lượt dùng cặp gợi ý khác nếu từ đó có nhiều cặp đọc được.
        const byWord = new Map();
        for (const it of items) byWord.set(it.word, [...(byWord.get(it.word) ?? []), it.en.join(' ')]);
        for (const [w, clues] of byWord) {
          const readable = RIDDLE_BY_WORD.get(w).clues.filter((c) => canRead(c.en.join(' '), lp).ok).length;
          if (clues.length === 2 && readable >= 2 && items[0].show === 1) assert.notEqual(clues[0], clues[1], w);
        }
      }
      // RD-17: đáp án không dồn vào một vị trí.
      if (positions.length) {
        const n = Math.max(...positions) + 1;
        for (let p = 0; p < Math.min(n, 3); p++) assert.ok(positions.filter((x) => x === p).length > positions.length / 6, `vị trí ${p}`);
      }
    }
  }
});

test('Quest 3: âm đầu theo chữ ghép (ch, sh, th, qu), kiểu câu, khóa, câu đọc là câu tổng kết', () => {
  assert.deepEqual(firstSoundOf('chick'), { grapheme: 'ch', sound: 'ch' });
  assert.deepEqual(firstSoundOf('ship').grapheme, 'sh');
  assert.deepEqual(firstSoundOf('queen').grapheme, 'qu');
  assert.deepEqual(firstSoundOf('cat'), { grapheme: 'c', sound: 'k' });
  assert.deepEqual(questKindsAt('q3', 1), ['q3:pic']);
  assert.deepEqual(questKindsAt('q3', 3), ['q3:word', 'q3:look-alike']);
  assert.deepEqual(questRef(BUILTIN_QUESTS[2], { id: 'fish' }), { lessonId: 'quest-q3', activity: 'guess', itemId: 'fish' });
  const { lp, pool } = setup(ALL);
  const it = makeQ3(3, seeded(3), pool, lp)[0];
  assert.deepEqual(questSentence('q3', it), { en: it.sum, vi: it.sumVi });
  assert.match(questExplainVi('q3', it), new RegExp(`"${it.word}"`));
  for (const q of ['whatIsIt', 'startsWith']) assert.ok(translateQuestion(QUESTIONS[q]()), q);
  // Mức 3 có từ giống chữ khi kho có (cat / rat, tap / map).
  const kinds = new Set();
  for (let run = 0; run < 80; run++) for (const x of makeQ3(3, seeded(run), pool, lp)) kinds.add(x.kind);
  assert.ok(kinds.has('q3:look-alike') && kinds.has('q3:word'));
});
