import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';
import '../styles/common.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [darkMode, setDarkMode] = useState(false);
  const [particles, setParticles] = useState([]);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const navigate = useNavigate();

  // Initialize particles and check backend health
  useEffect(() => {
    // Particle animation
    const initParticles = () => {
      const particlesArray = Array.from({ length: 30 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 5 + 2,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1
      }));
      setParticles(particlesArray);
      
      const moveParticles = setInterval(() => {
        setParticles(prev => prev.map(p => ({
          ...p,
          x: (p.x + p.speedX) % window.innerWidth,
          y: (p.y + p.speedY) % window.innerHeight
        })));
      }, 50);
      
      return () => clearInterval(moveParticles);
    };

    initParticles();

    // Backend health check
    const checkBackend = async () => {
  try {
    const response = await axios.get(
      process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5001/api/health'
        : '/api/health',
      { 
        withCredentials: true,
        timeout: 3000 
      }
    );
    setBackendStatus('healthy');
  } catch (err) {
    console.error('Health check failed:', err);
    setBackendStatus('unavailable');
    setError(`Backend connection failed: ${err.message}`);
  }
};

    checkBackend();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/login', 
        { email, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (res.data.success) {
        //localStorage.setItem('userToken', res.data.token);
        //localStorage.setItem('userEmail', email);
        navigate('/personalityquestions');
      } else {
        setError(res.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      let errorMessage = 'Login service unavailable';
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMessage = 'No response from server - check your connection';
      } else {
        errorMessage = err.message || 'Login failed';
      }
      
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('test@example.com');
    setPassword('1234');
    setShowDemoCredentials(false);
  };

  return (
    <div className={`login-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Animated background particles */}
      <div className="particles-container">
        {particles.map((p, i) => (
          <div 
            key={i}
            className="particle"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.size / 7
            }}
          />
        ))}
      </div>

      <div className="login-card">
        {/* Theme toggle */}
        <div className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️' : '🌙'}
        </div>

        <h2>My Knowledge Portal</h2>
        
        {backendStatus === 'checking' && (
          <div className="status-message">Connecting to server...</div>
        )}
        
        {backendStatus === 'unavailable' && (
          <div className="error-message">
            {error}
            <button onClick={() => window.location.reload()} className="retry-btn">
              Retry Connection
            </button>
          </div>
        )}

        {backendStatus === 'healthy' && (
          <>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="input-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading || backendStatus !== 'healthy'}
                className={loading ? 'loading' : ''}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <div className="demo-credentials">
              <button 
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                className="show-demo-btn"
              >
                {showDemoCredentials ? 'Hide Demo Credentials' : 'Show Demo Credentials'}
              </button>
              
              {showDemoCredentials && (
                <div className="credentials-container">
                  <p>Email: test@example.com</p>
                  <p>Password: 1234</p>
                  <button 
                    onClick={fillDemoCredentials}
                    className="use-demo-btn"
                  >
                    Auto-fill Credentials
                  </button>
                </div>
              )}
            </div>

            <div className="auth-redirect">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;