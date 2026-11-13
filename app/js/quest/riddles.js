// 🧩 Quest 3 — câu đố viết sẵn cho 67 từ có hình (SPEC-quest.md mục 6.3). Bố mẹ duyệt bảng (QUEST-RIDDLES.md) trước
// khi phát hành. Mỗi cặp gợi ý: câu 1 nói chung (loại, chỗ…), câu 2 nói một đặc điểm `trait`. Đáp án duy nhất theo
// nghĩa: lựa chọn nhiễu không được có `trait` của câu 2 — bảng TRAITS ghi MỌI từ mà câu đó đúng (kể cả "có thể đúng",
// vd. chó cũng bơi được) để không bao giờ lấy làm nhiễu. Số viết bằng chữ số (Olly đọc, bé không cần đánh vần).
// Nhóm đọc được của cặp gợi ý / câu tổng kết luôn TÍNH bằng canRead (không ghi tay).

import { canRead, learnedPhonics } from './content.js';
import { toGraphemes, learnedGraphemes, soundOfGrapheme } from '../phonics.js';

/**
 * Loại từ (chọn nhiễu theo mức 6.2). Mức 2–3 chỉ lấy nhiễu CÙNG loại, không mượn loại khác: thiếu nhiễu thì mức 3 bớt
 * còn 3 lựa chọn, vẫn thiếu thì không dùng từ đó ở mức đó (mức 1 nhiễu khác loại, luôn dùng được).
 */
export const KINDS = {
  animal: 'con vật', person: 'người', food: 'đồ ăn', thing: 'đồ vật', vehicle: 'xe cộ', nature: 'thiên nhiên',
  body: 'cơ thể', number: 'số', colour: 'màu', action: 'việc làm', place: 'nơi chốn',
};

/** Đặc điểm → [nghĩa tiếng Việt, mọi từ mà câu gợi ý đó đúng]. */
export const TRAITS = {
  insect: ['là côn trùng', ['ant', 'bee', 'bug']],
  'long-green': ['dài và xanh lá', ['bug', 'frog']],
  sting: ['biết đốt', ['bee', 'ant']],
  wings: ['có cánh', ['bee', 'hen', 'chick', 'jet', 'ant']],
  'sound-buzz': ['kêu vo ve', ['bee']],
  'sound-ribbit': ['kêu ộp ộp', ['frog']],
  hop: ['nhảy lò cò', ['frog', 'chick', 'hen']],
  'sound-cluck': ['kêu cục tác', ['hen']],
  'eggs-from': ['cho trứng', ['hen', 'shop', 'farm']],
  'milk-from': ['cho sữa', ['goat', 'shop', 'farm']],
  horns: ['có sừng', ['goat']],
  'in-mud': ['đầm mình trong bùn', ['pig', 'frog', 'dog', 'rat', 'hen', 'goat', 'snail']],
  'sound-oink': ['kêu ụt ịt', ['pig']],
  'sound-woof': ['sủa gâu gâu', ['dog']],
  'sound-cheep': ['kêu chiếp chiếp', ['chick']],
  dig: ['biết đào', ['dog', 'fox', 'rat', 'pig', 'ant']],
  'gets-rats': ['bắt chuột', ['cat', 'dog', 'fox']],
  'cat-gets': ['mèo bắt được', ['rat', 'fish', 'chick', 'bug', 'hen', 'frog']],
  'long-thin-tail': ['đuôi dài và mảnh', ['rat', 'cat']],
  'red-big-tail': ['lông đỏ, đuôi to', ['fox', 'cat']],
  'sharp-teeth': ['răng sắc', ['shark', 'dog', 'fox', 'cat', 'rat']],
  'no-legs': ['không có chân', ['snail', 'fish', 'shark']],
  shell: ['có vỏ', ['snail']],
  'mum-hen': ['mẹ là gà mái', ['chick']],
  swim: ['biết bơi', ['fish', 'shark', 'frog', 'dog']],
  'grown-man': ['đàn ông, không phải trẻ con', ['man', 'king']],
  rich: ['giàu', ['king', 'queen']],
  'next-to-king': ['ngồi cạnh nhà vua', ['queen']],
  sibling: ['chị em gái', ['sister']],
  'jam-in': ['có mứt bên trong', ['pie']],
  popcorn: ['nổ thành bỏng ngô', ['corn']],
  ketchup: ['chấm tương cà', ['chips']],
  'run-on': ['dùng để chạy', ['leg', 'foot']],
  'sock-on': ['đi tất vào', ['foot', 'leg']],
  'sing-with': ['dùng để hát', ['mouth']],
  n10: ['bằng 10', ['ten']],
  n6: ['bằng 6', ['six']],
  n3: ['bằng 3', ['three']],
  'red-colour': ['màu của tương cà', ['red']],
  'in-bed': ['làm trên giường', ['nap', 'sit']],
  'on-mat': ['làm trên thảm', ['sit', 'nap']],
  'stick-in': ['cắm vào bản đồ', ['pin']],
  'sharp-tip': ['đầu nhọn', ['pin', 'pen']],
  'cook-in': ['dùng để nấu', ['pan']],
  'fill-from': ['lấy nước vào cốc', ['tap']],
  lid: ['có nắp', ['tin', 'box', 'pan', 'cup']],
  'sun-off': ['che nắng', ['hat', 'tree']],
  'roads-on': ['có đường đi vẽ trên đó', ['map']],
  'help-find': ['giúp tìm đường', ['map', 'book']],
  ink: ['có mực', ['pen']],
  'in-goal': ['ở khung thành', ['net']],
  strap: ['có quai', ['bag']],
  'sip-from': ['uống bằng nó', ['cup']],
  'nap-on': ['ngủ trên / trong đó', ['bed']],
  float: ['nổi trên nước', ['boat', 'ship', 'wood']],
  sail: ['có buồm', ['boat', 'ship']],
  'on-neck': ['đeo ở cổ', ['tie']],
  trunk: ['có thân cây', ['tree', 'wood']],
  'on-coat': ['ở trên áo khoác', ['zip']],
  'bugs-stuck': ['côn trùng mắc vào', ['web', 'net']],
  'on-finger': ['đeo ở ngón tay', ['ring']],
  'boxes-in': ['chở thùng hàng', ['van', 'ship']],
  'words-in': ['có chữ bên trong', ['book', 'map']],
  'up-back': ['đưa lên rồi lại về', ['swing']],
  'from-tree': ['lấy từ cây', ['wood']],
  'shut-lid': ['đóng nắp lại', ['box', 'tin', 'pan']],
  'buy-from': ['mua sữa, trứng ở đó', ['shop', 'farm', 'hen', 'goat']],
  'get-wet-in': ['làm mình ướt', ['bath', 'rain']],
  cash: ['là tiền', ['coin']],
  'hits-nails': ['đóng đinh', ['hammer']],
  'park-it': ['đỗ xe', ['car', 'van', 'bus']],
  'five-points': ['có 5 cánh', ['star']],
  'seen-in-dark': ['thấy khi trời tối', ['moon', 'star']],
  'rain-from': ['cho mưa', ['cloud']],
  hot: ['nóng', ['sun', 'pan', 'pie', 'chips', 'star', 'bath', 'cup']],
  'drips-on-us': ['nhỏ giọt lên người', ['rain', 'tap']],
  'animals-on': ['có lợn, gà', ['farm']],
  'on-road': ['chạy trên đường', ['bus', 'van', 'car']],
};

/** [câu 1 EN, câu 1 VI, câu 2 EN, câu 2 VI, trait của câu 2] */
const R = (word, kind, sum, sumVi, ...pairs) => ({
  word, kind, sum, sumVi,
  clues: pairs.map(([en1, vi1, en2, vi2, trait]) => ({ en: [en1, en2], vi: [vi1, vi2], trait })),
});

export const RIDDLES = [
  // Nhóm 1
  R('ant', 'animal', 'It is an ant. An ant can dig.', 'Đó là con kiến. Con kiến biết đào đất.',
    ['It is an insect.', 'Nó là côn trùng.', 'It can dig.', 'Nó biết đào đất.', 'dig']),
  R('pin', 'thing', 'It is a pin. A pin can stick in a map.', 'Đó là cái ghim. Cái ghim ghim được lên bản đồ.',
    ['It is not big.', 'Nó không to.', 'It can stick in a map.', 'Nó ghim được lên bản đồ.', 'stick-in'],
    ['It is thin.', 'Nó mảnh.', 'Its tip is sharp.', 'Đầu của nó nhọn.', 'sharp-tip']),
  R('pan', 'thing', 'It is a pan. A pan can be hot.', 'Đó là cái chảo. Cái chảo có thể nóng.',
    ['It is hot.', 'Nó nóng.', 'Mum can cook eggs in it.', 'Mẹ rán trứng trong nó.', 'cook-in']),
  R('tap', 'thing', 'It is a tap. A tap drips.', 'Đó là vòi nước. Vòi nước nhỏ giọt.',
    ['It drips.', 'Nó nhỏ giọt.', 'Fill a cup from it.', 'Lấy nước vào cốc từ nó.', 'fill-from']),
  R('nap', 'action', 'It is a nap. We nap in bed.', 'Đó là giấc ngủ ngắn. Mình ngủ trên giường.',
    ['It is a rest.', 'Đó là lúc nghỉ ngơi.', 'We do it in bed.', 'Mình làm việc đó trên giường.', 'in-bed']),
  R('sit', 'action', 'Sit on a mat!', 'Ngồi lên thảm nào!',
    ['Do not stand up!', 'Đừng đứng lên!', 'Do it on a mat.', 'Làm việc đó trên thảm.', 'on-mat']),
  R('tin', 'thing', 'It is a tin. A tin has a lid.', 'Đó là cái hộp thiếc. Hộp thiếc có nắp.',
    ['It is a can.', 'Nó là cái lon.', 'It has a lid on top.', 'Nó có nắp ở trên.', 'lid']),
  // Nhóm 2
  R('cat', 'animal', 'It is a cat. A cat can get a rat.', 'Đó là con mèo. Con mèo bắt được chuột.',
    ['It is a pet.', 'Nó là con vật nuôi.', 'It can get a rat.', 'Nó bắt được chuột.', 'gets-rats']),
  R('hat', 'thing', 'It is a hat. Dad has a hat on.', 'Đó là cái mũ. Bố đội mũ.',
    ['Dad has it on.', 'Bố đội nó.', 'It keeps the sun off.', 'Nó che nắng cho bố.', 'sun-off']),
  R('map', 'thing', 'It is a map. A map can help us.', 'Đó là bản đồ. Bản đồ giúp mình tìm đường.',
    ['It is flat.', 'Nó phẳng.', 'It can help us get to a spot.', 'Nó giúp mình tới một chỗ.', 'help-find'],
    ['It can help us.', 'Nó giúp mình.', 'It has roads on it.', 'Trên nó có đường đi.', 'roads-on']),
  R('pen', 'thing', 'It is a pen. A pen has ink in it.', 'Đó là cái bút. Cái bút có mực.',
    ['It is not big.', 'Nó không to.', 'It has ink in it.', 'Trong nó có mực.', 'ink']),
  R('hen', 'animal', 'It is a hen. We get eggs from a hen.', 'Đó là con gà mái. Gà mái cho mình trứng.',
    ['It is an animal.', 'Nó là con vật.', 'Cluck, cluck!', 'Cục tác, cục tác!', 'sound-cluck'],
    ['It is an animal.', 'Nó là con vật.', 'We get eggs from it.', 'Mình lấy trứng từ nó.', 'eggs-from']),
  R('net', 'thing', 'It is a net. A net has big gaps.', 'Đó là cái lưới. Cái lưới có lỗ to.',
    ['It has big gaps.', 'Nó có lỗ to.', 'It is in a goal.', 'Nó nằm trong khung thành.', 'in-goal']),
  R('ten', 'number', 'It is 10. 5 and 5 is 10.', 'Đó là số 10. 5 với 5 là 10.',
    ['It is 9 and 1.', 'Nó là 9 với 1.', 'It is 5 and 5.', 'Nó là 5 với 5.', 'n10']),
  R('red', 'colour', 'It is red. Ketchup is red.', 'Đó là màu đỏ. Tương cà màu đỏ.',
    ['It is not pink.', 'Nó không phải màu hồng.', 'Ketchup is it.', 'Tương cà có màu này.', 'red-colour']),
  R('rat', 'animal', 'It is a rat. A cat can get a rat.', 'Đó là con chuột. Mèo bắt được chuột.',
    ['It is an animal.', 'Nó là con vật.', 'A cat can get it.', 'Mèo bắt được nó.', 'cat-gets'],
    ['It is an animal.', 'Nó là con vật.', 'It has a long thin tail.', 'Nó có cái đuôi dài và mảnh.', 'long-thin-tail']),
  R('man', 'person', 'He is a man. He is not a kid.', 'Đó là người đàn ông. Chú ấy không phải trẻ con.',
    ['He is a dad.', 'Chú ấy là một ông bố.', 'He is not a kid.', 'Chú ấy không phải trẻ con.', 'grown-man']),
  // Nhóm 3
  R('dog', 'animal', 'It is a dog. A dog can dig.', 'Đó là con chó. Con chó biết đào đất.',
    ['It is a pet.', 'Nó là con vật nuôi.', 'It can dig.', 'Nó biết đào đất.', 'dig'],
    ['It is a pet.', 'Nó là con vật nuôi.', 'Woof, woof!', 'Gâu gâu!', 'sound-woof']),
  R('pig', 'animal', 'It is a pig. A pig sits in mud.', 'Đó là con lợn. Con lợn đầm mình trong bùn.',
    ['It is an animal.', 'Nó là con vật.', 'It sits in mud.', 'Nó đầm mình trong bùn.', 'in-mud'],
    ['It is an animal.', 'Nó là con vật.', 'Oink, oink!', 'Ụt ịt, ụt ịt!', 'sound-oink']),
  R('bag', 'thing', 'It is a bag. A bag has a strap.', 'Đó là cái túi. Cái túi có quai.',
    ['Mum can fill it.', 'Mẹ bỏ đồ đầy vào nó.', 'It has a strap.', 'Nó có quai.', 'strap']),
  R('bus', 'vehicle', 'It is a bus. A bus is on the road.', 'Đó là xe buýt. Xe buýt chạy trên đường.',
    ['It is big.', 'Nó to.', 'It is on the road.', 'Nó chạy trên đường.', 'on-road']),
  R('sun', 'nature', 'It is the sun. The sun is hot.', 'Đó là mặt trời. Mặt trời nóng.',
    ['It is up.', 'Nó ở trên cao.', 'It is hot.', 'Nó nóng.', 'hot']),
  R('cup', 'thing', 'It is a cup. We sip from a cup.', 'Đó là cái cốc. Mình uống bằng cốc.',
    ['It is not big.', 'Nó không to.', 'We sip from it.', 'Mình uống từng ngụm bằng nó.', 'sip-from']),
  R('bed', 'thing', 'It is a bed. We nap on a bed.', 'Đó là cái giường. Mình ngủ trên giường.',
    ['It is soft.', 'Nó mềm.', 'We nap on it.', 'Mình ngủ trưa trên nó.', 'nap-on'],
    ['It is soft.', 'Nó mềm.', 'We sleep in it.', 'Mình ngủ trong nó.', 'nap-on']),
  R('leg', 'body', 'It is a leg. He can run on his legs.', 'Đó là cái chân. Bạn ấy chạy bằng chân.',
    ['A man has it.', 'Ai cũng có nó.', 'He can run on it.', 'Chú ấy chạy bằng nó.', 'run-on']),
  R('bug', 'animal', 'It is a bug. It is long and green.', 'Đó là con sâu. Nó dài và xanh lá.',
    ['It is an insect.', 'Nó là côn trùng.', 'It is long and green.', 'Nó dài và màu xanh lá.', 'long-green']),
  R('frog', 'animal', 'It is a frog. A frog can hop.', 'Đó là con ếch. Con ếch nhảy được.',
    ['It is an animal.', 'Nó là con vật.', 'Ribbit, ribbit!', 'Ộp ộp, ộp ộp!', 'sound-ribbit'],
    ['It is an animal.', 'Nó là con vật.', 'It can hop.', 'Nó nhảy được.', 'hop']),
  // Nhóm 4
  R('rain', 'nature', 'It is raining. Rain is wet.', 'Trời đang mưa. Mưa thì ướt.',
    ['It is wet.', 'Nó ướt.', 'It drips on us.', 'Nó nhỏ giọt lên người mình.', 'drips-on-us']),
  R('snail', 'animal', 'It is a snail. A snail is not fast.', 'Đó là con ốc sên. Ốc sên bò chậm.',
    ['It is an animal.', 'Nó là con vật.', 'It has not got legs.', 'Nó không có chân.', 'no-legs'],
    ['It is an animal.', 'Nó là con vật.', 'It has a shell.', 'Nó có vỏ.', 'shell']),
  R('jet', 'vehicle', 'It is a jet. A jet has wings.', 'Đó là máy bay. Máy bay có cánh.',
    ['It is big.', 'Nó to.', 'It has wings.', 'Nó có cánh.', 'wings']),
  R('boat', 'vehicle', 'It is a boat. A boat can float.', 'Đó là chiếc thuyền. Chiếc thuyền nổi trên nước.',
    ['It can float.', 'Nó nổi trên nước.', 'It has a sail.', 'Nó có buồm.', 'sail']),
  R('goat', 'animal', 'It is a goat. A goat has horns.', 'Đó là con dê. Con dê có sừng.',
    ['It is an animal.', 'Nó là con vật.', 'We get milk from it.', 'Mình lấy sữa từ nó.', 'milk-from'],
    ['It is an animal.', 'Nó là con vật.', 'It has horns.', 'Nó có sừng.', 'horns']),
  R('tie', 'thing', 'It is a tie. A tie is on his neck.', 'Đó là cà vạt. Cà vạt đeo ở cổ.',
    ['Dad has it on.', 'Bố đeo nó.', 'It is on his neck.', 'Nó ở cổ của bố.', 'on-neck']),
  R('pie', 'food', 'It is a pie. The pie has jam in it.', 'Đó là bánh nướng. Bánh có mứt ở trong.',
    ['It is hot.', 'Nó nóng.', 'It has jam in it.', 'Trong nó có mứt.', 'jam-in']),
  R('bee', 'animal', 'It is a bee. A bee can sting.', 'Đó là con ong. Con ong biết đốt.',
    ['It is an insect.', 'Nó là côn trùng.', 'It has wings.', 'Nó có cánh.', 'wings'],
    ['It is an insect.', 'Nó là côn trùng.', 'Buzz, buzz!', 'Vo ve, vo ve!', 'sound-buzz'],
    ['It is an insect.', 'Nó là côn trùng.', 'It can sting.', 'Nó biết đốt.', 'sting']),
  R('tree', 'nature', 'It is a tree. A tree is big and green.', 'Đó là cái cây. Cái cây to và xanh.',
    ['It is big and green.', 'Nó to và màu xanh lá.', 'It has a trunk.', 'Nó có thân cây.', 'trunk']),
  R('corn', 'food', 'It is corn. We pop it to get popcorn.', 'Đó là bắp ngô. Mình rang nó thành bỏng ngô.',
    ['It is a plant.', 'Nó là cây trồng.', 'We pop it to get popcorn.', 'Mình rang nó nổ thành bỏng ngô.', 'popcorn']),
  // Nhóm 5
  R('zip', 'thing', 'It is a zip. A zip is on a coat.', 'Đó là khóa kéo. Khóa kéo nằm trên áo khoác.',
    ['It can go up.', 'Nó kéo lên được.', 'It is on a coat.', 'Nó ở trên áo khoác.', 'on-coat']),
  R('web', 'thing', 'It is a web. Bugs get stuck in a web.', 'Đó là mạng nhện. Côn trùng mắc vào mạng nhện.',
    ['It has big gaps.', 'Nó có lỗ to.', 'Bugs get stuck in it.', 'Côn trùng bị mắc vào nó.', 'bugs-stuck']),
  R('ring', 'thing', 'It is a ring. A ring is on a finger.', 'Đó là cái nhẫn. Nhẫn đeo ở ngón tay.',
    ['It is not big.', 'Nó không to.', 'It is on a finger.', 'Nó đeo ở ngón tay.', 'on-finger']),
  R('king', 'person', 'He is a king. A king is rich.', 'Đó là nhà vua. Nhà vua giàu có.',
    ['He is a man.', 'Ông ấy là đàn ông.', 'He is rich.', 'Ông ấy giàu có.', 'rich']),
  R('van', 'vehicle', 'It is a van. Men fill the van with boxes.', 'Đó là xe tải nhỏ. Các chú xếp thùng hàng vào xe.',
    ['It is on the road.', 'Nó chạy trên đường.', 'Men fill it with boxes.', 'Các chú xếp thùng hàng vào nó.', 'boxes-in']),
  R('book', 'thing', 'It is a book. A book has letters in it.', 'Đó là quyển sách. Sách có chữ ở trong.',
    ['Look in it!', 'Nhìn vào trong nó nhé!', 'It has letters in it.', 'Trong nó có chữ.', 'words-in']),
  R('foot', 'body', 'It is a foot. A sock is on a foot.', 'Đó là bàn chân. Tất đi ở bàn chân.',
    ['It is on your leg.', 'Nó ở cuối cái chân của con.', 'A sock is on it.', 'Mình đi tất vào nó.', 'sock-on']),
  R('moon', 'nature', 'It is the moon. We see the moon in the dark.', 'Đó là mặt trăng. Mình thấy mặt trăng khi trời tối.',
    ['It is up.', 'Nó ở trên cao.', 'We see it in the dark.', 'Mình thấy nó khi trời tối.', 'seen-in-dark']),
  R('swing', 'thing', 'It is a swing. A swing can go up and back.', 'Đó là cái xích đu. Xích đu đưa qua đưa lại.',
    ['Kids sit on it.', 'Các bạn nhỏ ngồi lên nó.', 'It can go up and back.', 'Nó đưa qua đưa lại.', 'up-back']),
  R('wood', 'nature', 'It is wood. Wood is from a tree.', 'Đó là gỗ. Gỗ lấy từ cây.',
    ['It is not soft.', 'Nó không mềm.', 'It is from a tree.', 'Người ta lấy nó từ cây.', 'from-tree']),
  // Nhóm 6
  R('fox', 'animal', 'It is a fox. A fox has a big tail.', 'Đó là con cáo. Con cáo có đuôi to.',
    ['It is an animal.', 'Nó là con vật.', 'It is red and it has a big tail.', 'Nó màu đỏ và có cái đuôi to.', 'red-big-tail']),
  R('box', 'thing', 'It is a box. Shut the lid!', 'Đó là cái hộp. Đóng nắp lại nhé!',
    ['Fill it up.', 'Bỏ đồ đầy vào nó.', 'Then shut the lid.', 'Rồi đóng nắp lại.', 'shut-lid']),
  R('six', 'number', 'It is 6. 3 and 3 is 6.', 'Đó là số 6. 3 với 3 là 6.',
    ['It is 5 and 1.', 'Nó là 5 với 1.', 'It is 3 and 3.', 'Nó là 3 với 3.', 'n6']),
  R('chick', 'animal', 'It is a chick. Its mum is a hen.', 'Đó là gà con. Mẹ của nó là gà mái.',
    ['It is an animal.', 'Nó là con vật.', 'Cheep, cheep!', 'Chiếp chiếp!', 'sound-cheep'],
    ['It is an animal.', 'Nó là con vật.', 'Its mum is a hen.', 'Mẹ của nó là gà mái.', 'mum-hen']),
  R('chips', 'food', 'They are chips. Chips are food.', 'Đó là khoai tây chiên. Khoai tây chiên là đồ ăn.',
    ['They are long and thin.', 'Chúng dài và mảnh.', 'You dip them in ketchup.', 'Mình chấm chúng vào tương cà.', 'ketchup']),
  R('ship', 'vehicle', 'It is a ship. A ship can float.', 'Đó là con tàu. Con tàu nổi trên nước.',
    ['It is big.', 'Nó to.', 'It can float.', 'Nó nổi trên nước.', 'float']),
  R('fish', 'animal', 'It is a fish. A fish can swim.', 'Đó là con cá. Con cá biết bơi.',
    ['It can swim.', 'Nó biết bơi.', 'It has not got legs.', 'Nó không có chân.', 'no-legs'],
    ['It is an animal.', 'Nó là con vật.', 'It can swim.', 'Nó biết bơi.', 'swim']),
  R('shop', 'place', 'It is a shop. Mum gets milk at the shop.', 'Đó là cửa hàng. Mẹ mua sữa ở cửa hàng.',
    ['We go to it.', 'Mình đi tới đó.', 'Mum gets milk and eggs from it.', 'Mẹ mua sữa và trứng ở đó.', 'buy-from']),
  R('bath', 'thing', 'It is a bath. We get wet in the bath.', 'Đó là bồn tắm. Mình bị ướt trong bồn tắm.',
    ['We sit in it.', 'Mình ngồi trong nó.', 'We get wet in it.', 'Mình bị ướt trong nó.', 'get-wet-in']),
  R('three', 'number', 'It is 3. 2 and 1 is 3.', 'Đó là số 3. 2 với 1 là 3.',
    ['It is 1 and 1 and 1.', 'Nó là 1 với 1 với 1.', 'It is 2 and 1.', 'Nó là 2 với 1.', 'n3']),
  // Nhóm 7
  R('queen', 'person', 'She is a queen. She sits next to the king.', 'Đó là nữ hoàng. Bà ấy ngồi cạnh nhà vua.',
    ['She is not a kid.', 'Bà ấy không phải trẻ con.', 'She sits next to the king.', 'Bà ấy ngồi cạnh nhà vua.', 'next-to-king']),
  R('cloud', 'nature', 'It is a cloud. We get rain from a cloud.', 'Đó là đám mây. Mây cho mình mưa.',
    ['It is up, up, up.', 'Nó ở trên cao, cao, cao.', 'We get rain from it.', 'Mình có mưa từ nó.', 'rain-from']),
  R('mouth', 'body', 'It is a mouth. We sing with our mouths.', 'Đó là cái miệng. Mình hát bằng miệng.',
    ['It is on you.', 'Nó ở trên người con.', 'You sing with it.', 'Con hát bằng nó.', 'sing-with']),
  R('coin', 'thing', 'It is a coin. A coin is cash.', 'Đó là đồng xu. Đồng xu là tiền.',
    ['It is flat and round.', 'Nó phẳng và tròn.', 'It is cash.', 'Nó là tiền.', 'cash']),
  R('star', 'nature', 'It is a star. A star has 5 points.', 'Đó là ngôi sao. Ngôi sao có 5 cánh.',
    ['It is up in the dark.', 'Nó ở trên cao khi trời tối.', 'It has 5 points.', 'Nó có 5 cánh.', 'five-points']),
  R('car', 'vehicle', 'It is a car. Dad can park the car.', 'Đó là ô tô. Bố đỗ ô tô.',
    ['It is on the road.', 'Nó chạy trên đường.', 'Mum and Dad park it.', 'Bố mẹ đỗ nó.', 'park-it']),
  R('shark', 'animal', 'It is a shark. A shark has sharp teeth.', 'Đó là cá mập. Cá mập có răng sắc.',
    ['It can swim.', 'Nó biết bơi.', 'It has sharp teeth.', 'Nó có răng sắc.', 'sharp-teeth']),
  R('farm', 'place', 'It is a farm. Pigs and hens are on a farm.', 'Đó là nông trại. Ở nông trại có lợn và gà.',
    ['It is big.', 'Nó rộng.', 'Pigs and hens are on it.', 'Ở đó có lợn và gà mái.', 'animals-on']),
  R('hammer', 'thing', 'It is a hammer. Dad hits nails with a hammer.', 'Đó là cái búa. Bố đóng đinh bằng búa.',
    ['Bang, bang!', 'Cộc, cộc!', 'Dad hits nails with it.', 'Bố đóng đinh bằng nó.', 'hits-nails']),
  R('sister', 'person', 'She is my sister.', 'Đó là chị / em gái của con.',
    ['She is a kid.', 'Bạn ấy là trẻ con.', 'Her mum is my mum.', 'Bạn ấy có cùng mẹ với con.', 'sibling']),
];

export const RIDDLE_BY_WORD = new Map(RIDDLES.map((r) => [r.word, r]));

/** Đặc điểm của từ (suy từ TRAITS) — dùng chọn nhiễu. */
export const traitsOf = (word) => Object.keys(TRAITS).filter((t) => TRAITS[t][1].includes(word));

const KIND_OF = new Map(RIDDLES.map((r) => [r.word, r.kind]));

/**
 * Từ tách được bằng chữ đã học nhưng đọc theo âm thì SAI (e câm, nguyên âm dài, a trước ll…) hoặc chưa phải tricky word
 * đã học — không được có trong câu đố (test). Thêm vào đây khi phát hiện từ mới kiểu này.
 */
export const NOT_DECODABLE = [
  'home', 'like', 'have', 'live', 'ride', 'side', 'bake', 'drive', 'gold', 'old', 'cold', 'spider', 'words', 'word',
  'chair', 'hair', 'ball', 'fall', 'falls', 'tall', 'walk', 'talk', 'wash', 'water', 'of', 'comes', 'says', 'fly',
  'sky', 'baby', 'fluffy', 'grown', 'crown', 'wears', 'carries', 'many', 'day', 'night', 'mark', 'place',
];

/** Bé đã đọc xong nhóm 1 → g. */
export const upTo = (g) => learnedPhonics([...Array(g)].map((_, i) => i + 1));

/** Nhóm thấp nhất (≥ `from`) mà bé xong nhóm 1 → nhóm đó thì đọc được `text`; Infinity: không đọc được. */
export function readFrom(text, from = 1) {
  for (let g = from; g <= 7; g++) if (canRead(text, upTo(g)).ok) return g;
  return Infinity;
}

const ALL_G = learnedGraphemes(7);

/** Âm đầu của từ (không phải chữ đầu): c / k / ck / qu cùng /k/; ch, sh, th khác c, s, t. */
export function onsetOf(word) {
  const g = toGraphemes(word, ALL_G)?.[0] ?? word[0];
  return g === 'qu' ? 'k' : soundOfGrapheme(g);
}

/** Số lựa chọn theo mức (6.2); mức 3 thiếu nhiễu cùng loại thì bớt còn 3. */
export const CHOICES = { 1: 3, 2: 3, 3: 4 };

/**
 * Nhiễu hợp lệ cho một cặp gợi ý trong `words` (từ bé đã học): khác đáp án, câu 2 KHÔNG đúng với nó, khác ÂM đầu
 * với đáp án (`onsetOf`: cat / king cùng /k/); mức 1 khác loại, mức 2–3 cùng loại (không mượn loại khác).
 */
export function distractorsFor(riddle, clue, words, level) {
  const fits = TRAITS[clue.trait]?.[1] ?? [];
  return words.filter((w) => w !== riddle.word && !fits.includes(w) && onsetOf(w) !== onsetOf(riddle.word)
    && KIND_OF.has(w) && (level === 1 ? KIND_OF.get(w) !== riddle.kind : KIND_OF.get(w) === riddle.kind));
}

/** Số lựa chọn dùng được ở mức (0: không dùng cặp này ở mức đó). Nhiễu khác âm đầu với nhau. */
export function choicesAt(riddle, clue, words, level) {
  const firsts = new Set(distractorsFor(riddle, clue, words, level).map(onsetOf)).size;
  const want = CHOICES[level];
  if (firsts >= want - 1) return want;
  return level === 3 && firsts >= 2 ? 3 : 0;
}

