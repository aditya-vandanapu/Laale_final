import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';
import '../styles/common.css';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [darkMode, setDarkMode] = useState(false);
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Particle animation (same as login page)
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
    // Use absolute URL in development
    const url = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5001/api/health' 
      : '/api/health';
    
    const response = await axios.get(url, { 
      timeout: 3000 
    });
    
    if (response.data.status === 'ok') {
      setBackendStatus('healthy');
    } else {
      throw new Error('Invalid health response');
    }
  } catch (err) {
    console.error('Backend connection failed:', err);
    setBackendStatus('unavailable');
    setError(`Cannot connect to backend: ${err.message}`);
  }
};

    checkBackend();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!name || !username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(
        '/api/signup', 
        { name, username, email, password },
        { 
          withCredentials: true,  
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (res.data.success) {
        // Redirect to login page after successful signup
        navigate('/login', { state: { signupSuccess: true } });
      } else {
        setError(res.data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      let errorMessage = 'Signup service unavailable';
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMessage = 'No response from server - check your connection';
      } else {
        errorMessage = err.message || 'Signup failed';
      }
      
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
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

        <h2>Create Account</h2>
        
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
            
            <form onSubmit={handleSignup}>
              <div className="input-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="input-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
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
              
              <div className="input-group">
                <label>Confirm Password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <span className="spinner"></span> Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>

            <div className="auth-redirect">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SignupPage;