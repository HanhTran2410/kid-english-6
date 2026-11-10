// Bài Phonics có sẵn trong app (SPEC mục 5.2): 7 nhóm âm kiểu Jolly. Khu Read: gặp âm mới → ghép âm thành từ → tricky words;
// khu Spell: nghe – xếp ô → điền ô thiếu.
// Ô chữ (grapheme) và mã âm tính bằng `toGraphemes` theo các âm đã học tới nhóm của bài — test kiểm tra mọi từ
// đọc được bằng âm đã học (decodable) và mọi âm có file ghi âm.

import { GROUPS, TRICKY_BY_GROUP, learnedGraphemes, toGraphemes, soundOfGrapheme } from '../phonics.js';
import { validateLesson } from '../lesson.js';

/** [từ, emoji (null = không có hình rõ), nghĩa tiếng Việt, mã âm riêng (khi khác mặc định: moon → oo-l)] */
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
  4: [
    ['rain', '🌧️', 'mưa'], ['snail', '🐌', 'con ốc sên'], ['jet', '✈️', 'máy bay phản lực'], ['boat', '⛵', 'con thuyền'],
    ['goat', '🐐', 'con dê'], ['tie', '👔', 'cà vạt'], ['pie', '🥧', 'bánh nướng'], ['bee', '🐝', 'con ong'],
    ['tree', '🌳', 'cái cây'], ['corn', '🌽', 'bắp ngô'],
  ],
  5: [
    ['zip', '🤐', 'khóa kéo'], ['web', '🕸️', 'mạng nhện'], ['ring', '💍', 'cái nhẫn'], ['king', '👑', 'nhà vua'],
    ['van', '🚐', 'xe tải nhỏ'], ['book', '📖', 'quyển sách'], ['foot', '🦶', 'bàn chân'],
    ['moon', '🌙', 'mặt trăng', ['m', 'oo-l', 'n']], ['swing', '🛝', 'cái xích đu'], ['wood', '🪵', 'gỗ'],
  ],
  6: [
    ['fox', '🦊', 'con cáo'], ['box', '📦', 'cái hộp'], ['six', '6️⃣', 'số sáu'], ['chick', '🐥', 'gà con'],
    ['chips', '🍟', 'khoai tây chiên'], ['ship', '🚢', 'con tàu'], ['fish', '🐟', 'con cá'], ['shop', '🏪', 'cửa hàng'],
    ['bath', '🛁', 'bồn tắm'], ['three', '3️⃣', 'số ba'],
  ],
  7: [
    ['queen', '👸', 'nữ hoàng'], ['cloud', '☁️', 'đám mây'], ['mouth', '👄', 'cái miệng'], ['coin', '🪙', 'đồng xu'],
    ['star', '⭐', 'ngôi sao'], ['car', '🚗', 'ô tô'], ['shark', '🦈', 'cá mập'], ['farm', '🚜', 'nông trại'],
    ['hammer', '🔨', 'cái búa'], ['sister', '👧', 'chị / em gái'],
  ],
};

const TRICKY_VI = {
  I: 'tôi, mình', the: '(đứng trước danh từ, không dịch)', he: 'anh ấy, bạn trai ấy', she: 'cô ấy, bạn gái ấy',
  me: 'tôi, mình (sau động từ)', we: 'chúng mình', be: 'là, thì', was: 'đã là', to: 'đến, tới', do: 'làm',
  are: 'là (số nhiều)', all: 'tất cả', you: 'bạn', your: 'của bạn', come: 'đến', some: 'một vài', said: 'đã nói', here: 'ở đây',
  there: 'ở đó', they: 'họ, các bạn ấy', go: 'đi', no: 'không', so: 'vì vậy, rất', my: 'của mình', one: 'số một', by: 'bởi, cạnh',
};

function lessonFor(group) {
  const g = GROUPS[group - 1];
  const learned = learnedGraphemes(group);
  const words = WORDS[group].map(([en, emoji, vi, sounds]) => {
    const graphemes = toGraphemes(en, learned);
    return { id: en, en, graphemes, sounds: sounds ?? graphemes.map(soundOfGrapheme), tags: [group <= 3 ? 'cvc' : 'phonics'], vi, emoji };
  });
  const pictured = words.filter((w) => w.emoji);
  const spellCount = Math.min(6, pictured.length - 2);
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
      // Khu Spell (SPEC 3.2): xếp ô tối đa 6 từ có hình (chừa ≥ 2 từ), điền ô thiếu các từ có hình còn lại (tối đa 4).
      { type: 'spell', items: pictured.slice(0, spellCount).map((w) => w.id) },
      { type: 'fill', items: pictured.slice(spellCount, spellCount + 4).map((w) => w.id) },
    ],
  };
}

/** Các bài có sẵn đã qua kiểm tra (builtIn: true). */
export const BUILTIN_LESSONS = [1, 2, 3, 4, 5, 6, 7].map((group) => {
  const r = validateLesson(lessonFor(group), { builtIn: true });
  if (!r.ok) throw new Error(`Bài có sẵn nhóm ${group} lỗi: ${r.errors.join('; ')}`);
  return r.lesson;
});

export const BUILTIN_BY_ID = new Map(BUILTIN_LESSONS.map((l) => [l.id, l]));
