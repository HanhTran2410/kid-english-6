// 📚 Truyện ngắn — phân loại từ (SPEC-story.md 3.2), bậc độ khó (3.1) và 7 truyện có sẵn (mục 9, 6.1, 8.2).
// (tests/unit/stories.test.js là câu đố Toán T12 — khác.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORD_KIND, storyTokens, classifyWord, classifySentence, readability, learnedUpTo, levelOf, levelProblems, storySentences,
} from '../../app/js/story/words.js';
import { BUILTIN_STORIES } from '../../app/js/story/builtin-stories.js';

const { DECODABLE, TRICKY, NEW } = WORD_KIND;
const kind = (word, group) => classifyWord(word, learnedUpTo(group)).kind;
const kinds = (sentence, group) => classifySentence(sentence, learnedUpTo(group)).map((t) => `${t.word}:${t.kind}`);

test('chuẩn hóa từ (3.2 bước 1–4): dấu câu, chữ hoa, gạch nối, sở hữu cách; số nhiều giữ nguyên', () => {
  assert.deepEqual(storyTokens('"Look, Sam!" The hat, dog!'), [
    { text: '"Look,', word: 'look' }, { text: 'Sam!"', word: 'sam' }, { text: 'The', word: 'the' },
    { text: 'hat,', word: 'hat' }, { text: 'dog!', word: 'dog' },
  ]);
  assert.deepEqual(storyTokens('ice-cream').map((t) => t.word), ['ice', 'cream']);
  assert.deepEqual(storyTokens("Sam's hat. The cats' den.").map((t) => t.word), ['sam', 'hat', 'the', 'cats', 'den']);
  assert.deepEqual(storyTokens('Sam — runs').map((t) => t.word), ['sam', 'runs']);
  assert.deepEqual(storyTokens('cats gets runs').map((t) => t.word), ['cats', 'gets', 'runs']);
});

test('ST-15 / 16: "hat," "dog!" như hat, dog; The và the cùng loại (tricky, gạch chân)', () => {
  assert.deepEqual(kinds('The hat, dog!', 3), ['the:tricky', 'hat:decodable', 'dog:decodable']);
  assert.equal(kind('the', 1), TRICKY);
  assert.deepEqual(kinds('the The', 1), ['the:tricky', 'the:tricky']);
});

test('thứ tự phân loại: tricky đã học trước canRead; tricky chưa học / từ không đọc theo âm luôn là từ mới', () => {
  assert.equal(kind('he', 2), TRICKY); // tách được h-e nhưng là tricky → gạch chân
  assert.equal(kind('he', 1), NEW); // chưa học nhóm 2: không đánh dấu đọc được chỉ vì chữ đã học
  assert.equal(kind('a', 1), TRICKY); // từ nhận diện nhóm 1 (SIGHT_BY_GROUP)
  assert.equal(kind('i', 1), TRICKY);
  assert.equal(kind('you', 3), NEW); // ST-17: tricky nhóm 4
  assert.equal(kind('you', 4), TRICKY);
  for (const w of ['what', 'of', 'put', 'ball', 'old', 'like', 'find', 'finds', 'kind', 'most']) assert.equal(kind(w, 7), NEW, w); // NOT_PHONETIC / NOT_DECODABLE
});

test('cách viết chưa dạy ở nhóm 1–7 là từ mới dù tách được thành chữ đơn (eat ≠ e-a-t, bike ≠ b-i-k-e)', () => {
  for (const w of ['eat', 'bike', 'cow', 'girl', 'turn', 'phone', 'when', 'know', 'write', 'saw', 'new', 'boy', 'nice', 'catch', 'happy', 'day', 'key', 'cake']) {
    assert.equal(kind(w, 7), NEW, w);
  }
  // Không chặn nhầm: grapheme đã dạy, đuôi -s, tricky đã học có e cuối / y cuối.
  for (const w of ['float', 'helps', 'lunch', 'quick', 'coin', 'park', 'tree', 'pool', 'naps', 'jogs', 'swims', 'yes', 'fox', 'queen', 'her']) {
    assert.equal(kind(w, 7), DECODABLE, w);
  }
  for (const w of ['the', 'he', 'are', 'here', 'come', 'one', 'they', 'my', 'by', 'there']) assert.equal(kind(w, 7), TRICKY, w);
});

test('decodable: tách theo bảng grapheme đầy đủ, mọi grapheme đã học; kèm cách tách', () => {
  assert.deepEqual(classifyWord('ship', learnedUpTo(6)), { kind: DECODABLE, graphemes: ['sh', 'i', 'p'] });
  assert.equal(kind('ship', 5), NEW); // sh nhóm 6
  assert.equal(kind('see', 3), NEW); // s-ee, không phải s-e-e
  assert.equal(kind('see', 4), DECODABLE);
  assert.equal(kind('duck', 3), DECODABLE); // ck nhóm 2
  assert.equal(kind('sam', 2), DECODABLE); // tên riêng như mọi từ
  assert.equal(kind('zed', 4), NEW);
});

test('readability: tỉ lệ theo lần xuất hiện, từ mới mỗi từ một lần kèm số lần gặp', () => {
  const s = { pages: [{ id: 'p1', sentences: [{ id: 's1', en: 'The wet dog. The wet hat!' }] }, { id: 'p2', sentences: [{ id: 's2', en: 'What a dog.' }] }] };
  const r = readability(s, learnedUpTo(3));
  assert.equal(r.total, 9);
  assert.equal(r.readable, 6);
  assert.deepEqual(r.newWords, [{ word: 'wet', count: 2 }, { word: 'what', count: 1 }]);
});

test('bậc độ khó (3.1): nhóm → bậc; câu dài / ngắn, câu dài thiếu chunks, đại từ sớm bị báo', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(levelOf), ['A', 'A', 'B', 'B', 'C', 'C', 'C']);
  const mk = (group, ...en) => ({ group, pages: [{ id: 'p1', sentences: en.map((x, i) => ({ id: `s${i}`, en: x })) }] });
  assert.deepEqual(levelProblems(mk(1, 'Pip is an ant.', 'It is in a tin.')), []); // "it" được ở bậc A
  assert.equal(levelProblems(mk(2, 'He is sad.')).length, 1);
  assert.equal(levelProblems(mk(4, 'They sit on the log.')).length, 1);
  assert.equal(levelProblems(mk(2, 'Pam has a red hen in a sack.')).length, 1); // 8 từ > 5
  assert.equal(levelProblems(mk(5, 'Viv is sad.')).length, 1); // 3 từ < 4
  assert.equal(levelProblems(mk(5, 'Viv and Ben swim in the big pool.')).length, 1); // 8 từ, thiếu chunks
  assert.deepEqual(levelProblems({ group: 5, pages: [{ id: 'p1', sentences: [{ id: 's', en: 'Viv and Ben swim in the big pool.', chunks: ['Viv and Ben', 'swim in the big pool.'] }] }] }), []);
});

test('truyện có sẵn: 7 truyện, nhóm 1–7, id không trùng, đủ trường 8.2, 5 trang × 1–2 câu có tiếng Việt', () => {
  assert.equal(BUILTIN_STORIES.length, 7);
  assert.deepEqual(BUILTIN_STORIES.map((s) => s.group), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(new Set(BUILTIN_STORIES.map((s) => s.id)).size, 7);
  for (const s of BUILTIN_STORIES) {
    assert.equal(s.kind, 'story');
    assert.equal(s.track, 'phonics');
    assert.match(s.id, /^story-g\d-[a-z0-9-]+$/);
    assert.ok(s.title && s.titleVi && s.cover && s.characters, s.id);
    assert.equal(s.pages.length, 5, s.id);
    const ids = [...s.pages.map((p) => p.id), ...storySentences(s).map((x) => x.id), ...s.questions.map((q) => q.id)];
    assert.equal(new Set(ids).size, ids.length, `${s.id}: id trùng`);
    for (const p of s.pages) {
      assert.ok(p.sentences.length >= 1 && p.sentences.length <= 2, `${s.id}/${p.id}`);
      assert.ok(p.emoji, `${s.id}/${p.id}: thiếu emoji trang`);
      for (const x of p.sentences) assert.ok(x.en.trim() && x.vi.trim(), `${s.id}/${x.id}`);
    }
  }
});

test('truyện có sẵn: mọi từ (cả tên truyện) đọc được ở nhóm của truyện, đúng bậc, không sở hữu cách / từ rút gọn', () => {
  for (const s of BUILTIN_STORIES) {
    const lp = learnedUpTo(s.group);
    assert.deepEqual(readability(s, lp).newWords, [], `${s.id}: từ mới`);
    assert.deepEqual(classifySentence(s.title, lp).filter((t) => t.kind === NEW).map((t) => t.word), [], `${s.id}: tên truyện`);
    assert.deepEqual(levelProblems(s), [], s.id);
    for (const x of storySentences(s)) assert.doesNotMatch(x.en, /['’]/, `${s.id}/${x.id}`);
  }
});

test('truyện có sẵn: 3 câu hỏi pick → word → order đủ trường theo bảng 6.1, hỏi 3 chi tiết khác nhau', () => {
  for (const s of BUILTIN_STORIES) {
    const lp = learnedUpTo(s.group);
    const pageIds = new Set(s.pages.map((p) => p.id));
    assert.deepEqual(s.questions.map((q) => q.type), ['pick', 'word', 'order'], s.id);
    for (const q of s.questions) {
      const where = `${s.id}/${q.id}`;
      assert.ok(q.en && q.vi && q.explainVi, where);
      if (q.type === 'order') {
        assert.equal(q.pages.length, 3, where);
        assert.equal(new Set(q.pages).size, 3, where);
        for (const p of q.pages) assert.ok(pageIds.has(p), `${where}: ${p}`);
        const at = q.pages.map((p) => s.pages.findIndex((x) => x.id === p));
        assert.deepEqual(at, [...at].sort((a, b) => a - b), `${where}: thứ tự trong mảng phải là thứ tự trong truyện`);
        continue;
      }
      assert.ok(pageIds.has(q.page), `${where}: page`);
      assert.ok(q.say, where);
      assert.ok(q.options.includes(q.answer), where);
      assert.equal(new Set(q.options).size, q.options.length, where);
      if (q.type === 'pick') {
        assert.equal(q.options.length, 3, where);
        for (const o of q.options) assert.ok(q.emoji?.[o], `${where}: lựa chọn "${o}" thiếu emoji`);
      } else {
        assert.ok(q.options.length >= 2 && q.options.length <= 3, where);
        for (const o of q.options) assert.notEqual(classifyWord(storyTokens(o)[0].word, lp).kind, NEW, `${where}: bé chưa đọc được "${o}"`);
      }
    }
    const [pick, word] = s.questions;
    assert.notEqual(pick.page, word.page, `${s.id}: pick và word cùng trang`);
    assert.notEqual(pick.answer, word.answer, s.id);
  }
});
