// Kiểm tra câu đố Quest 3 (SPEC-quest.md 6.3) và sinh bảng duyệt QUEST-RIDDLES.md cho bố mẹ.
// Chạy: node scripts/riddles-sheet.mjs — cùng hàm với test (tests/unit/riddles.test.js), không ghi tay nhóm đọc được.
import { writeFileSync } from 'node:fs';
import { BUILTIN_LESSONS } from '../app/js/data/builtin-lessons.js';
import { TRICKY_BY_GROUP, GROUPS, toGraphemes, learnedGraphemes } from '../app/js/phonics.js';
import { wordsOf, SIGHT_BY_GROUP, wordSupport } from '../app/js/quest/content.js';
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

/** Câu đố sửa sau lần duyệt gần nhất (✏️ trong bảng) — bố mẹ duyệt lại 2026-11-13, hiện không còn. */
const CHANGED = new Set(); // đánh dấu ✏️ khi sửa câu đố sau lần duyệt gần nhất

let md = `# 🧩 Quest 3 — bảng câu đố (bố mẹ duyệt 2026-11-12 · sửa theo review, duyệt lại 2026-11-13)

> Sinh tự động từ \`app/js/quest/riddles.js\` bằng \`node scripts/riddles-sheet.mjs\` — **sửa ở file .js rồi chạy lại**, không sửa tay file này.
> Cách chơi (SPEC-quest.md mục 6): Olly đọc 2 câu gợi ý, bé chạm đáp án; sai lần 1 → Olly phát âm đầu; sai lần 2 → tiếng Việt + đáp án sáng; đúng → câu tổng kết.

**Cách đọc bảng**
- **Gợi ý đọc từ nhóm**: máy **tính** (không ghi tay) — bé đọc xong nhóm 1 → nhóm này thì đọc được từ đáp án và **từng từ** của 2 câu gợi ý: mỗi từ tách theo bảng âm đầy đủ (ưu tiên âm dài: *see* = s-ee) và mọi âm phải đã học, hoặc là tricky word đã học **cùng nhóm** (*a, an* tính là tricky word nhóm 1). Cách tách từng từ ở mục cuối để bố mẹ soát.
- **Cũng đúng câu 2** (danh sách **viết tay**, bố mẹ duyệt): mọi từ mà câu 2 có thể đúng, kể cả "có thể" (chó cũng bắt chuột, cáo cũng đào đất). Những từ này **không bao giờ** được chọn làm lựa chọn sai của cặp đó. Luật này chặt hơn "kiểm tra cả hai câu": lựa chọn sai phải sai **ngay ở câu 2**, nên không có hai đáp án cùng hợp lý. Ví dụ *cat* "It can get a rat." → *dog, fox* không bao giờ là nhiễu.
- **Một từ dùng được** khi có **ít nhất một** cặp gợi ý mà bé đọc được cả đáp án và 2 câu gợi ý. Mỗi cặp xét riêng; cặp chưa đọc được thì không dùng. Câu tổng kết không bắt buộc (chưa đọc được thì Olly đọc).
- **Mức**: mức 1 = 3 hình, nhiễu khác loại; mức 2 = 3 từ cùng loại; mức 3 = 4 từ cùng loại. **Không mượn nhiễu loại khác**: loại ít từ thì mức 3 còn 3 lựa chọn, hoặc từ đó chỉ chơi ở mức thấp hơn.
- **Câu tổng kết**: bé đọc khi đã đọc được; chưa thì Olly đọc, bé nghe.
- Lựa chọn nhiễu chỉ lấy từ bé đã học (nhóm đã đọc xong), **khác âm đầu** với đáp án và với nhau (*cat* / *king* cùng /k/ → không đứng chung; *ship* / *sun* khác âm → được). Vị trí đáp án xáo đều trong lượt. Không đủ nhiễu → mức 3 bớt còn 3 lựa chọn, hoặc cặp đó không dùng ở mức đó.
- ✏️ = câu đố sửa sau lần duyệt gần nhất (hiện không có).

`;
for (let grp = 1; grp <= 7; grp++) {
  md += `## Nhóm ${grp}\n\n| Từ | Gợi ý (câu 1 · câu 2) | Tiếng Việt | Gợi ý đọc từ nhóm | Cũng đúng câu 2 (không làm nhiễu) | Mức | Câu tổng kết |\n|---|---|---|---|---|---|---|\n`;
  for (const { r, pic, pairs, sumFrom, from } of rows.filter((x) => x.pic.group === grp)) {
    pairs.forEach((p, i) => {
      const head = i === 0 ? `${CHANGED.has(r.word) ? '✏️ ' : ''}${pic.emoji} **${r.word}**<br>${KINDS[r.kind]}` : '';
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
const sight = new Map(Object.entries(SIGHT_BY_GROUP).flatMap(([n, ws]) => ws.map((w) => [w, +n])));
const OO_LONG = new Set(['moon', 'food']);
const S_AS_Z = new Set(['is', 'has', 'his', 'as']);
const note = (w, parts) => {
  const out = [];
  if (parts.includes('oo')) out.push(OO_LONG.has(w) ? 'oo dài /uː/ (như moon)' : 'oo ngắn /ʊ/ (như book)');
  if (S_AS_Z.has(w)) out.push('s cuối đọc /z/');
  if (wordSupport(w).needsSupport) out.push('⚠ cần hỗ trợ (2+ âm tiết)');
  return out.join(' · ');
};
const vocab = new Map();
for (const r of RIDDLES) for (const t of [...r.clues.flatMap((c) => c.en), r.sum]) for (const w of wordsOf(t)) vocab.set(w, (vocab.get(w) ?? 0) + 1);
md += `\n## Từ trong câu đố — cách tách âm (bố mẹ soát)\n\nMáy chỉ biết từ ghép được bằng chữ đã học; **từ ghép được nhưng đọc theo âm thì sai** (e câm *home*, nguyên âm dài *gold*, *spider*…) phải do người phát hiện. Từ nào tách sai cách đọc thật → báo mình, mình đổi câu và thêm vào danh sách cấm \`NOT_DECODABLE\` (test chặn).\n\n- **oo** có hai âm, cả hai học ở nhóm 5: ngắn /ʊ/ (*book, wood, foot*) và dài /uː/ (*moon, food*) — cột ghi chú nói từ nào âm nào.\n- **s cuối đọc /z/** (*is, has, his*): bộ Jolly Phonics coi là từ đọc theo âm được ngay từ đầu.\n- **⚠ 2+ âm tiết**: từ dài có âm tiết đọc nhẹ (*animal* = an-i-m**ə**l). Vẫn tính là đọc được nhưng là **từ cần hỗ trợ** (xem cuối bảng).\n\n| Từ | Tách âm | Nhóm | Ghi chú |\n|---|---|---|---|\n`;
for (const w of [...vocab.keys()].sort()) {
  if (tricky.has(w)) { md += `| ${w} | tricky word | ${tricky.get(w)} | |\n`; continue; }
  if (sight.has(w)) { md += `| ${w} | tricky word (mạo từ đọc âm yếu /ə/) | ${sight.get(w)} | |\n`; continue; }
  const parts = toGraphemes(w, ALL_G) ?? [];
  md += `| ${w} | ${parts.join(' - ')} | ${Math.max(...parts.map(groupOf))} | ${note(w, parts)} |\n`;
}

// Bố mẹ đã quyết 2026-11-13: giữ từ 2+ âm tiết (từ cần hỗ trợ); bảng số giữ lại để thấy nếu bỏ thì giảm bao nhiêu.
const multi = [...vocab.keys()].filter((w) => !tricky.has(w) && !sight.has(w) && wordSupport(w).needsSupport);
const without = (bad) => [1, 2, 3, 4, 5, 6, 7].map((n) => rows.filter((x) => x.pairs.some((p) => p.from <= n
  && !p.en.flatMap(wordsOf).some((w) => bad.includes(w)))).length);
md += `\n## Đã quyết: từ cần hỗ trợ (2+ âm tiết)\n\nCác từ ⚠ (${multi.join(', ')}) ghép được bằng âm đã học nhưng có âm tiết đọc nhẹ. **Bố mẹ quyết (2026-11-13): giữ như hiện nay** — vẫn tính vào số từ Quest 3 dùng được, nhưng:\n\n- **Ghép được ≠ đọc thành thạo**: từ ⚠ không dùng để đánh giá bé tự đọc.\n- Gặp từ ⚠, bé được hỗ trợ: tách âm tiết, nghe đọc mẫu (🔊).\n- Chọn đúng đáp án **không** có nghĩa là bé đã đọc được từ đó (máy không ghi "từ đã biết").\n- *ribbit* là từ tượng thanh, không phải ví dụ phonics điển hình.\n\nBảng dưới để thấy nếu bỏ thì số từ dùng được giảm bao nhiêu:\n\n| Xong tới nhóm | 1 | 2 | 3 | 4 | 5 | 6 | 7 |\n|---|---|---|---|---|---|---|---|\n| Như hiện nay | ${byGroup.join(' | ')} |\n| Bỏ *animal* | ${without(['animal']).join(' | ')} |\n| Bỏ *animal, insect* | ${without(['animal', 'insect']).join(' | ')} |\n| Bỏ mọi từ ⚠ | ${without(multi).join(' | ')} |\n`;

writeFileSync(new URL('../QUEST-RIDDLES.md', import.meta.url), md);
console.log(`${RIDDLES.length} câu đố, ${rows.reduce((n, x) => n + x.pairs.length, 0)} cặp gợi ý, ${vocab.size} từ vựng`);
console.log('Theo nhóm:', byGroup.join(' '));
for (const x of rows) for (const p of x.pairs) if (!p.levels[1]) console.log(`  ${x.r.word} "${p.en[1]}": mức ${lv(p.levels)}`);
