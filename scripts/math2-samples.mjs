// Bảng bài mẫu cố định Toán phần 2 (SPEC-math2.md 8.1): mỗi bài × mỗi mức một lượt 8 mục với `rand` cố định — câu Olly,
// hình, khay (đáp án in đậm), câu đọc, tiếng Việt khi sai 2 lần — để bố mẹ xem bằng mắt. Chạy: node scripts/math2-samples.mjs
import { writeFileSync } from 'node:fs';
import { BUILTIN_MATH, makeItems, seeded, sentenceOf, explainVi, T7_PEOPLE, T7_THINGS } from '../app/js/math/math.js';
import { moreText, bondText, bondSides, opText, opHintLine, SUM_THINGS } from '../app/js/math/sums.js';

const LESSONS = BUILTIN_MATH.filter((l) => ['d', 'e'].includes(l.batch));
const SEED = 1;

const tray = (x) => x.options.map((n, i) => (i === x.at ? `**${n}**` : String(n))).join(' · ');
const row = (p, thing) => `${T7_PEOPLE[p.name].emoji} ${p.name} ${T7_THINGS[thing].emoji.repeat(p.n)} (${p.n})`;

function picture(x) {
  if (x.key === 't8') {
    const [top, bottom] = x.top === 'more' ? [x.more, x.less] : [x.less, x.more];
    const how = x.level === 1 ? 'thẳng cột, có dây nối, phần hơn có viền' : x.level === 2 ? 'thẳng cột, dây nối khi sai' : 'hai hàng lệch, sai → về cột';
    return `${row(top, x.thing)}<br>${row(bottom, x.thing)}<br>*${how}*`;
  }
  if (x.op) {
    const pic = x.story ? SUM_THINGS[x.thing].emoji : '🔵';
    const cells = x.op === '+' ? `${pic.repeat(x.a)} + ${x.b ? '🟠'.repeat(x.b) : '0'}` : `${pic.repeat(x.a - x.b)}${'❌'.repeat(x.b)}`;
    const how = x.level === 3 ? 'chỉ phép tính, khung khi sai / 🔍' : 'câu chuyện + khung có đồ';
    return `${x.a} ${x.op} ${x.b} = ?<br>${x.op === '+' && x.a === 0 ? '0 + ' + '🟠'.repeat(x.b) : cells}<br>*${how}*<br>Sai lần 1: *${opHintLine(x)}*`;
  }
  const [l, r] = bondSides(x);
  const wing = (side, n) => (side === x.hidden ? '❓' : n === 0 ? '0' : '🔵'.repeat(n));
  const frame = x.level === 1 ? 'khung 10 ô luôn hiện' : x.level === 2 ? 'khung khi sai' : 'khung khi sai / 🔍';
  return `🐞 ${x.total}: ${wing('left', l)} \\| ${wing('right', r)}<br>*${frame}*`;
}

const question = (x) => (x.key === 't8' ? moreText(x) : x.key === 't9' ? bondText(x) : opText(x));

let md = `# 🔢 Toán phần 2 — bảng bài mẫu cố định (Math-d: T8, T9 · Math-e: T10, T11)

> Sinh tự động bằng \`node scripts/math2-samples.mjs\` (\`rand\` cố định = seeded(${SEED})) — **không sửa tay**. Bố mẹ xem bằng mắt: câu Olly, hình, khay, câu đọc, tiếng Việt (SPEC-math2.md 8.1).
> Khay: thẻ theo đúng thứ tự trên màn, **đáp án in đậm**. Mức 1: 3 thẻ, không bẫy; mức 2–3: 4 thẻ, bẫy có nghĩa trước (T8: số đồ của từng người; T9: tổng, phần đã thấy; T10: a − b, số hạng lớn hơn; T11: a + b, số trừ).
> T10 / T11 hình: xanh = nhóm có sẵn, 🟠 = nhóm thêm vào, ❌ = đồ bị bớt (vẫn ở nguyên ô, bị gạch).
`;

for (const lesson of LESSONS) {
  md += `\n## ${lesson.emoji} ${lesson.key.toUpperCase()} — ${lesson.title} / ${lesson.titleVi}\n`;
  for (const level of [1, 2, 3]) {
    const items = makeItems(lesson.key, level, seeded(SEED));
    md += `\n### Mức ${level}\n\n| # | Câu Olly hỏi | Hình | Khay | Câu đọc | Tiếng Việt khi sai 2 lần | Kiểu |\n|---|---|---|---|---|---|---|\n`;
    items.forEach((x, i) => {
      const q = question(x);
      const s = sentenceOf(lesson.key, x);
      md += `| ${i + 1} | ${q.en}<br>*${q.vi}* | ${picture(x)} | ${tray(x)} | ${s.en}<br>*${s.vi}* | ${explainVi(lesson.key, x)} | \`${x.kind}\` |\n`;
    });
  }
}

writeFileSync(new URL('../MATH2-SAMPLES.md', import.meta.url), md);
console.log(`MATH2-SAMPLES.md: ${LESSONS.map((l) => l.key).join(', ')} × 3 mức × 8 mục`);
