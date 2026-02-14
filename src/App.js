import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import './App.css';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_0mCsfOWeXjC4FG_Ii7-G9hrL2PL7SlE",
  databaseURL: "https://project1-2c152-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project1-2c152",
  storageBucket: "project1-2c152.firebasestorage.app",
  messagingSenderId: "409743303580",
  appId: "1:409743303580:web:cde6e4d9637378623d5e59",
  measurementId: "G-J3TYQRF8YF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const ledRef = ref(database, 'ledtest');

function App() {
  const [ledState, setLedState] = useState('OFF');
  const [isConnected, setIsConnected] = useState(false);
  const [toggleCount, setToggleCount] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('--:--:--');
  const [logs, setLogs] = useState([]);

  // Start uptime counter
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Listen to Firebase changes
  useEffect(() => {
    console.log('Setting up Firebase listener...');
    
    const unsubscribe = onValue(ledRef, (snapshot) => {
      const state = snapshot.val();
      console.log('Firebase value received:', state);
      
      if (state === null || state === undefined) {
        console.log('No value in Firebase, initializing to OFF');
        set(ledRef, 'OFF');
        return;
      }
      
      const upperState = String(state).toUpperCase();
      console.log('Converted state:', upperState);
      
      if (upperState !== ledState) {
        console.log('State changed from', ledState, 'to', upperState);
        setLedState(upperState);
        setToggleCount(prev => prev + 1);
        
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString());
        
        addLog(`LED turned ${upperState}`, upperState === 'ON' ? 'on' : 'off');
      }
      
      setIsConnected(true);
    }, (error) => {
      console.error('Firebase error:', error);
      setIsConnected(false);
    });

    return () => {
      console.log('Cleaning up Firebase listener');
      unsubscribe();
    };
  }, [ledState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '1' || e.key.toLowerCase() === 'o') {
        turnOnLED();
      } else if (e.key === '0' || e.key.toLowerCase() === 'f') {
        turnOffLED();
      } else if (e.key.toLowerCase() === 'c' && e.ctrlKey) {
        e.preventDefault();
        clearLog();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Load logs from localStorage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('ledLogs');
    const savedCount = localStorage.getItem('toggleCount');
    
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Error loading logs:', e);
      }
    }
    if (savedCount) {
      setToggleCount(parseInt(savedCount));
    }

    // Add initial log
    setTimeout(() => {
      addLog('Dashboard connected to Firebase', 'on');
    }, 1000);
  }, []);

  // Save logs to localStorage
  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem('ledLogs', JSON.stringify(logs.slice(0, 20)));
      localStorage.setItem('toggleCount', toggleCount.toString());
    }
  }, [logs, toggleCount]);

  const turnOnLED = () => {
    console.log('🟢 Starting turnOnLED function');
    set(ledRef, 'ON')
      .then(() => {
        console.log('✅ SUCCESS: LED turned ON');
      })
      .catch((error) => {
        console.error('❌ ERROR turning LED ON:', error);
        alert('Failed to turn LED ON: ' + error.message);
      });
  };

  const turnOffLED = () => {
    console.log('🔴 Starting turnOffLED function');
    set(ledRef, 'OFF')
      .then(() => {
        console.log('✅ SUCCESS: LED turned OFF');
      })
      .catch((error) => {
        console.error('❌ ERROR turning LED OFF:', error);
        alert('Failed to turn LED OFF: ' + error.message);
      });
  };

  const addLog = (message, type) => {
    const now = new Date();
    const newLog = {
      id: Date.now(),
      message,
      time: now.toLocaleTimeString(),
      type
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 20));
  };

  const clearLog = () => {
    setLogs([]);
    setToggleCount(0);
    localStorage.removeItem('ledLogs');
    localStorage.removeItem('toggleCount');
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>🔌 ESP8266 LED Control Dashboard</h1>
          <p className="project-name">Project: project1-2c152</p>
        </div>
        <div className="connection-status">
          <span className={`status-dot ${!isConnected ? 'disconnected' : ''}`}></span>
          <span style={{ color: isConnected ? '#4CAF50' : '#f44336' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* LED Control Card */}
        <div className="card led-control-card">
          <div className="card-header">
            <h2>💡 LED Control</h2>
            <div className={`led-status-badge ${ledState === 'ON' ? 'on' : ''}`}>
              {ledState}
            </div>
          </div>
          <div className="card-body">
            <div className="led-visual">
              <div className={`led-bulb ${ledState === 'ON' ? 'on' : ''}`}></div>
              <div className={`led-glow ${ledState === 'ON' ? 'on' : ''}`}></div>
            </div>
            <div className="control-buttons">
              <button 
                className="btn btn-on" 
                onClick={() => {
                  console.log('ON button clicked');
                  turnOnLED();
                }}
              >
                <span className="btn-icon">💡</span>
                <span className="btn-text">Turn ON</span>
              </button>
              <button 
                className="btn btn-off" 
                onClick={() => {
                  console.log('OFF button clicked');
                  turnOffLED();
                }}
              >
                <span className="btn-icon">⚫</span>
                <span className="btn-text">Turn OFF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="card stats-card">
          <div className="card-header">
            <h2>📊 Statistics</h2>
          </div>
          <div className="card-body">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">🔄</div>
                <div className="stat-info">
                  <p className="stat-label">Total Toggles</p>
                  <p className="stat-value">{toggleCount}</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">⏱️</div>
                <div className="stat-info">
                  <p className="stat-label">Uptime</p>
                  <p className="stat-value">{formatUptime(uptime)}</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">💡</div>
                <div className="stat-info">
                  <p className="stat-label">Current State</p>
                  <p className="stat-value" style={{ color: ledState === 'ON' ? '#4CAF50' : '#f44336' }}>
                    {ledState}
                  </p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🕐</div>
                <div className="stat-info">
                  <p className="stat-label">Last Update</p>
                  <p className="stat-value" style={{ fontSize: '1.2em' }}>{lastUpdate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log Card */}
        <div className="card log-card">
          <div className="card-header">
            <h2>📝 Activity Log</h2>
            <button className="btn-clear" onClick={clearLog}>Clear Log</button>
          </div>
          <div className="card-body">
            <div className="log-container">
              {logs.length === 0 ? (
                <p className="log-empty">No activity yet...</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className={`log-entry ${log.type}`}>
                    <span className="log-message">{log.message}</span>
                    <span className="log-time">{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Device Info Card */}
        <div className="card info-card">
          <div className="card-header">
            <h2>ℹ️ Device Information</h2>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Device:</span>
                <span className="info-value">ESP8266 NodeMCU</span>
              </div>
              <div className="info-item">
                <span className="info-label">LED Pin:</span>
                <span className="info-value">D1 (GPIO5)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Database:</span>
                <span className="info-value">Firebase Realtime DB</span>
              </div>
              <div className="info-item">
                <span className="info-label">Path:</span>
                <span className="info-value">ledtest</span>
              </div>
              <div className="info-item">
                <span className="info-label">Region:</span>
                <span className="info-value">Asia Southeast</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value">
                  <span className="status-indicator"></span> Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>ESP8266 LED Control Dashboard © 2026 | Powered by Firebase</p>
      </footer>
    </div>
  );
}

export default App;