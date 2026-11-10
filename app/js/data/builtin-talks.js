// Bài Talk có sẵn (SPEC 3.3.1): 6 chủ đề hằng ngày cho bé lớp 1, mỗi bài một hội thoại 4 lượt.
// Câu ngắn, mẫu câu thường gặp ở sách lớp 1 (What's your name? / What colour is it? / What is it? / Who is she?…),
// không chép nội dung sách nào. Tên nhân vật phụ là bạn của Olly, không viết cứng tên "Olly".

import { validateLesson } from '../lesson.js';

const T = (id, ask, askVi, answer, answerVi, keywords, extra = {}) => ({ id, ask, askVi, answer, answerVi, keywords, ...extra });

const TALKS = [
  {
    id: 'talk-hello', title: 'Hello!', titleVi: 'Chào hỏi', partner: { name: 'Mimi', emoji: '🐱' },
    turns: [
      T('t1', "Hi! I'm Mimi. What's your name?", 'Chào bạn! Mình là Mimi. Bạn tên là gì?', 'My name is {name}.', 'Mình tên là {name}.', ['{name}', 'name'],
        { starter: 'My name is', reply: 'Nice to meet you!' }),
      T('t2', 'How are you?', 'Bạn có khỏe không?', "I'm fine, thank you.", 'Mình khỏe, cảm ơn bạn.', ['fine', 'thank you', 'good', 'great'],
        { starter: "I'm", reply: 'Me too!' }),
      T('t3', 'How old are you?', 'Bạn mấy tuổi?', "I'm six.", 'Mình sáu tuổi.', ['six', 'seven', 'five', 'years'],
        { starter: "I'm", reply: 'Wow! Six!' }),
      T('t4', 'Goodbye!', 'Tạm biệt nhé!', 'Goodbye, Mimi!', 'Tạm biệt Mimi!', ['goodbye', 'bye'], { starter: 'Goodbye' }),
    ],
  },
  {
    id: 'talk-colours', title: 'Colours', titleVi: 'Màu sắc', partner: { name: 'Bobo', emoji: '🐻' },
    turns: [
      T('t1', 'What colour is the apple?', 'Quả táo màu gì?', 'It is red.', 'Nó màu đỏ.', ['red'], { emoji: '🍎', reply: 'Yes, red!' }),
      T('t2', 'What colour is the banana?', 'Quả chuối màu gì?', 'It is yellow.', 'Nó màu vàng.', ['yellow'], { emoji: '🍌', reply: 'Yummy!' }),
      T('t3', 'What colour is the frog?', 'Con ếch màu gì?', 'It is green.', 'Nó màu xanh lá.', ['green'], { emoji: '🐸', reply: 'Ribbit!' }),
      T('t4', 'What colour is the whale?', 'Con cá voi màu gì?', 'It is blue.', 'Nó màu xanh dương.', ['blue'], { emoji: '🐳', reply: 'Splash!' }),
    ],
  },
  {
    id: 'talk-toys', title: 'My toys', titleVi: 'Đồ chơi của mình', partner: { name: 'Pip', emoji: '🐶' },
    turns: [
      T('t1', 'What is it?', 'Đây là cái gì?', 'It is a car.', 'Đó là cái ô tô.', ['car'], { emoji: '🚗', reply: 'Beep beep!' }),
      T('t2', 'What is it?', 'Đây là cái gì?', 'It is a ball.', 'Đó là quả bóng.', ['ball'], { emoji: '⚽', reply: 'Let’s play!' }),
      T('t3', 'What is it?', 'Đây là cái gì?', 'It is a kite.', 'Đó là con diều.', ['kite'], { emoji: '🪁', reply: 'It can fly!' }),
      T('t4', 'Is it a robot?', 'Đây có phải con rô-bốt không?', 'Yes, it is.', 'Đúng rồi.', ['yes', 'robot'], { emoji: '🤖', starter: 'Yes,', reply: 'Cool!' }),
    ],
  },
  {
    id: 'talk-animals', title: 'Animals', titleVi: 'Con vật', partner: { name: 'Lulu', emoji: '🐰' },
    turns: [
      T('t1', 'What is it?', 'Đây là con gì?', 'It is a dog.', 'Đó là con chó.', ['dog'], { emoji: '🐶', reply: 'Woof!' }),
      T('t2', 'Is it a dog?', 'Đây có phải con chó không?', 'No, it is a cat.', 'Không, đó là con mèo.', ['no', 'cat'], { emoji: '🐱', starter: 'No, it is a', reply: 'Meow!' }),
      T('t3', 'Can a fish swim?', 'Cá có biết bơi không?', 'Yes, it can.', 'Có, nó biết bơi.', ['yes', 'can'], { emoji: '🐟', starter: 'Yes,', reply: 'Swim, swim!' }),
      T('t4', 'Can a bird fly?', 'Chim có biết bay không?', 'Yes, it can.', 'Có, nó biết bay.', ['yes', 'can'], { emoji: '🐦', starter: 'Yes,', reply: 'Tweet!' }),
    ],
  },
  {
    id: 'talk-family', title: 'My family', titleVi: 'Gia đình', partner: { name: 'Mimi', emoji: '🐱' },
    turns: [
      T('t1', 'Who is she?', 'Đây là ai?', 'She is my mother.', 'Đó là mẹ của mình.', ['mother', 'mom', 'mum', 'mummy'], { emoji: '👩', starter: 'She is my', reply: 'She is nice!' }),
      T('t2', 'Who is he?', 'Đây là ai?', 'He is my father.', 'Đó là bố của mình.', ['father', 'dad', 'daddy'], { emoji: '👨', starter: 'He is my', reply: 'He is tall!' }),
      T('t3', 'Who is he?', 'Đây là ai?', 'He is my brother.', 'Đó là anh / em trai của mình.', ['brother'], { emoji: '👦', starter: 'He is my' }),
      T('t4', 'Who is she?', 'Đây là ai?', 'She is my sister.', 'Đó là chị / em gái của mình.', ['sister'], { emoji: '👧', starter: 'She is my', reply: 'I love my family!' }),
    ],
  },
  {
    id: 'talk-food', title: 'Food', titleVi: 'Đồ ăn', partner: { name: 'Bobo', emoji: '🐻' },
    turns: [
      T('t1', 'Do you like pizza?', 'Bạn có thích pizza không?', 'Yes, I do.', 'Có, mình thích.', ['yes', 'no', 'do', "don't"], { emoji: '🍕', starter: 'Yes,', reply: 'Me too!' }),
      T('t2', 'What do you like?', 'Bạn thích món gì?', 'I like ice cream.', 'Mình thích kem.', ['ice cream', 'like'], { emoji: '🍦', starter: 'I like', reply: 'Yummy!' }),
      T('t3', 'Do you want some milk?', 'Bạn có muốn uống sữa không?', 'Yes, please.', 'Có, cho mình xin.', ['yes', 'please', 'no', 'thank'], { emoji: '🥛', starter: 'Yes,', reply: 'Here you are!' }),
      T('t4', 'Here you are!', 'Của bạn đây!', 'Thank you!', 'Cảm ơn bạn!', ['thank', 'thanks'], { emoji: '🍪', reply: "You're welcome!" }),
    ],
  },
];

/** Gói bài Talk có sẵn (mạch "phonics" = tab 💬 Hằng ngày của khu Talk), đã qua kiểm tra. */
export const BUILTIN_TALKS = TALKS.map((d) => {
  const r = validateLesson({
    version: 1,
    kind: 'lesson',
    id: d.id,
    track: 'phonics',
    title: d.title,
    titleVi: d.titleVi,
    words: [],
    dialogues: [{ id: 'd1', title: d.title, titleVi: d.titleVi, partner: d.partner, turns: d.turns }],
    activities: [{ type: 'talk', items: ['d1'] }],
  }, { builtIn: true });
  if (!r.ok) throw new Error(`Bài Talk có sẵn ${d.id} lỗi: ${r.errors.join('; ')}`);
  return { ...r.lesson, emoji: d.partner.emoji };
});
