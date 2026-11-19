// 📚 7 truyện Phonics có sẵn (SPEC-story.md mục 9), mỗi nhóm âm 1–7 một truyện: 5 trang, 3 câu hỏi pick → word → order,
// đúng bậc 3.1. Mọi từ đọc được ở nhóm của truyện (test tests/unit/read-story.test.js). Bảng duyệt: STORIES.md
// (node scripts/read-stories-sheet.mjs) — sửa ở file này rồi chạy lại script, không sửa tay STORIES.md.
// Chưa dùng trong app (màn chơi ở Story-a); hình trang tạm là emoji `emoji` của trang.

const story = (s) => ({ version: 1, kind: 'story', track: 'phonics', lessonId: null, builtIn: true, createdAt: 0, updatedAt: 0, ...s });
const page = (id, emoji, ...sentences) => ({
  id, emoji, sentences: sentences.map(([en, vi], i) => ({ id: `${id}s${i + 1}`, en, vi })),
});

export const BUILTIN_STORIES = [
  story({
    id: 'story-g1-pip', group: 1, title: 'Pip the Ant', titleVi: 'Chú kiến Pip', cover: '🐜',
    characters: 'Pip: a tiny smiling black ant with big round eyes. Nan: a girl with two short black pigtails and a yellow dress.',
    setting: 'a cosy kitchen table with a small round tin box on it',
    pages: [
      page('p1', '🐜', ['Pip is an ant.', 'Pip là một chú kiến.']),
      page('p2', '🐜🥫', ['Pip naps in a tin.', 'Pip ngủ trong một cái hộp thiếc.']),
      page('p3', '👧🥫', ['Nan taps the tin.', 'Nan gõ vào cái hộp.'], ['Tap, tap, tap!', 'Cốc, cốc, cốc!']),
      page('p4', '🐜💫', ['Pip spins in the tin.', 'Pip xoay vòng vòng trong hộp.']),
      page('p5', '👧🐜', ['Nan pats Pip.', 'Nan vuốt ve Pip.'], ['Pip naps in the tin.', 'Pip lại ngủ trong hộp.']),
    ],
    questions: [
      { id: 'q1', type: 'pick', en: 'What is Pip?', vi: 'Pip là con gì?', options: ['ant', 'cat', 'pig'], answer: 'ant',
        emoji: { ant: '🐜', cat: '🐱', pig: '🐷' }, page: 'p1', say: 'Pip is an ant.', explainVi: 'Pip là một chú kiến đấy.' },
      { id: 'q2', type: 'word', en: 'What does Pip do at the end?', vi: 'Cuối truyện Pip làm gì?', options: ['naps', 'spins'], answer: 'naps',
        page: 'p5', say: 'Pip naps in the tin.', explainVi: 'Cuối truyện Pip lại ngủ trong hộp.' },
      { id: 'q3', type: 'order', en: 'What happens first, next and last?', vi: 'Chuyện gì xảy ra trước, sau, cuối cùng?',
        pages: ['p2', 'p3', 'p5'], explainVi: 'Đầu tiên Pip ngủ trong hộp, rồi Nan gõ vào hộp, cuối cùng Nan vuốt ve Pip và Pip lại ngủ.' },
    ],
  }),
  story({
    id: 'story-g2-pam-hen', group: 2, title: 'Pam and the Hen', titleVi: 'Pam và con gà mái', cover: '🐔',
    characters: 'Pam: a girl with curly red hair, a green T-shirt and blue shorts. A plump red hen.',
    setting: 'a farmyard with a red barn, green grass and a brown sack on the ground',
    pages: [
      page('p1', '👧🐔', ['Pam has a hen.', 'Pam có một con gà mái.']),
      page('p2', '🐔', ['The hen is red.', 'Con gà mái màu đỏ.']),
      page('p3', '🐔🛍️', ['It sits in a sack.', 'Nó chui vào một cái bao.']),
      page('p4', '👧🛍️', ['Pam taps the sack.', 'Pam vỗ vỗ vào cái bao.'], ['The sack can peck!', 'Cái bao biết mổ!']),
      page('p5', '👧🐔', ['The hen is in it!', 'Con gà ở trong đó!'], ['Pam pets the hen.', 'Pam vuốt ve con gà mái.']),
    ],
    questions: [
      { id: 'q1', type: 'pick', en: 'What does Pam have?', vi: 'Pam có con gì?', options: ['hen', 'cat', 'ant'], answer: 'hen',
        emoji: { hen: '🐔', cat: '🐱', ant: '🐜' }, page: 'p1', say: 'Pam has a hen.', explainVi: 'Pam có một con gà mái.' },
      { id: 'q2', type: 'word', en: 'Where is the hen?', vi: 'Con gà mái ở đâu?', options: ['sack', 'hat'], answer: 'sack',
        page: 'p3', say: 'It sits in a sack.', explainVi: 'Con gà mái chui vào cái bao.' },
      { id: 'q3', type: 'order', en: 'What happens first, next and last?', vi: 'Chuyện gì xảy ra trước, sau, cuối cùng?',
        pages: ['p3', 'p4', 'p5'], explainVi: 'Đầu tiên gà chui vào bao, rồi Pam vỗ vào bao và cái bao biết mổ, cuối cùng Pam tìm thấy gà.' },
    ],
  }),
  story({
    id: 'story-g3-red-hat', group: 3, title: 'The Red Hat', titleVi: 'Cái mũ đỏ', cover: '👒',
    characters: 'Sam: a small boy with short brown hair, a blue T-shirt and a red hat. A big brown dog with floppy ears.',
    setting: 'a sunny garden with green grass, a fallen log and a white fence',
    pages: [
      page('p1', '👦👒', ['Sam has a red hat.', 'Sam có một cái mũ đỏ.']),
      page('p2', '👒🪵', ['The hat is on a log.', 'Cái mũ ở trên khúc gỗ.']),
      page('p3', '🐕👒', ['A big dog gets the hat!', 'Một con chó to lấy mất cái mũ!']),
      page('p4', '👦🪵', ['Sam is sad.', 'Sam buồn.'], ['He sits on the log.', 'Bạn ấy ngồi trên khúc gỗ.']),
      page('p5', '🐕👦👒', ['The dog drops the hat.', 'Con chó thả cái mũ ra.'], ['Sam gets it and is glad!', 'Sam nhặt lại chiếc mũ và vui lắm!']),
    ],
    questions: [
      { id: 'q1', type: 'pick', en: 'Which animal takes the hat?', vi: 'Con vật nào lấy cái mũ?', options: ['dog', 'cat', 'pig'], answer: 'dog',
        emoji: { dog: '🐶', cat: '🐱', pig: '🐷' }, page: 'p3', say: 'The dog gets the hat.', explainVi: 'Con chó lấy cái mũ của Sam đấy.' },
      { id: 'q2', type: 'word', en: 'Is Sam sad or glad at the end?', vi: 'Cuối truyện Sam buồn hay vui?', options: ['sad', 'glad'], answer: 'glad',
        page: 'p5', say: 'Sam gets it and is glad!', explainVi: 'Con chó thả mũ ra, Sam nhặt lại được nên Sam vui.' },
      { id: 'q3', type: 'order', en: 'What happens first, next and last?', vi: 'Chuyện gì xảy ra trước, sau, cuối cùng?',
        pages: ['p1', 'p3', 'p5'], explainVi: 'Đầu tiên Sam có mũ, rồi con chó lấy mũ, cuối cùng chó thả mũ ra và Sam nhặt lại.' },
    ],
  }),
  story({
    id: 'story-g4-goat-coat', group: 4, title: 'A Coat for the Goat', titleVi: 'Cái áo cho chú dê', cover: '🐐',
    characters: 'Jen: a girl with a long black ponytail, a yellow raincoat and green boots. A small white goat with little horns.',
    setting: 'a small farm field with a wooden fence, grey rain clouds and puddles',
    pages: [
      page('p1', '👧🐐', ['Jen has a goat.', 'Jen có một chú dê.']),
      page('p2', '🐐🌧️', ['The goat is in the rain.', 'Chú dê đang ở ngoài trời mưa.']),
      page('p3', '🐐💧', ['It is sad.', 'Nó buồn thiu.'], ['It needs a coat.', 'Nó cần một cái áo.']),
      page('p4', '👧🧥🐐', ['Jen gets a red coat.', 'Jen lấy một chiếc áo khoác đỏ.'], ['The goat has it on.', 'Chú dê đã mặc chiếc áo đó.']),
      page('p5', '🐐🧥', ['The goat jogs in the rain!', 'Chú dê chạy tung tăng dưới mưa!']),
    ],
    questions: [
      { id: 'q1', type: 'pick', en: 'What does Jen get?', vi: 'Jen lấy cái gì?', options: ['coat', 'hat', 'tie'], answer: 'coat',
        emoji: { coat: '🧥', hat: '🎩', tie: '👔' }, page: 'p4', say: 'Jen gets a red coat.', explainVi: 'Jen lấy một chiếc áo khoác đỏ cho chú dê.' },
      { id: 'q2', type: 'word', en: 'What does the goat do at the end?', vi: 'Cuối truyện chú dê làm gì?', options: ['jogs', 'sleeps'], answer: 'jogs',
        page: 'p5', say: 'The goat jogs in the rain!', explainVi: 'Có áo rồi, chú dê chạy tung tăng dưới mưa.' },
      { id: 'q3', type: 'order', en: 'What happens first, next and last?', vi: 'Chuyện gì xảy ra trước, sau, cuối cùng?',
        pages: ['p2', 'p4', 'p5'], explainVi: 'Đầu tiên chú dê bị mưa, rồi Jen lấy áo, cuối cùng chú dê chạy dưới mưa.' },
    ],
  }),
  story({
    id: 'story-g5-pink-float', group: 5, title: 'The Pink Float', titleVi: 'Chiếc phao hồng', cover: '🛟',
    characters: 'Viv: a girl with short black hair and a purple swimsuit, with a pink swim ring (round float). Ben: a boy with spiky blond hair and green swim shorts.',
    setting: 'a bright outdoor swimming pool with blue water and white tiles',
    pages: [
      page('p1', '👧🛟', ['Viv has a pink float.', 'Viv có một chiếc phao bơi màu hồng.']),
      page('p2', '👧🏊', ['She swims in the pool.', 'Bạn ấy bơi trong bể bơi.']),
      page('p3', '👧🔍', ['The float is lost!', 'Chiếc phao bị mất rồi!'], ['Viv looks for it in the pool.', 'Viv tìm phao trong bể bơi.']),
      page('p4', '👦🏊', ['Ben jumps in to help.', 'Ben nhảy xuống giúp bạn.']),
      page('p5', '👦🛟👧', ['He gets the float!', 'Ben tìm được chiếc phao!'], ['Viv and Ben are glad.', 'Viv và Ben đều vui.']),
    ],
    questions: [
      { id: 'q1', type: 'pick', en: 'What is lost?', vi: 'Cái gì bị mất?', options: ['float', 'hat', 'cup'], answer: 'float',
        emoji: { float: '🛟', hat: '🎩', cup: '🥤' }, page: 'p3', say: 'The float is lost!', explainVi: 'Chiếc phao hồng của Viv bị mất trong bể bơi.' },
      { id: 'q2', type: 'word', en: 'Who gets the float?', vi: 'Ai tìm được chiếc phao?', options: ['Ben', 'Viv'], answer: 'Ben',
        page: 'p5', say: 'Ben gets the float!', explainVi: 'Ben nhảy xuống bể và tìm được chiếc phao.' },
      { id: 'q3', type: 'order', en: 'What happens first, next and last?', vi: 'Chuyện gì xảy ra trước, sau, cuối cùng?',
        pages: ['p3', 'p4', 'p5'], explainVi: 'Đầu tiên chiếc phao bị mất, rồi Ben nhảy xuống giúp, cuối cùng Ben tìm được phao.' },
    ],
  }),
  story({
    id: 'story-g6-big-fish', group: 6, title: 'The Big Fish', titleVi: 'Con cá to', cover: '🐟',
    characters: 'Seth: a boy with messy brown hair, an orange T-shirt and a fishing rod. Dad: a tall man with a short beard, a green cap and a blue shirt.',
    setting: 'a green pond with a small wooden dock and tall reeds',
    pages: [
      page('p1', '👦👨🎣', ['Seth and his dad go fishing.', 'Seth và bố đi câu cá.']),
      page('p2', '👦👨', ['They sit on the dock.', 'Hai bố con ngồi trên cầu gỗ.']),
      page('p3', '👦🐟', ['Seth gets a big fish!', 'Seth câu được một con cá to!'], ['It tugs and tugs.', 'Con cá giật mạnh, giật mạnh.']),
      page('p4', '👦💦', ['Seth slips and lands in the pond!', 'Seth trượt chân và rơi xuống ao!']),
      page('p5', '👨👦🐟', ['Dad helps Seth and gets the fish.', 'Bố giúp Seth rồi lấy con cá lên.'], ['The fish is for lunch!', 'Con cá để dành cho bữa trưa!']),
    ],
    questions: [
      { id: 'q1', type: 'pick', en: 'What does Seth get?', vi: 'Seth câu được gì?', options: ['fish', 'frog', 'duck'], answer: 'fish',
        emoji: { fish: '🐟', frog: '🐸', duck: '🦆' }, page: 'p3', say: 'Seth gets a big fish!', explainVi: 'Seth câu được một con cá to.' },
      { id: 'q2', type: 'word', en: 'Where does Seth land?', vi: 'Seth rơi xuống đâu?', options: ['pond', 'dock'], answer: 'pond',
        page: 'p4', say: 'Seth lands in the pond!', explainVi: 'Con cá kéo mạnh nên Seth rơi xuống ao.' },
      { id: 'q3', type: 'order', en: 'What happens first, next and last?', vi: 'Chuyện gì xảy ra trước, sau, cuối cùng?',
        pages: ['p1', 'p4', 'p5'], explainVi: 'Đầu tiên hai bố con đi câu, rồi Seth rơi xuống ao, cuối cùng bố giúp Seth rồi lấy con cá lên.' },
    ],
  }),
  story({
    id: 'story-g7-lost-coin', group: 7, title: 'The Lost Coin', titleVi: 'Đồng xu bị mất', cover: '🪙',
    characters: 'Rex: a boy with curly black hair, a red hoodie and a shiny gold coin. A quick little brown dog with a white tail.',
    setting: 'a park with a big sandpit, trees and a bench',
    pages: [
      page('p1', '👦🪙', ['Rex has one coin.', 'Rex có một đồng xu.']),
      page('p2', '👦🏞️', ['Rex runs to the park.', 'Rex chạy ra công viên.']),
      page('p3', '🪙🏖️', ['The coin drops in the sand.', 'Đồng xu rơi xuống cát.'], ['Rex looks and looks.', 'Rex tìm mãi, tìm mãi.']),
      page('p4', '🐕', ['A quick dog digs in the sand.', 'Một chú chó nhanh nhẹn bới cát.'], ['Then the dog barks!', 'Rồi chú chó sủa vang!']),
      page('p5', '🐕🪙👦', ['It digs up the coin!', 'Chú chó đào được đồng xu lên!'], ['Rex is so glad.', 'Rex vui lắm.']),
    ],
    questions: [
      { id: 'q1', type: 'pick', en: 'Who finds the coin?', vi: 'Ai tìm thấy đồng xu?', options: ['dog', 'cat', 'duck'], answer: 'dog',
        emoji: { dog: '🐶', cat: '🐱', duck: '🦆' }, page: 'p5', say: 'The dog digs up the coin!', explainVi: 'Chú chó bới cát và đào được đồng xu lên.' },
      { id: 'q2', type: 'word', en: 'Where does the coin drop?', vi: 'Đồng xu rơi ở đâu?', options: ['sand', 'pond'], answer: 'sand',
        page: 'p3', say: 'The coin drops in the sand.', explainVi: 'Đồng xu rơi xuống cát ở công viên.' },
      { id: 'q3', type: 'order', en: 'What happens first, next and last?', vi: 'Chuyện gì xảy ra trước, sau, cuối cùng?',
        pages: ['p2', 'p3', 'p5'], explainVi: 'Đầu tiên Rex chạy ra công viên, rồi đồng xu rơi xuống cát, cuối cùng chú chó tìm thấy đồng xu.' },
    ],
  }),
];
