import type { Dict } from "./types";

// Content strings — broadcasts, tailored suggestions, risk tiers, the "why"
// reasoning, profile notes, and the care recipient's conditions/medicines.
// Authored by hand. {tokens} are runtime placeholders — keep them verbatim.
export const content: Dict = {
  // --- connector word (for joining conditions etc.) ---
  and: { id: "dan", ms: "dan", tl: "at", zh: "和", my: "နှင့်" },

  // --- risk tiers ---
  Low: { id: "Rendah", ms: "Rendah", tl: "Mababa", zh: "低", my: "နိမ့်" },
  Moderate: { id: "Sedang", ms: "Sederhana", tl: "Katamtaman", zh: "中等", my: "အလယ်အလတ်" },
  High: { id: "Tinggi", ms: "Tinggi", tl: "Mataas", zh: "高", my: "မြင့်" },
  "Very high": { id: "Sangat tinggi", ms: "Sangat tinggi", tl: "Napakataas", zh: "极高", my: "အလွန်မြင့်" },

  // --- care recipient ---
  Female: { id: "Perempuan", ms: "Perempuan", tl: "Babae", zh: "女", my: "အမျိုးသမီး" },
  Hypertension: { id: "Hipertensi", ms: "Darah tinggi", tl: "Hypertension", zh: "高血压", my: "သွေးတိုး" },
  "Type 2 Diabetes": { id: "Diabetes Tipe 2", ms: "Diabetes Jenis 2", tl: "Type 2 Diabetes", zh: "2 型糖尿病", my: "အမျိုးအစား ၂ ဆီးချို" },
  "1 spray under the tongue": { id: "1 semprotan di bawah lidah", ms: "1 semburan di bawah lidah", tl: "1 spray sa ilalim ng dila", zh: "舌下喷 1 下", my: "လျှာအောက် ၁ ကြိမ် ဖျန်းပါ" },
  "When chest pain: 1 spray under the tongue. May repeat after 5 min (max 3). If no better, call 995.": {
    id: "Saat nyeri dada: 1 semprotan di bawah lidah. Boleh diulang setelah 5 menit (maks. 3). Jika tidak membaik, hubungi 995.",
    ms: "Apabila sakit dada: 1 semburan di bawah lidah. Boleh ulang selepas 5 minit (maks. 3). Jika tidak reda, hubungi 995.",
    tl: "Kapag may sakit sa dibdib: 1 spray sa ilalim ng dila. Maaaring ulitin pagkatapos ng 5 min (max 3). Kung hindi gumaan, tumawag sa 995.",
    zh: "胸痛时：舌下喷 1 下。5 分钟后可重复（最多 3 次）。若无好转，拨打 995。",
    my: "ရင်ဘတ်အောင့်လျှင်: လျှာအောက် ၁ ကြိမ် ဖျန်းပါ။ ၅ မိနစ်အကြာ ထပ်လုပ်နိုင် (အများဆုံး ၃ ကြိမ်)။ မသက်သာလျှင် 995 ကို ခေါ်ပါ။",
  },
  "1 tablet (300 mg), chewed": { id: "1 tablet (300 mg), dikunyah", ms: "1 tablet (300 mg), dikunyah", tl: "1 tablet (300 mg), nginuya", zh: "1 片（300 毫克），嚼服", my: "ဆေးပြား ၁ ပြား (၃၀၀ မီလီဂရမ်)၊ ဝါးစားပါ" },
  "For sudden crushing chest pain: chew 1 tablet once, then call 995 immediately.": {
    id: "Untuk nyeri dada hebat mendadak: kunyah 1 tablet sekali, lalu segera hubungi 995.",
    ms: "Untuk sakit dada mengejut yang teruk: kunyah 1 tablet sekali, kemudian segera hubungi 995.",
    tl: "Para sa biglaang matinding sakit sa dibdib: nguyain ang 1 tablet nang isang beses, pagkatapos tumawag agad sa 995.",
    zh: "突发剧烈胸痛时：嚼服 1 片，然后立即拨打 995。",
    my: "ရုတ်တရက် ပြင်းထန်စွာ ရင်ဘတ်အောင့်လျှင်: ဆေးပြား ၁ ပြားကို တစ်ကြိမ်ဝါးစားပြီး ချက်ချင်း 995 ကို ခေါ်ပါ။",
  },

  // --- profile additional notes ---
  "Prefers Mandarin; limited English.": {
    id: "Lebih suka bahasa Mandarin; bahasa Inggris terbatas.",
    ms: "Lebih suka bahasa Mandarin; bahasa Inggeris terhad.",
    tl: "Mas gusto ang Mandarin; limitado ang Ingles.",
    zh: "偏好华语；英语有限。",
    my: "တရုတ်ဘာသာကို နှစ်သက်သည်၊ အင်္ဂလိပ်စာ အကန့်အသတ်ရှိသည်။",
  },
  "Lives alone; daughter visits on weekends.": {
    id: "Tinggal sendiri; anak perempuan berkunjung di akhir pekan.",
    ms: "Tinggal seorang diri; anak perempuan melawat pada hujung minggu.",
    tl: "Nag-iisang nakatira; bumibisita ang anak na babae tuwing weekend.",
    zh: "独居；女儿周末探访。",
    my: "တစ်ဦးတည်း နေထိုင်သည်၊ သမီးက စနေတနင်္ဂနွေတွင် လာရောက်သည်။",
  },
  "Walks with a cane — avoid stairs where possible.": {
    id: "Berjalan dengan tongkat — hindari tangga jika memungkinkan.",
    ms: "Berjalan dengan tongkat — elakkan tangga jika boleh.",
    tl: "Naglalakad gamit ang tungkod — iwasan ang hagdan kung maaari.",
    zh: "拄拐杖行走——尽量避免楼梯。",
    my: "တောင်ဝှေးဖြင့် လမ်းလျှောက်သည် — ဖြစ်နိုင်လျှင် လှေကားကို ရှောင်ပါ။",
  },
  "Spare keys kept with the neighbour at #08-43.": {
    id: "Kunci cadangan dititipkan ke tetangga di #08-43.",
    ms: "Kunci ganti disimpan dengan jiran di #08-43.",
    tl: "Ang ekstrang susi ay nasa kapitbahay sa #08-43.",
    zh: "备用钥匙存放在 #08-43 的邻居处。",
    my: "အပို သော့ကို #08-43 ရှိ အိမ်နီးချင်းထံ အပ်ထားသည်။",
  },

  // --- scenario "why" + elderly burden (templated) ---
  "At {age} with {conditions}, COVID-19 is far more likely to need hospital or ICU care.": {
    id: "Pada usia {age} dengan {conditions}, COVID-19 jauh lebih mungkin memerlukan perawatan rumah sakit atau ICU.",
    ms: "Pada usia {age} dengan {conditions}, COVID-19 jauh lebih berkemungkinan memerlukan rawatan hospital atau ICU.",
    tl: "Sa edad {age} na may {conditions}, mas malamang na mangailangan ang COVID-19 ng ospital o ICU.",
    zh: "在 {age} 岁且患有{conditions}的情况下，COVID-19 更可能需要住院或加护治疗。",
    my: "အသက် {age} နှင့် {conditions} ရှိသူအတွက် COVID-19 သည် ဆေးရုံ သို့မဟုတ် ICU ကုသမှု လိုအပ်နိုင်ခြေ များစွာ ပိုများသည်။",
  },
  "At {age} with {conditions}, dengue can hit harder — higher bleeding risk and sudden blood-pressure drops.": {
    id: "Pada usia {age} dengan {conditions}, demam berdarah bisa lebih parah — risiko perdarahan lebih tinggi dan tekanan darah turun mendadak.",
    ms: "Pada usia {age} dengan {conditions}, denggi boleh lebih teruk — risiko pendarahan lebih tinggi dan tekanan darah jatuh mengejut.",
    tl: "Sa edad {age} na may {conditions}, mas matindi ang dengue — mas mataas ang panganib ng pagdurugo at biglaang pagbaba ng presyon.",
    zh: "在 {age} 岁且患有{conditions}的情况下，骨痛热症可能更严重——出血风险更高、血压骤降。",
    my: "အသက် {age} နှင့် {conditions} ရှိသူအတွက် သွေးလွန်တုပ်ကွေးသည် ပိုဆိုးနိုင်သည် — သွေးထွက်နိုင်ခြေ ပိုမြင့်ပြီး သွေးဖိအား ရုတ်တရက် ကျဆင်းနိုင်သည်။",
  },
  "{count} daily hospitalisations · {icu} in ICU": {
    id: "{count} rawat inap harian · {icu} di ICU",
    ms: "{count} kemasukan hospital harian · {icu} di ICU",
    tl: "{count} pang-araw-araw na pagpapaospital · {icu} sa ICU",
    zh: "每日 {count} 例住院 · {icu} 例在加护病房",
    my: "နေ့စဉ် ဆေးရုံတက် {count} ဦး · ICU တွင် {icu} ဦး",
  },
  "Older adults face a higher risk of severe dengue.": {
    id: "Lansia menghadapi risiko demam berdarah berat yang lebih tinggi.",
    ms: "Warga emas menghadapi risiko denggi teruk yang lebih tinggi.",
    tl: "Mas mataas ang panganib ng matinding dengue sa mga matatanda.",
    zh: "长者罹患重症骨痛热症的风险更高。",
    my: "သက်ကြီးရွယ်အိုများသည် ပြင်းထန်သော သွေးလွန်တုပ်ကွေး ဖြစ်နိုင်ခြေ ပိုမြင့်သည်။",
  },

  // --- broadcasts ---
  "COVID-19 activity is rising": { id: "Aktivitas COVID-19 meningkat", ms: "Aktiviti COVID-19 semakin meningkat", tl: "Tumataas ang aktibidad ng COVID-19", zh: "COVID-19 活动正在上升", my: "COVID-19 လှုပ်ရှားမှု မြင့်တက်လာသည်" },
  "National dengue alert — Red": { id: "Peringatan demam berdarah nasional — Merah", ms: "Amaran denggi kebangsaan — Merah", tl: "Pambansang alerto sa dengue — Pula", zh: "全国骨痛热症警报——红色", my: "အမျိုးသား သွေးလွန်တုပ်ကွေး သတိပေးချက် — အနီ" },
  "MOH reports rising COVID-19 and influenza activity": {
    id: "MOH melaporkan peningkatan aktivitas COVID-19 dan influenza",
    ms: "MOH melaporkan peningkatan aktiviti COVID-19 dan influenza",
    tl: "Iniulat ng MOH ang tumataas na aktibidad ng COVID-19 at influenza",
    zh: "卫生部报告 COVID-19 和流感活动上升",
    my: "COVID-19 နှင့် တုပ်ကွေး လှုပ်ရှားမှု မြင့်တက်ကြောင်း MOH က ဖော်ပြသည်",
  },
  "MOH reports rising COVID-19 and influenza activity, with a mild increase in admissions among older adults. Keep COVID-19 and flu boosters up to date, test early at the first sign of symptoms, and consider a mask in crowded or enclosed indoor places. Watch the elderly for fever, cough or breathlessness, and seek care promptly for chest pain, confusion or trouble breathing — older adults can deteriorate quickly.": {
    id: "MOH melaporkan peningkatan aktivitas COVID-19 dan influenza, dengan sedikit kenaikan rawat inap pada lansia. Pastikan booster COVID-19 dan flu tetap terbarui, lakukan tes lebih awal pada gejala pertama, dan pertimbangkan masker di tempat ramai atau tertutup. Pantau lansia terhadap demam, batuk, atau sesak napas, dan segera cari pertolongan untuk nyeri dada, kebingungan, atau kesulitan bernapas — kondisi lansia dapat memburuk dengan cepat.",
    ms: "MOH melaporkan peningkatan aktiviti COVID-19 dan influenza, dengan sedikit kenaikan kemasukan hospital dalam kalangan warga emas. Pastikan booster COVID-19 dan selesema sentiasa terkini, buat ujian awal pada tanda gejala pertama, dan pertimbangkan pelitup muka di tempat sesak atau tertutup. Perhatikan warga emas untuk demam, batuk atau sesak nafas, dan dapatkan rawatan segera untuk sakit dada, keliru atau sukar bernafas — keadaan warga emas boleh merosot dengan cepat.",
    tl: "Iniulat ng MOH ang tumataas na aktibidad ng COVID-19 at influenza, na may bahagyang pagdami ng admission sa mga matatanda. Panatilihing updated ang COVID-19 at flu boosters, mag-test agad sa unang sintomas, at isaalang-alang ang mask sa matao o saradong lugar. Bantayan ang matatanda para sa lagnat, ubo o hirap sa paghinga, at humingi agad ng tulong para sa sakit sa dibdib, pagkalito o hirap huminga — mabilis lumala ang matatanda.",
    zh: "卫生部报告 COVID-19 和流感活动上升，长者住院略有增加。请保持 COVID-19 和流感加强针更新，出现症状即早检测，并在拥挤或密闭室内场所考虑佩戴口罩。留意长者是否发烧、咳嗽或呼吸困难，若出现胸痛、意识混乱或呼吸困难应立即就医——长者病情可能迅速恶化。",
    my: "COVID-19 နှင့် တုပ်ကွေး လှုပ်ရှားမှု မြင့်တက်ပြီး သက်ကြီးရွယ်အိုများ ဆေးရုံတက်မှု အနည်းငယ် တိုးလာကြောင်း MOH က ဖော်ပြသည်။ COVID-19 နှင့် တုပ်ကွေး ဘူစတာများ နောက်ဆုံးအခြေအနေ ထားရှိပါ၊ ရောဂါလက္ခဏာ စတင်ချိန်တွင် စောစီးစွာ စစ်ဆေးပါ၊ လူစည်ကားသော သို့မဟုတ် ပိတ်လှောင်သော နေရာများတွင် နှာခေါင်းစည်း တပ်ရန် စဉ်းစားပါ။ သက်ကြီးရွယ်အိုများကို အဖျား၊ ချောင်းဆိုး သို့မဟုတ် အသက်ရှူကျပ်ခြင်း သတိထားပြီး၊ ရင်ဘတ်အောင့်ခြင်း၊ စိတ်ရှုပ်ထွေးခြင်း သို့မဟုတ် အသက်ရှူရခက်ခြင်းအတွက် ချက်ချင်း ကုသမှု ရယူပါ — သက်ကြီးရွယ်အိုများ လျင်မြန်စွာ ဆိုးရွားနိုင်သည်။",
  },
  "Weekly dengue cases are above the epidemic threshold with several large clusters active islandwide. Do the 5-step Mozzie Wipeout at home: change vase water, turn pails, loosen hardened soil, clear roof gutters and add insecticide, and clear blockages in scupper drains. Apply repellent on the elderly, use bed nets, and keep them in long sleeves at dusk. Seek care early for fever with body aches, rash or vomiting — dengue can deteriorate quickly in older adults.": {
    id: "Kasus demam berdarah mingguan berada di atas ambang epidemi dengan beberapa klaster besar aktif di seluruh pulau. Lakukan 5 langkah Mozzie Wipeout di rumah: ganti air vas, balik ember, gemburkan tanah yang mengeras, bersihkan talang atap dan beri insektisida, serta bersihkan sumbatan di saluran. Oleskan losion anti-nyamuk pada lansia, gunakan kelambu, dan kenakan lengan panjang saat senja. Cari pertolongan lebih awal untuk demam disertai nyeri badan, ruam, atau muntah — demam berdarah dapat memburuk cepat pada lansia.",
    ms: "Kes denggi mingguan melebihi ambang wabak dengan beberapa kluster besar aktif di seluruh pulau. Lakukan 5 langkah Mozzie Wipeout di rumah: tukar air pasu, terbalikkan baldi, gemburkan tanah keras, bersihkan longkang bumbung dan tambah racun serangga, serta bersihkan sumbatan dalam longkang. Sapukan penghalau nyamuk pada warga emas, gunakan kelambu, dan pakaikan lengan panjang pada waktu senja. Dapatkan rawatan awal untuk demam dengan sakit badan, ruam atau muntah — denggi boleh merosot cepat pada warga emas.",
    tl: "Ang lingguhang kaso ng dengue ay lampas na sa epidemic threshold na may ilang malalaking cluster na aktibo sa buong isla. Gawin ang 5-hakbang na Mozzie Wipeout sa bahay: palitan ang tubig sa plorera, taob ang mga timba, luwagan ang tumigas na lupa, linisin ang gutter ng bubong at lagyan ng insecticide, at linisin ang mga baradong kanal. Maglagay ng repellent sa matatanda, gumamit ng kulambo, at suotan sila ng mahabang manggas sa gabi. Humingi ng tulong agad para sa lagnat na may pananakit ng katawan, pamamantal o pagsusuka — mabilis lumala ang dengue sa matatanda.",
    zh: "每周骨痛热症病例已超过流行阈值，多个大型群组在全岛活跃。在家做好五步灭蚊：更换花瓶水、倒置水桶、松动硬土、清理屋顶排水沟并加杀虫剂、清除沟渠堵塞。为长者涂抹驱蚊液、使用蚊帐，黄昏时穿长袖。如发烧伴身体酸痛、出疹或呕吐应尽早就医——长者骨痛热症可能迅速恶化。",
    my: "အပတ်စဉ် သွေးလွန်တုပ်ကွေး လူနာများသည် ကပ်ရောဂါ အဆင့်ထက် ကျော်လွန်နေပြီး တစ်ကျွန်းလုံးတွင် ကြီးမားသော အစုအဖွဲ့များ တက်ကြွနေသည်။ အိမ်တွင် Mozzie Wipeout ၅ ဆင့်ကို လုပ်ပါ: ပန်းအိုးရေ လဲပါ၊ ရေပုံးများ မှောက်ထားပါ၊ မာကျောသော မြေကို ဖြုတ်ပါ၊ အမိုးရေပြွန်များ သန့်ရှင်းပြီး ပိုးသတ်ဆေး ထည့်ပါ၊ ရေမြောင်း ပိတ်ဆို့မှုများ ရှင်းပါ။ သက်ကြီးရွယ်အိုများတွင် ခြင်ဆေးလိမ်းပါ၊ ခြင်ထောင် သုံးပါ၊ ညနေချမ်းတွင် လက်ရှည် ဝတ်ဆင်ပါ။ အဖျားနှင့်အတူ ကိုယ်ကိုက်ခြင်း၊ အရေပြားအဖုများ သို့မဟုတ် အန်ခြင်းအတွက် စောစီးစွာ ကုသမှု ရယူပါ — သက်ကြီးရွယ်အိုများတွင် သွေးလွန်တုပ်ကွေး လျင်မြန်စွာ ဆိုးရွားနိုင်သည်။",
  },

  // --- because tags (tailored suggestion reasons) ---
  "Age 78": { id: "Usia 78", ms: "Umur 78", tl: "Edad 78", zh: "78 岁", my: "အသက် ၇၈" },
  "Bleeding risk": { id: "Risiko perdarahan", ms: "Risiko pendarahan", tl: "Panganib ng pagdurugo", zh: "出血风险", my: "သွေးထွက်နိုင်ခြေ" },
  "Hypertension · Diabetes": { id: "Hipertensi · Diabetes", ms: "Darah tinggi · Diabetes", tl: "Hypertension · Diabetes", zh: "高血压 · 糖尿病", my: "သွေးတိုး · ဆီးချို" },

  // --- COVID tailored suggestions ---
  "Keep her COVID-19 and flu boosters up to date.": { id: "Pastikan booster COVID-19 dan flu-nya tetap terbarui.", ms: "Pastikan booster COVID-19 dan selesemanya sentiasa terkini.", tl: "Panatilihing updated ang COVID-19 at flu boosters niya.", zh: "保持她的 COVID-19 和流感加强针更新。", my: "သူ၏ COVID-19 နှင့် တုပ်ကွေး ဘူစတာများ နောက်ဆုံးအခြေအနေ ထားပါ။" },
  "Carry on normally — watch for fever, cough or breathlessness.": { id: "Lanjutkan seperti biasa — waspadai demam, batuk, atau sesak napas.", ms: "Teruskan seperti biasa — perhatikan demam, batuk atau sesak nafas.", tl: "Magpatuloy nang normal — bantayan ang lagnat, ubo o hirap sa paghinga.", zh: "照常生活——留意发烧、咳嗽或呼吸困难。", my: "ပုံမှန် ဆက်နေပါ — အဖျား၊ ချောင်းဆိုး သို့မဟုတ် အသက်ရှူကျပ်ခြင်း သတိထားပါ။" },
  "Keep a couple of ART kits and her regular medicines on hand.": { id: "Sediakan beberapa alat tes ART dan obat rutinnya.", ms: "Sediakan beberapa kit ujian ART dan ubat biasanya.", tl: "Maghanda ng ilang ART kit at ang regular na gamot niya.", zh: "备好几个 ART 检测盒和她的常用药。", my: "ART စစ်ဆေးကိရိယာ အနည်းငယ်နှင့် သူ၏ ပုံမှန်ဆေးများ အသင့်ထားပါ။" },
  "Have her wear a mask in crowded or enclosed indoor places.": { id: "Mintalah dia memakai masker di tempat ramai atau tertutup.", ms: "Minta dia memakai pelitup muka di tempat sesak atau tertutup.", tl: "Pasuotin siya ng mask sa matao o saradong lugar.", zh: "在拥挤或密闭的室内场所让她戴口罩。", my: "လူစည်ကားသော သို့မဟုတ် ပိတ်လှောင်သော နေရာများတွင် သူ့ကို နှာခေါင်းစည်း တပ်ခိုင်းပါ။" },
  "Keep ART kits at home and test at the first sign of symptoms.": { id: "Simpan alat tes ART di rumah dan tes saat gejala pertama muncul.", ms: "Simpan kit ujian ART di rumah dan uji pada tanda gejala pertama.", tl: "Magtago ng ART kit sa bahay at mag-test sa unang sintomas.", zh: "在家备好 ART 检测盒，出现症状即检测。", my: "ART စစ်ဆေးကိရိယာများ အိမ်တွင် ထားပြီး ရောဂါလက္ခဏာ စတင်ချိန် စစ်ဆေးပါ။" },
  "Confirm her booster is current — older adults benefit the most.": { id: "Pastikan booster-nya terbaru — lansia paling diuntungkan.", ms: "Pastikan booster-nya terkini — warga emas paling mendapat manfaat.", tl: "Tiyakin na current ang booster niya — pinakanakikinabang ang matatanda.", zh: "确认她的加强针是最新的——长者获益最大。", my: "သူ၏ ဘူစတာ နောက်ဆုံးဖြစ်ကြောင်း သေချာပါ — သက်ကြီးရွယ်အိုများ အကျိုးအများဆုံး ရသည်။" },
  "Keep her blood sugar steady — fevers can spike glucose.": { id: "Jaga gula darahnya tetap stabil — demam bisa melonjakkan glukosa.", ms: "Pastikan gula darahnya stabil — demam boleh melonjakkan glukosa.", tl: "Panatilihing stable ang asukal niya sa dugo — pinapataas ng lagnat ang glucose.", zh: "保持她的血糖稳定——发烧会使血糖飙升。", my: "သူ၏ သွေးတွင်းသကြားဓာတ် တည်ငြိမ်အောင် ထားပါ — အဖျားသည် ဂလူးကို့စ် မြင့်တက်စေနိုင်သည်။" },
  "Minimise non-essential outings; use an N95 mask when she goes out.": { id: "Kurangi keluar rumah yang tidak penting; pakai masker N95 saat keluar.", ms: "Kurangkan keluar yang tidak perlu; pakai pelitup N95 apabila keluar.", tl: "Bawasan ang hindi kinakailangang paglabas; gumamit ng N95 mask kapag lumalabas.", zh: "减少非必要外出；外出时戴 N95 口罩。", my: "မလိုအပ်သော အပြင်ထွက်ခြင်းကို လျှော့ပါ၊ အပြင်ထွက်ချိန် N95 နှာခေါင်းစည်း တပ်ပါ။" },
  "Test early and isolate her from the household if symptomatic.": { id: "Tes lebih awal dan isolasi dia dari anggota rumah jika bergejala.", ms: "Uji awal dan asingkan dia daripada isi rumah jika bergejala.", tl: "Mag-test agad at ihiwalay siya sa sambahayan kung may sintomas.", zh: "尽早检测，如有症状让她与家人隔离。", my: "စောစီးစွာ စစ်ဆေးပြီး ရောဂါလက္ခဏာရှိလျှင် အိမ်သူအိမ်သားများနှင့် သီးခြားနေပါ။" },
  "Check her temperature and breathing daily; watch for chest tightness.": { id: "Periksa suhu dan napasnya setiap hari; waspadai dada terasa sesak.", ms: "Periksa suhu dan pernafasannya setiap hari; perhatikan sesak dada.", tl: "Suriin ang temperatura at paghinga niya araw-araw; bantayan ang paninikip ng dibdib.", zh: "每天检查她的体温和呼吸；留意胸闷。", my: "သူ၏ အပူချိန်နှင့် အသက်ရှူမှုကို နေ့စဉ် စစ်ဆေးပါ၊ ရင်ဘတ်ကျပ်ခြင်း သတိထားပါ။" },
  "Have a teleconsult option and 5 days of medicines ready.": { id: "Siapkan opsi telekonsultasi dan obat untuk 5 hari.", ms: "Sediakan pilihan telekonsultasi dan ubat untuk 5 hari.", tl: "Maghanda ng teleconsult option at gamot para sa 5 araw.", zh: "准备好远程问诊选项和 5 天的药物。", my: "တယ်လီဆေးကုသမှု ရွေးချယ်စရာနှင့် ၅ ရက်စာ ဆေးများ အသင့်ထားပါ။" },
  "Avoid visitors and crowded places wherever possible.": { id: "Hindari tamu dan tempat ramai sebisa mungkin.", ms: "Elakkan tetamu dan tempat sesak jika boleh.", tl: "Iwasan ang mga bisita at matataong lugar hangga't maaari.", zh: "尽可能避免访客和拥挤场所。", my: "ဖြစ်နိုင်သမျှ ဧည့်သည်များနှင့် လူစည်ကားသော နေရာများကို ရှောင်ပါ။" },
  "N95 mask for any unavoidable outing; keep her room ventilated.": { id: "Pakai masker N95 untuk keluar yang tak terhindarkan; jaga ventilasi kamarnya.", ms: "Pelitup N95 untuk keluar yang tidak dapat dielakkan; pastikan biliknya berudara.", tl: "N95 mask para sa hindi maiiwasang paglabas; panatilihing maaliwalas ang kwarto niya.", zh: "无法避免外出时戴 N95 口罩；保持她的房间通风。", my: "မရှောင်နိုင်သော အပြင်ထွက်ခြင်းအတွက် N95 နှာခေါင်းစည်း တပ်ပါ၊ သူ၏ အခန်း လေဝင်လေထွက် ကောင်းအောင် ထားပါ။" },
  "Monitor breathing and SpO2 daily.": { id: "Pantau napas dan SpO2 setiap hari.", ms: "Pantau pernafasan dan SpO2 setiap hari.", tl: "Subaybayan ang paghinga at SpO2 araw-araw.", zh: "每天监测呼吸和血氧饱和度。", my: "အသက်ရှူမှုနှင့် SpO2 ကို နေ့စဉ် စောင့်ကြည့်ပါ။" },
  "Know the 995 red flags: breathlessness, confusion, chest pain.": { id: "Kenali tanda bahaya 995: sesak napas, kebingungan, nyeri dada.", ms: "Kenali tanda bahaya 995: sesak nafas, keliru, sakit dada.", tl: "Alamin ang 995 red flags: hirap sa paghinga, pagkalito, sakit sa dibdib.", zh: "了解需拨打 995 的危险信号：呼吸困难、意识混乱、胸痛。", my: "995 ခေါ်ရမည့် အန္တရာယ်လက္ခဏာများ သိထားပါ: အသက်ရှူကျပ်ခြင်း၊ စိတ်ရှုပ်ထွေးခြင်း၊ ရင်ဘတ်အောင့်ခြင်း။" },

  // --- Dengue tailored suggestions ---
  "Do the 5-step Mozzie Wipeout weekly — clear any stagnant water.": { id: "Lakukan 5 langkah Mozzie Wipeout mingguan — bersihkan air tergenang.", ms: "Lakukan 5 langkah Mozzie Wipeout mingguan — bersihkan air bertakung.", tl: "Gawin ang 5-hakbang na Mozzie Wipeout lingguhan — alisin ang anumang nakatigil na tubig.", zh: "每周做五步灭蚊——清除任何积水。", my: "Mozzie Wipeout ၅ ဆင့်ကို အပတ်စဉ် လုပ်ပါ — ရပ်နေသော ရေများ ရှင်းပါ။" },
  "Apply repellent on her, especially at dawn and dusk.": { id: "Oleskan losion anti-nyamuk padanya, terutama saat fajar dan senja.", ms: "Sapukan penghalau nyamuk padanya, terutamanya waktu subuh dan senja.", tl: "Maglagay ng repellent sa kanya, lalo na sa madaling-araw at gabi.", zh: "给她涂驱蚊液，尤其在清晨和黄昏。", my: "သူ့အပေါ် ခြင်ဆေး လိမ်းပါ၊ အထူးသဖြင့် အရုဏ်တက်နှင့် ညနေချမ်းတွင်။" },
  "Watch for fever with body aches or rash.": { id: "Waspadai demam disertai nyeri badan atau ruam.", ms: "Perhatikan demam dengan sakit badan atau ruam.", tl: "Bantayan ang lagnat na may pananakit ng katawan o pamamantal.", zh: "留意发烧伴身体酸痛或出疹。", my: "ကိုယ်ကိုက်ခြင်း သို့မဟုတ် အရေပြားအဖုနှင့်အတူ အဖျား သတိထားပါ။" },
  "Remove stagnant water around the home (vases, trays, drains).": { id: "Buang air tergenang di sekitar rumah (vas, nampan, saluran).", ms: "Buang air bertakung di sekitar rumah (pasu, dulang, longkang).", tl: "Alisin ang nakatigil na tubig sa paligid ng bahay (plorera, tray, kanal).", zh: "清除家周围的积水（花瓶、托盘、沟渠）。", my: "အိမ်ပတ်လည်ရှိ ရပ်နေသောရေများ (ပန်းအိုး၊ ဗန်း၊ ရေမြောင်း) ဖယ်ရှားပါ။" },
  "Apply repellent and keep her arms and legs covered.": { id: "Oleskan losion anti-nyamuk dan tutup lengan serta kakinya.", ms: "Sapukan penghalau nyamuk dan tutup lengan serta kakinya.", tl: "Maglagay ng repellent at takpan ang braso at binti niya.", zh: "涂驱蚊液并遮盖她的手臂和腿。", my: "ခြင်ဆေးလိမ်းပြီး သူ၏ လက်နှင့် ခြေထောက်များ ဖုံးအုပ်ထားပါ။" },
  "For fever, use paracetamol — avoid ibuprofen/NSAIDs.": { id: "Untuk demam, gunakan parasetamol — hindari ibuprofen/NSAID.", ms: "Untuk demam, guna parasetamol — elakkan ibuprofen/NSAID.", tl: "Para sa lagnat, gumamit ng paracetamol — iwasan ang ibuprofen/NSAIDs.", zh: "发烧时用扑热息痛——避免布洛芬/非甾体抗炎药。", my: "အဖျားအတွက် ပါရာစီတမော သုံးပါ — ibuprofen/NSAID ရှောင်ပါ။" },
  "See a doctor early for any fever — don't wait it out.": { id: "Segera ke dokter untuk demam apa pun — jangan menunda.", ms: "Jumpa doktor awal untuk sebarang demam — jangan tunggu.", tl: "Magpatingin agad sa doktor para sa anumang lagnat — huwag hintayin.", zh: "任何发烧都尽早就医——不要拖延。", my: "မည်သည့်အဖျားအတွက်မဆို စောစီးစွာ ဆရာဝန်နှင့် ပြပါ — မစောင့်ပါနှင့်။" },
  "Step up mosquito control; use repellent and a bed net for her.": { id: "Tingkatkan pengendalian nyamuk; gunakan losion anti-nyamuk dan kelambu untuknya.", ms: "Pertingkatkan kawalan nyamuk; guna penghalau nyamuk dan kelambu untuknya.", tl: "Paigtingin ang kontrol sa lamok; gumamit ng repellent at kulambo para sa kanya.", zh: "加强防蚊；为她使用驱蚊液和蚊帐。", my: "ခြင်ထိန်းချုပ်မှု မြှင့်တင်ပါ၊ သူ့အတွက် ခြင်ဆေးနှင့် ခြင်ထောင် သုံးပါ။" },
  "Seek care early for fever — older adults can deteriorate fast.": { id: "Cari pertolongan lebih awal untuk demam — kondisi lansia bisa memburuk cepat.", ms: "Dapatkan rawatan awal untuk demam — keadaan warga emas boleh merosot cepat.", tl: "Humingi ng tulong agad para sa lagnat — mabilis lumala ang matatanda.", zh: "发烧尽早就医——长者病情可能迅速恶化。", my: "အဖျားအတွက် စောစီးစွာ ကုသမှု ရယူပါ — သက်ကြီးရွယ်အိုများ လျင်မြန်စွာ ဆိုးရွားနိုင်သည်။" },
  "Watch for bleeding gums, severe tummy pain or drowsiness.": { id: "Waspadai gusi berdarah, nyeri perut hebat, atau mengantuk berlebihan.", ms: "Perhatikan gusi berdarah, sakit perut teruk atau mengantuk.", tl: "Bantayan ang dumudugong gilagid, matinding sakit ng tiyan o antok.", zh: "留意牙龈出血、剧烈腹痛或嗜睡。", my: "သွားဖုံးသွေးထွက်ခြင်း၊ ပြင်းထန်သော ဝမ်းဗိုက်နာခြင်း သို့မဟုတ် အိပ်ငိုက်ခြင်း သတိထားပါ။" },
  "Treat this as an active outbreak — check daily for standing water.": { id: "Anggap ini sebagai wabah aktif — periksa air tergenang setiap hari.", ms: "Anggap ini sebagai wabak aktif — periksa air bertakung setiap hari.", tl: "Ituring itong aktibong outbreak — suriin araw-araw ang nakatigil na tubig.", zh: "将此视为活跃疫情——每天检查积水。", my: "ဤအရာကို တက်ကြွသော ကပ်ရောဂါအဖြစ် သဘောထားပါ — ရပ်နေသောရေကို နေ့စဉ် စစ်ဆေးပါ။" },
  "Repellent, long sleeves and a bed net for her at all times.": { id: "Losion anti-nyamuk, lengan panjang, dan kelambu untuknya setiap saat.", ms: "Penghalau nyamuk, lengan panjang dan kelambu untuknya pada setiap masa.", tl: "Repellent, mahabang manggas at kulambo para sa kanya sa lahat ng oras.", zh: "始终为她准备驱蚊液、长袖和蚊帐。", my: "သူ့အတွက် ခြင်ဆေး၊ လက်ရှည်နှင့် ခြင်ထောင်ကို အချိန်တိုင်း ထားပါ။" },
  "Any fever → see a doctor; flag her bleeding and BP risk.": { id: "Demam apa pun → ke dokter; sampaikan risiko perdarahan dan tekanan darahnya.", ms: "Sebarang demam → jumpa doktor; maklumkan risiko pendarahan dan tekanan darahnya.", tl: "Anumang lagnat → magpadoktor; banggitin ang panganib ng pagdurugo at BP niya.", zh: "任何发烧 → 就医；告知她的出血和血压风险。", my: "မည်သည့်အဖျားမဆို → ဆရာဝန်ပြပါ၊ သူ၏ သွေးထွက်နိုင်ခြေနှင့် သွေးဖိအား အန္တရာယ်ကို ပြောပါ။" },
  "Severe abdominal pain, bleeding or fainting → go to A&E.": { id: "Nyeri perut hebat, perdarahan, atau pingsan → ke UGD.", ms: "Sakit perut teruk, pendarahan atau pengsan → ke A&E.", tl: "Matinding sakit ng tiyan, pagdurugo o pagkahimatay → pumunta sa A&E.", zh: "剧烈腹痛、出血或晕厥 → 前往急诊。", my: "ပြင်းထန်သော ဝမ်းဗိုက်နာခြင်း၊ သွေးထွက်ခြင်း သို့မဟုတ် မေ့မြောခြင်း → အရေးပေါ်ဌာနသို့ သွားပါ။" },
  "A cluster is right around the home — do the 5-step Mozzie Wipeout today.": { id: "Ada klaster tepat di sekitar rumah — lakukan 5 langkah Mozzie Wipeout hari ini.", ms: "Terdapat kluster betul-betul di sekitar rumah — lakukan 5 langkah Mozzie Wipeout hari ini.", tl: "May cluster mismo sa paligid ng bahay — gawin ang 5-hakbang na Mozzie Wipeout ngayon.", zh: "群组就在住家附近——今天就做五步灭蚊。", my: "အိမ်ပတ်လည်တွင် အစုအဖွဲ့ ရှိနေသည် — ယနေ့ Mozzie Wipeout ၅ ဆင့် လုပ်ပါ။" },
  "Repellent and long sleeves for her, especially at dawn and dusk.": { id: "Losion anti-nyamuk dan lengan panjang untuknya, terutama saat fajar dan senja.", ms: "Penghalau nyamuk dan lengan panjang untuknya, terutamanya waktu subuh dan senja.", tl: "Repellent at mahabang manggas para sa kanya, lalo na sa madaling-araw at gabi.", zh: "为她准备驱蚊液和长袖，尤其在清晨和黄昏。", my: "သူ့အတွက် ခြင်ဆေးနှင့် လက်ရှည်၊ အထူးသဖြင့် အရုဏ်တက်နှင့် ညနေချမ်းတွင်။" },
  "Any fever → see a doctor early.": { id: "Demam apa pun → segera ke dokter.", ms: "Sebarang demam → jumpa doktor awal.", tl: "Anumang lagnat → magpadoktor agad.", zh: "任何发烧 → 尽早就医。", my: "မည်သည့်အဖျားမဆို → စောစီးစွာ ဆရာဝန်ပြပါ။" },
  "Clusters are nearby — clear standing water around the home weekly.": { id: "Ada klaster di dekat sini — bersihkan air tergenang di sekitar rumah setiap minggu.", ms: "Terdapat kluster berdekatan — bersihkan air bertakung di sekitar rumah setiap minggu.", tl: "May mga cluster sa malapit — alisin ang nakatigil na tubig sa paligid ng bahay lingguhan.", zh: "附近有群组——每周清除家周围的积水。", my: "အနီးတွင် အစုအဖွဲ့များ ရှိသည် — အိမ်ပတ်လည်ရှိ ရပ်နေသောရေကို အပတ်စဉ် ရှင်းပါ။" },
  "Watch for fever; older adults can develop severe dengue.": { id: "Waspadai demam; lansia bisa mengalami demam berdarah berat.", ms: "Perhatikan demam; warga emas boleh mengalami denggi teruk.", tl: "Bantayan ang lagnat; maaaring magkaroon ng matinding dengue ang matatanda.", zh: "留意发烧；长者可能发展为重症骨痛热症。", my: "အဖျား သတိထားပါ၊ သက်ကြီးရွယ်အိုများ ပြင်းထန်သော သွေးလွန်တုပ်ကွေး ဖြစ်နိုင်သည်။" },
  "No clusters close by — keep up the weekly Mozzie Wipeout.": { id: "Tidak ada klaster di dekat sini — teruskan Mozzie Wipeout mingguan.", ms: "Tiada kluster berdekatan — teruskan Mozzie Wipeout mingguan.", tl: "Walang malapit na cluster — ipagpatuloy ang lingguhang Mozzie Wipeout.", zh: "附近没有群组——坚持每周灭蚊。", my: "အနီးတွင် အစုအဖွဲ့ မရှိ — အပတ်စဉ် Mozzie Wipeout ဆက်လုပ်ပါ။" },
  "Apply repellent when she's outdoors near greenery.": { id: "Oleskan losion anti-nyamuk saat dia di luar dekat tanaman hijau.", ms: "Sapukan penghalau nyamuk apabila dia di luar berhampiran kawasan hijau.", tl: "Maglagay ng repellent kapag siya ay nasa labas malapit sa halaman.", zh: "当她在户外靠近绿植时涂驱蚊液。", my: "သူ အပြင်ဘက် အစိမ်းရောင်နေရာအနီး ရှိစဉ် ခြင်ဆေး လိမ်းပါ။" },
};
