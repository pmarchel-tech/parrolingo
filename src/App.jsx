import React, { useState, useEffect } from 'react';
import { Map, BookOpen, BarChart3, User, Award, Flame, Coins, ShieldAlert, ChevronDown } from 'lucide-react';
import { initDB, seedDefaultDictionary, seedDefaultLogs, getProgress, resetDB } from './utils/db';

// Import Screens
import MapScreen from './components/MapScreen';
import LearnScreen from './components/LearnScreen';
import DictScreen from './components/DictScreen';
import B2BDashboard from './components/B2BDashboard';
import ProfileScreen from './components/ProfileScreen';

// Safe Error Boundary to catch rendering and runtime errors in screens
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
            <ShieldAlert size={48} color="var(--tertiary)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'var(--on-surface)' }}>Terjadi Kesalahan!</h3>
            <p className="body-md" style={{ color: 'var(--outline)', marginBottom: '20px', fontSize: '13px', lineHeight: '1.4' }}>
              Detail: {this.state.error ? this.state.error.message : 'Kesalahan tidak dikenal'}
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

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [dbError, setDbError] = useState(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [activeScreen, setActiveScreen] = useState('map');
  const [sessionWeek, setSessionWeek] = useState(1);
  const [sessionType, setSessionType] = useState('practice');
  const [progress, setProgress] = useState(null);
  // Controls visibility of floating navigation; hide only after learning starts
  const [showNav, setShowNav] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(() => {
    return localStorage.getItem('kaigolingo_selected_program') || 'kaigo';
  });

  const handleProgramChange = (val) => {
    setSelectedProgram(val);
    localStorage.setItem('kaigolingo_selected_program', val);
  };

  // Initialize DB and Load Stats
  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        await seedDefaultDictionary();
        await seedDefaultLogs();
        const userProgress = await getProgress();
        setProgress(userProgress);
        
        // Load API Key
        const savedKey = localStorage.getItem('kaigolingo_gemini_api_key');
        if (savedKey) setApiKey(savedKey);

        setIsDbReady(true);
      } catch (err) {
        console.error('Failed to initialize local DB:', err);
        setDbError(err.message || String(err));
      }
    };
    setup();
  }, []);

  const handleStartSession = (weekNum, type) => {
    setSessionWeek(weekNum);
    setSessionType(type);
    setShowNav(false); // hide navigation when learning begins
    setActiveScreen('learn');
  };

  const handleEndSession = async (nextWeekNum) => {
    // Reload progress stats after session completes
    const userProgress = await getProgress();
    setProgress(userProgress);
    // When session ends, ensure navigation is visible again
    setShowNav(true);
    if (nextWeekNum && nextWeekNum <= 12) {
      setSessionWeek(nextWeekNum);
      setSessionType('practice'); // Default to practice for next week
      setShowNav(false);
      setActiveScreen('learn');
    } else {
      setActiveScreen('map');
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Apakah Anda yakin ingin mereset database lokal? Semua progress belajar Anda akan dihapus.')) {
      try {
        await resetDB();
        alert('Database berhasil direset. Halaman akan dimuat ulang.');
        window.location.reload();
      } catch (err) {
        alert('Gagal mereset database: ' + err.message);
      }
    }
  };

  if (dbError) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface)', padding: '20px' }}>
        <div className="card no-press" style={{ textAlign: 'center', padding: '24px', border: '2px solid var(--tertiary)', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)' }}>
          <ShieldAlert size={48} color="var(--tertiary)" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--tertiary)', marginBottom: '8px' }}>Gagal Memuat Database</h3>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)', fontSize: '13px', lineHeight: '1.4', marginBottom: '20px' }}>
            Detail: {dbError}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Muat Ulang Halaman
            </button>
            <button className="btn btn-outline" onClick={handleResetDatabase} style={{ borderColor: 'var(--tertiary)', color: 'var(--tertiary)' }}>
              Reset Database Lokal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isDbReady || !progress) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>Memuat KaigoLingo...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* App Header (Hidden during learning sessions) */}
      {activeScreen !== 'learn' && (
        <header className="app-header">
          <div className="header-user">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Budi Avatar"
              className="header-avatar"
            />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Program Belajar</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <select 
                  value={selectedProgram}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--primary)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    outline: 'none',
                    padding: 0,
                    margin: 0,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    maxWidth: '160px',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <option value="kaigo" style={{ color: 'var(--on-surface)', fontWeight: '500' }}>Kaigo - Perawat</option>
                  <option value="seizogyo" style={{ color: 'var(--on-surface)', fontWeight: '500' }}>Seizogyo - Pabrik</option>
                  <option value="kensetsugyo" style={{ color: 'var(--on-surface)', fontWeight: '500' }}>Kensetsugyo - Konstruksi</option>
                  <option value="nogyo" style={{ color: 'var(--on-surface)', fontWeight: '500' }}>Nogyo - Perkebunan</option>
                </select>
                <ChevronDown size={16} color="var(--primary)" style={{ cursor: 'pointer', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f97316', fontWeight: '700', fontSize: '14px' }}>
              <Flame size={18} fill="#f97316" />
              <span>{progress.streak}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308', fontWeight: '700', fontSize: '14px' }}>
              <Coins size={18} fill="#eab308" />
              <span>{progress.coins}</span>
            </div>
          </div>
        </header>
      )}

      {/* Screen Router */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeScreen === 'map' && (
          <MapScreen
            progress={progress}
            onStartSession={handleStartSession}
            onModalOpen={() => setShowNav(false)}
            onModalClose={() => setShowNav(true)}
          />
        )}
        {activeScreen === 'dictionary' && (
          <DictScreen apiKey={apiKey} />
        )}
        {activeScreen === 'dashboard' && (
          <B2BDashboard progress={progress} onProgressUpdate={setProgress} />
        )}
        {activeScreen === 'profile' && (
          <ProfileScreen 
            progress={progress} 
            onProgressUpdate={setProgress}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
          />
        )}
        {activeScreen === 'learn' && (
          <SafeErrorBoundary onFallback={() => handleEndSession()}>
            <LearnScreen 
              weekNumber={sessionWeek} 
              sessionType={sessionType} 
              progress={progress}
              onEndSession={handleEndSession}
            />
          </SafeErrorBoundary>
        )}
      </main>

      {/* Render navigation only when not in learning mode */}
      {showNav && activeScreen !== 'learn' && (
        <nav className="bottom-nav-floating">
          <button 
            className={`nav-item-floating ${activeScreen === 'map' ? 'active' : ''}`}
            onClick={() => { setShowNav(true); setActiveScreen('map'); }}
            title="Map"
          >
            <div className="icon-circle">
              <Map size={24} />
            </div>
          </button>

          <button 
            className={`nav-item-floating ${activeScreen === 'dictionary' ? 'active' : ''}`}
            onClick={() => { setShowNav(true); setActiveScreen('dictionary'); }}
            title="Dictionary"
          >
            <div className="icon-circle">
              <BookOpen size={24} />
            </div>
          </button>

          <button 
            className={`nav-item-floating ${activeScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setShowNav(true); setActiveScreen('dashboard'); }}
            title="LPK B2B"
          >
            <div className="icon-circle">
              <BarChart3 size={24} />
            </div>
          </button>

          <button 
            className={`nav-item-floating ${activeScreen === 'profile' ? 'active' : ''}`}
            onClick={() => { setShowNav(true); setActiveScreen('profile'); }}
            title="Profile"
          >
            <div className="icon-circle">
              <User size={24} />
            </div>
          </button>
        </nav>
      )}
    </div>
  );
}
