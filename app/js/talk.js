// Khu 💬 Talk (SPEC 3.3): hàm thuần, không DOM — mức hỗ trợ, phần đầu câu, từ khóa, tên bé, kết quả một lần nghe.

import { keywordsFor, matches } from './match.js';
import { tokenize } from './text.js';

/** Ba mức hỗ trợ (3.3). Sao của bài Talk = số của mức bé đã làm xong (3.3.3). */
export const TALK_LEVELS = [
  { level: 1, emoji: '👂', en: 'Listen and say', vi: 'Nghe – nhắc lại' },
  { level: 2, emoji: '🧩', en: 'Finish it', vi: 'Nói tiếp' },
  { level: 3, emoji: '💬', en: 'Talk by yourself', vi: 'Tự trả lời' },
];

/** Mức sáng khi vào bài: mức kế tiếp chưa làm (đã làm mức 3 thì vẫn mức 3). */
export const suggestedLevel = (bestStars = 0) => Math.min(3, Math.max(1, bestStars + 1));

const NAME = /\{name\}/g;
export const needsName = (turn) => /\{name\}/.test(`${turn.answer} ${(turn.keywords ?? []).join(' ')}`);

/** Thay {name} bằng tên bé. */
export const withName = (text, name) => String(text ?? '').replace(NAME, String(name ?? '').trim());

/** Lượt chơi được: lượt có {name} cần tên bé (chưa nhập tên → bỏ qua lượt đó). */
export const playableTurns = (dialogue, name) => dialogue.turns.filter((t) => !needsName(t) || String(name ?? '').trim());

/** Từ khóa của lượt (đã thay tên): có sẵn trong dữ liệu, không có thì lấy từ chính của câu mẫu. */
export function turnKeywords(turn, name = '') {
  if (turn.keywords?.length) return turn.keywords.map((k) => withName(k, name)).filter((k) => k.trim());
  return keywordsFor('', withName(turn.answer, name));
}

/**
 * Phần đầu câu cho mức 2 ("I am…"): `starter` có sẵn, không có thì các từ đứng trước từ khóa đầu tiên của câu mẫu;
 * không tìm được (từ khóa ở đầu câu) thì nửa đầu câu. Trả về chữ gốc của câu mẫu (giữ hoa / thường, bỏ dấu câu cuối).
 */
export function starterOf(turn, name = '') {
  if (turn.starter) return withName(turn.starter, name).replace(/[.!?…\s]+$/, '');
  const answer = withName(turn.answer, name);
  const words = answer.split(/\s+/).filter(Boolean);
  const keys = new Set(turnKeywords(turn, name).flatMap((k) => tokenize(k)));
  let cut = words.findIndex((w) => tokenize(w).some((t) => keys.has(t)));
  if (cut <= 0) cut = Math.max(1, Math.floor(words.length / 2));
  return words.slice(0, cut).join(' ').replace(/[,.!?…]+$/, '');
}

/** Kết quả một lần nghe ở Talk (3.3.2): chỉ để khen / nhắc, không phán bé sai. */
export const TALK = {
  MATCH: 'match', // nghe ra từ khóa
  OTHER: 'other', // nghe ra chữ nhưng không có từ khóa
  UNHEARD: 'unheard', // có tiếng, máy không ra chữ
  SAID: 'said', // có tiếng, máy không có nhận dạng → coi như bé đã nói
  SILENT: 'silent',
  NONE: 'none', // không có mic → nút ✅
};

/**
 * @param {{ micReady: boolean, recognizing: boolean, voiced: boolean, heard: string[] }} state
 * @param {string[]} keywords
 */
export function talkOutcome({ micReady, recognizing, voiced, heard }, keywords) {
  if (!micReady) return TALK.NONE;
  const alts = (heard ?? []).filter((x) => String(x).trim());
  if (alts.length && matches(alts, keywords)) return TALK.MATCH;
  if (alts.length) return TALK.OTHER;
  if (!voiced) return TALK.SILENT;
  return recognizing ? TALK.UNHEARD : TALK.SAID;
}
