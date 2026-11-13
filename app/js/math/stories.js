// 📖 T12 Story sums — câu đố viết sẵn (SPEC-math2.md 3.5). Phép tính và đáp án **suy ra** từ dữ liệu câu chuyện
// (owner được thêm hay mất), không đọc từ chữ; `hint` chỉ là cụm Olly chỉ ra khi bé chọn sai dấu.
// Bảng duyệt: node scripts/stories-sheet.mjs → MATH-STORIES.md.

import { T7_THINGS } from './math.js';

/** Loại câu "từ khóa đánh lừa" (chỉ mức 3). */
export const TRICKS = {
  'gives-in': 'gives giữa hai người có tên — owner là người nhận',
  'gives-out': 'gives giữa hai người có tên — owner là người cho',
  'more-sub': 'có chữ more nhưng là phép trừ',
  'add-plain': 'phép cộng không có more / altogether',
};

const S = (id, owner, thing, start, change, direction, text, vi, hint, hintVi, trick = null) =>
  ({ id, owner, thing, start, change, direction, target: 'result', text, vi, hint, hintVi, trick });

export const STORIES = [
  // ---- Cộng ----
  S('s01', 'Tom', 'apples', 2, 3, 'increase',
    'Tom has 2 apples. Anna gives him 3 more. How many apples does Tom have now?',
    'Tom có 2 quả táo. Anna cho Tom thêm 3 quả. Bây giờ Tom có bao nhiêu quả táo?',
    'Anna gives him 3 more', 'Anna cho Tom thêm 3 quả'),
  S('s02', 'Anna', 'balls', 3, 2, 'increase',
    'Anna has 3 balls. Dad gives her 2 balls. How many balls does Anna have now?',
    'Anna có 3 quả bóng. Bố cho Anna 2 quả bóng. Bây giờ Anna có bao nhiêu quả bóng?',
    'Dad gives her 2 balls', 'Bố cho Anna 2 quả bóng'),
  S('s03', 'pond', 'ducks', 2, 2, 'increase',
    'There are 2 ducks in the pond. 2 more ducks arrive. How many ducks are in the pond now?',
    'Có 2 con vịt trong ao. Thêm 2 con vịt nữa đến. Bây giờ trong ao có bao nhiêu con vịt?',
    '2 more ducks arrive', 'thêm 2 con vịt nữa đến'),
  S('s04', 'Anna', 'stars', 3, 2, 'increase',
    'Anna has 3 stars. She gets 2 stars from her teacher. How many stars does Anna have now?',
    'Anna có 3 ngôi sao. Cô giáo cho Anna thêm 2 ngôi sao. Bây giờ Anna có bao nhiêu ngôi sao?',
    'She gets 2 stars', 'Anna được thêm 2 ngôi sao'),
  S('s05', 'Mum', 'cookies', 4, 4, 'increase',
    'Mum has 4 cookies. She bakes 4 more cookies. How many cookies does Mum have now?',
    'Mẹ có 4 cái bánh quy. Mẹ nướng thêm 4 cái nữa. Bây giờ mẹ có bao nhiêu cái bánh quy?',
    'She bakes 4 more cookies', 'mẹ nướng thêm 4 cái nữa'),
  S('s06', 'Grandpa', 'flowers', 5, 3, 'increase',
    'Grandpa has 5 flowers. Grandma gives him 3 flowers. How many flowers does Grandpa have now?',
    'Ông có 5 bông hoa. Bà cho ông 3 bông hoa. Bây giờ ông có bao nhiêu bông hoa?',
    'Grandma gives him 3 flowers', 'bà cho ông 3 bông hoa'),
  S('s07', 'Tom', 'cars', 6, 3, 'increase',
    'Tom has 6 toy cars. He gets 3 more toy cars for his birthday. How many toy cars does Tom have now?',
    'Tom có 6 chiếc ô tô đồ chơi. Sinh nhật Tom được tặng thêm 3 chiếc. Bây giờ Tom có bao nhiêu chiếc ô tô đồ chơi?',
    'He gets 3 more toy cars', 'Tom được tặng thêm 3 chiếc'),
  S('s08', 'tank', 'fish', 7, 3, 'increase',
    'There are 7 fish in the tank. Dad puts in 3 fish. How many fish are in the tank now?',
    'Có 7 con cá trong bể. Bố thả thêm 3 con cá. Bây giờ trong bể có bao nhiêu con cá?',
    'Dad puts in 3 fish', 'bố thả thêm 3 con cá'),
  // Cộng — đánh lừa
  S('s09', 'Mum', 'cookies', 4, 2, 'increase',
    'Mum bakes 4 cookies. Then she bakes 2 cookies. How many cookies does Mum bake?',
    'Mẹ nướng 4 cái bánh quy. Sau đó mẹ nướng 2 cái nữa. Mẹ nướng tất cả bao nhiêu cái bánh quy?',
    'Then she bakes 2 cookies', 'sau đó mẹ nướng 2 cái nữa', 'add-plain'),
  S('s10', 'Tom', 'books', 3, 4, 'increase',
    'Tom reads 3 books on Monday. He reads 4 books on Tuesday. How many books does Tom read?',
    'Thứ Hai Tom đọc 3 quyển sách. Thứ Ba Tom đọc 4 quyển. Tom đọc tất cả bao nhiêu quyển sách?',
    'He reads 4 books on Tuesday', 'thứ Ba Tom đọc thêm 4 quyển', 'add-plain'),
  S('s11', 'Tom', 'sweets', 5, 3, 'increase',
    'Tom has 5 sweets. Anna gives Tom 3 sweets. How many sweets does Tom have now?',
    'Tom có 5 cái kẹo. Anna cho Tom 3 cái kẹo. Bây giờ Tom có bao nhiêu cái kẹo?',
    'Anna gives Tom 3 sweets', 'Anna cho Tom 3 cái kẹo', 'gives-in'),
  S('s12', 'Grandma', 'balls', 3, 4, 'increase',
    'Grandma has 3 balls. Grandpa gives Grandma 4 balls. How many balls does Grandma have now?',
    'Bà có 3 quả bóng. Ông cho bà 4 quả bóng. Bây giờ bà có bao nhiêu quả bóng?',
    'Grandpa gives Grandma 4 balls', 'ông cho bà 4 quả bóng', 'gives-in'),

  // ---- Trừ ----
  S('s13', 'Tom', 'apples', 5, 2, 'decrease',
    'Tom has 5 apples. He eats 2 apples. How many apples does Tom have now?',
    'Tom có 5 quả táo. Tom ăn 2 quả. Bây giờ Tom có bao nhiêu quả táo?',
    'He eats 2 apples', 'Tom ăn 2 quả'),
  S('s14', 'pond', 'ducks', 4, 3, 'decrease',
    'There are 4 ducks in the pond. 3 ducks swim away. How many ducks are in the pond now?',
    'Có 4 con vịt trong ao. 3 con bơi đi mất. Bây giờ trong ao có bao nhiêu con vịt?',
    '3 ducks swim away', '3 con vịt bơi đi mất'),
  S('s15', 'Anna', 'flowers', 5, 2, 'decrease',
    'Anna has 5 flowers. She gives 2 flowers to Mum. How many flowers does Anna have now?',
    'Anna có 5 bông hoa. Anna tặng mẹ 2 bông. Bây giờ Anna có bao nhiêu bông hoa?',
    'She gives 2 flowers to Mum', 'Anna tặng mẹ 2 bông'),
  S('s16', 'Grandpa', 'books', 5, 2, 'decrease',
    'Grandpa has 5 books. He gives 2 books to Anna. How many books does Grandpa have now?',
    'Ông có 5 quyển sách. Ông cho Anna 2 quyển. Bây giờ ông có bao nhiêu quyển sách?',
    'He gives 2 books to Anna', 'ông cho Anna 2 quyển'),
  S('s17', 'Mum', 'cookies', 10, 6, 'decrease',
    'Mum has 10 cookies. The children eat 6 cookies. How many cookies does Mum have now?',
    'Mẹ có 10 cái bánh quy. Các bạn nhỏ ăn 6 cái. Bây giờ mẹ còn bao nhiêu cái bánh quy?',
    'The children eat 6 cookies', 'các bạn nhỏ ăn 6 cái'),
  S('s18', 'sky', 'stars', 8, 3, 'decrease',
    'There are 8 stars in the sky. 3 stars go behind a cloud. How many stars can we see in the sky now?',
    'Trên trời có 8 ngôi sao. 3 ngôi sao bị mây che. Bây giờ chúng ta nhìn thấy bao nhiêu ngôi sao trên trời?',
    '3 stars go behind a cloud', '3 ngôi sao bị mây che'),
  S('s19', 'Dad', 'balls', 9, 5, 'decrease',
    'Dad has 9 balls. 5 balls roll away. How many balls does Dad have now?',
    'Bố có 9 quả bóng. 5 quả lăn đi mất. Bây giờ bố còn bao nhiêu quả bóng?',
    '5 balls roll away', '5 quả bóng lăn đi mất'),
  S('s20', 'Anna', 'cars', 6, 2, 'decrease',
    'Anna has 6 cars. She loses 2 cars in the park. How many cars does Anna have now?',
    'Anna có 6 chiếc ô tô. Anna làm mất 2 chiếc ở công viên. Bây giờ Anna có bao nhiêu chiếc ô tô?',
    'She loses 2 cars', 'Anna làm mất 2 chiếc'),
  // Trừ — đánh lừa
  S('s21', 'Tom', 'sweets', 8, 3, 'decrease',
    'Tom has 8 sweets. Tom gives Anna 3 sweets. How many sweets does Tom have now?',
    'Tom có 8 cái kẹo. Tom cho Anna 3 cái kẹo. Bây giờ Tom có bao nhiêu cái kẹo?',
    'Tom gives Anna 3 sweets', 'Tom cho Anna 3 cái kẹo', 'gives-out'),
  S('s22', 'Grandma', 'balls', 7, 4, 'decrease',
    'Grandma has 7 balls. Grandma gives Grandpa 4 balls. How many balls does Grandma have now?',
    'Bà có 7 quả bóng. Bà cho ông 4 quả bóng. Bây giờ bà có bao nhiêu quả bóng?',
    'Grandma gives Grandpa 4 balls', 'bà cho ông 4 quả bóng', 'gives-out'),
  S('s23', 'Mum', 'sweets', 9, 4, 'decrease',
    'Mum has 9 sweets. Tom wants more sweets, so Mum gives him 4 sweets. How many sweets does Mum have now?',
    'Mẹ có 9 cái kẹo. Tom muốn thêm kẹo nên mẹ cho Tom 4 cái kẹo. Bây giờ mẹ có bao nhiêu cái kẹo?',
    'Mum gives him 4 sweets', 'mẹ cho Tom 4 cái kẹo', 'more-sub'),
  S('s24', 'tank', 'fish', 10, 4, 'decrease',
    'There are 10 fish in the tank. Dad wants more fish in the pond, so he takes 4 fish out of the tank. How many fish are in the tank now?',
    'Có 10 con cá trong bể. Bố muốn có thêm cá ở ao nên lấy 4 con cá ra khỏi bể. Bây giờ trong bể có bao nhiêu con cá?',
    'he takes 4 fish out of the tank', 'bố lấy 4 con cá ra khỏi bể', 'more-sub'),
];

export const STORY_BY_ID = new Map(STORIES.map((s) => [s.id, s]));

/** Phép tính suy từ hướng thay đổi của owner. */
export function storyMath(s) {
  const op = s.direction === 'increase' ? '+' : '−';
  return { op, a: s.start, b: s.change, answer: op === '+' ? s.start + s.change : s.start - s.change };
}

/** Chỗ (không phải người): câu hỏi gợi ý dùng "Are there … in the …?". */
export const STORY_PLACES = { pond: ['in the pond', 'trong ao'], tank: ['in the tank', 'trong bể'], sky: ['in the sky', 'trên trời'] };
const OWNER_VI = { Tom: 'Tom', Anna: 'Anna', Dad: 'bố', Mum: 'mẹ', Grandpa: 'ông', Grandma: 'bà' };

/** Câu không hợp mẫu chung: hỏi theo đúng việc trong câu chuyện. */
const ASK_OVERRIDE = {
  s07: ['Does Tom have more or fewer toy cars now?', 'Bây giờ Tom có nhiều ô tô đồ chơi hơn hay ít hơn?'],
  s09: ['Are there more or fewer cookies now?', 'Bây giờ bánh quy nhiều hơn hay ít hơn?'],
  s10: ['Has Tom read more or fewer books now?', 'Bây giờ số sách Tom đã đọc nhiều hơn hay ít hơn?'],
  s18: ['Can we see more or fewer stars now?', 'Bây giờ mình nhìn thấy nhiều sao hơn hay ít sao hơn?'],
};

/** Câu Olly hỏi sau khi chọn sai dấu lần 1 (theo owner và đồ vật, không dùng một mẫu máy móc). */
export function storyAsk(s) {
  if (ASK_OVERRIDE[s.id]) return { en: ASK_OVERRIDE[s.id][0], vi: ASK_OVERRIDE[s.id][1] };
  const place = STORY_PLACES[s.owner];
  const n = T7_THINGS[s.thing].vi.split(' ').slice(1).join(' '); // "quả táo" → "táo"
  if (place) return { en: `Are there more or fewer ${s.thing} ${place[0]} now?`, vi: `Bây giờ ${place[1]} có nhiều ${n} hơn hay ít ${n} hơn?` };
  return { en: `Does ${s.owner} have more or fewer ${s.thing} now?`, vi: `Bây giờ ${OWNER_VI[s.owner]} có nhiều ${n} hơn hay ít ${n} hơn?` };
}

/** Mức thấp nhất dùng được: số ≤ 5 (cả kết quả) → mức 1; câu đánh lừa → mức 3; còn lại mức 2. */
export function storyLevel(s) {
  if (s.trick) return 3;
  const { answer } = storyMath(s);
  return Math.max(s.start, s.change, answer) <= 5 ? 1 : 2;
}

/** Lỗi dữ liệu của một câu đố (rỗng = hợp lệ) — SPEC-math2 3.5, MATH-13. */
export function storyProblems(s) {
  const out = [];
  const nums = (s.text.match(/\d+/g) ?? []).map(Number);
  if (nums.join() !== [s.start, s.change].join()) out.push(`số trong câu ${nums.join(', ')} ≠ start ${s.start}, change ${s.change}`);
  const viNums = (s.vi.match(/\d+/g) ?? []).map(Number);
  if (viNums.join() !== [s.start, s.change].join()) out.push(`số trong câu tiếng Việt ${viNums.join(', ')} khác`);
  if (!s.text.includes(s.hint)) out.push(`hint "${s.hint}" không có trong câu`);
  // Đúng vai trò, không chỉ đúng thứ tự: câu đầu nói owner có `start`, cụm hành động (hint) chứa `change`.
  const first = s.text.split(/(?<=[.?!])\s+/)[0];
  const numsIn = (t) => (t.match(/\d+/g) ?? []).map(Number).join();
  if (numsIn(first) !== String(s.start) || !first.includes(s.owner)) out.push(`câu đầu "${first}" không nói ${s.owner} có ${s.start}`);
  if (numsIn(s.hint) !== String(s.change)) out.push(`hint "${s.hint}" không chứa đúng số thay đổi ${s.change}`);
  if (numsIn(s.hintVi) !== String(s.change)) out.push(`hintVi "${s.hintVi}" không chứa đúng số thay đổi ${s.change}`);
  if (s.direction === 'decrease' && s.change > s.start) out.push('trừ: change > start');
  const question = s.text.split(/(?<=[.?!])\s+/).pop();
  if (!question.endsWith('?')) out.push('câu cuối không phải câu hỏi');
  if (!question.includes(s.owner)) out.push(`câu hỏi không nhắc ${s.owner}`);
  if (!question.includes(s.thing)) out.push(`câu hỏi không nhắc ${s.thing}`);
  if (!['increase', 'decrease'].includes(s.direction)) out.push('direction sai');
  const { answer } = storyMath(s);
  if (answer < 0 || answer > 10) out.push(`đáp án ${answer} ngoài 0–10`);
  if (s.start < 2 || s.change < 2) out.push('số < 2 (danh từ số nhiều)');
  if (s.trick && !TRICKS[s.trick]) out.push(`trick ${s.trick} lạ`);
  return out;
}
