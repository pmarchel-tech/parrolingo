import React, { useState, useEffect } from 'react';
import { Map, BookOpen, BarChart3, User, Award, Flame, Coins, ShieldAlert } from 'lucide-react';
import { initDB, seedDefaultDictionary, seedDefaultLogs, getProgress } from './utils/db';

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
  const [activeScreen, setActiveScreen] = useState('map'); // map, dictionary, dashboard, profile, learn
  const [progress, setProgress] = useState(null);
  const [sessionWeek, setSessionWeek] = useState(null);
  const [sessionType, setSessionType] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [isDbReady, setIsDbReady] = useState(false);

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
      }
    };
    setup();
  }, []);

  const handleStartSession = (weekNum, type) => {
    setSessionWeek(weekNum);
    setSessionType(type);
    setActiveScreen('learn');
  };

  const handleEndSession = async (nextWeekNum) => {
    // Reload progress stats after session completes
    const userProgress = await getProgress();
    setProgress(userProgress);
    if (nextWeekNum && nextWeekNum <= 12) {
      setSessionWeek(nextWeekNum);
      setSessionType('practice'); // Default to practice for next week
      setActiveScreen('learn');
    } else {
      setActiveScreen('map');
    }
  };

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
              <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: '700' }}>Halo, Budi!</div>
              <div className="header-title">KaigoLingo</div>
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
          <MapScreen progress={progress} onStartSession={handleStartSession} />
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

      {/* Bottom Navigation (Hidden during learning sessions) */}
      {activeScreen !== 'learn' && (
        <nav className="bottom-nav">
          <button 
            className={`nav-item ${activeScreen === 'map' ? 'active' : ''}`}
            onClick={() => setActiveScreen('map')}
          >
            <div className="nav-item-icon-wrapper">
              <Map size={22} />
            </div>
            Map
          </button>

          <button 
            className={`nav-item ${activeScreen === 'dictionary' ? 'active' : ''}`}
            onClick={() => setActiveScreen('dictionary')}
          >
            <div className="nav-item-icon-wrapper">
              <BookOpen size={22} />
            </div>
            Dictionary
          </button>

          <button 
            className={`nav-item ${activeScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveScreen('dashboard')}
          >
            <div className="nav-item-icon-wrapper">
              <BarChart3 size={22} />
            </div>
            LPK B2B
          </button>

          <button 
            className={`nav-item ${activeScreen === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveScreen('profile')}
          >
            <div className="nav-item-icon-wrapper">
              <User size={22} />
            </div>
            Profile
          </button>
        </nav>
      )}
    </div>
  );
}
