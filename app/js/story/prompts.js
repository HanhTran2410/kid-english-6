// 📚 Truyện ngắn — prompt AI ở Góc bố mẹ (SPEC-story 8.4, 8.5): viết truyện (JSON đúng 8.2), vẽ MỘT ảnh lưới cho cả
// truyện (bốn lớp giữ hình đồng nhất), vẽ lại một trang (gửi kèm ảnh lưới làm ảnh mẫu). Hàm thuần.

import { GROUPS } from '../phonics.js';
import { STORY_LEVELS, levelOf } from './words.js';

/** Một dòng nét vẽ dùng chung cho MỌI truyện (8.4 lớp 3). */
export const STORY_ART_STYLE = 'Flat cartoon illustration for young children, thick dark outlines, soft bright colours, simple background, same art style and same setting in every panel.';

/** Lưới cho n trang (8.4): 4 → 2 × 2 ảnh vuông; 5–6 → 3 × 2 ảnh ngang 3:2. Ô luôn vuông. */
export const storyGridShape = (n) => (n <= 4 ? { cols: 2, rows: 2, aspect: '1:1 square', ratio: 1 } : { cols: 3, rows: 2, aspect: '3:2 landscape', ratio: 1.5 });

/** Mô tả cảnh của trang: `imagePrompt`, không có thì chính câu tiếng Anh của trang (8.4). */
export const sceneOf = (page) => page.imagePrompt || page.sentences.map((s) => s.en).join(' ');

/** Prompt vẽ MỘT ảnh lưới cho cả truyện. */
export function storyGridPrompt(story) {
  const n = story.pages.length;
  const { cols, rows, aspect } = storyGridShape(n);
  const cells = cols * rows;
  const lines = [
    `Create ONE ${aspect} image for a children's picture book, divided into exactly ${cols} columns × ${rows} rows of EQUAL square panels, separated by straight thin white lines. Each panel is a separate, complete picture — not part of one wide panorama. Nothing crosses from one panel into another. No outer border, no decorative frames.`,
    '',
    `ART STYLE: ${STORY_ART_STYLE}`,
    '',
    `CHARACTERS (draw them exactly like this in EVERY panel — same face, same hair colour, same clothes in every panel): ${story.characters}`,
    'No extra main characters: only the characters above plus the animals / objects the story mentions.',
  ];
  if (story.setting) lines.push(`All panels take place in: ${story.setting}.`);
  lines.push('', 'PANELS — left to right, top to bottom (the descriptions are for you only — never write them in the image):');
  story.pages.forEach((p, i) => lines.push(`Panel ${i + 1}: ${sceneOf(p)}`));
  if (cells > n) {
    lines.push(`Only Panels 1–${n} contain story scenes. ${Array.from({ length: cells - n }, (_, k) => `Panel ${n + k + 1}`).join(', ')} ${cells - n > 1 ? 'are' : 'is'} reserved: completely empty pure white (#FFFFFF), with absolutely no characters, objects, decorations, shadows, textures or scene elements.`);
  }
  lines.push('',
    'RULES',
    '- One scene per panel. Characters are drawn whole (head to feet), centred, never cut off at the panel edge; leave a little empty space around the edge of each panel.',
    '- No text anywhere: no letters, words, speech bubbles, page numbers, captions, logos or watermarks.');
  return lines.join('\n');
}

/** Tỉ lệ của ảnh trang hiện tại, làm tròn về một khổ app AI vẽ được (8.4 vẽ lại một ô). */
export function ratioLabel(width, height) {
  if (!width || !height) return 'square 1:1';
  const r = width / height;
  const options = [[1, 'square 1:1'], [4 / 3, '4:3 landscape'], [1.5, '3:2 landscape']];
  return options.reduce((best, o) => (Math.abs(o[0] - r) < Math.abs(best[0] - r) ? o : best))[1];
}

/** Prompt vẽ lại MỘT trang, gửi kèm ảnh lưới (hoặc ảnh một trang khác khi không còn ảnh lưới gốc). */
export function storyRedrawPrompt(story, page, { ratio = 'square 1:1', hasGrid = true } = {}) {
  const n = story.pages.findIndex((p) => p.id === page.id) + 1;
  const ref = hasGrid ? `The attached image is a picture grid for a children's story. Draw ONLY the scene of Panel ${n} again` : 'The attached image is a page from the same children\'s story. Draw this NEW scene';
  return [
    `${ref}, as ONE single ${ratio} picture: ${sceneOf(page)}`,
    `Keep exactly the same characters as in the attached picture (${story.characters}) — same faces, hair colour, clothes and accessories, and the same number of characters in this scene.`,
    `Same setting${story.setting ? ` (${story.setting})` : ''} and same art style and colours. ${STORY_ART_STYLE}`,
    'Do not add any character or object that is not in the scene description.',
    'One single picture only: no grid, no panel lines, no text, no page numbers.',
  ].join('\n');
}

/**
 * Prompt viết truyện (8.5): AI trả MỘT JSON đúng SPEC-story 8.2. Nguồn: một bài Theo sách (từ + câu của Unit) hoặc một
 * nhóm âm Phonics. App đưa vào danh sách âm + tricky bé đã học (cùng nguồn với phân loại từ 3.2).
 * @param {{ group: number, lesson?: object, idea?: string, pages?: number, tricky: string[] }} opts
 */
export function storyWritingPrompt({ group, lesson = null, idea = '', pages = 5, tricky = [] }) {
  const level = levelOf(group);
  const L = STORY_LEVELS[level];
  const graphemes = GROUPS.filter((g) => g.group <= group).flatMap((g) => g.graphemes);
  const source = lesson
    ? [
      `SOURCE: textbook unit "${lesson.title}"${lesson.unit ? ` (${lesson.unit})` : ''}.`,
      `Unit words (use as many as fit naturally): ${lesson.words.map((w) => w.en).join(', ')}.`,
      lesson.sentences?.length ? `Unit sentence patterns: ${lesson.sentences.map((s) => s.en).join(' / ')}.` : '',
      'Other words: only very common words a Grade 1 child already knows; keep words the child cannot sound out to a minimum.',
    ]
    : [
      `SOURCE: phonics group ${group}. EVERY word must be decodable with ONLY these letter sounds: ${graphemes.join(' ')} — or be one of these tricky words: ${tricky.join(', ')}.`,
      'Do not use vowel spellings the child has not learned (no ea, ay, ow, ir, ur, igh, silent e, y as a vowel…). The main character\'s name must also be decodable.',
    ];
  const pron = L.noPronouns.length ? `Do not use the pronouns: ${L.noPronouns.join(', ')}.` : 'Pronouns are fine.';
  return [
    'You write very short picture-book stories for a 6-year-old Vietnamese child learning to read English (Grade 1).',
    'Reply with ONE JSON object only — no Markdown, no explanation.',
    '',
    ...source.filter(Boolean),
    idea ? `STORY IDEA (from the parent, in Vietnamese or English): ${idea}` : 'STORY IDEA: your choice — something a 6-year-old knows (home, school, park, pets, food, toys).',
    '',
    'STORY RULES',
    `- Exactly ${pages} pages; each page has 1–2 sentences; each sentence has ${L.words[0]}–${L.words[1]} words. Present simple / present continuous only.`,
    `- ${pron} A pronoun may only refer to the person / thing named in the sentence right before it.`,
    '- One main character with a short name. Beginning – something happens – happy ending.',
    '- Every sentence has a natural Vietnamese translation ("vi").',
    '',
    'QUESTIONS — exactly 3, in this order, each about a DIFFERENT detail:',
    '1. "pick": who / what (a character, animal or object) — 3 options, each a single noun with an "emoji" map, "answer" one of them.',
    '2. "word": a feeling, state or result — 2–3 short options the child can read, "answer" one of them.',
    '3. "order": "What happens first, next and last?" — "pages": 3 page ids in the right order, three clearly different events.',
    'Questions 1–2 need "page" (the page that shows the answer) and "say" (the full answer sentence). Every question needs "vi" (Vietnamese question) and "explainVi" (a short Vietnamese explanation for a child).',
    '',
    'IMAGES: "characters" describes every character with fixed, easy-to-see details (hair colour, clothes colour, accessories); "setting" is the one place where the story happens; each page has "imagePrompt" (one sentence describing the scene) and "emoji" (1–3 emoji for the scene, different on every page).',
    '',
    'JSON SHAPE',
    JSON.stringify({
      version: 1, kind: 'story', id: 'auto', track: lesson ? 'book' : 'phonics', group, lessonId: lesson ? lesson.id : null,
      title: '…', titleVi: '…', cover: '🙂', characters: '…', setting: '…',
      pages: [{ id: 'p1', emoji: '…', imagePrompt: '…', sentences: [{ id: 'p1s1', en: '…', vi: '…' }] }],
      questions: [
        { id: 'q1', type: 'pick', en: '…?', vi: '…?', options: ['…', '…', '…'], answer: '…', emoji: { '…': '🙂' }, page: 'p3', say: '…', explainVi: '…' },
        { id: 'q2', type: 'word', en: '…?', vi: '…?', options: ['…', '…'], answer: '…', page: 'p5', say: '…', explainVi: '…' },
        { id: 'q3', type: 'order', en: 'What happens first, next and last?', vi: 'Chuyện gì xảy ra trước, sau, cuối cùng?', pages: ['p1', 'p3', 'p5'], explainVi: '…' },
      ],
    }, null, 1),
  ].join('\n');
}
