// Bài Phonics có sẵn trong app (SPEC mục 5.2): nhóm âm 1–3 kiểu Jolly. Mỗi bài: gặp âm mới → ghép âm thành từ → tricky words.
// Ô chữ (grapheme) và mã âm tính bằng `toGraphemes` theo các âm đã học tới nhóm của bài — test kiểm tra mọi từ
// đọc được bằng âm đã học (decodable) và mọi âm có file ghi âm.

import { GROUPS, TRICKY_BY_GROUP, learnedGraphemes, toGraphemes, soundOfGrapheme } from '../phonics.js';
import { validateLesson } from '../lesson.js';

/** [từ, emoji (null = không có hình rõ), nghĩa tiếng Việt] */
const WORDS = {
  1: [
    ['at', null, 'ở, tại'], ['it', null, 'nó'], ['sat', null, 'đã ngồi'],
    ['ant', '🐜', 'con kiến'], ['pin', '📌', 'cái ghim'], ['pan', '🍳', 'cái chảo'], ['tap', '🚰', 'vòi nước'],
    ['nap', '😴', 'giấc ngủ ngắn'], ['sit', '🪑', 'ngồi'], ['tin', '🥫', 'hộp thiếc'],
  ],
  2: [
    ['cat', '🐱', 'con mèo'], ['hat', '🎩', 'cái mũ'], ['map', '🗺️', 'bản đồ'], ['pen', '🖊️', 'cái bút'],
    ['hen', '🐔', 'con gà mái'], ['net', '🥅', 'cái lưới'], ['ten', '🔟', 'số mười'], ['red', '🔴', 'màu đỏ'],
    ['rat', '🐀', 'con chuột'], ['man', '👨', 'người đàn ông'],
  ],
  3: [
    ['dog', '🐶', 'con chó'], ['pig', '🐷', 'con lợn'], ['bag', '👜', 'cái túi'], ['bus', '🚌', 'xe buýt'],
    ['sun', '☀️', 'mặt trời'], ['cup', '☕', 'cái cốc'], ['bed', '🛏️', 'cái giường'], ['leg', '🦵', 'cái chân'],
    ['bug', '🐛', 'con sâu'], ['frog', '🐸', 'con ếch'],
  ],
};

const TRICKY_VI = {
  I: 'tôi, mình', the: '(đứng trước danh từ, không dịch)', he: 'anh ấy, bạn trai ấy', she: 'cô ấy, bạn gái ấy',
  me: 'tôi, mình (sau động từ)', we: 'chúng mình', be: 'là, thì', was: 'đã là', to: 'đến, tới', do: 'làm',
};

function lessonFor(group) {
  const g = GROUPS[group - 1];
  const learned = learnedGraphemes(group);
  const words = WORDS[group].map(([en, emoji, vi]) => {
    const graphemes = toGraphemes(en, learned);
    return { id: en, en, graphemes, sounds: graphemes.map(soundOfGrapheme), tags: ['cvc'], vi, emoji };
  });
  const tricky = TRICKY_BY_GROUP[group].map((en) => ({
    id: `tricky-${en.toLowerCase()}`, en, tags: ['tricky'], vi: TRICKY_VI[en],
    explainVi: `Từ "${en}" là từ cần nhớ mặt chữ (không đọc theo âm được).`,
  }));
  return {
    version: 1,
    kind: 'lesson',
    id: `phonics-g${group}`,
    track: 'phonics',
    group,
    title: `Sounds ${g.graphemes.filter((x) => x !== 'ck').join(' ')}`,
    titleVi: `Nhóm âm ${group}: ${g.graphemes.join(' ')}`,
    newSounds: g.sounds,
    words: [...words, ...tricky],
    activities: [
      { type: 'sounds', sounds: g.sounds },
      { type: 'blend', items: words.map((w) => w.id) },
      { type: 'tricky', items: tricky.map((w) => w.id) },
    ],
  };
}

/** Các bài có sẵn đã qua kiểm tra (builtIn: true). */
export const BUILTIN_LESSONS = [1, 2, 3].map((group) => {
  const r = validateLesson(lessonFor(group), { builtIn: true });
  if (!r.ok) throw new Error(`Bài có sẵn nhóm ${group} lỗi: ${r.errors.join('; ')}`);
  return r.lesson;
});

export const BUILTIN_BY_ID = new Map(BUILTIN_LESSONS.map((l) => [l.id, l]));
