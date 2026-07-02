import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, CheckCircle, XCircle, ArrowRight, X, Play, RefreshCw, Lock, Award, ShieldAlert } from 'lucide-react';
import { saveProgress, addLog, getVoiceSignature, getQuestionsByWeek, getVocabByWeek, seedQuestionsAndVocab } from '../utils/db';

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

// Syllable-level romaji chunks for karaoke highlighting (falls back to word-level if empty)
const ROMAJI_CHUNKS = {};

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

  // Ref to hold the latest evaluateSpeech function to avoid stale closures in web speech API listeners
  const evaluateSpeechRef = React.useRef(null);

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

  // Helper to generate dynamic questions for the session using IndexedDB data
  const generateQuestionsForSession = (dbQuestions, dbVocab, weekNum) => {
    const staticQuestions = dbQuestions || [];
    const vocab = dbVocab.length > 0 ? dbVocab : [];
    
    // Target count scales from 10 (Week 1) to 20 (Week 11 & 12)
    const targetCount = Math.min(20, 10 + (weekNum - 1));
    
    let generated = [...staticQuestions];
    
    // Filter out vocab items that are already in staticQuestions to prevent duplication
    const staticJaTexts = [];
    staticQuestions.forEach(q => {
      if (q.audioText) staticJaTexts.push(q.audioText);
      if (q.targetJa) staticJaTexts.push(q.targetJa);
      if (q.pairs) {
        q.pairs.forEach(p => {
          const rawJa = p.ja.split(' ')[0].split('(')[0].trim();
          staticJaTexts.push(rawJa);
        });
      }
    });
    
    const filteredVocab = vocab.filter(item => 
      !staticJaTexts.some(ja => ja.includes(item.ja) || item.ja.includes(ja))
    );
    
    // If we need more questions, generate them dynamically from filteredVocab
    if (generated.length < targetCount && vocab.length > 0) {
      // Shuffle filteredVocab to get random items
      const pool = filteredVocab.length > 0 ? filteredVocab : vocab;
      const shuffledPool = shuffleArray(pool);
      
      let poolIndex = 0;
      let attempts = 0;
      
      while (generated.length < targetCount && attempts < 50) {
        attempts++;
        const item = shuffledPool[poolIndex % shuffledPool.length];
        poolIndex++;
        
        // Ensure no immediate duplicate within current session
        const alreadyIn = generated.some(q => {
          if (q.audioText && (q.audioText.includes(item.ja) || item.ja.includes(q.audioText))) return true;
          if (q.targetJa && (q.targetJa.includes(item.ja) || item.ja.includes(q.targetJa))) return true;
          if (q.pairs && q.pairs.some(p => p.ja.includes(item.ja) || item.ja.includes(p.ja))) return true;
          return false;
        });
        
        if (alreadyIn && attempts <= 30) {
          continue;
        }

        // Randomly pick a question type (B: Listening, C: Typing, D: Shadowing)
        const rand = Math.random();
        if (rand < 0.35) {
          // Type B: Listening & Choose
          const otherTranslations = vocab
            .filter(v => v.ja !== item.ja)
            .map(v => v.id);
          const wrongOptions = shuffleArray(otherTranslations).slice(0, 2);
          const options = shuffleArray([item.id, ...wrongOptions]);
          const correctIndex = options.indexOf(item.id);
          
          generated.push({
            type: 'B',
            prompt: 'Dengar dan pilih arti yang tepat!',
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
        } else if (rand < 0.7) {
          // Type C: Typing
          generated.push({
            type: 'C',
            prompt: `Ketik ejaan Romaji untuk "${item.id}"!`,
            targetRomaji: item.romaji.replace(/[\s\-]/g, ''),
            targetJa: item.ja,
            meaning: item.id
          });
        } else {
          // Type D: Shadowing
          const formattedRomaji = item.romaji.split('').join('-');
          generated.push({
            type: 'D',
            prompt: 'Ucapkan kata berikut melalui mikrofon (Shadowing)!',
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
        let qs = await getQuestionsByWeek(weekNumber);
        let vs = await getVocabByWeek(weekNumber);
        if (qs.length === 0 || vs.length === 0) {
          console.log('Seeding database from local JSON files...');
          const qRes = await fetch('/questions.json');
          const vRes = await fetch('/vocabulary.json');
          if (qRes.ok && vRes.ok) {
            const qData = await qRes.json();
            const vData = await vRes.json();
            await seedQuestionsAndVocab(qData, vData);
            qs = await getQuestionsByWeek(weekNumber);
            vs = await getVocabByWeek(weekNumber);
          }
        }
        initDynamicKanjiMap(vs);
        const sessionQs = generateQuestionsForSession(qs, vs, weekNumber);
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

  const currentQuestion = sessionQuestions[currentQIndex] || sessionQuestions[0];

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
          if (evaluateSpeechRef.current) {
            evaluateSpeechRef.current(resultText);
          }
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
      const left = currentQuestion.pairs.map((p, idx) => ({ id: idx, text: p.ja })).sort(() => Math.random() - 0.5);
      const right = currentQuestion.pairs.map((p, idx) => ({ id: idx, text: p.id })).sort(() => Math.random() - 0.5);
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

  // Speak Japanese Text using Web Speech Synthesis
  const speakText = (text, speed = 1.0) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      // Prevent single Kanji mispronunciation (e.g., '左' read as 'sa' instead of 'hidari')
      const ttsText = KANJI_TO_HIRAGANA_TTS[text] || text;
      const utterance = new SpeechSynthesisUtterance(ttsText);
      utterance.lang = 'ja-JP';
      utterance.rate = speed;
      
      // Attempt to find a native Japanese voice
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(voice => voice.lang.startsWith('ja'));
      if (jaVoice) utterance.voice = jaVoice;

      // Track speaking word and highlight index
      setSpeakingWord(text);
      setHighlightRange({ start: 0, end: 0 });

      utterance.onboundary = (event) => {
        if (event.name === 'word' || event.name === 'char') {
          const start = event.charIndex;
          const length = event.charLength || 1;
          setHighlightRange({ start, end: start + length });
        }
      };

      utterance.onend = () => {
        setSpeakingWord('');
        setHighlightRange(null);
      };

      utterance.onerror = () => {
        setSpeakingWord('');
        setHighlightRange(null);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech Synthesis tidak didukung di browser ini.');
    }
  };

  // Play Question Audio
  const playQuestionAudio = () => {
    if (currentQuestion.audioText) {
      speakText(currentQuestion.audioText, audioSpeed);
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
    recognitionRef.current.start();
  };

  // Evaluate voice shadowing with accent tolerance
  const evaluateSpeech = (spokenText) => {
    if (!currentQuestion) return;
    const target = currentQuestion.targetJa || '';

    if (!spokenText) {
      setIsCorrect(false);
      setIsAnswerChecked(true);
      return;
    }
    
    // Convert both spoken and target to Hiragana (handling Kanji and Katakana)
    const hiraganaSpoken = convertKanjiToHiragana(spokenText);
    const hiraganaTarget = convertKanjiToHiragana(target);

    // Simple accent tolerance matching:
    // 1. Remove punctuation and spaces
    const cleanSpoken = hiraganaSpoken.replace(/[\s、。！!?]/g, '').toLowerCase();
    const cleanTarget = hiraganaTarget.replace(/[\s、。！!?]/g, '').toLowerCase();

    // 2. Exact match or phonetic inclusion
    const match = cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken) || 
                  (cleanSpoken.length > 2 && cleanTarget.substring(0, 3) === cleanSpoken.substring(0, 3));

    setIsCorrect(match);
    setIsAnswerChecked(true);
  };
  evaluateSpeechRef.current = evaluateSpeech;

  // Check Answer for Multiple Choice, Typing, & Shadowing
  const checkAnswer = () => {
    if (currentQuestion.type === 'B') {
      const correct = selectedOption === currentQuestion.answer;
      setIsCorrect(correct);
      setIsAnswerChecked(true);
      if (correct) speakText(currentQuestion.audioText);
    } else if (currentQuestion.type === 'C') {
      const cleanInput = typedInput.trim().toLowerCase().replace(/[\s\-]/g, '');
      const cleanTarget = currentQuestion.targetRomaji.toLowerCase().replace(/[\s\-]/g, '');
      
      const similarity = getSimilarity(cleanInput, cleanTarget);
      const correct = similarity >= 0.8;
      
      setIsCorrect(correct);
      setIsAnswerChecked(true);
      if (correct) speakText(currentQuestion.targetJa);
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
      const incorrectAnswer = currentQuestion.type === 'B'
        ? currentQuestion.options[selectedOption]
        : currentQuestion.type === 'C'
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

    // Calculate total questions dynamically based on whether this question repeats
    const nextQuestionsCount = willRepeat ? sessionQuestions.length + 1 : sessionQuestions.length;

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

      // Update user progress safely using deep copy
      if (progress) {
        const updatedProgress = { 
          ...progress,
          xp: (progress.xp || 0) + gainedXp,
          coins: (progress.coins || 0) + gainedCoins,
          completedWeeks: progress.completedWeeks ? [...progress.completedWeeks] : [],
          studyTime: progress.studyTime ? [...progress.studyTime] : [0, 0, 0, 0, 0, 0, 0]
        };
        
        if (finalScorePercent >= 80) {
          if (!updatedProgress.completedWeeks.includes(weekNumber)) {
            updatedProgress.completedWeeks.push(weekNumber);
          }
        }

        // Add today's study minutes to chart safely
        const todayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon ...
        const adjustedIdx = todayIndex === 0 ? 6 : todayIndex - 1; // Map Sun to index 6
        if (updatedProgress.studyTime && updatedProgress.studyTime[adjustedIdx] !== undefined) {
          updatedProgress.studyTime[adjustedIdx] += durationMin;
        }

        await saveProgress(updatedProgress);

        // Write B2B Audit Log safely
        await addLog({
          duration: durationMin,
          activity: sessionType === 'exam' ? `Ujian Mingguan (Week ${weekNumber}): Skor ${finalScorePercent}%` : `Latihan Mandiri (Week ${weekNumber})`,
          lpkId: progress.lpkId || 'lpk_a',
          isAlumni: false
        });
      }
    } catch (err) {
      console.error('Error saving session stats to local DB:', err);
    } finally {
      // ALWAYS set the step to result so the user never gets a blank screen!
      setStep('result');
    }
  };

  // Reset and restart the current learning session
  const retrySession = async () => {
    try {
      const qs = await getQuestionsByWeek(weekNumber);
      const vs = await getVocabByWeek(weekNumber);
      const sessionQs = generateQuestionsForSession(qs, vs, weekNumber);
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

  // Render Loading Screen while session questions are being generated
  if (sessionQuestions.length === 0) {
    return (
      <div className="screen-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }} />
          <p className="body-md">Memuat pertanyaan...</p>
        </div>
      </div>
    );
  }

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
                      
                      {q.type === 'B' && q.options && (
                        <div style={{ marginTop: '6px', fontSize: '13px' }}>
                          <p style={{ color: 'var(--tertiary)', margin: 0 }}>Pilihan Anda: <strong style={{ textDecoration: 'line-through' }}>{item.userAnswer}</strong></p>
                          <p style={{ color: 'var(--secondary)', margin: '2px 0 0 0', fontWeight: '600' }}>
                            Jawaban Benar: {q.options[q.answer]}
                          </p>
                        </div>
                      )}
                      
                      {q.type === 'C' && (
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
            {weekNumber < 12 && passed && (
              <button 
                className="btn btn-primary" 
                onClick={() => onEndSession(weekNumber + 1)}
                style={{ width: '100%', padding: '10px' }}
              >
                Lanjut ke Hari {weekNumber + 1} ➔
              </button>
            )}
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
                          textAlign: 'center'
                        }}
                        onClick={() => handleMatchSelect('left', leftItem)}
                      >
                        {leftItem.text}
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

          {/* Tipe B: Listening */}
          {currentQuestion.type === 'B' && (
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
                {currentQuestion.options.map((opt, idx) => {
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
                <p className="body-md" style={{ marginTop: '4px' }}>Arti: {currentQuestion.meaning}</p>
              </div>

              <input
                type="text"
                className="input-field"
                placeholder="Ketik ejaan Romaji..."
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                disabled={isAnswerChecked}
              />
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
                  onClick={() => speakText(currentQuestion.targetJa)}
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
                  <p className="body-lg" style={{ fontWeight: '700', color: 'var(--primary)', marginTop: '4px' }}>
                    "{(isAnswerChecked && isCorrect) ? currentQuestion.targetJa : shadowingResult}"
                  </p>
                </div>
              )}

              {/* Tip for very short words (1-2 chars) */}
              {currentQuestion.targetJa && currentQuestion.targetJa.replace(/[\s、。]/g, '').length <= 2 && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '12px var(--space-gutter)', 
                  backgroundColor: 'var(--surface-container-low)', 
                  borderRadius: 'var(--radius-default)', 
                  borderLeft: '4px solid var(--primary)',
                  textAlign: 'left',
                  width: '100%'
                }}>
                  <p className="body-md" style={{ color: 'var(--on-surface-variant)', fontSize: '12px', lineHeight: '1.4', margin: 0 }}>
                    💡 <strong>Tip:</strong> Karena kata ini sangat pendek, ucapkan agak panjang (seperti <strong>"{currentQuestion.romaji || 'me'}..."</strong>) atau katakan dengan tambahan <strong>"desu"</strong> (seperti <strong>"{(currentQuestion.romaji || 'me').toLowerCase()} desu"</strong>) agar mikrofon browser lebih mudah menangkap suara Anda.
                  </p>
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
            disabled={currentQuestion.type === 'B' ? selectedOption === null : typedInput.trim() === ''}
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
                <button className="audio-btn" onClick={() => speakText(currentQuestion.explanation.word, 1.0)}>
                  1.0x
                </button>
                <button className="audio-btn" onClick={() => speakText(currentQuestion.explanation.word, 0.5)}>
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
              {isCorrect && currentQuestion.type === 'C' && typedInput.trim().toLowerCase() !== currentQuestion.targetRomaji.toLowerCase() && (
                <p className="body-md" style={{ color: '#065f46', margin: '2px 0 0 0', fontWeight: '600', fontSize: '12px' }}>
                  Ada sedikit salah ketik. Ejaan resmi: <strong style={{ textDecoration: 'underline' }}>{currentQuestion.targetRomaji}</strong> ({currentQuestion.targetJa})
                </p>
              )}
              {!isCorrect && currentQuestion.type === 'B' && (
                <p className="body-md" style={{ color: 'var(--tertiary)', margin: '1px 0 0 0', fontSize: '12px' }}>
                  Jawaban benar: {currentQuestion.options[currentQuestion.answer]}
                </p>
              )}
              {!isCorrect && currentQuestion.type === 'C' && (
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
