// ✍️ Tập viết (SPEC-write.md mục 6–7): dữ liệu chữ mẫu theo "đơn vị chữ" (dòng trên y = 0, dòng giữa 50, dòng chân
// 100, dòng dưới 150). Mỗi chữ = danh sách nét theo thứ tự viết; mỗi nét = các đoạn nối liền theo chiều viết:
//   ['line', x1, y1, x2, y2] · ['arc', cx, cy, rx, ry, from, to] (độ; 90 = phía dưới; to < from = ngược chiều kim
//   đồng hồ trên màn) · ['bez', x1, y1, c1x, c1y, c2x, c2y, x2, y2] · ['dot', x, y] (một mình một nét).
// 0.7.0: 8 chữ prototype c a d l t m g z; 0.7.1: đủ 26 chữ (tọa độ theo bảng 6.4).

/** Bụng tròn dùng chung cho a, d, g, q: như chữ c, hở bên phải từ 4 giờ tới 2 giờ. */
const BOWL = [['arc', 25, 75, 22, 25, -30, -330]];
const BOWL_VI = 'Nét 1 viết như chữ c: bắt đầu ở chấm xanh (2 giờ), vòng sang trái lên trên, xuống dưới rồi dừng.';
/** Thân xuống – đi ngược lên – vòm (r, n, h): dùng chung đoạn vòm sang phải. */
const ARCH = [['bez', 6, 66, 8, 50, 40, 46, 42, 64], ['line', 42, 64, 42, 100]];
/** Bụng xuôi chiều kim đồng hồ của b, p: từ thân (6,75) vòng lên, sang phải, xuống, khép về thân. */
const TUMMY = ['arc', 27, 75, 21, 25, 180, 540];
const DOT_VI = 'Chạm một cái vào chấm xanh phía trên, không kéo.';

/**
 * Chữ: `width` (đơn vị chữ), `group`, `sound` (âm rời đã có file, SPEC 3.1.1), `soundSay` (câu trước âm, mặc định
 * "x says"), `strokes`, `say` (Olly nói ở bước A và khi bấm 🔊), `vi` (nút ❓), `strokeVi` (từng nét — đọc khi sai 2
 * lần nét đó).
 */
export const LETTERS = {
  // 🐛 Chữ cong
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
  o: {
    width: 50, group: 'curly', sound: 'o',
    strokes: [[['arc', 25, 75, 22, 25, -30, -390]]],
    say: 'Round like a c, and close it.',
    vi: 'Như chữ c nhưng vòng tiếp cho khép kín, về đúng chỗ bắt đầu.',
    strokeVi: ['Bắt đầu ở chấm xanh (2 giờ), vòng sang trái lên trên, xuống dưới, rồi đi tiếp lên cho khép kín về chỗ bắt đầu.'],
  },
  g: {
    width: 52, group: 'curly', sound: 'g',
    strokes: [BOWL, [['line', 47, 50, 47, 130], ['bez', 47, 130, 47, 152, 14, 152, 6, 136]]],
    say: 'Round like a c, then down and hook.',
    vi: 'Viết chữ c, rồi nét thẳng bên phải đi xuống dưới dòng kẻ, cuối nét móc sang trái.',
    strokeVi: [BOWL_VI, 'Nét thẳng bắt đầu ở dòng giữa, sát bên phải bụng, kéo xuống dưới dòng chân rồi móc sang trái.'],
  },
  q: {
    width: 52, group: 'curly', sound: 'qu', soundSay: 'q and u say',
    strokes: [BOWL, [['line', 47, 50, 47, 150]]],
    say: 'Round like a c, then straight down.',
    vi: 'Viết chữ c, rồi nét thẳng bên phải đi thẳng xuống dưới dòng kẻ.',
    strokeVi: [BOWL_VI, 'Nét thẳng bắt đầu ở dòng giữa, sát bên phải bụng, kéo thẳng xuống tận dòng dưới cùng, không móc.'],
  },
  e: {
    width: 54, group: 'curly', sound: 'e',
    strokes: [[['line', 4, 75, 50, 75], ['arc', 27, 75, 23, 25, 0, -315]]],
    say: 'Across, then round like a c.',
    vi: 'Kẻ ngang ở giữa từ trái sang phải, rồi vòng lên trên, sang trái, xuống dưới.',
    strokeVi: ['Một nét liền: kẻ ngang ở giữa từ trái sang phải, không nhấc tay, vòng lên trên, sang trái, xuống dưới rồi dừng.'],
  },
  s: {
    width: 44, group: 'curly', sound: 's',
    strokes: [[['bez', 40, 56, 32, 46, 6, 50, 8, 62], ['bez', 8, 62, 10, 72, 38, 74, 40, 86], ['bez', 40, 86, 42, 100, 12, 104, 4, 94]]],
    say: 'Start at the dot. Curve back, then curve forward.',
    vi: 'Bắt đầu ở chấm xanh, cong sang trái, rồi cong sang phải, như con rắn.',
    strokeVi: ['Bắt đầu ở chấm xanh bên phải, cong sang trái, đi chéo xuống giữa, rồi cong sang phải và vòng về bên trái ở dưới.'],
  },
  f: {
    width: 40, group: 'curly', sound: 'f',
    strokes: [[['bez', 36, 8, 30, -2, 14, -2, 14, 16], ['line', 14, 16, 14, 100]], [['line', 2, 50, 32, 50]]],
    say: 'Hook over, go down. Then cross.',
    vi: 'Bắt đầu hơi thấp hơn dòng trên, cong qua đỉnh rồi kéo thẳng xuống. Sau đó kẻ ngang.',
    strokeVi: ['Bắt đầu ở chấm xanh hơi thấp hơn dòng trên, cong lên qua đỉnh sang trái, rồi kéo thẳng xuống dòng chân.', 'Nét ngang ở dòng giữa, kẻ từ trái sang phải, cắt qua nét thẳng.'],
  },
  // 🪜 Chữ có nét thẳng
  l: {
    width: 20, group: 'ladder', sound: 'l',
    strokes: [[['line', 10, 0, 10, 100]]],
    say: 'Start at the top. Straight down.',
    vi: 'Từ dòng trên cùng kéo thẳng xuống dòng chân.',
    strokeVi: ['Bắt đầu ở dòng trên cùng, kéo thẳng xuống tới dòng chân đậm.'],
  },
  i: {
    width: 20, group: 'ladder', sound: 'i',
    strokes: [[['line', 10, 50, 10, 100]], [['dot', 10, 30]]],
    say: 'Down, then the dot.',
    vi: 'Kéo thẳng xuống từ dòng giữa, rồi chấm ở trên.',
    strokeVi: ['Nét thẳng bắt đầu ở dòng giữa, kéo thẳng xuống dòng chân.', DOT_VI],
  },
  t: {
    width: 32, group: 'ladder', sound: 't',
    strokes: [[['line', 14, 18, 14, 100]], [['line', 2, 50, 30, 50]]],
    say: 'Down, then across.',
    vi: 'Kéo thẳng xuống trước, rồi kẻ ngang ở dòng giữa.',
    strokeVi: ['Nét thẳng bắt đầu hơi thấp hơn dòng trên cùng, kéo thẳng xuống dòng chân.', 'Nét ngang ở dòng giữa, kẻ từ trái sang phải, cắt qua nét thẳng.'],
  },
  j: {
    width: 34, group: 'ladder', sound: 'j',
    strokes: [[['line', 26, 50, 26, 130], ['bez', 26, 130, 26, 152, 4, 152, 2, 136]], [['dot', 26, 30]]],
    say: 'Down and hook. Then the dot.',
    vi: 'Kéo thẳng xuống dưới dòng kẻ, móc sang trái, rồi chấm ở trên.',
    strokeVi: ['Nét thẳng bắt đầu ở dòng giữa, kéo xuống dưới dòng chân rồi móc sang trái.', DOT_VI],
  },
  u: {
    width: 52, group: 'ladder', sound: 'u',
    strokes: [[['line', 6, 50, 6, 78], ['arc', 26, 78, 20, 22, 180, 0], ['line', 46, 78, 46, 50]], [['line', 46, 50, 46, 100]]],
    say: 'Down, round, up. Then down.',
    vi: 'Xuống, vòng sang phải, đi lên; rồi kéo nét thẳng bên phải xuống.',
    strokeVi: ['Bắt đầu ở dòng giữa bên trái, kéo xuống, vòng đáy sang phải, rồi đi lên tới dòng giữa.', 'Nét thẳng bên phải, bắt đầu ở dòng giữa, kéo thẳng xuống dòng chân.'],
  },
  y: {
    width: 54, group: 'ladder', sound: 'y',
    strokes: [[['line', 6, 50, 29, 100]], [['line', 50, 50, 8, 150]]],
    say: 'Slant down. Then a long slant down.',
    vi: 'Nét xiên ngắn bên trái; rồi nét xiên dài bên phải đi xuống dưới dòng kẻ.',
    strokeVi: ['Nét xiên ngắn: từ dòng giữa bên trái, xiên xuống sang phải tới dòng chân.', 'Nét xiên dài: từ dòng giữa bên phải, xiên xuống sang trái, đi qua chân nét 1, xuống tận dòng dưới cùng.'],
  },
  // 🤖 Xuống rồi vòng lên
  r: {
    width: 42, group: 'robot', sound: 'r',
    strokes: [[['line', 6, 50, 6, 100], ['line', 6, 100, 6, 66], ['bez', 6, 66, 10, 50, 30, 46, 38, 56]]],
    say: 'Down, back up, and over.',
    vi: 'Kéo xuống, đi ngược lên đúng đường đó, rồi uốn sang phải như cánh tay.',
    strokeVi: ['Một nét liền, không nhấc tay: kéo xuống từ dòng giữa, đi ngược lên đúng đường cũ, rồi uốn sang phải một chút.'],
  },
  n: {
    width: 48, group: 'robot', sound: 'n',
    strokes: [[['line', 6, 50, 6, 100], ['line', 6, 100, 6, 66], ...ARCH]],
    say: 'Down, back up, over and down.',
    vi: 'Kéo xuống, đi ngược lên, vòng sang phải rồi kéo xuống.',
    strokeVi: ['Một nét liền, không nhấc tay: kéo xuống từ dòng giữa, đi ngược lên đúng đường cũ, vòng cầu sang phải rồi kéo xuống dòng chân.'],
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
  h: {
    width: 48, group: 'robot', sound: 'h',
    strokes: [[['line', 6, 0, 6, 100], ['line', 6, 100, 6, 66], ...ARCH]],
    say: 'Tall line down, back up, over and down.',
    vi: 'Kéo xuống từ dòng trên cùng, đi ngược lên, vòng sang phải rồi kéo xuống.',
    strokeVi: ['Một nét liền, không nhấc tay: kéo xuống từ dòng trên cùng, đi ngược lên tới giữa, vòng cầu sang phải rồi kéo xuống dòng chân.'],
  },
  b: {
    width: 50, group: 'robot', sound: 'b',
    strokes: [[['line', 6, 0, 6, 100], ['line', 6, 100, 6, 75], TUMMY]],
    say: 'Tall line down, back up, round the tummy.',
    vi: 'Kéo xuống từ dòng trên cùng, đi ngược lên giữa, vòng cái bụng sang phải về thân.',
    strokeVi: ['Một nét liền, không nhấc tay: kéo xuống từ dòng trên cùng, đi ngược lên một đoạn, vòng cái bụng sang phải rồi khép về thân.'],
  },
  p: {
    width: 50, group: 'robot', sound: 'p',
    strokes: [[['line', 6, 50, 6, 150], ['line', 6, 150, 6, 75], TUMMY]],
    say: 'Down below the line, back up, round the tummy.',
    vi: 'Kéo xuống dưới dòng kẻ, đi ngược lên, vòng cái bụng sang phải.',
    strokeVi: ['Một nét liền, không nhấc tay: kéo xuống từ dòng giữa tới dòng dưới cùng, đi ngược lên, vòng cái bụng sang phải rồi khép về thân.'],
  },
  k: {
    width: 44, group: 'robot', sound: 'k',
    strokes: [[['line', 6, 0, 6, 100]], [['line', 40, 50, 8, 78], ['line', 8, 78, 42, 100]]],
    say: 'Tall line down. Then in and out.',
    vi: 'Kéo thẳng xuống từ dòng trên cùng. Rồi nét xiên vào giữa thân và xiên ra.',
    strokeVi: ['Nét thẳng cao: bắt đầu ở dòng trên cùng, kéo thẳng xuống dòng chân.', 'Một nét liền: từ dòng giữa bên phải, xiên vào chạm thân, rồi không nhấc tay, xiên ra xuống dòng chân.'],
  },
  // ⚡ Ziczac
  v: {
    width: 48, group: 'zigzag', sound: 'v',
    strokes: [[['line', 4, 50, 24, 100]], [['line', 44, 50, 24, 100]]],
    say: 'Slant down. Slant down.',
    vi: 'Hai nét xiên từ trên xuống, gặp nhau ở dưới.',
    strokeVi: ['Nét xiên: từ dòng giữa bên trái, xiên xuống sang phải tới dòng chân.', 'Nét xiên: từ dòng giữa bên phải, xiên xuống sang trái, gặp chân nét 1.'],
  },
  w: {
    width: 64, group: 'zigzag', sound: 'w',
    strokes: [[['line', 2, 50, 17, 100]], [['line', 32, 50, 17, 100]], [['line', 32, 50, 47, 100]], [['line', 62, 50, 47, 100]]],
    say: 'Slant down four times.',
    vi: 'Bốn nét xiên từ trên xuống, nét nào cũng bắt đầu ở trên.',
    strokeVi: [
      'Nét 1: từ dòng giữa bên trái, xiên xuống sang phải tới dòng chân.',
      'Nét 2: bắt đầu ở dòng giữa (giữa chữ), xiên xuống sang trái, gặp chân nét 1.',
      'Nét 3: lại bắt đầu ở dòng giữa (giữa chữ), xiên xuống sang phải tới dòng chân.',
      'Nét 4: từ dòng giữa bên phải, xiên xuống sang trái, gặp chân nét 3.',
    ],
  },
  x: {
    width: 46, group: 'zigzag', sound: 'x',
    strokes: [[['line', 4, 50, 42, 100]], [['line', 42, 50, 4, 100]]],
    say: 'Slant down this way. Slant down that way.',
    vi: 'Nét xiên từ trái xuống phải, rồi từ phải xuống trái.',
    strokeVi: ['Nét xiên: từ dòng giữa bên trái, xiên xuống sang phải tới dòng chân.', 'Nét xiên: từ dòng giữa bên phải, xiên xuống sang trái, cắt qua nét 1.'],
  },
  z: {
    width: 46, group: 'zigzag', sound: 'z',
    strokes: [[['line', 4, 50, 42, 50]], [['line', 42, 50, 4, 100]], [['line', 4, 100, 42, 100]]],
    say: 'Across, slant down, across.',
    vi: 'Kẻ ngang, xiên xuống trái, rồi kẻ ngang dưới cùng.',
    strokeVi: ['Kẻ ngang ở dòng giữa, từ trái sang phải.', 'Từ đầu bên phải nét ngang, xiên xuống sang trái tới dòng chân.', 'Kẻ ngang ở dòng chân, từ trái sang phải.'],
  },
};

/** 4 nhóm hình nét (mục 2.1) — chỉ để xếp lưới; `letters` là thứ tự học trong nhóm. */
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
  noDot: 'Now without the dot!',
};
