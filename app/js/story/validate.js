// 📚 Truyện ngắn — kiểm tra truyện nhập vào (SPEC-story 8.3), đặt id (8.5), dấu nội dung + tiến độ phải xóa khi sửa
// truyện (7.2). Hàm thuần, chạy được trong Node.

import { slug } from '../lesson-prompts.js';
import { readability, levelProblems, classifySentence, WORD_KIND, learnedUpTo } from './words.js';

export const STORY_VERSION = 1;
export const QUESTION_TYPES = ['pick', 'word', 'order'];
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const strOrNull = (v) => str(v) || null;

/**
 * Kiểm tra + chuẩn hóa một truyện (JSON AI trả / gói chia sẻ). Lỗi → từ chối cả truyện (chỉ rõ chỗ, tiếng Việt);
 * cảnh báo → vẫn lưu được.
 * @param {{ lp?: object, hasLibImage?: (word: string) => boolean }} opts `lp` kiến thức để tính tỉ lệ đọc được
 *   (mặc định: nhóm của truyện Phonics, truyện Theo sách → nhóm `group` nếu có, không thì bỏ qua cảnh báo đọc được)
 * @returns {{ ok: boolean, errors: string[], warnings: string[], story?: object }}
 */
export function validateStory(data, { lp = null, hasLibImage = () => false } = {}) {
  const errors = [];
  const warnings = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, errors: ['Không phải một truyện (cần một đối tượng JSON).'], warnings };
  if (data.kind !== 'story') errors.push('"kind" phải là "story".');
  const version = data.version ?? STORY_VERSION;
  if (version !== STORY_VERSION) errors.push(`"version" ${version} chưa hỗ trợ (chỉ có 1).`);
  const id = str(data.id);
  if (id !== 'auto' && !ID_RE.test(id)) errors.push('"id" phải là chữ thường, số và dấu gạch ngang (hoặc "auto").');
  const title = str(data.title);
  if (!title) errors.push('Thiếu "title" (tên truyện).');
  const track = data.track;
  if (!['phonics', 'book'].includes(track)) errors.push('"track" phải là "phonics" hoặc "book".');
  const group = data.group == null ? null : Number(data.group);
  if (track === 'phonics' && !(Number.isInteger(group) && group >= 1 && group <= 7)) errors.push('Truyện Phonics cần "group" từ 1 tới 7.');
  if (group != null && !(Number.isInteger(group) && group >= 1 && group <= 7)) errors.push('"group" phải từ 1 tới 7.');
  if (!str(data.characters)) errors.push('Thiếu "characters" (mô tả nhân vật để vẽ ảnh).');

  // Trang + câu.
  const pages = [];
  const ids = new Set();
  const dupId = (x, where) => {
    if (ids.has(x)) errors.push(`${where}: id "${x}" bị trùng.`);
    ids.add(x);
  };
  if (!Array.isArray(data.pages) || data.pages.length < 4 || data.pages.length > 6) {
    errors.push(`Truyện cần 4–6 trang (đang có ${Array.isArray(data.pages) ? data.pages.length : 0}).`);
  }
  (Array.isArray(data.pages) ? data.pages : []).forEach((p, i) => {
    const where = `Trang ${i + 1}`;
    const pid = str(p?.id);
    if (!ID_RE.test(pid)) errors.push(`${where}: thiếu "id" hợp lệ.`);
    else dupId(pid, where);
    const list = Array.isArray(p?.sentences) ? p.sentences : [];
    if (list.length < 1 || list.length > 2) errors.push(`${where}: cần 1–2 câu (đang có ${list.length}).`);
    const sentences = list.map((s, k) => {
      const sw = `${where}, câu ${k + 1}`;
      const sid = str(s?.id) || `${pid}s${k + 1}`;
      if (!ID_RE.test(sid)) errors.push(`${sw}: "id" không hợp lệ.`);
      else dupId(sid, sw);
      const en = str(s?.en);
      if (!en) errors.push(`${sw}: thiếu câu tiếng Anh ("en").`);
      const vi = str(s?.vi);
      if (en && !vi) warnings.push(`${sw}: thiếu dòng tiếng Việt.`);
      const chunks = Array.isArray(s?.chunks) ? s.chunks.map(str).filter(Boolean) : [];
      return { id: sid, en, vi, ...(chunks.length ? { chunks } : {}) };
    });
    pages.push({ id: pid, sentences, ...(str(p?.emoji) ? { emoji: str(p.emoji) } : {}), ...(str(p?.imagePrompt) ? { imagePrompt: str(p.imagePrompt) } : {}) });
  });
  const pageIds = new Set(pages.map((p) => p.id));

  // Câu hỏi (bảng 6.1).
  const questions = [];
  const qs = Array.isArray(data.questions) ? data.questions : [];
  if (qs.length < 2 || qs.length > 3) errors.push(`Truyện cần 2–3 câu hỏi (đang có ${qs.length}).`);
  qs.forEach((q, i) => {
    const where = `Câu hỏi ${i + 1}`;
    const qid = str(q?.id) || `q${i + 1}`;
    if (!ID_RE.test(qid)) errors.push(`${where}: "id" không hợp lệ.`);
    else dupId(qid, where);
    const type = q?.type;
    if (!QUESTION_TYPES.includes(type)) {
      errors.push(`${where}: "type" phải là pick, word hoặc order.`);
      return;
    }
    const en = str(q.en);
    const vi = str(q.vi);
    const explainVi = str(q.explainVi);
    if (!en) errors.push(`${where}: thiếu câu hỏi tiếng Anh ("en").`);
    if (!vi) errors.push(`${where}: thiếu câu hỏi tiếng Việt ("vi").`);
    if (!explainVi) errors.push(`${where}: thiếu "explainVi" (giải thích khi bé sai 2 lần).`);
    if (type === 'order') {
      const ps = Array.isArray(q.pages) ? q.pages.map(str) : [];
      if (ps.length !== 3 || new Set(ps).size !== 3) errors.push(`${where} (order): "pages" cần đúng 3 trang khác nhau.`);
      for (const p of ps) if (p && !pageIds.has(p)) errors.push(`${where} (order): không có trang "${p}".`);
      questions.push({ id: qid, type, en, vi, pages: ps, explainVi, ...(str(q.say) ? { say: str(q.say) } : {}) });
      return;
    }
    const options = Array.isArray(q.options) ? q.options.map(str).filter(Boolean) : [];
    const min = type === 'pick' ? 3 : 2;
    if (options.length < min || options.length > 3 || new Set(options).size !== options.length) {
      errors.push(`${where} (${type}): "options" cần ${type === 'pick' ? '3' : '2–3'} lựa chọn khác nhau.`);
    }
    const answer = str(q.answer);
    if (!options.includes(answer)) errors.push(`${where} (${type}): "answer" phải là một trong "options".`);
    const page = str(q.page);
    if (!pageIds.has(page)) errors.push(`${where} (${type}): "page" phải là id một trang có thật.`);
    const say = str(q.say);
    if (!say) errors.push(`${where} (${type}): thiếu "say" (câu trả lời đầy đủ Olly đọc khi đúng).`);
    const out = { id: qid, type, en, vi, options, answer, page, say, explainVi };
    if (type === 'pick') {
      const emoji = q.emoji && typeof q.emoji === 'object' ? Object.fromEntries(Object.entries(q.emoji).map(([k, v]) => [str(k), str(v)]).filter(([k, v]) => k && v)) : {};
      out.emoji = emoji;
      const noPic = options.filter((o) => !emoji[o] && !hasLibImage(o));
      if (noPic.length) warnings.push(`${where}: lựa chọn chưa có emoji / ảnh: ${noPic.join(', ')}.`);
    }
    questions.push(out);
  });
  const twoOnPage = questions.filter((q) => q.page).map((q) => q.page);
  if (new Set(twoOnPage).size !== twoOnPage.length) warnings.push('Có hai câu hỏi cùng hỏi một trang — nên hỏi 3 chi tiết khác nhau.');

  if (errors.length) return { ok: false, errors, warnings };
  const story = {
    version: STORY_VERSION, kind: 'story', id, track, group, lessonId: strOrNull(data.lessonId),
    title, titleVi: str(data.titleVi), cover: str(data.cover) || pages[0]?.emoji || '📖',
    characters: str(data.characters), ...(str(data.setting) ? { setting: str(data.setting) } : {}),
    pages, questions,
  };
  // Cảnh báo theo bậc độ khó + tỉ lệ đọc được (3.1, 3.2).
  const knows = lp ?? (group ? learnedUpTo(group) : null);
  if (group) warnings.push(...levelProblems(story, group));
  if (knows) {
    const r = readability(story, knows);
    if (r.ratio < 0.7) warnings.push(`Bé đọc được ${r.readable} / ${r.total} từ (${Math.round(r.ratio * 100)}%) — nhiều từ mới.`);
    for (const q of questions.filter((x) => x.type === 'word')) {
      const bad = q.options.filter((o) => classifySentence(o, knows).some((t) => t.kind === WORD_KIND.NEW));
      if (bad.length) warnings.push(`Câu hỏi "${q.en}": bé chưa đọc được lựa chọn ${bad.join(', ')}.`);
    }
  }
  return { ok: true, errors, warnings, story };
}

/** id cho truyện `"id": "auto"` (8.5): story-<lessonId hoặc gN>-<tên>; đã có → -2, -3… */
export function storyIdFor(story, taken) {
  const base = `story-${story.lessonId ? slug(story.lessonId).replace(/^book-/, '') : `g${story.group ?? 0}`}-${slug(story.title) || 'truyen'}`;
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

// ---------- Dấu nội dung + sửa / thay truyện (7.2) ----------

/** Băm chuỗi ngắn (djb2) — chỉ để so khác / giống. */
function hash(text) {
  let x = 5381;
  for (let i = 0; i < text.length; i++) x = ((x << 5) + x + text.charCodeAt(i)) >>> 0;
  return x.toString(36);
}

/** Dấu của câu hỏi: trường của câu hỏi (trừ vi / explainVi) + chữ `en` của mọi câu thuộc trang nó tham chiếu. */
export function questionHash(story, q) {
  const { vi, explainVi, ...fields } = q;
  const refs = q.type === 'order' ? q.pages : [q.page];
  const text = refs.map((id) => story.pages.find((p) => p.id === id)?.sentences.map((s) => s.en).join(' ') ?? '').join('|');
  return hash(JSON.stringify(fields) + text);
}

/** Dấu cả truyện = các dấu câu hỏi (sao cũ hiện mờ "Truyện đã sửa" khi dấu đổi). */
export const contentHash = (story) => hash(story.questions.map((q) => `${q.id}:${questionHash(story, q)}`).join(','));

/**
 * Tiến độ phải xóa khi thay truyện cũ bằng bản mới (7.2): câu đọc đổi chữ / bị xóa; câu hỏi đổi dấu / bị xóa; trang bị
 * xóa (ảnh trang).
 * @returns {{ readIds: string[], quizIds: string[], pageIds: string[] }}
 */
export function storyResets(oldStory, newStory) {
  const newSent = new Map(newStory.pages.flatMap((p) => p.sentences).map((s) => [s.id, s.en]));
  const readIds = oldStory.pages.flatMap((p) => p.sentences).filter((s) => newSent.get(s.id) !== s.en).map((s) => s.id);
  const newQ = new Map(newStory.questions.map((q) => [q.id, questionHash(newStory, q)]));
  const quizIds = oldStory.questions.filter((q) => newQ.get(q.id) !== questionHash(oldStory, q)).map((q) => q.id);
  const keep = new Set(newStory.pages.map((p) => p.id));
  const pageIds = oldStory.pages.map((p) => p.id).filter((id) => !keep.has(id));
  return { readIds, quizIds, pageIds };
}
