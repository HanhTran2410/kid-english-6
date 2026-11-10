// Dữ liệu tranh của Tả tranh (SPEC-ta-tranh mục 7): kiểm tra khi lưu / dán JSON từ AI (bảng 7.4), prompt AI (8.3).
// Hàm thuần, không DOM.

import { parseLessonText } from './lesson.js';
import { FROM_VALUES, HIT_DEFAULT, HIT_MIN, HIT_MAX } from './scene.js';

export const LEVEL_WORDS = { 1: [3, 6], 2: [4, 9], 3: [6, 12] };
const MAX_WORDS = 20;
const MAX_SENTENCES = 12;
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const wordCount = (s) => s.split(/\s+/).filter(Boolean).length;

export const newSid = () => Math.random().toString(36).slice(2, 8);
export const newSceneId = () => `scene-${Date.now().toString(36)}`;

/** Đọc JSON tranh (chịu được khối ```json của AI). */
export const parseSceneText = parseLessonText;

/**
 * Kiểm tra + chuẩn hóa tranh (bảng 7.4). Lỗi → từ chối, chỉ rõ câu số mấy; cảnh báo → vẫn lưu.
 * AI không quản lý id / sid / ảnh / ngày giờ: thiếu thì app tự điền.
 * @returns {{ ok: boolean, scene: object|null, errors: string[], warnings: string[] }}
 */
export function validateScene(data) {
  const errors = [];
  const warnings = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, scene: null, errors: ['Nội dung phải là một object JSON.'], warnings };
  }
  const title = str(data.title);
  if (!title) errors.push('Thiếu tên tranh ("title").');
  let level = data.level ?? 2;
  if (![1, 2, 3].includes(level)) {
    errors.push('"level" phải là 1, 2 hoặc 3.');
    level = 2;
  }
  const list = data.sentences;
  if (!Array.isArray(list) || list.length < 1 || list.length > MAX_SENTENCES) {
    errors.push(`"sentences" phải là danh sách 1–${MAX_SENTENCES} câu.`);
  }
  const sentences = [];
  const usedSid = new Set();
  (Array.isArray(list) ? list : []).forEach((s, i) => {
    const where = `Câu ${i + 1}`;
    if (!s || typeof s !== 'object') {
      errors.push(`${where}: phải là một object.`);
      return;
    }
    const en = str(s.en);
    if (!en) errors.push(`${where}: thiếu câu tiếng Anh ("en").`);
    else if (wordCount(en) > MAX_WORDS) errors.push(`${where}: câu dài quá ${MAX_WORDS} từ.`);
    const vi = str(s.vi);
    if (!vi) warnings.push(`${where}: chưa có tiếng Việt ("vi").`);
    let point = null;
    if (s.point != null) {
      const { x, y } = s.point;
      if (![x, y].every((v) => typeof v === 'number' && v >= 0 && v <= 1)) errors.push(`${where}: vị trí mũi tên phải từ 0 đến 1.`);
      else point = { x, y };
    }
    const from = s.from ?? 'auto';
    if (!FROM_VALUES.includes(from)) errors.push(`${where}: hướng mũi tên "${from}" không hợp lệ.`);
    let hit = s.hit ?? HIT_DEFAULT;
    if (point && (typeof hit !== 'number' || hit < HIT_MIN || hit > HIT_MAX)) {
      warnings.push(`${where}: vùng chạm được chỉnh về khoảng ${HIT_MIN}–${HIT_MAX}.`);
      hit = Math.min(HIT_MAX, Math.max(HIT_MIN, Number(hit) || HIT_DEFAULT));
    }
    let keywords = [];
    if (s.keywords != null) {
      if (!Array.isArray(s.keywords) || !s.keywords.every((k) => typeof k === 'string')) errors.push(`${where}: "keywords" phải là danh sách chữ.`);
      else keywords = s.keywords.map(str).filter(Boolean);
    }
    // Cảnh báo theo cấp độ (mục 2.2).
    if (en) {
      const [lo, hi] = LEVEL_WORDS[level];
      const n = wordCount(en);
      if (n > (i === 0 ? Math.min(7, hi) : hi)) warnings.push(`${where}: ${n} từ — dài hơn mức cấp ${level} (${lo}–${hi} từ).`);
      if (level < 3 && /\b(he|she|it|they)\b/i.test(en) && !/^it is\b/i.test(en)) warnings.push(`${where}: đại từ (he / she / it / they) chỉ nên dùng ở cấp 3.`);
    }
    let sid = str(s.sid);
    if (!sid || usedSid.has(sid)) sid = newSid();
    usedSid.add(sid);
    sentences.push({ sid, en, vi, point, from, hit: point ? hit : HIT_DEFAULT, keywords });
  });
  if (sentences.length && !sentences.some((s) => s.point)) warnings.push('Chưa câu nào có mũi tên — chế độ Tìm trong tranh sẽ không chơi được.');
  if (errors.length) return { ok: false, scene: null, errors, warnings };
  return {
    ok: true,
    errors,
    warnings,
    scene: {
      id: str(data.id) || newSceneId(),
      title,
      titleVi: str(data.titleVi),
      track: data.track === 'book' ? 'book' : 'phonics',
      unit: str(data.unit) || null,
      level,
      sentences,
      builtIn: false,
      createdAt: Number.isFinite(data.createdAt) ? data.createdAt : null,
      updatedAt: Number.isFinite(data.updatedAt) ? data.updatedAt : null,
    },
  };
}

/** Prompt gửi kèm ẢNH tranh cho AI (SPEC-ta-tranh 8.3). `words`: danh sách từ của Unit (không bắt buộc). */
export function scenePrompt({ level = 2, words = '' } = {}) {
  const [lo, hi] = LEVEL_WORDS[level];
  const example = {
    title: 'In the park',
    titleVi: 'Ở công viên',
    level,
    sentences: [
      { en: 'It is a sunny day in the park.', vi: 'Hôm nay trời nắng đẹp ở công viên.', point: null },
      { en: 'A boy is flying a kite.', vi: 'Một bạn trai đang thả diều.', point: { x: 0.4, y: 0.66 }, from: 'left', keywords: ['boy', 'kite'] },
    ],
  };
  return [
    'Đây là một bức tranh. Hãy viết các câu tiếng Anh tả tranh cho bé 6 tuổi (lớp 1, Việt Nam) học trong app Olly English.',
    '',
    'YÊU CẦU:',
    '1. Trả về DUY NHẤT một object JSON đúng cấu trúc ví dụ bên dưới. Không Markdown, không giải thích.',
    `2. Cấp độ ${level}: mỗi câu ${lo}–${hi} từ${level === 1 ? '; chỉ dùng "This is…", "It is…", màu sắc, "is + V-ing"' : level === 2 ? '; được dùng giới từ vị trí (in, on, next to, near, under), quần áo + màu' : '; được dùng and / but và he / she / it / they (chỉ khi câu ngay trước đã nói về đúng người / vật đó)'}.`,
    '3. Câu đầu tả chung cả tranh (≤ 7 từ), "point": null. Mỗi câu sau tả MỘT người / vật chính nhìn thấy rõ, có "point".',
    '4. Viết 5–8 câu. Chỉ tả những gì CÓ trong tranh và nhìn rõ; không bịa người, vật, câu chuyện hay tình huống.',
    `5. "point": vị trí ĐẦU mũi tên, x và y từ 0 đến 1 (0,0 = góc trên trái; 1,1 = góc dưới phải). Đặt ở CẠNH người / vật (thân, tay, mép đồ vật), không đặt giữa mặt người. "from": phía thân mũi tên nằm — một trong: ${FROM_VALUES.join(', ')}. Đây chỉ là ước lượng, bố mẹ sẽ chỉnh lại.`,
    '6. "vi": dịch tự nhiên cả câu, kiểu bố mẹ nói với con. "keywords": 1–3 từ chính của câu.',
    ...(words.trim() ? ['7. Ưu tiên dùng các từ bé đang học:', words.trim()] : []),
    '',
    'VÍ DỤ CẤU TRÚC:',
    JSON.stringify(example, null, 2),
  ].join('\n');
}

/**
 * Prompt VẼ TRANH cho Tả tranh từ các câu đã có (thay tranh có sẵn / tranh mới): mọi người / vật được tả phải có, rõ, không
 * chồng lên nhau; không có chữ. Vẽ xong bố mẹ đặt lại mũi tên.
 */
export function scenePicturePrompt(scene) {
  const overall = scene.sentences.find((s) => !s.point)?.en;
  const parts = scene.sentences.filter((s) => s.point || s !== scene.sentences[0]).map((s) => `- ${s.en}`);
  return [
    `Draw ONE colorful cartoon picture in landscape 4:3 format for a 6-year-old child's English lesson${overall ? `. The scene: "${overall}"` : ''}.`,
    'The picture must clearly show ALL of these, each one easy to see, fully visible and not hidden behind anything:',
    ...parts,
    '',
    'STYLE: bright, friendly children\'s book cartoon, simple shapes, clean outlines. Spread the subjects across the picture so each can be pointed at with an arrow; keep them apart, not overlapping.',
    'Do not add other main characters or objects. No text anywhere: no letters, words, numbers, signs or captions.',
  ].join('\n');
}
