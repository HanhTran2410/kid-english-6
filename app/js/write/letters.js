// ✍️ Tập viết (SPEC-write.md mục 6–7): dữ liệu chữ mẫu theo "đơn vị chữ" (dòng trên y = 0, dòng giữa 50, dòng chân
// 100, dòng dưới 150). Mỗi chữ = danh sách nét theo thứ tự viết; mỗi nét = các đoạn nối liền theo chiều viết:
//   ['line', x1, y1, x2, y2] · ['arc', cx, cy, rx, ry, from, to] (độ; 90 = phía dưới; to < from = ngược chiều kim
//   đồng hồ trên màn) · ['bez', x1, y1, c1x, c1y, c2x, c2y, x2, y2] · ['dot', x, y] (một mình một nét).
// Bản 0.7.0 (prototype, mục 13): 8 chữ c a d l t m g z — đủ các kiểu nét. 18 chữ còn lại ở 0.7.1.

/** Bụng tròn dùng chung cho a, d, g (q ở 0.7.1): như chữ c, hở bên phải từ 4 giờ tới 2 giờ. */
const BOWL = [['arc', 25, 75, 22, 25, -30, -330]];
const BOWL_VI = 'Nét 1 viết như chữ c: bắt đầu ở chấm xanh (2 giờ), vòng sang trái lên trên, xuống dưới rồi dừng.';

/**
 * Chữ: `width` (đơn vị chữ), `group`, `sound` (âm rời đã có file, SPEC 3.1.1), `strokes`, `say` (Olly nói ở bước A
 * và khi bấm 🔊), `vi` (nút ❓), `strokeVi` (từng nét — đọc khi sai 2 lần nét đó).
 */
export const LETTERS = {
  c: {
    width: 50, group: 'curly', sound: 'k',
    strokes: [[['arc', 27, 75, 23, 25, -30, -330]]],
    say: 'Start at the dot. Curve round and stop.',
    vi: 'Bắt đầu ở chấm xanh bên phải, vòng sang trái, xuống dưới rồi dừng — như cái miệng mở.',
    strokeVi: ['Bắt đầu ở chấm xanh (2 giờ), vòng sang trái lên trên, xuống dưới rồi dừng ở 4 giờ. Không vòng kín.'],
  },
  a: {
    width: 52, group: 'curly', sound: 'a',
    strokes: [BOWL, [['line', 47, 50, 47, 100]]],
    say: 'Round like a c, then up and down.',
    vi: 'Viết chữ c trước, rồi viết nét thẳng bên phải từ trên xuống.',
    strokeVi: [BOWL_VI, 'Nét thẳng bắt đầu ở dòng giữa, sát bên phải bụng chữ, kéo thẳng xuống.'],
  },
  d: {
    width: 52, group: 'curly', sound: 'd',
    strokes: [BOWL, [['line', 47, 0, 47, 100]]],
    say: 'Round like a c, then a tall line down.',
    vi: 'Viết chữ c, rồi nét thẳng cao bên phải, bắt đầu từ dòng trên cùng.',
    strokeVi: [BOWL_VI, 'Nét thẳng cao bắt đầu ở dòng trên cùng, sát bên phải bụng chữ, kéo thẳng xuống dòng chân.'],
  },
  g: {
    width: 52, group: 'curly', sound: 'g',
    strokes: [BOWL, [['line', 47, 50, 47, 130], ['bez', 47, 130, 47, 152, 14, 152, 6, 136]]],
    say: 'Round like a c, then down and hook.',
    vi: 'Viết chữ c, rồi nét thẳng bên phải đi xuống dưới dòng kẻ, cuối nét móc sang trái.',
    strokeVi: [BOWL_VI, 'Nét thẳng bắt đầu ở dòng giữa, sát bên phải bụng, kéo xuống dưới dòng chân rồi móc sang trái.'],
  },
  l: {
    width: 20, group: 'ladder', sound: 'l',
    strokes: [[['line', 10, 0, 10, 100]]],
    say: 'Start at the top. Straight down.',
    vi: 'Từ dòng trên cùng kéo thẳng xuống dòng chân.',
    strokeVi: ['Bắt đầu ở dòng trên cùng, kéo thẳng xuống tới dòng chân đậm.'],
  },
  t: {
    width: 32, group: 'ladder', sound: 't',
    strokes: [[['line', 14, 18, 14, 100]], [['line', 2, 50, 30, 50]]],
    say: 'Down, then across.',
    vi: 'Kéo thẳng xuống trước, rồi kẻ ngang ở dòng giữa.',
    strokeVi: ['Nét thẳng bắt đầu hơi thấp hơn dòng trên cùng, kéo thẳng xuống dòng chân.', 'Nét ngang ở dòng giữa, kẻ từ trái sang phải, cắt qua nét thẳng.'],
  },
  m: {
    width: 70, group: 'robot', sound: 'm',
    strokes: [[
      ['line', 6, 50, 6, 100], ['line', 6, 100, 6, 66], ['bez', 6, 66, 8, 50, 32, 46, 35, 64], ['line', 35, 64, 35, 100],
      ['line', 35, 100, 35, 66], ['bez', 35, 66, 37, 50, 62, 46, 64, 64], ['line', 64, 64, 64, 100],
    ]],
    say: 'Down, up, over, down. Up, over, down.',
    vi: 'Kéo xuống, đi ngược lên, vòng xuống; đi ngược lên lần nữa, vòng xuống — hai cái cầu.',
    strokeVi: ['Một nét liền, không nhấc tay: kéo xuống, đi ngược lên đúng đường cũ, vòng cầu thứ nhất xuống; lại đi ngược lên, vòng cầu thứ hai xuống.'],
  },
  z: {
    width: 46, group: 'zigzag', sound: 'z',
    strokes: [[['line', 4, 50, 42, 50]], [['line', 42, 50, 4, 100]], [['line', 4, 100, 42, 100]]],
    say: 'Across, slant down, across.',
    vi: 'Kẻ ngang, xiên xuống trái, rồi kẻ ngang dưới cùng.',
    strokeVi: ['Kẻ ngang ở dòng giữa, từ trái sang phải.', 'Từ đầu bên phải nét ngang, xiên xuống sang trái tới dòng chân.', 'Kẻ ngang ở dòng chân, từ trái sang phải.'],
  },
};

/** 4 nhóm hình nét (mục 2.1) — chỉ để xếp lưới; `letters` là thứ tự học đủ 26 chữ, lưới chỉ hiện chữ đã có dữ liệu. */
export const WRITE_GROUPS = [
  { id: 'curly', emoji: '🐛', en: 'Curly letters', vi: 'Chữ cong', letters: ['c', 'a', 'd', 'o', 'g', 'q', 'e', 's', 'f'] },
  { id: 'ladder', emoji: '🪜', en: 'Ladder letters', vi: 'Chữ có nét thẳng', letters: ['l', 'i', 't', 'j', 'u', 'y'] },
  { id: 'robot', emoji: '🤖', en: 'Robot letters', vi: 'Xuống rồi vòng lên', letters: ['r', 'n', 'm', 'h', 'b', 'p', 'k'] },
  { id: 'zigzag', emoji: '⚡', en: 'Zig-zag letters', vi: 'Ziczac', letters: ['v', 'w', 'x', 'z'] },
];

/** Thứ tự chữ trên lưới (theo nhóm), chỉ chữ đã có dữ liệu. */
export const LETTER_ORDER = WRITE_GROUPS.flatMap((g) => g.letters).filter((l) => LETTERS[l]);

/** Câu Olly nói khi chấm nét (mục 5.5) + câu chuyển lượt (mục 4) — có dịch cho phụ đề. */
export const WRITE_LINES = {
  start: 'Start at the green dot!',
  reverse: 'Follow the arrow!',
  stray: 'Try again. Follow the line.',
  lifted: 'Keep going without lifting!',
  dot: 'Just tap the dot!',
  again: 'Good! Again!',
  yourTurn: 'Now you try!',
  theDot: 'Now the dot!',
};
