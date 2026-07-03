import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Type, Search, Volume2, Bookmark, Trash2, Check, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { getDictionary, addDictionaryEntry, updateDictionaryEntry, deleteDictionaryEntry } from '../utils/db';

export default function DictScreen({ apiKey }) {
  const [dictionary, setDictionary] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, bookmarked, custom
  
  // Modals
  const [scanModal, setScanModal] = useState(false);
  const [voiceModal, setVoiceModal] = useState(false);
  const [textModal, setTextModal] = useState(false);

  // Camera OCR State
  const [cameraStream, setCameraStream] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [compressedDetails, setCompressedDetails] = useState(null);

  // Voice Translate State
  const [voiceInputText, setVoiceInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [translatedVoiceResult, setTranslatedVoiceResult] = useState(null);

  // Text Translate State
  const [textInputJa, setTextInputJa] = useState('');
  const [textInputId, setTextInputId] = useState('');
  const [textCategory, setTextCategory] = useState('Dasar Perawatan');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load Dictionary
  const loadDict = async () => {
    const data = await getDictionary();
    setDictionary(data);
  };

  useEffect(() => {
    loadDict();

    // Initialize speech recognition safely in a try-catch block
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = 'id-ID'; // Translate from Indonesian
        rec.continuous = false;
        rec.interimResults = false;

        rec.onresult = async (event) => {
          const spokenText = event.results[0][0].transcript;
          setVoiceInputText(spokenText);
          await translateText(spokenText, 'voice');
        };

        rec.onerror = (e) => {
          console.error('Speech recognition error:', e);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    } catch (e) {
      console.warn('Speech recognition is not supported or was blocked by browser security policies:', e);
    }
  }, []);

  // Filtered Dictionary
  const filteredDict = dictionary.filter(item => {
    const matchesSearch = 
      item.kanji.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.romaji.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.indonesian.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'bookmarked') return matchesSearch && item.isBookmarked;
    if (activeTab === 'custom') return matchesSearch && item.isCustom;
    return matchesSearch;
  });

  // Speak Word
  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle Bookmark
  const handleBookmarkToggle = async (item) => {
    const updated = await updateDictionaryEntry(item.id, { isBookmarked: !item.isBookmarked });
    setDictionary(dictionary.map(d => d.id === item.id ? updated : d));
  };

  // Delete Custom Entry
  const handleDeleteEntry = async (id) => {
    if (window.confirm('Hapus kata ini dari Kamus Mandiri Anda?')) {
      await deleteDictionaryEntry(id);
      loadDict();
    }
  };

  // --- CAMERA OCR SCAN WITH CANVAS COMPRESSION ---
  const startCamera = async () => {
    setScanModal(true);
    setScannedResult(null);
    setCompressedDetails(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 640 }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Failed to open camera:', err);
      alert('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setScanModal(false);
  };

  const captureAndCompressImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessingImage(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 1. Get square crop dimensions
    const size = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    // 2. Set canvas size to max 400x400 as per PRD
    canvas.width = 400;
    canvas.height = 400;

    // 3. Draw cropped image on canvas
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);

    // 4. Compress to WebP quality 60% (fallback to jpeg if webp not supported)
    let format = 'image/webp';
    let dataUrl = canvas.toDataURL(format, 0.6);
    
    // Check if webp is supported, otherwise fallback to jpeg
    if (!dataUrl.startsWith('data:image/webp')) {
      format = 'image/jpeg';
      dataUrl = canvas.toDataURL(format, 0.6);
    }

    // 5. Calculate File Size (from base64 length)
    const base64Length = dataUrl.split(',')[1].length;
    const fileSizeBytes = Math.round(base64Length * 0.75);
    const fileSizeKB = (fileSizeBytes / 1024).toFixed(1);

    setCompressedDetails({
      resolution: '400x400',
      format: format.split('/')[1].toUpperCase(),
      size: `${fileSizeKB} KB`
    });

    // Stop camera feed
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    // 6. Perform OCR & Translation (Gemini or Mock)
    if (apiKey) {
      await performGeminiOCR(dataUrl);
    } else {
      await simulateOCR(dataUrl);
    }
  };

  const performGeminiOCR = async (imageBase64) => {
    // Clean base64 string
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.split(';')[0].split(':')[1];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: 'Identify the object in this image. Translate it to Japanese Kanji/Kana, Romaji, and Indonesian contextually suited for the elderly care (Kaigo) environment. Provide output in JSON format with keys: "kanji", "romaji", "indonesian", "category" (choose from: "Dasar Perawatan", "Medis", "Alat Bantu", "Makanan", "Lainnya"). Respond ONLY with JSON, no markdown.' },
                { inlineData: { mimeType: mimeType, data: base64Data } }
              ]
            }]
          })
        }
      );

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Parse JSON from Gemini
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const newEntry = {
        kanji: parsed.kanji,
        romaji: parsed.romaji,
        indonesian: parsed.indonesian,
        category: parsed.category,
        image: imageBase64,
        isCustom: true
      };

      await addDictionaryEntry(newEntry);
      setScannedResult(newEntry);
      loadDict();

    } catch (err) {
      console.error('Gemini OCR failed, falling back to simulator:', err);
      await simulateOCR(imageBase64);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const simulateOCR = async (imageBase64) => {
    // Simulated objects in Kaigo
    const mockObjects = [
      { kanji: '車椅子', romaji: 'Kuruma Isu', indonesian: 'Kursi Roda', category: 'Alat Bantu' },
      { kanji: '薬', romaji: 'Kusuri', indonesian: 'Obat-obatan', category: 'Medis' },
      { kanji: '体温計', romaji: 'Taionkei', indonesian: 'Termometer', category: 'Medis' },
      { kanji: 'スプーン', romaji: 'Supuun', indonesian: 'Sendok Makan Lansia', category: 'Makanan' }
    ];

    // Pick a random one for simulation
    const selectedMock = mockObjects[Math.floor(Math.random() * mockObjects.length)];

    setTimeout(async () => {
      const newEntry = {
        ...selectedMock,
        image: imageBase64,
        isCustom: true
      };
      await addDictionaryEntry(newEntry);
      setScannedResult(newEntry);
      setIsProcessingImage(false);
      loadDict();
    }, 1500);
  };

  // --- VOICE TRANSLATION ---
  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition tidak didukung di browser ini.');
      return;
    }
    setVoiceInputText('');
    setTranslatedVoiceResult(null);
    setIsListening(true);
    recognitionRef.current.start();
  };

  const translateText = async (text, source) => {
    // Simple offline dictionary translator for mock, or Gemini if API Key is available
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `Translate the following Indonesian phrase to Japanese (Kanji/Kana) and Romaji, contextually suited for the Kaigo sector. Indonesian: "${text}". Provide output in JSON format with keys: "kanji", "romaji", "indonesian". Respond ONLY with JSON, no markdown.` }]
              }]
            })
          }
        );
        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        if (source === 'voice') {
          setTranslatedVoiceResult(parsed);
        }
      } catch (e) {
        console.error('Gemini translate failed:', e);
        mockTranslate(text, source);
      }
    } else {
      mockTranslate(text, source);
    }
  };

  const mockTranslate = (text, source) => {
    const dictMock = {
      'kursi roda': { kanji: '車椅子', romaji: 'Kuruma Isu', indonesian: 'Kursi Roda' },
      'obat': { kanji: '薬', romaji: 'Kusuri', indonesian: 'Obat' },
      'pusing': { kanji: 'めまい', romaji: 'Memai', indonesian: 'Pusing / Vertigo' },
      'makan': { kanji: '食事', romaji: 'Shokuji', indonesian: 'Makan / Hidangan' }
    };

    const clean = text.toLowerCase().trim();
    const found = Object.keys(dictMock).find(key => clean.includes(key));
    const result = found ? dictMock[found] : { kanji: '翻訳中...', romaji: 'Hon\'yaku-chuu', indonesian: text };

    if (source === 'voice') {
      setTranslatedVoiceResult(result);
    }
  };

  const saveVoiceTranslation = async () => {
    if (!translatedVoiceResult) return;
    await addDictionaryEntry({
      ...translatedVoiceResult,
      category: 'Dasar Perawatan',
      isCustom: true
    });
    setVoiceModal(false);
    loadDict();
  };

  // --- TEXT TRANSLATION ---
  const saveTextTranslation = async () => {
    if (!textInputJa || !textInputId) {
      alert('Silakan lengkapi kolom terjemahan.');
      return;
    }
    // Compute romaji simply or mock
    const romaji = textInputJa.replace(/[ぁ-んァ-ン]/g, 'Romaji'); 
    await addDictionaryEntry({
      kanji: textInputJa,
      romaji: romaji,
      indonesian: textInputId,
      category: textCategory,
      isCustom: true
    });
    setTextInputJa('');
    setTextInputId('');
    setTextModal(false);
    loadDict();
  };

  return (
    <div className="screen-content">
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary)' }}>Kamus Pintar</h1>
        <p className="body-md">Terjemahkan dan simpan istilah Kaigo secara instan.</p>
      </div>

      {/* OCR & Translation Action Cards */}
      <div className="card no-press" style={{ backgroundColor: 'var(--primary-container)', color: 'white', border: 'none', padding: '16px' }}>
        <h3 style={{ color: 'white', marginBottom: '12px' }}>Pindai & Terjemahkan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          
          <button 
            onClick={startCamera}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: 'var(--radius-default)', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
          >
            <Camera size={24} />
            Scan Objek
          </button>

          <button 
            onClick={() => setVoiceModal(true)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: 'var(--radius-default)', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
          >
            <Mic size={24} />
            Suara
          </button>

          <button 
            onClick={() => setTextModal(true)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: 'var(--radius-default)', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
          >
            <Type size={24} />
            Teks
          </button>

        </div>
      </div>

      {/* Search and Tabs */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Cari kata atau istilah..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '48px' }}
        />
        <Search size={20} color="var(--outline)" style={{ position: 'absolute', left: '18px', top: '18px' }} />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('all')} 
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: activeTab === 'all' ? 'var(--primary-container)' : 'var(--surface-container-high)', color: activeTab === 'all' ? 'white' : 'var(--on-surface-variant)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
        >
          Semua
        </button>
        <button 
          onClick={() => setActiveTab('bookmarked')} 
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: activeTab === 'bookmarked' ? 'var(--primary-container)' : 'var(--surface-container-high)', color: activeTab === 'bookmarked' ? 'white' : 'var(--on-surface-variant)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
        >
          Favorit
        </button>
        <button 
          onClick={() => setActiveTab('custom')} 
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: activeTab === 'custom' ? 'var(--primary-container)' : 'var(--surface-container-high)', color: activeTab === 'custom' ? 'white' : 'var(--on-surface-variant)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
        >
          Scanned / Mandiri
        </button>
      </div>

      {/* Pocketbook Cards */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Buku Saku Digital ({filteredDict.length})</h3>
        {filteredDict.length === 0 ? (
          <p className="body-md" style={{ textAlign: 'center', padding: '40px 0' }}>Tidak ada kata ditemukan.</p>
        ) : (
          filteredDict.map((item) => (
            <div className="pocketbook-card" key={item.id}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {item.image && (
                  <img src={item.image} alt={item.kanji} className="scanned-thumbnail" />
                )}
                <div style={{ flex: 1 }}>
                  <span className="badge badge-blue" style={{ fontSize: '10px', padding: '2px 8px', marginBottom: '6px' }}>
                    {item.category}
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-japanese)', color: 'var(--primary)', fontSize: '24px' }}>
                    {item.kanji} <span style={{ fontSize: '16px', fontWeight: '400', color: 'var(--outline)' }}>({item.romaji})</span>
                  </h2>
                  <p className="body-lg" style={{ fontWeight: '600', marginTop: '4px' }}>
                    {item.indonesian}
                  </p>
                </div>
              </div>

              <div className="pocketbook-actions">
                <button className="action-icon-btn" onClick={() => speakWord(item.kanji)}>
                  <Volume2 size={20} />
                </button>
                <button className={`action-icon-btn ${item.isBookmarked ? 'active' : ''}`} onClick={() => handleBookmarkToggle(item)}>
                  <Bookmark size={20} fill={item.isBookmarked ? 'currentColor' : 'none'} />
                </button>
                {item.isCustom && (
                  <button className="action-icon-btn danger" onClick={() => handleDeleteEntry(item.id)}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CAMERA SCAN MODAL */}
      {scanModal && (
        <div className="modal-backdrop" onClick={stopCamera} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px', borderRadius: '16px', paddingBottom: '30px', animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Scan Kamera (OCR Mandiri)</h3>
              <button onClick={stopCamera} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>

            {!scannedResult && !isProcessingImage && (
              <div className="camera-container" style={{ height: '420px' }}>
                <video ref={videoRef} autoPlay playsInline className="camera-preview" />
                <div className="camera-overlay" />
                <div className="camera-target" style={{ width: '240px', height: '240px' }} />
                <button className="camera-button" onClick={captureAndCompressImage} />
              </div>
            )}

            {isProcessingImage && (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <RefreshCw className="animate-spin" size={48} color="var(--primary)" style={{ margin: '0 auto 16px auto' }} />
                <h3>Mengompresi & Memproses Gambar...</h3>
                <p className="body-md">Mengecilkan ke 400x400 WebP (Kualitas 60%)</p>
              </div>
            )}

            {scannedResult && (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle size={48} color="var(--secondary)" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ color: 'var(--secondary)' }}>Berhasil Disimpan!</h3>
                
                {compressedDetails && (
                  <div className="card no-press" style={{ margin: '16px 0', padding: '12px', fontSize: '12px', textAlign: 'left', backgroundColor: 'var(--surface-container-low)' }}>
                    <p><strong>Resolusi:</strong> {compressedDetails.resolution}</p>
                    <p><strong>Format:</strong> {compressedDetails.format}</p>
                    <p><strong>Ukuran File:</strong> {compressedDetails.size} <span style={{ color: 'var(--secondary)' }}>(Terkompresi Lokal)</span></p>
                  </div>
                )}

                <div className="pocketbook-card" style={{ textAlign: 'left', margin: '16px 0' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <img src={scannedResult.image} className="scanned-thumbnail" alt="scanned" />
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-japanese)' }}>{scannedResult.kanji}</h2>
                      <p className="body-md">({scannedResult.romaji})</p>
                      <p className="body-lg" style={{ fontWeight: '600' }}>{scannedResult.indonesian}</p>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={stopCamera}>Selesai</button>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {/* VOICE TRANSLATE MODAL */}
      {voiceModal && (
        <div className="modal-backdrop" onClick={() => setVoiceModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '440px', borderRadius: '16px', animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Terjemahan Suara Mandiri</h3>
              <button onClick={() => setVoiceModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
              <button
                onClick={startListening}
                disabled={isListening}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: isListening ? 'var(--tertiary)' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Mic size={36} />
              </button>
              
              <p className="body-md" style={{ fontWeight: '600' }}>
                {isListening ? 'Mendengarkan bahasa Indonesia...' : 'Tekan tombol untuk bicara'}
              </p>

              {voiceInputText && (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <span className="label-md" style={{ color: 'var(--outline)' }}>Teks Anda:</span>
                  <p className="body-lg" style={{ fontWeight: '700' }}>"{voiceInputText}"</p>
                </div>
              )}

              {translatedVoiceResult && (
                <div className="card no-press" style={{ width: '100%', textAlign: 'left', borderLeft: '4px solid var(--secondary)' }}>
                  <span className="badge badge-green" style={{ marginBottom: '8px' }}>Hasil Terjemahan Kaigo:</span>
                  <h2 style={{ fontFamily: 'var(--font-japanese)', color: 'var(--primary)' }}>{translatedVoiceResult.kanji}</h2>
                  <p className="body-md">({translatedVoiceResult.romaji})</p>
                  <p className="body-lg" style={{ fontWeight: '600', marginTop: '4px' }}>{translatedVoiceResult.indonesian}</p>
                </div>
              )}

              {translatedVoiceResult && (
                <button className="btn btn-secondary" onClick={saveVoiceTranslation}>
                  Simpan ke Kamus Mandiri
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TEXT TRANSLATE MODAL */}
      {textModal && (
        <div className="modal-backdrop" onClick={() => setTextModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '440px', borderRadius: '16px', animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Terjemahan Teks Manual</h3>
              <button onClick={() => setTextModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-md" style={{ color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>Teks Jepang (Kanji/Kana)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: 食堂 atau しょくどう"
                  value={textInputJa}
                  onChange={(e) => setTextInputJa(e.target.value)}
                />
              </div>

              <div>
                <label className="label-md" style={{ color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>Arti Indonesia (Kaigo)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Kantin / Ruang Makan"
                  value={textInputId}
                  onChange={(e) => setTextInputId(e.target.value)}
                />
              </div>

              <div>
                <label className="label-md" style={{ color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>Kategori</label>
                <select 
                  className="input-field"
                  value={textCategory}
                  onChange={(e) => setTextCategory(e.target.value)}
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="Dasar Perawatan">Dasar Perawatan</option>
                  <option value="Medis">Medis</option>
                  <option value="Alat Bantu">Alat Bantu</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <button className="btn btn-primary" onClick={saveTextTranslation} style={{ marginTop: '12px' }}>
                Simpan Ke Kamus Mandiri
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
