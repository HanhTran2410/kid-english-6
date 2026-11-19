// Sinh bảng duyệt STORIES.md cho 7 truyện Phonics có sẵn (SPEC-story.md mục 9) — cùng hàm phân loại từ với app và test
// (app/js/story/words.js), không ghi tay loại từ. Chạy: node scripts/read-stories-sheet.mjs
// (scripts/stories-sheet.mjs là bảng câu đố Toán T12 — khác.)
import { writeFileSync } from 'node:fs';
import { BUILTIN_STORIES } from '../app/js/story/builtin-stories.js';
import { GROUPS } from '../app/js/phonics.js';
import {
  WORD_KIND, classifySentence, readability, learnedUpTo, levelOf, levelProblems, storyTokens, STORY_LEVELS,
} from '../app/js/story/words.js';

const KIND_NAME = { pick: 'chọn hình', word: 'chọn chữ', order: 'xếp thứ tự' };

/** Câu / câu hỏi sửa sau lần duyệt gần nhất (✏️ trong bảng), ví dụ { 'story-g1-pip': ['p2s1', 'q3'] } — hiện không có. */
const CHANGED = {};
const mark = (storyId, id) => (CHANGED[storyId]?.includes(id) ? '✏️ ' : '');

/** Câu với từ tricky gạch chân, từ mới ⚠ in đậm. */
const marked = (en, lp) => {
  const toks = classifySentence(en, lp);
  return toks.map((t) => (t.kind === WORD_KIND.TRICKY ? `<u>${t.text}</u>` : t.kind === WORD_KIND.NEW ? `**⚠${t.text}**` : t.text)).join(' ');
};
/** Cách tách âm các từ đọc được bằng âm (mỗi từ một lần). */
const split = (en, lp) => {
  const seen = new Set();
  return classifySentence(en, lp)
    .filter((t) => t.kind === WORD_KIND.DECODABLE && !seen.has(t.word) && seen.add(t.word))
    .map((t) => (t.graphemes.length > 1 ? `${t.word} = ${t.graphemes.join('-')}` : t.word))
    .join(' · ');
};

let md = `# 📚 Truyện ngắn — bảng duyệt 7 truyện có sẵn (Story-0 · bố mẹ duyệt 2026-11-19 sau 3 lần review)

> Sinh tự động từ \`app/js/story/builtin-stories.js\` bằng \`node scripts/read-stories-sheet.mjs\` — **sửa ở file .js rồi chạy lại**, không sửa tay file này.
> Spec: SPEC-story.md (draft2). Mỗi truyện 5 trang, 3 câu hỏi (chọn hình → chọn chữ → xếp thứ tự).

**Cách đọc bảng**
- Truyện nhóm N: giả định bé đã đọc xong nhóm 1 → N. Loại từng từ do **máy tính** bằng chính hàm của app (\`classifyWord\`, SPEC-story 3.2): <u>gạch chân</u> = tricky word / từ nhận diện đã học; chữ thường = ghép được bằng âm đã học (cách tách ở cột "Tách âm"); **⚠đậm** = từ mới bé chưa đọc được (truyện có sẵn không được có — test chặn).
- **Bậc** (SPEC-story 3.1): A (nhóm 1–2) câu ${STORY_LEVELS.A.words.join('–')} từ, chưa dùng *he / she / they* · B (nhóm 3–4) ${STORY_LEVELS.B.words.join('–')} từ, chưa dùng *they* · C (nhóm 5–7) ${STORY_LEVELS.C.words.join('–')} từ. Máy đã kiểm số từ và đại từ.
- **Bố mẹ soát giúp** (máy không kiểm được): câu tiếng Anh tự nhiên, đúng ngữ pháp; đại từ (*it, he, she, they*) chỉ người / vật mà **câu ngay trước** vừa nói tới; dòng tiếng Việt dịch tự nhiên; câu hỏi chỉ có **một** đáp án hợp lý; truyện có mở đầu – chuyện xảy ra – kết thúc vui; mô tả nhân vật (dùng để vẽ ảnh) hợp lý.
- Trang chưa có ảnh hiện emoji của trang (cột "Hình").
- ✏️ = câu / câu hỏi sửa sau lần duyệt gần nhất (hiện không có).

`;

for (const s of BUILTIN_STORIES) {
  const lp = learnedUpTo(s.group);
  const r = readability(s, lp);
  const tricky = [...lp.tricky].sort().map((w) => (w === 'i' ? 'I' : w));
  const graphemes = GROUPS.filter((g) => g.group <= s.group).map((g) => g.graphemes.join(' ')).join(' · ');
  const problems = levelProblems(s);
  md += `## Nhóm ${s.group} — ${s.cover} ${s.title} · *${s.titleVi}*

- **Bậc ${levelOf(s.group)}** · bé đọc được **${r.readable} / ${r.total} từ** (${Math.round(r.ratio * 100)}%)${r.newWords.length ? ` · ⚠ từ mới: ${r.newWords.map((w) => `${w.word} (${w.count})`).join(', ')}` : ''}${problems.length ? `\n- ⚠ Lệch bậc: ${problems.join(' ')}` : ''}
- Âm đã học: ${graphemes}
- Tricky / từ nhận diện đã học: ${tricky.join(', ')}
- Nhân vật (cho ảnh): ${s.characters}

| Trang | Hình | Tiếng Anh | Số từ | Tách âm | Tiếng Việt |
|---|---|---|---|---|---|
`;
  for (const p of s.pages) {
    p.sentences.forEach((x, i) => {
      md += `| ${i === 0 ? p.id.slice(1) : ''} | ${i === 0 ? p.emoji : ''} | ${mark(s.id, x.id)}${marked(x.en, lp)} | ${storyTokens(x.en).length} | ${split(x.en, lp)} | ${x.vi} |\n`;
    });
  }
  md += `\n| Câu hỏi | Olly hỏi | Lựa chọn | Đáp án | Sai lần 1 hiện trang | Giải thích khi sai lần 2 |\n|---|---|---|---|---|---|\n`;
  for (const q of s.questions) {
    const opts = q.type === 'order'
      ? q.pages.map((id) => s.pages.find((p) => p.id === id)).map((p) => `${p.emoji} trang ${p.id.slice(1)}`).join(' / ')
      : q.options.map((o) => (q.type === 'pick' ? `${q.emoji[o]} ${o}` : o)).join(' / ');
    const answer = q.type === 'order' ? `trang ${q.pages.map((id) => id.slice(1)).join(' → ')}` : `**${q.answer}** — *${q.say}*`;
    md += `| ${mark(s.id, q.id)}${q.id.slice(1)}. ${KIND_NAME[q.type]} | ${q.en}<br>*${q.vi}* | ${opts} | ${answer} | ${q.page ? `trang ${q.page.slice(1)}` : '—'} | ${q.explainVi} |\n`;
  }
  md += '\n';
}

writeFileSync(new URL('../STORIES.md', import.meta.url), md);
console.log(`STORIES.md: ${BUILTIN_STORIES.length} truyện`);
