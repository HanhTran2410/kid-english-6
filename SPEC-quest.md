# SPEC — 🧩 Quest / Thử thách — Olly English (bé 6 tuổi)

> Phiên bản spec: **draft2** · Ngày: 2026-11-11 · Dựa trên app 0.9.0 (SPEC.md mục 3.4, lộ trình mục 7: bản 0.8)
> Trạng thái: **đã chốt 2026-11-11** (bố mẹ đồng ý mọi đề xuất ở mục 13). **Q-0 + Q-a đã làm ở 0.10.0** — ghi chú ở mục 14. Số bản: "0.8" trong spec này đổi thành **0.10.x** (0.9.0 Toán đã phát hành trước).
>
> Quest là khu **dùng lại** chữ, từ, câu bé đã học ở Read / Spell để **làm** một việc: đọc rồi làm theo, xếp câu, đoán từ, điền ô chữ. **Không dạy âm / chữ cái mới**; chỉ giới thiệu thêm **từ chức năng** cần cho câu lệnh (mục 2.4). SPEC.md mục 3.4 mới chốt hướng 4 trò; spec này viết chi tiết.

### Thay đổi so với draft1 (theo review)
- **Kiến thức bé đã học** tính theo **từng nhóm âm đã đọc xong**, không suy "xong nhóm 4 là đã học nhóm 1–3" (2.2). Thêm **bộ kiểm tra đọc được** dùng chung cho mọi chữ bé phải đọc ở Quest 1–3 (2.3), có danh sách từ **không đọc theo âm** (*put*…) phải coi là tricky word.
- **Kho không đủ 8 mục**: bảng xử lý theo số nội dung hợp lệ; 0 → không mở lượt (2.5).
- **Từ chức năng của Quest** (*put*, *under*): giới thiệu trước khi chơi, ghi rõ không phải từ bé đã học từ trước (2.4).
- **Quest 1**: tách lỗi theo 3 trường **đồ / chỗ / vị trí** (*thing / place / where*); câu hai việc: **mỗi việc một trạng thái**, việc đúng giữ lại, chỉ làm lại việc sai; **bảng cặp đồ – chỗ đặt hợp lý** (bố mẹ duyệt), không ghép tự do; ô đích hiện **hình đồ vật mờ đúng vị trí**; chạm chỗ đặt khi chưa cầm đồ **không tính sai**; mức 3 tách: câu *under* một việc trước, câu hai việc cuối lượt (4).
- **Quest 2**: chấm theo **chuỗi chữ**, thẻ cùng chữ đổi chỗ tự do; sai 2 lượt → Olly xếp nốt, bé không phải xếp lại cả câu; câu đa dạng mẫu; hàng thẻ xuống dòng, không thu nhỏ thẻ (5).
- **Quest 3**: mỗi từ có **đặc điểm** (`traits`) để kiểm tra **đáp án duy nhất theo nghĩa**; gợi ý âm đầu phát **âm** (/f/), không đọc tên chữ; lựa chọn khác âm đầu; mức 2 có hình ở phần làm mẫu; lựa chọn không đổi chỗ khi sai; câu tổng kết viết riêng từng từ (6).
- **Quest 4**: **mỗi ô một chữ cái** (digraph *sh* là 2 ô); ô giao nhau là **một ô dữ liệu**, từ đúng thì khóa, không ghi đè; phản hồi chỉ ở từ đang chọn; **số mục = số từ thực tế** (6–8), sao tính theo đó; bộ ghép ô chữ có test cho mọi trường hợp khó; bố cục ưu tiên lưới (7).
- **Khung chung**: tách module từ khu Toán là **một bước riêng trước Q-a**, Toán không đổi hành vi, chạy toàn bộ test Toán trước / sau; Quest dùng qua cấu hình (11.1).
- **Khóa tiến độ** dùng **ID ổn định** của nội dung; tiến độ đọc câu tách riêng (10.1). Tắt "Mở mọi mức" không mất mức đã mở nhờ thành tích (10.3).
- **Chạm liên tục**: khóa tương tác lúc chấm / chuyển mục, một mục chỉ ghi một kết quả (8.2).
- Test thêm QU-09 → QU-28 (12.3).

## 1. Mục tiêu

| Trò | Kỹ năng chính | Bé làm gì |
|---|---|---|
| **Quest 1 — 🧸 Read and Do** / Đọc rồi làm | **Đọc hiểu câu chỉ dẫn** (*in / on / under*, danh từ đã học) | Đọc *"Put the cat in the box."* → chạm con mèo → chạm hình mèo mờ trong cái hộp |
| **Quest 2 — 🧱 Build a Sentence** / Xếp câu | **Trật tự từ** trong câu, chữ hoa đầu câu, dấu chấm | Chạm thẻ từ theo thứ tự thành câu *"The dog is on the bed."* |
| **Quest 3 — 🔍 Guess the Word** / Đoán từ | **Đọc / nghe gợi ý** và suy luận; âm đầu | Đọc gợi ý *"It is in the sky. It is hot."* → chạm hình / từ đúng (*sun*) |
| **Quest 4 — ✏️ Mini Crossword** / Ô chữ nhỏ | **Đánh vần** từ đã học, chữ chung ở chỗ giao nhau | Chạm hình gợi ý → xếp chữ vào hàng / cột của từ đó |

- Mọi chữ bé phải đọc qua **bộ kiểm tra đọc được** (2.3). Từ không qua kiểm tra chỉ xuất hiện trong lời Olly nói, không bắt bé đọc.
- Phản hồi theo nguyên tắc chung: chỉ chỗ sai + làm mẫu (SPEC 4), giải thích tiếng Việt khi sai 2 lần (4.1), 🔊 nghe lại + phụ đề (4.5), sao theo % đúng (4.4).

### Ngoài phạm vi bản 0.8
- Bản đồ phiêu lưu, huy hiệu, phần thưởng: sau 0.8.2 (13.4).
- Bé gõ phím / viết tay trong ô chữ: Quest 4 chỉ dùng ô chữ trong khay. Viết tay đã có ở Tập viết.
- Câu ghép hai mệnh đề, câu hỏi *wh-* ở Quest 2.
- Trò có tính giờ, thi đua: không làm (SPEC.md 4.4 không tính theo tốc độ).
- Bài **Theo sách** (bố mẹ tạo): chưa dùng ở 0.8 (từ / câu của sách chưa chắc đọc được, ảnh có thể thiếu). Có thể thêm sau qua cùng bộ kiểm tra 2.3.

## 2. Nội dung: bé đã học gì, chữ nào bé đọc được

### 2.1. Vị trí trong app
- Thẻ **🧩 Quest / Thử thách** đã có ở màn chính (lưới 3 + 2), đang mờ với nhãn *Sắp mở*. Bản 0.8.0 bỏ nhãn; bố cục màn chính không đổi.
- Màn danh sách: thẻ trò (Quest 1 → 4) giống danh sách bài Toán — sao của mức cao nhất đã chơi + nhãn "Mức N", ⭐ "Tiếp theo" ở trò đầu tiên chưa chơi xong lần nào, **không khóa trò**, trò của đợt chưa làm thì không hiện.

### 2.2. Kiến thức bé đã học (`learnedPhonics`)
```js
learnedPhonics = {
  completedGroups: [1, 2, 4],          // nhóm có bài Phonics đã đọc xong ở khu Read (lesson:<id>.completedAt)
  graphemes: Set(['s','a','t',…]),     // hợp các grapheme CỦA ĐÚNG các nhóm đó (không gộp nhóm bỏ qua)
  tricky: Set(['i','the','he',…]),     // hợp tricky words của các nhóm đó
}
```
- Tính lại mỗi lần mở khu Quest, từ bản ghi tiến độ (không lưu thêm).
- **Không suy luận** "xong nhóm sau là đã học nhóm trước". Bé xong nhóm 4 mà bỏ nhóm 2 → grapheme nhóm 2 (*c k ck e h r m d*) **không** có trong tập; từ / câu chứa chúng bị loại.
- **Kho nội dung** của Quest = từ có hình + câu của các bài Phonics trong `completedGroups`, sau khi lọc qua 2.3. Hoàn thành bài không có nghĩa bé đã thạo mọi từ — kiểm tra từng từ vẫn bắt buộc.

### 2.3. Bộ kiểm tra đọc được (dùng chung Quest 1, 2, 3)
```js
canRead(text, learnedPhonics) → { ok: boolean, bad: string[] }
```
1. Tách câu thành từ (`tokenize`, bỏ dấu câu, chữ thường).
2. Từ thuộc `tricky` (của nhóm đã học) hoặc `QUEST_WORDS` đã giới thiệu (2.4) → đọc được.
3. Từ thuộc danh sách **không đọc theo âm** `NOT_PHONETIC` (*put, of, said, who, what, one, two, you, your…* — tách được thành grapheme nhưng không đọc như vậy) mà không có trong `tricky` / `QUEST_WORDS` → **không** đọc được.
4. Còn lại: `toGraphemes(từ, graphemes)` tách được → đọc được (cùng quy tắc với test câu của bài Read, `karaoke.test.js`).
5. Câu có một từ không đọc được → loại cả câu, không tự động đưa vào Quest. Câu đố / câu lệnh soạn sẵn cũng qua kiểm tra này **lúc chọn mục**, không chỉ trong test.

Ví dụ với bé đã xong nhóm 1–3: *"It is in the sky."* — *sky* có *y* (nhóm 6) → loại; *"It is hot."* → đọc được. Vì vậy câu đố Quest 3 có **nhiều cặp gợi ý** theo mức chữ (6.3).

### 2.4. Từ chức năng của Quest (`QUEST_WORDS`)
- Quest 1 cần *put* (câu lệnh) và *under* (mức 3). Hai từ này **không đọc theo âm đã học** (*put* /pʊt/; *under* có *er* nhóm 7) nên coi như tricky word **riêng của Quest**:
  - Lần đầu chơi Quest 1 (và lần đầu tới câu *under*), Olly giới thiệu trước khi chơi: thẻ chữ to + *"This word is put. Put means: move it there."* + dòng tiếng Việt *"put = đặt"*.
  - Đã giới thiệu thì ghi `quest/word/put` (`seenAt`) — các lần sau không giới thiệu lại; 🔊 trên thẻ chữ đọc lại được.
  - Đây là từ chức năng **được giới thiệu riêng ở Quest**, không phải từ bé đã học ở Read. Góc bố mẹ ghi rõ như vậy.

### 2.5. Kho không đủ mục
| Số nội dung hợp lệ cho trò | Cách xử lý |
|---|---|
| ≥ 8 | chơi bình thường, không lặp |
| 4–7 | lặp lại cho đủ 8, không lặp liền nhau, phân bổ đều |
| 1–3 | lặp lại cho đủ 8, mỗi lần lặp đổi đồ nhiễu / thứ tự thẻ / vị trí đáp án |
| 0 | **không mở lượt**: Olly nói *"Let's read more first!"* + chữ tiếng Việt *"Bé đọc thêm bài ở khu Tập đọc rồi quay lại nhé!"*; thẻ trò mờ, không tính lượt |

- Không bao giờ dùng từ / câu chưa học để lấp cho đủ 8.
- Quest 4 cần đủ từ ghép được ô chữ (7.5); không đủ → như hàng "0".

## 3. Một lượt chơi (dùng chung 4 trò)

Dùng lại khung bài của khu Toán (SPEC-math mục 3, 6), qua cấu hình riêng của Quest (11.1).

| Phần | Cách làm |
|---|---|
| Chọn mức | 3 mức; lượt ở mức cao nhất đã mở đạt ≥ 2⭐ → mở mức sau; Cài đặt **Mở mọi mức của Quest** |
| Olly làm mẫu | 1–2 lượt; trò đã có sao → rút gọn + ⏭ |
| Mục có chấm | **8 mục** (Quest 4: **số từ thực tế 6–8**, 7.3) |
| Kết quả mục | đúng ngay → `independent`; sai 1 rồi đúng → `helped`; sai 2 → tiếng Việt một lần + đáp án sáng → `missed` (cách đếm sai riêng từng trò: 4.2, 5.3, 6.1, 7.3) |
| Bé đọc câu | 2–3 mục, không liền nhau, karaoke, ⏭, **không tính sao** — Quest 1: câu chỉ dẫn; Quest 2: câu vừa xếp; Quest 3: câu tổng kết; Quest 4: không có |
| Không chạm 20 giây | nhắc lại câu hỏi **một lần**, 🔊 sáng viền |
| 🔊 | đọc lại câu hỏi + phụ đề; **không tính là trợ giúp** (giống Toán); đếm số lần bấm để bố mẹ xem (10.2) |
| Ra nền rồi quay lại | về đúng mục, lần sai trước vẫn tính; việc đã làm đúng của câu hai việc vẫn giữ (4.2) |
| Sao | SPEC 4.4 trên các mục có chấm của lượt |

## 4. Quest 1 — 🧸 Read and Do

### 4.1. Màn hình
```
 ┌────────────────────────────────────────────────┐
 │  Put the cat in the box.          ← câu chỉ dẫn (Andika, karaoke)
 │  Đặt con mèo vào trong cái hộp.   ← dòng tiếng Việt (mức 1, nếu bật showVi)
 │  Now tap a place.                 ← dòng nhắc khi đang cầm đồ
 │                                                │
 │      🛏️              📦              👜         │ ← chỗ đặt (≥ 96 px)
 │   ░🐱░ trên        ░🐱░ trong       ░🐱░ trong   │ ← ô đích: hình đồ đang cầm, mờ, đúng vị trí
 │   ░🐱░ dưới                                     │
 │                                                │
 │   [🐱]  🐶  🎩  🖊️                               │ ← kệ đồ vật (≥ 64 px); [ ] = đang cầm
 └────────────────────────────────────────────────┘
```
- **Chỗ đặt**: 3 chỗ mỗi mục, lấy theo **bảng cặp hợp lý** 4.4.
- **Ô đích**: khi bé đang cầm đồ, mỗi chỗ đặt hiện các **ô đích** của những vị trí hợp lý với đồ đó (*in / on / under*), mỗi ô là **hình đồ đang cầm, mờ, đặt đúng vị trí** (trong miệng hộp / trên mặt giường / dưới gầm giường) — không chỉ là viền chấm. Ô đích ≥ 64 px.
- **Kết quả đúng** hiện rõ quan hệ không gian: đồ nằm hẳn trong / trên / dưới chỗ đặt (lớp vẽ trước / sau hình chỗ đặt), không đè lệch.
- **Kệ đồ vật**: 4–6 đồ gồm đồ cần đặt + đồ nhiễu. Mức 2–3 có đồ nhiễu **giống chữ** với đáp án (*cat / hat*, *pen / hen / ten*, *box / fox*, *pig / pin*), chỉ khi đồ nhiễu đó cũng đọc được (2.3).

### 4.2. Cách chơi và chấm
1. Câu chỉ dẫn hiện ra. Mức 1: Olly đọc (karaoke). Mức 2–3: Olly nói *"Read it and do it!"*, bé tự đọc (🔊 đọc hộ, không tính trợ giúp).
2. **Cầm đồ:** chạm một đồ → đồ có **viền đậm + nhấc lên**, dòng nhắc *"Now tap a place."*, ô đích hiện ra. Chạm đồ khác → đổi đồ đang cầm. Chạm lại đồ đang cầm → bỏ cầm, ô đích ẩn.
3. **Đặt:** chạm một ô đích → đồ bay tới (~300 ms) → **chấm**.
   - Chạm chỗ đặt / khoảng trống khi **chưa cầm đồ**: không làm gì, **không tính sai** (Olly nhắc *"Tap a thing first."* tối đa một lần mỗi mục).
4. **Chấm theo 3 trường** của việc cần làm `{ thing, where, place }`, lấy lỗi đầu tiên theo thứ tự:

| Sai | Olly nói | Chữ sáng trong câu |
|---|---|---|
| `thing` (đồ) | *"That is a hat. Find the cat!"* | *cat* |
| `place` (chỗ đặt) | *"That is the bed. Put it in the box!"* | *box* |
| `where` (vị trí) | *"The cat is on the box. Put it IN the box!"* | *in* |

   - Sai → đồ bay về kệ. Lần 1: chữ ứng với lỗi sáng lên (bảng trên). Lần 2: giải thích tiếng Việt một lần theo đúng lỗi (*"Câu nói: đặt con mèo VÀO TRONG cái hộp. "in" là ở trong."*) + đồ đúng và ô đích đúng sáng → bé làm theo → `missed`.
5. Đúng → khen + Olly đọc câu trọn (karaoke), đồ ở lại chỗ mới.

**Câu hai việc** (mức 3, *"Put the cat in the box and the hat on the bed."*):
```js
item.actions = [
  { thing: 'cat', where: 'in', place: 'box', done: false, wrong: 0 },
  { thing: 'hat', where: 'on', place: 'bed', done: false, wrong: 0 },
]
```
- Bé làm **việc nào trước cũng được**. Lần đặt được so với các việc **chưa xong**: khớp `thing` của việc nào thì chấm theo việc đó; không khớp đồ của việc nào → lỗi `thing`, tính cho việc chưa xong đầu tiên.
- Việc đúng → đồ ở lại, `done: true`, giữ nguyên tới hết mục (kể cả ra nền rồi quay lại).
- Việc sai → chỉ việc đó đếm sai (`wrong` riêng); sai 2 lần → tiếng Việt + gợi ý **cho việc đó**.
- Mục xong khi mọi việc `done`. Kết quả mục: mọi việc `wrong = 0` → `independent`; có việc sai nhưng không việc nào tới 2 → `helped`; có việc sai 2 → `missed`.

### 4.3. Mức
| Mức | Câu chỉ dẫn | Kệ đồ | Hỗ trợ |
|---|---|---|---|
| 1 | *Put the X in / on the Y.* | 4 đồ (1 đúng + 3 nhiễu khác hẳn) | Olly đọc câu trước; tiếng Việt dưới câu |
| 2 | như mức 1 | 5 đồ, có đồ nhiễu giống chữ | bé tự đọc |
| 3 | mục 1–5: một việc, có ≥ 2 câu *under*; mục 6–8: **câu hai việc** (*in / on*, không *under*) | 5 đồ (một việc) / 6 đồ (hai việc), có đồ nhiễu giống chữ | bé tự đọc |

- Trong 8 mục: *in* / *on* (/ *under*) cân bằng (chênh ≤ 2); không lặp cùng đồ + cùng chỗ + cùng vị trí; không hai mục liền cùng đồ.
- Mức 3 tăng từng yếu tố một: *under* ở nửa đầu lượt, câu hai việc ở cuối lượt khi bé đã quen.

### 4.4. Bảng cặp đồ – chỗ đặt (bố mẹ duyệt, câu hỏi 13.6)
Không ghép tự do mọi đồ với mọi chỗ. Chỉ dùng cặp trong bảng; code chỉ lọc thêm theo 2.3.

| Đồ vật | in | on | under |
|---|---|---|---|
| cat, dog, pig, rat, hen, fox | box, bag | bed, box | bed |
| ant, bug, frog, chick | box, bag, cup | bed, box | bed |
| hat | box, bag | bed, box | bed |
| pen, pin, coin, ring | box, bag, cup | bed, box | bed |
| book | box, bag | bed, box | bed |
| fish | cup | — | — |

- Chỗ đặt và vị trí: **box 📦** (in, on), **bag 👜** (in), **cup ☕** (in — chỉ đồ nhỏ), **bed 🛏️** (on, under). *under* chỉ dùng với **bed** (hình gầm giường rõ ràng).
- Mỗi cặp có câu `vi` viết sẵn theo mẫu *"Đặt {đồ} vào trong / lên trên / xuống dưới {chỗ}."*.

### 4.5. Dữ liệu một mục
```json
{ "id": "q1-cat-in-box", "actions": [{ "thing": "cat", "where": "in", "place": "box" }],
  "text": "Put the cat in the box.", "vi": "Đặt con mèo vào trong cái hộp.", "shelf": ["cat", "hat", "dog", "pen"] }
```
- `id` sinh từ nội dung (`q1-<thing>-<where>-<place>`, câu hai việc nối hai phần) → ổn định giữa các lượt.

## 5. Quest 2 — 🧱 Build a Sentence

### 5.1. Màn hình và cách chơi
```
            🐶 (hình của câu)
   [ The ] [ dog ] [ ___ ] [ ___ ]
   [ ___ ] [ ___ ] .                       ← hàng câu xuống dòng khi hẹp
   ─────────────────────────────────────────
     is      bed      on      the            ← khay thẻ từ (xáo trộn)
```
- Hàng chỗ trống = số từ của câu; **dấu chấm cuối câu có sẵn**. Chữ hoa đầu câu nằm trên thẻ của từ đầu (*The*).
- Mỗi thẻ có `tokenId` riêng (`the-1`, `the-2`) để vẽ / di chuyển; **chấm chỉ so chữ**, không so `tokenId`.
- Bé chạm thẻ trong khay → thẻ vào chỗ trống kế tiếp. Chạm thẻ đã đặt (chưa chấm) → về khay.
- Đầy hàng → chấm cả câu theo **chuỗi chữ**:
  - đúng → Olly đọc câu (karaoke), khen;
  - sai → thẻ ở chỗ có **chữ khác chữ đúng** rung và về khay; thẻ đúng chữ đúng chỗ **giữ lại và khóa** (không chạm về khay được nữa); Olly đọc phần đúng liền đầu câu rồi dừng ở chỗ trống: *"The dog is … ?"*.
- Câu có chữ lặp (*the … the*): số thẻ = số lần xuất hiện; hai thẻ cùng chữ **đổi chỗ tự do**, không bị báo sai; không thiếu / thừa thẻ.

### 5.2. Mức
| Mức | Câu | Gợi ý |
|---|---|---|
| 1 | 3–4 từ | Olly đọc câu trước khi bé xếp; thẻ đầu câu đặt sẵn |
| 2 | 4–6 từ | có hình; Olly **không** đọc trước (🔊 đọc được); thẻ đầu câu đặt sẵn |
| 3 | 4–7 từ | có hình; không đặt sẵn thẻ nào; **1 thẻ nhiễu** cùng loại (*cat* khi câu có *dog*), đọc được (2.3) |

- Trong một lượt, câu **đa dạng mẫu**: không quá 3 câu cùng 2 từ đầu (*The cat…*); ưu tiên trộn *I see a …*, *The X can …*, *A X is …*, *The X is on the …* (từ kho 2.2).

### 5.3. Chấm
- Một câu = một mục. Đúng lần đầu → `independent`; sai 1 lượt xếp rồi đúng → `helped`.
- Sai lượt thứ 2 → tiếng Việt một lần (dịch câu + *"Câu tiếng Anh bắt đầu bằng ai / cái gì, rồi tới việc làm…"*) + **Olly xếp nốt** các thẻ còn lại theo thứ tự, đọc câu → `missed`. Bé **không** phải xếp lại cả câu; bé đọc theo ở phần đọc câu (nếu mục này có).

### 5.4. Dữ liệu
- Câu lấy từ `sentences` của các bài trong kho (2.2), qua 2.3. `id` mục = `<lessonId>-<sentenceId>` (ví dụ `phonics-g3-s1`) — ổn định, không dùng chính câu làm khóa.
- Tách từ bằng `tokenize` (giữ chữ hoa của từ đầu, bỏ dấu câu cuối). Câu có dấu phẩy, ngoặc kép hoặc > 7 từ: không dùng.
- Kho ít hơn 8 câu → theo 2.5.

## 6. Quest 3 — 🔍 Guess the Word

### 6.1. Cách chơi và chấm
- Olly đọc **2 câu gợi ý** (karaoke, chữ hiện trên màn), ví dụ *"It is an animal. It can swim."*. Bé chạm đáp án trong 3–4 lựa chọn.
- Sai lần 1 → gợi ý thứ 3 là **âm đầu**: *"It starts with…"* + **âm** phát từ file âm rời (/f/), **không đọc tên chữ** ("ef"). Lựa chọn dạng chữ: chữ đầu của **mọi** lựa chọn sáng như nhau (không làm đáp án nổi bật).
- Sai lần 2 → tiếng Việt một lần (nghĩa 2 gợi ý + nghĩa của từ đáp án) + đáp án sáng → `missed`.
- Đúng → câu tổng kết **viết riêng cho từng từ** (`sum`), ví dụ *"Yes! It is a fish. A fish can swim."*; không dùng một mẫu cứng cho mọi từ.
- **Lựa chọn giữ nguyên vị trí** suốt mục (không đổi chỗ sau khi sai); lựa chọn đã chạm sai mờ đi nhưng vẫn ở chỗ cũ.

### 6.2. Mức
| Mức | Lựa chọn | Nhiễu |
|---|---|---|
| 1 | 3 **hình** | khác loại (con vật / đồ ăn / đồ vật…) |
| 2 | 3 **từ** (chữ, không hình). Phần làm mẫu: chữ có hình nhỏ bên cạnh, rồi hình ẩn khi bé chơi | cùng loại |
| 3 | 4 **từ** | cùng loại, có từ **giống chữ** (*fish / dish*, *cat / hat*, *hen / pen*, *box / fox*) — bé phải đọc kỹ |

- Mọi mức: các lựa chọn **khác âm đầu** (để gợi ý âm đầu có ích). Từ giống chữ ở mức 3 vì thế khác chữ đầu, giống phần sau.
- Mức 2–3 kiểm tra **đọc**, không phải vốn từ: chỉ dùng từ bé đã gặp có hình ở Read; Góc bố mẹ không dùng mức 3 làm thước đo duy nhất về đọc.

### 6.3. Dữ liệu câu đố (viết sẵn, kiểm duyệt)
```json
{ "word": "fish", "kind": "animal", "traits": ["swims", "wet"],
  "clues": [
    { "en": ["It is an animal.", "It can swim."], "vi": ["Nó là một con vật.", "Nó biết bơi."], "trait": "swims" },
    { "en": ["It is an animal.", "It is wet."], "vi": ["Nó là một con vật.", "Nó ướt."], "trait": "wet" }
  ],
  "sum": "Yes! It is a fish. A fish can swim.", "sumVi": "Đúng rồi! Đó là con cá. Con cá biết bơi." }
```

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| `word` | có | từ có hình trong bài nhóm 1–7 (67 từ hiện có) |
| `kind` | có | `animal`, `food`, `thing`, `place`, `person`, `nature` — chọn nhiễu theo mức |
| `traits` | có | đặc điểm của từ (`swims`, `flies`, `hot`, `in-sky`, `can-eat`, `has-tail`…) |
| `clues` | có, ≥ 1 cặp | mỗi cặp: 2 câu EN + 2 câu VI + `trait` mà câu 2 nói tới; nhiều cặp để còn cặp đọc được ở nhóm thấp |
| `sum`, `sumVi` | có | câu tổng kết đúng với từ đó |
| hình | có | emoji hoặc ảnh trong 🖼️ Kho ảnh |

- **Đáp án duy nhất theo nghĩa:** mỗi lựa chọn nhiễu phải **không** có `trait` của câu gợi ý 2, và nếu cùng `kind` thì không khớp cả câu 1. Câu đố / bộ lựa chọn không qua kiểm tra → loại (QU-19). Ví dụ gợi ý *"It can swim."* thì *frog* không được làm nhiễu cho *fish* (ếch cũng bơi được: `traits` của *frog* có `swims`).
- **Đọc được:** lúc chọn mục, dùng cặp gợi ý đầu tiên qua 2.3; không cặp nào qua → không dùng từ đó (bé học thêm nhóm thì từ tự xuất hiện).
- Mỗi từ có hình **phải có** câu đố (test); viết đủ 67 từ ở đợt Q-b, bố mẹ duyệt cả bảng trước khi phát hành.
- **Bảng đã soạn (2026-11-12, sửa theo review lần 1, bố mẹ đã duyệt lần 2):** dữ liệu ở `app/js/quest/riddles.js`, bảng duyệt [QUEST-RIDDLES.md](QUEST-RIDDLES.md) sinh bằng `node scripts/riddles-sheet.mjs` (kiểm tra luôn: đủ 67 từ, đáp án có đặc điểm câu 2, nhóm đọc được của từng cặp và câu tổng kết). Khác bản thảo ở trên:
  - `traits` ghi theo **đặc điểm → mọi từ đúng** (bảng `TRAITS`, kể cả "có thể đúng": chó cũng bơi được) — dễ rà hơn ghi rải từng từ; `traitsOf(word)` suy ra.
  - Thêm loại `vehicle`, `body`, `number`, `colour`, `action`. **Không mượn nhiễu loại khác** (review bảng, P0-4): mức 2–3 chỉ nhiễu cùng loại; thiếu → mức 3 còn 3 lựa chọn, vẫn thiếu → từ đó chỉ chơi ở mức thấp hơn (`choicesAt`). Mức 1 (hình, nhiễu khác loại) luôn đủ.
  - Số viết bằng chữ số (*"It is 5 and 5."*): Olly đọc, bé không đánh vần.
  - Nhóm đọc được của cặp gợi ý và câu tổng kết **luôn tính** bằng `canRead` (`readFrom`), không ghi tay. Câu tổng kết bé chưa đọc được → Olly đọc, bé nghe (không tính "bé đọc câu").
  - Từ tách được bằng chữ đã học nhưng đọc theo âm sai (*home, gold, spider, words, chair, hair*…) nằm trong `NOT_DECODABLE` — test chặn; bảng duyệt in cách tách âm của mọi từ (197 từ) để bố mẹ soát thêm. *of* không dùng (không phải tricky word đã học).
  - Đáp án duy nhất: nhiễu phải **sai câu 2** (bảng `TRAITS` ghi mọi từ câu đó đúng, kể cả "có thể đúng") → không lựa chọn nào khác khớp cả hai câu; lựa chọn chỉ lấy từ 67 từ có hình bé đã học, nên không có đáp án ngoài bộ (vd. *sofa*).
  - Kiểm tra dữ liệu: `tests/unit/riddles.test.js` (RD-01 → 07, 09, 10, 13, 18). RD-08, 14, 15, 17 test ở bộ sinh Quest 3 (đợt Q-b); RD-11, 12, 16 do bố mẹ duyệt.
  - Bé xong nhóm 1–3 thì có 21 / 67 từ dùng được; xong nhóm 1 → chưa có (thẻ mờ).

## 7. Quest 4 — ✏️ Mini Crossword

### 7.1. Màn hình
```
 iPad ngang                                   iPhone dọc
 ┌───────────────────┬──────────────────┐      ┌──────────────┐
 │  lưới (≤ 6 × 6)   │ 🐱 2→  ☕ 1↓      │      │ lưới         │
 │  ô ≥ 64 px        │ 🎩 3↓  🐶 4→      │      │ ô ≥ 48 px    │
 │                   │ ────────────────  │      ├──────────────┤
 │                   │ [c][a][t][h][p]   │      │ hình gợi ý   │
 └───────────────────┴──────────────────┘      │ khay chữ     │
                                               └──────────────┘
```
- Lưới tối đa 6 × 6, 3–4 từ giao nhau, mỗi từ 3–5 chữ cái.
- **Mỗi ô là một chữ cái** (như ô chữ thường). Digraph *sh, ch, th, ee, oo…* chiếm **2 ô**; giao nhau theo **chữ cái**. Khay ô chữ cũng là chữ cái (không dùng ô grapheme của Spell); Olly vẫn đánh vần theo **âm** khi đọc từ (*"Ship. /sh/ – /i/ – /p/."*).
- **Bố cục ưu tiên lưới**: iPad — lưới trái, hình gợi ý + khay phải; iPhone dọc — lưới trên, hình + khay dưới. Không cuộn màn khi đang điền một từ.
- Bé **chạm hình gợi ý** (hoặc một ô của từ) → ô của từ đó có **viền đậm + mũi tên chiều** (→ / ↓), Olly đọc từ (mức 1: đánh vần âm; mức 2: chỉ đọc từ; mức 3: không đọc, 🔊 đọc được).
- Khay: các **chữ cái** của từ (trừ ô đã khóa) + 0–2 chữ nhiễu. Chạm chữ → vào ô trống kế tiếp của từ; chạm chữ đã đặt (chưa chấm) → về khay.

### 7.2. Ô giao nhau
- Ô giao nhau là **một ô dữ liệu duy nhất** dùng chung cho hai từ.
- Từ điền **đúng** → mọi ô của từ **khóa** (màu xanh), kể cả ô giao nhau. Từ còn lại thấy sẵn chữ ở ô đó, không phải điền, không ghi đè được.
- Từ chưa đúng → ô giao nhau **chưa xác nhận**: chữ bé đặt chỉ thuộc từ đang chọn; chuyển sang từ khác thì chữ chưa chấm ở ô giao nhau được bỏ, ô trống lại.
- Sai → **chỉ phản hồi ở từ đang chọn**: ô sai của từ đó rung và về khay; ô của từ khác (kể cả ô giao nhau đã khóa) không rung, không xóa.

### 7.3. Mức, số mục, chấm
| Mức | Từ mỗi lưới | Một lượt | Hỗ trợ |
|---|---|---|---|
| 1 | 3 từ, 3 chữ (CVC), 1–2 chỗ giao | 2 lưới = **6 mục** | đánh vần âm khi chọn từ; không chữ nhiễu |
| 2 | 3–4 từ, 3–4 chữ | 2 lưới = **6–8 mục** | đọc từ; 1 chữ nhiễu |
| 3 | 4 từ, 3–5 chữ, có digraph | 2 lưới = **8 mục** | chỉ hình (🔊); 2 chữ nhiễu |

- **Số mục = số từ thực tế** của lượt; sao tính theo SPEC 4.4 trên số mục đó (ví dụ 6 mục: 3⭐ cần 6/6 `independent`, vì 5/6 = 83%).
- Mỗi từ = một mục: đúng lần đầu → `independent`; sai 1 lượt rồi đúng → `helped`; sai 2 → tiếng Việt (nghĩa của từ + *"Từ này có N chữ: …"*) + Olly điền nốt (khóa) → `missed`.

### 7.4. Dữ liệu
- Từ lấy từ kho 2.2 (có hình, chỉ chữ thường a–z, 3–5 chữ). Từ ở Quest 4 **không cần** qua 2.3 (bé không đọc chữ, chỉ nghe + nhìn hình, rồi đánh vần), nhưng phải thuộc nhóm đã học.
- Khóa mục theo **từ** (`quest-q4/cross/<word>`): lưới sinh ngẫu nhiên nên không có ID lưới ổn định; bố mẹ cần biết bé hay sai từ nào, không cần biết lưới nào.

### 7.5. Bộ ghép ô chữ
- Hàm thuần `buildCrossword(words, rand, { size: 6, count })` → `{ cells, entries: [{ word, row, col, dir }] }` hoặc `null`:
  - đặt từ dài nhất ngang ở giữa; lần lượt đặt từ khác **giao** với từ đã đặt ở một chữ cái chung (ngang ↔ dọc xen kẽ);
  - không có hai ô chữ kề nhau tạo ra "từ" thừa; không chạm cạnh từ khác ngoài chỗ giao; không vượt 6 × 6;
  - thử nhiều thứ tự (tối đa 200 lần); không được → `null`.
- `null` → đổi bộ từ (lấy từ khác trong kho), tối đa 20 bộ; vẫn không được → coi như kho không đủ (2.5). **Không bao giờ** hiện lưới không hợp lệ.
- Test: 500 lần × mỗi mức với `rand` cố định; nhiều bộ từ đầu vào (cả bộ không có chữ chung → `null`); từ có chữ lặp (*tree*, *moon*, *queen*); từ có digraph; lưới nhiều giao điểm; mọi lưới trả về hợp lệ.

## 8. Hình vẽ, chạm, bố cục

### 8.1. Chung
- Chỉ dùng **chạm**. Vùng chạm tối thiểu 64 px (đồ vật, ô đích, thẻ từ, lựa chọn, hình gợi ý, chữ trong khay); ô lưới ô chữ 48 px trên iPhone dọc (giống tia số Toán, SPEC-math 8.2).
- Chữ bé đọc dùng font **Andika** (SPEC-write 6.5).
- iPad ngang / dọc và iPhone dọc: Olly và nút 🔊 không đè lên đồ vật / thẻ / lưới; câu dài xuống dòng; **hàng thẻ Quest 2 xuống dòng**, thẻ không thu nhỏ dưới 64 px, khay không che hàng câu.
- **Giảm chuyển động:** đồ / thẻ đổi chỗ ngay (không bay), có viền sáng một lần ở chỗ mới.
- Sai không có tiếng báo sai, không tô đỏ cả màn; luôn có câu của Olly + đổi viền (SPEC-math 5).

### 8.2. Chạm liên tục, khóa tương tác
- Chạm trong lúc Olly đang nói câu phản hồi / câu chấm → bỏ qua (như `Teacher.waitTap`).
- Từ lúc bắt đầu chấm (đồ đang bay, hàng thẻ đầy, ô chữ đầy) tới khi Olly nói xong phản hồi: **khóa tương tác** của mục; chạm bị bỏ qua.
- Chuyển mục: bỏ mọi chạm còn treo của mục cũ (lắng nghe sự kiện gắn theo mục, gỡ khi sang mục mới).
- Một mục chỉ ghi **một** kết quả: ghi khi chốt, đánh dấu `round.results[i]`; chạm thừa sau khi chốt không ghi thêm.

## 9. Câu Olly nói (đều có phụ đề tiếng Việt, test 4.5)
| Chỗ | Câu |
|---|---|
| Giới thiệu từ (2.4) | *"This word is put. Put means: move it there."* · *"This word is under."* |
| Quest 1 | *"Read it and do it!"* · câu chỉ dẫn · *"Now tap a place."* · *"Tap a thing first."* |
| Quest 1 sai | *"That is a {x}. Find the {y}!"* · *"That is the {place}. Put it {where} the {place}!"* · *"The {x} is {where} the {place}. Put it {WHERE} the {place}!"* |
| Quest 2 | *"Make the sentence!"* · sai: đọc phần đúng + *"… ?"* |
| Quest 3 | *"What is it?"* · 2 câu gợi ý · *"It starts with…"* + âm · câu tổng kết `sum` |
| Quest 4 | *"Spell {word}!"* (dùng lại mẫu của Spell) |
| Kho rỗng (2.5) | *"Let's read more first!"* |

## 10. Tiến độ, Góc bố mẹ, cài đặt

### 10.1. Khóa tiến độ (ID ổn định)
| Trò | Khóa mục | `kind` |
|---|---|---|
| Quest 1 | `quest-q1/do/q1-cat-in-box` | `q1:in`, `q1:on`, `q1:under`, `q1:two` |
| Quest 2 | `quest-q2/build/phonics-g3-s1` | `q2:short` (≤ 4 từ), `q2:long` |
| Quest 3 | `quest-q3/guess/fish` | `q3:pic`, `q3:word`, `q3:look-alike` |
| Quest 4 | `quest-q4/cross/ship` | `q4:cvc`, `q4:digraph` |

- Mức: `lesson:quest-qN/L1..L3`; hoàn thành trò: `lesson:quest-qN`.
- **Đọc câu** ghi riêng: `quest-qN/read/<id mục>`, kết quả `independent / helped / practiced` như Toán — **không** cộng vào sao, không vào tỉ lệ đúng ngay theo `kind`, không vào số mục đã làm.
- Từ chức năng đã giới thiệu: `quest/word/<từ>`.
- Mọi bản ghi Quest có tiền tố `quest-` / `quest/` → không cộng vào tiến độ Read / Spell / Toán (Quest 4 viết từ cũng không tính vào Spell).

### 10.2. Góc bố mẹ → 🧩 Quest
- Sao từng mức của mỗi trò; tỉ lệ đúng ngay theo `kind` (như 🔢 Toán), ví dụ *"Quest 1 — under: 2/6 đúng ngay"*.
- Số lần bé bấm 🔊 ở Quest 1–3 mức 2–3 (bé nghe thay vì tự đọc).
- Nhóm âm Quest đang dùng (2.2) và từ chức năng đã giới thiệu (*put*, *under* — "giới thiệu riêng ở Quest").

### 10.3. Cài đặt
- Cài đặt → **🧩 Quest**: *Mở mọi mức của Quest*.
- Mức đã mở = mức mở nhờ thành tích (≥ 2⭐) **hoặc** cài đặt đang bật. Tắt cài đặt **không** mất mức đã mở nhờ thành tích (cùng cách tính `unlockedLevel` của Toán: tính lại từ tiến độ mỗi lần).

## 11. Đợt làm

| Đợt | Phạm vi | Bản |
|---|---|---|
| **Q-0** | **Tách khung chung** từ `screens/math.js` (11.1); Toán không đổi hành vi; toàn bộ test Toán qua trước / sau | 0.8.0 (bước 1) |
| **Q-a** | Khu 🧩 mở, danh sách trò, `learnedPhonics` + `canRead` (2.2–2.3), từ chức năng (2.4), kho không đủ (2.5), **Quest 1**, **Quest 2**, Góc bố mẹ → 🧩, Cài đặt | 0.8.0 (bước 2) |
| **Q-b** | **Quest 3** + 67 câu đố (bố mẹ duyệt bảng trước khi code xong) | 0.8.1 |
| **Q-c** | **Quest 4** + bộ ghép ô chữ | 0.8.2 |
| Sau | Bản đồ phiêu lưu, huy hiệu, phần thưởng; dùng bài Theo sách | — |

- Trước mỗi đợt: chạy kiểm tra nội dung (2.3, 6.3, 7.5) trên toàn bộ kho có sẵn và in báo cáo (bao nhiêu câu / từ / câu đố dùng được theo từng nhóm), bố mẹ xem trước.

### 11.1. Khung chung (Q-0)
- **Không viết lại** logic Toán. Chỉ tách những phần dùng chung thật sự: chọn mức, làm mẫu (⏭ / ▶), vòng chọn sai 1 / sai 2, đọc câu, sao + mở mức, lượt dở trong `app.current.params.round`, nhắc khi không chạm.
- Mỗi khu truyền **cấu hình** riêng, không viết cứng giá trị của Quest vào module Toán:
```js
const QUEST_CONFIG = {
  zone: 'quest', lessons: BUILTIN_QUESTS, levels: 3, items: (lesson, level) => lesson.key === 'q4' ? null : 8,
  retryLimit: 2, readItems: true, resumeOnBackground: true, allLevelsSetting: 'questAllLevels',
};
```
- Toán dùng `MATH_CONFIG` với giá trị hiện tại. Toàn bộ test Toán (unit + UI) chạy **trước và sau** khi tách; không sửa test Toán để cho qua (QU-28).

## 12. Test

### 12.1. Unit
| Nhóm | Test |
|---|---|
| `learnedPhonics` | chỉ gộp grapheme / tricky của **đúng** nhóm đã xong; xong nhóm 4 bỏ nhóm 2 → không có grapheme nhóm 2 (QU-09) |
| `canRead` | tricky / `QUEST_WORDS` / `NOT_PHONETIC` / tách grapheme; câu có một từ không đọc được → loại (QU-10) |
| Kho không đủ | 0 / 1–3 / 4–7 / ≥ 8 nội dung đúng bảng 2.5; không lặp liền nhau (QU-11) |
| Quest 1 | chỉ cặp trong bảng 4.4; *in / on / under* cân bằng; đồ nhiễu giống chữ chỉ mức 2–3 và đọc được; mức 3: 5 một việc (≥ 2 *under*) + 3 hai việc; `id` ổn định; chấm 3 trường đúng thứ tự (QU-12, QU-13); câu hai việc giữ việc đúng (QU-14) |
| Quest 2 | tách từ (chữ hoa đầu câu, bỏ dấu chấm); > 7 từ bị loại; chữ lặp đủ thẻ, đổi chỗ vẫn đúng (QU-16, QU-17); giữ thẻ đúng chỗ (QU-18); ≤ 3 câu cùng 2 từ đầu |
| Quest 3 | mọi từ có hình có câu đố đủ trường; đáp án duy nhất theo `traits` (QU-19); lựa chọn khác âm đầu; nhiễu đúng loại theo mức |
| Quest 4 | 7.5; ô giao nhau dùng chung, khóa khi đúng (QU-21); digraph 2 ô (QU-22); `null` khi không ghép được (QU-23) |
| Chung | sao / mức như Toán; số mục Quest 4 = số từ; tắt "Mở mọi mức" không mất mức đã mở (QU-24); đọc câu không vào sao / `kind` (QU-27); khóa `quest-*` không cộng vào Read / Spell / Toán |

### 12.2. UI (Playwright)
| ID | Kiểm tra |
|---|---|
| QU-01 | Màn chính: thẻ Quest chạm được, không còn "Sắp mở"; 5 thẻ không cuộn ở 4 cỡ màn |
| QU-02 | Danh sách: 2 trò (0.8.0), ⭐ Tiếp theo ở Quest 1; chưa đọc xong bài nào → dùng nhóm 1; kho rỗng → "Let's read more first!" |
| QU-03 | Quest 1 mức 1: giới thiệu *put* lần đầu; Olly đọc câu; cầm đồ → ô đích hình mờ → đặt → đúng → karaoke; hết lượt → sao |
| QU-04 | Quest 1: sai đồ / sai chỗ / sai vị trí → đúng câu + đúng chữ sáng; sai 2 → tiếng Việt một lần + gợi ý đúng lỗi |
| QU-05 | Quest 2: chạm thẻ vào hàng; sai → thẻ sai về khay, thẻ đúng khóa lại; sai 2 → Olly xếp nốt |
| QU-06 | Ra nền giữa mục rồi quay lại → đúng mục, lần sai trước vẫn tính, việc đúng của câu hai việc vẫn giữ |
| QU-07 | iPhone dọc: đồ / ô đích / thẻ ≥ 64 px, hàng thẻ xuống dòng, không tràn ngang |
| QU-08 | Giảm chuyển động: đồ / thẻ đổi chỗ ngay, có viền sáng |

### 12.3. Thêm theo review
| ID | Kiểm tra | Mong đợi |
|---|---|---|
| QU-09 | Chỉ xong nhóm 4, bỏ nhóm 2 | Không lấy từ chứa âm nhóm 2 |
| QU-10 | Kho có từ không đọc được | Không đưa vào chữ bé phải đọc |
| QU-11 | Kho dưới 8 câu | Đúng bảng 2.5 |
| QU-12 | Quest 1 đúng đồ, sai chỗ | Chỉ báo lỗi chỗ |
| QU-13 | Quest 1 đúng chỗ, sai vị trí | Chỉ báo lỗi vị trí |
| QU-14 | Quest 1 câu hai việc | Giữ việc đúng, chỉ làm lại việc sai |
| QU-15 | Quest 1 chạm chỗ khi chưa cầm đồ | Không tính sai |
| QU-16 | Quest 2 hai thẻ *the* đổi chỗ | Vẫn đúng |
| QU-17 | Quest 2 câu có từ lặp | Không thiếu / thừa thẻ |
| QU-18 | Quest 2 sai một phần | Thẻ đúng giữ lại |
| QU-19 | Quest 3 có hai đáp án cùng đúng nghĩa | Loại bộ lựa chọn |
| QU-20 | Quest 3 âm đầu | Phát âm (file), không đọc tên chữ |
| QU-21 | Quest 4 hai từ giao nhau | Ô giao nhau dùng chung, khóa khi đúng |
| QU-22 | Quest 4 từ có digraph | 2 ô chữ cái |
| QU-23 | Quest 4 không ghép được lưới | Đổi bộ từ / không mở lượt, không có lưới sai |
| QU-24 | Tắt "Mở mọi mức" | Không mất mức đã mở nhờ thành tích |
| QU-25 | Chạm liên tục khi chấm / chuyển mục | Không ghi trùng, không lượt thừa |
| QU-26 | iPhone dọc, ô chữ 6 × 6 | Không tràn, không che khay, không cuộn khi điền |
| QU-27 | Đọc câu | Không vào sao / tỉ lệ đúng ngay |
| QU-28 | Toán sau khi tách khung chung | Toàn bộ test Toán qua, không sửa test |

## 13. Câu hỏi cho bố mẹ
**Đã chốt 2026-11-11:** bố mẹ đồng ý mọi đề xuất dưới đây (câu 1–7).

Câu 1–5 của draft1 — đề xuất chốt theo review:
1. **Nguồn nội dung:** chỉ bài Read **đã đọc xong**, kiểm tra từng grapheme (2.2–2.3). ✔ đề xuất
2. **🔊:** không tính là trợ giúp; đếm số lần bấm cho bố mẹ xem (3, 10.2). ✔ đề xuất
3. **Từ *put*:** giữ, là từ chức năng giới thiệu riêng ở Quest (2.4); *under* cũng vậy. ✔ đề xuất
4. **Bản đồ phiêu lưu / huy hiệu:** để sau 0.8.2. ✔ đề xuất
5. **Thứ tự:** Q-0 (tách khung) → Quest 1 + 2 → Quest 3 → Quest 4. ✔ đề xuất

Câu mới:
6. **Bảng cặp đồ – chỗ đặt (4.4):** bố mẹ duyệt bảng (thêm / bớt cặp). Đề xuất: *under* chỉ dùng với **bed**; *cup* chỉ cho đồ nhỏ (côn trùng, bút, ghim, đồng xu, nhẫn, cá).
7. **Quest 4 chữ cái hay grapheme:** spec chọn **mỗi ô một chữ cái** (digraph 2 ô) cho dễ hiểu và dễ ghép lưới; Olly vẫn đánh vần theo âm. Bố mẹ đồng ý?

## 14. Ghi chú khi làm Q-0 + Q-a (0.10.0)
- **Q-0:** khung lượt chơi tách sang `js/screens/round.js` (`roundListScreen`, `roundLessonScreen`, `chooseLoop`, `waitPick`, `praiseAndRead`, `ollyTap`, đọc câu, làm mẫu, sao + mở mức). Toán dùng `MATH_CONFIG`; bài và hình của Toán ở lại `screens/math.js`. Toàn bộ test Toán qua trước / sau, **không sửa test Toán** (QU-28). Thêm 2 móc tùy chọn cho Quest: `available` (kho rỗng → thẻ mờ, mở vào Olly nói *"Let's read more first!"*, không mở lượt, không tính lượt) và `onStart` (đếm 🔊).
- Code Quest: `js/quest/content.js` (`learnedPhonics`, `canRead`, `questPool`, `fillTo`, `lookAlike`), `js/quest/quest.js` (bảng cặp 4.4, sinh / chấm Quest 1 và 2), `js/screens/quest.js`, `js/screens/parent/quest.js`.
- **canRead** tách từ theo **bảng grapheme đầy đủ** (ưu tiên grapheme dài) rồi mới xét đã học: *see* = s-**ee**, không phải s-e-e — bé chưa học *ee* thì không đọc được. (Test câu của bài Read hiện vẫn dùng cách tách theo chữ đã học; bài có sẵn không có ca lệch.)
- **Chưa đọc xong bài nào → dùng nhóm 1** (QU-02): Quest 2 chơi được với 3 câu nhóm 1; Quest 1 chưa có chỗ đặt bé đọc được (*bag* cần nhóm 3) → thẻ mờ.
- Chỉ xong nhóm 4 (bỏ 1–3): kho rỗng vì mọi từ nhóm 4 cần âm nhóm 1–3 — đúng theo 2.2.
- Quest 1: ô đích theo **chỗ đặt** (box: in / on; bag, cup: in; bed: on / under), không theo đồ đang cầm (để ô đích không lộ đáp án); hình mờ trong ô đích là đồ đang cầm. Đồ đặt sai bay tới rồi về đúng chỗ cũ trên kệ.
- Quest 1 câu hai việc đọc được khi từng việc đọc được và bé đọc được *and* (không kiểm từng cặp — nhanh hơn ~100 lần).
- Quest 2: mức 2–3 chỉ nói *"Make the sentence!"*, 🔊 đọc thêm cả câu (không tính trợ giúp). Xong câu: hàng thẻ thay bằng câu karaoke.
- Từ chức năng: bản ghi `quest/word/put`, `quest/word/under`; 🔊: `quest/listen/q1`, `quest/listen/q2` (số lần bấm).
- Chưa làm ở 0.10.0: Quest 3, Quest 4 (QU-19 → QU-23, QU-26); QU-08 giảm chuyển động có CSS, chưa có test riêng.

## 15. Ghi chú khi làm Q-b — Quest 3 (0.10.1)
- Sinh mục: `makeQ3` (`js/quest/quest.js`) dùng `riddles.js` (bảng đã duyệt). Từ dùng được ở mức L = từ bé đã học có ≥ 1 cặp gợi ý đọc được **và** đủ nhiễu ở mức L (`choicesAt`). Mức được chọn không đủ 3 từ → cả lượt lùi xuống mức hiển thị thấp hơn (`item.show`); mức 1 cũng không đủ → kho rỗng (thẻ mờ, RD-14). Bé xong nhóm 1 hoặc 1–2: Quest 3 mờ.
- Mỗi mục chọn ngẫu nhiên một cặp đọc được; từ lặp lại trong lượt thì đổi cặp nếu có (RD-15). Nhiễu: từ đã học, sai câu 2, khác chữ đầu với đáp án và với nhau; mức 3 ưu tiên từ giống chữ (*cat / rat*, *tap / map*) → `kind` `q3:look-alike`. Vị trí đáp án rút từ túi vị trí → chia đều (RD-17).
- Âm đầu: grapheme đầu theo bảng đầy đủ (*ch*ick, *sh*ip, *qu*een), phát bằng `playPhoneme` (file âm rời, QU-20). Sau sai 1, chữ đầu của **mọi** lựa chọn sáng (mức 2–3).
- Lựa chọn chạm sai: `.tried` (mờ, không chạm lại được), lưu ở `round.q3Tried` → ra nền rồi quay lại vẫn mờ.
- Câu tổng kết: Olly đọc (karaoke) khi khen; phần **bé đọc** chỉ có khi bé đọc được câu đó (`cfg.readable` mới trong `round.js`, mục khác không đổi).
- Mức 2: phần làm mẫu chữ kèm hình nhỏ; khi bé chơi chỉ có chữ.
- Câu gợi ý của Quest 3 cỡ chữ riêng (`.quest .qt-clue .sword`) — câu 2 vế dài bị `sentence.small` thu nhỏ quá.
- Test: unit `makeQ3` (RD-08, 14, 15, 17, QU-19, âm đầu ch / sh / qu), UI Quest 3 mức 1 (hình, sai 1 → mờ + âm đầu từ file → helped, câu tổng kết, sao) và mức 2 (chữ, hình nhỏ ở làm mẫu, chữ đầu sáng, sai 2 → missed).
- Chưa làm: Quest 4 (QU-21 → QU-23, QU-26).

## 16. Ghi chú khi làm Q-c — Quest 4 (0.10.2)
- Bộ ghép `js/quest/crossword.js`: `buildCrossword` (7.5; từ trùng / dài hơn 6 / không chữ chung → `null`), `validCrossword` (mọi dãy ≥ 2 ô liền là một từ, liền mạch, ≤ 6 × 6), `makeQ4`. Bộ từ cho mỗi lần thử: từ sau phải có chữ chung với một từ đã chọn — không thì gần 20% lượt ở kho lớn không ghép được. Kho đủ 7 nhóm: ~0,5% lượt mức 3 vẫn không ghép được sau 20 bộ → màn sinh lại (tối đa 5 lần), không bao giờ hiện lưới sai.
- Bộ *tree / queen / bee* không ghép được (hai *e* liền của *queen* buộc hai từ dọc chạm nhau) — test giữ làm ví dụ `null`.
- Mục = từ (`quest-q4/cross/<từ>`), mục của một lưới liền nhau; `runItem` chạy cả lưới và trả `{ results: [...] }` — khung `round.js` nhận nhiều kết quả một lần (Toán / Quest 1–3 không đổi). Trạng thái lưới (`round.q4`: từ đã khóa, lần sai, kết quả) nằm trong lượt → ra nền rồi quay lại giữ từ đã khóa.
- Quest 4 không có phần bé đọc câu (`readable` false).
- Số trên ô theo **ô bắt đầu** như ô chữ thật (từ ngang và dọc chung ô đầu → *1→* và *1↓*); hình gợi ý xếp theo số.
- Quest 4 dùng kho 2.2 (từ có hình của nhóm đã học) nên **mở được từ nhóm 1** (*ant, pin, tap…*), khác Quest 1 và 3.
- Câu Olly: *"Tap a picture!"* khi mở lưới; *"Spell: {word}!"* (mức 1 + âm từ file; mức 2); mức 3 *"Spell the picture!"*, 🔊 đọc từ; đúng → *"Yes! {word}!"*; sai 1 → *"Try again!"* (+ đọc lại từ ở mức 1–2).
- Test: unit `crossword.test.js` (lưới hợp lệ, ô giao chung, `null`, chữ lặp, digraph 2 ô, 500 lượt × mức × 3 kho, chữ nhiễu không có trong từ); UI QU-21 (khóa, ô giao có sẵn chữ, 6 mục → 3⭐), sai 1 / sai 2 (chỉ ô sai về khay, Olly điền nốt → missed), QU-26 (iPhone dọc mức 3).
- Khu 🧩 đủ 4 trò.
