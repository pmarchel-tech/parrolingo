import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, CheckCircle, XCircle, ArrowRight, X, Play, RefreshCw, Lock, Award, ShieldAlert } from 'lucide-react';
import { saveProgress, addLog, getVoiceSignature } from '../utils/db';

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

// Mock questions database for all 12 weeks
const QUESTIONS_BY_WEEK = {
  "1": [
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "おはようございます",
      "options": [
        "おやすみなさい (o-ya-su-mi-na-sa-i)",
        "おはようございます (o-ha-you go-za-i-ma-su)",
        "こんにちは (kon-ni-chi-wa)"
      ],
      "answer": 1,
      "explanation": {
        "word": "おはようございます",
        "romaji": "",
        "translation": "Selamat Pagi",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "A",
      "prompt": "Cocokkan angka-angka berikut dengan artinya!",
      "pairs": [
        {
          "ja": "いち (Ichi)",
          "id": "Satu"
        },
        {
          "ja": "に (Ni)",
          "id": "Dua"
        },
        {
          "ja": "さん (San)",
          "id": "Tiga"
        },
        {
          "ja": "じゅう (Juu)",
          "id": "Sepuluh"
        }
      ]
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "こんにちは",
      "options": [
        "Selamat Pagi",
        "Selamat Siang / Halo",
        "Selamat Malam"
      ],
      "answer": 1,
      "explanation": {
        "word": "こんにちは",
        "romaji": "",
        "translation": "Selamat Siang / Halo",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "konnichiwa",
      "targetJa": "こんにちは",
      "meaning": "Selamat Siang"
    },
    {
      "type": "B",
      "prompt": "Dengar dan tentukan artinya!",
      "audioText": "おやすみなさい",
      "options": [
        "Selamat Malam / Selamat Tidur",
        "Terima kasih",
        "Sama-sama"
      ],
      "answer": 0,
      "explanation": {
        "word": "おやすみなさい",
        "romaji": "",
        "translation": "Selamat Malam / Selamat Tidur",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "A",
      "prompt": "Cocokkan angka-angka lanjutan berikut!",
      "pairs": [
        {
          "ja": "よん (Yon)",
          "id": "Empat"
        },
        {
          "ja": "ご (Go)",
          "id": "Lima"
        },
        {
          "ja": "ろく (Roku)",
          "id": "Enam"
        },
        {
          "ja": "なな (Nana)",
          "id": "Tujuh"
        }
      ]
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk salam tidur!",
      "targetRomaji": "oyasuminasai",
      "targetJa": "おやすみなさい",
      "meaning": "Selamat Tidur"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "こんにちは",
      "romaji": "",
      "meaning": "Selamat Siang"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "おやすみなさい",
      "romaji": "",
      "meaning": "Selamat Tidur"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "いち",
      "options": [
        "に (Ni)",
        "いち (Ichi)",
        "さん (San)"
      ],
      "answer": 1,
      "explanation": {
        "word": "いち",
        "romaji": "",
        "translation": "Satu",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "いち",
      "options": [
        "Dua",
        "Satu",
        "Tiga"
      ],
      "answer": 1,
      "explanation": {
        "word": "いち",
        "romaji": "",
        "translation": "Satu",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "ichi",
      "targetJa": "いち",
      "meaning": "Satu"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "いち",
      "romaji": "",
      "meaning": "Satu"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "に",
      "options": [
        "さん (San)",
        "に (Ni)",
        "し / よん (Shi / Yon)"
      ],
      "answer": 1,
      "explanation": {
        "word": "に",
        "romaji": "",
        "translation": "Dua",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "に",
      "options": [
        "Tiga",
        "Dua",
        "Empat"
      ],
      "answer": 1,
      "explanation": {
        "word": "に",
        "romaji": "",
        "translation": "Dua",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "ni",
      "targetJa": "に",
      "meaning": "Dua"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "に",
      "romaji": "",
      "meaning": "Dua"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "さん",
      "options": [
        "し / よん (Shi / Yon)",
        "さん (San)",
        "ご (Go)"
      ],
      "answer": 1,
      "explanation": {
        "word": "さん",
        "romaji": "",
        "translation": "Tiga",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "さん",
      "options": [
        "Empat",
        "Tiga",
        "Lima"
      ],
      "answer": 1,
      "explanation": {
        "word": "さん",
        "romaji": "",
        "translation": "Tiga",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "san",
      "targetJa": "さん",
      "meaning": "Tiga"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "さん",
      "romaji": "",
      "meaning": "Tiga"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "し / よん",
      "options": [
        "ご (Go)",
        "し / よん (Shi / Yon)",
        "ろく (Roku)"
      ],
      "answer": 1,
      "explanation": {
        "word": "し / よん",
        "romaji": "",
        "translation": "Empat",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "し / よん",
      "options": [
        "Lima",
        "Empat",
        "Enam"
      ],
      "answer": 1,
      "explanation": {
        "word": "し / よん",
        "romaji": "",
        "translation": "Empat",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "shi / yon",
      "targetJa": "し / よん",
      "meaning": "Empat"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "し / よん",
      "romaji": "",
      "meaning": "Empat"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "ご",
      "options": [
        "ろく (Roku)",
        "ご (Go)",
        "しち / なな (Shichi / Nana)"
      ],
      "answer": 1,
      "explanation": {
        "word": "ご",
        "romaji": "",
        "translation": "Lima",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "ご",
      "options": [
        "Enam",
        "Lima",
        "Tujuh"
      ],
      "answer": 1,
      "explanation": {
        "word": "ご",
        "romaji": "",
        "translation": "Lima",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "go",
      "targetJa": "ご",
      "meaning": "Lima"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "ご",
      "romaji": "",
      "meaning": "Lima"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "ろく",
      "options": [
        "しち / なな (Shichi / Nana)",
        "ろく (Roku)",
        "はち (Hachi)"
      ],
      "answer": 1,
      "explanation": {
        "word": "ろく",
        "romaji": "",
        "translation": "Enam",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "ろく",
      "options": [
        "Tujuh",
        "Enam",
        "Delapan"
      ],
      "answer": 1,
      "explanation": {
        "word": "ろく",
        "romaji": "",
        "translation": "Enam",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "roku",
      "targetJa": "ろく",
      "meaning": "Enam"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "ろく",
      "romaji": "",
      "meaning": "Enam"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "しち / なな",
      "options": [
        "はち (Hachi)",
        "しち / なな (Shichi / Nana)",
        "きゅう / く (Kyuu / Ku)"
      ],
      "answer": 1,
      "explanation": {
        "word": "しち / なな",
        "romaji": "",
        "translation": "Tujuh",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "しち / なな",
      "options": [
        "Delapan",
        "Tujuh",
        "Sembilan"
      ],
      "answer": 1,
      "explanation": {
        "word": "しち / なな",
        "romaji": "",
        "translation": "Tujuh",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "shichi / nana",
      "targetJa": "しち / なな",
      "meaning": "Tujuh"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "しち / なな",
      "romaji": "",
      "meaning": "Tujuh"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "はち",
      "options": [
        "きゅう / く (Kyuu / Ku)",
        "はち (Hachi)",
        "じゅう (Juu)"
      ],
      "answer": 1,
      "explanation": {
        "word": "はち",
        "romaji": "",
        "translation": "Delapan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "はち",
      "options": [
        "Sembilan",
        "Delapan",
        "Sepuluh"
      ],
      "answer": 1,
      "explanation": {
        "word": "はち",
        "romaji": "",
        "translation": "Delapan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "hachi",
      "targetJa": "はち",
      "meaning": "Delapan"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "はち",
      "romaji": "",
      "meaning": "Delapan"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "きゅう / く",
      "options": [
        "じゅう (Juu)",
        "きゅう / く (Kyuu / Ku)",
        "おはよう ございます (Ohayou gozaimasu)"
      ],
      "answer": 1,
      "explanation": {
        "word": "きゅう / く",
        "romaji": "",
        "translation": "Sembilan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "きゅう / く",
      "options": [
        "Sepuluh",
        "Sembilan",
        "Selamat pagi (Diucapkan saat mulai masuk kerja)"
      ],
      "answer": 1,
      "explanation": {
        "word": "きゅう / く",
        "romaji": "",
        "translation": "Sembilan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "kyuu / ku",
      "targetJa": "きゅう / く",
      "meaning": "Sembilan"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "きゅう / く",
      "romaji": "",
      "meaning": "Sembilan"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "じゅう",
      "options": [
        "おはよう ございます (Ohayou gozaimasu)",
        "じゅう (Juu)",
        "こんにちは (Konnichiwa)"
      ],
      "answer": 1,
      "explanation": {
        "word": "じゅう",
        "romaji": "",
        "translation": "Sepuluh",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "じゅう",
      "options": [
        "Selamat pagi (Diucapkan saat mulai masuk kerja)",
        "Sepuluh",
        "Selamat siang / sore"
      ],
      "answer": 1,
      "explanation": {
        "word": "じゅう",
        "romaji": "",
        "translation": "Sepuluh",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "juu",
      "targetJa": "じゅう",
      "meaning": "Sepuluh"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "じゅう",
      "romaji": "",
      "meaning": "Sepuluh"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "おはよう ございます",
      "options": [
        "こんにちは (Konnichiwa)",
        "おはよう ございます (Ohayou gozaimasu)",
        "こんばんは (Konbanwa)"
      ],
      "answer": 1,
      "explanation": {
        "word": "おはよう ございます",
        "romaji": "",
        "translation": "Selamat pagi (Diucapkan saat mulai masuk kerja)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "おはよう ございます",
      "options": [
        "Selamat siang / sore",
        "Selamat pagi (Diucapkan saat mulai masuk kerja)",
        "Selamat malam"
      ],
      "answer": 1,
      "explanation": {
        "word": "おはよう ございます",
        "romaji": "",
        "translation": "Selamat pagi (Diucapkan saat mulai masuk kerja)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "ohayou gozaimasu",
      "targetJa": "おはよう ございます",
      "meaning": "Selamat pagi (Diucapkan saat mulai masuk kerja)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "おはよう ございます",
      "romaji": "",
      "meaning": "Selamat pagi (Diucapkan saat mulai masuk kerja)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "こんにちは",
      "options": [
        "こんばんは (Konbanwa)",
        "こんにちは (Konnichiwa)",
        "おやすみなさい (Oyasuminasai)"
      ],
      "answer": 1,
      "explanation": {
        "word": "こんにちは",
        "romaji": "",
        "translation": "Selamat siang / sore",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "こんにちは",
      "options": [
        "Selamat malam",
        "Selamat siang / sore",
        "Selamat tidur (Sering digunakan saat menidurkan lansia)"
      ],
      "answer": 1,
      "explanation": {
        "word": "こんにちは",
        "romaji": "",
        "translation": "Selamat siang / sore",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "konnichiwa",
      "targetJa": "こんにちは",
      "meaning": "Selamat siang / sore"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "こんにちは",
      "romaji": "",
      "meaning": "Selamat siang / sore"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "こんばんは",
      "options": [
        "おやすみなさい (Oyasuminasai)",
        "こんばんは (Konbanwa)",
        "さようなら (Sayounara)"
      ],
      "answer": 1,
      "explanation": {
        "word": "こんばんは",
        "romaji": "",
        "translation": "Selamat malam",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "こんばんは",
      "options": [
        "Selamat tidur (Sering digunakan saat menidurkan lansia)",
        "Selamat malam",
        "Selamat tinggal / Sampai jumpa"
      ],
      "answer": 1,
      "explanation": {
        "word": "こんばんは",
        "romaji": "",
        "translation": "Selamat malam",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "konbanwa",
      "targetJa": "こんばんは",
      "meaning": "Selamat malam"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "こんばんは",
      "romaji": "",
      "meaning": "Selamat malam"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "おやすみなさい",
      "options": [
        "さようなら (Sayounara)",
        "おやすみなさい (Oyasuminasai)",
        "はい (Hai)"
      ],
      "answer": 1,
      "explanation": {
        "word": "おやすみなさい",
        "romaji": "",
        "translation": "Selamat tidur (Sering digunakan saat menidurkan lansia)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "おやすみなさい",
      "options": [
        "Selamat tinggal / Sampai jumpa",
        "Selamat tidur (Sering digunakan saat menidurkan lansia)",
        "Ya / Baik (Jawaban refleks utama saat dipanggil)"
      ],
      "answer": 1,
      "explanation": {
        "word": "おやすみなさい",
        "romaji": "",
        "translation": "Selamat tidur (Sering digunakan saat menidurkan lansia)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "oyasuminasai",
      "targetJa": "おやすみなさい",
      "meaning": "Selamat tidur (Sering digunakan saat menidurkan lansia)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "おやすみなさい",
      "romaji": "",
      "meaning": "Selamat tidur (Sering digunakan saat menidurkan lansia)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "さようなら",
      "options": [
        "はい (Hai)",
        "さようなら (Sayounara)",
        "いいえ (Iie)"
      ],
      "answer": 1,
      "explanation": {
        "word": "さようなら",
        "romaji": "",
        "translation": "Selamat tinggal / Sampai jumpa",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "さようなら",
      "options": [
        "Ya / Baik (Jawaban refleks utama saat dipanggil)",
        "Selamat tinggal / Sampai jumpa",
        "Tidak / Bukan"
      ],
      "answer": 1,
      "explanation": {
        "word": "さようなら",
        "romaji": "",
        "translation": "Selamat tinggal / Sampai jumpa",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "sayounara",
      "targetJa": "さようなら",
      "meaning": "Selamat tinggal / Sampai jumpa"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "さようなら",
      "romaji": "",
      "meaning": "Selamat tinggal / Sampai jumpa"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "はい",
      "options": [
        "いいえ (Iie)",
        "はい (Hai)",
        "みず (Mizu)"
      ],
      "answer": 1,
      "explanation": {
        "word": "はい",
        "romaji": "",
        "translation": "Ya / Baik (Jawaban refleks utama saat dipanggil)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "はい",
      "options": [
        "Tidak / Bukan",
        "Ya / Baik (Jawaban refleks utama saat dipanggil)",
        "Air putih (Paling sering diminta oleh lansia)"
      ],
      "answer": 1,
      "explanation": {
        "word": "はい",
        "romaji": "",
        "translation": "Ya / Baik (Jawaban refleks utama saat dipanggil)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "hai",
      "targetJa": "はい",
      "meaning": "Ya / Baik (Jawaban refleks utama saat dipanggil)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "はい",
      "romaji": "",
      "meaning": "Ya / Baik (Jawaban refleks utama saat dipanggil)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "いいえ",
      "options": [
        "みず (Mizu)",
        "いいえ (Iie)",
        "おちゃ (Ocha)"
      ],
      "answer": 1,
      "explanation": {
        "word": "いいえ",
        "romaji": "",
        "translation": "Tidak / Bukan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "いいえ",
      "options": [
        "Air putih (Paling sering diminta oleh lansia)",
        "Tidak / Bukan",
        "Teh Jepang"
      ],
      "answer": 1,
      "explanation": {
        "word": "いいえ",
        "romaji": "",
        "translation": "Tidak / Bukan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "iie",
      "targetJa": "いいえ",
      "meaning": "Tidak / Bukan"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "いいえ",
      "romaji": "",
      "meaning": "Tidak / Bukan"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "みず",
      "options": [
        "おちゃ (Ocha)",
        "みず (Mizu)",
        "ごはん (Gohan)"
      ],
      "answer": 1,
      "explanation": {
        "word": "みず",
        "romaji": "",
        "translation": "Air putih (Paling sering diminta oleh lansia)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "みず",
      "options": [
        "Teh Jepang",
        "Air putih (Paling sering diminta oleh lansia)",
        "Nasi / Makanan"
      ],
      "answer": 1,
      "explanation": {
        "word": "みず",
        "romaji": "",
        "translation": "Air putih (Paling sering diminta oleh lansia)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "mizu",
      "targetJa": "みず",
      "meaning": "Air putih (Paling sering diminta oleh lansia)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "みず",
      "romaji": "",
      "meaning": "Air putih (Paling sering diminta oleh lansia)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "おちゃ",
      "options": [
        "ごはん (Gohan)",
        "おちゃ (Ocha)",
        "くすり (Kusuri)"
      ],
      "answer": 1,
      "explanation": {
        "word": "おちゃ",
        "romaji": "",
        "translation": "Teh Jepang",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "おちゃ",
      "options": [
        "Nasi / Makanan",
        "Teh Jepang",
        "Obat"
      ],
      "answer": 1,
      "explanation": {
        "word": "おちゃ",
        "romaji": "",
        "translation": "Teh Jepang",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "ocha",
      "targetJa": "おちゃ",
      "meaning": "Teh Jepang"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "おちゃ",
      "romaji": "",
      "meaning": "Teh Jepang"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "ごはん",
      "options": [
        "くすり (Kusuri)",
        "ごはん (Gohan)",
        "トイレ (Toire)"
      ],
      "answer": 1,
      "explanation": {
        "word": "ごはん",
        "romaji": "",
        "translation": "Nasi / Makanan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "ごはん",
      "options": [
        "Obat",
        "Nasi / Makanan",
        "Toilet"
      ],
      "answer": 1,
      "explanation": {
        "word": "ごはん",
        "romaji": "",
        "translation": "Nasi / Makanan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "gohan",
      "targetJa": "ごはん",
      "meaning": "Nasi / Makanan"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "ごはん",
      "romaji": "",
      "meaning": "Nasi / Makanan"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "くすり",
      "options": [
        "トイレ (Toire)",
        "くすり (Kusuri)",
        "いす (Isu)"
      ],
      "answer": 1,
      "explanation": {
        "word": "くすり",
        "romaji": "",
        "translation": "Obat",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "くすり",
      "options": [
        "Toilet",
        "Obat",
        "Kursi"
      ],
      "answer": 1,
      "explanation": {
        "word": "くすり",
        "romaji": "",
        "translation": "Obat",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "kusuri",
      "targetJa": "くすり",
      "meaning": "Obat"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "くすり",
      "romaji": "",
      "meaning": "Obat"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "トイレ",
      "options": [
        "いす (Isu)",
        "トイレ (Toire)",
        "て (Te)"
      ],
      "answer": 1,
      "explanation": {
        "word": "トイレ",
        "romaji": "",
        "translation": "Toilet",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "トイレ",
      "options": [
        "Kursi",
        "Toilet",
        "Tangan"
      ],
      "answer": 1,
      "explanation": {
        "word": "トイレ",
        "romaji": "",
        "translation": "Toilet",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "toire",
      "targetJa": "トイレ",
      "meaning": "Toilet"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "トイレ",
      "romaji": "",
      "meaning": "Toilet"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "いす",
      "options": [
        "て (Te)",
        "いす (Isu)",
        "め (Me)"
      ],
      "answer": 1,
      "explanation": {
        "word": "いす",
        "romaji": "",
        "translation": "Kursi",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "いす",
      "options": [
        "Tangan",
        "Kursi",
        "Mata"
      ],
      "answer": 1,
      "explanation": {
        "word": "いす",
        "romaji": "",
        "translation": "Kursi",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "isu",
      "targetJa": "いす",
      "meaning": "Kursi"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "いす",
      "romaji": "",
      "meaning": "Kursi"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "て",
      "options": [
        "め (Me)",
        "て (Te)",
        "ひ (Hi)"
      ],
      "answer": 1,
      "explanation": {
        "word": "て",
        "romaji": "",
        "translation": "Tangan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "て",
      "options": [
        "Mata",
        "Tangan",
        "Matahari / Api"
      ],
      "answer": 1,
      "explanation": {
        "word": "て",
        "romaji": "",
        "translation": "Tangan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "te",
      "targetJa": "て",
      "meaning": "Tangan"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "て",
      "romaji": "",
      "meaning": "Tangan"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "め",
      "options": [
        "ひ (Hi)",
        "め (Me)",
        "つき (Tsuki)"
      ],
      "answer": 1,
      "explanation": {
        "word": "め",
        "romaji": "",
        "translation": "Mata",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "め",
      "options": [
        "Matahari / Api",
        "Mata",
        "Bulan"
      ],
      "answer": 1,
      "explanation": {
        "word": "め",
        "romaji": "",
        "translation": "Mata",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "me",
      "targetJa": "め",
      "meaning": "Mata"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "め",
      "romaji": "",
      "meaning": "Mata"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "ひ",
      "options": [
        "つき (Tsuki)",
        "ひ (Hi)",
        "やま (Yama)"
      ],
      "answer": 1,
      "explanation": {
        "word": "ひ",
        "romaji": "",
        "translation": "Matahari / Api",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "ひ",
      "options": [
        "Bulan",
        "Matahari / Api",
        "Gunung"
      ],
      "answer": 1,
      "explanation": {
        "word": "ひ",
        "romaji": "",
        "translation": "Matahari / Api",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "hi",
      "targetJa": "ひ",
      "meaning": "Matahari / Api"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "ひ",
      "romaji": "",
      "meaning": "Matahari / Api"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "つき",
      "options": [
        "やま (Yama)",
        "つき (Tsuki)",
        "うみ (Umi)"
      ],
      "answer": 1,
      "explanation": {
        "word": "つき",
        "romaji": "",
        "translation": "Bulan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "つき",
      "options": [
        "Gunung",
        "Bulan",
        "Laut"
      ],
      "answer": 1,
      "explanation": {
        "word": "つき",
        "romaji": "",
        "translation": "Bulan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "tsuki",
      "targetJa": "つき",
      "meaning": "Bulan"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "つき",
      "romaji": "",
      "meaning": "Bulan"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "やま",
      "options": [
        "うみ (Umi)",
        "やま (Yama)",
        "みどり (Midori)"
      ],
      "answer": 1,
      "explanation": {
        "word": "やま",
        "romaji": "",
        "translation": "Gunung",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "やま",
      "options": [
        "Laut",
        "Gunung",
        "Tanaman / Hijau"
      ],
      "answer": 1,
      "explanation": {
        "word": "やま",
        "romaji": "",
        "translation": "Gunung",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "yama",
      "targetJa": "やま",
      "meaning": "Gunung"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "やま",
      "romaji": "",
      "meaning": "Gunung"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "うみ",
      "options": [
        "みどり (Midori)",
        "うみ (Umi)",
        "やさい (Yasai)"
      ],
      "answer": 1,
      "explanation": {
        "word": "うみ",
        "romaji": "",
        "translation": "Laut",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "うみ",
      "options": [
        "Tanaman / Hijau",
        "Laut",
        "Sayur"
      ],
      "answer": 1,
      "explanation": {
        "word": "うみ",
        "romaji": "",
        "translation": "Laut",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "umi",
      "targetJa": "うみ",
      "meaning": "Laut"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "うみ",
      "romaji": "",
      "meaning": "Laut"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "みどり",
      "options": [
        "やさい (Yasai)",
        "みどり (Midori)",
        "くだもの (Kudamono)"
      ],
      "answer": 1,
      "explanation": {
        "word": "みどり",
        "romaji": "",
        "translation": "Tanaman / Hijau",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "みどり",
      "options": [
        "Sayur",
        "Tanaman / Hijau",
        "Buah"
      ],
      "answer": 1,
      "explanation": {
        "word": "みどり",
        "romaji": "",
        "translation": "Tanaman / Hijau",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "midori",
      "targetJa": "みどり",
      "meaning": "Tanaman / Hijau"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "みどり",
      "romaji": "",
      "meaning": "Tanaman / Hijau"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "やさい",
      "options": [
        "くだもの (Kudamono)",
        "やさい (Yasai)",
        "あつい (Atsui)"
      ],
      "answer": 1,
      "explanation": {
        "word": "やさい",
        "romaji": "",
        "translation": "Sayur",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "やさい",
      "options": [
        "Buah",
        "Sayur",
        "Panas (Kondisi air minum atau sup makanan lansia)"
      ],
      "answer": 1,
      "explanation": {
        "word": "やさい",
        "romaji": "",
        "translation": "Sayur",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "yasai",
      "targetJa": "やさい",
      "meaning": "Sayur"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "やさい",
      "romaji": "",
      "meaning": "Sayur"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "くだもの",
      "options": [
        "あつい (Atsui)",
        "くだもの (Kudamono)",
        "つめたい (Tsumetai)"
      ],
      "answer": 1,
      "explanation": {
        "word": "くだもの",
        "romaji": "",
        "translation": "Buah",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "くだもの",
      "options": [
        "Panas (Kondisi air minum atau sup makanan lansia)",
        "Buah",
        "Dingin (Kondisi air minum atau kompres pasien)"
      ],
      "answer": 1,
      "explanation": {
        "word": "くだもの",
        "romaji": "",
        "translation": "Buah",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "kudamono",
      "targetJa": "くだもの",
      "meaning": "Buah"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "くだもの",
      "romaji": "",
      "meaning": "Buah"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "あつい",
      "options": [
        "つめたい (Tsumetai)",
        "あつい (Atsui)",
        "へや (Heya)"
      ],
      "answer": 1,
      "explanation": {
        "word": "あつい",
        "romaji": "",
        "translation": "Panas (Kondisi air minum atau sup makanan lansia)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "あつい",
      "options": [
        "Dingin (Kondisi air minum atau kompres pasien)",
        "Panas (Kondisi air minum atau sup makanan lansia)",
        "Kamar / Ruangan"
      ],
      "answer": 1,
      "explanation": {
        "word": "あつい",
        "romaji": "",
        "translation": "Panas (Kondisi air minum atau sup makanan lansia)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "atsui",
      "targetJa": "あつい",
      "meaning": "Panas (Kondisi air minum atau sup makanan lansia)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "あつい",
      "romaji": "",
      "meaning": "Panas (Kondisi air minum atau sup makanan lansia)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "つめたい",
      "options": [
        "へや (Heya)",
        "つめたい (Tsumetai)",
        "ありがとう ございます (Arigatou gozaimasu)"
      ],
      "answer": 1,
      "explanation": {
        "word": "つめたい",
        "romaji": "",
        "translation": "Dingin (Kondisi air minum atau kompres pasien)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "つめたい",
      "options": [
        "Kamar / Ruangan",
        "Dingin (Kondisi air minum atau kompres pasien)",
        "Terima kasih banyak"
      ],
      "answer": 1,
      "explanation": {
        "word": "つめたい",
        "romaji": "",
        "translation": "Dingin (Kondisi air minum atau kompres pasien)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "tsumetai",
      "targetJa": "つめたい",
      "meaning": "Dingin (Kondisi air minum atau kompres pasien)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "つめたい",
      "romaji": "",
      "meaning": "Dingin (Kondisi air minum atau kompres pasien)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "へや",
      "options": [
        "ありがとう ございます (Arigatou gozaimasu)",
        "へや (Heya)",
        "すみません (Sumimasen)"
      ],
      "answer": 1,
      "explanation": {
        "word": "へや",
        "romaji": "",
        "translation": "Kamar / Ruangan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "へや",
      "options": [
        "Terima kasih banyak",
        "Kamar / Ruangan",
        "Permisi / Maaf"
      ],
      "answer": 1,
      "explanation": {
        "word": "へや",
        "romaji": "",
        "translation": "Kamar / Ruangan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "heya",
      "targetJa": "へや",
      "meaning": "Kamar / Ruangan"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "へや",
      "romaji": "",
      "meaning": "Kamar / Ruangan"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "ありがとう ございます",
      "options": [
        "すみません (Sumimasen)",
        "ありがとう ございます (Arigatou gozaimasu)",
        "どうぞ (Douzo)"
      ],
      "answer": 1,
      "explanation": {
        "word": "ありがとう ございます",
        "romaji": "",
        "translation": "Terima kasih banyak",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "ありがとう ございます",
      "options": [
        "Permisi / Maaf",
        "Terima kasih banyak",
        "Silakan"
      ],
      "answer": 1,
      "explanation": {
        "word": "ありがとう ございます",
        "romaji": "",
        "translation": "Terima kasih banyak",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "arigatou gozaimasu",
      "targetJa": "ありがとう ございます",
      "meaning": "Terima kasih banyak"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "ありがとう ございます",
      "romaji": "",
      "meaning": "Terima kasih banyak"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "すみません",
      "options": [
        "どうぞ (Douzo)",
        "すみません (Sumimasen)",
        "これ (Kore)"
      ],
      "answer": 1,
      "explanation": {
        "word": "すみません",
        "romaji": "",
        "translation": "Permisi / Maaf",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "すみません",
      "options": [
        "Silakan",
        "Permisi / Maaf",
        "Ini (Menunjuk barang di dekat pekerja)"
      ],
      "answer": 1,
      "explanation": {
        "word": "すみません",
        "romaji": "",
        "translation": "Permisi / Maaf",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "sumimasen",
      "targetJa": "すみません",
      "meaning": "Permisi / Maaf"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "すみません",
      "romaji": "",
      "meaning": "Permisi / Maaf"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "どうぞ",
      "options": [
        "これ (Kore)",
        "どうぞ (Douzo)",
        "それ (Sore)"
      ],
      "answer": 1,
      "explanation": {
        "word": "どうぞ",
        "romaji": "",
        "translation": "Silakan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "どうぞ",
      "options": [
        "Ini (Menunjuk barang di dekat pekerja)",
        "Silakan",
        "Itu (Menunjuk barang di dekat lansia/atasan)"
      ],
      "answer": 1,
      "explanation": {
        "word": "どうぞ",
        "romaji": "",
        "translation": "Silakan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "douzo",
      "targetJa": "どうぞ",
      "meaning": "Silakan"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "どうぞ",
      "romaji": "",
      "meaning": "Silakan"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "これ",
      "options": [
        "それ (Sore)",
        "これ (Kore)",
        "あれ (Are)"
      ],
      "answer": 1,
      "explanation": {
        "word": "これ",
        "romaji": "",
        "translation": "Ini (Menunjuk barang di dekat pekerja)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "これ",
      "options": [
        "Itu (Menunjuk barang di dekat lansia/atasan)",
        "Ini (Menunjuk barang di dekat pekerja)",
        "Itu (Menunjuk barang yang jauh dari keduanya)"
      ],
      "answer": 1,
      "explanation": {
        "word": "これ",
        "romaji": "",
        "translation": "Ini (Menunjuk barang di dekat pekerja)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "kore",
      "targetJa": "これ",
      "meaning": "Ini (Menunjuk barang di dekat pekerja)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "これ",
      "romaji": "",
      "meaning": "Ini (Menunjuk barang di dekat pekerja)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "それ",
      "options": [
        "あれ (Are)",
        "それ (Sore)",
        "だめ (Dame)"
      ],
      "answer": 1,
      "explanation": {
        "word": "それ",
        "romaji": "",
        "translation": "Itu (Menunjuk barang di dekat lansia/atasan)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "それ",
      "options": [
        "Itu (Menunjuk barang yang jauh dari keduanya)",
        "Itu (Menunjuk barang di dekat lansia/atasan)",
        "Jangan / Tidak boleh (Penting untuk mencegah lansia bahaya)"
      ],
      "answer": 1,
      "explanation": {
        "word": "それ",
        "romaji": "",
        "translation": "Itu (Menunjuk barang di dekat lansia/atasan)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "sore",
      "targetJa": "それ",
      "meaning": "Itu (Menunjuk barang di dekat lansia/atasan)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "それ",
      "romaji": "",
      "meaning": "Itu (Menunjuk barang di dekat lansia/atasan)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "あれ",
      "options": [
        "だめ (Dame)",
        "あれ (Are)",
        "あぶない (Abunai)"
      ],
      "answer": 1,
      "explanation": {
        "word": "あれ",
        "romaji": "",
        "translation": "Itu (Menunjuk barang yang jauh dari keduanya)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "あれ",
      "options": [
        "Jangan / Tidak boleh (Penting untuk mencegah lansia bahaya)",
        "Itu (Menunjuk barang yang jauh dari keduanya)",
        "Bahaya!"
      ],
      "answer": 1,
      "explanation": {
        "word": "あれ",
        "romaji": "",
        "translation": "Itu (Menunjuk barang yang jauh dari keduanya)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "are",
      "targetJa": "あれ",
      "meaning": "Itu (Menunjuk barang yang jauh dari keduanya)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "あれ",
      "romaji": "",
      "meaning": "Itu (Menunjuk barang yang jauh dari keduanya)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "だめ",
      "options": [
        "あぶない (Abunai)",
        "だめ (Dame)",
        "ちょっと まって (Chotto matte)"
      ],
      "answer": 1,
      "explanation": {
        "word": "だめ",
        "romaji": "",
        "translation": "Jangan / Tidak boleh (Penting untuk mencegah lansia bahaya)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "だめ",
      "options": [
        "Bahaya!",
        "Jangan / Tidak boleh (Penting untuk mencegah lansia bahaya)",
        "Tunggu sebentar"
      ],
      "answer": 1,
      "explanation": {
        "word": "だめ",
        "romaji": "",
        "translation": "Jangan / Tidak boleh (Penting untuk mencegah lansia bahaya)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "dame",
      "targetJa": "だめ",
      "meaning": "Jangan / Tidak boleh (Penting untuk mencegah lansia bahaya)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "だめ",
      "romaji": "",
      "meaning": "Jangan / Tidak boleh (Penting untuk mencegah lansia bahaya)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "あぶない",
      "options": [
        "ちょっと まって (Chotto matte)",
        "あぶない (Abunai)",
        "きて ください (Kite kudasai)"
      ],
      "answer": 1,
      "explanation": {
        "word": "あぶない",
        "romaji": "",
        "translation": "Bahaya!",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "あぶない",
      "options": [
        "Tunggu sebentar",
        "Bahaya!",
        "Tolong kemari"
      ],
      "answer": 1,
      "explanation": {
        "word": "あぶない",
        "romaji": "",
        "translation": "Bahaya!",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "abunai",
      "targetJa": "あぶない",
      "meaning": "Bahaya!"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "あぶない",
      "romaji": "",
      "meaning": "Bahaya!"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "ちょっと まって",
      "options": [
        "きて ください (Kite kudasai)",
        "ちょっと まって (Chotto matte)",
        "わかります (Wakarimasu)"
      ],
      "answer": 1,
      "explanation": {
        "word": "ちょっと まって",
        "romaji": "",
        "translation": "Tunggu sebentar",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "ちょっと まって",
      "options": [
        "Tolong kemari",
        "Tunggu sebentar",
        "Paham / Mengerti"
      ],
      "answer": 1,
      "explanation": {
        "word": "ちょっと まって",
        "romaji": "",
        "translation": "Tunggu sebentar",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "chotto matte",
      "targetJa": "ちょっと まって",
      "meaning": "Tunggu sebentar"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "ちょっと まって",
      "romaji": "",
      "meaning": "Tunggu sebentar"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "きて ください",
      "options": [
        "わかります (Wakarimasu)",
        "きて ください (Kite kudasai)",
        "わかりません (Wakarimasen)"
      ],
      "answer": 1,
      "explanation": {
        "word": "きて ください",
        "romaji": "",
        "translation": "Tolong kemari",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "きて ください",
      "options": [
        "Paham / Mengerti",
        "Tolong kemari",
        "Tidak paham"
      ],
      "answer": 1,
      "explanation": {
        "word": "きて ください",
        "romaji": "",
        "translation": "Tolong kemari",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "kite kudasai",
      "targetJa": "きて ください",
      "meaning": "Tolong kemari"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "きて ください",
      "romaji": "",
      "meaning": "Tolong kemari"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "わかります",
      "options": [
        "わかりません (Wakarimasen)",
        "わかります (Wakarimasu)",
        "たすけて (Tasukete)"
      ],
      "answer": 1,
      "explanation": {
        "word": "わかります",
        "romaji": "",
        "translation": "Paham / Mengerti",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "わかります",
      "options": [
        "Tidak paham",
        "Paham / Mengerti",
        "Tolong saya! (Situasi darurat)"
      ],
      "answer": 1,
      "explanation": {
        "word": "わかります",
        "romaji": "",
        "translation": "Paham / Mengerti",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "wakarimasu",
      "targetJa": "わかります",
      "meaning": "Paham / Mengerti"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "わかります",
      "romaji": "",
      "meaning": "Paham / Mengerti"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "わかりません",
      "options": [
        "たすけて (Tasukete)",
        "わかりません (Wakarimasen)",
        "おわり (Owari)"
      ],
      "answer": 1,
      "explanation": {
        "word": "わかりません",
        "romaji": "",
        "translation": "Tidak paham",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "わかりません",
      "options": [
        "Tolong saya! (Situasi darurat)",
        "Tidak paham",
        "Selesai"
      ],
      "answer": 1,
      "explanation": {
        "word": "わかりません",
        "romaji": "",
        "translation": "Tidak paham",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "wakarimasen",
      "targetJa": "わかりません",
      "meaning": "Tidak paham"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "わかりません",
      "romaji": "",
      "meaning": "Tidak paham"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "たすけて",
      "options": [
        "おわり (Owari)",
        "たすけて (Tasukete)",
        "おつかれさま です (Otsukaresama desu)"
      ],
      "answer": 1,
      "explanation": {
        "word": "たすけて",
        "romaji": "",
        "translation": "Tolong saya! (Situasi darurat)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "たすけて",
      "options": [
        "Selesai",
        "Tolong saya! (Situasi darurat)",
        "Terima kasih atas kerja kerasnya (Diucapkan saat pulang sif)"
      ],
      "answer": 1,
      "explanation": {
        "word": "たすけて",
        "romaji": "",
        "translation": "Tolong saya! (Situasi darurat)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "tasukete",
      "targetJa": "たすけて",
      "meaning": "Tolong saya! (Situasi darurat)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "たすけて",
      "romaji": "",
      "meaning": "Tolong saya! (Situasi darurat)"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "おわり",
      "options": [
        "おつかれさま です (Otsukaresama desu)",
        "おわり (Owari)",
        "いち (Ichi)"
      ],
      "answer": 1,
      "explanation": {
        "word": "おわり",
        "romaji": "",
        "translation": "Selesai",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "おわり",
      "options": [
        "Terima kasih atas kerja kerasnya (Diucapkan saat pulang sif)",
        "Selesai",
        "Satu"
      ],
      "answer": 1,
      "explanation": {
        "word": "おわり",
        "romaji": "",
        "translation": "Selesai",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "owari",
      "targetJa": "おわり",
      "meaning": "Selesai"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "おわり",
      "romaji": "",
      "meaning": "Selesai"
    },
    {
      "type": "B",
      "prompt": "Apa yang diucapkan dalam audio tersebut?",
      "audioText": "おつかれさま です",
      "options": [
        "いち (Ichi)",
        "おつかれさま です (Otsukaresama desu)",
        "に (Ni)"
      ],
      "answer": 1,
      "explanation": {
        "word": "おつかれさま です",
        "romaji": "",
        "translation": "Terima kasih atas kerja kerasnya (Diucapkan saat pulang sif)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih arti yang tepat!",
      "audioText": "おつかれさま です",
      "options": [
        "Satu",
        "Terima kasih atas kerja kerasnya (Diucapkan saat pulang sif)",
        "Dua"
      ],
      "answer": 1,
      "explanation": {
        "word": "おつかれさま です",
        "romaji": "",
        "translation": "Terima kasih atas kerja kerasnya (Diucapkan saat pulang sif)",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik bunyi latin Romaji berikut dalam huruf Hiragana!",
      "targetRomaji": "otsukaresama desu",
      "targetJa": "おつかれさま です",
      "meaning": "Terima kasih atas kerja kerasnya (Diucapkan saat pulang sif)"
    },
    {
      "type": "D",
      "prompt": "Ucapkan kalimat berikut melalui mikrofon (Shadowing)!",
      "targetJa": "おつかれさま です",
      "romaji": "",
      "meaning": "Terima kasih atas kerja kerasnya (Diucapkan saat pulang sif)"
    }
  ],
  "2": [
    {
      "type": "B",
      "prompt": "Mendengar salam kerja: Apa artinya?",
      "audioText": "お疲れ様です",
      "options": [
        "Selamat pagi",
        "Terima kasih atas kerja keras Anda",
        "Permisi"
      ],
      "answer": 1,
      "explanation": {
        "word": "お疲れ様です",
        "romaji": "",
        "translation": "Terima kasih atas kerja keras Anda",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk kata permisi masuk ruangan!",
      "targetRomaji": "shitsureishimasu",
      "targetJa": "失礼します",
      "meaning": "Permisi"
    },
    {
      "type": "A",
      "prompt": "Cocokkan salam kerja berikut dengan tepat!",
      "pairs": [
        {
          "ja": "お邪魔します (Ojamashimasu)",
          "id": "Permisi (masuk kamar)"
        },
        {
          "ja": "かしこまりました (Kashikomarimashita)",
          "id": "Baik, saya mengerti"
        },
        {
          "ja": "お疲れ様です (Otsukaresama desu)",
          "id": "Terima kasih atas kerja kerasnya"
        },
        {
          "ja": "失礼します (Shitsureishimasu)",
          "id": "Permisi (umum)"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan salam kepatuhan berikut (Shadowing)!",
      "targetJa": "かしこまりました",
      "romaji": "",
      "meaning": "Baik, saya mengerti"
    },
    {
      "type": "B",
      "prompt": "Dengar dan pilih makna kalimat berikut!",
      "audioText": "お邪魔します",
      "options": [
        "Permisi masuk kamar pasien",
        "Selamat malam",
        "Saya mohon maaf"
      ],
      "answer": 0,
      "explanation": {
        "word": "お邪魔します",
        "romaji": "",
        "translation": "Permisi masuk kamar/area pribadi",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ],
  "3": [
    {
      "type": "B",
      "prompt": "Dengarkan kalimat penunjuk lokasi berikut:",
      "audioText": "食堂はあちらです",
      "options": [
        "Toilet ada di sana",
        "Ruang makan ada di sebelah sana",
        "Kamar mandi ada di sebelah sini"
      ],
      "answer": 1,
      "explanation": {
        "word": "食堂はあちらです",
        "romaji": "",
        "translation": "Ruang makan ada di sebelah sana",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk toilet!",
      "targetRomaji": "toire",
      "targetJa": "トイレ",
      "meaning": "Toilet"
    },
    {
      "type": "A",
      "prompt": "Cocokkan arah dan lokasi berikut!",
      "pairs": [
        {
          "ja": "食堂 (shokudou)",
          "id": "Ruang Makan"
        },
        {
          "ja": "トイレ (toire)",
          "id": "Toilet"
        },
        {
          "ja": "お風呂 (ofuro)",
          "id": "Kamar Mandi"
        },
        {
          "ja": "右 (migi)",
          "id": "Kanan"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan petunjuk arah berikut (Shadowing)!",
      "targetJa": "右へ曲がります",
      "romaji": "",
      "meaning": "Belok ke kanan"
    },
    {
      "type": "B",
      "prompt": "Dengarkan dan pilih artinya!",
      "audioText": "お風呂はこちらです",
      "options": [
        "Kamar mandi ada di sebelah sini",
        "Toilet ada di sebelah sini",
        "Kantin ada di sebelah sini"
      ],
      "answer": 0,
      "explanation": {
        "word": "お風呂はこちらです",
        "romaji": "",
        "translation": "Kamar mandi ada di sebelah sini",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ],
  "4": [
    {
      "type": "B",
      "prompt": "Dengarkan peringatan berikut:",
      "audioText": "危ない！",
      "options": [
        "Aman",
        "Bahaya! / Awas!",
        "Tenang saja"
      ],
      "answer": 1,
      "explanation": {
        "word": "危ない！",
        "romaji": "",
        "translation": "Bahaya / Awas",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk peringatan / hati-hati!",
      "targetRomaji": "chuui",
      "targetJa": "注意",
      "meaning": "Peringatan / Hati-hati"
    },
    {
      "type": "A",
      "prompt": "Cocokkan istilah keselamatan berikut!",
      "pairs": [
        {
          "ja": "危ない (abunai)",
          "id": "Bahaya / Awas"
        },
        {
          "ja": "注意 (chuui)",
          "id": "Hati-hati / Peringatan"
        },
        {
          "ja": "火事 (kaji)",
          "id": "Kebakaran"
        },
        {
          "ja": "地震 (jishin)",
          "id": "Gempa Bumi"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan seruan darurat berikut (Shadowing)!",
      "targetJa": "助けてください",
      "romaji": "",
      "meaning": "Tolong bantu saya"
    },
    {
      "type": "B",
      "prompt": "Dengarkan petunjuk keselamatan berikut:",
      "audioText": "足元にご注意ください",
      "options": [
        "Harap tenang",
        "Harap perhatikan langkah kaki Anda",
        "Jangan berlari"
      ],
      "answer": 1,
      "explanation": {
        "word": "足元にご注意ください",
        "romaji": "",
        "translation": "Harap perhatikan langkah kaki Anda",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ],
  "5": [
    {
      "type": "B",
      "prompt": "Dengarkan keluhan lansia berikut:",
      "audioText": "頭が痛いです",
      "options": [
        "Kaki saya sakit",
        "Pinggang saya sakit",
        "Kepala saya sakit"
      ],
      "answer": 2,
      "explanation": {
        "word": "頭が痛いです",
        "romaji": "",
        "translation": "Kepala saya sakit",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk pinggang!",
      "targetRomaji": "koshi",
      "targetJa": "腰",
      "meaning": "Pinggang"
    },
    {
      "type": "A",
      "prompt": "Cocokkan bagian tubuh berikut!",
      "pairs": [
        {
          "ja": "あたま (Atama)",
          "id": "Kepala"
        },
        {
          "ja": "て (Te)",
          "id": "Tangan"
        },
        {
          "ja": "あshi (Ashi)",
          "id": "Kaki"
        },
        {
          "ja": "こし (Koshi)",
          "id": "Pinggang"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan instruksi mobilitas berikut (Shadowing)!",
      "targetJa": "手を伸ばしてください",
      "romaji": "",
      "meaning": "Tolong luruskan tangan Anda"
    },
    {
      "type": "B",
      "prompt": "Dengarkan pertanyaan berikut:",
      "audioText": "足は大丈夫ですか？",
      "options": [
        "Apakah kaki Anda baik-baik saja?",
        "Apakah tangan Anda baik-baik saja?",
        "Apakah pinggang Anda baik-baik saja?"
      ],
      "answer": 0,
      "explanation": {
        "word": "足は大丈夫ですか？",
        "romaji": "",
        "translation": "",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ],
  "6": [
    {
      "type": "B",
      "prompt": "Dengarkan gejala penyakit berikut:",
      "audioText": "熱があります",
      "options": [
        "Saya mual",
        "Saya demam / panas",
        "Saya menggigil"
      ],
      "answer": 1,
      "explanation": {
        "word": "熱があります",
        "romaji": "",
        "translation": "Saya demam / panas",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk kata sakit!",
      "targetRomaji": "itai",
      "targetJa": "痛い",
      "meaning": "Sakit"
    },
    {
      "type": "A",
      "prompt": "Cocokkan keluhan medis berikut!",
      "pairs": [
        {
          "ja": "痛い (itai)",
          "id": "Sakit"
        },
        {
          "ja": "吐き気 (hakike)",
          "id": "Mual / Ingin Muntah"
        },
        {
          "ja": "熱 (netsu)",
          "id": "Demam / Panas"
        },
        {
          "ja": "寒気 (samuke)",
          "id": "Menggigil"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan keluhan berikut (Shadowing)!",
      "targetJa": "気分が悪いです",
      "romaji": "",
      "meaning": "Saya merasa tidak enak badan"
    },
    {
      "type": "B",
      "prompt": "Dengarkan keluhan berikut:",
      "audioText": "吐き気がします",
      "options": [
        "Saya merasa pusing",
        "Saya merasa mual",
        "Saya merasa menggigil"
      ],
      "answer": 1,
      "explanation": {
        "word": "吐き気がします",
        "romaji": "",
        "translation": "",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ],
  "7": [
    {
      "type": "B",
      "prompt": "Dengarkan ajakan berikut:",
      "audioText": "車椅子に乗りましょう",
      "options": [
        "Mari tidur di ranjang",
        "Mari naik ke kursi roda",
        "Mari berjalan dengan tongkat"
      ],
      "answer": 1,
      "explanation": {
        "word": "車椅子に乗りましょう",
        "romaji": "",
        "translation": "Mari naik ke kursi roda",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk tongkat bantu jalan!",
      "targetRomaji": "tsue",
      "targetJa": "杖",
      "meaning": "Tongkat"
    },
    {
      "type": "A",
      "prompt": "Cocokkan nama alat bantu berikut!",
      "pairs": [
        {
          "ja": "車椅子 (kurumaisu)",
          "id": "Kursi Roda"
        },
        {
          "ja": "杖 (tsue)",
          "id": "Tongkat"
        },
        {
          "ja": "歩行器 (hokouki)",
          "id": "Alat Bantu Jalan"
        },
        {
          "ja": "ベッド (beddo)",
          "id": "Tempat Tidur"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan tindakan pengamanan berikut (Shadowing)!",
      "targetJa": "ブレーキをかけます",
      "romaji": "",
      "meaning": "Saya pasang remnya"
    },
    {
      "type": "B",
      "prompt": "Dengarkan ajakan berikut:",
      "audioText": "歩行器を使いましょう",
      "options": [
        "Mari gunakan alat bantu jalan",
        "Mari pakai tongkat",
        "Mari berpegangan tangan"
      ],
      "answer": 0,
      "explanation": {
        "word": "歩行器を使いましょう",
        "romaji": "",
        "translation": "",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ],
  "8": [
    {
      "type": "B",
      "prompt": "Dengarkan instruksi minum obat berikut:",
      "audioText": "食後に薬を飲みましょう",
      "options": [
        "Mari minum obat sebelum makan",
        "Mari minum obat setelah makan",
        "Mari minum obat sebelum tidur"
      ],
      "answer": 1,
      "explanation": {
        "word": "食後に薬を飲みましょう",
        "romaji": "",
        "translation": "Mari minum obat setelah makan",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk obat!",
      "targetRomaji": "kusuri",
      "targetJa": "薬",
      "meaning": "Obat"
    },
    {
      "type": "A",
      "prompt": "Cocokkan waktu obat berikut!",
      "pairs": [
        {
          "ja": "薬 (kusuri)",
          "id": "Obat"
        },
        {
          "ja": "食後 (shokugo)",
          "id": "Setelah Makan"
        },
        {
          "ja": "食前 (shokuzen)",
          "id": "Sebelum Makan"
        },
        {
          "ja": "水 (mizu)",
          "id": "Air Putih"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan pemberitahuan berikut (Shadowing)!",
      "targetJa": "お薬の時間です",
      "romaji": "",
      "meaning": "Ini waktunya minum obat"
    },
    {
      "type": "B",
      "prompt": "Dengarkan petunjuk berikut:",
      "audioText": "食前に飲んでください",
      "options": [
        "Harap minum setelah makan",
        "Harap minum sebelum makan",
        "Harap minum sebelum tidur"
      ],
      "answer": 1,
      "explanation": {
        "word": "食前に飲んでください",
        "romaji": "",
        "translation": "",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ],
  "9": [
    {
      "type": "B",
      "prompt": "Dengarkan laporan kerusakan berikut:",
      "audioText": "車椅子が故障しています",
      "options": [
        "Kursi rodanya hilang",
        "Kursi rodanya rusak / malfungsi",
        "Kursi rodanya baru"
      ],
      "answer": 1,
      "explanation": {
        "word": "車椅子が故障しています",
        "romaji": "",
        "translation": "Kursi rodanya rusak",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk melapor!",
      "targetRomaji": "houkoku",
      "targetJa": "報告",
      "meaning": "Laporan / Melapor"
    },
    {
      "type": "A",
      "prompt": "Cocokkan prinsip kerja Hou-Ren-So berikut!",
      "pairs": [
        {
          "ja": "報告 (houkoku)",
          "id": "Melapor"
        },
        {
          "ja": "連絡 (renraku)",
          "id": "Menghubungi"
        },
        {
          "ja": "相談 (soudan)",
          "id": "Berkonsultasi"
        },
        {
          "ja": "故障 (koshou)",
          "id": "Rusak / Kerusakan"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan laporan berikut (Shadowing)!",
      "targetJa": "リーダーに報告します",
      "romaji": "",
      "meaning": "Saya akan melapor ke ketua tim"
    },
    {
      "type": "B",
      "prompt": "Dengarkan tawaran konsultasi berikut:",
      "audioText": "相談してもいいですか？",
      "options": [
        "Bolehkah saya melapor?",
        "Bolehkah saya berkonsultasi?",
        "Bolehkah saya pulang?"
      ],
      "answer": 1,
      "explanation": {
        "word": "相談してもいいですか？",
        "romaji": "",
        "translation": "",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ],
  "10": [
    {
      "type": "B",
      "prompt": "Dengarkan instruksi gempa berikut:",
      "audioText": "地震です！落ち着いてください",
      "options": [
        "Kebakaran! Cepat lari!",
        "Ada gempa! Harap tenang dan jangan panik",
        "Banjir bandang!"
      ],
      "answer": 1,
      "explanation": {
        "word": "地震です！落ち着いてください",
        "romaji": "",
        "translation": "Ada gempa! Harap tenang",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk evakuasi!",
      "targetRomaji": "hinan",
      "targetJa": "避難",
      "meaning": "Evakuasi"
    },
    {
      "type": "A",
      "prompt": "Cocokkan istilah bencana berikut!",
      "pairs": [
        {
          "ja": "地震 (jishin)",
          "id": "Gempa Bumi"
        },
        {
          "ja": "避難 (hinan)",
          "id": "Evakuasi"
        },
        {
          "ja": "出口 (deguchi)",
          "id": "Pintu Keluar"
        },
        {
          "ja": "火事 (kaji)",
          "id": "Kebakaran"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan instruksi evakuasi berikut (Shadowing)!",
      "targetJa": "非常口へ移動します",
      "romaji": "",
      "meaning": "Kita pindah ke pintu darurat"
    },
    {
      "type": "B",
      "prompt": "Dengarkan ajakan evakuasi berikut:",
      "audioText": "外へ避難しましょう",
      "options": [
        "Mari berlindung di dalam",
        "Mari evakuasi ke luar",
        "Mari naik ke lantai atas"
      ],
      "answer": 1,
      "explanation": {
        "word": "外へ避難しましょう",
        "romaji": "",
        "translation": "",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ],
  "11": [
    {
      "type": "B",
      "prompt": "Dengarkan pertanyaan berikut:",
      "audioText": "これは何と読みますか？",
      "options": [
        "Ini artinya apa?",
        "Ini dibaca apa?",
        "Ini ditulis apa?"
      ],
      "answer": 1,
      "explanation": {
        "word": "これは何と読みますか？",
        "romaji": "",
        "translation": "Ini dibaca apa?",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk kata soal / masalah!",
      "targetRomaji": "mondai",
      "targetJa": "問題",
      "meaning": "Soal / Masalah"
    },
    {
      "type": "A",
      "prompt": "Cocokkan aspek ujian JFT berikut!",
      "pairs": [
        {
          "ja": "問題 (mondai)",
          "id": "Soal / Masalah"
        },
        {
          "ja": "文法 (bunpou)",
          "id": "Tata Bahasa"
        },
        {
          "ja": "読解 (dokkai)",
          "id": "Membaca"
        },
        {
          "ja": "聴解 (choukai)",
          "id": "Mendengarkan"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan pernyataan kemampuan berikut (Shadowing)!",
      "targetJa": "日本語で話します",
      "romaji": "",
      "meaning": "Berbicara dalam bahasa Jepang"
    },
    {
      "type": "B",
      "prompt": "Dengarkan permintaan sopan berikut:",
      "audioText": "もう一度言ってください",
      "options": [
        "Tolong tuliskan sekali lagi",
        "Tolong ucapkan sekali lagi",
        "Tolong baca sekali lagi"
      ],
      "answer": 1,
      "explanation": {
        "word": "もう一度言ってください",
        "romaji": "",
        "translation": "",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ],
  "12": [
    {
      "type": "B",
      "prompt": "Dengarkan pertanyaan wawancara berikut:",
      "audioText": "自己紹介をお願いします",
      "options": [
        "Tolong sebutkan alasan melamar",
        "Tolong perkenalkan diri Anda",
        "Tolong sebutkan nama LPK Anda"
      ],
      "answer": 1,
      "explanation": {
        "word": "自己紹介をお願いします",
        "romaji": "",
        "translation": "Tolong perkenalkan diri Anda",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    },
    {
      "type": "C",
      "prompt": "Ketik ejaan Romaji untuk wawancara!",
      "targetRomaji": "mensetsu",
      "targetJa": "面接",
      "meaning": "Wawancara"
    },
    {
      "type": "A",
      "prompt": "Cocokkan istilah interview berikut!",
      "pairs": [
        {
          "ja": "面接 (mensetsu)",
          "id": "Wawancara"
        },
        {
          "ja": "志望動機 (shibou douki)",
          "id": "Alasan Melamar"
        },
        {
          "ja": "自己紹介 (jiko shoukai)",
          "id": "Perkenalan Diri"
        },
        {
          "ja": "日本語 (nihongo)",
          "id": "Bahasa Jepang"
        }
      ]
    },
    {
      "type": "D",
      "prompt": "Ucapkan tekad bekerja berikut (Shadowing)!",
      "targetJa": "日本で働きたいです",
      "romaji": "",
      "meaning": "Saya ingin bekerja di Jepang"
    },
    {
      "type": "B",
      "prompt": "Dengarkan salam penutup wawancara berikut:",
      "audioText": "どうぞよろしくお願いします",
      "options": [
        "Terima kasih banyak atas bantuannya",
        "Mohon bantuannya / Senang bertemu Anda",
        "Sampai jumpa besok"
      ],
      "answer": 1,
      "explanation": {
        "word": "どうぞよろしくお願いします",
        "romaji": "",
        "translation": "",
        "context": "Latihan pengucapan dan pendengaran kosakata dasar Kaigo.",
        "tip": "Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.",
        "example": ""
      }
    }
  ]
};

const VOCAB_BY_WEEK = {
  "1": [
    {
      "ja": "いち",
      "romaji": "Ichi",
      "id": "Satu",
      "context": "Menghitung jumlah barang atau waktu.",
      "tip": "Gunakan saat menghitung obat atau porsi.",
      "example": "Kusuri o ichi-jou nonde kudasai."
    },
    {
      "ja": "に",
      "romaji": "Ni",
      "id": "Dua",
      "context": "Menghitung jumlah.",
      "tip": "Perhatikan pengucapan agar tidak tertukar.",
      "example": "Mikan o ni-ko tabemashita."
    },
    {
      "ja": "さん",
      "romaji": "San",
      "id": "Tiga",
      "context": "Menghitung jumlah.",
      "tip": "Gunakan saat menghitung porsi makanan.",
      "example": "San-ji ni oyatsu o tabemashou."
    },
    {
      "ja": "し / よん",
      "romaji": "Shi / Yon",
      "id": "Empat",
      "context": "Menghitung jumlah.",
      "tip": "Yon' lebih sering digunakan untuk menghindari kata 'shi' (mati).",
      "example": "Yon-kai ni ikimasu."
    },
    {
      "ja": "ご",
      "romaji": "Go",
      "id": "Lima",
      "context": "Menghitung jumlah.",
      "tip": "Berguna untuk waktu (jam 5).",
      "example": "Go-fun matte kudasai."
    },
    {
      "ja": "ろく",
      "romaji": "Roku",
      "id": "Enam",
      "context": "Menghitung jumlah.",
      "tip": "Jelas saat mengucapkan 'ro'.",
      "example": "Roku-ji ni okimasu."
    },
    {
      "ja": "しち / なな",
      "romaji": "Shichi / Nana",
      "id": "Tujuh",
      "context": "Menghitung jumlah.",
      "tip": "Nana' lebih umum dipakai untuk jam/waktu.",
      "example": "Nana-ji ni asagohan o tabemasu."
    },
    {
      "ja": "はち",
      "romaji": "Hachi",
      "id": "Delapan",
      "context": "Menghitung jumlah.",
      "tip": "Perhatikan saat menghitung jam.",
      "example": "Hachi-ji ni kusuri o nomimasu."
    },
    {
      "ja": "きゅう / く",
      "romaji": "Kyuu / Ku",
      "id": "Sembilan",
      "context": "Menghitung jumlah.",
      "tip": "Kyuu' lebih umum digunakan.",
      "example": "Kyuu-ji ni nemasu."
    },
    {
      "ja": "じゅう",
      "romaji": "Juu",
      "id": "Sepuluh",
      "context": "Menghitung puluhan.",
      "tip": "Gunakan untuk menghitung jumlah yang banyak.",
      "example": "Juu-pun yasumimasu."
    },
    {
      "ja": "おはよう ございます",
      "romaji": "Ohayou gozaimasu",
      "id": "Selamat pagi (Diucapkan saat mulai masuk kerja)",
      "context": "Salam saat datang ke fasilitas.",
      "tip": "Ucapkan dengan suara ceria dan senyum.",
      "example": "Suzuki-san, ohayou gozaimasu."
    },
    {
      "ja": "こんにちは",
      "romaji": "Konnichiwa",
      "id": "Selamat siang / sore",
      "context": "Salam saat bertemu di siang hari.",
      "tip": "Gunakan saat berpapasan di lorong.",
      "example": "Konnichiwa, kyou wa ii tenki desu ne."
    },
    {
      "ja": "こんばんは",
      "romaji": "Konbanwa",
      "id": "Selamat malam",
      "context": "Salam saat shift malam dimulai.",
      "tip": "Ucapkan dengan nada lebih lembut.",
      "example": "Konbanwa, yoku nemuremashita ka?"
    },
    {
      "ja": "おやすみなさい",
      "romaji": "Oyasuminasai",
      "id": "Selamat tidur (Sering digunakan saat menidurkan lansia)",
      "context": "Diucapkan saat lansia bersiap tidur.",
      "tip": "Ucapkan dengan lembut agar lansia tenang.",
      "example": "Oyasuminasai, mata ashita."
    },
    {
      "ja": "さようなら",
      "romaji": "Sayounara",
      "id": "Selamat tinggal / Sampai jumpa",
      "context": "Salam perpisahan (jarang di fasilitas).",
      "tip": "Lebih baik gunakan 'Mata ashita' (sampai besok).",
      "example": "Sayounara, ki o tsukete kudasai."
    },
    {
      "ja": "はい",
      "romaji": "Hai",
      "id": "Ya / Baik (Jawaban refleks utama saat dipanggil)",
      "context": "Menanggapi panggilan lansia/atasan.",
      "tip": "Jawab dengan sigap dan jelas.",
      "example": "Hai, sugu ikimasu."
    },
    {
      "ja": "いいえ",
      "romaji": "Iie",
      "id": "Tidak / Bukan",
      "context": "Menyangkal atau menjawab pertanyaan.",
      "tip": "Ucapkan dengan sopan agar tidak menyinggung.",
      "example": "Iie, chigaimasu."
    },
    {
      "ja": "みず",
      "romaji": "Mizu",
      "id": "Air putih (Paling sering diminta oleh lansia)",
      "context": "Menawarkan minum.",
      "tip": "Pastikan suhu air sesuai keinginan lansia.",
      "example": "Mizu o nomimasu ka?"
    },
    {
      "ja": "おちゃ",
      "romaji": "Ocha",
      "id": "Teh Jepang",
      "context": "Waktu minum teh atau makan.",
      "tip": "Lansia sering menyukai teh hangat.",
      "example": "Ocha o iremashita yo."
    },
    {
      "ja": "ごはん",
      "romaji": "Gohan",
      "id": "Nasi / Makanan",
      "context": "Waktu makan tiba.",
      "tip": "Pastikan tekstur makanan sesuai kondisi lansia.",
      "example": "Gohan no jikan desu yo."
    },
    {
      "ja": "くすり",
      "romaji": "Kusuri",
      "id": "Obat",
      "context": "Waktu minum obat setelah makan.",
      "tip": "Awasi lansia saat minum obat.",
      "example": "Kusuri o nomimashou."
    },
    {
      "ja": "トイレ",
      "romaji": "Toire",
      "id": "Toilet",
      "context": "Membantu lansia ke kamar mandi.",
      "tip": "Selalu tanyakan apakah butuh ke toilet.",
      "example": "Toire ni ikimasu ka?"
    },
    {
      "ja": "いす",
      "romaji": "Isu",
      "id": "Kursi",
      "context": "Membantu lansia duduk.",
      "tip": "Pastikan kursi stabil dan aman.",
      "example": "Isu ni suwatte kudasai."
    },
    {
      "ja": "て",
      "romaji": "Te",
      "id": "Tangan",
      "context": "Saat mencuci tangan atau membantu bergerak.",
      "tip": "Pegang tangan lansia dengan lembut.",
      "example": "Te o aaraimashou."
    },
    {
      "ja": "め",
      "romaji": "Me",
      "id": "Mata",
      "context": "Memeriksa kondisi wajah lansia.",
      "tip": "Perhatikan jika mata lansia merah.",
      "example": "Me ga itai desu ka?"
    },
    {
      "ja": "ひ",
      "romaji": "Hi",
      "id": "Matahari / Api",
      "context": "Membicarakan cuaca atau bahaya.",
      "tip": "Jauhkan lansia dari sumber api.",
      "example": "Hi ni ki o tsukete kudasai."
    },
    {
      "ja": "つき",
      "romaji": "Tsuki",
      "id": "Bulan",
      "context": "Membicarakan pemandangan malam.",
      "tip": "Ajak ngobrol santai di malam hari.",
      "example": "Kyou wa tsuki ga kirei desu ne."
    },
    {
      "ja": "やま",
      "romaji": "Yama",
      "id": "Gunung",
      "context": "Mengingat kenangan lansia.",
      "tip": "Lansia suka bercerita tentang alam.",
      "example": "Yama no keshiki ga suki desu ka?"
    },
    {
      "ja": "うみ",
      "romaji": "Umi",
      "id": "Laut",
      "context": "Mengobrol tentang musim panas atau rekreasi.",
      "tip": "Gunakan untuk topik percakapan ringan.",
      "example": "Umi ni ikitai desu ne."
    },
    {
      "ja": "みどり",
      "romaji": "Midori",
      "id": "Tanaman / Hijau",
      "context": "Menikmati taman panti jompo.",
      "tip": "Ajak jalan-jalan melihat tanaman.",
      "example": "Midori ga kirei desu ne."
    },
    {
      "ja": "やさい",
      "romaji": "Yasai",
      "id": "Sayur",
      "context": "Menjelaskan menu makanan.",
      "tip": "Potong sayur kecil-kecil agar mudah dikunyah.",
      "example": "Yasai o takusan tabete kudasai."
    },
    {
      "ja": "くだもの",
      "romaji": "Kudamono",
      "id": "Buah",
      "context": "Makanan penutup atau camilan.",
      "tip": "Kupas dan potong buah sebelum disajikan.",
      "example": "Kyou no kudamono wa ringo desu."
    },
    {
      "ja": "あつい",
      "romaji": "Atsui",
      "id": "Panas (Kondisi air minum atau sup makanan lansia)",
      "context": "Memperingatkan suhu makanan/minuman.",
      "tip": "Tiup makanan jika terlalu panas.",
      "example": "Atsui kara ki o tsukete kudasai."
    },
    {
      "ja": "つめたい",
      "romaji": "Tsumetai",
      "id": "Dingin (Kondisi air minum atau kompres pasien)",
      "context": "Memberikan kompres atau minuman dingin.",
      "tip": "Jangan berikan minuman terlalu dingin.",
      "example": "Tsumetai ocha desu."
    },
    {
      "ja": "へや",
      "romaji": "Heya",
      "id": "Kamar / Ruangan",
      "context": "Mengantar lansia kembali ke kamar.",
      "tip": "Pastikan suhu kamar nyaman.",
      "example": "Heya ni modorimashou."
    },
    {
      "ja": "ありがとう ございます",
      "romaji": "Arigatou gozaimasu",
      "id": "Terima kasih banyak",
      "context": "Berterima kasih pada rekan kerja atau atasan.",
      "tip": "Bungkukkan badan sedikit (ojigi).",
      "example": "Tetsudatte kurete arigatou gozaimasu."
    },
    {
      "ja": "すみません",
      "romaji": "Sumimasen",
      "id": "Permisi / Maaf",
      "context": "Masuk ke kamar lansia atau minta tolong.",
      "tip": "Ketuk pintu sebelum mengucapkan ini.",
      "example": "Sumimasen, hairimasu."
    },
    {
      "ja": "どうぞ",
      "romaji": "Douzo",
      "id": "Silakan",
      "context": "Mempersilakan duduk atau memberikan barang.",
      "tip": "Gunakan gestur tangan terbuka.",
      "example": "Ocha o douzo."
    },
    {
      "ja": "これ",
      "romaji": "Kore",
      "id": "Ini (Menunjuk barang di dekat pekerja)",
      "context": "Menunjukkan barang di dekat perawat.",
      "tip": "Tunjuk barang dengan sopan.",
      "example": "Kore wa Tanaka-san no kusuri desu."
    },
    {
      "ja": "それ",
      "romaji": "Sore",
      "id": "Itu (Menunjuk barang di dekat lansia/atasan)",
      "context": "Menunjuk barang di dekat lansia.",
      "tip": "Pastikan barang mudah dijangkau lansia.",
      "example": "Sore o totte kuremasu ka?"
    },
    {
      "ja": "あれ",
      "romaji": "Are",
      "id": "Itu (Menunjuk barang yang jauh dari keduanya)",
      "context": "Menunjuk barang yang jauh dari keduanya.",
      "tip": "Gunakan saat mencari barang.",
      "example": "Are wa nan desu ka?"
    },
    {
      "ja": "だめ",
      "romaji": "Dame",
      "id": "Jangan / Tidak boleh (Penting untuk mencegah lansia bahaya)",
      "context": "Menghentikan lansia dari tindakan berbahaya.",
      "tip": "Gunakan nada tegas tapi tidak membentak.",
      "example": "Sore o tabete wa dame desu."
    },
    {
      "ja": "あぶない",
      "romaji": "Abunai",
      "id": "Bahaya!",
      "context": "Lansia hampir jatuh atau tersandung.",
      "tip": "Teriakkan dengan cepat sambil bertindak.",
      "example": "Abunai! Ki o tsukete!"
    },
    {
      "ja": "ちょっと まって",
      "romaji": "Chotto matte",
      "id": "Tunggu sebentar",
      "context": "Meminta lansia menunggu sebentar.",
      "tip": "Gunakan bentuk sopan \"Chotto matte kudasai\".",
      "example": "Chotto matte kudasai ne."
    },
    {
      "ja": "きて ください",
      "romaji": "Kite kudasai",
      "id": "Tolong kemari",
      "context": "Meminta bantuan rekan kerja.",
      "tip": "Panggil rekan saat butuh bantuan fisik.",
      "example": "Sumimasen, chotto kite kudasai."
    },
    {
      "ja": "わかります",
      "romaji": "Wakarimasu",
      "id": "Paham / Mengerti",
      "context": "Mengkonfirmasi instruksi atasan.",
      "tip": "Anggukkan kepala tanda mengerti.",
      "example": "Hai, wakarimashita."
    },
    {
      "ja": "わかりません",
      "romaji": "Wakarimasen",
      "id": "Tidak paham",
      "context": "Tidak mengerti instruksi bahasa Jepang.",
      "tip": "Segera tanyakan kembali agar tidak salah.",
      "example": "Sumimasen, wakarimasen. Mou ichido onegaishimasu."
    },
    {
      "ja": "たすけて",
      "romaji": "Tasukete",
      "id": "Tolong saya! (Situasi darurat)",
      "context": "Keadaan darurat medis atau kecelakaan.",
      "tip": "Panggil dengan suara keras.",
      "example": "Tasukete! Hito ga taoremashita!"
    },
    {
      "ja": "おわり",
      "romaji": "Owari",
      "id": "Selesai",
      "context": "Selesai mandi atau makan.",
      "tip": "Beri tahu lansia bahwa aktivitas sudah selesai.",
      "example": "Ofuro ga owarimashita yo."
    },
    {
      "ja": "おつかれさま です",
      "romaji": "Otsukaresama desu",
      "id": "Terima kasih atas kerja kerasnya (Diucapkan saat pulang sif)",
      "context": "Salam saat berpapasan dengan rekan atau pulang.",
      "tip": "Wajib diucapkan di lingkungan kerja Jepang.",
      "example": "Otsukaresama desu. Osaki ni shitsurei shimasu."
    }
  ],
  "2": [
    {
      "ja": "お疲れ様です",
      "romaji": "otsukaresamadesu",
      "id": "Terima kasih atas kerja keras Anda",
      "context": "Salam kerja harian.",
      "tip": "Ucapkan saat berganti shift.",
      "example": "Otsukaresama desu, Minako-san."
    },
    {
      "ja": "失礼します",
      "romaji": "shitsureishimasu",
      "id": "Permisi",
      "context": "Permisi masuk/keluar.",
      "tip": "Gunakan saat mengetuk pintu.",
      "example": "Shitsureishimasu, Budi desu."
    },
    {
      "ja": "お邪魔します",
      "romaji": "ojamashimasu",
      "id": "Permisi (masuk kamar)",
      "context": "Masuk ke area pribadi.",
      "tip": "Ucapkan dengan membungkuk sedikit.",
      "example": "Ojamashimasu, Tanaka-san."
    },
    {
      "ja": "かしこまりました",
      "romaji": "kashikomarimashita",
      "id": "Baik, saya mengerti",
      "context": "Persetujuan sopan.",
      "tip": "Gunakan saat menerima instruksi.",
      "example": "Kashikomarimashita, riidaa."
    },
    {
      "ja": "申し訳ありません",
      "romaji": "moushiwakearimasen",
      "id": "Mohon maaf yang sebesar-besarnya",
      "context": "Permintaan maaf formal.",
      "tip": "Gunakan jika melakukan kesalahan.",
      "example": "Moushiwake arimasen, kotsuzure shimashita."
    }
  ],
  "3": [
    {
      "ja": "食堂",
      "romaji": "shokudou",
      "id": "Ruang Makan / Kantin",
      "context": "Tempat makan bersama.",
      "tip": "Antar lansia ke sini saat jam makan.",
      "example": "Shokudou wa achira desu."
    },
    {
      "ja": "トイレ",
      "romaji": "toire",
      "id": "Toilet",
      "context": "Fasilitas sanitasi.",
      "tip": "Tanyakan secara berkala ke lansia.",
      "example": "Toire ni ikimashou ka?"
    },
    {
      "ja": "お風呂",
      "romaji": "ofuro",
      "id": "Kamar Mandi / Ofuro",
      "context": "Tempat mandi berendam.",
      "tip": "Periksa suhu air sebelum berendam.",
      "example": "Ofuro wa kochira desu."
    },
    {
      "ja": "右",
      "romaji": "migi",
      "id": "Kanan",
      "context": "Arah kanan.",
      "tip": "Gunakan saat menuntun jalan.",
      "example": "Migi ni magarimasu."
    },
    {
      "ja": "左",
      "romaji": "hidari",
      "id": "Kiri",
      "context": "Arah kiri.",
      "tip": "Gunakan saat menuntun jalan.",
      "example": "Hidari ni magarimasu."
    },
    {
      "ja": "まっすぐ",
      "romaji": "massugu",
      "id": "Lurus",
      "context": "Arah lurus ke depan.",
      "tip": "Bimbing lansia jalan lurus.",
      "example": "Massugu susumimasu."
    }
  ],
  "4": [
    {
      "ja": "危ない",
      "romaji": "abunai",
      "id": "Bahaya / Awas",
      "context": "Peringatan bahaya fisik.",
      "tip": "Teriakkan dengan cepat jika darurat.",
      "example": "Abunai! Kaki wo tsukete!"
    },
    {
      "ja": "注意",
      "romaji": "chuui",
      "id": "Hati-hati / Peringatan",
      "context": "Perhatian ekstra.",
      "tip": "Ingatkan lansia di area basah.",
      "example": "Ashimoto ni go-chuui kudasai."
    },
    {
      "ja": "火事",
      "romaji": "kaji",
      "id": "Kebakaran",
      "context": "Situasi darurat kebakaran.",
      "tip": "Segera evakuasi ke pintu keluar.",
      "example": "Kaji desu! Soto ni demashou!"
    },
    {
      "ja": "地震",
      "romaji": "jishin",
      "id": "Gempa Bumi",
      "context": "Guncangan gempa bumi.",
      "tip": "Lindungi kepala lansia.",
      "example": "Jishin desu! Ochitsuite kudasai."
    },
    {
      "ja": "助けて",
      "romaji": "tasukete",
      "id": "Tolong",
      "context": "Meminta bantuan darurat.",
      "tip": "Teriakkan keras jika butuh staff lain.",
      "example": "Tasukete kudasai!"
    }
  ],
  "5": [
    {
      "ja": "頭",
      "romaji": "atama",
      "id": "Kepala",
      "context": "Bagian kepala.",
      "tip": "Periksa jika ada benturan.",
      "example": "Atama wa daijoubu desu ka?"
    },
    {
      "ja": "手",
      "romaji": "te",
      "id": "Tangan",
      "context": "Bagian tangan.",
      "tip": "Bantu regangkan tangan.",
      "example": "Te wo nobashite kudasai."
    },
    {
      "ja": "足",
      "romaji": "ashi",
      "id": "Kaki",
      "context": "Bagian kaki.",
      "tip": "Perhatikan kekuatan langkah kaki.",
      "example": "Ashi ni chikara wo irete."
    },
    {
      "ja": "腰",
      "romaji": "koshi",
      "id": "Pinggang",
      "context": "Bagian pinggang.",
      "tip": "Jaga posisi tubuh saat mengangkat.",
      "example": "Koshi ga itai desu ka?"
    },
    {
      "ja": "背中",
      "romaji": "senaka",
      "id": "Punggung",
      "context": "Bagian punggung.",
      "tip": "Usap dengan lembut saat mandi.",
      "example": "Senaka wo araimasu."
    }
  ],
  "6": [
    {
      "ja": "痛い",
      "romaji": "itai",
      "id": "Sakit",
      "context": "Keluhan rasa sakit.",
      "tip": "Tanyakan letak rasa sakitnya.",
      "example": "Doko ga itai desu ka?"
    },
    {
      "ja": "熱",
      "romaji": "netsu",
      "id": "Demam / Panas",
      "context": "Suhu tubuh tinggi.",
      "tip": "Ukur suhu dengan termometer.",
      "example": "Netsu ga arimasu ne."
    },
    {
      "ja": "吐き気",
      "romaji": "hakike",
      "id": "Mual / Ingin Muntah",
      "context": "Rasa ingin muntah.",
      "tip": "Siapkan wadah pembuangan segera.",
      "example": "Hakike ga shimasu ka?"
    },
    {
      "ja": "寒気",
      "romaji": "samuke",
      "id": "Menggigil",
      "context": "Merasa dingin menggigil.",
      "tip": "Berikan selimut tambahan.",
      "example": "Samuke ga suru node kake-buton wo."
    },
    {
      "ja": "めまい",
      "romaji": "memai",
      "id": "Pusing / Kliyengan",
      "context": "Hilang keseimbangan.",
      "tip": "Bantu lansia untuk duduk segera.",
      "example": "Memai ga shimasu, yasumi-mashou."
    }
  ],
  "7": [
    {
      "ja": "車椅子",
      "romaji": "kurumaisu",
      "id": "Kursi Roda",
      "context": "Alat bantu duduk roda.",
      "tip": "Selalu kunci rem saat diam.",
      "example": "Kurumaisu ni norimashou."
    },
    {
      "ja": "杖",
      "romaji": "tsue",
      "id": "Tongkat",
      "context": "Alat bantu jalan tongkat.",
      "tip": "Pastikan karet bawah tidak licin.",
      "example": "Tsue wo tsukaimashou."
    },
    {
      "ja": "歩行器",
      "romaji": "hokouki",
      "id": "Alat Bantu Jalan (Walker)",
      "context": "Alat bantu jalan dorong.",
      "tip": "Jaga jarak aman di belakang.",
      "example": "Hokouki de yukkuri arukimasu."
    },
    {
      "ja": "ベッド",
      "romaji": "beddo",
      "id": "Tempat Tidur",
      "context": "Tempat tidur pasien.",
      "tip": "Atur tinggi bed sesuai kenyamanan.",
      "example": "Beddo ni modorimashou."
    },
    {
      "ja": "スリング",
      "romaji": "suringu",
      "id": "Sling / Gendongan Lift",
      "context": "Alat angkat pasien.",
      "tip": "Periksa sabuk pengaman sling.",
      "example": "Suringu wo souchaku shimasu."
    }
  ],
  "8": [
    {
      "ja": "薬",
      "romaji": "kusuri",
      "id": "Obat",
      "context": "Zat medis penyembuh.",
      "tip": "Pastikan 3 cek (nama, obat, waktu).",
      "example": "Okusuri no jikan desu."
    },
    {
      "ja": "食後",
      "romaji": "shokugo",
      "id": "Setelah Makan",
      "context": "Waktu minum obat.",
      "tip": "Minum maksimal 30 menit setelah makan.",
      "example": "食後に薬を飲みましょう"
    },
    {
      "ja": "食前",
      "romaji": "shokuzen",
      "id": "Sebelum Makan",
      "context": "Waktu minum obat.",
      "tip": "Minum 30 menit sebelum makan.",
      "example": "食前に飲んでください"
    },
    {
      "ja": "水",
      "romaji": "mizu",
      "id": "Air Putih",
      "context": "Air untuk minum obat.",
      "tip": "Siapkan air hangat jika perlu.",
      "example": "Mizu wo nomimashou."
    },
    {
      "ja": "胃薬",
      "romaji": "igusuri",
      "id": "Obat Lambung",
      "context": "Obat untuk maag/lambung.",
      "tip": "Biasanya diminum sebelum makan.",
      "example": "Igusuri wo dase-mashou."
    }
  ],
  "9": [
    {
      "ja": "報告",
      "romaji": "houkoku",
      "id": "Melapor / Laporan",
      "context": "Melaporkan hasil kerja.",
      "tip": "Laporkan segera jika ada keanehan.",
      "example": "Riidaa ni houkoku shimasu."
    },
    {
      "ja": "連絡",
      "romaji": "renraku",
      "id": "Menghubungi / Informasi",
      "context": "Berbagi info singkat.",
      "tip": "Hubungi rekan saat butuh bantuan.",
      "example": "Moushi-okuri de renraku shimasu."
    },
    {
      "ja": "相談",
      "romaji": "soudan",
      "id": "Berkonsultasi",
      "context": "Diskusi mencari solusi.",
      "tip": "Konsultasikan masalah sulit ke senior.",
      "example": "Chotto soudan ga arimasu."
    },
    {
      "ja": "故障",
      "romaji": "koshou",
      "id": "Kerusakan / Rusak",
      "context": "Alat tidak berfungsi.",
      "tip": "Tulis label RUSAK pada alat.",
      "example": "Tsue ga koshou shite imasu."
    },
    {
      "ja": "申し送り",
      "romaji": "moushiokuri",
      "id": "Over Shift / Operan",
      "context": "Transfer info antar shift.",
      "tip": "Catat poin penting pasien.",
      "example": "Moushiokuri wo hajimemasu."
    }
  ],
  "10": [
    {
      "ja": "避難",
      "romaji": "hinan",
      "id": "Evakuasi",
      "context": "Menyelamatkan diri.",
      "tip": "Utamakan lansia yang tidak bisa jalan.",
      "example": "Soto he hinan shimashou."
    },
    {
      "ja": "出口",
      "romaji": "deguchi",
      "id": "Pintu Keluar",
      "context": "Akses keluar gedung.",
      "tip": "Pastikan jalan ke pintu bebas hambatan.",
      "example": "Deguchi wa kochira desu."
    },
    {
      "ja": "非常口",
      "romaji": "hijouguchi",
      "id": "Pintu Darurat",
      "context": "Pintu khusus evakuasi.",
      "tip": "Hafalkan posisi pintu darurat.",
      "example": "Hijouguchi ni mukaimashou."
    },
    {
      "ja": "消火器",
      "romaji": "shoukaki",
      "id": "Alat Pemadam Api (APAR)",
      "context": "Pemadam api awal.",
      "tip": "Tarik pin, arahkan ke sumber api.",
      "example": "Shoukaki wo motte kite!"
    },
    {
      "ja": "担架",
      "romaji": "tanka",
      "id": "Tandu Evakuasi",
      "context": "Alat gotong pasien.",
      "tip": "Gotong berdua dengan langkah stabil.",
      "example": "Tanka de hakobimasu."
    }
  ],
  "11": [
    {
      "ja": "問題",
      "romaji": "mondai",
      "id": "Soal / Masalah",
      "context": "Pertanyaan evaluasi.",
      "tip": "Baca soal dengan teliti.",
      "example": "Mondai wo yomimashou."
    },
    {
      "ja": "文法",
      "romaji": "bunpou",
      "id": "Tata Bahasa",
      "context": "Aturan struktur kalimat.",
      "tip": "Pelajari pola kalimat penting.",
      "example": "Bunpou no benkyou desu."
    },
    {
      "ja": "読解",
      "romaji": "dokkai",
      "id": "Membaca",
      "context": "Kemampuan membaca teks.",
      "tip": "Cari kata kunci dalam teks.",
      "example": "Dokkai mondai wo tokimasu."
    },
    {
      "ja": "聴解",
      "romaji": "choukai",
      "id": "Mendengarkan",
      "context": "Kemampuan mendengar audio.",
      "tip": "Fokus pada intonasi pembicara.",
      "example": "Choukai no latihan desu."
    },
    {
      "ja": "合格",
      "romaji": "goukaku",
      "id": "Lulus Ujian",
      "context": "Mencapai nilai kelulusan.",
      "tip": "Belajar rajin agar lulus JFT.",
      "example": "JFT-Basic ni goukaku shimasu!"
    }
  ],
  "12": [
    {
      "ja": "面接",
      "romaji": "mensetsu",
      "id": "Wawancara Kerja",
      "context": "Wawancara dengan panti.",
      "tip": "Jaga kontak mata dan tersenyum.",
      "example": "Mensetsu ga arimasu."
    },
    {
      "ja": "志望動機",
      "romaji": "shiboudouki",
      "id": "Alasan Melamar",
      "context": "Motivasi bekerja.",
      "tip": "Hubungkan dengan keinginan menolong.",
      "example": "Shiboudouki wo hanashimasu."
    },
    {
      "ja": "自己紹介",
      "romaji": "jikoshoukai",
      "id": "Perkenalan Diri",
      "context": "Memperkenalkan profil.",
      "tip": "Ucapkan nama dan asal LPK.",
      "example": "Jikoshoukai wo onegai shimasu."
    },
    {
      "ja": "長所",
      "romaji": "chousho",
      "id": "Kelebihan / Kekuatan",
      "context": "Karakter positif diri.",
      "tip": "Contoh: sabar, ceria, rajin.",
      "example": "Watashi no chousho wa akarui tokoro desu."
    },
{
      "ja": "短所",
      "romaji": "tansho",
      "id": "Kelemahan / Kekurangan",
      "context": "Karakter negatif diri.",
      "tip": "Sebutkan juga cara mengatasinya.",
      "example": "Tansho wa chotto shinpaishou desu."
    }
  ]
};

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

// Dynamically generated Kanji-to-Hiragana mapping at startup
const DYNAMIC_KANJI_MAP = {};

const initDynamicKanjiMap = () => {
  Object.keys(VOCAB_BY_WEEK).forEach(week => {
    const vocabList = VOCAB_BY_WEEK[week] || [];
    vocabList.forEach(item => {
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

// Trigger initialization
initDynamicKanjiMap();

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

  // Helper to generate dynamic questions for the session
  const generateQuestionsForSession = (weekNum) => {
    const staticQuestions = QUESTIONS_BY_WEEK[weekNum] || [];
    const vocab = VOCAB_BY_WEEK[weekNum] || VOCAB_BY_WEEK[1];
    
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
    if (generated.length < targetCount) {
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
    
    // Shuffle the entire set of questions so they vary every session
    return shuffleArray(generated).slice(0, targetCount);
  };

  useEffect(() => {
    const sessionQs = generateQuestionsForSession(weekNumber);
    setSessionQuestions(sessionQs);
    setInitialLength(sessionQs.length);
    
    // Reset all session states for the new week!
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
    const nextScore = isAnsCorrect ? score + 1 : score;
    let willRepeat = false;

    if (isAnsCorrect) {
      setScore(nextScore);
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

      const currentFails = currentQuestion.failCount || 0;
      // Allow max 3 retries (total 4 attempts) per question to avoid frustration
      if (currentFails < 3) {
        willRepeat = true;
        setSessionQuestions(prev => [...prev, {
          ...currentQuestion,
          failCount: currentFails + 1,
          isReview: true
        }]);
      }
    }

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
      const gainedXp = actualScore * 15;
      const gainedCoins = actualScore * 5;

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
  const retrySession = () => {
    const sessionQs = generateQuestionsForSession(weekNumber);
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
              src="/mascot_cheering.png" 
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
              ? `Luar biasa, kamu berhasil menyelesaikan latihan! Benar ${score} dari ${initialLength} soal.` 
              : `Ayo coba lagi untuk meningkatkan pemahamanmu. Benar ${score} dari ${initialLength} soal.`}
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

          {/* Animated Cheering Crowd Emojis */}
          {passed && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', margin: '4px 0 12px 0', overflow: 'hidden', height: '36px', alignItems: 'flex-end', flexShrink: 0 }}>
              {['🙌', '🧑‍⚕️', '🎉', '👵', '👴', '👏', '🥳'].map((emoji, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    fontSize: '20px',
                    animation: `jump 0.5s ease-in-out infinite alternate`,
                    animationDelay: `${idx * 0.08}s`,
                    display: 'inline-block'
                  }}
                >
                  {emoji}
                </span>
              ))}
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
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      {/* Scrollable Quiz Content */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px var(--space-margin) 280px var(--space-margin)' 
        }}
      >
        {/* Progress Bar & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Question Prompt */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <span className="badge badge-blue" style={{ marginBottom: '8px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
              <button
                onClick={playQuestionAudio}
                style={{
                  width: '96px',
                  height: '96px',
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
                <Volume2 size={40} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              <div className="card no-press" style={{ textAlign: 'center', backgroundColor: 'var(--surface-container-low)' }}>
                <h2 style={{ color: 'var(--primary)' }}>{currentQuestion.targetJa}</h2>
                <p className="body-md" style={{ marginTop: '8px' }}>Arti: {currentQuestion.meaning}</p>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
              <div className="card no-press" style={{ width: '100%', textAlign: 'center' }}>
                <h1 className="japanese-display" style={{ marginBottom: '8px' }}>
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
      </div>

      {/* Sticky Answer Feedback Panel (Duolingo Style) */}
      {isAnswerChecked && (
        <div 
          style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: `3px solid ${isCorrect ? 'var(--secondary)' : 'var(--tertiary)'}`,
            backgroundColor: isCorrect ? '#ecfdf5' : '#fef2f2',
            padding: '20px var(--space-margin)',
            boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.15)',
            zIndex: 150,
            maxHeight: '80%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isCorrect ? (
              <CheckCircle size={32} color="var(--secondary)" />
            ) : (
              <XCircle size={32} color="var(--tertiary)" />
            )}
            <div>
              <h3 style={{ color: isCorrect ? 'var(--secondary)' : 'var(--tertiary)', margin: 0 }}>
                {isCorrect ? 'Jawaban Benar!' : 'Jawaban Salah!'}
              </h3>
              {isCorrect && currentQuestion.type === 'C' && typedInput.trim().toLowerCase() !== currentQuestion.targetRomaji.toLowerCase() && (
                <p className="body-md" style={{ color: '#065f46', margin: '4px 0 0 0', fontWeight: '600' }}>
                  Ada sedikit salah ketik. Ejaan resmi: <strong style={{ textDecoration: 'underline' }}>{currentQuestion.targetRomaji}</strong> ({currentQuestion.targetJa})
                </p>
              )}
              {!isCorrect && currentQuestion.type === 'B' && (
                <p className="body-md" style={{ color: 'var(--tertiary)', margin: '4px 0 0 0' }}>
                  Jawaban benar: {currentQuestion.options[currentQuestion.answer]}
                </p>
              )}
              {!isCorrect && currentQuestion.type === 'C' && (
                <p className="body-md" style={{ color: 'var(--tertiary)', margin: '4px 0 0 0' }}>
                  Jawaban benar: {currentQuestion.targetRomaji} ({currentQuestion.targetJa})
                </p>
              )}
            </div>
          </div>

          {/* Detailed Explanation (Image 5 Style) */}
          {currentQuestion.explanation && (
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--surface-container-high)' }}>
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

          <button 
            className={`btn ${isCorrect ? 'btn-secondary' : 'btn-tertiary'}`}
            style={{ width: '100%', marginTop: '8px' }}
            onClick={handleNext}
          >
            Lanjutkan
            <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      )}
    </div>
  );
}
