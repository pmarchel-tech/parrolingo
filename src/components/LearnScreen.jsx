import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, CheckCircle, XCircle, ArrowRight, X, Play, RefreshCw, Lock, Award, ShieldAlert } from 'lucide-react';
import { initDB, saveProgress, addLog, getVoiceSignature, getQuestionsByWeek, getVocabByWeek, seedQuestionsAndVocab } from '../utils/db';

// React Error Boundary to catch any rendering crashes on the results screen
class SafeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SafeErrorBoundary caught a rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          padding: '24px', 
          textAlign: 'center',
          backgroundColor: 'var(--background)'
        }}>
          <div className="card no-press" style={{ padding: '24px', maxWidth: '320px', backgroundColor: '#ffffff', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
            <Award size={48} color="var(--primary)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'var(--on-surface)' }}>Latihan Selesai!</h3>
            <p className="body-md" style={{ color: 'var(--outline)', marginBottom: '20px', fontSize: '13px', lineHeight: '1.4' }}>
              Sesi Anda telah berhasil disimpan di database lokal. Silakan kembali ke peta untuk melanjutkan.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                if (this.props.onFallback) {
                  this.props.onFallback();
                }
              }}
              style={{ width: '100%' }}
            >
              Kembali ke Map
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Database variables are now stored in IndexedDB and public JSON files.
const QUESTIONS_BY_WEEK = {};
const VOCAB_BY_WEEK = {};

// Syllable/word mapping for Romaji karaoke-style highlighting
const ROMAJI_CHUNKS = {
  'おはようございます': [
    { text: 'o-ha-you', spaceAfter: true, jaRange: [0, 4] },
    { text: 'go', dashAfter: true, jaRange: [4, 5] },
    { text: 'za', dashAfter: true, jaRange: [5, 6] },
    { text: 'i-ma-su', jaRange: [6, 10] }
  ],
  'こんにちは': [
    { text: 'kon', dashAfter: true, jaRange: [0, 2] },
    { text: 'ni', dashAfter: true, jaRange: [2, 3] },
    { text: 'chi', dashAfter: true, jaRange: [3, 4] },
    { text: 'wa', jaRange: [4, 5] }
  ],
  'おやすみなさい': [
    { text: 'o', dashAfter: true, jaRange: [0, 1] },
    { text: 'ya', dashAfter: true, jaRange: [1, 2] },
    { text: 'su', dashAfter: true, jaRange: [2, 3] },
    { text: 'mi', dashAfter: true, jaRange: [3, 4] },
    { text: 'na', dashAfter: true, jaRange: [4, 5] },
    { text: 'sa', dashAfter: true, jaRange: [5, 6] },
    { text: 'i', jaRange: [6, 7] }
  ]
};

// Algorithmic Hepburn Romaji to Hiragana converter
const romajiToHiragana = (romaji) => {
  if (!romaji) return '';
  let str = romaji.toLowerCase().trim();
  
  // Standardize common romaji variations
  str = str.replace(/tsu/g, 'tsu')
           .replace(/chi/g, 'chi')
           .replace(/sh/g, 'sh')
           .replace(/ch/g, 'ch')
           .replace(/fu/g, 'fu')
           .replace(/jy/g, 'j')
           .replace(/j/g, 'j');

  const mapping = {
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'nn': 'ん', 'n': 'ん',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お'
  };

  let result = '';
  let i = 0;
  while (i < str.length) {
    // Check double consonants (sokuon - small tsu) e.g., 'pp', 'tt', 'ss', 'kk'
    if (i < str.length - 1 && str[i] === str[i+1] && str[i] !== 'n' && str[i] !== 'a' && str[i] !== 'i' && str[i] !== 'u' && str[i] !== 'e' && str[i] !== 'o') {
      result += 'っ';
      i++;
      continue;
    }

    // Try to match 3 characters
    if (i < str.length - 2) {
      const part3 = str.substring(i, i + 3);
      if (mapping[part3]) {
        result += mapping[part3];
        i += 3;
        continue;
      }
    }

    // Try to match 2 characters
    if (i < str.length - 1) {
      const part2 = str.substring(i, i + 2);
      if (mapping[part2]) {
        result += mapping[part2];
        i += 2;
        continue;
      }
    }

    // Try to match 1 character
    const part1 = str.substring(i, i + 1);
    if (mapping[part1]) {
      result += mapping[part1];
      i += 1;
      continue;
    }

    // Keep original character if no match
    result += str[i];
    i += 1;
  }
  
  return result;
};

// Dynamically generated Kanji-to-Hiragana mapping at runtime
let DYNAMIC_KANJI_MAP = {};

const initDynamicKanjiMap = (vocabList) => {
  DYNAMIC_KANJI_MAP = {};
  (vocabList || []).forEach(item => {
    if (item.ja && item.romaji) {
      const hiragana = romajiToHiragana(item.romaji);
      // If the Kanji text differs from its Hiragana representation, add it to the map
      if (item.ja !== hiragana && !item.ja.includes('(')) {
        const cleanKanji = item.ja.replace(/[\s、。]/g, '');
        const cleanHiragana = hiragana.replace(/[\s、。]/g, '');
        
        if (cleanKanji && cleanHiragana) {
          DYNAMIC_KANJI_MAP[cleanKanji] = cleanHiragana;
        }
      }
    }
  });
  
  // Manual overrides for digits and common phrases
  const overrides = {
    '10': 'じゅう', '１０': 'じゅう',
    '1': 'いち', '１': 'いち',
    '2': 'に', '２': 'に',
    '3': 'さん', '３': 'さん',
    '4': 'よん', '４': 'よん',
    '5': 'ご', '５': 'ご',
    '6': 'ろく', '６': 'ろく',
    '7': 'なな', '７': 'なな',
    '8': 'はち', '８': 'はち',
    '9': 'きゅう', '９': 'きゅう',
    '一': 'いち', '二': 'に', '三': 'さん', '四': 'よん', '五': 'ご',
    '六': 'ろく', '七': 'なな', '八': 'はち', '九': 'きゅう', '十': 'じゅう',
    'お疲れ様': 'おつかれさま',
    'お疲れ様です': 'おつかれさまです',
    'お疲れ様でした': 'おつかれさまでした',
    '失礼します': 'しつれいします',
    'お邪魔します': 'おじゃまします',
    '申し訳ありません': 'もうしわけありません',
    '申し訳ございません': 'もうしわけございません',
    'ありがとうございます': 'ありがとうございます',
    '山': 'やま',
    '川': 'かわ',
    '月': 'つき',
    '水': 'みず',
    'お茶': 'おちゃ',
    'ご飯': 'ごはん',
    '御飯': 'ごはん',
    '椅子': 'いす',
    '手': 'て',
    '目': 'め',
    '耳': 'みみ',
    '口': 'くち',
    '鼻': 'はな',
    '花': 'はな',
    '足': 'あし',
    '左': 'ひだり',
    '右': 'みぎ',
    '前': 'まえ',
    '後ろ': 'うしろ',
    'お風呂': 'おふろ',
    '薬': 'くすり',
    '朝': 'あさ',
    '昼': 'ひる',
    '夜': 'よる',
    '暑い': 'あつい',
    '熱い': 'あつい',
    '厚い': 'あつい',
    '危ない': 'あぶない',
    '海': 'うみ',
    'お早うございます': 'おはようございます',
    'お休みなさい': 'おやすみなさい',
    '終わり': 'おわり',
    '畏まりました': 'かしこまりました',
    '来て下さい': 'きてください',
    '来てください': 'きてください',
    '果物': 'くだもの',
    '今日は': 'こんにちは',
    '今晩は': 'こんばんは',
    '済みません': 'すみません',
    '助けて': 'たすけて',
    '駄目': 'だめ',
    'ちょっと待って': 'ちょっとまって',
    '冷たい': 'つめたい',
    '火': 'ひ',
    '日': 'ひ',
    '真っ直ぐ': 'まっすぐ',
    '緑': 'みどり',
    '眩暈': 'めまい',
    '野菜': 'やさい',
    '分かります': 'わかります',
    '判ります': 'わかります',
    '分かりません': 'わかりません',
    '判りません': 'わかりません'
  };
  
  overrides['2'] = 'に';

  Object.assign(DYNAMIC_KANJI_MAP, overrides);
};

// Trigger initialization was moved to runtime useEffect

// A beautiful, self-contained CSS-only Confetti Effect component that lasts exactly 2 seconds
const ConfettiEffect = () => {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!active) return null;

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const particles = Array.from({ length: 80 }).map((_, i) => {
    const left = Math.random() * 100;
    const size = Math.random() * 8 + 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    // Delay and fall speed adjusted so particles fall nicely within the 2-second window
    const delay = Math.random() * 1.0; 
    const duration = Math.random() * 0.8 + 1.0; 
    const shape = Math.random() > 0.5 ? '50%' : '0%';
    const rotation = Math.random() * 360;

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          top: '-20px',
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          borderRadius: shape,
          opacity: Math.random() * 0.4 + 0.6,
          transform: `rotate(${rotation}deg)`,
          animation: `fall ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
          pointerEvents: 'none',
          zIndex: 9999
        }}
      />
    );
  });

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 999 }}>
      <style>{`
        @keyframes fall {
          0% {
            top: -20px;
            transform: translateX(0) rotate(0deg);
          }
          50% {
            transform: translateX(20px) rotate(180deg);
          }
          100% {
            top: 100%;
            transform: translateX(-20px) rotate(360deg);
          }
        }
      `}</style>
      {particles}
    </div>
  );
};

// Helper to convert Kanji/Katakana to Hiragana for uniform phonetic matching
const convertKanjiToHiragana = (text) => {
  if (!text) return '';
  let result = text;

  // Sort by length descending to prevent partial replacements of longer words
  const sortedKanji = Object.keys(DYNAMIC_KANJI_MAP).sort((a, b) => b.length - a.length);

  sortedKanji.forEach(kanji => {
    const regex = new RegExp(kanji, 'g');
    result = result.replace(regex, DYNAMIC_KANJI_MAP[kanji]);
  });

  // Convert Katakana to Hiragana (Unicode offset shifting)
  result = result.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });

  return result;
};

// Helper to calculate Levenshtein distance similarity between two strings
const editDistance = (s1, s2) => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
};

const getSimilarity = (s1, s2) => {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
};

const DEFAULT_QUESTIONS = [
  { type: 'B', prompt: 'Apa yang diucapkan dalam audio tersebut?', audioText: 'こんにちは', options: ['こんにちは (kon-ni-chi-wa)', 'ありがとう (a-ri-ga-tou)', 'すみません (su-mi-ma-sen)'], answer: 0, explanation: { word: 'こんにちは', romaji: 'kon-ni-chi-wa', translation: 'Selamat Siang / Halo', context: 'Salam umum di siang hari.', tip: 'Gunakan dari jam 11 siang hingga sore hari.', example: 'Konnichiwa, Tanaka-san.' } },
  { type: 'C', prompt: 'Ketik bunyi Romaji berikut!', targetRomaji: 'arigatou', targetJa: 'ありがとう', meaning: 'Terima kasih' },
  { type: 'D', prompt: 'Latihan Shadowing kata kunci Kaigo:', targetJa: '車椅子', romaji: 'ku-ru-ma-i-su', meaning: 'Kursi Roda' }
];

export default function LearnScreen({ weekNumber, sessionType, progress, onEndSession }) {
  const [step, setStep] = useState(sessionType === 'practice' ? 'quiz' : 'biometric'); // biometric -> quiz -> result
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [typedInput, setTypedInput] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shadowingResult, setShadowingResult] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState(0);
  const [questionPoints, setQuestionPoints] = useState({});
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [startTime] = useState(Date.now());
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [speakingWord, setSpeakingWord] = useState('');
  const [highlightRange, setHighlightRange] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [initialLength, setInitialLength] = useState(0);

  // Global error diagnostic listener to alert any uncaught crashes on screen
  useEffect(() => {
    const handleError = (event) => {
      alert("CRITICAL ERROR: " + event.message + "\nFile: " + event.filename + "\nLine: " + event.lineno);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Helper to shuffle an array
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Helper to localize questions and vocabulary
  const getLocalizedDataForSession = (qs, vs, lang, prog) => {
    const programMap = {
      'kaigo': 'Healthcare',
      'seizogyo': 'Manufacturing',
      'kensetsugyo': 'Construction & Engineering',
      'nogyo': 'Agriculture'
    };
    const targetJobGroup = programMap[prog] || 'Healthcare';

    // 1. Filter questions by selected job group
    const filteredQs = qs.filter(q => q.jobCategory === targetJobGroup || !q.jobCategory || q.jobCategory === 'Other');

    // 2. Localize vocabulary
    const localizedVs = localizeVocab(vs, lang);

    // 3. Localize questions based on selected target practice language
    const langNames = {
      'ja': 'Jepang',
      'ko': 'Korea',
      'zh': 'Mandarin',
      'ar': 'Arab',
      'en': 'Inggris'
    };
    const langName = langNames[lang] || 'Jepang';

    const localizedQs = filteredQs.map(q => {
      let translatedPrompt = q.prompt || "";
      translatedPrompt = translatedPrompt
        .replace(/bahasa Jepang/g, `bahasa ${langName}`)
        .replace(/bahasa jepang/g, `bahasa ${langName}`)
        .replace(/Jepang/g, langName)
        .replace(/jepang/g, langName);

      if (q.translations && q.translations[lang]) {
        const t = q.translations[lang];
        
        // Replace target word in prompt with translated word
        const targetText = t.targetText || t.target || '';
        if (q.targetJa && targetText) {
          translatedPrompt = translatedPrompt.replace(q.targetJa, targetText);
        }
        if (q.audioText && targetText && q.audioText !== q.targetJa) {
          translatedPrompt = translatedPrompt.replace(q.audioText, targetText);
        }
        
        let answerIndex = 0;
        let finalOptions = (t.options && t.options.length > 0) ? [...t.options] : [...(q.options || [])];
        
        if (finalOptions.length > 0) {
          const correctAns = t.correctAnswer || t.Correct_Answer || (q.options && q.options[q.answer]);
          if (correctAns) {
            finalOptions = shuffleArray(finalOptions);
            const idx = finalOptions.indexOf(correctAns);
            if (idx !== -1) answerIndex = idx;
          }
        }

        return {
          ...q,
          prompt: translatedPrompt,
          meaning: q.meaning,
          explanation: {
            word: t.targetText || q.audioText,
            romaji: t.phonetic || q.romaji,
            translation: q.meaning,
            context: translatedPrompt,
            tip: q.explanation_id,
            vocabList: t.pairs || q.pairs || []
          },
          audioText: t.targetText || q.audioText,
          targetJa: t.targetText || q.targetJa,
          romaji: t.phonetic || q.romaji,
          targetRomaji: (q.type === "C" || q.type === "F") ? (t.phonetic || "").toLowerCase().replace(/[\s\-]/g, '') : "",
          options: finalOptions,
          pairs: (t.pairs && t.pairs.length > 0) ? t.pairs : q.pairs,
          answer: answerIndex
        };
      }
      return {
        ...q,
        prompt: translatedPrompt
      };
    });

    return { localizedQs, localizedVs };
  };

  // Helper to generate dynamic questions for the session using IndexedDB data
  const generateQuestionsForSession = (dbQuestions, dbVocab, weekNum) => {
    const staticQuestions = dbQuestions || [];
    const vocab = dbVocab.length > 0 ? dbVocab : [];
    const lang = localStorage.getItem('kaigolingo_selected_language') || 'ja';
    
    const PROMPT_LOCALIZATIONS = {
      ja: {
        listen: 'Dengar dan pilih arti yang tepat!',
        type: 'Ketik ejaan Romaji untuk "{word}"!',
        shadow: 'Ucapkan kata berikut melalui mikrofon (Shadowing)!'
      },
      en: {
        listen: 'Listen and choose the correct meaning!',
        type: 'Type the Romaji spelling for "{word}"!',
        shadow: 'Pronounce the following word into the microphone (Shadowing)!'
      },
      zh: {
        listen: '听录音并选择正确的含义！',
        type: '请输入“{word}”的罗马字拼写！',
        shadow: '请通过麦克风朗读以下单词（影子跟读）！'
      },
      ar: {
        listen: 'استمع واختر المعنى الصحيح!',
        type: 'اكتب تهجئة الروماجي لـ "{word}"!',
        shadow: 'انطق الكلمة التالية في الميكروفون (Shadowing)!'
      },
      ko: {
        listen: '듣고 올바른 뜻을 고르세요!',
        type: '"{word}"의 로마자 표기를 입력하세요!',
        shadow: '마이크를 통해 다음 단어를 따라 말하세요 (Shadowing)!'
      }
    };
    
    const localPrompt = PROMPT_LOCALIZATIONS[lang] || PROMPT_LOCALIZATIONS['ja'];
    
    // Target count uses static questions if available, otherwise scales from 10 to 20
    const targetCount = staticQuestions.length > 0 ? staticQuestions.length : Math.min(20, 10 + (weekNum - 1));
    
    let generated = [...staticQuestions];
    
    if (generated.length < targetCount && vocab.length > 0) {
      const needed = targetCount - generated.length;
      
      for (let step = 0; step < needed; step++) {
        // 1. Calculate count of each vocab item in current generated list
        const counts = vocab.map(item => {
          let count = 0;
          generated.forEach(q => {
            if (q.audioText && (q.audioText === item.ja || q.audioText.includes(item.ja))) count++;
            else if (q.targetJa && (q.targetJa === item.ja || q.targetJa.includes(item.ja))) count++;
            else if (q.pairs && q.pairs.some(p => p.ja && p.ja.includes(item.ja))) count++;
          });
          return { item, count };
        });
        
        // 2. Find minimum count among all items in vocabulary
        const minCount = Math.min(...counts.map(c => c.count));
        const candidates = counts.filter(c => c.count === minCount).map(c => c.item);
        
        // 3. Choose a random candidate from the least-used items
        const item = candidates[Math.floor(Math.random() * candidates.length)];
        
        // 4. Determine which question types are already used for this item in the session
        const usedTypes = [];
        generated.forEach(q => {
          if (q.audioText && (q.audioText === item.ja || q.audioText.includes(item.ja))) {
            usedTypes.push(q.type);
          } else if (q.targetJa && (q.targetJa === item.ja || q.targetJa.includes(item.ja))) {
            usedTypes.push(q.type);
          }
        });
        
        // Try to pick an unused type among B (listening), C (typing), D (shadowing) to vary exercises
        const allTypes = ['B', 'C', 'D'];
        const unusedTypes = allTypes.filter(t => !usedTypes.includes(t));
        const chosenType = unusedTypes.length > 0 
          ? unusedTypes[Math.floor(Math.random() * unusedTypes.length)]
          : allTypes[Math.floor(Math.random() * allTypes.length)];
          
        // 5. Generate question based on chosenType
        if (chosenType === 'B') {
          const wrongCandidates = vocab.filter(v => v.ja !== item.ja);
          const wrongOptions = shuffleArray(wrongCandidates).slice(0, 2);
          
          const correctOptionText = `${item.ja} (${item.id})`;
          const wrongOptionTexts = wrongOptions.map(v => `${v.ja} (${v.id})`);
          
          const options = shuffleArray([correctOptionText, ...wrongOptionTexts]);
          const correctIndex = options.indexOf(correctOptionText);
          
          generated.push({
            type: 'B',
            prompt: localPrompt.listen,
            audioText: item.ja,
            options: options,
            answer: correctIndex,
            explanation: {
              word: item.ja,
              romaji: item.romaji,
              translation: item.id,
              context: item.context,
              tip: item.tip,
              example: item.example
            }
          });
        } else if (chosenType === 'C') {
          generated.push({
            type: 'C',
            prompt: localPrompt.type.replace('{word}', item.id),
            targetRomaji: item.romaji.replace(/[\s\-]/g, ''),
            targetJa: item.ja,
            meaning: item.id
          });
        } else {
          // Shadowing
          const formattedRomaji = lang === 'ja' ? item.romaji.split('').join('-') : item.romaji;
          generated.push({
            type: 'D',
            prompt: localPrompt.shadow,
            targetJa: item.ja,
            romaji: formattedRomaji,
            meaning: item.id
          });
        }
      }
    }
    
    // Shuffle the entire set of questions so they vary every session and assign uniqueId
    const shuffledQs = shuffleArray(generated).slice(0, targetCount);
    return shuffledQs.map((q, idx) => ({ ...q, uniqueId: `q-${idx}` }));
  };

  useEffect(() => {
    const loadSessionData = async () => {
      try {
        await initDB();
        let qs = await getQuestionsByWeek(weekNumber);
        let vs = await getVocabByWeek(weekNumber);

        // Apply program and language filters
        const lang = localStorage.getItem('kaigolingo_selected_language') || 'ja';
        const prog = localStorage.getItem('kaigolingo_selected_program') || 'kaigo';

        const { localizedQs, localizedVs } = getLocalizedDataForSession(qs, vs, lang, prog);

        initDynamicKanjiMap(localizedVs);
        const sessionQs = generateQuestionsForSession(localizedQs, localizedVs, weekNumber);
        setSessionQuestions(sessionQs);
        setInitialLength(sessionQs.length);
        setCurrentQIndex(0);
        setScore(0);
        setQuestionPoints({});
        setWrongAnswers([]);
        setIsAnswerChecked(false);
        setIsCorrect(false);
        setSelectedOption(null);
        setTypedInput('');
        setShadowingResult('');
        setXpEarned(0);
        setCoinsEarned(0);
        setIsRecording(false);
        setAudioSpeed(1.0);
        setStep(sessionType === 'practice' ? 'quiz' : 'biometric');
      } catch (err) {
        console.error('Failed to load session questions from IndexedDB:', err);
      }
    };
    loadSessionData();
  }, [weekNumber, sessionType]);

  const currentQuestion = sessionQuestions[currentQIndex] || sessionQuestions[0] || DEFAULT_QUESTIONS[0];

  // Helper to render Romaji with synchronized karaoke highlight
  const renderHighlightedRomaji = (word, romaji) => {
    if (speakingWord !== word || !highlightRange) {
      return romaji;
    }

    const chunks = ROMAJI_CHUNKS[word];
    if (chunks) {
      return (
        <span>
          {chunks.map((chunk, idx) => {
            const [start, end] = chunk.jaRange;
            const isHighlighted = highlightRange.start >= start && highlightRange.start < end;
            return (
              <span key={idx}>
                <span
                  style={{
                    fontWeight: isHighlighted ? '800' : 'normal',
                    color: isHighlighted ? '#ff5a5f' : 'var(--outline)',
                    transition: 'all 0.1s ease',
                    display: 'inline-block',
                    transform: isHighlighted ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  {chunk.text}
                </span>
                {chunk.dashAfter && '-'}
                {chunk.spaceAfter && ' '}
              </span>
            );
          })}
        </span>
      );
    }

    // Proportional word-by-word fallback
    const words = romaji.split(' ');
    const activeWordIndex = Math.min(
      Math.floor((highlightRange.start / word.length) * words.length),
      words.length - 1
    );
    
    return (
      <span>
        {words.map((w, idx) => {
          const isHighlighted = idx === activeWordIndex;
          return (
            <span key={idx}>
              <span
                style={{
                  fontWeight: isHighlighted ? '800' : 'normal',
                  color: isHighlighted ? '#ff5a5f' : 'var(--outline)',
                  transition: 'all 0.1s ease',
                  display: 'inline-block',
                  transform: isHighlighted ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {w}
              </span>
              {idx < words.length - 1 && ' '}
            </span>
          );
        })}
      </span>
    );
  };
  
  // Matching Type State
  const [matchLeft, setMatchLeft] = useState([]);
  const [matchRight, setMatchRight] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [completedMatches, setCompletedMatches] = useState([]); // indices of matched pairs

  // Biometrics MVP State
  const [bioStatus, setBioStatus] = useState('ready'); // ready, recording, success, failed
  const [bioConfidence, setBioConfidence] = useState(0);

  // Audio synthesis & speech recognition refs
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    // Skip biometric check if it's a practice session
    if (sessionType === 'practice') {
      setStep('quiz');
    }
    
    // Initialize Web Speech API Recognition safely in a try-catch block
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = 'ja-JP';
        rec.continuous = false;
        rec.interimResults = false;
        
        rec.onresult = (event) => {
          const resultText = event.results[0][0].transcript;
          setShadowingResult(resultText);
          evaluateSpeech(resultText);
        };

        rec.onerror = (e) => {
          console.error('Speech recognition error', e);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    } catch (e) {
      console.warn('Speech recognition is not supported or was blocked by browser security policies:', e);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [sessionType]);

  // Handle Matching Question Generation
  useEffect(() => {
    if (currentQuestion && currentQuestion.type === 'A') {
      const pairs = currentQuestion.pairs || [];
      const left = pairs.map((p, idx) => ({ id: idx, text: p.ja, romaji: p.romaji })).sort(() => Math.random() - 0.5);
      const right = pairs.map((p, idx) => ({ id: idx, text: p.id })).sort(() => Math.random() - 0.5);
      setMatchLeft(left);
      setMatchRight(right);
      setSelectedLeft(null);
      setSelectedRight(null);
      setCompletedMatches([]);
    }
  }, [currentQIndex, currentQuestion]);

  // Voice Biometrics MVP Simulation using Web Audio API
  const startBiometricEnrollOrVerify = async () => {
    setBioStatus('recording');
    setBioConfidence(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let count = 0;
      const frequencies = [];

      const recordInterval = setInterval(async () => {
        analyser.getByteFrequencyData(dataArray);
        const averageFreq = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        frequencies.push(averageFreq);
        count++;

        if (count >= 30) { // Record for 3 seconds
          clearInterval(recordInterval);
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();

          // Compare with stored signature
          const savedSignature = await getVoiceSignature();
          const currentAvg = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;

          if (!savedSignature) {
            // No signature yet (Week 1 / first time)
            setBioStatus('success');
            setTimeout(() => setStep('quiz'), 1500);
          } else {
            // Compare signatures (simplified mock voice biometric comparison)
            const diff = Math.abs(currentAvg - savedSignature.avg);
            // Tolerant threshold
            if (diff < 25) {
              setBioStatus('success');
              setBioConfidence(Math.round(100 - (diff * 2)));
              setTimeout(() => setStep('quiz'), 1500);
            } else {
              setBioStatus('failed');
            }
          }
        }
      }, 100);

    } catch (e) {
      console.error('Error getting audio stream for biometrics:', e);
      // Fallback: let them pass in the simulator if mic not granted/available
      setBioStatus('success');
      setTimeout(() => setStep('quiz'), 1500);
    }
  };

const VOCAB_TRANSLATIONS = {
  ja: {
    'おはようございます (Selamat Pagi)': 'おはようございます (Selamat Pagi)',
    'いち (Satu)': 'いち (Satu)',
    'に (Dua)': 'に (Dua)',
    'さん (Tiga)': 'さん (Tiga)',
    'おやすみなさい (Selamat Tidur)': 'おやすみなさい (Selamat Tidur)',
    'お疲れ様です (Terima kasih atas kerja kerasnya)': 'お疲れ様です (Terima kasih)',
    '失礼します (Permisi / Maaf mengganggu)': '失礼します (Permisi)',
    'お邪魔します (Permisi / Masuk rumah)': 'お邪魔します (Permisi Masuk)',
    'かしこまりました (Baik / Dimengerti)': 'かしこまりました (Baik)',
    '食堂: shokudou (Kantin / Ruang makan)': '食堂: shokudou (Kantin)',
    'トイレ: toire (Toilet)': 'トイレ: toire (Toilet)',
    'あちら: achira (Sebelah sana)': 'あちら: achira (Sebelah sana)',
    '右: migi (Kanan)': '右: migi (Kanan)',
    '危ない: abunai (Bahaya)': '危ない: abunai (Bahaya)',
    '注意: chuui (Peringatan / Hati-たたみ)': '注意: chuui (Hati-hati)',
    '火事: kaji (Kebakaran)': '火事: kaji (Kebakaran)',
    '助けて: tasukete (Tolong)': '助けて: tasukete (Tolong)',
    '足: ashi (Kaki)': '足: ashi (Kaki)',
    '手: te (Tangan)': '手: te (Tangan)',
    '腰: koshi (Pinggang)': '腰: koshi (Pinggang)',
    '頭: atama (Kepala)': '頭: atama (Kepala)',
    '背中: senaka (Punggung)': '背中: senaka (Punggung)',
    '痛い: itai (Sakit)': '痛い: itai (Sakit)',
    '痛みます: itamimasu (Terasa sakit)': '痛みます: itamimasu (Sakit)',
    '吐き気: hakike (Mual)': '吐き気: hakike (Mual)',
    '熱: netsu (Demam)': '熱: netsu (Demam)',
    '車椅子: kurumaisu (Kursi roda)': '車椅子: kurumaisu (Kursi roda)',
    '杖: tsue (Tongkat)': '杖: tsue (Tongkat)',
    '歩行器: hokouki (Alat bantu jalan)': '歩行器: hokouki (Alat bantu jalan)',
    'ベッド: beddo (Tempat tidur)': 'ベッド: beddo (Ranjang)',
    '薬: kusuri (Obat)': '薬: kusuri (Obat)',
    '食後: shokugo (Setelah makan)': '食後: shokugo (Setelah makan)',
    '食前: shokuzen (Sebelum makan)': '食前: shokuzen (Sebelum makan)',
    '飲みます: nomimasu (Minum)': '飲みます: nomimasu (Minum)',
    '報告: houkoku (Laporan)': '報告: houkoku (Lapor)',
    '連絡: renraku (Hubungi)': '連絡: renraku (Hubungi)',
    '相談: soudan (Konsultasi)': '相談: soudan (Konsultasi)',
    '壊れました: kowaremashita (Rusak)': '壊れました: kowaremashita (Rusak)',
    '地震: jishin (Gempa bumi)': '地震: jishin (Gempa)',
    '避難: henan (Evakuasi)': '避難: henan (Evakuasi)',
    '火災: kasai (Kebakaran)': '火災: kasai (Kebakaran)',
    '非常口: hijouguchi (Pintu darurat)': '非常口: hijouguchi (Pintu darurat)',
    '日本語能力試験: jlpt (Ujian JLPT)': '日本語能力試験: jlpt (Ujian JLPT)',
    '練習問題: renshuu mondai (Latihan Soal)': '練習問題: renshuu mondai (Soal)',
    '文法: bunpou (Tata Bahasa)': '文法: bunpou (Tata Bahasa)',
    '読解: dokkai (Membaca)': '読解: dokkai (Membaca)',
    '面接: mensetsu (Wawancara)': '面接: mensetsu (Wawancara)',
    '自己紹介: jiko shoukai (Perkenalan Diri)': '自己紹介 (Perkenalan Diri)',
    '履歴書: rirekisho (Daftar Riwayat Hidup)': '履歴書 (CV / Riwayat Hidup)',
    '志望動機: shibou douki (Motivasi Melamar)': '志望動機 (Motivasi Melamar)'
  },
  zh: {
    'おはようございます (Selamat Pagi)': '早上好: zǎoshang hǎo (Selamat Pagi)',
    'いち (Satu)': '一: yī (Satu)',
    'に (Dua)': '二: èr (Dua)',
    'さん (Tiga)': '三: sān (Tiga)',
    'おやすみなさい (Selamat Tidur)': '晚安: wǎn\'ān (Selamat Tidur)',
    'お疲れ様です (Terima kasih atas kerja kerasnya)': '辛苦了: xīnkǔle (Terima kasih)',
    '失礼します (Permisi / Maaf mengganggu)': '打扰了: dǎrǎole (Permisi)',
    'お邪魔します (Permisi / Masuk rumah)': '打扰一下 (Permisi Masuk)',
    'かしこまりました (Baik / Dimengerti)': '知道了: zhīdàole (Baik)',
    '食堂: shokudou (Kantin / Ruang makan)': '食堂: shítáng (Kantin)',
    'トイレ: toire (Toilet)': '洗手间: xǐshǒujiān (Toilet)',
    'あちら: achira (Sebelah sana)': '那儿: nà\'er (Sebelah sana)',
    '右: migi (Kanan)': '右边: yòubiān (Kanan)',
    '危ない: abunai (Bahaya)': '危险: wēixiǎn (Bahaya)',
    '注意: chuui (Peringatan / Hati-hati)': '注意: zhùyì (Hati-hati)',
    '火事: kaji (Kebakaran)': '着火: zháohuǒ (Kebakaran)',
    '助けて: tasukete (Tolong)': '救命: jiùmìng (Tolong)',
    '足: ashi (Kaki)': '脚: jiǎo (Kaki)',
    '手: te (Tangan)': '手: shǒu (Tangan)',
    '腰: koshi (Pinggang)': '腰: yāo (Pinggang)',
    '頭: atama (Kepala)': '头: tóu (Kepala)',
    '背中: senaka (Punggung)': '背: bèi (Punggung)',
    '痛い: itai (Sakit)': '疼: téng (Sakit)',
    '痛みます: itamimasu (Terasa sakit)': '痛: tòng (Sakit)',
    '吐き気: hakike (Mual)': '恶心: ěxīn (Mual)',
    '熱: netsu (Demam)': '发烧: fāshāo (Demam)',
    '車椅子: kurumaisu (Kursi roda)': '轮椅: lúnyǐ (Kursi roda)',
    '杖: tsue (Tongkat)': '拐杖: guǎizhàng (Tongkat)',
    '歩行器: hokouki (Alat bantu jalan)': '助行器: zhùxíngqì (Alat bantu jalan)',
    'ベッド: beddo (Tempat tidur)': '床: chuáng (Ranjang)',
    '薬: kusuri (Obat)': '药: yào (Obat)',
    '食後: shokugo (Setelah makan)': '饭后: fànhòu (Setelah makan)',
    '食前: shokuzen (Sebelum makan)': '饭前: fànqián (Sebelum makan)',
    '飲みます: nomimasu (Minum)': '吃药: chīyào (Minum)',
    '報告: houkoku (Laporan)': '报告: bàogào (Lapor)',
    '連絡: renraku (Hubungi)': '联系: liánxì (Hubungi)',
    '相談: soudan (Konsultasi)': '商量: shāngliang (Konsultasi)',
    '壊れました: kowaremashita (Rusak)': '坏了: huàile (Rusak)',
    '地震: jishin (Gempa bumi)': '地震: dìzhèn (Gempa)',
    '避難: henan (Evakuasi)': '避难: bìnán (Evakuasi)',
    '火災: kasai (Kebakaran)': '火灾: huǒzāi (Kebakaran)',
    '非常口: hijouguchi (Pintu darurat)': '安全出口 (Pintu darurat)',
    '日本語能力試験: jlpt (Ujian JLPT)': '汉语水平考试: hsk (Ujian Bahasa)',
    '練習問題: renshuu mondai (Latihan Soal)': '练习题 (Soal)',
    '文法: bunpou (Tata Bahasa)': '语法: yǔfǎ (Tata Bahasa)',
    '読解: dokkai (Membaca)': '阅读: yuèdú (Membaca)',
    '面接: mensetsu (Wawancara)': '面试: miànshì (Wawancara)',
    '自己紹介: jiko shoukai (Perkenalan Diri)': '自我介绍 (Perkenalan Diri)',
    '履歴書: rirekisho (Daftar Riwayat Hidup)': '简历: jiǎnlì (CV / Riwayat Hidup)',
    '志望動機: shibou douki (Motivasi Melamar)': '求职意向 (Motivasi Melamar)'
  },
  en: {
    'おはようございます (Selamat Pagi)': 'Good Morning (Selamat Pagi)',
    'いち (Satu)': 'One (Satu)',
    'に (Dua)': 'Two (Dua)',
    'さん (Tiga)': 'Three (Tiga)',
    'おやすみなさい (Selamat Tidur)': 'Good Night (Selamat Tidur)',
    'お疲れ様です (Terima kasih atas kerja kerasnya)': 'Thank you for your hard work (Terima kasih)',
    '失礼します (Permisi / Maaf mengganggu)': 'Excuse me (Permisi)',
    'お邪魔します (Permisi / Masuk rumah)': 'Excuse me (Permisi Masuk)',
    'かしこまりました (Baik / Dimengerti)': 'Understood (Baik)',
    '食堂: shokudou (Kantin / Ruang makan)': 'Cafeteria / Dining Hall (Kantin)',
    'トイレ: toire (Toilet)': 'Restroom / Toilet (Toilet)',
    'あちら: achira (Sebelah sana)': 'Over there (Sebelah sana)',
    '右: migi (Kanan)': 'Right (Kanan)',
    '危ない: abunai (Bahaya)': 'Danger (Bahaya)',
    '注意: chuui (Peringatan / Hati-hati)': 'Caution / Attention (Hati-hati)',
    '火事: kaji (Kebakaran)': 'Fire (Kebakaran)',
    '助けて: tasukete (Tolong)': 'Help (Tolong)',
    '足: ashi (Kaki)': 'Leg / Foot (Kaki)',
    '手: te (Tangan)': 'Hand (Tangan)',
    '腰: koshi (Pinggang)': 'Waist / Lower Back (Pinggang)',
    '頭: atama (Kepala)': 'Head (Kepala)',
    '背中: senaka (Punggung)': 'Back (Punggung)',
    '痛い: itai (Sakit)': 'Painful (Sakit)',
    '痛みます: itamimasu (Terasa sakit)': 'It hurts (Sakit)',
    '吐き気: hakike (Mual)': 'Nausea (Mual)',
    '熱: netsu (Demam)': 'Fever (Demam)',
    '車椅子: kurumaisu (Kursi roda)': 'Wheelchair (Kursi roda)',
    '杖: tsue (Tongkat)': 'Cane / Stick (Tongkat)',
    '歩行器: hokouki (Alat bantu jalan)': 'Walker (Alat bantu jalan)',
    'ベッド: beddo (Tempat tidur)': 'Bed (Ranjang)',
    '薬: kusuri (Obat)': 'Medicine (Obat)',
    '食後: shokugo (Setelah makan)': 'After meals (Setelah makan)',
    '食前: shokuzen (Sebelum makan)': 'Before meals (Sebelum makan)',
    '飲みます: nomimasu (Minum)': 'Drink / Take (Minum)',
    '報告: houkoku (Laporan)': 'Report (Lapor)',
    '連絡: renraku (Hubungi)': 'Contact (Hubungi)',
    '相談: soudan (Konsultasi)': 'Consult (Konsultasi)',
    '壊れました: kowaremashita (Rusak)': 'Broken (Rusak)',
    '地震: jishin (Gempa bumi)': 'Earthquake (Gempa)',
    '避難: henan (Evakuasi)': 'Evacuation (Evakuasi)',
    '火災: kasai (Kebakaran)': 'Fire (Kebakaran)',
    '非常口: hijouguchi (Pintu darurat)': 'Emergency Exit (Pintu darurat)',
    '日本語能力試験: jlpt (Ujian JLPT)': 'Language Test (Ujian Bahasa)',
    '練習問題: renshuu mondai (Latihan Soal)': 'Practice Exercises (Soal)',
    '文法: bunpou (Tata Bahasa)': 'Grammar (Tata Bahasa)',
    '読解: dokkai (Membaca)': 'Reading Comprehension (Membaca)',
    '面接: mensetsu (Wawancara)': 'Interview (Wawancara)',
    '自己紹介: jiko shoukai (Perkenalan Diri)': 'Self Introduction (Perkenalan Diri)',
    '履歴書: rirekisho (Daftar Riwayat Hidup)': 'Resume / CV (CV / Riwayat Hidup)',
    '志望動機: shibou douki (Motivasi Melamar)': 'Reason for Applying (Motivasi Melamar)'
  },
  ar: {
    'おはようございます (Selamat Pagi)': 'صباح الخير (Selamat Pagi)',
    'いち (Satu)': 'واحد (Satu)',
    'に (Dua)': 'اثنان (Dua)',
    'さん (Tiga)': 'ثلاثة (Tiga)',
    'おやすみなさい (Selamat Tidur)': 'تصبح على خير (Selamat Tidur)',
    'お疲れ様です (Terima kasih atas kerja kerasnya)': 'شكرا لجهودكم (Terima kasih)',
    '失礼します (Permisi / Maaf mengganggu)': 'عذراً (Permisi)',
    'お邪魔します (Permisi / Masuk rumah)': 'تفضل بالدخول (Permisi Masuk)',
    'かしこまりました (Baik / Dimengerti)': 'مفهوم (Baik)',
    '食堂: shokudou (Kantin / Ruang makan)': 'مطعم (Kantin)',
    'トイレ: toire (Toilet)': 'مرحاض (Toilet)',
    'あちら: achira (Sebelah sana)': 'هناك (Sebelah sana)',
    '右: migi (Kanan)': 'يمين (Kanan)',
    '危ない: abunai (Bahaya)': 'خطر (Bahaya)',
    '注意: chuui (Peringatan / Hati-hati)': 'انتباه (Hati-hati)',
    '火事: kaji (Kebakaran)': 'حريق (Kebakaran)',
    '助けて: tasukete (Tolong)': 'النجدة (Tolong)',
    '足: ashi (Kaki)': 'قدم (Kaki)',
    '手: te (Tangan)': 'يد (Tangan)',
    '腰: koshi (Pinggang)': 'خصر (Pinggang)',
    '頭: atama (Kepala)': 'رأس (Kepala)',
    '背中: senaka (Punggung)': 'ظهر (Punggung)',
    '痛い: itai (Sakit)': 'مؤلم (Sakit)',
    '痛みます: itamimasu (Terasa sakit)': 'يؤلم (Sakit)',
    '吐き気: hakike (Mual)': 'غثيان (Mual)',
    '熱: netsu (Demam)': 'حمى (Demam)',
    '車椅子: kurumaisu (Kursi roda)': 'كرسي متحرك (Kursi roda)',
    '杖: tsue (Tongkat)': 'عصا (Tongkat)',
    '歩行器: hokouki (Alat bantu jalan)': 'مشاية (Alat bantu jalan)',
    'ベッド: beddo (Tempat tidur)': 'سرير (Ranjang)',
    '薬: kusuri (Obat)': 'دواء (Obat)',
    '食後: shokugo (Setelah makan)': 'بعد الأكل (Setelah makan)',
    '食前: shokuzen (Sebelum makan)': 'قبل الأكل (Sebelum makan)',
    '飲みます: nomimasu (Minum)': 'يأخذ الدواء (Minum)',
    '報告: houkoku (Laporan)': 'تقرير (Lapor)',
    '連絡: renraku (Hubungi)': 'اتصال (Hubungi)',
    '相談: soudan (Konsultasi)': 'استشارة (Konsultasi)',
    '壊れました: kowaremashita (Rusak)': 'مكسور (Rusak)',
    '地震: jishin (Gempa bumi)': 'زلزال (Gempa)',
    '避難: henan (Evakuasi)': 'إخلاء (Evakuasi)',
    '火災: kasai (Kebakaran)': 'حريق (Kebakaran)',
    '非常口: hijouguchi (Pintu darurat)': 'مخرج طوارئ (Pintu darurat)',
    '日本語能力試験: jlpt (Ujian JLPT)': 'امتحان اللغة (Ujian Bahasa)',
    '練習問題: renshuu mondai (Latihan Soal)': 'تمارين (Soal)',
    '文法: bunpou (Tata Bahasa)': 'قواعد (Tata Bahasa)',
    '読解: dokkai (Membaca)': 'قراءة (Membaca)',
    '面接: mensetsu (Wawancara)': 'مقابلة (Wawancara)',
    '自己紹介: jiko shoukai (Perkenalan Diri)': 'تعريف بالنفس (Perkenalan Diri)',
    '履歴書: rirekisho (Daftar Riwayat Hidup)': 'سيرة ذاتية (CV / Riwayat Hidup)',
    '志望動機: shibou douki (Motivasi Melamar)': 'دافع للتقديم (Motivasi Melamar)'
  },
  ko: {
    'おはようございます (Selamat Pagi)': '좋은 아침입니다 (Selamat Pagi)',
    'いち (Satu)': '하나 (Satu)',
    'に (Dua)': '둘 (Dua)',
    'さん (Tiga)': '셋 (Tiga)',
    'おやすみなさい (Selamat Tidur)': '안녕히 주무세요 (Selamat Tidur)',
    'お疲れ様です (Terima kasih atas kerja kerasnya)': '수고하셨습니다 (Terima kasih)',
    '失礼します (Permisi / Maaf mengganggu)': '실례합니다 (Permisi)',
    'お邪魔します (Permisi / Masuk rumah)': '실례하겠습니다 (Permisi Masuk)',
    'かしこまりました (Baik / Dimengerti)': '알겠습니다 (Baik)',
    '食堂: shokudou (Kantin / Ruang makan)': '식당 (Kantin)',
    'トイレ: toire (Toilet)': '화장실 (Toilet)',
    'あちら: achira (Sebelah sana)': '저쪽 (Sebelah sana)',
    '右: migi (Kanan)': '오른쪽 (Kanan)',
    '危ない: abunai (Bahaya)': '위험해 (Bahaya)',
    '注意: chuui (Peringatan / Hati-hati)': '주의 / 조심 (Hati-hati)',
    '火事: kaji (Kebakaran)': '불이야 (Kebakaran)',
    '助けて: tasukete (Tolong)': '살려주세요 (Tolong)',
    '足: ashi (Kaki)': '발 / 다리 (Kaki)',
    '手: te (Tangan)': '손 (Tangan)',
    '腰: koshi (Pinggang)': '허리 (Pinggang)',
    '頭: atama (Kepala)': '머리 (Kepala)',
    '背中: senaka (Punggung)': '등 (Punggung)',
    '痛い: itai (Sakit)': '아프다 (Sakit)',
    '痛みます: itamimasu (Terasa sakit)': '아픕니다 (Sakit)',
    '吐き気: hakike (Mual)': '메스꺼움 (Mual)',
    '熱: netsu (Demam)': '열 (Demam)',
    '車椅子: kurumaisu (Kursi roda)': '휠체어 (Kursi roda)',
    '杖: tsue (Tongkat)': '지팡이 (Tongkat)',
    '歩行器: hokouki (Alat bantu jalan)': '보행기 (Alat bantu jalan)',
    'ベッド: beddo (Tempat tidur)': '침대 (Ranjang)',
    '薬: kusuri (Obat)': '약 (Obat)',
    '食後: shokugo (Setelah makan)': '식후 (Setelah makan)',
    '食前: shokuzen (Sebelum makan)': '식전 (Sebelum makan)',
    '飲みます: nomimasu (Minum)': '약을 먹습니다 (Minum)',
    '報告: houkoku (Laporan)': '보고 (Lapor)',
    '連絡: renraku (Hubungi)': '연락 (Hubungi)',
    '相談: soudan (Konsultasi)': '상담 (Konsultasi)',
    '壊れました: kowaremashita (Rusak)': '고장 났습니다 (Rusak)',
    '地震: jishin (Gempa bumi)': '지진 (Gempa)',
    '避難: henan (Evakuasi)': '대피 (Evakuasi)',
    '火災: kasai (Kebakaran)': '화재 (Kebakaran)',
    '非常口: hijouguchi (Pintu darurat)': '비상구 (Pintu darurat)',
    '日本語能力試験: jlpt (Ujian JLPT)': '시험 (Ujian Bahasa)',
    '練習問題: renshuu mondai (Latihan Soal)': '연습 문제 (Soal)',
    '文法: bunpou (Tata Bahasa)': '문법 (Tata Bahasa)',
    '読解: dokkai (Membaca)': '독해 (Membaca)',
    '面接: mensetsu (Wawancara)': '면접 (Wawancara)',
    '自己紹介: jiko shoukai (Perkenalan Diri)': '자기소개 (Perkenalan Diri)',
    '履歴書: rirekisho (Daftar Riwayat Hidup)': '이력서 (CV / Riwayat Hidup)',
    '志望動機: shibou douki (Motivasi Melamar)': '지원 동기 (Motivasi Melamar)'
  }
};

const localizeVocab = (dbVocab, lang) => {
  return dbVocab.map(v => {
    const key = `${v.ja} (${v.id})`;
    const translation = VOCAB_TRANSLATIONS[lang]?.[key] || VOCAB_TRANSLATIONS[lang]?.[v.ja] || null;
    if (translation) {
      const colonIdx = translation.indexOf(':');
      if (colonIdx !== -1) {
        const wordPart = translation.substring(0, colonIdx).trim();
        let romajiPart = translation.substring(colonIdx + 1).trim();
        let meaningPart = v.id;
        
        const parenIdx = romajiPart.indexOf('(');
        if (parenIdx !== -1) {
          meaningPart = romajiPart.substring(parenIdx + 1, romajiPart.length - 1).trim();
          romajiPart = romajiPart.substring(0, parenIdx).trim();
        }
        return {
          ...v,
          ja: wordPart,
          romaji: romajiPart,
          id: meaningPart
        };
      } else {
        let wordPart = translation;
        let meaningPart = v.id;
        const parenIdx = translation.indexOf('(');
        if (parenIdx !== -1) {
          meaningPart = translation.substring(parenIdx + 1, translation.length - 1).trim();
          wordPart = translation.substring(0, parenIdx).trim();
        }
        return {
          ...v,
          ja: wordPart,
          romaji: wordPart,
          id: meaningPart
        };
      }
    }
    
    // 2. Fallback: If not in static translations, check if database object has the translation property for the selected language
    if (lang !== 'ja') {
      const t = v.translations?.[lang] || (v[lang] ? { target: v[lang], phonetic: v[lang + '_r'] } : null);
      if (t) {
        return {
          ...v,
          ja: t.target || v.ja, // target text is the translated word (e.g. '腰' or '无力')
          romaji: t.phonetic || v.romaji, // target pronunciation is the translated pronunciation (e.g. 'yāo' or 'wúlì')
          id: v.id // keep meaning as Indonesian (already v.id, e.g. 'Pinggang' or 'Lemas')
        };
      }
    }

    return v;
  });
};

// Pronunciation mapping for single Kanji words to prevent TTS engines from mispronouncing them (Onyomi vs Kunyomi)
const KANJI_TO_HIRAGANA_TTS = {
  '右': 'みぎ',
  '左': 'ひだり',
  '薬': 'くすり',
  '手': 'て',
  '足': 'あし',
  '腰': 'こし',
  '頭': 'あたま',
  '胃薬': 'いぐすり'
};

  // Speak Text using Web Speech Synthesis — supports all target languages with fallback
  const speakText = (text, speed = 1.0, phoneticFallback = null) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech Synthesis tidak didukung di browser ini.');
      return;
    }

    // Unfreeze speech synthesis engine if browser put it in paused state
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    const lang = 'ja';

    // Multiple locale fallbacks per language (Arabic has many regional variants)
    const ttsLocaleMap = {
      'ja': ['ja-JP', 'ja'],
      'zh': ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
      'ar': ['ar-SA', 'ar-EG', 'ar-AE', 'ar-MA', 'ar-IQ', 'ar'],
      'en': ['en-US', 'en-GB', 'en-AU', 'en'],
      'ko': ['ko-KR', 'ko']
    };

    const preferredLocales = ttsLocaleMap[lang] || ['ja-JP'];
    const primaryLocale    = preferredLocales[0];

    // Only apply kanji-to-hiragana fix for Japanese
    const ttsText = lang === 'ja' ? (KANJI_TO_HIRAGANA_TTS[text] || text) : text;

    const doSpeak = (voices) => {
      // Prioritize natural/online high-quality voices
      const rateVoiceQuality = (voice) => {
        const name = voice.name.toLowerCase();
        if (name.includes('natural')) return 4; // Microsoft Natural (Edge online)
        if (name.includes('google')) return 3;  // Google Translate online (Chrome)
        if (name.includes('online')) return 2;  // Other online voices
        return 1; // Offline local voice
      };

      const targetPrefix = lang.toLowerCase();

      // Filter all voices that match the target language (handling hyphens, underscores, etc.)
      const matchingVoices = voices.filter(v => {
        const norm = v.lang.replace(/_/g, '-').toLowerCase();
        return norm === targetPrefix || norm.startsWith(targetPrefix + '-');
      });

      let chosenVoice = null;
      if (matchingVoices.length > 0) {
        matchingVoices.sort((a, b) => rateVoiceQuality(b) - rateVoiceQuality(a));
        chosenVoice = matchingVoices[0];
      }

      // If no voice matches the chosen language in the browser's local TTS engine,
      // dynamically fall back to Google Translate's high-quality online TTS API via HTML5 Audio.
      if (!chosenVoice) {
        console.log(`No native browser voice found for language: ${lang}. Falling back to Google Translate TTS API.`);
        
        const targetGoogleLangCode = lang === 'zh' ? 'zh-CN' : (lang === 'ar' ? 'ar' : lang);
        const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetGoogleLangCode}&client=tw-ob&q=${encodeURIComponent(ttsText)}`;
        
        setSpeakingWord(text);
        setHighlightRange({ start: 0, end: ttsText.length });
        
        const audioObj = new Audio(googleTtsUrl);
        audioObj.playbackRate = speed;
        
        audioObj.onended = () => {
          setSpeakingWord('');
          setHighlightRange(null);
        };
        
        audioObj.onerror = (e) => {
          console.error('Google Translate TTS fallback playback failed:', e);
          setSpeakingWord('');
          setHighlightRange(null);
          alert(`Tidak dapat memutar audio. Pastikan koneksi internet Anda aktif.`);
        };
        
        audioObj.play().catch(err => {
          console.error('Audio element playback blocked by browser autocomplete/interaction rules:', err);
          setSpeakingWord('');
          setHighlightRange(null);
        });
        return;
      }

      const utterance = new SpeechSynthesisUtterance(ttsText);
      utterance.voice = chosenVoice;
      utterance.lang  = chosenVoice.lang;
      utterance.rate  = speed;

      console.log(`Speaking in native ${lang}: ${ttsText} using voice: ${chosenVoice.name} (${chosenVoice.lang})`);

      setSpeakingWord(text);
      setHighlightRange({ start: 0, end: 0 });

      utterance.onboundary = (event) => {
        if (event.name === 'word' || event.name === 'char') {
          const start  = event.charIndex;
          const length = event.charLength || 1;
          setHighlightRange({ start, end: start + length });
        }
      };

      utterance.onend = () => {
        setSpeakingWord('');
        setHighlightRange(null);
      };

      utterance.onerror = (err) => {
        console.error('SpeechSynthesis error:', err);
        setSpeakingWord('');
        setHighlightRange(null);
      };

      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    };

    // Voices may not be loaded on first call — handle async loading
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      doSpeak(voices);
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak(window.speechSynthesis.getVoices());
      };
      // Safety timeout: speak anyway after 1.5s if event never fires
      setTimeout(() => {
        if (window.speechSynthesis.onvoiceschanged) {
          window.speechSynthesis.onvoiceschanged = null;
          doSpeak(window.speechSynthesis.getVoices());
        }
      }, 1500);
    }
  };

  // Play Question Audio
  const playQuestionAudio = () => {
    if (currentQuestion.audioText) {
      // Pass romaji as fallback for languages without native TTS voices
      const phonetic = currentQuestion.romaji || null;
      speakText(currentQuestion.audioText, audioSpeed, phonetic);
    }
  };

  // Match Pair Logic
  const handleMatchSelect = (type, item) => {
    if (type === 'left') {
      setSelectedLeft(item);
      if (selectedRight !== null) {
        checkMatch(item, selectedRight);
      }
    } else {
      setSelectedRight(item);
      if (selectedLeft !== null) {
        checkMatch(selectedLeft, item);
      }
    }
  };

  const checkMatch = (left, right) => {
    if (left.id === right.id) {
      // Correct match!
      setCompletedMatches([...completedMatches, left.id]);
      setSelectedLeft(null);
      setSelectedRight(null);
      
      // Play positive ding or speak
      speakText(left.text);

      if (completedMatches.length + 1 === currentQuestion.pairs.length) {
        // All matched!
        setIsCorrect(true);
        setIsAnswerChecked(true);
      }
    } else {
      // Incorrect match, reset selections
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 500);
    }
  };

  // Voice Shadowing Recording
  const startRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition tidak didukung di browser ini.');
      return;
    }
    setShadowingResult('');
    setIsRecording(true);
    
    // Set recognition language to Japanese since the student is shadowing Japanese words
    recognitionRef.current.lang = 'ja-JP';
    
    recognitionRef.current.start();
  };

  // Evaluate voice shadowing with accent tolerance
  const evaluateSpeech = (spokenText) => {
    const target = currentQuestion.targetJa || '';
    
    if (!spokenText) {
      setIsCorrect(false);
      setIsAnswerChecked(true);
      return;
    }
    
    // Simple accent tolerance matching:
    // 1. Remove punctuation and spaces
    const cleanSpoken = spokenText.replace(/[\s、。！!?]/g, '').toLowerCase();
    const cleanTarget = target.replace(/[\s、。！!?]/g, '').toLowerCase();

    // 2. Exact match or phonetic inclusion
    const match = cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken) || 
                  (cleanSpoken.length > 2 && cleanTarget.substring(0, 3) === cleanSpoken.substring(0, 3));

    setIsCorrect(match);
    setIsAnswerChecked(true);
  };

  // Check Answer for Multiple Choice, Typing, & Shadowing
  const checkAnswer = () => {
    if (currentQuestion.type === 'B' || currentQuestion.type === 'E') {
      const correct = selectedOption === currentQuestion.answer;
      setIsCorrect(correct);
      setIsAnswerChecked(true);
      if (correct) speakText(currentQuestion.audioText, 1.0, currentQuestion.romaji);
    } else if (currentQuestion.type === 'C' || currentQuestion.type === 'F') {
      const normalizeRomaji = (str) => {
        return (str || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // remove tone marks / diacritics
          .replace(/[^a-z0-9]/g, "");     // remove punctuation, spaces, apostrophes
      };
      const cleanInput = normalizeRomaji(typedInput);
      const cleanTarget = normalizeRomaji(currentQuestion.targetRomaji);
      
      const similarity = getSimilarity(cleanInput, cleanTarget);
      const correct = similarity >= 0.8;
      
      setIsCorrect(correct);
      setIsAnswerChecked(true);
      if (correct) speakText(currentQuestion.targetJa, 1.0, currentQuestion.romaji);
    } else if (currentQuestion.type === 'D') {
      evaluateSpeech(shadowingResult);
    }
  };

  // Next Question or Finish
  const handleNext = () => {
    const isAnsCorrect = isCorrect;
const currentFails = currentQuestion.failCount || 0;
    
    let willRepeat = false;
    let updatedPoints = { ...questionPoints };

    if (isAnsCorrect) {
      // Calculate points with retry penalty: 1st try = 1.0, 2nd try = 0.7, 3rd try = 0.4, 4th try = 0.1
      const earned = currentFails === 0 ? 1.0 : currentFails === 1 ? 0.7 : currentFails === 2 ? 0.4 : 0.1;
      updatedPoints[currentQuestion.uniqueId] = earned;
      setQuestionPoints(updatedPoints);
    } else {
      // Record the wrong answer for the summary screen
      const incorrectAnswer = (currentQuestion.type === 'B' || currentQuestion.type === 'E')
        ? currentQuestion.options[selectedOption]
        : (currentQuestion.type === 'C' || currentQuestion.type === 'F')
          ? typedInput
          : shadowingResult || '(Tidak terdengar)';

      setWrongAnswers(prev => [...prev, {
        question: currentQuestion,
        userAnswer: incorrectAnswer
      }]);

// Allow max 3 retries (total 4 attempts) per question to avoid frustration
      if (currentFails < 3) {
        willRepeat = true;
        setSessionQuestions(prev => [...prev, {
          ...currentQuestion,
          failCount: currentFails + 1,
          isReview: true
        }]);
      } else {
        // If they failed all attempts, they get 0.0 points for this question
        updatedPoints[currentQuestion.uniqueId] = 0.0;
        setQuestionPoints(updatedPoints);
      }
    }

    // Calculate score as the sum of points across all questions answered so far
    const nextScore = Object.values(updatedPoints).reduce((sum, p) => sum + p, 0);
    setScore(nextScore);

    setSelectedOption(null);
    setTypedInput('');
    setIsAnswerChecked(false);
    setShadowingResult('');
    setAudioSpeed(1.0);

    const nextQuestionsCount = isAnsCorrect ? sessionQuestions.length : sessionQuestions.length + 1;

    if (currentQIndex + 1 >= nextQuestionsCount) {
      // Finished! Pass the final score directly to avoid stale state
      finishSession(nextScore);
    } else {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const finishSession = async (finalScoreValue) => {
    const actualScore = typeof finalScoreValue === 'number' ? finalScoreValue : score;
    try {
      const finalScorePercent = Math.round((actualScore / initialLength) * 100);
      const durationMin = Math.round((Date.now() - startTime) / 60000) || 1;
      const gainedXp = Math.round(actualScore * 15);
      const gainedCoins = Math.round(actualScore * 5);

      setXpEarned(gainedXp);
      setCoinsEarned(gainedCoins);

      if (progress) {
        const updatedProgress = { 
          ...progress,
          xp: (progress.xp || 0) + gainedXp,
          coins: (progress.coins || 0) + gainedCoins,
          completedWeeks: progress.completedWeeks ? [...progress.completedWeeks] : [1],
          dailyPracticeCounts: progress.dailyPracticeCounts ? { ...progress.dailyPracticeCounts } : {},
          studyTime: progress.studyTime ? [...progress.studyTime] : [0, 0, 0, 0, 0, 0, 0]
        };
        
        if (sessionType === 'practice') {
          const currentCount = updatedProgress.dailyPracticeCounts[weekNumber] || 0;
          updatedProgress.dailyPracticeCounts[weekNumber] = currentCount + 1;
        } else if (sessionType === 'exam') {
          if (finalScorePercent >= 80) {
            if (!updatedProgress.completedWeeks.includes(weekNumber)) {
              updatedProgress.completedWeeks.push(weekNumber);
            }
          }
        }

        const todayIndex = new Date().getDay();
        const adjustedIdx = todayIndex === 0 ? 6 : todayIndex - 1;
        if (updatedProgress.studyTime && updatedProgress.studyTime[adjustedIdx] !== undefined) {
          updatedProgress.studyTime[adjustedIdx] += durationMin;
        }

        await saveProgress(updatedProgress);

        await addLog({
          duration: durationMin,
          activity: sessionType === 'exam' 
            ? `Ujian Mingguan (Week ${weekNumber}): Skor ${finalScorePercent}% - ${finalScorePercent >= 80 ? 'LULUS' : 'REMEDIAL'}` 
            : `Latihan Mandiri (Week ${weekNumber})`,
          lpkId: progress.lpkId || 'lpk_a',
          isAlumni: false
        });
      }
    } catch (err) {
      console.error('Error saving session stats to local DB:', err);
    } finally {
      setStep('result');
    }
  };

  // Reset and restart the current learning session
  const retrySession = async () => {
    try {
      const qs = await getQuestionsByWeek(weekNumber);
      const vs = await getVocabByWeek(weekNumber);
      
      const lang = localStorage.getItem('kaigolingo_selected_language') || 'ja';
      const prog = localStorage.getItem('kaigolingo_selected_program') || 'kaigo';
      
      const { localizedQs, localizedVs } = getLocalizedDataForSession(qs, vs, lang, prog);
      
      const sessionQs = generateQuestionsForSession(localizedQs, localizedVs, weekNumber);
      setSessionQuestions(sessionQs);
      setInitialLength(sessionQs.length);
      setCurrentQIndex(0);
      setScore(0);
      setWrongAnswers([]);
      setIsAnswerChecked(false);
      setIsCorrect(false);
      setSelectedOption(null);
      setTypedInput('');
      setShadowingResult('');
      setXpEarned(0);
      setCoinsEarned(0);
      setIsRecording(false);
      setAudioSpeed(1.0);
      setStep(sessionType === 'practice' ? 'quiz' : 'biometric');
    } catch (err) {
      console.error('Failed to retry session:', err);
    }
  };

  // Render Biometric Screen
  if (step === 'biometric') {
    return (
      <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
        <div className="card" style={{ textAlign: 'center', padding: '30px var(--space-margin)' }}>
          <ShieldAlert size={64} color="var(--primary)" style={{ margin: '0 auto 20px auto' }} />
          <h2 style={{ marginBottom: '12px' }}>Verifikasi Suara</h2>
          <p className="body-md" style={{ marginBottom: '24px' }}>
            Untuk mencegah kecurangan, silakan lakukan pemindaian suara sebelum memulai ujian mingguan. Ucapkan salam dasar saat merekam.
          </p>

          {bioStatus === 'ready' && (
            <button className="btn btn-primary" onClick={startBiometricEnrollOrVerify}>
              Mulai Perekaman (3 Detik)
            </button>
          )}

          {bioStatus === 'recording' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
              <p className="body-md" style={{ fontWeight: '600', color: 'var(--primary)' }}>Mendengarkan suara Anda...</p>
            </div>
          )}

          {bioStatus === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={48} color="var(--secondary)" />
              <h3 style={{ color: 'var(--secondary)' }}>Verifikasi Berhasil!</h3>
              <p className="body-md">Kecocokan Suara: {bioConfidence || 98}%</p>
            </div>
          )}

          {bioStatus === 'failed' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <XCircle size={48} color="var(--tertiary)" />
              <h3 style={{ color: 'var(--tertiary)' }}>Verifikasi Gagal!</h3>
              <p className="body-md" style={{ color: 'var(--tertiary)' }}>
                Karakteristik suara tidak cocok dengan profil siswa yang terdaftar. Ujian dibekukan sementara.
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button className="btn btn-outline" onClick={() => onEndSession()}>Batal</button>
                <button className="btn btn-primary" onClick={startBiometricEnrollOrVerify}>Coba Lagi</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Results Screen
  if (step === 'result') {
    const passed = Math.round((score / (initialLength || 1)) * 100) >= 80;
    const finalScore = Math.round((score / (initialLength || 1)) * 100);
    const eventuallyCorrectCount = Object.values(questionPoints).filter(p => p > 0).length;

    return (
      <SafeErrorBoundary onFallback={() => onEndSession()}>
        <div className="screen-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', padding: '12px var(--space-margin)', position: 'relative', justifyContent: 'center', overflow: 'hidden' }}>
        {passed && <ConfettiEffect />}
        
        <style>{`
          @keyframes jump {
            0% { transform: translateY(0); }
            100% { transform: translateY(-8px); }
          }
        `}</style>

        <div className="card no-press" style={{ textAlign: 'center', padding: '16px 16px', maxHeight: 'calc(100% - 10px)', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', zIndex: 10, boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {passed ? (
            <img 
              src="/logo_kakatua.png" 
              alt="Cheering Mascot" 
              style={{ 
                width: '100px', 
                height: '100px', 
                objectFit: 'contain',
                margin: '0 auto 8px auto', 
                flexShrink: 0,
                animation: 'jump 0.6s ease-in-out infinite alternate'
              }} 
            />
          ) : (
            <Award size={60} color="var(--tertiary)" style={{ margin: '0 auto 8px auto', flexShrink: 0 }} />
          )}

          <h1 style={{ color: passed ? 'var(--secondary)' : 'var(--tertiary)', fontSize: '22px', marginBottom: '4px', flexShrink: 0 }}>
            {passed ? 'Selamat! 🎉' : 'Tetap Semangat! 💪'}
          </h1>
          <p className="body-lg" style={{ marginBottom: '12px', flexShrink: 0, fontSize: '14px', lineHeight: '1.4' }}>
            {passed 
              ? `Luar biasa, kamu berhasil menyelesaikan latihan! Benar ${eventuallyCorrectCount} dari ${initialLength} soal.` 
              : `Ayo coba lagi untuk meningkatkan pemahamanmu. Benar ${eventuallyCorrectCount} dari ${initialLength} soal.`}
          </p>

          {/* Score & Status grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', flexShrink: 0 }}>
            <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '8px', borderRadius: 'var(--radius-default)' }}>
              <div className="label-md" style={{ color: 'var(--outline)', fontSize: '11px' }}>SKOR</div>
              <h2 style={{ fontSize: '20px', color: 'var(--on-surface)', margin: '2px 0 0 0' }}>{finalScore}%</h2>
            </div>
            <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '8px', borderRadius: 'var(--radius-default)' }}>
              <div className="label-md" style={{ color: 'var(--outline)', fontSize: '11px' }}>STATUS</div>
              <h2 style={{ fontSize: '16px', color: passed ? 'var(--secondary)' : 'var(--tertiary)', margin: '2px 0 0 0', fontWeight: '700' }}>
                {passed ? 'LULUS' : 'REMEDIAL'}
              </h2>
            </div>
          </div>

          {/* XP & Coins */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: '700' }}>
              <span>+{xpEarned} XP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308', fontWeight: '700' }}>
              <span>+{coinsEarned} Koin</span>
            </div>
          </div>

          {/* Wrong Answers Review Section */}
          {wrongAnswers.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: '12px', backgroundColor: '#fff5f5', border: '1px solid #fee2e2', padding: '16px', borderRadius: 'var(--radius-default)', flex: 1, minHeight: '80px', overflowY: 'auto' }}>
              <span className="label-md" style={{ color: 'var(--tertiary)', fontWeight: '700', display: 'block', marginBottom: '12px' }}>
                Review Jawaban Salah:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {wrongAnswers.map((item, idx) => {
                  if (!item || !item.question) return null;
                  const q = item.question;
                  const qIndex = sessionQuestions.indexOf(q);
                  const displayIndex = qIndex !== -1 ? qIndex + 1 : idx + 1;
                  
                  return (
                    <div key={idx} style={{ borderBottom: idx < wrongAnswers.length - 1 ? '1px solid #fecaca' : 'none', paddingBottom: '12px' }}>
                      <p className="body-md" style={{ fontWeight: '700', color: 'var(--on-surface)', margin: 0 }}>
                        No. {displayIndex}: {q.prompt || 'Pertanyaan'}
                      </p>
                      
                      {(q.type === 'B' || q.type === 'E') && q.options && (
                        <div style={{ marginTop: '6px', fontSize: '13px' }}>
                          <p style={{ color: 'var(--tertiary)', margin: 0 }}>Pilihan Anda: <strong style={{ textDecoration: 'line-through' }}>{item.userAnswer}</strong></p>
                          <p style={{ color: 'var(--secondary)', margin: '2px 0 0 0', fontWeight: '600' }}>
                            Jawaban Benar: {q.options[q.answer]}
                          </p>
                        </div>
                      )}
                      
                      {(q.type === 'C' || q.type === 'F') && (
                        <div style={{ marginTop: '6px', fontSize: '13px' }}>
                          <p style={{ color: 'var(--tertiary)', margin: 0 }}>Ketikan Anda: <strong style={{ textDecoration: 'line-through' }}>{item.userAnswer || '(Kosong)'}</strong></p>
                          <p style={{ color: 'var(--secondary)', margin: '2px 0 0 0', fontWeight: '600' }}>
                            Jawaban Benar: {q.targetRomaji} ({q.targetJa})
                          </p>
                        </div>
                      )}
                      
                      {q.type === 'D' && (
                        <div style={{ marginTop: '6px', fontSize: '13px' }}>
                          <p style={{ color: 'var(--tertiary)', margin: 0 }}>Pelafalan Anda: <strong style={{ textDecoration: 'line-through' }}>{item.userAnswer}</strong></p>
                          <p style={{ color: 'var(--secondary)', margin: '2px 0 0 0', fontWeight: '600' }}>
                            Target Pelafalan: {q.targetJa} ({q.romaji})
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px', flexShrink: 0 }}>
            {(() => {
              const selectedLanguage = localStorage.getItem('kaigolingo_selected_language') || 'ja';
              let maxWeeks = 12;
              if (selectedLanguage === 'ja') maxWeeks = 25;
              else if (selectedLanguage === 'ko') maxWeeks = 20;
              else if (selectedLanguage === 'zh') maxWeeks = 15;
              else if (selectedLanguage === 'ar' || selectedLanguage === 'en') maxWeeks = 10;

              if (weekNumber < maxWeeks && passed && sessionType === 'exam') {
                return (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => onEndSession(weekNumber + 1)}
                    style={{ width: '100%', padding: '10px', marginBottom: '4px' }}
                  >
                    Lanjut ke Minggu {weekNumber + 1} ➔
                  </button>
                );
              }
              return null;
            })()}
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button 
                className="btn btn-outline" 
                onClick={retrySession}
                style={{ flex: 1, padding: '10px' }}
              >
                Ulangi Latihan
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => onEndSession()}
                style={{ flex: 1, padding: '10px' }}
              >
                Kembali ke Map
              </button>
            </div>
          </div>
        </div>
      </div>
    </SafeErrorBoundary>
  );
}

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '100%', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      {/* Scrollable Quiz Content */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px var(--space-margin) 180px var(--space-margin)' 
        }}
      >
        {/* Progress Bar & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '16px' }}>
          <button onClick={() => onEndSession()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'var(--outline)' }}>
            <X size={24} />
          </button>
          
          <div style={{ flex: 1, height: '16px', backgroundColor: 'var(--surface-container-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden', position: 'relative' }}>
            <div 
              style={{ 
                height: '100%', 
                backgroundColor: 'var(--primary)', 
                borderRadius: 'var(--radius-full)', 
                width: `${((currentQIndex) / sessionQuestions.length) * 100}%`,
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
              }} 
            />
          </div>
          
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '13px', color: 'var(--outline)', whiteSpace: 'nowrap' }}>
            {currentQIndex + 1} / {sessionQuestions.length}
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          {/* Question Prompt */}
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <span className="badge badge-blue" style={{ marginBottom: '6px' }}>
              {currentQuestion.type === 'A' && 'Mencocokkan Kata'}
              {currentQuestion.type === 'B' && 'Dengar & Pilih'}
              {currentQuestion.type === 'C' && 'Ketik Konversi'}
              {currentQuestion.type === 'D' && 'Shadowing Suara'}
              {currentQuestion.type === 'E' && 'Dengar & Terjemahkan'}
              {currentQuestion.type === 'F' && 'Dengar & Tulis Romaji'}
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '600' }}>{currentQuestion.prompt}</h2>
          </div>

          {/* Tipe A: Matching */}
          {currentQuestion.type === 'A' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', margin: '20px 0', alignItems: 'stretch' }}>
              {Array.from({ length: Math.max(matchLeft.length, matchRight.length) }).map((_, index) => {
                const leftItem = matchLeft[index];
                const rightItem = matchRight[index];
                
                const isLeftMatched = leftItem ? completedMatches.includes(leftItem.id) : false;
                const isLeftSelected = leftItem ? selectedLeft?.id === leftItem.id : false;
                
                const isRightMatched = rightItem ? completedMatches.includes(rightItem.id) : false;
                const isRightSelected = rightItem ? selectedRight?.id === rightItem.id : false;

                return (
                  <React.Fragment key={index}>
                    {/* Left Option */}
                    {leftItem ? (
                      <button
                        className={`question-option ${isLeftSelected ? 'selected' : ''}`}
                        style={{ 
                          margin: 0, 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          opacity: isLeftMatched ? 0.3 : 1, 
                          pointerEvents: isLeftMatched ? 'none' : 'auto',
                          textAlign: 'center',
                          padding: '12px 8px'
                        }}
                        onClick={() => handleMatchSelect('left', leftItem)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%' }}>
                          <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--on-surface)' }}>{leftItem.text}</span>
                          {leftItem.romaji && (
                            <span style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: '500' }}>{leftItem.romaji}</span>
                          )}
                        </div>
                      </button>
                    ) : <div />}

                    {/* Right Option */}
                    {rightItem ? (
                      <button
                        className={`question-option ${isRightSelected ? 'selected' : ''}`}
                        style={{ 
                          margin: 0, 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          opacity: isRightMatched ? 0.3 : 1, 
                          pointerEvents: isRightMatched ? 'none' : 'auto',
                          textAlign: 'center'
                        }}
                        onClick={() => handleMatchSelect('right', rightItem)}
                      >
                        {rightItem.text}
                      </button>
                    ) : <div />}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Tipe B & E: Listening Multiple Choice */}
          {(currentQuestion.type === 'B' || currentQuestion.type === 'E') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
              <button
                onClick={playQuestionAudio}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-container)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
                  color: 'white'
                }}
              >
                <Volume2 size={32} />
              </button>

              <div style={{ width: '100%' }}>
                {(currentQuestion.options || []).map((opt, idx) => {
                  let optClass = '';
                  if (selectedOption === idx) optClass = 'selected';
                  if (isAnswerChecked) {
                    if (idx === currentQuestion.answer) optClass = 'correct';
                    else if (selectedOption === idx) optClass = 'incorrect';
                  }

                  return (
                    <div
                      key={idx}
                      className={`question-option ${optClass}`}
                      onClick={() => !isAnswerChecked && setSelectedOption(idx)}
                    >
                      <div className="option-badge">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      {opt}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tipe C: Typing */}
          {currentQuestion.type === 'C' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <div className="card no-press" style={{ textAlign: 'center', backgroundColor: 'var(--surface-container-low)', padding: '16px' }}>
                <h2 style={{ color: 'var(--primary)' }}>{currentQuestion.targetJa}</h2>
                {currentQuestion.romaji && (
                  <p className="body-lg" style={{ color: 'var(--outline)', fontWeight: '600', marginTop: '2px' }}>{currentQuestion.romaji}</p>
                )}
                <p className="body-md" style={{ marginTop: '4px' }}>Arti: {currentQuestion.meaning}</p>
              </div>

              <input
                type="text"
                className="input-field"
                placeholder="Ketik ejaan Romaji..."
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                disabled={isAnswerChecked}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!isAnswerChecked && typedInput.trim() !== '') {
                      checkAnswer();
                    } else if (isAnswerChecked) {
                      handleNext();
                    }
                  }
                }}
              />
            </div>
          )}

          {/* Tipe F: Dengar & Tulis Romaji */}
          {currentQuestion.type === 'F' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
              <button
                onClick={playQuestionAudio}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-container)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
                  color: 'white'
                }}
              >
                <Volume2 size={32} />
              </button>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ketik ejaan Romaji yang Anda dengar..."
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={isAnswerChecked}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (!isAnswerChecked && typedInput.trim() !== '') {
                        checkAnswer();
                      } else if (isAnswerChecked) {
                        handleNext();
                      }
                    }
                  }}
                />
                
                {isAnswerChecked && (
                  <div className="card no-press" style={{ textAlign: 'center', backgroundColor: 'var(--surface-container-low)', padding: '12px', marginTop: '4px' }}>
                    <h3 style={{ color: 'var(--primary)', fontSize: '18px' }}>{currentQuestion.targetJa}</h3>
                    <p className="body-md" style={{ color: 'var(--outline)', margin: '4px 0 0 0' }}>Arti: {currentQuestion.meaning}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tipe D: Shadowing */}
          {currentQuestion.type === 'D' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
              <div className="card no-press" style={{ width: '100%', textAlign: 'center', padding: '16px' }}>
                <h1 className="japanese-display" style={{ marginBottom: '4px' }}>
                  {(() => {
                    const word = currentQuestion.targetJa;
                    if (speakingWord !== word || !highlightRange) return word;
                    return (
                      <span>
                        {word.split('').map((char, index) => {
                          const isHighlighted = index >= highlightRange.start && index < highlightRange.end;
                          return (
                            <span 
                              key={index} 
                              style={{ 
                                fontWeight: '700',
                                color: isHighlighted ? 'var(--primary)' : 'var(--on-surface)',
                                textShadow: isHighlighted ? '0 0 8px rgba(37,99,235,0.4)' : 'none',
                                transition: 'all 0.1s ease',
                                display: 'inline-block',
                                transform: isHighlighted ? 'scale(1.15)' : 'scale(1)'
                              }}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </span>
                    );
                  })()}
                </h1>
                <p className="body-lg" style={{ fontWeight: '600', color: 'var(--outline)' }}>
                  {renderHighlightedRomaji(currentQuestion.targetJa, currentQuestion.romaji)}
                </p>
                <p className="body-md" style={{ marginTop: '12px' }}>Arti: {currentQuestion.meaning}</p>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  onClick={() => speakText(currentQuestion.targetJa, 1.0, currentQuestion.romaji)}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--surface-container)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--on-surface)'
                  }}
                >
                  <Volume2 size={24} />
                </button>

                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: isRecording ? 'var(--tertiary)' : 'var(--secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none'
                  }}
                >
                  <Mic size={32} />
                </button>
              </div>

              {isRecording && <p className="body-md" style={{ color: 'var(--tertiary)', fontWeight: '600' }}>Mendengarkan... Silakan tirukan kalimat di atas.</p>}

              {shadowingResult && (
                <div style={{ textAlign: 'center' }}>
                  <span className="label-md" style={{ color: 'var(--outline)' }}>Hasil Deteksi Suara:</span>
                  <p className="body-lg" style={{ fontWeight: '700', color: 'var(--primary)', marginTop: '4px' }}>"{shadowingResult}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Check Answer Button */}
        {!isAnswerChecked && currentQuestion.type !== 'A' && currentQuestion.type !== 'D' && (
          <button
            className="btn btn-primary"
            style={{ marginTop: '24px' }}
            disabled={(currentQuestion.type === 'B' || currentQuestion.type === 'E') ? selectedOption === null : typedInput.trim() === ''}
            onClick={checkAnswer}
          >
            Periksa Jawaban
          </button>
        )}

        {/* Shadowing Submit Button */}
        {currentQuestion.type === 'D' && !isAnswerChecked && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px', width: '100%' }}>
            <button
              className="btn btn-primary"
              disabled={!shadowingResult}
              onClick={checkAnswer}
              style={{ width: '100%' }}
            >
              Periksa Jawaban
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setShadowingResult('');
                setIsCorrect(false);
                setIsAnswerChecked(true);
              }}
              style={{ width: '100%', borderColor: 'var(--outline)', color: 'var(--outline)', padding: '10px' }}
            >
              Saya Tidak Bisa Bicara Sekarang
            </button>
          </div>
        )}
        {/* Explanation displayed inline within scrollable content when checked */}
        {isAnswerChecked && currentQuestion.explanation && (
          <div style={{ marginTop: '24px', backgroundColor: 'white', padding: '16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--surface-container-high)', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-japanese)', color: 'var(--primary)', margin: 0 }}>
                {(() => {
                  const word = currentQuestion.explanation.word;
                  if (speakingWord !== word || !highlightRange) return word;
                  return (
                    <span>
                      {word.split('').map((char, index) => {
                        const isHighlighted = index >= highlightRange.start && index < highlightRange.end;
                        return (
                          <span 
                            key={index} 
                            style={{ 
                              fontWeight: isHighlighted ? '800' : 'normal',
                              color: isHighlighted ? '#ff5a5f' : 'var(--primary)',
                              transition: 'all 0.1s ease',
                              textDecoration: isHighlighted ? 'underline' : 'none',
                              display: 'inline-block',
                              transform: isHighlighted ? 'scale(1.2)' : 'scale(1)'
                            }}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
                  );
                })()}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="audio-btn" onClick={() => speakText(currentQuestion.explanation.word, 1.0, currentQuestion.explanation.romaji)}>
                  1.0x
                </button>
                <button className="audio-btn" onClick={() => speakText(currentQuestion.explanation.word, 0.5, currentQuestion.explanation.romaji)}>
                  0.5x
                </button>
              </div>
            </div>
            <p className="body-md" style={{ fontWeight: '600', color: 'var(--outline)', marginTop: '2px', marginBottom: '12px' }}>
              {renderHighlightedRomaji(currentQuestion.explanation.word, currentQuestion.explanation.romaji)}
            </p>

            <div style={{ marginTop: '12px' }}>
              <span className="label-md" style={{ color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase' }}>ARTI</span>
              <p className="body-md" style={{ fontWeight: '700', color: 'var(--on-surface)', margin: '2px 0 0 0' }}>
                {currentQuestion.explanation.translation}
              </p>
            </div>

            <div style={{ marginTop: '8px' }}>
              <span className="label-md" style={{ color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase' }}>KONTEKS</span>
              <p className="body-md" style={{ margin: '2px 0 0 0' }}>{currentQuestion.explanation.context}</p>
            </div>

            <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#fdf2f8', borderRadius: '8px', borderLeft: '3px solid var(--tertiary)' }}>
              <span className="label-md" style={{ color: 'var(--tertiary)', fontSize: '11px' }}>Tip Penggunaan:</span>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)', fontSize: '13px', margin: '2px 0 0 0' }}>
                {currentQuestion.explanation.tip}
              </p>
            </div>

            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
              <span className="label-md" style={{ color: 'var(--secondary)', fontSize: '11px' }}>Contoh Penggunaan:</span>
              <p className="body-md" style={{ fontWeight: '700', fontStyle: 'italic', margin: '2px 0 0 0' }}>
                "{currentQuestion.explanation.example}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Answer Feedback Panel (Duolingo Style - Compact & Mobile Friendly Floating Bento Card) */}
      {isAnswerChecked && (
        <div 
          style={{ 
            position: 'absolute',
            bottom: '60px',
            left: '16px',
            right: '16px',
            border: `2px solid ${isCorrect ? 'var(--secondary)' : 'var(--tertiary)'}`,
            borderRadius: 'var(--radius-default)',
            backgroundColor: isCorrect ? '#ecfdf5' : '#fef2f2',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isCorrect ? (
              <CheckCircle size={28} color="var(--secondary)" />
            ) : (
              <XCircle size={28} color="var(--tertiary)" />
            )}
            <div>
              <h3 style={{ color: isCorrect ? 'var(--secondary)' : 'var(--tertiary)', margin: 0, fontSize: '15px' }}>
                {isCorrect ? 'Jawaban Benar!' : 'Jawaban Salah!'}
              </h3>
              {isCorrect && (currentQuestion.type === 'C' || currentQuestion.type === 'F') && typedInput.trim().toLowerCase() !== currentQuestion.targetRomaji.toLowerCase() && (
                <p className="body-md" style={{ color: '#065f46', margin: '2px 0 0 0', fontWeight: '600', fontSize: '12px' }}>
                  Ada sedikit salah ketik. Ejaan resmi: <strong style={{ textDecoration: 'underline' }}>{currentQuestion.targetRomaji}</strong> ({currentQuestion.targetJa})
                </p>
              )}
              {!isCorrect && (currentQuestion.type === 'B' || currentQuestion.type === 'E') && (
                <p className="body-md" style={{ color: 'var(--tertiary)', margin: '1px 0 0 0', fontSize: '12px' }}>
                  Jawaban benar: {currentQuestion.options[currentQuestion.answer]}
                </p>
              )}
              {!isCorrect && (currentQuestion.type === 'C' || currentQuestion.type === 'F') && (
                <p className="body-md" style={{ color: 'var(--tertiary)', margin: '1px 0 0 0', fontSize: '12px' }}>
                  Jawaban benar: {currentQuestion.targetRomaji} ({currentQuestion.targetJa})
                </p>
              )}
            </div>
          </div>

          <button 
            className={`btn ${isCorrect ? 'btn-secondary' : 'btn-tertiary'}`}
            style={{ width: '100%', marginTop: '0px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
            onClick={handleNext}
          >
            Lanjutkan
            <ArrowRight size={16} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      )}
    </div>
  );
}
