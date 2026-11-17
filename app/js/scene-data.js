// Dữ liệu tranh của Tả tranh (SPEC-ta-tranh mục 7): kiểm tra khi lưu / dán JSON từ AI (bảng 7.4), prompt AI (8.3).
// Hàm thuần, không DOM.

import { parseLessonText } from './lesson.js';
import { FROM_VALUES, HIT_DEFAULT, HIT_MIN, HIT_MAX, normalizeBox, arrowForBox } from './scene.js';

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
    // Tâm đối tượng (không bắt buộc): vùng chạm / vòng sáng bao quanh đối tượng khi mũi tên đặt cạnh đối tượng.
    let at = null;
    if (point && s.at != null) {
      const { x, y } = s.at;
      if (![x, y].every((v) => typeof v === 'number' && v >= 0 && v <= 1)) errors.push(`${where}: vị trí đối tượng ("at") phải từ 0 đến 1.`);
      else at = { x, y };
    }
    let from = s.from ?? 'auto';
    if (!FROM_VALUES.includes(from)) errors.push(`${where}: hướng mũi tên "${from}" không hợp lệ.`);
    // Khung đối tượng (mục 4.5): vùng chạm phủ trọn người / vật. AI chỉ gửi khung → app tự đặt mũi tên ở cạnh khung.
    let objBox = null;
    if (s.box != null) {
      objBox = normalizeBox(s.box);
      if (!objBox) errors.push(`${where}: khung ("box") phải có x, y, w, h là số từ 0 đến 1.`);
      else if (!point) ({ point, from } = arrowForBox(objBox));
    }
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
    sentences.push({ sid, en, vi, point, ...(objBox ? { box: objBox } : at ? { at } : {}), from, hit: point ? hit : HIT_DEFAULT, keywords });
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

/**
 * Prompt gửi kèm ẢNH tranh cho AI (SPEC-ta-tranh 8.3). `words`: danh sách từ của Unit (không bắt buộc).
 * `topic`: mã chủ đề tranh vừa vẽ bằng `sceneTopicPrompt` (mục 8.5) — AI biết tên tranh và những gì ĐỊNH vẽ, nhưng chỉ tả
 * những gì thật sự thấy trong ảnh (AI vẽ có thể thiếu / khác).
 */
export function scenePrompt({ level = 2, words = '', topic = null } = {}) {
  const [lo, hi] = LEVEL_WORDS[level];
  const t = topic ? SCENE_TOPIC_BY_ID.get(topic) : null;
  const example = {
    title: t?.title ?? 'In the park',
    titleVi: t?.titleVi ?? 'Ở công viên',
    level,
    sentences: [
      { en: 'It is a sunny day in the park.', vi: 'Hôm nay trời nắng đẹp ở công viên.', box: null },
      { en: 'A boy is flying a kite.', vi: 'Một bạn trai đang thả diều.', box: { x: 0.32, y: 0.4, w: 0.18, h: 0.45 }, keywords: ['boy', 'kite'] },
    ],
  };
  return [
    'Đây là một bức tranh. Hãy viết các câu tiếng Anh tả tranh cho bé 6 tuổi (lớp 1, Việt Nam) học trong app Olly English.',
    ...(t ? [
      '',
      `Tranh được vẽ theo chủ đề "${t.title}" (${t.titleVi}): ${t.scene}. Lúc vẽ đã yêu cầu có:`,
      ...topicThings(t, level).map((x) => `- ${x}`),
      `Dùng "title": "${t.title}", "titleVi": "${t.titleVi}". Mỗi thứ trên mà NHÌN RÕ trong ảnh thì tả một câu; thứ nào không có hoặc khác trong ảnh thì tả theo đúng ảnh, không theo danh sách.`,
    ] : []),
    '',
    'YÊU CẦU:',
    '1. Trả về DUY NHẤT một object JSON đúng cấu trúc ví dụ bên dưới. Không Markdown, không giải thích.',
    `2. Cấp độ ${level}: mỗi câu ${lo}–${hi} từ${level === 1 ? '; chỉ dùng "This is…", "It is…", màu sắc, "is + V-ing"' : level === 2 ? '; được dùng giới từ vị trí (in, on, next to, near, under), quần áo + màu' : '; được dùng and / but và he / she / it / they (chỉ khi câu ngay trước đã nói về đúng người / vật đó)'}.`,
    '3. Câu đầu tả chung cả tranh (≤ 7 từ), "box": null. Mỗi câu sau tả MỘT người / vật chính nhìn thấy rõ, có "box".',
    '4. Viết 5–8 câu. Chỉ tả những gì CÓ trong tranh và nhìn rõ; không bịa người, vật, câu chuyện hay tình huống.',
    '5. "box": KHUNG CHỮ NHẬT bao trọn người / vật được tả (cả người từ đầu tới chân, cả đồ vật), dạng {"x", "y", "w", "h"} — tỉ lệ 0 đến 1 của ảnh: x, y = góc trên trái của khung (0,0 = góc trên trái ảnh), w, h = rộng, cao (so với cả ảnh). Khung sát người / vật, không bao người / vật khác. Không cần "point" — app tự đặt mũi tên cạnh khung; bố mẹ sẽ kiểm tra từng khung.',
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

// ---------- Tranh mới theo chủ đề (SPEC-ta-tranh mục 8.5): chọn chủ đề → prompt vẽ tranh → prompt viết câu ----------
/**
 * Chủ đề có sẵn: cảnh + danh sách người / vật sẽ vẽ (từ dễ của lớp 1). Mức 1 vẽ 5 thứ đầu, mức 2 vẽ 7, mức 3 vẽ cả 8.
 * Thứ tự trong `things`: thứ quan trọng / dễ tả trước.
 */
export const SCENE_TOPICS = [
  { id: 'park', title: 'In the park', titleVi: 'Ở công viên', scene: 'a sunny park with green grass, trees and a small pond', things: [
    'a boy in a blue T-shirt flying a red kite', 'a girl in a pink dress running with a dog', 'a big tree with a yellow ball stuck in it',
    'a grandma sitting on a bench and reading a book', 'two ducks swimming in the pond', 'a boy riding a green bike',
    'a girl eating an ice cream', 'a cat sleeping under the bench'] },
  { id: 'classroom', title: 'In the classroom', titleVi: 'Trong lớp học', scene: 'a bright classroom with desks, a board and big windows', things: [
    'a teacher pointing at the board', 'a girl raising her hand', 'a boy reading a book at his desk', 'a red school bag on the floor',
    'a globe on the teacher\'s desk', 'a girl drawing a picture with crayons', 'a boy sharpening a pencil', 'a clock on the wall'] },
  { id: 'beach', title: 'At the beach', titleVi: 'Ở bãi biển', scene: 'a sunny beach with blue sea, waves and yellow sand', things: [
    'a boy building a sandcastle', 'a girl in a yellow swimsuit swimming in the sea', 'a dad sleeping under a big striped umbrella',
    'a red crab on the sand', 'a small boat on the sea', 'a girl in a green hat collecting shells', 'a dog playing with a ball', 'two birds flying in the sky'] },
  { id: 'kitchen', title: 'In the kitchen', titleVi: 'Trong bếp', scene: 'a cosy family kitchen with a table, a fridge and a stove', things: [
    'a mum cooking soup in a big pot', 'a boy drinking a glass of milk at the table', 'a girl washing apples in the sink',
    'a cat sitting on a chair', 'a bowl of oranges on the table', 'a dad cutting bread', 'a baby eating with a spoon in a high chair', 'a white fridge with a magnet on it'] },
  { id: 'birthday', title: 'A birthday party', titleVi: 'Tiệc sinh nhật', scene: 'a happy birthday party in a living room with balloons', things: [
    'a girl blowing out the candles on a big cake', 'a boy holding a present with a red bow', 'many colorful balloons near the window',
    'a dad taking a photo', 'a boy wearing a party hat and clapping', 'a girl dancing in a purple dress', 'a dog under the table', 'a table with juice and cookies'] },
  { id: 'playground', title: 'At the playground', titleVi: 'Ở sân chơi', scene: 'a school playground with a slide, swings and a sandpit', things: [
    'a girl going down a slide', 'a boy on a swing', 'two children playing in the sandpit', 'a boy kicking a football',
    'a girl skipping with a rope', 'a teacher blowing a whistle', 'a boy climbing on the climbing frame', 'a water bottle on a bench'] },
  { id: 'farm', title: 'On the farm', titleVi: 'Ở nông trại', scene: 'a green farm with a red barn and a fence', things: [
    'a farmer driving a tractor', 'a cow eating grass', 'a girl feeding chickens', 'a pig in the mud', 'a boy holding a small lamb',
    'a horse next to the fence', 'a dog running near the barn', 'a basket of eggs'] },
  { id: 'zoo', title: 'At the zoo', titleVi: 'Ở sở thú', scene: 'a busy zoo on a sunny day', things: [
    'an elephant spraying water', 'a tall giraffe eating leaves', 'a monkey hanging from a tree', 'a girl taking a photo of a lion',
    'a boy holding a balloon', 'a penguin jumping into the water', 'a zookeeper feeding a zebra', 'a family eating ice cream on a bench'] },
  { id: 'supermarket', title: 'At the supermarket', titleVi: 'Ở siêu thị', scene: 'a bright supermarket with shelves of food', things: [
    'a mum pushing a shopping trolley', 'a boy holding a big watermelon', 'a girl choosing bananas', 'a cashier at the till',
    'a dad reading a shopping list', 'a baby sitting in the trolley', 'a shelf with bottles of milk', 'a boy carrying a bag of bread'] },
  { id: 'home', title: 'At home', titleVi: 'Ở nhà', scene: 'a cosy living room in the evening', things: [
    'a dad watching TV on the sofa', 'a girl playing the piano', 'a boy doing homework at a desk', 'a grandma knitting in an armchair',
    'a cat playing with a ball of wool', 'a mum watering a plant', 'a baby playing with blocks on the rug', 'a lamp next to the sofa'] },
];
export const SCENE_TOPIC_BY_ID = new Map(SCENE_TOPICS.map((t) => [t.id, t]));
/** Số người / vật vẽ theo cấp độ câu. */
export const TOPIC_THINGS = { 1: 5, 2: 7, 3: 8 };
export const topicThings = (topic, level = 2) => topic.things.slice(0, TOPIC_THINGS[level] ?? TOPIC_THINGS[2]);

/** Prompt VẼ TRANH theo chủ đề (bố mẹ chép sang ChatGPT / Gemini): khung 4:3, mọi người / vật tách rời, không chữ. */
export function sceneTopicPrompt(topicId, level = 2) {
  const topic = SCENE_TOPIC_BY_ID.get(topicId);
  if (!topic) return '';
  return [
    `Draw ONE colorful cartoon picture for a 6-year-old child's English lesson ("Picture talk"): ${topic.scene}.`,
    'FORMAT: landscape 4:3 (for example 1200 × 900 pixels); the scene fills the whole picture, no border.',
    'The picture must clearly show ALL of these, each one big enough to point at with an arrow, fully visible, not hidden behind anything and not overlapping each other:',
    ...topicThings(topic, level).map((t) => `- ${t}`),
    '',
    'LAYOUT: spread them across the whole picture (left, middle and right; front and back) with some empty space between them.',
    "STYLE: bright, friendly children's book cartoon, simple shapes, clean thick outlines, cheerful faces, soft daylight colors.",
    'Do not add other main characters or big objects. No text anywhere: no letters, words, numbers, signs or captions.',
  ].join('\n');
}
