// Kiểm tra câu đố T12 Story sums (SPEC-math2.md 3.5) và sinh bảng duyệt MATH-STORIES.md cho bố mẹ.
// Chạy: node scripts/stories-sheet.mjs — cùng hàm với test (tests/unit/stories.test.js); phép tính và mức do máy tính.
import { writeFileSync } from 'node:fs';
import { STORIES, TRICKS, storyMath, storyLevel, storyProblems, storyAsk } from '../app/js/math/stories.js';
import { T7_PEOPLE, T7_THINGS, numberWord } from '../app/js/math/math.js';

const bad = STORIES.flatMap((s) => storyProblems(s).map((p) => `${s.id}: ${p}`));
if (bad.length) {
  console.error(bad.join('\n'));
  process.exit(1);
}

const PLACES = { pond: '🌊 ao', tank: '🐠 bể cá', sky: '🌌 trời' };
const ownerOf = (o) => (T7_PEOPLE[o] ? `${T7_PEOPLE[o].emoji} ${o}` : PLACES[o]);
const sentence = (s) => {
  const { op, a, b, answer } = storyMath(s);
  const w = (n) => numberWord(n)[0].toUpperCase() + numberWord(n).slice(1);
  return op === '+' ? `${w(a)} plus ${numberWord(b)} is ${numberWord(answer)}.` : `${w(a)} take away ${numberWord(b)} is ${numberWord(answer)}.`;
};

const CHANGED = new Set(); // đánh dấu ✏️ khi sửa câu đố sau lần duyệt gần nhất
const add = STORIES.filter((s) => s.direction === 'increase');
const sub = STORIES.filter((s) => s.direction === 'decrease');
const count = (list, lv) => list.filter((s) => storyLevel(s) <= lv).length;

let md = `# 📖 Toán T12 Story sums — bảng câu đố (bố mẹ duyệt 2026-11-13)

> Sinh tự động từ \`app/js/math/stories.js\` bằng \`node scripts/stories-sheet.mjs\` — **sửa ở file .js rồi chạy lại**, không sửa tay file này.
> Cách chơi (SPEC-math2.md 3.5): Olly đọc câu chuyện (karaoke, có dòng tiếng Việt) → bé chọn **+ add** hay **− take away** → phép tính hiện → bé chạm thẻ kết quả → bé đọc câu phép tính.

**Cách đọc bảng**
- **Phép tính do máy suy ra** từ dữ liệu: *ai / chỗ nào được hỏi* (owner) **được thêm** → cộng, **mất đi** → trừ. Không đoán theo chữ trong câu.
- **Gợi ý khi chọn sai dấu**: Olly đọc lại cụm này (cụm sáng lên trong câu) + dòng tiếng Việt, rồi hỏi câu dòng thứ ba — hỏi theo đúng người / chỗ và đồ vật (*Does Tom have more or fewer apples now?*, *Are there more or fewer ducks in the pond now?*).
- **Mức**: mức 1 = mọi số (cả kết quả) ≤ 5; mức 2 = số ≤ 10; mức 3 = thêm các câu **đánh lừa** (cột cuối). Mức cao dùng cả câu của mức thấp hơn.
- **Câu bé đọc** ghi theo mức 1 (*is*, *take away*); mức 2 đọc *equals*, mức 3 bài trừ đọc *minus … equals* (SPEC-math2 2.3).
- Máy đã kiểm tra mọi câu: số trong câu (Anh và Việt) đúng số ban đầu / số thay đổi, cụm gợi ý có trong câu, câu hỏi nhắc đúng người / chỗ và đồ vật, kết quả trong 0–10.

`;
const table = (title, list) => {
  md += `## ${title}\n\n| # | Câu chuyện | Tiếng Việt | Hỏi về | Phép tính | Gợi ý khi sai dấu | Mức | Câu bé đọc | Đánh lừa |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const s of list) {
    const { op, a, b, answer } = storyMath(s);
    const thing = T7_THINGS[s.thing];
    md += `| ${CHANGED.has(s.id) ? '✏️ ' : ''}${s.id} | ${s.text} | ${s.vi} | ${ownerOf(s.owner)} · ${thing.emoji} | **${a} ${op} ${b} = ${answer}** | *${s.hint}*<br>${s.hintVi}<br>*${storyAsk(s).en}*<br>${storyAsk(s).vi} | ${storyLevel(s)} | ${sentence(s)} | ${s.trick ? TRICKS[s.trick] : '—'} |\n`;
  }
  md += '\n';
};
table(`Cộng (${add.length} câu)`, add);
table(`Trừ (${sub.length} câu)`, sub);

const tricks = Object.keys(TRICKS).map((k) => `${TRICKS[k]}: **${STORIES.filter((s) => s.trick === k).length}**`);
md += `## Tổng kết\n\n| Mức | Câu cộng dùng được | Câu trừ dùng được |\n|---|---|---|\n`;
for (const lv of [1, 2, 3]) md += `| ${lv} | ${count(add, lv)} | ${count(sub, lv)} |\n`;
md += `\nMỗi lượt 8 mục = 4 cộng + 4 trừ, không lặp câu trong lượt → mỗi mức cần ≥ 4 câu mỗi loại.\n\nCâu đánh lừa (chỉ mức 3): ${tricks.join(' · ')}.\n\n`;
md += `Người và đồ vật dùng lại của T7 (Đọc và so sánh): ${Object.entries(T7_PEOPLE).map(([k, p]) => `${p.emoji} ${k}`).join(', ')}; ${[...new Set(STORIES.map((s) => s.thing))].map((t) => `${T7_THINGS[t].emoji} ${t}`).join(', ')}.\n`;

writeFileSync(new URL('../MATH-STORIES.md', import.meta.url), md);
console.log(`MATH-STORIES.md: ${STORIES.length} câu (${add.length} cộng, ${sub.length} trừ)`);
