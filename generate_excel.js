const XLSX = require('xlsx');
const path = require('path');

// 10 sample rows covering all 10 job groups, 5 learner languages, 4 skills, and 5 question types
const data = [
  {
    "ID": "Q_HEALTH_001",
    "Learner Language": "Indonesian",
    "Level": "N3",
    "Job Group": "Healthcare",
    "Skill": "Speaking",
    "Question Type": "Speech Repetition",
    "Grammar Point": "〜ところです",
    "Scenario Context": "Membantu lansia (user) berpindah dari tempat tidur ke kursi roda.",
    "Prompt Instruction": "Dengarkan kalimat bergaris bawah lalu ucapkan ulang dengan lafal yang benar.",
    "Learning Content (Japanese)": "山田さん、今車椅子を準備する【ところです】ので、お待ちください。",
    "Options / Pairs / Blocks": "",
    "Correct Answer": "今車椅子を準備するところですので、お待ちください。",
    "Translation": "Tuan Yamada, sekarang saya baru akan menyiapkan kursi rodanya, mohon tunggu.",
    "Explanation": "Tata bahasa '〜ところです' menunjukkan suatu tindakan baru akan dimulai.",
    "Vocabulary List": "車椅子 (kurumaisu) = kursi roda | 準備 (junbi) = persiapan"
  },
  {
    "ID": "Q_HOSP_002",
    "Learner Language": "Arabic",
    "Level": "N2",
    "Job Group": "Hospitality & Food",
    "Skill": "Reading",
    "Question Type": "Multiple Choice",
    "Grammar Point": "〜に際して",
    "Scenario Context": "كتيب إجراءات استقبال كبار الشخصيات (VIP) في الفندق.",
    "Prompt Instruction": "اقرأ النص التالي واختر الإجابة الصحيحة للسؤال.",
    "Learning Content (Japanese)": "VIP客のチェックインに際しては、事前に専用デスクをフロント横に設置し、スムーズに対応すること。\n\n質問：VIP客が来るときに何を準備しますか？",
    "Options / Pairs / Blocks": "A. 通常フロントで対応する | B. フロントの横に専用デスクを設置する | C. ロビーでお迎えする",
    "Correct Answer": "B",
    "Translation": "عند تسجيل وصول كبار الشخصيات، يجب إعداد مكتب مخصص بجوار مكتب الاستقبال مسبقًا لضمان التعامل السلس.",
    "Explanation": "تستخدم القاعدة '〜に際して' للتعبير عن الاستعدادات عند البدء بحدث رسمي هام.",
    "Vocabulary List": "専用デスク (sen'you desuku) = مكتب مخصص | 設置 (secchi) = تركيب/إعداد"
  },
  {
    "ID": "Q_MANUF_003",
    "Learner Language": "Mandarin",
    "Level": "N3",
    "Job Group": "Manufacturing",
    "Skill": "Listening",
    "Question Type": "True/False",
    "Grammar Point": "〜ておく",
    "Scenario Context": "在夜班开始前，领班用日语说明对机器的检查准备。",
    "Prompt Instruction": "听录音，判断以下陈述是否正确（正确填 T，错误填 F）。",
    "Learning Content (Japanese)": "「夜間作業を始める前に、必ず機械Aの動きを確認しておいてください。」\n\n陈述：作业开始前必须检查机器A的动作确认。",
    "Options / Pairs / Blocks": "T | F",
    "Correct Answer": "T",
    "Translation": "「在开始夜间作业之前，请务必提前确认机器A的运转情况。」\n\n陈述：开始作业前必须确认机器A的运转。",
    "Explanation": "“〜ておく” 表示提前做好某种准备工作。",
    "Vocabulary List": "夜間作業 (yakan sagyou) = 夜班工作 | 動作確認 (dousha kakunin) = 动作/运转确认"
  },
  {
    "ID": "Q_CONST_004",
    "Learner Language": "Korean",
    "Level": "N3",
    "Job Group": "Construction & Engineering",
    "Skill": "Writing",
    "Question Type": "Matching",
    "Grammar Point": "〜ようにする",
    "Scenario Context": "공사 현장에서의 안전 관리 및 비계 작업 수칙.",
    "Prompt Instruction": "일본어 안전 표지와 한국어 뜻을 바르게 연결하십시오.",
    "Learning Content (Japanese)": "Matching 안전 표지",
    "Options / Pairs / Blocks": "足場注意 (ashiba chuui) = 비계 주의 | 頭上注意 (zujou chuui) = 머리 위 주의 | 安全第一 (anzen daiichi) = 안전 제일",
    "Correct Answer": "足場注意=비계 주의 | 頭上注意=머리 위 주의 | 安全第一=안전 제일",
    "Translation": "비계 주의, 머리 위 주의, 안전 제일 수칙 매칭.",
    "Explanation": "건설 현장의 한자 표지판과 안전 관련 어휘 매칭 훈련.",
    "Vocabulary List": "足場 (ashiba) = 비계/발판 | 頭上 (zujou) = 머리 위 | 注意 (chuui) = 주의"
  },
  {
    "ID": "Q_AGRI_005",
    "Learner Language": "English",
    "Level": "N3",
    "Job Group": "Agriculture",
    "Skill": "Writing",
    "Question Type": "Short Answer",
    "Grammar Point": "〜ながら",
    "Scenario Context": "Harvesting apples in an orchard while checking for spots or damage.",
    "Prompt Instruction": "Fill in the blank with the correct form of the verb to say 'while checking'.",
    "Learning Content (Japanese)": "りんごは、傷がないか【確認し】ながら、収穫してください。",
    "Options / Pairs / Blocks": "Input: [確認し]",
    "Correct Answer": "確認し",
    "Translation": "Please harvest the apples while checking if there are any damages.",
    "Explanation": "The grammar '~nagara' attaches to the verb Stem (Masu-form minus masu). For 'kakunin suru', the stem is 'kakunishi'.",
    "Vocabulary List": "収穫 (shuukaku) = harvest | 傷 (kizu) = damage/scratch"
  },
  {
    "ID": "Q_ADMIN_006",
    "Learner Language": "Indonesian",
    "Level": "N2",
    "Job Group": "Administration & Office",
    "Skill": "Reading",
    "Question Type": "Matching",
    "Grammar Point": "〜について",
    "Scenario Context": "Membaca email undangan rapat koordinasi departemen.",
    "Prompt Instruction": "Jodohkan istilah bisnis Jepang berikut dengan artinya dalam Bahasa Indonesia.",
    "Learning Content (Japanese)": "E-mail Rapat Bisnis",
    "Options / Pairs / Blocks": "日程調整 (nittei chousei) = Penyesuaian jadwal | 議題 (gidai) = Agenda rapat | 共有 (kyouyuu) = Berbagi informasi",
    "Correct Answer": "日程調整=Penyesuaian jadwal | 議題=Agenda rapat | 共有=Berbagi informasi",
    "Translation": "Pencocokan istilah bisnis penting dalam email rapat kantor.",
    "Explanation": "Menguji pemahaman istilah kantor level N2 yang sering muncul dalam email bisnis.",
    "Vocabulary List": "日程調整 (nittei chousei) = penyesuaian jadwal | 議題 (gidai) = agenda rapat"
  },
  {
    "ID": "Q_CLEAN_007",
    "Learner Language": "Arabic",
    "Level": "N3",
    "Job Group": "Cleaning & Maintenance",
    "Skill": "Listening",
    "Question Type": "Multiple Choice",
    "Grammar Point": "〜なければならない",
    "Scenario Context": "تعليمات لخلط المحاليل الكيميائية للتنظيف.",
    "Prompt Instruction": "استمع إلى المقطع الصوتي واختر الخيار الصحيح للسلامة.",
    "Learning Content (Japanese)": "「洗剤を混ぜる時は、必ず換気扇を回さなければなりません。」\n\n質問：洗剤を混ぜる時に何をしなければなりませんか？",
    "Options / Pairs / Blocks": "A. マスクを外す | B. 換気扇を回す | C. 窓を閉める",
    "Correct Answer": "B",
    "Translation": "「عند خلط المنظفات، يجب عليك دائمًا تشغيل مروحة التهوية (الشفاط).」\n\nالسؤال: ماذا يجب أن تفعل عند خلط المنظفات؟",
    "Explanation": "تفيد القاعدة '〜なければならない' بوجوب أو إلزامية القيام بالفعل.",
    "Vocabulary List": "換気扇 (kankisen) = مروحة تهوية/شفاط | 混ぜる (mazeru) = يخلط/يمزج"
  },
  {
    "ID": "Q_SALES_008",
    "Learner Language": "Mandarin",
    "Level": "N2",
    "Job Group": "Sales & Retail",
    "Skill": "Speaking",
    "Question Type": "Speech Repetition",
    "Grammar Point": "〜せていただく",
    "Scenario Context": "店员向顾客解释需要确认小票才能退货。",
    "Prompt Instruction": "请在听完录音后，用正确的敬语发音朗读下划线部分。",
    "Learning Content (Japanese)": "恐れ入りますが、商品の返品はレシートを確認【させていただきます】。",
    "Options / Pairs / Blocks": "",
    "Correct Answer": "させていただきます",
    "Translation": "非常抱歉，商品的退货需要由我方确认收据，敬请谅解。",
    "Explanation": "“〜せていただく” 是谦让语，表示允许我方做某事，在服务业接待顾客时极为常用。",
    "Vocabulary List": "返品 (henpin) = 退货 | レシート (reshiito) = 收据/小票"
  },
  {
    "ID": "Q_TRANS_009",
    "Learner Language": "Korean",
    "Level": "N2",
    "Job Group": "Transportation",
    "Skill": "Reading",
    "Question Type": "True/False",
    "Grammar Point": "〜おそれがある",
    "Scenario Context": "폭설로 인한 버스 운전사 안전 경고 고지.",
    "Prompt Instruction": "글을 읽고 다음 진술의 진위(T/F)를 판단하십시오.",
    "Learning Content (Japanese)": "「路面が凍結しているため、スリップするおそれがあります。スピードを落として運転してください。」\n\n陈述：路面이 얼어서 미끄러질 위험이 있다.",
    "Options / Pairs / Blocks": "T | F",
    "Correct Answer": "T",
    "Translation": "「노면이 얼어붙어 미끄러질 우려가 있습니다. 속도를 줄여 운전해 주십시오.」\n\n진술: 노면이 얼어 미끄러질 위험이 있다.",
    "Explanation": "“〜おそれがある”는 '(부정적인 일이) 일어날 우려가 있다/위험이 있다'라는 뜻으로 안전 지침에 자주 사용됩니다.",
    "Vocabulary List": "凍結 (touketsu) = 동결/얼어붙음 | スリップ (surippu) = 미끄러짐 | おそれがある (osore ga aru) = 우려가 있다"
  },
  {
    "ID": "Q_OTHER_010",
    "Learner Language": "English",
    "Level": "N3",
    "Job Group": "Other",
    "Skill": "Writing",
    "Question Type": "Short Answer",
    "Grammar Point": "〜までに",
    "Scenario Context": "Logging the temperature of the fish freezer before leaving the facility.",
    "Prompt Instruction": "Fill in the blank with the correct particle meaning 'by/no later than'.",
    "Learning Content (Japanese)": "冷凍庫の温度確認は、退勤する時間【までに】行ってください。",
    "Options / Pairs / Blocks": "Input: [までに]",
    "Correct Answer": "までに",
    "Translation": "Please perform the freezer temperature check by the time you leave work.",
    "Explanation": "The particle 'made ni' means 'by/no later than a specific limit', distinct from 'made' (until).",
    "Vocabulary List": "冷凍庫 (reitouko) = freezer | 退勤 (taikin) = leaving work"
  }
];

// Create Workbook
const wb = XLSX.utils.book_new();

// Convert JSON to Worksheet
const ws = XLSX.utils.json_to_sheet(data);

// Define Columns Width
const wscols = [
  {wch: 15}, // ID
  {wch: 15}, // Learner Language
  {wch: 8},  // Level
  {wch: 25}, // Job Group
  {wch: 12}, // Skill
  {wch: 18}, // Question Type
  {wch: 15}, // Grammar Point
  {wch: 40}, // Scenario Context
  {wch: 40}, // Prompt Instruction
  {wch: 50}, // Learning Content (Japanese)
  {wch: 50}, // Options / Pairs / Blocks
  {wch: 25}, // Correct Answer
  {wch: 45}, // Translation
  {wch: 45}, // Explanation
  {wch: 45}  // Vocabulary List
];
ws['!cols'] = wscols;

// Append Worksheet to Workbook
XLSX.utils.book_append_sheet(wb, ws, "Multilingual Questions");

// Save File
const filename = path.join(__dirname, 'multilingual_questions_template.xlsx');
XLSX.writeFile(wb, filename);

console.log("Successfully created: " + filename);
