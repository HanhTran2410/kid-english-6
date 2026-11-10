// Tạo bài theo sách lớp 1 bằng AI, 2 bước (SPEC 5.1, 5.7): (1) prompt lấy danh sách từ / mẫu câu từ ảnh trang sách,
// bố mẹ xem và sửa; (2) prompt tạo gói bài JSON từ danh sách đó. App không tự đọc chữ trong ảnh, không gọi AI.
// `adaptForPlay`: lúc học, từ có âm chưa có file ghi âm → tạm học như tricky word (nhận diện cả từ); khi thêm file âm,
// bài cũ tự ghép âm được mà không phải tạo lại.

import { GROUPS, RECORDED_SOUNDS, learnedGraphemes } from './phonics.js';

export const BOOKS = ['Tiếng Anh 1 Global Success', 'i-Learn Smart Start 1', 'Family and Friends 1 (National Edition)'];

/** "Tiếng Anh 1 Global Success" → "tieng-anh-1-global-success" (bỏ dấu, chữ thường, gạch ngang). */
export function slug(text) {
  return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const bookLessonId = (book, unit) => `book-${slug(book) || 'sach'}-${slug(unit) || 'unit'}`;

/** Prompt bước 1: gửi kèm ảnh trang sách, AI chỉ chép lại từ + mẫu câu. */
export function wordListPrompt({ book, unit }) {
  return [
    `Đây là ảnh trang sách tiếng Anh lớp 1 (${book || 'sách tiếng Anh lớp 1'}${unit ? `, ${unit}` : ''}).`,
    'Hãy CHỈ chép lại đúng những gì có trong ảnh:',
    '1. Các từ vựng mới — mỗi dòng một từ, dạng: từ tiếng Anh - nghĩa tiếng Việt',
    '2. Các mẫu câu — mỗi dòng một câu tiếng Anh, kèm nghĩa tiếng Việt trong ngoặc',
    'Không thêm từ hay câu không có trong ảnh. Không giải thích, không dùng Markdown.',
  ].join('\n');
}

/** Bảng âm cho AI tách ô: grapheme → mã âm, theo nhóm. */
function soundTable(group) {
  const lines = GROUPS.map((g) => `- Nhóm ${g.group}: ${g.graphemes.join(' ')}${g.group <= group ? ' (bé ĐÃ học)' : ''}`);
  lines.push('- Sau nhóm 7 (split digraph): a_e i_e o_e u_e e_e — ví dụ cake = ["c","a_e","k"]');
  return lines.join('\n');
}

/**
 * Prompt bước 2: tạo gói bài JSON theo đúng cấu trúc SPEC 5.4 từ danh sách từ / mẫu câu bố mẹ đã xem lại.
 * @param {{ book: string, unit: string, unitTitle?: string, words: string, patterns?: string, group?: number }} p
 */
export function lessonPrompt({ book, unit, unitTitle = '', words, patterns = '', group = 3 }) {
  const id = bookLessonId(book, unit);
  const learned = [...learnedGraphemes(group)].join(' ');
  const example = {
    version: 1,
    kind: 'lesson',
    id,
    track: 'book',
    book,
    unit,
    title: `${unit}${unitTitle ? `: ${unitTitle}` : ''}`,
    titleVi: '…tên Unit bằng tiếng Việt…',
    words: [
      { id: 'cat', en: 'cat', vi: 'con mèo', emoji: '🐱', graphemes: ['c', 'a', 't'], sounds: ['k', 'a', 't'], explainVi: '"cat" nghĩa là con mèo.' },
      { id: 'hello', en: 'hello', vi: 'xin chào', emoji: '👋', tags: ['tricky'], explainVi: '"hello" là lời chào.' },
    ],
    sentences: [{ id: 's1', en: 'This is a cat.', vi: 'Đây là con mèo.' }],
    dialogues: [{
      id: 'd1',
      title: 'What is it?',
      titleVi: 'Đây là gì?',
      partner: { name: 'Mimi', emoji: '🐱' },
      turns: [
        { id: 't1', ask: 'What is it?', askVi: 'Đây là con gì?', answer: 'It is a cat.', answerVi: 'Đó là con mèo.', starter: 'It is a', keywords: ['cat'], emoji: '🐱', reply: 'Meow!' },
      ],
    }],
    activities: [
      { type: 'blend', items: ['cat'] },
      { type: 'tricky', items: ['hello'] },
      { type: 'spell', items: ['cat'] },
      { type: 'fill', items: ['cat'] },
      { type: 'talk', items: ['d1'] },
    ],
  };
  return [
    'Bạn soạn MỘT bài học tiếng Anh cho bé 6 tuổi (lớp 1, Việt Nam) cho app Olly English.',
    `Sách: ${book}. ${unit}${unitTitle ? ` — ${unitTitle}` : ''}.`,
    '',
    'DANH SÁCH TỪ (bố mẹ đã kiểm tra — chỉ dùng đúng các từ này, không thêm từ mới vào bài):',
    words.trim(),
    ...(patterns.trim() ? ['', 'MẪU CÂU CỦA UNIT:', patterns.trim()] : []),
    '',
    'YÊU CẦU:',
    '1. Trả về DUY NHẤT một object JSON hợp lệ đúng cấu trúc ví dụ bên dưới. Không Markdown, không giải thích.',
    `2. Giữ nguyên: "version": 1, "kind": "lesson", "id": "${id}", "track": "book", "book", "unit".`,
    '3. Mỗi từ trong danh sách là một mục trong "words": "id" = từ viết thường, khoảng trắng thay bằng "-"; "en"; "vi" (nghĩa ngắn, tự nhiên);',
    '   "emoji" (MỘT emoji thể hiện rõ nghĩa — không có emoji rõ thì bỏ trường này); "explainVi" (1 câu tiếng Việt ngắn giải thích từ cho bé).',
    '4. Tách ô chữ (Phonics kiểu Jolly): nếu từ đọc được hoàn toàn bằng các nhóm chữ trong bảng dưới thì thêm',
    '   "graphemes" (các ô, ghép lại đúng bằng từ) và "sounds" (mã âm, cùng số phần tử). Mã âm = chính grapheme, TRỪ: c, k, ck → "k";',
    '   th trong this/that/the → "th-v", th trong thin/three → "th"; oo trong moon/zoo → "oo-l", oo trong book/look → "oo".',
    '   Chữ đôi ll, ss, ff, zz là MỘT ô, mã âm là chữ đơn (vd. bell = ["b","e","ll"], sounds ["b","e","l"]).',
    '   CHỈ tách ô khi MỖI ô đọc đúng âm chuẩn của nó trong từ, và chỉ dùng các nhóm chữ có trong bảng.',
    '   Ngược lại → KHÔNG có graphemes/sounds, thêm "tags": ["tricky"]. Ví dụ tricky: one, two, the, said, hello,',
    '   ball (chữ a không đọc /a/), pencil (c đọc /s/), teacher (ea), play (ay), happy (y cuối từ), yellow (ow cuối từ).',
    soundTable(group),
    `   Bé đã học các nhóm chữ: ${learned}. Từ có nhóm chữ CHƯA học vẫn tách ô bình thường nếu đúng quy tắc.`,
    '5. "sentences": mỗi mẫu câu một mục ("id": s1, s2…; "en"; "vi"). Không có mẫu câu thì để [].',
    '6. "activities": "blend" = mọi từ có graphemes; "tricky" = các từ không có graphemes;',
    '   "spell" = tối đa 6 từ có graphemes VÀ có emoji; "fill" = tối đa 4 từ khác có graphemes và emoji (không trùng spell). Bỏ hoạt động nào rỗng.',
    '7. "title" = tên Unit bằng tiếng Anh, "titleVi" = tên Unit bằng tiếng Việt.',
    '8. "dialogues": MỘT hội thoại 3–5 lượt luyện nói theo mẫu câu của Unit, dùng từ trong danh sách. Mỗi lượt: "ask" (bạn Mimi hỏi,',
    '   ≤ 10 từ), "askVi", "answer" (câu mẫu bé trả lời, ≤ 8 từ, ngắn và tự nhiên), "answerVi", "starter" (phần đầu của "answer",',
    '   bé nói tiếp phần còn lại), "keywords" (1–3 từ chính bé phải nói; nếu có nhiều cách trả lời đúng như yes / no thì ghi cả hai),',
    '   "emoji" (hình cho câu hỏi, nếu có), "reply" (Mimi đáp lại ngắn, không bắt buộc). Câu hỏi về bé dùng {name} cho tên bé,',
    '   ví dụ "answer": "My name is {name}.". Thêm hoạt động { "type": "talk", "items": ["d1"] }.',
    '',
    'VÍ DỤ CẤU TRÚC (thay bằng nội dung thật của Unit):',
    JSON.stringify(example, null, 2),
  ].join('\n');
}

const recorded = (w) => Array.isArray(w.sounds) && w.sounds.length > 0 && w.sounds.every((s) => RECORDED_SOUNDS.has(s));

/**
 * Bài để HỌC (không đổi dữ liệu đã lưu): ô ghép âm / xếp ô / điền ô chỉ giữ từ mà mọi âm đã có file ghi âm;
 * từ bị bỏ khỏi "blend" chuyển sang "tricky" (nhận diện cả từ). Bài có sẵn (đủ file âm) giữ nguyên.
 */
export function adaptForPlay(lesson) {
  const byId = new Map(lesson.words.map((w) => [w.id, w]));
  const ok = (id) => recorded(byId.get(id) ?? {});
  const moved = [];
  const activities = [];
  for (const a of lesson.activities) {
    if (!['blend', 'spell', 'fill'].includes(a.type)) {
      activities.push(a);
      continue;
    }
    const keep = a.items.filter(ok);
    if (a.type === 'blend') moved.push(...a.items.filter((id) => !ok(id)));
    if (keep.length === a.items.length) activities.push(a);
    else if (keep.length) activities.push({ ...a, items: keep });
  }
  if (moved.length) {
    const i = activities.findIndex((a) => a.type === 'tricky');
    if (i >= 0) activities[i] = { ...activities[i], items: [...new Set([...activities[i].items, ...moved])] };
    else activities.push({ type: 'tricky', items: moved });
  }
  if (!moved.length && activities.length === lesson.activities.length && activities.every((a, i) => a === lesson.activities[i])) return lesson;
  return { ...lesson, activities };
}


/**
 * Prompt vẽ ẢNH LƯỚI (SPEC 5.6, theo cách của kid-english): 1 ảnh, mỗi ô một hình theo đúng thứ tự trái → phải,
 * trên → dưới; app cắt từng ô. `words`: [{ en, vi? }] (tối đa cols × rows).
 */
export function gridImagePrompt(words, { cols, rows }) { // words: [{ en, vi?, kind?: 'word'|'sentence' }]
  const cells = cols * rows;
  const items = words.slice(0, cells);
  const square = cols === rows ? 'square ' : '';
  const fraction = (n) => (n === 2 ? 'half' : n === 3 ? 'one third' : `1/${n}`);
  const placement = [];
  for (let r = 0; r < rows; r++) {
    placement.push('', `ROW ${r + 1}`);
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const w = items[i];
      const what = w?.kind === 'sentence' ? `a simple picture showing: "${w.en}"` : `one ${w?.en}`;
      placement.push(w
        ? `Cell ${i + 1}: ${what}${w.vi ? ` (meaning in Vietnamese: ${w.vi})` : ''}. Only this in the cell.`
        : `Cell ${i + 1}: EMPTY — completely blank, pure white, nothing inside.`);
    }
  }
  return [
    `Create ONE ${square}image containing an exact ${cols}-column × ${rows}-row grid of ${cells} equal ${square}cells. The grid fills the whole canvas; every cell is ${fraction(cols)} of the image width and ${fraction(rows)} of the image height.`,
    `Separate cells with thin, straight, light-gray divider lines: exactly ${cols - 1} vertical and ${rows - 1} horizontal, perfectly aligned. No outer border.`,
    '',
    'EXACT CELL ORDER — LEFT TO RIGHT, TOP TO BOTTOM (the cell descriptions are for you only — never write them in the image)',
    ...placement,
    '',
    'STYLE',
    "Picture-word flashcards for a 6-year-old child learning to read English. Simple, clear, colorful cartoon illustrations with clean outlines, the same style in every cell. Each subject is centered, large (about 70% of the cell) and instantly recognizable, on a plain pure-white background, never touching the divider lines.",
    '',
    'STRICT RULES',
    `- Exactly ${items.length} illustrations in the order above${cells > items.length ? '; the empty cells stay pure white' : ''}.`,
    '- One subject per cell; nothing from another cell.',
    '- No text anywhere: no letters, words, numbers, labels, captions, logos or watermarks.',
    '- Do not merge or resize cells; nothing crosses a cell boundary.',
  ].join('\n');
}
