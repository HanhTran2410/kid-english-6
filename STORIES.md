# 📚 Truyện ngắn — bảng duyệt 7 truyện có sẵn (Story-0 · bố mẹ duyệt 2026-11-19 sau 3 lần review)

> Sinh tự động từ `app/js/story/builtin-stories.js` bằng `node scripts/read-stories-sheet.mjs` — **sửa ở file .js rồi chạy lại**, không sửa tay file này.
> Spec: SPEC-story.md (draft2). Mỗi truyện 5 trang, 3 câu hỏi (chọn hình → chọn chữ → xếp thứ tự).

**Cách đọc bảng**
- Truyện nhóm N: giả định bé đã đọc xong nhóm 1 → N. Loại từng từ do **máy tính** bằng chính hàm của app (`classifyWord`, SPEC-story 3.2): <u>gạch chân</u> = tricky word / từ nhận diện đã học; chữ thường = ghép được bằng âm đã học (cách tách ở cột "Tách âm"); **⚠đậm** = từ mới bé chưa đọc được (truyện có sẵn không được có — test chặn).
- **Bậc** (SPEC-story 3.1): A (nhóm 1–2) câu 3–5 từ, chưa dùng *he / she / they* · B (nhóm 3–4) 3–6 từ, chưa dùng *they* · C (nhóm 5–7) 4–7 từ. Máy đã kiểm số từ và đại từ.
- **Bố mẹ soát giúp** (máy không kiểm được): câu tiếng Anh tự nhiên, đúng ngữ pháp; đại từ (*it, he, she, they*) chỉ người / vật mà **câu ngay trước** vừa nói tới; dòng tiếng Việt dịch tự nhiên; câu hỏi chỉ có **một** đáp án hợp lý; truyện có mở đầu – chuyện xảy ra – kết thúc vui; mô tả nhân vật (dùng để vẽ ảnh) hợp lý.
- Trang chưa có ảnh hiện emoji của trang (cột "Hình").
- ✏️ = câu / câu hỏi sửa sau lần duyệt gần nhất (hiện không có).

## Nhóm 1 — 🐜 Pip the Ant · *Chú kiến Pip*

- **Bậc A** · bé đọc được **29 / 29 từ** (100%)
- Âm đã học: s a t i p n
- Tricky / từ nhận diện đã học: a, an, I, the
- Nhân vật (cho ảnh): Pip: a tiny smiling black ant with big round eyes. Nan: a girl with two short black pigtails and a yellow dress.
- Bối cảnh chung (cho ảnh): a cosy kitchen table with a small round tin box on it

| Trang | Hình | Tiếng Anh | Số từ | Tách âm | Tiếng Việt |
|---|---|---|---|---|---|
| 1 | 🐜 | Pip is <u>an</u> ant. | 4 | pip = p-i-p · is = i-s · ant = a-n-t | Pip là một chú kiến. |
| 2 | 🐜🥫 | Pip naps in <u>a</u> tin. | 5 | pip = p-i-p · naps = n-a-p-s · in = i-n · tin = t-i-n | Pip ngủ trong một cái hộp thiếc. |
| 3 | 👧🥫 | Nan taps <u>the</u> tin. | 4 | nan = n-a-n · taps = t-a-p-s · tin = t-i-n | Nan gõ vào cái hộp. |
|  |  | Tap, tap, tap! | 3 | tap = t-a-p | Cốc, cốc, cốc! |
| 4 | 🐜💫 | Pip spins in <u>the</u> tin. | 5 | pip = p-i-p · spins = s-p-i-n-s · in = i-n · tin = t-i-n | Pip xoay vòng vòng trong hộp. |
| 5 | 👧🐜 | Nan pats Pip. | 3 | nan = n-a-n · pats = p-a-t-s · pip = p-i-p | Nan vuốt ve Pip. |
|  |  | Pip naps in <u>the</u> tin. | 5 | pip = p-i-p · naps = n-a-p-s · in = i-n · tin = t-i-n | Pip lại ngủ trong hộp. |

| Câu hỏi | Olly hỏi | Lựa chọn | Đáp án | Sai lần 1 hiện trang | Giải thích khi sai lần 2 |
|---|---|---|---|---|---|
| 1. chọn hình | What is Pip?<br>*Pip là con gì?* | 🐜 ant / 🐱 cat / 🐷 pig | **ant** — *Pip is an ant.* | trang 1 | Pip là một chú kiến đấy. |
| 2. chọn chữ | What does Pip do at the end?<br>*Cuối truyện Pip làm gì?* | naps / spins | **naps** — *Pip naps in the tin.* | trang 5 | Cuối truyện Pip lại ngủ trong hộp. |
| 3. xếp thứ tự | What happens first, next and last?<br>*Chuyện gì xảy ra trước, sau, cuối cùng?* | 🐜🥫 trang 2 / 👧🥫 trang 3 / 👧🐜 trang 5 | trang 2 → 3 → 5 | — | Đầu tiên Pip ngủ trong hộp, rồi Nan gõ vào hộp, cuối cùng Nan vuốt ve Pip và Pip lại ngủ. |

## Nhóm 2 — 🐔 Pam and the Hen · *Pam và con gà mái*

- **Bậc A** · bé đọc được **30 / 30 từ** (100%)
- Âm đã học: s a t i p n · c k ck e h r m d
- Tricky / từ nhận diện đã học: a, an, he, I, me, she, the, we
- Nhân vật (cho ảnh): Pam: a girl with curly red hair, a green T-shirt and blue shorts. A plump red hen.
- Bối cảnh chung (cho ảnh): a farmyard with a red barn, green grass and a brown sack on the ground

| Trang | Hình | Tiếng Anh | Số từ | Tách âm | Tiếng Việt |
|---|---|---|---|---|---|
| 1 | 👧🐔 | Pam has <u>a</u> hen. | 4 | pam = p-a-m · has = h-a-s · hen = h-e-n | Pam có một con gà mái. |
| 2 | 🐔 | <u>The</u> hen is red. | 4 | hen = h-e-n · is = i-s · red = r-e-d | Con gà mái màu đỏ. |
| 3 | 🐔🛍️ | It sits in <u>a</u> sack. | 5 | it = i-t · sits = s-i-t-s · in = i-n · sack = s-a-ck | Nó chui vào một cái bao. |
| 4 | 👧🛍️ | Pam taps <u>the</u> sack. | 4 | pam = p-a-m · taps = t-a-p-s · sack = s-a-ck | Pam vỗ vỗ vào cái bao. |
|  |  | <u>The</u> sack can peck! | 4 | sack = s-a-ck · can = c-a-n · peck = p-e-ck | Cái bao biết mổ! |
| 5 | 👧🐔 | <u>The</u> hen is in it! | 5 | hen = h-e-n · is = i-s · in = i-n · it = i-t | Con gà ở trong đó! |
|  |  | Pam pets <u>the</u> hen. | 4 | pam = p-a-m · pets = p-e-t-s · hen = h-e-n | Pam vuốt ve con gà mái. |

| Câu hỏi | Olly hỏi | Lựa chọn | Đáp án | Sai lần 1 hiện trang | Giải thích khi sai lần 2 |
|---|---|---|---|---|---|
| 1. chọn hình | What does Pam have?<br>*Pam có con gì?* | 🐔 hen / 🐱 cat / 🐜 ant | **hen** — *Pam has a hen.* | trang 1 | Pam có một con gà mái. |
| 2. chọn chữ | Where is the hen?<br>*Con gà mái ở đâu?* | sack / hat | **sack** — *It sits in a sack.* | trang 3 | Con gà mái chui vào cái bao. |
| 3. xếp thứ tự | What happens first, next and last?<br>*Chuyện gì xảy ra trước, sau, cuối cùng?* | 🐔🛍️ trang 3 / 👧🛍️ trang 4 / 👧🐔 trang 5 | trang 3 → 4 → 5 | — | Đầu tiên gà chui vào bao, rồi Pam vỗ vào bao và cái bao biết mổ, cuối cùng Pam tìm thấy gà. |

## Nhóm 3 — 👒 The Red Hat · *Cái mũ đỏ*

- **Bậc B** · bé đọc được **36 / 36 từ** (100%)
- Âm đã học: s a t i p n · c k ck e h r m d · g o u l f b
- Tricky / từ nhận diện đã học: a, an, be, do, he, I, me, she, the, to, was, we
- Nhân vật (cho ảnh): Sam: a small boy with short brown hair, a blue T-shirt and a red hat. A big brown dog with floppy ears.
- Bối cảnh chung (cho ảnh): a sunny garden with green grass, a fallen log and a white fence

| Trang | Hình | Tiếng Anh | Số từ | Tách âm | Tiếng Việt |
|---|---|---|---|---|---|
| 1 | 👦👒 | Sam has <u>a</u> red hat. | 5 | sam = s-a-m · has = h-a-s · red = r-e-d · hat = h-a-t | Sam có một cái mũ đỏ. |
| 2 | 👒🪵 | <u>The</u> hat is on <u>a</u> log. | 6 | hat = h-a-t · is = i-s · on = o-n · log = l-o-g | Cái mũ ở trên khúc gỗ. |
| 3 | 🐕👒 | <u>A</u> big dog gets <u>the</u> hat! | 6 | big = b-i-g · dog = d-o-g · gets = g-e-t-s · hat = h-a-t | Một con chó to lấy mất cái mũ! |
| 4 | 👦🪵 | Sam is sad. | 3 | sam = s-a-m · is = i-s · sad = s-a-d | Sam buồn. |
|  |  | <u>He</u> sits on <u>the</u> log. | 5 | sits = s-i-t-s · on = o-n · log = l-o-g | Bạn ấy ngồi trên khúc gỗ. |
| 5 | 🐕👦👒 | <u>The</u> dog drops <u>the</u> hat. | 5 | dog = d-o-g · drops = d-r-o-p-s · hat = h-a-t | Con chó thả cái mũ ra. |
|  |  | Sam gets it and is glad! | 6 | sam = s-a-m · gets = g-e-t-s · it = i-t · and = a-n-d · is = i-s · glad = g-l-a-d | Sam nhặt lại chiếc mũ và vui lắm! |

| Câu hỏi | Olly hỏi | Lựa chọn | Đáp án | Sai lần 1 hiện trang | Giải thích khi sai lần 2 |
|---|---|---|---|---|---|
| 1. chọn hình | Which animal takes the hat?<br>*Con vật nào lấy cái mũ?* | 🐶 dog / 🐱 cat / 🐷 pig | **dog** — *The dog gets the hat.* | trang 3 | Con chó lấy cái mũ của Sam đấy. |
| 2. chọn chữ | Is Sam sad or glad at the end?<br>*Cuối truyện Sam buồn hay vui?* | sad / glad | **glad** — *Sam gets it and is glad!* | trang 5 | Con chó thả mũ ra, Sam nhặt lại được nên Sam vui. |
| 3. xếp thứ tự | What happens first, next and last?<br>*Chuyện gì xảy ra trước, sau, cuối cùng?* | 👦👒 trang 1 / 🐕👒 trang 3 / 🐕👦👒 trang 5 | trang 1 → 3 → 5 | — | Đầu tiên Sam có mũ, rồi con chó lấy mũ, cuối cùng chó thả mũ ra và Sam nhặt lại. |

## Nhóm 4 — 🐐 A Coat for the Goat · *Cái áo cho chú dê*

- **Bậc B** · bé đọc được **33 / 33 từ** (100%)
- Âm đã học: s a t i p n · c k ck e h r m d · g o u l f b · ai j oa ie ee or
- Tricky / từ nhận diện đã học: a, all, an, are, be, do, he, I, me, she, the, to, was, we, you, your
- Nhân vật (cho ảnh): Jen: a girl with a long black ponytail, a yellow raincoat and green boots. A small white goat with little horns.
- Bối cảnh chung (cho ảnh): a small farm field with a wooden fence, grey rain clouds and puddles

| Trang | Hình | Tiếng Anh | Số từ | Tách âm | Tiếng Việt |
|---|---|---|---|---|---|
| 1 | 👧🐐 | Jen has <u>a</u> goat. | 4 | jen = j-e-n · has = h-a-s · goat = g-oa-t | Jen có một chú dê. |
| 2 | 🐐🌧️ | <u>The</u> goat is in <u>the</u> rain. | 6 | goat = g-oa-t · is = i-s · in = i-n · rain = r-ai-n | Chú dê đang ở ngoài trời mưa. |
| 3 | 🐐💧 | It is sad. | 3 | it = i-t · is = i-s · sad = s-a-d | Nó buồn thiu. |
|  |  | It needs <u>a</u> coat. | 4 | it = i-t · needs = n-ee-d-s · coat = c-oa-t | Nó cần một cái áo. |
| 4 | 👧🧥🐐 | Jen gets <u>a</u> red coat. | 5 | jen = j-e-n · gets = g-e-t-s · red = r-e-d · coat = c-oa-t | Jen lấy một chiếc áo khoác đỏ. |
|  |  | <u>The</u> goat has it on. | 5 | goat = g-oa-t · has = h-a-s · it = i-t · on = o-n | Chú dê đã mặc chiếc áo đó. |
| 5 | 🐐🧥 | <u>The</u> goat jogs in <u>the</u> rain! | 6 | goat = g-oa-t · jogs = j-o-g-s · in = i-n · rain = r-ai-n | Chú dê chạy tung tăng dưới mưa! |

| Câu hỏi | Olly hỏi | Lựa chọn | Đáp án | Sai lần 1 hiện trang | Giải thích khi sai lần 2 |
|---|---|---|---|---|---|
| 1. chọn hình | What does Jen get?<br>*Jen lấy cái gì?* | 🧥 coat / 🎩 hat / 👔 tie | **coat** — *Jen gets a red coat.* | trang 4 | Jen lấy một chiếc áo khoác đỏ cho chú dê. |
| 2. chọn chữ | What does the goat do at the end?<br>*Cuối truyện chú dê làm gì?* | jogs / sleeps | **jogs** — *The goat jogs in the rain!* | trang 5 | Có áo rồi, chú dê chạy tung tăng dưới mưa. |
| 3. xếp thứ tự | What happens first, next and last?<br>*Chuyện gì xảy ra trước, sau, cuối cùng?* | 🐐🌧️ trang 2 / 👧🧥🐐 trang 4 / 🐐🧥 trang 5 | trang 2 → 4 → 5 | — | Đầu tiên chú dê bị mưa, rồi Jen lấy áo, cuối cùng chú dê chạy dưới mưa. |

## Nhóm 5 — 🛟 The Pink Float · *Chiếc phao hồng*

- **Bậc C** · bé đọc được **35 / 35 từ** (100%)
- Âm đã học: s a t i p n · c k ck e h r m d · g o u l f b · ai j oa ie ee or · z w ng v oo
- Tricky / từ nhận diện đã học: a, all, an, are, be, come, do, he, here, I, me, said, she, some, the, to, was, we, you, your
- Nhân vật (cho ảnh): Viv: a girl with short black hair and a purple swimsuit, with a pink swim ring (round float). Ben: a boy with spiky blond hair and green swim shorts.
- Bối cảnh chung (cho ảnh): a bright outdoor swimming pool with blue water and white tiles

| Trang | Hình | Tiếng Anh | Số từ | Tách âm | Tiếng Việt |
|---|---|---|---|---|---|
| 1 | 👧🛟 | Viv has <u>a</u> pink float. | 5 | viv = v-i-v · has = h-a-s · pink = p-i-n-k · float = f-l-oa-t | Viv có một chiếc phao bơi màu hồng. |
| 2 | 👧🏊 | <u>She</u> swims in <u>the</u> pool. | 5 | swims = s-w-i-m-s · in = i-n · pool = p-oo-l | Bạn ấy bơi trong bể bơi. |
| 3 | 👧🔍 | <u>The</u> float is lost! | 4 | float = f-l-oa-t · is = i-s · lost = l-o-s-t | Chiếc phao bị mất rồi! |
|  |  | Viv looks for it in <u>the</u> pool. | 7 | viv = v-i-v · looks = l-oo-k-s · for = f-or · it = i-t · in = i-n · pool = p-oo-l | Viv tìm phao trong bể bơi. |
| 4 | 👦🏊 | Ben jumps in <u>to</u> help. | 5 | ben = b-e-n · jumps = j-u-m-p-s · in = i-n · help = h-e-l-p | Ben nhảy xuống giúp bạn. |
| 5 | 👦🛟👧 | <u>He</u> gets <u>the</u> float! | 4 | gets = g-e-t-s · float = f-l-oa-t | Ben tìm được chiếc phao! |
|  |  | Viv and Ben <u>are</u> glad. | 5 | viv = v-i-v · and = a-n-d · ben = b-e-n · glad = g-l-a-d | Viv và Ben đều vui. |

| Câu hỏi | Olly hỏi | Lựa chọn | Đáp án | Sai lần 1 hiện trang | Giải thích khi sai lần 2 |
|---|---|---|---|---|---|
| 1. chọn hình | What is lost?<br>*Cái gì bị mất?* | 🛟 float / 🎩 hat / 🥤 cup | **float** — *The float is lost!* | trang 3 | Chiếc phao hồng của Viv bị mất trong bể bơi. |
| 2. chọn chữ | Who gets the float?<br>*Ai tìm được chiếc phao?* | Ben / Viv | **Ben** — *Ben gets the float!* | trang 5 | Ben nhảy xuống bể và tìm được chiếc phao. |
| 3. xếp thứ tự | What happens first, next and last?<br>*Chuyện gì xảy ra trước, sau, cuối cùng?* | 👧🔍 trang 3 / 👦🏊 trang 4 / 👦🛟👧 trang 5 | trang 3 → 4 → 5 | — | Đầu tiên chiếc phao bị mất, rồi Ben nhảy xuống giúp, cuối cùng Ben tìm được phao. |

## Nhóm 6 — 🐟 The Big Fish · *Con cá to*

- **Bậc C** · bé đọc được **39 / 39 từ** (100%)
- Âm đã học: s a t i p n · c k ck e h r m d · g o u l f b · ai j oa ie ee or · z w ng v oo · y x ch sh th
- Tricky / từ nhận diện đã học: a, all, an, are, be, come, do, go, he, here, I, me, no, said, she, some, the, there, they, to, was, we, you, your
- Nhân vật (cho ảnh): Seth: a boy with messy brown hair, an orange T-shirt and a fishing rod. Dad: a tall man with a short beard, a green cap and a blue shirt.
- Bối cảnh chung (cho ảnh): a green pond with a small wooden dock and tall reeds

| Trang | Hình | Tiếng Anh | Số từ | Tách âm | Tiếng Việt |
|---|---|---|---|---|---|
| 1 | 👦👨🎣 | Seth and his dad <u>go</u> fishing. | 6 | seth = s-e-th · and = a-n-d · his = h-i-s · dad = d-a-d · fishing = f-i-sh-i-ng | Seth và bố đi câu cá. |
| 2 | 👦👨 | <u>They</u> sit on <u>the</u> dock. | 5 | sit = s-i-t · on = o-n · dock = d-o-ck | Hai bố con ngồi trên cầu gỗ. |
| 3 | 👦🐟 | Seth gets <u>a</u> big fish! | 5 | seth = s-e-th · gets = g-e-t-s · big = b-i-g · fish = f-i-sh | Seth câu được một con cá to! |
|  |  | It tugs and tugs. | 4 | it = i-t · tugs = t-u-g-s · and = a-n-d | Con cá giật mạnh, giật mạnh. |
| 4 | 👦💦 | Seth slips and lands in <u>the</u> pond! | 7 | seth = s-e-th · slips = s-l-i-p-s · and = a-n-d · lands = l-a-n-d-s · in = i-n · pond = p-o-n-d | Seth trượt chân và rơi xuống ao! |
| 5 | 👨👦🐟 | Dad helps Seth and gets <u>the</u> fish. | 7 | dad = d-a-d · helps = h-e-l-p-s · seth = s-e-th · and = a-n-d · gets = g-e-t-s · fish = f-i-sh | Bố giúp Seth rồi lấy con cá lên. |
|  |  | <u>The</u> fish is for lunch! | 5 | fish = f-i-sh · is = i-s · for = f-or · lunch = l-u-n-ch | Con cá để dành cho bữa trưa! |

| Câu hỏi | Olly hỏi | Lựa chọn | Đáp án | Sai lần 1 hiện trang | Giải thích khi sai lần 2 |
|---|---|---|---|---|---|
| 1. chọn hình | What does Seth get?<br>*Seth câu được gì?* | 🐟 fish / 🐸 frog / 🦆 duck | **fish** — *Seth gets a big fish!* | trang 3 | Seth câu được một con cá to. |
| 2. chọn chữ | Where does Seth land?<br>*Seth rơi xuống đâu?* | pond / dock | **pond** — *Seth lands in the pond!* | trang 4 | Con cá kéo mạnh nên Seth rơi xuống ao. |
| 3. xếp thứ tự | What happens first, next and last?<br>*Chuyện gì xảy ra trước, sau, cuối cùng?* | 👦👨🎣 trang 1 / 👦💦 trang 4 / 👨👦🐟 trang 5 | trang 1 → 4 → 5 | — | Đầu tiên hai bố con đi câu, rồi Seth rơi xuống ao, cuối cùng bố giúp Seth rồi lấy con cá lên. |

## Nhóm 7 — 🪙 The Lost Coin · *Đồng xu bị mất*

- **Bậc C** · bé đọc được **39 / 39 từ** (100%)
- Âm đã học: s a t i p n · c k ck e h r m d · g o u l f b · ai j oa ie ee or · z w ng v oo · y x ch sh th · qu ou oi ue er ar
- Tricky / từ nhận diện đã học: a, all, an, are, be, by, come, do, go, he, here, I, me, my, no, one, said, she, so, some, the, there, they, to, was, we, you, your
- Nhân vật (cho ảnh): Rex: a boy with curly black hair, a red hoodie and a shiny gold coin. A quick little brown dog with a white tail.
- Bối cảnh chung (cho ảnh): a park with a big sandpit, trees and a bench

| Trang | Hình | Tiếng Anh | Số từ | Tách âm | Tiếng Việt |
|---|---|---|---|---|---|
| 1 | 👦🪙 | Rex has <u>one</u> coin. | 4 | rex = r-e-x · has = h-a-s · coin = c-oi-n | Rex có một đồng xu. |
| 2 | 👦🏞️ | Rex runs <u>to</u> <u>the</u> park. | 5 | rex = r-e-x · runs = r-u-n-s · park = p-ar-k | Rex chạy ra công viên. |
| 3 | 🪙🏖️ | <u>The</u> coin drops in <u>the</u> sand. | 6 | coin = c-oi-n · drops = d-r-o-p-s · in = i-n · sand = s-a-n-d | Đồng xu rơi xuống cát. |
|  |  | Rex looks and looks. | 4 | rex = r-e-x · looks = l-oo-k-s · and = a-n-d | Rex tìm mãi, tìm mãi. |
| 4 | 🐕 | <u>A</u> quick dog digs in <u>the</u> sand. | 7 | quick = qu-i-ck · dog = d-o-g · digs = d-i-g-s · in = i-n · sand = s-a-n-d | Một chú chó nhanh nhẹn bới cát. |
|  |  | Then <u>the</u> dog barks! | 4 | then = th-e-n · dog = d-o-g · barks = b-ar-k-s | Rồi chú chó sủa vang! |
| 5 | 🐕🪙👦 | It digs up <u>the</u> coin! | 5 | it = i-t · digs = d-i-g-s · up = u-p · coin = c-oi-n | Chú chó đào được đồng xu lên! |
|  |  | Rex is <u>so</u> glad. | 4 | rex = r-e-x · is = i-s · glad = g-l-a-d | Rex vui lắm. |

| Câu hỏi | Olly hỏi | Lựa chọn | Đáp án | Sai lần 1 hiện trang | Giải thích khi sai lần 2 |
|---|---|---|---|---|---|
| 1. chọn hình | Who finds the coin?<br>*Ai tìm thấy đồng xu?* | 🐶 dog / 🐱 cat / 🦆 duck | **dog** — *The dog digs up the coin!* | trang 5 | Chú chó bới cát và đào được đồng xu lên. |
| 2. chọn chữ | Where does the coin drop?<br>*Đồng xu rơi ở đâu?* | sand / pond | **sand** — *The coin drops in the sand.* | trang 3 | Đồng xu rơi xuống cát ở công viên. |
| 3. xếp thứ tự | What happens first, next and last?<br>*Chuyện gì xảy ra trước, sau, cuối cùng?* | 👦🏞️ trang 2 / 🪙🏖️ trang 3 / 🐕🪙👦 trang 5 | trang 2 → 3 → 5 | — | Đầu tiên Rex chạy ra công viên, rồi đồng xu rơi xuống cát, cuối cùng chú chó tìm thấy đồng xu. |

