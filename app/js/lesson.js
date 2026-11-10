// Gói bài (SPEC mục 5.4) và kiểm tra khi nhập / sửa (mục 5.5). Không phụ thuộc DOM.
// Lỗi → từ chối lưu, chỉ rõ chỗ sai bằng tiếng Việt; cảnh báo → vẫn cho lưu.

import { SOUND_IDS, spellGraphemes, learnedGraphemes, isDecodable, AFTER_GROUPS } from './phonics.js';

export const LESSON_VERSION = 1;
export const TRACKS = ['phonics', 'book'];

/** Loại hoạt động → mục nó dùng (`words` / `sentences`), hoặc `sounds` (danh sách mã âm). */
export const ACTIVITY_TYPES = {
  sounds: 'sounds',
  blend: 'words',
  tricky: 'words',
  spell: 'words',
  fill: 'words',
  write: 'words',
  sentence: 'sentences',
};

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const str = (v) => (typeof v === 'string' ? v.trim() : '');

/** Bỏ phần bọc ```json … ``` mà AI hay thêm, rồi đọc JSON. Lỗi cú pháp → `{ error }`. */
export function parseLessonText(text) {
  let t = String(text ?? '').trim();
  const fence = t.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n?```\s*$/);
  if (fence) t = fence[1].trim();
  if (!t) return { error: 'Chưa có nội dung.' };
  try {
    return { data: JSON.parse(t) };
  } catch (err) {
    return { error: `Không đọc được JSON (${err.message}).` };
  }
}

/**
 * Kiểm tra và chuẩn hóa một gói bài.
 * @param {unknown} data
 * @param {{ builtIn?: boolean }} [options] bài có sẵn của app; bài nhập vào luôn `builtIn: false`
 * @returns {{ ok: boolean, lesson: object|null, errors: string[], warnings: string[] }}
 */
export function validateLesson(data, { builtIn = false } = {}) {
  const errors = [];
  const warnings = [];
  const fail = () => ({ ok: false, lesson: null, errors, warnings });

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push('Nội dung phải là một gói bài (một object JSON).');
    return fail();
  }
  if (data.version !== LESSON_VERSION) errors.push(`"version" phải là ${LESSON_VERSION} (đang là ${JSON.stringify(data.version)}).`);
  if (data.kind !== undefined && data.kind !== 'lesson') errors.push('"kind" phải là "lesson".');

  const id = str(data.id);
  if (!id) errors.push('Thiếu "id" của bài.');
  else if (!ID_RE.test(id)) errors.push(`"id" chỉ gồm chữ thường không dấu, số và dấu gạch ngang (đang là "${id}").`);

  const track = str(data.track);
  if (!TRACKS.includes(track)) errors.push(`"track" phải là "phonics" hoặc "book" (đang là ${JSON.stringify(data.track)}).`);

  const title = str(data.title);
  if (!title) errors.push('Thiếu tên bài ("title").');

  let group = null;
  if (data.group != null) {
    if (!Number.isInteger(data.group) || data.group < 1 || data.group > AFTER_GROUPS) errors.push(`"group" phải là số nhóm âm từ 1 đến ${AFTER_GROUPS}.`);
    else group = data.group;
  }

  const newSounds = data.newSounds == null ? [] : data.newSounds;
  if (!Array.isArray(newSounds)) errors.push('"newSounds" phải là danh sách mã âm.');
  else for (const s of newSounds) if (!SOUND_IDS.has(s)) errors.push(`"newSounds": không có âm "${s}".`);

  const words = checkItems(data.words, 'words', 'Từ', errors, (w, where) => checkWord(w, where, errors));
  const sentences = checkItems(data.sentences, 'sentences', 'Câu', errors, (s, where) => checkSentence(s, where, errors));

  const pools = { words: new Set(words.map((w) => w.id)), sentences: new Set(sentences.map((s) => s.id)) };
  for (const s of sentences) if (pools.words.has(s.id)) errors.push(`Câu "${s.en}": "id" "${s.id}" trùng với id của một từ.`);
  const activities = [];
  if (!Array.isArray(data.activities) || !data.activities.length) {
    errors.push('Bài cần ít nhất một hoạt động ("activities").');
  } else {
    data.activities.forEach((a, i) => {
      const where = `Hoạt động số ${i + 1}`;
      const kind = ACTIVITY_TYPES[a?.type];
      if (!kind) {
        errors.push(`${where}: loại "${a?.type}" chưa hỗ trợ (dùng: ${Object.keys(ACTIVITY_TYPES).join(', ')}).`);
        return;
      }
      if (kind === 'sounds') {
        const sounds = Array.isArray(a.sounds) ? a.sounds : [];
        if (!sounds.length) errors.push(`${where} (sounds): cần danh sách "sounds".`);
        for (const s of sounds) if (!SOUND_IDS.has(s)) errors.push(`${where} (sounds): không có âm "${s}".`);
        activities.push({ type: a.type, sounds: [...sounds] });
        return;
      }
      const items = Array.isArray(a.items) ? a.items.map(str) : [];
      if (!items.length) errors.push(`${where} (${a.type}): cần danh sách "items".`);
      for (const it of items) {
        if (!pools[kind].has(it)) errors.push(`${where} (${a.type}): không có ${kind === 'words' ? 'từ' : 'câu'} mang id "${it}".`);
      }
      if (['blend', 'spell', 'fill'].includes(a.type)) {
        for (const it of items) {
          const w = words.find((x) => x.id === it);
          if (w && !w.graphemes) errors.push(`${where} (${a.type}): từ "${w.en}" cần "graphemes" và "sounds".`);
        }
      }
      activities.push({ type: a.type, items });
    });
  }

  // Cảnh báo (không chặn): từ chưa đọc được bằng các âm đã học, ở bài phonics có số nhóm.
  if (track === 'phonics' && group) {
    const learned = learnedGraphemes(group);
    const trickyWords = new Set(words.filter((w) => w.tags.includes('tricky')).map((w) => w.en.toLowerCase()));
    for (const w of words) {
      if (w.graphemes && !isDecodable(w, learned, trickyWords)) {
        warnings.push(`Từ "${w.en}" có âm chưa học tới nhóm ${group} — bé chưa tự đọc được.`);
      }
    }
  }

  if (errors.length) return fail();
  const lesson = {
    version: LESSON_VERSION,
    kind: 'lesson',
    id,
    track,
    book: str(data.book) || null,
    unit: str(data.unit) || null,
    group,
    title,
    titleVi: str(data.titleVi),
    newSounds: [...newSounds],
    words,
    sentences,
    activities,
    builtIn,
    createdAt: Number.isFinite(data.createdAt) ? data.createdAt : null,
    updatedAt: Number.isFinite(data.updatedAt) ? data.updatedAt : null,
  };
  return { ok: true, lesson, errors, warnings };
}

function checkItems(list, field, label, errors, checkOne) {
  if (list == null) return [];
  if (!Array.isArray(list)) {
    errors.push(`"${field}" phải là một danh sách.`);
    return [];
  }
  const seen = new Set();
  const out = [];
  list.forEach((item, i) => {
    const where = `${label} số ${i + 1}${item?.en ? ` ("${str(item.en)}")` : ''}`;
    if (!item || typeof item !== 'object') {
      errors.push(`${where}: phải là một object.`);
      return;
    }
    const id = str(item.id);
    if (!id) errors.push(`${where}: thiếu "id".`);
    else if (seen.has(id)) errors.push(`${where}: "id" "${id}" bị trùng.`);
    seen.add(id);
    const clean = checkOne(item, where);
    if (clean) out.push({ ...clean, id });
  });
  return out;
}

function checkWord(w, where, errors) {
  const en = str(w.en);
  if (!en) errors.push(`${where}: thiếu chữ tiếng Anh ("en").`);
  const tags = Array.isArray(w.tags) ? w.tags.map(str).filter(Boolean) : [];
  let graphemes = null;
  let sounds = null;
  if (w.graphemes != null || w.sounds != null) {
    if (!Array.isArray(w.graphemes) || !Array.isArray(w.sounds) || !w.graphemes.length) {
      errors.push(`${where}: "graphemes" và "sounds" phải là hai danh sách, có cả hai.`);
    } else {
      graphemes = w.graphemes.map((g) => str(g).toLowerCase());
      sounds = w.sounds.map(str);
      if (graphemes.length !== sounds.length) {
        errors.push(`${where}: "graphemes" có ${graphemes.length} ô nhưng "sounds" có ${sounds.length} âm.`);
      }
      const spelled = spellGraphemes(graphemes);
      if (en && spelled !== en.toLowerCase()) {
        errors.push(`${where}: các ô ${graphemes.join(' – ')} ghép lại là "${spelled ?? '?'}", không phải "${en}".`);
      }
      for (const s of sounds) if (!SOUND_IDS.has(s)) errors.push(`${where}: không có âm "${s}".`);
    }
  }
  return {
    en,
    graphemes,
    sounds,
    tags,
    vi: str(w.vi),
    explainVi: str(w.explainVi),
    emoji: str(w.emoji) || null,
    imageId: str(w.imageId) || null,
    homophones: Array.isArray(w.homophones) ? w.homophones.map(str).filter(Boolean) : [],
  };
}

function checkSentence(s, where, errors) {
  const en = str(s.en);
  if (!en) errors.push(`${where}: thiếu câu tiếng Anh ("en").`);
  const chunks = Array.isArray(s.chunks) ? s.chunks.map(str).filter(Boolean) : [];
  if (chunks.length && chunks.join(' ') !== en) errors.push(`${where}: các cụm "chunks" ghép lại phải đúng bằng câu.`);
  return { en, vi: str(s.vi), chunks, emoji: str(s.emoji) || null, imageId: str(s.imageId) || null };
}

/**
 * Khi thay bài cũ bằng bản mới: id các mục phải xóa tiến độ (mục bị xóa, hoặc giữ id nhưng đổi chữ `en`).
 * @returns {string[]}
 */
export function itemsToReset(oldLesson, newLesson) {
  const next = new Map([...newLesson.words, ...newLesson.sentences].map((it) => [it.id, it.en]));
  return [...(oldLesson?.words ?? []), ...(oldLesson?.sentences ?? [])]
    .filter((it) => !next.has(it.id) || next.get(it.id) !== it.en)
    .map((it) => it.id);
}
