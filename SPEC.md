# SPEC — Olly English (bé 6 tuổi) — draft2

App anh em của **kid-english** (Bông, bé 3 tuổi): cùng cách làm (PWA chạy offline trên iPad / điện thoại, dữ liệu chỉ lưu trên máy, giọng đọc + nhận dạng giọng nói của máy, Góc bố mẹ nhấn giữ 3 giây), nhưng nội dung và cách chơi cho **bé 6 tuổi** — tuổi bắt đầu đi học lớp 1, tập đọc, tập viết.

**Draft2 sửa theo review draft1 (2026-11-06):** phonics tách chữ / âm (3.1.1), lộ trình và mở bài (3.1.2), nhận dạng giọng nói không phải phán quyết (4.2), tiến độ theo bài + hoạt động + mục (4.3), sao (4.4), bảng kiểm tra lõi chép từ kid-english (2.1–2.2), cấu trúc gói bài + kiểm tra dữ liệu + nhập JSON sớm (5.3–5.7), thời gian buổi (1.1), ghi âm và dữ liệu riêng tư (6.2), test nghiệm thu (8). Chi tiết Spell viết tay, Talk, Quest ở mức đủ để chốt hướng; viết kỹ khi tới phiên bản đó.

## 1. Bé 6 tuổi khác bé 3 tuổi thế nào

| | kid-english (3 tuổi) | Olly English (6 tuổi) |
|---|---|---|
| Mục tiêu | Nghe → nói lại từ / câu ngắn | **Đọc** được từ, câu, truyện ngắn; **đánh vần**, viết được từ; nói câu trọn vẹn |
| Chữ trên màn | Ít, chủ yếu hình | Chữ là trung tâm: chữ to, sáng theo nhịp đọc |
| Thời lượng | 5–8 phút / lượt | xem 1.1 |
| Phản hồi | Luôn khen | Khen + chỉ chỗ sai cụ thể ("Listen: /sh/ — ship") |
| Tự chơi | Bố mẹ ngồi cùng | Bé tự chơi được; bố mẹ xem tiến độ |
| Nhân vật | Thỏ Bông | **Cú Olly** (đeo kính, "thích đọc sách") — tên đổi được (6.1) |

### 1.1. Thời gian
| | Mặc định | Ghi chú |
|---|---|---|
| Một hoạt động (ví dụ 6 từ ghép âm) | 3–5 phút | dữ liệu bài quyết định số mục |
| Một lượt (bé chọn vài hoạt động liền nhau) | 10–15 phút | chỉ là mục tiêu khi soạn bài, app không ép |
| Giới hạn buổi | **20 phút** (15 / 20 / 30 / tắt) | `limitMinutes` |

- Thời gian chỉ cộng khi bé đang trong hoạt động (đã có trong `session.js`).
- Còn ≤ 2 phút: hết hoạt động hiện tại thì Olly nói *"One more and then rest!"* + chữ tiếng Việt "Còn một chút nữa thôi".
- Hết giờ: **không bao giờ cắt ngang** hoạt động. Bé làm xong hoạt động đang dở → lưu tiến độ → Olly khen và đi ngủ (đã đúng như `app.afterActivity` hiện tại). Bố mẹ cho học thêm 15 phút.

## 2. Lõi chép từ kid-english

Cách dùng lại: **chép phần lõi sang** (không chia sẻ code giữa hai repo) — mỗi app sửa tự do, không làm hỏng app kia.

### 2.1. Bảng kiểm tra (đã chép ở 0.1.0 — kết quả xem code thực tế)

| File | Tình trạng | Việc cần làm |
|---|---|---|
| `speech/tts.js, sfx.js` | chép nguyên, dùng được | thêm tốc độ theo loại nội dung (6.1) |
| `speech/microphone.js, recognition.js, listen.js` | chép nguyên. Nhận dạng đã là **phần phụ** (lỗi bất kỳ → tắt cho cả buổi, chỉ còn đo âm lượng) | `listen.js` trả thêm kết quả `ok / unclear / miss / unheard` (4.2) |
| `speech/recorder.js` | chép nguyên; db giới hạn 1 bản ghi / mục / ngày | thêm giới hạn độ dài + tổng dung lượng (6.2) |
| `match.js` | so khớp **rất lỏng** (`soundKey` gộp mọi nguyên âm: *ship ≈ shop ≈ sheep*) — đúng mục đích của kid-english (chỉ để khen) | **không dùng để chấm đọc**. Viết thêm so khớp chặt (4.2); `soundKey` chỉ còn dùng để phân biệt "chưa rõ" với "sai hẳn" |
| `timing.js, text.js, ui.js` | dùng được | — |
| `session.js` | dùng được; còn sót `DEFAULT_LIMIT_MINUTES = 15` (không dùng, lệch với 20 trong `settings.js`) và chú thích trỏ SPEC của kid-english | xóa hằng số thừa, sửa chú thích |
| `image.js` | không phụ thuộc nội dung cũ | — |
| `db.js` | cấu trúc nền tốt (mảng `MIGRATIONS`); khóa tiến độ `read:ship` sẽ **trùng** giữa các bài | đổi khóa (4.3); chưa có dữ liệu tiến độ thật nên đổi ngay không mất gì |
| `app.js` | đã sửa cho Olly | — |

### 2.2. Giữ hai bản lõi không lệch
- Danh sách file lõi để trong `CORE.md`: mỗi dòng gồm file, commit kid-english đã chép từ đó, mã băm (sha-256) của bản hiện tại, các chỗ đã sửa riêng.
- Test `tests/unit/core-sync.test.js` tính lại mã băm từng file lõi và so với `CORE.md` → sửa file lõi mà chưa cập nhật `CORE.md` thì test đỏ. Lúc cập nhật, người sửa phải ghi: **sửa lỗi chung** (cần chép sang kid-english, ghi việc cần làm) hay **sửa riêng cho Olly**.
- Không có bản "gốc" cố định: bản nào sửa lỗi trước là nguồn, ghi rõ trong `CORE.md`.

## 3. Bốn khu học

### 3.0. Màn chính
- Olly chào (gọi tên bé nếu bố mẹ đã nhập) + 4 thẻ to (2 × 2).
- Khu chưa làm: thẻ mờ, có nhãn **Sắp mở**, không nhún. Chạm vào → Olly nói một câu ngắn tiếng Việt (giọng vi-VN nếu có) *"Khu này Olly đang chuẩn bị nhé!"* + chữ; không tính thời gian, không ghi tiến độ.

### 3.1. 📖 Read / Tập đọc

#### 3.1.1. Chữ và âm (nền của Read và Spell)
- Học **âm của chữ** (letter sound), không phải tên chữ (letter name). Tên chữ (*ess, aitch…*) không dùng ở Read / Spell cho tới khi có hoạt động bảng chữ cái riêng, ghi rõ "tên chữ".
- **Grapheme** (nhóm chữ viết ra một âm) ≠ chữ cái: *ship* = **sh – i – p** (3 âm), không phải s – h – i – p.

  | Từ | Grapheme | Âm |
  |---|---|---|
  | cat | c – a – t | /k/ /æ/ /t/ |
  | duck | d – u – ck | /d/ /ʌ/ /k/ |
  | ship | sh – i – p | /ʃ/ /ɪ/ /p/ |
  | thin / this | th – i – n / th – i – s | /θ/ … / /ð/ … |
  | rain | r – ai – n | /r/ /eɪ/ /n/ |
  | cake | c – a_e – k | /k/ /eɪ/ /k/ (a_e: hai chữ tách nhau, một âm) |

- Âm có mã riêng (`soundId`) — trùng chữ trừ vài trường hợp: `c, k, ck` cùng âm `k`; `th` (/θ/ thin) và `th-v` (/ð/ this); `oo` (/ʊ/ book) và `oo-l` (/uː/ moon); `x` là /ks/, `qu` là /kw/ (một ô, một file).
- **Âm rời luôn phát từ file ghi âm thật** `app/sounds/phonics/<soundId>.mp3` (như kid-english: giọng máy không đọc được âm rời — đọc "s" thành *ess*). Giọng máy chỉ đọc **từ trọn vẹn** và câu. Nguồn file: Wikimedia Commons (bản ghi IPA / cắt từ bản ghi từ), ghi giấy phép trong `app/sounds/CREDITS.md`, bố mẹ nghe duyệt từng âm trước khi đưa vào. Chép 6 âm nhóm 1 từ kid-english.
- Nhận dạng giọng nói **không** dùng cho âm rời (máy chỉ nhận ra từ) — bé nói âm rời thì chỉ khen theo âm lượng.

#### 3.1.2. Lộ trình và mở bài
- Thứ tự theo **7 nhóm âm kiểu Jolly** (5.2) — đã chốt. Mỗi từ có thêm nhãn dạng từ để lọc và báo cáo (không quyết định thứ tự):

  | Nhãn | Ví dụ | Có từ nhóm |
  |---|---|---|
  | `cvc` (âm đơn) | sat, pin, dog | 1 |
  | `blend` (cụm phụ âm) | stop, hand | 1–3 |
  | `digraph` (2 chữ 1 âm phụ âm: sh ch th ng ck qu) | ship, chat, thin | 5–7 (ck từ nhóm 2) |
  | `vowel-team` (ai oa ie ee or oo ou oi ue er ar) | rain, boat, feet | 4–7 |
  | `split` (a_e i_e o_e u_e) | cake, bike, home | sau nhóm 7 |
  | `multi` (2 âm tiết) | rabbit, sunset | sau nhóm 7 |

- Sau nhóm 7: các cách viết khác của cùng âm (ay, ea, igh, ow…), rồi từ 2 âm tiết.
- **Mở bài (đã chốt)**: **không khóa bài nào** — mọi bài đều mở sẵn, bé chọn bài nào cũng được. Danh sách bài xếp theo lộ trình; bài nên học tiếp theo có dấu ⭐ "Tiếp theo" (bài đầu tiên chưa hoàn thành). Nếu bài vừa xong có < 60% mục làm được độc lập (4.3), Olly gợi ý "Ôn lại nhé?" nhưng không bắt buộc. Bài cũ luôn chơi lại được.

#### 3.1.3. Ghép âm (blending)
1. Từ hiện thành các **ô grapheme** (*sh | i | p*), dưới mỗi ô có dấu: chấm cho ô một chữ, gạch cho ô nhiều chữ.
2. Bé chạm từng ô → phát **âm** của ô (file).
3. Nút **Ghép** → phát lần lượt các âm, khoảng cách ngắn dần, rồi giọng máy đọc cả từ (tốc độ chậm, 6.1); các ô trượt lại sát nhau.
4. Bé đọc to cả từ (có mic thì nghe — 4.2; không thì bấm **✅ Con đọc xong**).
5. **Kiểm tra bằng hình**: chọn hình đúng trong 3 hình → đây là kết quả chấm. Từ không có hình rõ (*at, in, it*) thì không chọn hình; mục đó chỉ tính "đã luyện".

#### 3.1.4. Tricky words (từ cần nhận diện)
- Chia ba loại, không gom chung:
  - **Đọc được bằng âm đã học** → không phải tricky với bé lúc đó; học như từ thường.
  - **Tricky** (cách viết / đọc bất quy tắc: *the, said, was, you, are*): danh sách theo nhóm kiểu Jolly (nhóm 1: *I, the, he, she, me, we, be, was, to, do, are, all*), xen giữa các nhóm âm.
  - **Từ thường gặp chưa đọc được bằng âm** (*like, my*): tạm học nhận diện, đánh dấu "sẽ đọc được khi học âm …".
- Một lượt thẻ (không có hiệu ứng chớp): hiện từ → Olly đọc → bé đọc lại → **Olly đọc một từ, bé chọn đúng thẻ trong 3 thẻ** (đây là kết quả chấm) → từ hộp 2 trở lên: chọn từ điền vào câu ngắn đã đọc được.
- Ôn theo hộp (Leitner, khóa tiến độ chung `tricky/…` cho mọi bài — 4.3):

  | Kết quả | Hộp | Gặp lại |
  |---|---|---|
  | Sai | về hộp 0 | trong buổi, sau 2–3 thẻ khác (không bao giờ hai lần liền) |
  | Đúng sau khi nghe gợi ý | giữ hộp | buổi sau |
  | Đúng độc lập | +1 | hộp 1: 1 ngày · 2: 3 ngày · 3: 7 ngày · 4: 14 ngày |
  | Quá hạn | — | vào đầu bài ôn kế tiếp, tối đa 5 thẻ ôn / lượt |

#### 3.1.5. Đọc câu
1. Câu + hình. Olly đọc mẫu, từ sáng theo nhịp (karaoke — cách tính ở SPEC-ta-tranh mục 5.4, dùng chung).
2. Bé chạm từng từ để nghe riêng; từ có grapheme đã học thì có thể mở ô ghép âm.
3. Bé bấm 🎤 và đọc cả câu. App hiện từ nào máy nghe được (xanh), từ chưa nghe được để **xám** (không tô đỏ).
4. Olly đọc riêng các từ xám rồi đọc lại cả câu mẫu.
5. Câu hỏi hiểu (chọn hình) — đây là kết quả chấm của câu.
- So khớp câu: bỏ dấu câu, so theo **tập từ** (không xét thứ tự — máy nhận dạng hay đảo / gộp từ). Đọc thiếu từ → từ đó xám, không tính sai.
- Mức đọc ghi lại (để bố mẹ xem, không chặn bé): nhận từ → đọc cụm → đọc cả câu (≥ 80% từ nghe được) → trôi chảy (cả câu trong một lần, không ngắt quá 2 giây). Câu > 6 từ cho đọc theo cụm (cụm do dữ liệu bài chia sẵn).
- Không có mic / nhận dạng: bỏ bước 3–4, bé bấm **✅ Con đọc xong**.

#### 3.1.6. Truyện ngắn
- 4–6 trang, mỗi trang 1–2 câu + hình. Mỗi trang: nghe cả trang, nghe từng câu, chạm từ khó để nghe, bật / tắt dòng tiếng Việt (`showVi`, 6.1).
- Cuối truyện **2–3 câu hỏi**: chọn hình, chọn đáp án (chữ ngắn), hoặc xếp 3 hình theo thứ tự. Câu hỏi chỉ dùng từ có trong truyện hoặc đã học; bé **không** phải trả lời bằng lời.

#### 3.1.7. 🖼️ Tả tranh
Một bức tranh, Olly đọc lần lượt các câu tả tranh; mũi tên chỉ vào chỗ câu đang tả; câu chạy ở thanh chữ dưới tranh; dòng tiếng Việt bật / tắt được. Chi tiết: [SPEC-ta-tranh.md](SPEC-ta-tranh.md).

### 3.2. ✏️ Spell / Đánh vần và viết
- **Nghe – xếp ô**: Olly đọc từ → bé **chạm** ô trong khay để đặt vào chỗ trống kế tiếp (chạm ô đã đặt → về khay; chạm dễ hơn kéo với bé 6 tuổi trên iPad — đã chốt 2026-11-06) — **ô grapheme** (ô *sh* là một miếng, khi đã học âm đó) vào chỗ trống, có ô nhiễu. Ô sai rung, Olly phát **âm** đúng của chỗ đó (file). Chạm ô bất kỳ → nghe âm của ô.
- **Điền ô thiếu**: *c _ t* + hình.
- **Tập viết chữ** (chữ thường a–z), làm ở 0.7 — chi tiết ở [SPEC-write.md](SPEC-write.md). Mỗi chữ có dữ liệu nét: danh sách nét theo thứ tự, mỗi nét là đường điểm theo chiều viết.
  - Chấm từng nét theo: **điểm bắt đầu** (trong 15% khung chữ), **hướng** (đi cùng chiều đường mẫu), **phủ đường** (≥ 75% điểm mẫu nằm gần nét bé vẽ), **thứ tự nét**, **đủ nét**.
  - Nhấc tay = hết một nét. Nút xóa nét vừa vẽ. Viết ngược chiều hoặc bắt đầu sai chỗ → nét mờ đi, Olly vẽ mẫu nét đó có mũi tên, bé viết lại nét đó (không chê, không trừ sao lần đầu).
  - Bản đầu **dễ dãi**: ưu tiên đúng điểm bắt đầu và hướng; độ khớp hình chỉ cần đạt ngưỡng thấp. Siết dần khi có dữ liệu thử thật.
- **Viết từ**: mở khi bé xếp ô đúng **2 lần liên tiếp** cho từ đó (sai một lần thì đếm lại). Mỗi chữ một ô, có chữ mẫu mờ, xóa từng ô viết lại được; xong thì hiện từ in đúng cạnh chữ bé viết để bé tự so. Không chấm điểm hình chữ, chỉ ghi "đã viết" (khóa riêng `write`).

### 3.3. 💬 Talk / Nói chuyện (0.5)
- Hội thoại ngắn theo chủ đề / mẫu câu Unit. **Bạn hỏi** là nhân vật phụ (Mimi 🐱, Bobo 🐻…) dùng **giọng thứ hai** (`role: 'alt'`; máy chỉ có một giọng thì nói cao giọng hơn). **Olly** làm mẫu, nhắc và khen bằng giọng chính. Ghi âm câu bé nói để bố mẹ nghe lại (6.2).
- Ba mức hỗ trợ (mỗi lượt trong dữ liệu có đủ: câu hỏi, câu mẫu, phần đầu câu, từ khóa):

  | Mức | Cách làm | Màn hình |
  |---|---|---|
  | 1. 👂 Nghe – nhắc lại | Bạn hỏi → Olly nói câu mẫu (karaoke) → bé nói lại | hiện cả câu mẫu |
  | 2. 🧩 Nói tiếp | Bạn hỏi → Olly: *"I am…"* → bé nói cả câu | hiện *"I am ___"* |
  | 3. 💬 Tự trả lời | Bạn hỏi → bé tự nói cả câu | chỉ có câu hỏi |

#### 3.3.1. Dữ liệu (trong gói bài 5.4)
```json
"dialogues": [
  { "id": "d1", "title": "Hello!", "titleVi": "Xin chào", "partner": { "name": "Mimi", "emoji": "🐱" },
    "turns": [
      { "id": "t1", "ask": "Hi! I'm Mimi. What's your name?", "askVi": "Chào bạn! Mình là Mimi. Bạn tên là gì?",
        "answer": "My name is {name}.", "answerVi": "Mình tên là {name}.", "starter": "My name is",
        "keywords": ["{name}", "name"], "emoji": null, "reply": "Nice to meet you!" }
    ] }
],
"activities": [{ "type": "talk", "items": ["d1"] }]
```
- `ask`, `answer` bắt buộc. 1–10 lượt / hội thoại, mỗi câu ≤ 15 từ.
- `starter` không có thì app tự lấy: các từ đứng trước từ khóa đầu tiên của câu mẫu (không tìm được thì nửa đầu câu).
- `keywords` không có thì lấy các từ chính của câu mẫu (bỏ *I, is, a, the…*). Có nhiều cách trả lời đúng thì ghi hết, ví dụ *"Do you like pizza?"* → `["yes", "no"]`.
- `{name}` là tên bé (Cài đặt). Chưa nhập tên bé → bỏ qua lượt có `{name}`.
- `emoji`: hình hiện cạnh câu hỏi (*"What color is it?"* + 🍎). `reply`: bạn đáp lại sau khi bé nói (không bắt buộc).
- Bài có sẵn: 6 bài chủ đề hằng ngày (chào hỏi, màu sắc, đồ chơi, con vật, gia đình, đồ ăn), tab **💬 Hằng ngày** của khu Talk. Bài theo sách: prompt AI (5.7) viết thêm 1 hội thoại theo mẫu câu của Unit.

#### 3.3.2. Một lượt
1. Bạn hỏi (bong bóng chữ, dòng tiếng Việt dưới nếu bật `showVi`). Mức 1: Olly nói câu mẫu có karaoke; mức 2: Olly nói phần đầu câu.
2. Olly: *"Your turn!"* → nghe tối đa 8 giây (vòng mic sáng), có ghi âm.
3. Kết quả (máy không nghe ra ≠ bé sai, 4.2):

   | Nghe được | Olly làm | Ghi tiến độ |
   |---|---|---|
   | có từ khóa | khen, bạn đáp `reply` | `independent` |
   | nghe ra chữ nhưng không có từ khóa | *"Good try! Listen: …"* nói câu mẫu, đi tiếp (không chê) | `practiced` |
   | có tiếng nhưng máy không ra chữ (`unheard`) | *"I didn't catch that. Say it again!"* — 1 lần, lần 2 vẫn vậy thì khen và đi tiếp | `practiced` |
   | có tiếng, máy không có nhận dạng | khen, đi tiếp | `practiced` |
   | im lặng | các bước im lặng dưới đây | |
   | không có mic | nút **✅ Con nói xong** | `practiced` |

4. **Bé im lặng** (OL-17): bạn hỏi lại → nghe → im lặng → hiện **từ khóa** (thẻ chữ) + Olly đọc từ khóa → nghe → im lặng → Olly nói câu mẫu, *"Say it with me!"* → nghe một lần → sang lượt sau. Bé nói được ở bước nào thì xử lý như bảng trên; đã phải xem từ khóa / câu mẫu thì ghi `helped`.
- Nút trên màn: 🔊 nghe lại câu hỏi (+ phụ đề tiếng Việt, 4.5), **🎤 Nói lại** (nghe lại lượt này), **⏭ Bỏ qua** (sang lượt sau, không ghi tiến độ).

#### 3.3.3. Chọn mức và sao
- Vào bài: 3 nút mức. Nút sáng = mức kế tiếp chưa làm (đã làm mức 3 thì sáng mức 3). Mọi mức đều mở, bé chọn mức nào cũng được.
- Xong cả bài ở mức N → **N sao** (`lesson:<id>/talk`, giữ sao cao nhất). Sao Talk theo mức hỗ trợ, không theo máy nghe (4.2).
- Tiến độ lượt: `<lessonId>/talk/<dialogueId>-<turnId>`.

### 3.4. 🧩 Quest / Thử thách (0.7, chia nhỏ)
| Bước | Trò | Ghi chú |
|---|---|---|
| Quest 1 | **Read and Do** — đọc chỉ dẫn (*"Put the red ball in the box."*), kéo đồ vật trong tranh | làm trước: dùng lại từ + hình của Read / Spell |
| Quest 2 | **Build a Sentence** — kéo từ thành câu | |
| Quest 3 | **Guess the Word** — đoán từ theo gợi ý | |
| Quest 4 | **Mini Crossword** | |
| Sau | Bản đồ phiêu lưu, huy hiệu | |

## 4. Phản hồi và tiến độ
- Không có "Try again" kiểu chê: sai thì Olly chỉ chỗ sai và làm mẫu.

### 4.1. Olly giải thích bằng tiếng Việt (đã chốt)
- Bé **sai** 2 lần liên tiếp ở cùng một mục (`VI_HELP_AFTER`) → Olly nói **một lần** lời giải thích ngắn bằng tiếng Việt, rồi làm mẫu lại bằng tiếng Anh. Ví dụ: *"Hai chữ s và h đi cùng nhau thành một âm /sh/, như khi mình bảo im lặng: shhh. Ship!"*
- "Sai" chỉ gồm: chạm / kéo sai (chọn hình, xếp ô, chọn thẻ…) và kết quả nghe `miss` (4.2). **Không** tính `unheard` / `unclear` (máy không nghe rõ) — khi đó Olly chỉ mời đọc lại to hơn.
- Lần sai thứ 3 trở đi không giải thích lại (tránh lặp); Olly làm mẫu tiếng Anh và cho qua như cũ.
- Lời giải thích hiện kèm phụ đề tiếng Việt. Máy không có giọng tiếng Việt thì chỉ hiện chữ.
- Mỗi bài viết sẵn lời giải thích cho từng mục (trường `vi` / `explainVi`); bài tạo bằng prompt AI thì prompt yêu cầu AI viết luôn.
- Bố mẹ tắt được ở Cài đặt → 🇻🇳 Giải thích tiếng Việt (mặc định bật).

### 4.2. Nghe bé nói — kết quả không phải phán quyết
Nhận dạng giọng nói của trình duyệt nghe giọng trẻ em kém, phụ thuộc mạng và máy. Mỗi lần nghe trả về một trong:

| Kết quả | Điều kiện | Olly làm gì | Ghi tiến độ |
|---|---|---|---|
| `ok` | một kết quả nhận dạng khớp **chặt** với từ cần đọc (chuẩn hóa xong bằng nhau, hoặc nằm trong danh sách từ đồng âm của mục, ví dụ *sea / see*) | khen | `independent` |
| `unclear` | chỉ khớp **lỏng** (`soundKey`) — ví dụ đọc *ship* máy nghe *shop* | "Read it again, a bit louder!" — tối đa 1 lần, rồi làm mẫu và đi tiếp | không ghi đúng / sai |
| `miss` | có kết quả rõ nhưng khác hẳn | làm mẫu, mời đọc lại (tối đa 2 lần) | `missed` |
| `unheard` | không có kết quả, lỗi, hết giờ chờ, bé nói quá nhỏ | mời nói lại 1 lần, rồi đi tiếp | không ghi đúng / sai |
| không mic / không nhận dạng / bị từ chối quyền | — | hiện nút **✅ Con đọc xong** thay cho nghe | `practiced` |

- Kết quả **sao, mở bài** chỉ dựa trên phần chấm bằng chạm (chọn hình, chọn thẻ, xếp ô). Kết quả nghe là để khen, để luyện và cho bố mẹ xem.
- Bé từ chối quyền micro: màn của bé không hiện hộp thoại; Góc bố mẹ hiện hướng dẫn cấp lại quyền (Safari: Cài đặt → Safari → Micro).
- Nhận dạng lỗi giữa buổi → tắt cho hết buổi (như hiện có), các hoạt động tự chuyển sang nút ✅.

### 4.5. 🔊 Nghe lại + phụ đề tiếng Việt (giống kid-english)
- Mọi màn hoạt động có nút **🔊** ở góc trên. Chạm → Olly đọc lại câu đang hỏi / câu mẫu đang chờ bé, đồng thời hiện **phụ đề 2 dòng** khoảng 5 giây: câu tiếng Anh + câu **tiếng Việt** giải thích Olly đang hỏi gì / bé cần làm gì. Ví dụ: *"Which one is ship?"* → *"Hình nào là "ship" (con tàu)? Bé chạm vào hình đúng."*
- Tiếng Việt lấy từ: bảng dịch câu hỏi theo mẫu cố định của app (`captions.js`, như kid-english) + nghĩa của từ / câu trong bài (`vi`). Không nhận ra mẫu câu thì chỉ hiện "Nghĩa: …" nếu có.
- Luôn có, không phụ thuộc `showVi` (bé / bố mẹ chủ động bấm khi cần). Khác mục 4.1: 4.1 là Olly **tự** giải thích khi bé sai 2 lần; 🔊 là **bấm** để nghe lại và đọc chữ.
- Test: mọi câu hỏi Olly dùng trong code đều có dòng dịch trong bảng mẫu.
- Làm cùng các màn hoạt động đầu tiên (0.2).

### 4.3. Tiến độ
Kho `progress` (khóa `key`), ba loại bản ghi:

- **Mục** — khóa `<lessonId>/<activity>/<itemId>`, ví dụ `phonics-g6/blend/ship`, `book-gs1-u3/spell/ship`. Cùng từ ở hai bài là hai bản ghi riêng.
  ```json
  { "key": "phonics-g6/blend/ship", "lessonId": "phonics-g6", "activity": "blend", "itemId": "ship",
    "seen": 3, "independent": 2, "helped": 1, "missed": 0, "practiced": 0,
    "streak": 2, "lastAt": 1793950000000 }
  ```
  `independent`: đúng ngay lần đầu, không gợi ý · `helped`: đúng sau khi thử lại / nghe gợi ý · `missed`: phải xem đáp án (hoặc `miss` khi nghe) · `practiced`: làm xong phần không chấm.
- **Tricky words** dùng chung bộ thẻ cho mọi bài: `tricky/card/<từ>`, thêm `box`, `nextAt` (3.1.4).
- **Bài** — khóa `lesson:<lessonId>`: `{ completedAt, plays, bestStars, lastStars, lastAt }`.
- Tiến độ **Unit** và **tổng** không lưu, tính từ các bản ghi trên khi hiển thị.
- Thêm chỉ mục `lessonId` cho kho `progress` (bước `MIGRATIONS` mới) để lấy / xóa theo bài.

### 4.4. Sao và huy hiệu
| Sao | Điều kiện (tính trên các mục **có chấm** của lượt chơi) |
|---|---|
| 3 | ≥ 90% mục `independent` |
| 2 | ≥ 60% mục `independent` hoặc `helped`, không quá 1 mục phải xem đáp án |
| 1 | làm xong bài |

- Không tính theo thời gian hay tốc độ. Lưu `bestStars` (cao nhất) và `lastStars`; chơi lại không làm giảm sao. Thoát giữa chừng không tính sao, nhưng tiến độ từng mục đã làm vẫn ghi.
- Bài bị sửa: giữ sao.
- Huy hiệu (làm sau): theo khu, mở khi xong 5 / 10 / 20 bài của khu.

## 5. Bài học — hai mạch nội dung (đã chốt)
Mỗi bài thuộc một trong hai mạch; màn chọn bài của khu có hai tab.

### 5.1. 📘 Theo sách lớp 1 (Việt Nam)
- Bố mẹ chọn bộ sách bé đang học ở Cài đặt (ví dụ *Tiếng Anh 1 Global Success*, *i-Learn Smart Start 1*, *Family and Friends 1*…) — chỉ dùng để đặt tên và sắp xếp bài theo Unit.
- App **không** chép nội dung sách (bản quyền): bài theo Unit do bố mẹ tạo bằng **prompt AI** từ danh sách từ / mẫu câu của Unit (5.7).
- Một Unit → một "gói bài": đọc từ, đánh vần từ, hội thoại theo mẫu câu của Unit.

### 5.2. 🔤 Phonics quốc tế
- Bài **có sẵn trong app**, theo thứ tự âm kiểu Jolly Phonics (7 nhóm: s a t i p n → c/k e h r m d → g o u l f b → ai j oa ie ee or → z w ng v oo → y x ch sh th → qu ou oi ue er ar), rồi split digraph, cách viết khác, từ 2 âm tiết. kid-english đã có nhóm 1 (`jolly.js`) — chép cách làm và mở rộng.
- Mỗi nhóm: nghe âm → ghép âm thành từ (Read) → đánh vần từ (Spell) → đọc câu chỉ dùng âm đã học (decodable).

### 5.3. Mỗi mạch được dùng gì

| | Theo sách lớp 1 | Phonics quốc tế |
|---|---|---|
| Từ | danh sách bố mẹ đưa cho Unit | chỉ từ **giải mã được** bằng grapheme đã học |
| Câu | theo mẫu câu của Unit | câu decodable (dưới đây) |
| Truyện | từ của Unit + từ đã học + từ bố mẹ cho thêm | ưu tiên từ giải mã được |
| Tricky words | từ của Unit, đánh dấu tricky | theo lộ trình riêng (3.1.4) |
| Spell | từ của Unit (ô theo từng chữ cái nếu từ có grapheme chưa học) | từ theo âm, ô theo grapheme |
| Talk | mẫu hội thoại Unit | mẫu câu đơn giản theo cấp độ |

- **Decodable**: một từ đọc được khi mọi grapheme của nó nằm trong tập grapheme đã học (tính tới nhóm của bài), **hoặc** từ đó là tricky word đã học. Câu decodable: mọi từ đều đọc được. Từ tricky trong câu được gạch chân để bé biết là "từ nhận diện".
- Bài có sẵn: test tự động kiểm tra (8). Bài AI tạo: cảnh báo, không chặn (bố mẹ quyết).

### 5.4. Cấu trúc gói bài
Kho `lessons`. Mục (từ / câu / thẻ) khai báo một lần, hoạt động tham chiếu bằng `id` → không lặp dữ liệu, mỗi hoạt động chỉ có trường nó cần.

```json
{
  "version": 1,
  "kind": "lesson",
  "id": "phonics-g6",
  "track": "phonics",
  "book": null,
  "unit": null,
  "group": 6,
  "title": "Sounds y x ch sh th",
  "titleVi": "Âm y x ch sh th",
  "newSounds": ["y", "x", "ch", "sh", "th", "th-v"],
  "words": [
    { "id": "ship", "en": "ship", "graphemes": ["sh", "i", "p"], "sounds": ["sh", "i", "p"],
      "tags": ["digraph"], "vi": "con tàu", "emoji": "🚢", "imageId": null,
      "explainVi": "Hai chữ s và h đi cùng nhau thành một âm /sh/." }
  ],
  "sentences": [
    { "id": "s1", "en": "The ship is red.", "vi": "Con tàu màu đỏ.", "chunks": ["The ship", "is red."], "imageId": null }
  ],
  "activities": [
    { "type": "sounds", "sounds": ["ch", "sh", "th"] },
    { "type": "blend", "items": ["ship", "chop", "thin"] },
    { "type": "spell", "items": ["ship", "chop"] },
    { "type": "sentence", "items": ["s1"] }
  ],
  "builtIn": true,
  "createdAt": 0,
  "updatedAt": 0
}
```
- `graphemes` và `sounds` cùng độ dài; `sounds` là `soundId` (3.1.1) và mọi `soundId` phải có file âm.
- Loại hoạt động: `sounds, blend, tricky, sentence, story, spell, fill, write, talk, quest-*`. Truyện và tranh là bản ghi riêng (`kind: 'story'`, kho `scenes`) được bài tham chiếu.
- Gói bài thiếu khu nào (ví dụ không có `talk`) thì khu đó không hiện bài này — không lỗi.

### 5.5. Nhập, sửa, xóa — làm ngay từ 0.2
- **Nhập JSON** (dán hoặc chọn file) và **xuất JSON**. Kiểm tra trước khi lưu, lỗi thì từ chối và chỉ rõ chỗ (tiếng Việt): `version` hỗ trợ được; `id` duy nhất (trùng → hỏi "Thay bài cũ / Lưu thành bài mới"); `track` hợp lệ; `title` không rỗng; `id` mục không trùng trong bài; mọi `items` trỏ tới mục có thật; `graphemes` ghép lại đúng bằng `en` (split digraph `a_e` có quy tắc riêng); `soundId` có file; trường lạ bỏ qua.
- **Sửa bài**: mục giữ nguyên `id` → giữ tiến độ. Mục bị xóa → xóa tiến độ của mục đó (hỏi lại nếu đã có tiến độ). Đổi chữ của mục (`en`) mà giữ `id` → xóa tiến độ mục đó.
- **Xóa bài**: xóa tiến độ (`<lessonId>/…` và `lesson:<lessonId>`), ảnh và ghi âm có `lessonId` đó. Tiến độ tricky words (chung) giữ nguyên. Bài có sẵn không xóa được (chỉ ẩn).
- Bài có sẵn đi kèm app (file JSON trong `app/data/`, service worker cache); nâng phiên bản app thay bản mới, giữ tiến độ theo `id` mục.

### 5.6. Ảnh
- Ảnh lưới (kid-english) chỉ là **cách nhập**: cắt xong mỗi ô thành một ảnh riêng trong kho `images`. Từ 0.4.4 ảnh gắn theo **từ / câu** (lessonId `lib`, khóa = từ viết thường, câu = `s:<câu>`) trong **🖼️ Kho ảnh dùng chung** — cùng từ ở nhiều bài dùng chung một ảnh, bài có sẵn của app cũng dùng được. Ảnh lưới gốc không giữ.
- Màn cắt cho bố mẹ: xem từng ô, gán ô cho từ, đổi / chụp lại ảnh riêng cho một từ.
- Một mục một ảnh; ảnh thuộc một bài (`lessonId`), xóa theo bài. Bài có sẵn dùng emoji / SVG đi kèm app.
- Ảnh trong IndexedDB và ảnh đi kèm app đều xem được offline.

### 5.7. Tạo bài bằng prompt AI (0.3)
Hai bước, để bố mẹ luôn kiểm soát danh sách từ:
1. **Lấy danh sách**: bố mẹ gõ, hoặc gửi ảnh trang sách cho AI kèm prompt "chỉ chép lại danh sách từ và mẫu câu". App **không** tự đọc chữ trong ảnh. Bố mẹ dán danh sách vào app, **xem và sửa** rồi mới sang bước 2.
2. **Tạo gói bài**: app dựng prompt từ: bộ sách, Unit, danh sách từ, mẫu câu, nhóm âm bé đã học, cấp độ, (tùy chọn) từ đã có ở các bài trước. Yêu cầu AI:
   - Chỉ trả về **một JSON** đúng 5.4, không Markdown, không giải thích (app vẫn chịu được khối ```` ```json ````).
   - **Không** thêm từ ngoài danh sách vào các hoạt động chính; từ chức năng cần cho câu (*the, is, a*) được dùng nhưng đánh dấu tricky.
   - Mỗi từ: `graphemes`, `sounds`, `vi`, `explainVi`, `emoji` hoặc `imagePrompt` (câu mô tả để bố mẹ tạo ảnh).
   - Câu theo mẫu câu của Unit; hội thoại ngắn có câu hỏi + câu mẫu + phần đầu câu + từ khóa (3.3).
- Kết quả đi qua kiểm tra 5.5 như mọi JSON nhập vào.

## 6. Góc bố mẹ

### 6.1. Cài đặt
| Cài đặt | Mặc định | Ghi chú |
|---|---|---|
| Tên bé | trống | Olly gọi tên khi chào |
| Tên nhân vật | Olly | đổi ở đây thì **mọi** câu nói / chữ có tên nhân vật đổi theo (câu được ghép từ `characterName`, nội dung bài không được viết cứng "Olly" — test kiểm tra). Nhân vật **xưng bằng tên mình** ("Olly"; đổi tên thì xưng theo tên mới), gọi bé bằng tên (chưa có tên: "bạn") |
| Giọng tiếng Anh, giọng thứ hai, giọng tiếng Việt | tự chọn | có nút nghe thử; giọng đã chọn biến mất (máy cập nhật) → tự chọn lại giọng tốt nhất, báo nhẹ trong Góc bố mẹ |
| Tốc độ đọc | 0,9 | dùng cho câu, truyện, hội thoại; **từ đơn khi ghép âm / đánh vần đọc chậm hơn** (× 0,85). Âm rời là file, không đổi theo tốc độ |
| Thời gian buổi | 20 phút | 1.1 |
| Nhận dạng giọng nói, ghi âm | bật | 4.2, 6.2 |
| 🇻🇳 Giải thích tiếng Việt khi sai | bật | 4.1 |
| Hiện tiếng Việt dưới câu (`showVi`) | bật | câu, truyện, tả tranh; nút 🇻🇳 VI trên màn đổi chính giá trị này |
| Đọc tiếng Việt thành tiếng (`readVietnamese`, đã có trong settings) | tắt | độc lập với `showVi` |
| Bộ sách đang học | trống | 5.1 |

- Sẽ làm: Tiến độ (theo khu / bài / mục hay sai, mức đọc 3.1.5), Nghe lại giọng bé, Quản lý / tạo bài, Sao lưu – khôi phục.

### 6.2. Ghi âm và dữ liệu riêng tư
- Mọi dữ liệu (tên bé, tiến độ, ghi âm, bài) **chỉ lưu trên máy**. App không gửi gì lên mạng.
- Ghi âm: tối đa 10 giây / bản, 1 bản / mục / ngày (đã có). Tổng ghi âm vượt 150 MB → xóa bản cũ nhất (giữ bản đầu tiên của mỗi mục để so tiến bộ), báo trong Góc bố mẹ. Đầy bộ nhớ máy (`QuotaExceededError`) → ngừng ghi âm cho buổi đó, bé chơi tiếp bình thường. Cài đặt "ghi âm" tắt → không ghi.
- **🎙️ Ghi âm** (Góc bố mẹ, từ 0.5): nghe lại theo ngày (mới trước), mỗi bản ghi câu bé cần nói + tên bài; xóa từng bản / **xóa toàn bộ ghi âm** (hỏi lại); dòng tổng dung lượng / 150 MB. **Xóa toàn bộ dữ liệu học** (hỏi lại 2 bước) làm cùng trang Sao lưu.
- Sao lưu / khôi phục do bố mẹ bấm (file zip, chép `backup.js` từ kid-english). Khôi phục: hỏi lại trước khi ghi đè. Google Drive / GitHub (sau cùng) cũng chỉ là **sao lưu tùy chọn bố mẹ bấm**, không đồng bộ tự động.
- Nhắc sao lưu sau 7 ngày (`BACKUP_REMIND_DAYS`).

### 6.3. 🔔 Chuông thông báo và Thư viện bài (giống kid-english) — có từ 0.1.3
- Chuông 🔔 ở **màn hình chính** và đầu mọi trang **Góc bố mẹ**; chỉ hiện khi có tin, có số tin, rung nhẹ 3 lần (tắt khi máy bật giảm chuyển động).
- Hai loại tin:
  - **Có bản app mới**: so `VERSION` trong `sw.js` trên mạng với bản đang chạy → nút **Cập nhật ngay** (áp dụng service worker mới, tải lại app).
  - **Bài mới / bài cập nhật trong Thư viện bài**: nút **Nhập** / **Cập nhật** từng bài, **Nhập hết**, **Để sau** (đánh dấu đã xem, chuông ẩn).
- Kiểm tra lúc mở app (sau 2 giây), khi quay lại app, mỗi 30 phút. Cần mạng; lỗi mạng thì im lặng, giữ kết quả cũ.
- **Thư viện bài**: bố mẹ tải file `.json` của bài vào `app/shared/` trên GitHub (kể cả qua trang web GitHub). Lúc deploy, `scripts/make-shared-index.mjs` kiểm tra từng bài (5.5) và tạo `app/shared/index.json`; bài lỗi không vào danh sách và log deploy báo lỗi. Thư viện **không** lưu offline.
- "Bài mới" = file chưa thấy trên máy này (`librarySeen`: tên file|dung lượng); đổi dung lượng = bài cập nhật. **Lần đầu** lấy cả thư viện hiện có làm mốc (không báo cả thư viện cũ) → bài cũ nhập ở Góc bố mẹ → Bài học → **📚 Thư viện bài**.
- Nhập bài trùng id bài đã có → thay bài, giữ tiến độ các mục còn nguyên (5.5). Trùng id bài có sẵn của app → báo lỗi.

## 7. Thứ tự làm
| Phiên bản | Phạm vi |
|---|---|
| 0.1.x *(xong)* | Khung app, Cài đặt, DB, giọng đọc, service worker, deploy |
| 0.1.2 *(xong)* | Lõi dữ liệu: khóa tiến độ mới + sao (4.3–4.4, `progress.js`), kết quả khi bé đọc (4.2, `listen.js`), so khớp chặt (`match.js`), chữ và âm (`phonics.js`), gói bài + kiểm tra (`lesson.js`), Góc bố mẹ → 📚 Bài học: **nhập / xuất / thay / xóa bài JSON** (5.5), `CORE.md` + test chống lệch (2.2) |
| 0.1.3 *(xong)* | 🔔 Chuông thông báo (bản mới, bài mới) + Thư viện bài `app/shared/` (6.3) |
| 0.1.4 *(xong)* | 18 file âm rời nhóm 1–3 (`app/sounds/phonics/`, nguồn trong `app/sounds/CREDITS.md`), bố mẹ đã duyệt |
| 0.2.0 *(xong)* | Read: âm + ghép âm + tricky words, bài Phonics **nhóm 1–3** có sẵn + file âm của 3 nhóm (bố mẹ duyệt), giải thích tiếng Việt khi sai, nút 🔊 nghe lại + phụ đề tiếng Việt (4.5), sao; thẻ khu "Sắp mở" (3.0); số phiên bản ở màn hình chính. **Chưa làm, để sau:** nhắc "còn 2 phút" (1.1), đưa thẻ tricky quá hạn của bài khác vào lượt ôn (3.1.4), bài Theo sách mới chơi được các hoạt động sounds / blend / tricky |
| 0.3.0 *(xong)* | Spell: xếp ô + điền ô (bài nhóm 1–3 có sẵn, sao riêng của khu Spell) |
| 0.3.1 *(xong)* | Tạo bài theo sách bằng AI, 2 bước (5.7): Góc bố mẹ → Bài học → ✨ Tạo bài theo sách (chọn sách + Unit, prompt 1 lấy từ từ ảnh, prompt 2 tạo bài, nháp tự lưu, dán JSON vào Nhập bài); lúc học, từ có âm chưa có file ghi âm tự chuyển sang tricky (`adaptForPlay`) — thêm file âm nhóm 4–7 thì bài cũ tự ghép âm được |
| 0.3.2 *(xong)* | Đủ 42 âm rời nhóm 1–7 (bố mẹ duyệt nhóm 4–7 ngày 2026-11-10, nguồn trong `app/sounds/CREDITS.md`); bài Phonics có sẵn nhóm 4–7 (mỗi nhóm 10 từ có hình + 4 tricky words theo thứ tự kiểu Jolly); ô nhiễu khi chọn chữ không trùng chữ với đáp án (oo / oo dài, th / th this) |
| 0.3.3 *(xong)* | Ảnh thay emoji (5.6): Góc bố mẹ → Bài học → 🖼️ Ảnh (cả bài có sẵn): ảnh lưới (chép prompt AI vẽ, app đoán kiểu lưới, cắt từng ô, bố mẹ chọn từ cho từng ô) hoặc ảnh lẻ từng từ; bé thấy ảnh ở chọn hình và khu Spell |
| 0.4.0 *(xong)* | Đọc câu (3.1.5): karaoke dùng chung (`karaoke.js`, SPEC-ta-tranh 5.4), bé chạm từ nghe riêng, bé đọc cả câu (từ nghe được xanh / chưa nghe được xám, Olly đọc lại), câu hỏi hiểu chọn hình; 3 câu đọc được cho mỗi nhóm 1–7; cài đặt Hiện tiếng Việt dưới câu / Đọc tiếng Việt thành tiếng |
| 0.4.1 *(xong)* | Tả tranh — Nghe xem (SPEC-ta-tranh 3–6): tab 🖼️ Tả tranh trong khu Read, tranh có sẵn "In the park" (SVG + emoji, 7 câu cấp 2), mũi tên trượt + nhún, karaoke, 🇻🇳 VI bật / tắt, ⏸ ▶ ⏮ 🔁 ⏭, chạm từ / chạm tranh, kho `scenes` (IndexedDB bước 3) |
| 0.4.2 *(xong)* | Tả tranh: Góc bố mẹ → Bài học → 🖼️ Tả tranh → Soạn tranh (ảnh, câu, chạm đặt mũi tên, hướng, vùng chạm, xem thử, xóa) + nhờ AI viết câu (prompt kèm ảnh, dán JSON, kiểm tra bảng 7.4, phải xác nhận mũi tên) — SPEC-ta-tranh 0.4.2 + 0.4.3 |
| 0.4.3 *(xong)* | Tả tranh: 🔍 Tìm trong tranh (SPEC-ta-tranh 11): Olly đọc câu không có mũi tên, bé chạm đúng chỗ; sai → rung + đọc lại từ khóa; sai 2 lần → giải thích tiếng Việt + chỉ chỗ; sao riêng (lesson:<id>/find) |
| 0.4.4 *(xong)* | 🖼️ Kho ảnh (5.6, giống kid-english): ảnh dùng chung theo TỪ / CÂU cho mọi bài (đặt ảnh "cat" một lần, mọi bài có "cat" dùng); Góc bố mẹ → Kho ảnh: mọi từ + câu của các bài, tìm / lọc chưa có ảnh, chọn ≤ 16 mục → 1 prompt ảnh lưới → cắt → lưu, ảnh lẻ, xóa; thay tranh có sẵn của Tả tranh (bản sao giữ câu + prompt vẽ tranh theo các câu, đặt lại mũi tên, tranh gốc ẩn / hiện lại); ảnh theo bài của 0.3.3 tự chuyển vào kho |
| sau | Truyện ngắn (3.1.6) |
| 0.5.0 | Talk (3.3): khu 💬 mở, 6 bài hội thoại hằng ngày có sẵn, 3 mức hỗ trợ, bạn hỏi giọng thứ hai, các bước khi bé im lặng, ghi âm + Góc bố mẹ → 🎙️ Ghi âm (6.2), prompt AI bài theo sách có hội thoại |
| 0.6.0 *(xong)* | 🔢 Math-a ([SPEC-math.md](SPEC-math.md); bố mẹ đổi thứ tự 2026-11-11: làm trước Tập viết và Quest): khu thứ 5 (màn chính 3 + 2), T1 Số nào lớn hơn, T2 Nhóm nào nhiều hơn, T3 Cá sấu > < =, T6 Chục và đơn vị (tới 100); làm mẫu → 8 mục → bé đọc câu → sao, 3 mức (mở khi ≥ 2⭐), ra nền quay lại đúng mục; Góc bố mẹ → 🔢 Toán (tiến độ, kiểu hay sai), Cài đặt → mở mọi mức |
| 0.7.0 *(xong)* | ✍️ Tập viết prototype ([SPEC-write.md](SPEC-write.md) đợt W-a0): tab ✍️ Tập viết trong khu Spell, 8 chữ c a d g l t m z — xem mẫu → tô 2 lượt → tự viết, chấm từng nét (bắt đầu, hướng, đi hết đường, thứ tự), sai 2 lần → tiếng Việt + tô có dẫn, sao; Góc bố mẹ → ✍️ Tập viết (tiến độ, ghi nét thử, xuất JSON), Cài đặt → độ dễ chấm nét + ưu tiên bút; chữ đọc đổi sang font Andika (a, g một tầng) |
| 0.7.1 *(xong)* | ✍️ đủ 26 chữ a–z (thêm o q e s f i j u y r n h b p k v w x): nét theo bảng SPEC-write 6.4, câu hướng dẫn Anh / Việt từng chữ và từng nét, chữ i / j có nét chấm (nét cuối, chỉ cần chạm); bảng 26 chữ để bố mẹ duyệt hình (WR-20) |
| 0.7.2 *(xong)* | ✍️ Viết từ cuối bài Spell (từ đã xếp đúng 2 lần liên tiếp, tối đa 2 từ; mỗi chữ một ô có chữ mờ, 🧽 từng ô, ✅ hiện từ in đúng, ghi số lần viết; tắt được ở Cài đặt); Góc bố mẹ → ✍️ Tập viết: lưới 26 chữ + "Chữ hay sai" kèm câu nhắc bé; chữ đã 3 sao học lại ở mức sau B1 → C1 → C2 (C2 không có chấm bắt đầu) |
| 0.8 | Quest 1 → 4 |
| 0.9.0 *(xong)* | 🔢 Math-b + Math-c ([SPEC-math.md](SPEC-math.md); bố mẹ chọn làm trước Quest 2026-11-11): T4 Xếp số (first / next / next / last, mức 3 lớn → nhỏ), T5 Tia số (ếch nhảy từng bước; after / before → between → one more / one less), T7 Đọc và so sánh (câu đố 3 câu karaoke, chạm nhân vật; số tới 20 khi đã có ⭐⭐ ở T5) — danh sách Toán đủ T1 → T7 |
| xen kẽ | Góc bố mẹ: tiến độ, nghe lại ghi âm, sao lưu |

## 8. Kiểm tra
- `npm test`: unit (lõi, service worker đủ file, phiên bản trùng nhau, import đúng file, `core-sync`, kiểm tra JSON bài, khóa tiến độ, sao, ôn thẻ, decodable).
- `npx playwright test`: giao diện trên Chromium cỡ iPad, `?fast` chạy nhanh, giọng đọc giả, nhận dạng giả (trả được cả 5 kết quả ở 4.2).

### 8.1. Dữ liệu phonics (unit, chạy trên mọi bài có sẵn)
- Mỗi từ: `graphemes` ghép lại đúng chữ; `graphemes`/`sounds` cùng độ dài; mọi `soundId` có file mp3 và có dòng trong `CREDITS.md`.
- Có mẫu chuẩn cho từng dạng: CVC (*sat → s a t*), digraph (*ship → sh i p*, *thin → th*, *this → th-v*, *ring → r i ng*, *duck → d u ck*), vowel team (*rain → r ai n*), split (*cake → c a_e k*), 2 âm tiết.
- Bài nhóm N chỉ có từ / câu decodable với grapheme nhóm 1…N + tricky đã học.
- Không nội dung có sẵn nào viết cứng tên "Olly" trong câu nói.

### 8.2. Nghiệm thu
| ID | Tình huống | Kết quả mong đợi |
|---|---|---|
| OL-01 | Mở app lần đầu | Màn chính, 4 khu |
| OL-02 | Đã nhập tên bé | Olly gọi đúng tên |
| OL-03 | Chưa nhập tên | Olly chào không kèm tên |
| OL-04 | Chạm khu chưa làm | Nhãn Sắp mở, Olly nói câu tiếng Việt, không lỗi, không tính giờ |
| OL-05 | Hết giờ khi đang làm dở | Làm xong hoạt động, lưu tiến độ, rồi mới đi ngủ |
| OL-06 | Tắt mạng sau lần mở đầu | Bài có sẵn và bài đã nhập vẫn chạy |
| OL-07 | Máy không có giọng tiếng Anh | Có thông báo cho bố mẹ, bé vẫn thấy chữ |
| OL-08 | Từ chối quyền micro | Không lỗi; bé có nút ✅; Góc bố mẹ có hướng dẫn |
| OL-09 | Trình duyệt không có nhận dạng | Mọi hoạt động có nút ✅ |
| OL-10 | Nhận dạng trả rỗng / lỗi | `unheard`, không tính sai, không giải thích tiếng Việt |
| OL-11 | Ghép âm *ship* | 3 ô *sh / i / p*; chạm *sh* phát file `sh.mp3`, không đọc tên chữ |
| OL-12 | Ghép âm *sat* | Phát s, a, t rồi đọc cả từ |
| OL-13 | Xếp ô sai ở vị trí 2 | Ô đó rung, phát âm đúng của vị trí 2 |
| OL-14 | Xếp đúng 2 lần liên tiếp / đúng – sai – đúng | Mở Viết từ / chưa mở |
| OL-15 | Viết nét ngược chiều | Olly vẽ mẫu nét đó, bé viết lại nét đó |
| OL-16 | Talk, máy không nghe ra | Không kết luận sai, mời nói lại |
| OL-17 | Bé im lặng ở Talk | Hỏi lại → từ khóa → câu mẫu, đúng thứ tự |
| OL-18 | Tricky word sai | Gặp lại trong buổi, không liền ngay sau |
| OL-19 | Cùng từ *ship* ở bài phonics và bài Unit | Hai bản ghi tiến độ riêng |
| OL-20 | Nhập JSON lỗi (thiếu `title`, `items` trỏ tới mục không có) | Từ chối, chỉ rõ chỗ lỗi |
| OL-21 | Sửa bài: đổi thứ tự / thêm mục | Tiến độ mục cũ còn nguyên |
| OL-22 | Xóa bài | Xóa tiến độ, ảnh, ghi âm của bài; tricky giữ nguyên |
| OL-23 | Sao lưu rồi khôi phục trên máy khác | Đủ bài, ảnh, tiến độ, ghi âm, cài đặt |
| OL-24 | Cài cùng máy với kid-english | Hai app không thấy / không đụng dữ liệu của nhau |
| OL-25 | Đổi tên nhân vật thành "Bo" | Màn chính, câu chào, câu nói đều dùng "Bo" |

## 9. Đã chốt
**2026-11-04**
- Tên app **Olly English**, nhân vật **cú Olly**.
- Nội dung **cả hai mạch**: theo sách tiếng Anh lớp 1 ở Việt Nam (bài tạo bằng prompt theo Unit) và Phonics quốc tế (bài có sẵn) — mục 5.
- **Có** giải thích tiếng Việt khi bé sai nhiều lần — mục 4.1.
- Deploy **GitHub Pages** như kid-english: repo `HanhTran2410/kid-english-6`, workflow `.github/workflows/deploy.yml` (chạy `npm test` rồi đưa `app/` lên Pages). Link: `https://hanhtran2410.github.io/kid-english-6/`.


**2026-11-06** (sau review draft1)
- Mọi bài **mở sẵn**, không khóa; bài nên học tiếp có dấu ⭐, gợi ý ôn khi < 60% — mục 3.1.2.
- Sao: 3 sao ≥ 90% mục độc lập, 2 sao ≥ 60% — mục 4.4.
- Nhân vật **xưng "Olly"** (theo tên nhân vật trong Cài đặt) — mục 6.1.
- Ghi âm tối đa **10 giây / bản**, tổng **150 MB** — mục 6.2.
- File âm rời nhóm 2–7 lấy từ **Wikimedia Commons** như kid-english, ghi giấy phép trong `CREDITS.md`, bố mẹ nghe duyệt — mục 3.1.1.
- Tả tranh: các quyết định ở SPEC-ta-tranh mục 14.
