// Kiểm tra câu đố Quest 3 (SPEC-quest.md 6.3) và sinh bảng duyệt QUEST-RIDDLES.md cho bố mẹ.
// Chạy: node scripts/riddles-sheet.mjs — cùng hàm với test (tests/unit/riddles.test.js), không ghi tay nhóm đọc được.
import { writeFileSync } from 'node:fs';
import { BUILTIN_LESSONS } from '../app/js/data/builtin-lessons.js';
import { TRICKY_BY_GROUP, GROUPS, toGraphemes, learnedGraphemes } from '../app/js/phonics.js';
import { wordsOf } from '../app/js/quest/content.js';
import { RIDDLES, TRAITS, KINDS, readFrom, choicesAt } from '../app/js/quest/riddles.js';

const pictured = new Map();
for (const l of BUILTIN_LESSONS) {
  if (l.track !== 'phonics') continue;
  for (const w of l.words) if (w.emoji && !pictured.has(w.en)) pictured.set(w.en, { group: l.group, emoji: w.emoji });
}
const ALL = [...pictured.keys()];

const rows = RIDDLES.map((r) => {
  const pic = pictured.get(r.word);
  const pairs = r.clues.map((c) => ({
    ...c,
    from: readFrom(c.en.join(' '), pic.group),
    levels: [1, 2, 3].map((lv) => choicesAt(r, c, ALL, lv)),
  }));
  const from = Math.min(...pairs.map((p) => p.from));
  return { r, pic, pairs, from, sumFrom: readFrom(r.sum, pic.group) };
});

const g = (n) => (n === Infinity ? '✗' : n);
const lv = (levels) => levels.map((n, i) => (n ? `${i + 1}${n === 3 && i === 2 ? ' (3 lựa chọn)' : ''}` : null)).filter(Boolean).join(' · ') || '—';

let md = `# 🧩 Quest 3 — bảng câu đố (bố mẹ đã duyệt 2026-11-12)

> Sinh tự động từ \`app/js/quest/riddles.js\` bằng \`node scripts/riddles-sheet.mjs\` — **sửa ở file .js rồi chạy lại**, không sửa tay file này.
> Cách chơi (SPEC-quest.md mục 6): Olly đọc 2 câu gợi ý, bé chạm đáp án; sai lần 1 → Olly phát âm đầu; sai lần 2 → tiếng Việt + đáp án sáng; đúng → câu tổng kết.

**Cách đọc bảng**
- **Gợi ý đọc từ nhóm**: máy **tính** (không ghi tay) — bé đọc xong nhóm 1 → nhóm này thì đọc được từ đáp án và **từng từ** của 2 câu gợi ý: mỗi từ tách theo bảng âm đầy đủ (ưu tiên âm dài: *see* = s-ee) và mọi âm phải đã học, hoặc là tricky word đã học. Cách tách từng từ ở mục cuối để bố mẹ soát.
- **Không làm nhiễu**: từ mà câu 2 cũng đúng → không bao giờ là lựa chọn sai của cặp đó. Vì **mọi** lựa chọn sai đều sai câu 2, chỉ đáp án khớp cả 2 câu.
- **Mức**: mức 1 = 3 hình, nhiễu khác loại; mức 2 = 3 từ cùng loại; mức 3 = 4 từ cùng loại. **Không mượn nhiễu loại khác**: loại ít từ thì mức 3 còn 3 lựa chọn, hoặc từ đó chỉ chơi ở mức thấp hơn.
- **Câu tổng kết**: bé đọc khi đã đọc được; chưa thì Olly đọc, bé nghe.
- Lựa chọn nhiễu chỉ lấy từ bé đã học (nhóm đã đọc xong), khác chữ đầu với đáp án và với nhau.

`;
for (let grp = 1; grp <= 7; grp++) {
  md += `## Nhóm ${grp}\n\n| Từ | Gợi ý (câu 1 · câu 2) | Tiếng Việt | Gợi ý đọc từ nhóm | Không làm nhiễu | Mức | Câu tổng kết |\n|---|---|---|---|---|---|---|\n`;
  for (const { r, pic, pairs, sumFrom, from } of rows.filter((x) => x.pic.group === grp)) {
    pairs.forEach((p, i) => {
      const head = i === 0 ? `${pic.emoji} **${r.word}**<br>${KINDS[r.kind]}` : '';
      const others = TRAITS[p.trait][1].filter((w) => w !== r.word).join(', ') || '—';
      const sum = i === 0
        ? `${r.sum}<br>*${r.sumVi}*${sumFrom > from ? `<br>(bé đọc từ nhóm ${g(sumFrom)}; trước đó Olly đọc)` : ''}`
        : '';
      md += `| ${head} | ${p.en[0]} · ${p.en[1]} | ${p.vi[0]} · ${p.vi[1]} | ${g(p.from)} | ${others} | ${lv(p.levels)} | ${sum} |\n`;
    });
  }
  md += '\n';
}

const byGroup = [1, 2, 3, 4, 5, 6, 7].map((n) => rows.filter((x) => x.from <= n).length);
md += `## Bé đã đọc xong nhóm 1 → n thì Quest 3 dùng được bao nhiêu từ\n\n| Xong tới nhóm | 1 | 2 | 3 | 4 | 5 | 6 | 7 |\n|---|---|---|---|---|---|---|---|\n| Số từ có câu đố đọc được | ${byGroup.join(' | ')} |\n\n`;
md += `Dưới 3 từ → Quest 3 không mở lượt (thẻ mờ, Olly nói *"Let's read more first!"*); không lấy từ chưa đủ điều kiện để lấp chỗ.\n\n`;

md += `## Loại từ\n\n| Loại | Số từ |\n|---|---|\n`;
for (const [k, vi] of Object.entries(KINDS)) md += `| ${vi} | ${RIDDLES.filter((r) => r.kind === k).length} |\n`;

// Từ vựng: mọi từ trong gợi ý + tổng kết, tách âm để bố mẹ soát (bắt lỗi kiểu e câm / nguyên âm dài mà máy không biết).
const ALL_G = learnedGraphemes(7);
const groupOf = (gr) => GROUPS.find((x) => x.graphemes.includes(gr))?.group ?? '?';
const tricky = new Map(Object.entries(TRICKY_BY_GROUP).flatMap(([n, ws]) => ws.map((w) => [w.toLowerCase(), +n])));
const vocab = new Map();
for (const r of RIDDLES) for (const t of [...r.clues.flatMap((c) => c.en), r.sum]) for (const w of wordsOf(t)) vocab.set(w, (vocab.get(w) ?? 0) + 1);
md += `\n## Từ trong câu đố — cách tách âm (bố mẹ soát)\n\nMáy chỉ biết từ ghép được bằng chữ đã học; **từ ghép được nhưng đọc theo âm thì sai** (e câm *home*, nguyên âm dài *gold*, *spider*…) phải do người phát hiện. Từ nào tách sai cách đọc thật → báo mình, mình đổi câu và thêm vào danh sách cấm \`NOT_DECODABLE\` (test chặn).\n\n| Từ | Tách âm | Nhóm |\n|---|---|---|\n`;
for (const w of [...vocab.keys()].sort()) {
  if (tricky.has(w)) { md += `| ${w} | tricky word | ${tricky.get(w)} |\n`; continue; }
  const parts = toGraphemes(w, ALL_G) ?? [];
  md += `| ${w} | ${parts.join(' - ')} | ${Math.max(...parts.map(groupOf))} |\n`;
}

writeFileSync(new URL('../QUEST-RIDDLES.md', import.meta.url), md);
console.log(`${RIDDLES.length} câu đố, ${rows.reduce((n, x) => n + x.pairs.length, 0)} cặp gợi ý, ${vocab.size} từ vựng`);
console.log('Theo nhóm:', byGroup.join(' '));
for (const x of rows) for (const p of x.pairs) if (!p.levels[1]) console.log(`  ${x.r.word} "${p.en[1]}": mức ${lv(p.levels)}`);
