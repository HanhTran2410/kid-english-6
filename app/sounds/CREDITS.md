# Âm rời phonics — app/sounds/phonics/ (SPEC mục 3.1.1)

Mỗi file là **âm** của chữ (letter sound), không phải tên chữ. Giọng đọc của máy không đọc được âm rời, nên app luôn phát các file này.

Cách làm: cắt đoạn trong bản ghi gốc (ghép 2 đoạn nếu có ghi), lọc tiếng trầm dưới 120 Hz, nhỏ dần hai đầu, chỉnh độ to (âm kéo dài khoảng −19,5 dB, âm bật khoảng −22 dB, giới hạn đỉnh), xuất mp3 mono 64 kbps (ffmpeg). Âm bật (t, p, k, d, g, b, j, ch, qu, th của this) lặp 3 lần, cách nhau 0,25 giây. Đoạn cắt (giây) ghi trong bảng để làm lại được.

Bản đã cắt của file CC BY-SA 3.0 cũng theo giấy phép **CC BY-SA 3.0**. Bố mẹ đã nghe duyệt: nhóm 1 ngày 2026-10-26 (ở kid-english), nhóm 2–3 ngày 2026-11-06, nhóm 4–7 ngày 2026-11-10.

| File | Âm | Nguồn (đoạn cắt) | Tác giả | Giấy phép |
|---|---|---|---|---|
| s.mp3 | s | https://commons.wikimedia.org/wiki/File:Voiceless_alveolar_sibilant.ogg (0,24–0,445 + 1,70–1,965, ghép) | Peter Isotalo | CC BY-SA 3.0 |
| a.mp3 | a | https://commons.wikimedia.org/wiki/File:Near-open_front_unrounded_vowel.ogg (0,03–0,54) | Denelson83 | CC BY-SA 3.0 |
| t.mp3 | t | https://commons.wikimedia.org/wiki/File:En-us-tap.ogg (0,068–0,138, lặp 3 lần) | Dvortygirl | Public domain (theo ghi chép của kid-english) |
| i.mp3 | i | https://commons.wikimedia.org/wiki/File:Near-close_near-front_unrounded_vowel.ogg (0,02–0,52) | Denelson83 | CC BY-SA 3.0 |
| p.mp3 | p | https://commons.wikimedia.org/wiki/File:En-us-pin.ogg (0,338–0,396, lặp 3 lần) | Dvortygirl | Public domain (theo ghi chép của kid-english) |
| n.mp3 | n | https://commons.wikimedia.org/wiki/File:Alveolar_nasal.ogg (0,25–0,495 + 1,47–1,715, ghép) | Wikimedia Commons (IPA) | CC BY-SA 3.0 |
| k.mp3 | c, k, ck | https://commons.wikimedia.org/wiki/File:En-us-kit.ogg (0,035–0,125: bật hơi đầu từ, lặp 3 lần) | Dvortygirl | CC BY-SA 3.0 |
| e.mp3 | e | https://commons.wikimedia.org/wiki/File:Open-mid_front_unrounded_vowel.ogg (0,03–0,50) | Denelson83 | CC BY-SA 3.0 |
| h.mp3 | h | https://commons.wikimedia.org/wiki/File:Voiceless_glottal_fricative.ogg (0,22–0,44 + 1,38–1,60, ghép) | Peter Isotalo | CC BY-SA 3.0 |
| r.mp3 | r | https://commons.wikimedia.org/wiki/File:Alveolar_approximant.ogg (0,29–0,46) | Erutuon | CC BY-SA 3.0 |
| m.mp3 | m | https://commons.wikimedia.org/wiki/File:Bilabial_nasal.ogg (0,20–0,37 + 1,26–1,47, ghép) | Peter Isotalo | CC BY-SA 3.0 |
| d.mp3 | d | https://commons.wikimedia.org/wiki/File:En-us-dot.ogg (0,025–0,085: bật đầu từ, lặp 3 lần) | Dvortygirl | CC BY-SA 3.0 |
| g.mp3 | g | https://commons.wikimedia.org/wiki/File:En-us-gap.ogg (0,325–0,385: bật đầu từ, lặp 3 lần) | Dvortygirl | CC BY-SA 3.0 |
| o.mp3 | o | https://commons.wikimedia.org/wiki/File:Open_back_rounded_vowel.ogg (0,02–0,50; [ɒ] kiểu Anh như Jolly) | Denelson83 | CC BY-SA 3.0 |
| u.mp3 | u | https://commons.wikimedia.org/wiki/File:Open-mid_back_unrounded_vowel.ogg (0,02–0,46) | Denelson83 | CC BY-SA 3.0 |
| l.mp3 | l | https://commons.wikimedia.org/wiki/File:En-us-bell.ogg (0,245–0,40: đuôi "l" của từ bell) | Dvortygirl | CC BY-SA 3.0 |
| f.mp3 | f | https://commons.wikimedia.org/wiki/File:En-us-cliff.ogg (0,545–0,70: đuôi "f" của từ cliff) | Dvortygirl | CC BY-SA 3.0 |
| b.mp3 | b | https://commons.wikimedia.org/wiki/File:En-us-bat.ogg (0,012–0,07: bật đầu từ, lặp 3 lần) | Dvortygirl | CC BY-SA 3.0 |
| ai.mp3 | ai | https://commons.wikimedia.org/wiki/File:En-us-a.ogg (0,11–0,53; tên chữ "a" = âm /eɪ/) | Xnux | Public domain |
| j.mp3 | j | https://commons.wikimedia.org/wiki/File:Voiced_palato-alveolar_affricate.ogg (0,055–0,16, lặp 3 lần; [dʒ] đầu bản ghi IPA) | Peter Isotalo | CC BY-SA 3.0 |
| oa.mp3 | oa | https://commons.wikimedia.org/wiki/File:En-us-o.ogg (0,61–1,09; tên chữ "o" = âm /oʊ/) | Twocs | CC BY-SA 3.0 |
| ie.mp3 | ie | https://commons.wikimedia.org/wiki/File:En-us-i.ogg (0,02–0,66; tên chữ "i" = âm /aɪ/) | Geoff Sebastian | Public domain |
| ee.mp3 | ee | https://commons.wikimedia.org/wiki/File:Close_front_unrounded_vowel.ogg (0,02–0,46; nguyên âm [iː]) | Denelson83 | CC BY-SA 3.0 |
| or.mp3 | or | https://commons.wikimedia.org/wiki/File:Open-mid_back_rounded_vowel.ogg (0,02–0,48; nguyên âm [ɔː]) | Denelson83 | CC BY-SA 3.0 |
| z.mp3 | z | https://commons.wikimedia.org/wiki/File:Voiced_alveolar_sibilant.ogg (0,22–0,41 + 1,37–1,56, ghép; [z] đứng riêng (cùng bộ với s), ghép 2 đoạn) | Peter Isotalo | CC BY-SA 3.0 |
| w.mp3 | w | https://commons.wikimedia.org/wiki/File:En-us-wow.ogg (0,095–0,215; đầu từ "wow", âm w kéo dài tự nhiên) | Dvortygirl | CC BY-SA 3.0 |
| ng.mp3 | ng | https://commons.wikimedia.org/wiki/File:En-us-sing.ogg (0,355–0,515; đuôi "ng" của từ "sing") | Dvortygirl | CC BY-SA 3.0 |
| v.mp3 | v | https://commons.wikimedia.org/wiki/File:En-us-love.ogg (0,305–0,46; đuôi "v" của từ "love") | Dvortygirl | CC BY-SA 3.0 |
| oo.mp3 | oo (ngắn) | https://commons.wikimedia.org/wiki/File:Near-close_near-back_rounded_vowel.ogg (0,02–0,48; nguyên âm [ʊ] ngắn) | Denelson83 | CC BY-SA 3.0 |
| oo-l.mp3 | oo (dài) | https://commons.wikimedia.org/wiki/File:Close_back_rounded_vowel.ogg (0,02–0,5; nguyên âm [uː] dài) | Denelson83 | CC BY-SA 3.0 |
| y.mp3 | y | https://commons.wikimedia.org/wiki/File:Palatal_approximant.ogg (0,255–0,375; [j] bản ghi IPA, phát một lần) | Peter Isotalo | CC BY-SA 3.0 |
| x.mp3 | x | https://commons.wikimedia.org/wiki/File:En-us-x.ogg (0,685–0,99; đuôi "ks" của tên chữ "ex") | Twocs | CC BY-SA 3.0 |
| ch.mp3 | ch | https://commons.wikimedia.org/wiki/File:Voiceless_palato-alveolar_affricate.ogg (0,2–0,335, lặp 3 lần; [tʃ] đầu bản ghi IPA, lặp 3 lần) | Peter Isotalo | CC BY-SA 3.0 |
| sh.mp3 | sh | https://commons.wikimedia.org/wiki/File:Voiceless_palato-alveolar_sibilant.ogg (0,19–0,44 + 1,6–1,86, ghép; [ʃ] đứng riêng (cùng bộ với s), ghép 2 đoạn) | Peter Isotalo | CC BY-SA 3.0 |
| th.mp3 | th (thin) | https://commons.wikimedia.org/wiki/File:En-us-thin.ogg (0,355–0,515; đầu từ "thin" [θ]) | xem trang file | Public domain |
| th-v.mp3 | th (this) | https://commons.wikimedia.org/wiki/File:En-us-that.ogg (0,165–0,245, lặp 3 lần; đầu từ "that" [ð], lặp 3 lần) | Dvortygirl | CC BY-SA 3.0 |
| qu.mp3 | qu | https://commons.wikimedia.org/wiki/File:En-us-quack.ogg (0,105–0,215, lặp 3 lần; đầu từ "quack" (kw), lặp 3 lần) | Dvortygirl | CC BY-SA 3.0 |
| ou.mp3 | ou | https://commons.wikimedia.org/wiki/File:En-us-how.ogg (0,185–0,45; âm /aʊ/ của từ "how") | Dvortygirl | CC BY-SA 3.0 |
| oi.mp3 | oi | https://commons.wikimedia.org/wiki/File:En-us-boy.ogg (0,105–0,345; âm /ɔɪ/ của từ "boy") | Dvortygirl | CC BY-SA 3.0 |
| ue.mp3 | ue | https://commons.wikimedia.org/wiki/File:En-us-u.ogg (0,47–1; tên chữ "u" = âm /juː/) | Twocs | CC BY-SA 3.0 |
| er.mp3 | er | https://commons.wikimedia.org/wiki/File:Open-mid_central_unrounded_vowel.ogg (0,02–0,5; nguyên âm [ɜː]) | Denelson83 | CC BY-SA 3.0 |
| ar.mp3 | ar | https://commons.wikimedia.org/wiki/File:Open_back_unrounded_vowel.ogg (0,02–0,5; nguyên âm [ɑː]) | Denelson83 | CC BY-SA 3.0 |

Đã thử và bỏ (bố mẹ nghe thấy lạ / rè): l và f từ bản ghi IPA của Peter Isotalo; l, f kéo giãn từ đầu từ *leg, lip, fish*, cuối từ *leaf*, từ *failure*. Nhóm 4–7: w từ "wet" (lặp) và IPA; ng IPA; v IPA và đuôi "move"; y từ "yes"/"yellow" (lặp); th của this từ IPA và "this"; qu từ "quick" và "queen".
