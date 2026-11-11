// Năm khu học của app (SPEC.md mục 3; khu 🔢 Math: SPEC-math.md). Mỗi khu một màu, một câu Olly nói khi mở.
// `ready: false`: khu chưa làm — màn chính hiện thẻ mờ "Sắp mở", chạm vào thì Olly nói một câu tiếng Việt (SPEC 3.0).

export const ZONES = [
  { id: 'read', emoji: '📖', en: 'Read', vi: 'Tập đọc', color: 'sky', intro: "Let's read together!", ready: true },
  { id: 'spell', emoji: '✏️', en: 'Spell', vi: 'Đánh vần và viết', color: 'mint', intro: "Let's spell some words!", ready: true },
  { id: 'talk', emoji: '💬', en: 'Talk', vi: 'Nói chuyện', color: 'coral', intro: "Let's have a chat!", ready: true },
  { id: 'quest', emoji: '🧩', en: 'Quest', vi: 'Thử thách', color: 'lilac', intro: 'Are you ready for a quest?', ready: false },
  { id: 'math', emoji: '🔢', en: 'Math', vi: 'Toán', color: 'sun', intro: "Let's play with numbers!", ready: true },
];

export const ZONE_BY_ID = new Map(ZONES.map((z) => [z.id, z]));

/** Câu chào ở màn chính: có tên bé thì gọi tên. */
export function greeting(childName) {
  const name = String(childName ?? '').trim();
  return name ? `Hi, ${name}! What do you want to do today?` : 'Hi! What do you want to do today?';
}
