# SPEC — 🔢 Toán phần 2: hơn bao nhiêu, tách – gộp, cộng, trừ trong 10 — Olly English (bé 6 tuổi)

> Phiên bản spec: **draft3** · Ngày: 2026-11-13 · Dựa trên app 0.10.2 (khu Toán có T1 → T7, SPEC-math.md draft3)
> Trạng thái: **bố mẹ đã xác nhận draft3 (2026-11-13)** — làm theo đợt Math-d → Math-f — sửa theo review draft2 (mục "Thay đổi so với draft2"); 6 câu hỏi của draft1 đã chốt (mục 10). Bảng câu đố T12 [MATH-STORIES.md](MATH-STORIES.md) **bố mẹ đã duyệt 2026-11-13** (sửa s03, s07, s18, s23, s24 + câu hỏi gợi ý `storyAsk` theo review) (dữ liệu `js/math/stories.js`, test `tests/unit/stories.test.js`).
>
> Đây là "spec riêng" mà SPEC-math.md mục 1 (Ngoài phạm vi) và 11.3 hẹn: *How many more?* và cộng / trừ trong phạm vi 10. Spec này **dùng lại toàn bộ khung** của khu Toán: làm mẫu → 8 mục → bé đọc câu → sao, 3 mức, mở mức khi ≥ 2⭐, ra nền quay lại đúng mục, chỉ chạm (không kéo), sai 2 lần → tiếng Việt. Phần nào không nhắc lại ở đây thì theo SPEC-math.md.

### Thay đổi so với draft2 (theo review 2026-11-13)
- **T8** vị trí hai người: `top` chọn **ngẫu nhiên, cân bằng** trong lượt — người nhiều hơn **không** luôn ở trên (bé không học mẹo "chọn hàng trên"). Câu đọc đúng số ít: *"Tom has one more apple."* (3.1, 5).
- **T9**: `known = 0` có test riêng (khay vẫn đủ thẻ, đáp án = tổng xuất hiện đúng một lần); ô nét đứt = phần bị cánh úp che, **không** phải ô trống — câu gợi ý đổi thành *"Count the hidden spots!"*; tiếng Việt *"Có 4 chấm rồi, đếm tiếp 5, 6, 7: thêm 3 chấm."* (3.2).
- **T10**: **có câu chuyện → đếm tiếp từ số ban đầu** (số trong câu chuyện); **chỉ phép tính (mức 3) → đếm tiếp từ số lớn hơn**, dạy ở phần làm mẫu lần đầu mức 3 cùng cặp đổi chỗ. Có `+ 0` (cả `5 + 0` và `0 + 5`): *"Start at five. No more to add!"*, không chạy đếm tiếp (3.3).
- **T11** trừ hết: câu gợi ý *"Look! No birds are left."*, câu bé đọc vẫn là phép tính (*"Four take away four is zero."*), mọi đồ ở nguyên chỗ và bị gạch (3.4).
- **Khung 10 ô với số 0**: không chuẩn hóa `0 + 5` thành `5 + 0` — màu theo đúng phép tính (2.1).
- **T12**: bộ kiểm tra dữ liệu kiểm **vai trò** từng số (câu đầu nói owner có `start`, cụm `hint` chứa `change`), không chỉ thứ tự; bảng **kho câu theo mức** (mức 1: 4 + 4, mức 2: 8 + 8, mức 3: 12 + 12, mỗi lượt mức 3 có câu đánh lừa); **bẫy bước 2**; ràng buộc số (3.5).
- **`mathSentence`** có bảng đủ T8 → T12 (2.3). **Màn nhỏ**: ưu tiên xếp dọc, ô không nhỏ hơn 48 px (6). **Test phân bố** 40–60 % (11). Thêm tiêu chí xong đợt (8.1).

### Thay đổi so với draft1 (theo review 2026-11-12)
- **T8** bỏ các cặp đồ khác loại (chó – xương…), vì hình dễ ngầm hiểu "con chó nào không có xương". Giờ là **hai người, cùng một loại đồ** (*Tom has 5 apples. Anna has 3 apples.*), câu hỏi *"How many more apples does Tom have?"*. Mức 3 **giữ hai hàng** nhưng không thẳng cột; sai → đồ **tự xếp lại thành cột** rồi mới nối dây (3.1).
- **T9**: bọ rùa và khung 10 ô là **cùng một bộ chấm**, đồng bộ màu và số; `known = 0` có cách vẽ riêng, chỉ ở mức 3 (3.2).
- **T10**: chiến lược **đếm tiếp từ số lớn hơn** được **dạy trong phần làm mẫu mức 2** (cả `2 + 5` lẫn `5 + 2`), số lớn hơn sáng trên phép tính khi gợi ý; mức 1 chỉ đếm hết (3.3).
- **T11**: mọi mức dùng **đếm phần còn lại**; **bỏ đếm lùi** khỏi phần 2 (3.4).
- **T12**: bỏ cách chọn phép tính theo từ khóa. Mỗi câu đố có **dữ liệu ngữ nghĩa** (`start`, `change`, `direction`, `target`…), phép tính suy từ dữ liệu này và test kiểm tra; từ khóa chỉ dùng cho câu gợi ý khi sai. Bộ câu đố cố ý có *gives* hai chiều và *more* trong bài trừ (3.5).
- Một **helper câu đọc** dùng chung (`mathSentence`) với cách đọc chốt theo mức (2.3).
- **Thẻ nhiễu ở biên 0 / 10**, **chấm hai bước T12**, **chống lặp** trong lượt / giữa các lượt, **quy tắc khung 10 ô** (số 0, thứ tự lấp, không dồn ô) (2.1, 2.2, 2.4, 3.5).
- Phần làm mẫu đầu tiên của T8 → T11 dùng **chung bộ số 5 – 3 – 2** để bé thấy so sánh, tách – gộp, cộng, trừ là cùng một quan hệ (2.5).
- Data model đủ trường để test (5), **bảng bài mẫu cố định** cho bố mẹ xem bằng mắt mỗi đợt, **tiêu chí xong đợt** (8), test MATH-01 → MATH-18 (11; draft3 thêm MATH-19, 20).

## 1. Mục tiêu

- Đi tiếp từ **so sánh** (T1 → T7) sang **phép tính đầu tiên**, tham khảo trình tự kiến thức Toán lớp 1:
  1. *How many more?* — so sánh hai nhóm **rồi đếm phần hơn** (cầu nối từ T2 / T7 sang phép trừ);
  2. **tách – gộp số** trong 10 (*5 is 3 and 2*) — nền của cộng / trừ;
  3. **phép cộng** trong 10;
  4. **phép trừ** trong 10;
  5. **toán có lời văn** ngắn (nghe câu chuyện 2 câu → chọn phép tính → tính).
- Tiếng Anh bé học: *more than, and, plus, take away, minus, is, equals, altogether, left, how many*.
- **Mọi phép tính đều có hình để đếm kiểm chứng** (khung 10 ô, đồ vật, dây nối). Mức 3 mới bớt hình (hiện lại khi sai hoặc bấm 🔍).
- Bé **đọc** câu phép tính: *"Three plus two is five."* (mức 1) → *"… equals five."* (mức 2–3).

### Ngoài phạm vi
- Phạm vi 20, cộng có nhớ, phép tính 3 số.
- *How many fewer?*, đếm lùi, câu đố tìm phần thay đổi (*How many did she eat?*) hay câu so sánh trong T12.
- Gõ số bằng bàn phím. Bé luôn **chạm thẻ số** (2.2).
- Đặt đề bài bằng prompt AI. Bài vẫn là bài có sẵn trong code.

## 2. Những thứ dùng chung

### 2.1. Khung 10 ô (*ten frame*)
- Khung 2 hàng × 5 ô. **Lấp hàng trên trước, trái → phải**, như sách lớp 1.
- **Phép cộng:** nhóm đầu lấp trước (xanh), nhóm thêm lấp tiếp ngay sau (cam). Hai màu cố định cho mọi bài.
- **Phép trừ:** đồ bị bớt là **các ô cuối** của số ban đầu; chúng **ở nguyên chỗ**, mờ 40% + gạch chéo. **Không dồn** đồ còn lại, không xóa đồ bị bớt — bé luôn đếm được cả số ban đầu lẫn phần còn lại.
- **Số 0:** không vẽ chấm giả hay emoji thay thế; ô trống là ô trống. Nhóm có 0 đồ thì cạnh khung hiện chữ số `0` (để bé thấy dữ liệu không bị thiếu).
- **Số 0 theo đúng phép tính, không chuẩn hóa:** `5 + 0` → 5 ô xanh, không ô cam; `0 + 5` → không ô xanh (số `0` cạnh khung), 5 ô cam; `5 − 0` → 5 ô, không ô nào gạch; `5 − 5` → 5 ô, cả 5 ô gạch. Hai phép cộng cùng kết quả nhưng màu khác nhau — bé thấy được tính chất đổi chỗ.
- Tổng tối đa 10 → không bao giờ tràn khung.
- Kích thước: ô 48 px, khe 6 px, viền khung 8 px → rộng 5 × 48 + 4 × 6 + 2 × 8 = **280 px**, vừa iPhone dọc 375 px (gutter 16 px, còn 63 px). Màn rộng: ô 64 px. Test bố cục kiểm tra khung + phép tính + khay cùng vừa màn ở 375 × 667 (11).
- Bé chạm đồ trong khung để đếm (Olly đếm *"one, two…"*, như T2: chạm lại đồ đã đếm không đếm lại). Chạm để đếm **không** phải trả lời.

### 2.2. Khay đáp án
- Bé trả lời bằng **thẻ số** trong khay: mức 1 **3 thẻ**, mức 2–3 **4 thẻ**.
- Cách chọn thẻ nhiễu (hàm dùng chung `answerOptions(answer, traps, count, rand)`):
  1. ứng viên theo thứ tự ưu tiên: các **bẫy có nghĩa** của bài (mục 3, chỉ dùng ở mức 2–3) → `answer ± 1` → `answer ± 2` → số gần nhất còn lại;
  2. bỏ mọi số **ngoài 0–10**, trùng đáp án, hoặc trùng thẻ đã chọn;
  3. lấy đủ `count − 1` thẻ từ đầu danh sách. Bẫy không hợp lệ thì **bỏ qua**, không ép phải có loại bẫy nào.
- Ví dụ biên: `10 − 0 = 10` → nhiễu 9, 8 (không có 11); `4 − 4 = 0` → bẫy 8 (cộng nhầm), 4 (số bị trừ), rồi 1.
- Vị trí đáp án cân bằng trong lượt: không quá 3 / 8 mục cùng vị trí, không 2 mục liền cùng vị trí. Thẻ **không đổi chỗ** khi bé sai.
- Sai lần 1: thẻ rung, mờ tại chỗ, Olly đưa gợi ý của bài (mục 3). Sai lần 2: tiếng Việt + đáp án sáng → `missed` (như SPEC-math 6.3).

### 2.3. Câu đọc — `mathSentence(item, level)`
- Một helper duy nhất sinh câu Olly đọc mẫu và câu bé đọc cho T9 → T12 (T8 là câu so sánh, cũng đi qua helper). Không bài nào tự ghép câu.

| Mức | Cộng | Trừ | Tách – gộp (T9) |
|---|---|---|---|
| 1 | *Three plus two **is** five.* | *Five **take away** two **is** three.* | *Five is three and two.* |
| 2 | *Three plus two **equals** five.* | *Five **take away** two **equals** three.* | như mức 1 |
| 3 | *Three plus two **equals** five.* | *Five **minus** two **equals** three.* | như mức 1 |

Theo bài (câu ghép từ dữ liệu mục, không bài nào tự ghép):

| Bài | Mức | Câu đọc | Ghi chú |
|---|---|---|---|
| T8 | 1–3 | *Tom has two more apples.* | `answer = 1` → số ít: *Tom has one more apple.* |
| T9 | 1–3 | *Seven is four and three.* | luôn *N is a and b*, kể cả *Five is zero and five.* |
| T10 | 1 / 2–3 | *Three plus two is / equals five.* | |
| T11 | 1 / 2 / 3 | *Five take away two is three.* / *… take away … equals …* / *Five minus two equals three.* | trừ hết vẫn đọc phép tính: *Four take away four is zero.* |
| T12 | như T10 / T11 | đọc **phép tính suy ra** (`storyMath`), không đọc lại câu chuyện | |

- Lần đầu chơi mức 2 (cộng / trừ): phần làm mẫu có câu *"Is and equals mean the same!"*. Lần đầu mức 3 (trừ): *"Minus means take away."* Hai câu này chỉ nói ở phần làm mẫu, có phụ đề.
- **Phần đọc câu** dùng `readPlan` hiện có của khu Toán, áp dụng y nguyên cho T8 → T12: không có hai mục đọc liền nhau, và mỗi lượt có **2 hoặc 3** mục đọc trong 8 (như T1 → T7), nên bé không bao giờ làm hết lượt mà không đọc.

### 2.4. Chống lặp
- `problemKey` = **cấu trúc toán học**, không phụ thuộc hình: T8 `more:5-3`, T9 `bond:7-4`, T10 `add:3-2`, T11 `sub:5-2`, T12 = `id` câu đố. Đổi emoji / người / đồ **không** tạo bài mới.
- Trong một lượt: **không lặp `problemKey`** (riêng cặp đổi chỗ `2 + 5` / `5 + 2` là hai key khác nhau — cố ý). Không có hai mục liền nhau cùng `kind` + cùng vị trí đáp án (luật SPEC-math 7).
- Giữa các lượt: ưu tiên key **chưa gặp gần đây** (đọc `lastSeen` từ bản ghi tiến độ mục đã có, không cần kho mới). Không cấm lặp — bé cần ôn; khi lặp thì đổi người / đồ vật nếu bài có hình.

### 2.5. Bộ số chung cho phần làm mẫu
Lượt làm mẫu **đầu tiên** của mức 1 ở mỗi bài T8 → T11 dùng cùng bộ số **5 – 3 – 2**:
- T8: *Tom has 5 apples, Anna has 3* → *Tom has 2 more.*
- T9: *Five is three and two.*
- T10: *Three plus two is five.*
- T11: *Five take away two is three.*

Olly không cần nói ra mối liên hệ; dùng lại cùng số và cùng đồ (🍎) là đủ để bé nhận ra. Các lượt làm mẫu sau sinh ngẫu nhiên như bình thường.

## 3. Các bài

| # | Bài | Mục tiêu | Bé làm gì |
|---|---|---|---|
| T8 | **🍎 How many more?** / Hơn bao nhiêu | Đếm **phần hơn** giữa hai nhóm cùng loại | Hai người, mỗi người một hàng cùng loại đồ → chạm thẻ số "hơn bao nhiêu" |
| T9 | **🐞 Number bonds** / Tách – gộp số | Một số **tách thành hai phần**; tìm phần còn thiếu | Bọ rùa có N chấm, một cánh có a chấm, cánh kia úp → chạm thẻ số chấm cánh kia |
| T10 | **➕ Add it up** / Phép cộng | Cộng trong 10: gộp hai nhóm, rồi đếm tiếp | Câu chuyện hình (*3 ducks + 2 more come*) → khung 10 ô → chạm thẻ kết quả |
| T11 | **➖ Take away** / Phép trừ | Trừ trong 10: bớt đi, đếm phần còn lại | Câu chuyện hình (*5 birds, 2 fly away*) → đồ mờ + gạch → chạm thẻ kết quả |
| T12 | **📖 Story sums** / Toán có lời văn | Nghe câu chuyện, **chọn đúng phép tính** rồi tính | Olly đọc 2–3 câu (karaoke) → chọn `+` hay `−` → chạm thẻ kết quả |

### 3.1. T8 — How many more?
- **Nội dung:** hai người (Tom, Anna, Dad, Mum, Grandpa, Grandma — như T7), **cùng một loại đồ** (10 đồ của T7). Số đồ 1–10, chênh 1–5, **không bao giờ bằng nhau** (bộ sinh không tạo; MATH-01).
- **Câu Olly:** *"Tom has five apples. Anna has three apples. How many more apples does Tom have?"* — luôn hỏi theo **người có nhiều hơn**. Có dòng tiếng Việt.
- **Hình:** mỗi người một hàng, có hình người ở đầu hàng, số đếm bên cạnh hàng. Người nhiều hơn ở hàng **trên hoặc dưới ngẫu nhiên**, cân bằng trong lượt (4 / 4 ± 1) — bé phải so sánh, không đoán theo vị trí.
- **Mức:**
  | Mức | Số đồ | Hình |
  |---|---|---|
  | 1 | ≤ 6, chênh 1–3 | thẳng cột, **dây nối từng cặp có sẵn**, phần hơn có viền |
  | 2 | ≤ 10, chênh 1–5 | thẳng cột, dây nối hiện khi sai / sau khi đúng |
  | 3 | ≤ 10, chênh 1–5 | hai hàng **không thẳng cột** (khoảng cách hai hàng khác nhau), không dây |
- Ghép cặp ở đây chỉ là **cách so sánh hai số lượng** (một – một), không có nghĩa thực tế. Vì hai nhóm cùng loại đồ của hai người, hình không ngầm nói "đồ này thuộc về đồ kia".
- **Sai lần 1:** *"Let's match them!"*
  - mức 1–2: dây nối từng cặp theo cột (dùng lại dây T2, đường thẳng), phần hơn **chưa** sáng — bé tự đếm và chọn lại;
  - mức 3: đồ ở hàng dưới **trượt về thẳng cột** với hàng trên (~400 ms; giảm chuyển động: hiện thẳng ở vị trí mới), sau đó nối dây như mức 1–2. Quy tắc ghép: đồ thứ k của hàng trên với đồ thứ k của hàng dưới, tính từ trái. Sau khi xếp lại, phần hơn **vẫn chưa sáng** — bé tự đếm phần không có cặp.
- **Sau khi đúng:** dây nối (nếu chưa có) + phần hơn sáng, Olly đếm *"one, two"*.
- **Bẫy ở khay (mức 2–3):** số đồ của người nhiều hơn (đếm cả nhóm); số đồ của người ít hơn.
- **Tiếng Việt:** *"Ghép mỗi quả táo của Tom với một quả táo của Anna. Tom còn 2 quả không có cặp. Vậy Tom nhiều hơn Anna 2 quả."*
- **Câu đọc:** *"Tom has two more apples."* (chênh 1: *"Tom has one more apple."*; câu hỏi vẫn số nhiều *"How many more apples…?"*).
- **Kiểu câu:** `t8:small-gap` (chênh 1–2), `t8:big-gap` (chênh 3–5), `t8:scattered` (mức 3).

### 3.2. T9 — Number bonds
- **Hình:** bọ rùa, **tổng N hiện bằng số** trên đầu (`7`). Cánh trái mở có a chấm (xanh); cánh phải **úp**, có dấu ?. Bé chạm thẻ số b = N − a. Đúng → cánh phải mở, b chấm (cam) hiện, Olly: *"Seven is four and three."* Bên trái / phải của cánh úp cân bằng trong lượt.
- **Một bộ chấm duy nhất.** Khi có khung 10 ô, khung **chính là** các chấm của bọ rùa xếp lại: a ô xanh (giống cánh trái) + b ô **viền nét đứt** (giống cánh úp), tổng đúng N, không có ô thừa. Khi cánh phải mở, các ô nét đứt tô cam cùng lúc. Không bao giờ có hai bộ chấm khác số.
- **Mức:**
  | Mức | N | Khung 10 ô |
  |---|---|---|
  | 1 | 2–5 | luôn hiện, đồng bộ với bọ rùa |
  | 2 | 2–10 | hiện khi sai / sau khi đúng |
  | 3 | 2–10, **≥ 3 mục N = 10** ("đôi bạn của 10") | hiện khi sai / bấm 🔍 |
- **a = 0** chỉ ở mức 3, tối đa 1 mục / lượt: cánh trái mở, **không có chấm**, dưới cánh có số `0` to; câu *"Five is zero and five."* Cánh úp **không bao giờ** là 0 (bé không phải chọn 0 cho phần úp ở bản đầu). Khi `known = 0`: `answer = total`, bẫy `total` trùng đáp án nên bị bỏ — khay vẫn đủ 4 thẻ, đáp án có đúng một thẻ (MATH-04).
- **Làm mẫu:** Olly đếm N chấm trên khung 10 ô, chạm cánh trái (a chấm xanh sáng), đếm tiếp phần nét đứt → mở cánh phải → *"Seven is four and three!"*
- **Sai lần 1:** khung 10 ô hiện (nếu chưa có), a ô xanh, b ô nét đứt sáng viền → *"Count the hidden spots!"* (ô nét đứt là chấm bị cánh úp che — **không** phải ô trống; số ô nét đứt = `answer`; khi mở cánh, **chính các ô đó** tô cam, không thêm ô hay chấm nào)
- **Bẫy ở khay (mức 2–3):** N (bé chọn tổng); a (bé chọn phần đã thấy).
- **Tiếng Việt:** *"7 gồm 4 và 3. Có 4 chấm rồi, đếm tiếp 5, 6, 7: thêm 3 chấm."*
- **Câu đọc:** *"Seven is four and three."*
- **Kiểu câu:** `t9:small` (N ≤ 5), `t9:big` (N 6–9), `t9:ten` (N = 10), `t9:zero`.

### 3.3. T10 — Add it up
- **Câu chuyện hình** (đồ / con vật của T7): *"Three ducks are in the pond. Two more ducks come. How many ducks are there altogether?"* — Olly đọc karaoke, có dòng tiếng Việt.
- Hình: a đồ có sẵn (xanh) → b đồ **đi vào** (cam), lấp khung 10 ô theo 2.1. Phép tính dưới khung: `3 + 2 = ?`.
- **Mức:**
  | Mức | Phạm vi | Hình | Chiến lược |
  |---|---|---|---|
  | 1 | tổng ≤ 5, hai số ≥ 1 | khung + đồ vật, chuyện | **đếm hết** |
  | 2 | tổng ≤ 10, hai số ≥ 1 | khung + đồ vật, chuyện | **đếm tiếp từ số ban đầu** (số có sẵn trong câu chuyện) |
  | 3 | tổng ≤ 10 | **chỉ phép tính**, không chuyện; khung khi sai / 🔍; ≥ 2 mục là **cặp đổi chỗ** (`2 + 5` và `5 + 2`, không liền nhau), ≥ 1 mục `+ 0` (`5 + 0` hoặc `0 + 5`, không bắt buộc cả hai) | **đếm tiếp từ số lớn hơn** |
- **Vì sao hai cách bắt đầu:** có câu chuyện thì nhóm ban đầu là thứ bé thấy trước (*3 ducks, 2 more come* → bắt đầu từ 3) — bắt đầu từ số khác dễ làm bé không hiểu. Chỉ có phép tính thì không có "nhóm ban đầu", nên dạy cách nhanh hơn: bắt đầu từ số lớn hơn, nhờ tính chất đổi chỗ.
- **Dạy đếm tiếp từ số ban đầu (lần đầu chơi mức 2, làm mẫu):** `5 + 2` chuyện vịt: 5 ô xanh gộp thành một khối có nhãn `5` → *"Start at five. Count on: six, seven!"* (2 ô cam sáng lần lượt).
- **Dạy bắt đầu từ số lớn hơn (lần đầu chơi mức 3, làm mẫu):** `2 + 5`: *"Which number is bigger? Five! Start at five. Count on: six, seven!"* → hai nhóm đổi chỗ trên khung, hiện `2 + 5 = 5 + 2` → *"Same answer!"*.
- **`+ 0`:** *"Start at five. No more to add!"* — không chạy đếm tiếp; khung vẫn đúng số lượng (2.1).
  Sau phần làm mẫu tương ứng mới có gợi ý đếm tiếp khi sai.
- Không có `0 + 0`.
- **Sai lần 1:**
  - mức 1: *"Let's count them all!"* — đồ trong khung sáng lần lượt, Olly đếm cùng;
  - mức 2: **số ban đầu** sáng trên phép tính + khối ô tương ứng → *"Start at {a}. Count on!"*; mức 3: **số lớn hơn** sáng → *"Start at {bigger}. Count on!"* — ô của số còn lại sáng lần lượt nhưng Olly **không** đọc kết quả. Có số 0 → *"Start at {n}. No more to add!"*.
- **Bẫy ở khay (mức 2–3):** a − b (nếu ≥ 0); số hạng lớn hơn.
- **Tiếng Việt:** *"Có 3 con vịt, thêm 2 con nữa. Gộp lại: 3 cộng 2 bằng 5."*
- **Câu đọc:** theo 2.3.
- **Kiểu câu:** `t10:to5`, `t10:to10`, `t10:turnaround` (mục đổi chỗ), `t10:zero`.

### 3.4. T11 — Take away
- **Câu chuyện hình:** *"Five birds are on the tree. Two birds fly away. How many birds are left?"* Đồ bị bớt **nhích đi một đoạn ngắn rồi trở về ô cũ**, mờ + gạch chéo (giảm chuyển động: chỉ mờ + gạch). Theo 2.1: không dồn ô, không xóa.
- **Mức:**
  | Mức | Phạm vi | Hình |
  |---|---|---|
  | 1 | số bị trừ ≤ 5, số trừ ≥ 1 | đồ vật + gạch, chuyện |
  | 2 | ≤ 10, số trừ ≥ 1 | khung 10 ô + gạch, chuyện |
  | 3 | ≤ 10, **chỉ phép tính** `7 − 3 = ?`; ≥ 1 mục `− 0`, ≥ 1 mục trừ hết (`4 − 4`) | khung khi sai / 🔍 |
- Kết quả không âm.
- **Chiến lược mọi mức: đếm phần còn lại.** Sai lần 1: *"Count the ones that are left!"* — đồ **chưa gạch** sáng viền lần lượt, đồ bị gạch giữ nguyên. Trừ hết: gợi ý *"Look! No birds are left."* — mọi đồ **ở nguyên chỗ, đều bị gạch** (không thay bằng khung trống: bé thấy 0 là "không còn đồ nào", không phải dữ liệu mất); câu bé đọc vẫn là phép tính *"Four take away four is zero."* `− 0`: *"Nothing flies away!"*
- **Bẫy ở khay (mức 2–3):** a + b (cộng nhầm); b (số trừ).
- **Tiếng Việt:** *"Có 5 con chim, bay đi 2 con. Còn lại: 5 trừ 2 bằng 3."*
- **Câu đọc:** theo 2.3.
- **Kiểu câu:** `t11:to5`, `t11:to10`, `t11:zero` (`− 0`), `t11:all` (trừ hết).

### 3.5. T12 — Story sums
- **Câu đố viết sẵn** (≥ 24 câu, 12 cộng – 12 trừ), **bố mẹ duyệt từng câu trước khi code Math-f** — giống bảng câu đố Quest 3: script sinh bảng duyệt `MATH-STORIES.md`.
- Bản đầu chỉ có một loại câu đố: **có số ban đầu, có thay đổi, hỏi kết quả** (*join / separate, result unknown*). Không có câu đố hỏi phần thay đổi hay câu so sánh.
- **Dữ liệu ngữ nghĩa** — phép tính **suy ra** từ dữ liệu, không từ chữ:
  ```js
  {
    id: 's01',
    text: 'Tom has 4 apples. Anna gives him 3 more. How many apples does Tom have now?',
    vi: 'Tom có 4 quả táo. Anna cho Tom thêm 3 quả. Bây giờ Tom có bao nhiêu quả táo?',
    owner: 'Tom',          // người / chỗ có số lượng được hỏi
    thing: 'apples',
    start: 4,              // số ban đầu của owner
    change: 3,
    direction: 'increase', // owner được thêm ('increase') hay mất ('decrease')
    target: 'result',      // bản đầu chỉ có 'result'
    hint: 'gives him 3 more', // cụm chữ Olly chỉ ra khi bé chọn sai dấu
    hintVi: 'Anna cho Tom thêm 3 quả',
  }
  ```
  - `op` = `direction === 'increase' ? '+' : '−'`; `a = start`, `b = change`, `answer = a op b`. Không lưu `op` / `answer` tay — tránh lệch.
  - Bộ kiểm tra (`storyProblems`, chạy trong test và khi sinh bảng): số trong `text` và `vi` đúng thứ tự `start`, `change`; **đúng vai trò** — câu đầu nhắc `owner` và chỉ chứa số `start`, cụm `hint` / `hintVi` chỉ chứa số `change` (câu *"Tom has 3 apples. Anna gives him 4 more."* với `start: 4` bị bắt); câu hỏi nhắc `owner` và `thing`; `hint` nằm trong `text`.
  - **Ràng buộc số:** `start`, `change` ≥ 2 (danh từ số nhiều; không câu chuyện bắt đầu bằng 0, không thay đổi bằng 0); cộng: `start + change ≤ 10`; trừ: `change ≤ start` — kết quả trừ **được phép** bằng 0 (bộ 24 câu hiện chưa có câu nào).
- **Bộ câu đố cố ý có các trường hợp "từ khóa đánh lừa"** (test đếm có đủ):
  - *gives* hai chiều: *"Anna gives Tom 3 apples"* (owner Tom → `+`) và *"Tom gives Anna 3 apples. How many apples does Tom have now?"* (owner Tom → `−`) — ≥ 2 cặp;
  - *more* trong bài trừ: *"There are 8 ducks. 3 more ducks swim away. How many ducks are still here?"* — ≥ 2 câu;
  - bài cộng không có từ *more / altogether* (*"Mum bakes 4 cookies. Then she bakes 2 cookies."*) — ≥ 2 câu.
- **Hai bước trong một mục:**
  1. chọn dấu: hai thẻ lớn **`+` *add*** / **`−` *take away***. Sai lần 1: Olly đọc lại cụm `hint` (karaoke sáng cụm đó) + dòng `hintVi` → câu hỏi theo đúng người / chỗ và đồ vật (`storyAsk`): *"Does Tom have more or fewer apples now?"*, *"Are there more or fewer ducks in the pond now?"*, riêng vài câu hỏi theo việc (*"Can we see more or fewer stars now?"*); kèm dòng tiếng Việt. Sai lần 2: tiếng Việt + Olly chọn dấu.
  2. phép tính hiện (`4 + 3 = ?`) → chạm thẻ kết quả, khay bằng `answerOptions` chung (2.2). **Bẫy theo thứ tự (mức 2–3):** kết quả của phép tính **ngược dấu** (`4 − 3 = 1`), số ban đầu (`4`), số thay đổi (`3`); bẫy trùng đáp án hoặc ngoài 0–10 thì bỏ. Gợi ý khi sai như T10 / T11 (mức 1–2 có hình).
- **Chấm một mục (một kết quả cuối):**
  - `independent`: cả hai bước đúng ngay lần đầu;
  - `helped`: có ít nhất một bước sai một lần rồi sửa được, không bước nào sai 2 lần;
  - `missed`: có ít nhất một bước sai 2 lần. Bước sau vẫn cho bé làm (nếu bước 1 `missed`, bé vẫn tự tính ở bước 2) nhưng mục vẫn là `missed`.
  - Bước 1 sai được ghi thêm `kind = t12:wrong-op` để Góc bố mẹ thấy.
- **Mức và kho câu** — mức của câu **tính từ dữ liệu** (`storyLevel`: câu đánh lừa → 3; mọi số kể cả kết quả ≤ 5 → 1; còn lại 2), mức cao dùng cả câu của mức thấp:

  | Mức | Kho (cộng + trừ) | Một lượt (4 cộng + 4 trừ) | Hình |
  |---|---|---|---|
  | 1 | 4 + 4 (s01–s04, s13–s16) | dùng cả 8 câu, xáo thứ tự | đồ vật hiện sẵn |
  | 2 | 8 + 8 (thêm s05–s08, s17–s20) | chọn 4 + 4, ưu tiên câu chưa gặp gần đây | đồ vật hiện khi sai |
  | 3 | 12 + 12 (thêm 8 câu đánh lừa) | mỗi phép **2 câu đánh lừa + 2 câu thường** | đồ vật hiện khi sai |
- **Mở mức 3 dựa vào độ thành thạo, không vào số câu đã làm:** dùng luật chung SPEC-math 6.2 — lượt ở mức 2 phải đạt ≥ 2⭐ (≥ 7/8 mục `independent`, tức chọn đúng dấu **và** đúng kết quả ngay lần đầu). Làm đủ lượt mà nhiều mục `helped` / `missed` thì không mở.
- **Mức 1 chỉ có đúng 4 câu cộng + 4 câu trừ** → mỗi lượt mức 1 dùng cả 8 câu (thứ tự xáo). Không lặp chỉ áp dụng **trong lượt**; giữa các lượt không loại câu đã làm (nếu không, mức 1 không đủ 4 + 4). Test: 500 lượt × mức luôn đủ 4 cộng + 4 trừ.
- Bé **không phải tự đọc câu chuyện** (Olly đọc karaoke, 🔊 đọc lại). Phần bé đọc là **câu phép tính** (2.3) sau khi giải.
- **Tiếng Việt (sai 2 ở bước 1):** *"Anna cho Tom thêm 3 quả, nên số táo của Tom nhiều lên: làm phép cộng. 4 cộng 3 bằng 7."*
- **Kiểu câu:** `t12:add`, `t12:sub`, `t12:wrong-op`.

## 4. Danh sách bài, mức, sao

- Danh sách khu Toán: **T1 → T12**, phần 2 nằm sau T7. 12 thẻ: màn rộng 3 cột (cuộn trong danh sách như khu Read), iPhone dọc 1 cột.
- Bài ở đợt chưa làm **không hiện** (SPEC-math 6.1).
- **Không khóa bài.** Thẻ T10 → T12, khi bé chưa có sao ở T9, có một dòng chữ nhỏ màu nhạt *"Gợi ý: học 🐞 Tách – gộp số trước"* — giọng gợi ý, không có biểu tượng khóa / cấm, chạm thẻ vẫn vào bài bình thường.
- Mức, sao, tiến độ, *Kiểu hay sai*, *Mở mọi mức* (Cài đặt): **giống hệt** SPEC-math 6. Rời bài giữa chừng rồi quay lại: theo SPEC-math 3.6 (đúng mục, lần sai trước vẫn tính; T12 giữ cả bước đang làm và số lần sai từng bước).
- Bản ghi: `math-t8/more/5-3`, `math-t9/bond/7-4`, `math-t10/add/3-2`, `math-t11/sub/5-2`, `math-t12/story/s01` (khóa = `problemKey`, 2.4).

## 5. Dữ liệu và bộ sinh câu hỏi

| Bài | Một mục gồm | Quy tắc sinh |
|---|---|---|
| T8 | `{ more: { person, n }, less: { person, n }, thing, top: 'more'\|'less', answer, options, layout: 'columns'\|'scattered', hint: 'match' }` | không bằng nhau; `top` (người nhiều hơn ở hàng trên hay dưới) **ngẫu nhiên, cân bằng 4 / 4 (± 1)** trong lượt — không cố định người nhiều hơn ở trên; `answer = more.n − less.n`; `layout` theo mức |
| T9 | `{ total, known, answer, hidden: 'left'\|'right', options, hint: 'empty-spots' }` | `known + answer = total`, `answer ≥ 1`; `hidden` cân bằng; mức 3 ≥ 3 mục `total = 10`, ≤ 1 mục `known = 0` |
| T10 | `{ a, b, answer, thing, story: bool, hint: 'count-all'\|'count-on-start'\|'count-on-bigger'\|'no-more', start, options }` | `a + b ≤` phạm vi mức; `hint`: mức 1 count-all, mức 2 count-on-start, mức 3 count-on-bigger, có số 0 → no-more; `start` = số Olly bảo bắt đầu; mức 3 ≥ 1 cặp đổi chỗ, ≥ 1 `+ 0` |
| T11 | `{ a, b, answer, thing, story: bool, crossed: b, hint: 'count-left', options }` | `b ≤ a`, `crossed = b`; mức 3 ≥ 1 `− 0`, ≥ 1 `a − a` |
| T12 | câu đố viết sẵn (3.5) + `{ op, a, b, answer, options }` suy ra khi sinh | cộng / trừ 4 / 4; số theo mức; không lặp câu đố trong lượt |

- Mọi mục có `problemKey` (2.4) và `kind`.
- **Luật chung** (thêm vào luật SPEC-math 7): khay theo 2.2; không lặp `problemKey` trong lượt; không có hai mục liền nhau cùng phép tính (`+` / `−`) **và** cùng kết quả; mọi người / đồ vật có hình.
- Hàm thuần `makeItems('t8'…'t12', level, rand, opts)` như các bài cũ; `opts.history` để ưu tiên key chưa gặp (2.4) và kiểu hay sai (SPEC-math 6.4).
- Test 500 lượt × bài × mức kiểm luật; **thêm bảng bài mẫu cố định** (8.1) để bố mẹ xem bằng mắt.

## 6. Hình vẽ

| Thứ | Cách làm |
|---|---|
| Khung 10 ô | lưới CSS, emoji / chấm trong ô, quy tắc 2.1 |
| Đồ đi vào (cộng) | trượt vào ô ~400 ms; giảm chuyển động: hiện thẳng + viền sáng một lần |
| Đồ bị bớt (trừ) | nhích đi rồi về ô cũ, mờ 40% + gạch chéo đỏ nhạt; giảm chuyển động: chỉ mờ + gạch |
| Bọ rùa (T9) | SVG: thân + 2 cánh + số tổng; cánh úp có dấu ?; mở cánh ~300 ms (giảm chuyển động: đổi ngay) |
| Hai hàng (T8) | hình người đầu hàng + số đếm; dây nối = dây T2 dạng thẳng; mức 3 sai → hàng dưới trượt về cột |

- Vùng chạm ≥ 64 px cho thẻ số, thẻ dấu; ≥ 48 px cho đồ trong khung / hàng (chỉ để đếm).
- Kiểm tra iPad ngang / dọc, iPhone dọc: câu chuyện + khung + phép tính + khay cùng vừa màn, Olly không đè hình.
- **Màn nhỏ (iPhone dọc 375 × 667):** kiểm cả **chiều cao**, nhất là T9 (bọ rùa + khung 10 ô + phép tính + khay + phụ đề). Ưu tiên **xếp dọc**; thiếu chỗ thì thu nhỏ bọ rùa / hình người trước, **không** thu ô khung dưới 48 px và không ép mọi thứ lên một hàng.

## 7. Phụ đề và tiếng Olly
- Câu hỏi mới có dòng dịch trong `captions.js`: `howManyMoreHas`, `howManyLeft`, `howManyAltogether`, `whatIsMissing` (bọ rùa), `addOrTakeAway`, `countOn`, `countLeft`, `matchThem`, `isEquals`, `minusMeans`, câu chuyện T10 / T11 (dịch theo người / đồ), câu đố T12 (dịch viết sẵn).
- Đọc số bằng chữ (`numberWord` hiện có).

## 8. Chia đợt làm

| Đợt | Bản | Phạm vi |
|---|---|---|
| **Math-d** | 0.11.0 | khung 10 ô, khay `answerOptions`, `mathSentence`, `problemKey` dùng chung · **T8 · T9** |
| **Math-e** | 0.11.1 | **T10 · T11** |
| **Math-f** | 0.11.2 | **T12** — chỉ code sau khi bố mẹ duyệt bảng `MATH-STORIES.md` |

### 8.1. Tiêu chí xong một đợt
1. Unit test bộ sinh (500 lượt × bài × mức) và test MATH-xx của đợt đều qua; toàn bộ test cũ (T1 → T7, các khu khác) vẫn qua.
2. **Bảng bài mẫu cố định** `MATH2-SAMPLES.md` (script sinh với `rand` cố định: mỗi bài × mỗi mức một lượt 8 mục, có câu Olly, câu đọc, khay, tiếng Việt) — bố mẹ xem bằng mắt, như bảng câu đố Quest 3.
3. Chụp màn hình iPad ngang, iPad dọc, iPhone dọc cho mỗi bài mới (làm mẫu, đang chơi, sai lần 1) — không tràn, không đè, ô ≥ 48 px.
4. Spec ghi chú khi làm (như SPEC-math 8.1 / 8.2).
5. Bảng bài mẫu và test kiểm: không câu tiếng Anh sai số ít / số nhiều (*1 apple*, *2 apples*); khay không trùng thẻ và đủ thẻ sau khi bỏ bẫy không hợp lệ; không câu Olly / tiếng Việt nào bị thiếu.
6. Riêng Math-f: dữ liệu câu đố khớp phép tính (MATH-13); thoát / tải lại trang giữa mục khôi phục đúng bước và số lần sai (MATH-17).
Chưa đủ 4 điều trên thì chưa sang đợt sau.

## 9. Ghi chú tương thích
- T1 → T7 không đổi hành vi; nếu dùng lại dây nối T2 / thẻ số / cột khối thì test cũ phải qua nguyên.
- Góc bố mẹ → 🔢 Toán: thêm T8 → T12 (tiến độ, kiểu hay sai) theo đúng cách T1 → T7.
- Bản ghi `math-t8…t12` không cộng vào tiến độ Read / Spell / Talk (SPEC-math 9).

## 10. Câu hỏi của draft1 — đã chốt theo review 2026-11-12
1. Thứ tự T8 → T12: **giữ**.
2. Đọc `=`: **mức 1 *is*, mức 2–3 *equals*** (2.3).
3. *How many fewer?*: **chưa** đưa vào.
4. Gợi ý "học Tách – gộp số trước": **giữ, không khóa**, giọng gợi ý (4).
5. Trừ: **mức 1–2 *take away*, mức 3 *minus*** (2.3).
6. Đồ vật: **dùng lại người + đồ của T7**; T8 đổi sang hai người cùng loại đồ (3.1), bỏ các cặp chó – xương…

## 11. Test

| Nhóm | Test case |
|---|---|
| Bộ sinh (unit, 500 lượt × bài × mức) | đúng phạm vi mỗi mức; khay đúng một đáp án, thẻ khác nhau, trong 0–10; vị trí đáp án ≤ 3 / 8 và không liền; bẫy đúng loại khi hợp lệ; không lặp `problemKey`; T9 `known + answer = total`; T10 / T11 mức 3 đủ mục đổi chỗ / `± 0` / trừ hết; T11 không âm; T12 cộng / trừ 4 / 4 |
| Khung chung | như SPEC-math 10 (sao, mức, ra nền, không chạm, đọc câu, hỗ trợ, phụ đề) chạy cho T8 → T12; `mathSentence` đúng bảng 2.3 ở mọi mức |
| Phân bố (unit, 500 lượt; ngưỡng 40–60 %, không đòi 50 / 50) | T8 người nhiều hơn ở hàng trên; T9 cánh úp bên phải; T10 mức 3 số lớn hơn ở vị trí `a`; T11 mức 3 có đủ mục kết quả 0 và `− 0` mỗi lượt; T12 mức 3 mỗi lượt đủ 2 + 2 câu đánh lừa |
| Thiết bị | iPad ngang / dọc, iPhone dọc 375 × 667 (khung 280 px + khay vừa màn, **cả chiều cao** — T9 đủ bọ rùa + khung + khay); giảm chuyển động |
| Luồng cũ | T1 → T7 không đổi; danh sách 12 bài cuộn được; Góc bố mẹ có T8 → T12 |

| ID | Test | Kết quả mong đợi |
|---|---|---|
| MATH-01 | T8 bộ sinh 500 lượt | không có mục hai nhóm bằng nhau |
| MATH-02 | T8 chênh 1 và chênh 5 | `answer` đúng, phần hơn sáng đúng số đồ; chênh 1 đọc *one more apple* (số ít) |
| MATH-03 | T8 mức 3 sai lần 1 | hàng dưới về thẳng cột, dây nối đúng `less.n` cặp; phần hơn **chưa sáng** sau khi xếp lại (chỉ sáng sau khi đúng), số đồ phần hơn = `answer` |
| MATH-04 | T9 `known = 0` | cánh trái không chấm + số `0`; chỉ ở mức 3, ≤ 1 / lượt; `answer = total`, khay đủ 4 thẻ, đáp án có đúng 1 thẻ |
| MATH-05 | T9 `total = 10` | chấm hai cánh cộng lại 10; khung 10 ô đủ 10 ô, không ô thừa |
| MATH-06 | T10 `a + b = 10` | khung đầy đúng 10 ô, không tràn |
| MATH-07 | T10 `+ 0` | chỉ ở mức 3; không có `0 + 0`; cả `5 + 0` và `0 + 5` sinh được; gợi ý *"No more to add!"*, không đếm tiếp; màu khung theo đúng thứ tự phép tính |
| MATH-08 | T10 cặp đổi chỗ | hai mục cùng kết quả, `problemKey` khác nhau, không liền nhau |
| MATH-09 | T11 `a = b` | kết quả 0; khung giữ đủ a đồ, tất cả bị gạch; gợi ý *"Look! No … are left."*; câu bé đọc là phép tính |
| MATH-10 | T11 `b = 0` | kết quả = a, không đồ nào bị gạch |
| MATH-11 | T12 *gives* hai chiều | `op` suy từ `direction` của `owner`, đúng cho cả người cho và người nhận |
| MATH-12 | T12 có *more* nhưng là bài trừ | `op = '−'`; bộ câu đố có ≥ 2 câu như vậy |
| MATH-13 | T12 câu đố lệch dữ liệu (số trong `text` khác `start` / `change`, **hai số đổi vai trò**, `hint` không có trong `text` hoặc không chứa `change`, `owner` không có trong câu đầu / câu hỏi) | bộ kiểm tra báo lỗi |
| MATH-14 | T12 sai dấu 1 lần, bước 2 đúng ngay | `helped`; sai dấu 2 lần, bước 2 đúng → `missed` |
| MATH-15 | Khay khi kết quả 0 hoặc 10 | không thẻ ngoài 0–10, đủ số thẻ, không trùng |
| MATH-16 | Vị trí đáp án 500 lượt | mỗi vị trí xuất hiện xấp xỉ đều, không vị trí nào > 3 / 8 trong một lượt |
| MATH-17 | Ra nền giữa mục rồi quay lại (T9, T12 ở bước 2) | đúng mục, đúng bước, lần sai trước vẫn tính |
| MATH-18 | Chơi lại bài đã có sao | `bestStars`, mức đã mở, bản ghi mục / kiểu hay sai không mất |
| MATH-19 | T10 mức 2 sai lần 1 (chuyện `2 + 5`) | sáng số **ban đầu** `2`, *"Start at two. Count on!"*; mức 3 (`2 + 5`) sáng `5` |
| MATH-20 | T12 bước 2 khay (mức 2–3) | có kết quả phép tính ngược dấu khi trong 0–10; không thẻ trùng đáp án |

## 12. Ghi chú khi làm Math-d — T8, T9 (0.11.0)
- **Code:** `js/math/sums.js` (hàm thuần: `answerOptions`, `answerSlots`, `placeOptions`, `mathSentence` / `opSentence` cho cả T10 → T12 sau này, `t8Item` / `makeT8`, `t9Item` / `makeT9`, `explainSums`), `js/math/views2.js` (khay `answerTray`, `tenFrame`, hai hàng `twoRows`, bọ rùa `ladybug`), `screens/math2.js` (dựng mục cho `chooseLoop` chung + làm mẫu). `math.js` export thêm `randInt`, `pick`, `shuffle`, `kindPlan`, `generate`; luật "hai mục liền cùng kiểu + cùng vị trí đáp án" dùng `at` (vị trí trong khay) khi mục có.
- `problemKey` nằm ở `item.pair` (`more:5-3`, `bond:7-4`); `itemRef` tách thành `activity` / `itemId` → `math-t8/more/5-3`. Chống lặp giữa các lượt: 16 bản ghi gần nhất của bài (`lastAt`) → bộ sinh tránh các key đó khi còn chọn được (40 lần thử đầu), không cấm.
- Thẻ chạm sai: `.tried` (mờ, không chạm lại được), lưu ở `round.tried` → ra nền rồi quay lại vẫn mờ (MATH-17).
- **T8:** câu đố viết theo hàng trên → hàng dưới, số dạng chữ số như T7 (*"Tom has 5 apples."*), số ít *1 apple*. Mức 3 hàng dưới lệch nửa ô và khe hẹp hơn; sai → hàng dưới trượt về cột (FLIP 400 ms) rồi mới nối dây. Khi giảm chuyển động, app cho mọi thuộc tính chuyển 0,01 ms → phải chờ 2 khung hình rồi mới đo vị trí để nối dây (không thì dây lệch).
- **T8 trên iPhone dọc:** 10 đồ phải nằm thẳng cột trên một hàng nên ô đồ còn **28 px** (dưới mức 48 px của mục 6). Đồ chỉ để đếm (chạm đếm vẫn được nhưng không bắt buộc; sai thì Olly ghép cặp). Tên + số của hàng dưới nằm **dưới** hàng đồ để hai hàng đồ sát nhau, dây nối không cắt qua tên. Câu đố T8 chữ nhỏ hơn câu đọc (vừa iPad ngang khi có cả câu đọc + ✅).
- **T9:** khung 10 ô lấp chấm cánh trái trước rồi cánh phải (khớp vị trí trên hình); câu đọc theo hai cánh từ trái sang phải (*"Seven is three and four."* khi cánh trái úp). `known = 0` → cánh úp luôn bên phải, câu *"Five is zero and five."*. Lớp cánh là `w-left` / `w-right` (lớp `.right` chung của app tô xanh).
- Câu hỏi T9: *"The ladybug has 7 spots. How many spots are hidden?"*; làm mẫu: đếm cả N chấm → *"Three spots we can see."* → đếm tiếp phần nét đứt → mở cánh.
- **Đã kiểm bằng ảnh chụp** iPad ngang / dọc, iPhone dọc 375 × 667 (làm mẫu, đang chơi, sai lần 1, đã giải) cả mức 1 và 3: không tràn ngang; khay trong màn; ô khung 10 ô 48 px (iPad ngang ≥ 900 px: 64 px).
- Bảng bài mẫu: [MATH2-SAMPLES.md](MATH2-SAMPLES.md) (`node scripts/math2-samples.mjs`).
- Test: unit `math2.test.js` (khay + biên 0 / 10 — MATH-15, vị trí đáp án — MATH-16, `mathSentence` T8 → T12, bộ sinh T8 — MATH-01 / 02, T9 — MATH-04 / 05, phân bố 40–60 %, `problemKey` + tránh key gần đây); UI `math2.spec.js` (T8 mức 1, MATH-03, T9 mức 1, T9 mức 3 + 🔍 + cánh 0, MATH-17, iPhone dọc). MATH-06 → 14, 19, 20 thuộc Math-e / Math-f.
