import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/HomePage.css';
import '../styles/common.css';

function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [topic, setTopic] = useState('');
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();

  // Initialize particles for background animation
  useEffect(() => {
    const initParticles = () => {
      const particlesArray = Array.from({ length: 30 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 5 + 2,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(52,152,219,0.5)'
      }));
      setParticles(particlesArray);
    };

    initParticles();
    const moveParticles = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: (p.x + p.speedX) % window.innerWidth,
        y: (p.y + p.speedY) % window.innerHeight
      })));
    }, 50);

    return () => clearInterval(moveParticles);
  }, [darkMode]);
  const handleLogout = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  navigate('/login');
  };
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5001/api/generate-questions', 
        { topic: searchTerm.trim() },
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (res.data.success) {
        setQuestions(res.data.questions);
        setTopic(searchTerm);
        setShowSurveyForm(true);
        setAnswers(res.data.questions.reduce((acc, _, i) => ({ ...acc, [i]: '' }), {}));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSurveySubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5001/api/submit-survey',
        { topic, answers: Object.values(answers), questions },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );
      
      if (res.data.success) {
        localStorage.setItem('subtopics', JSON.stringify(res.data.subtopics));
        localStorage.setItem('surveyTopic', topic);
        navigate('/subtopics', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit survey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`home-container ${darkMode ? 'dark' : 'light'}`}>
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
              backgroundColor: p.color,
              opacity: p.size / 7
            }}
          />
        ))}
      </div>

      {/* Theme toggle */}
      <div className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️' : '🌙'}
      </div>

      {!showSurveyForm ? (
        <div className="search-card">
          <h2>What would you like to learn about?</h2>
          <p className="subtitle">Discover your personalized learning path</p>
          
          <div className="search-bar">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter a topic (e.g., Python, Calculus)"
              className="search-input"
            />
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="search-button"
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Generating...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="survey-card">
          <h2>Help us personalize your learning about {topic}</h2>
          <p className="survey-subtitle">Select one option for each question:</p>
          
          <div className="survey-questions">
            {questions.map((q, i) => (
              <div key={i} className="question-card">
                <h4 className="question-text">
                  <span className="question-number">Q{i+1}:</span> {q.question}
                </h4>
                <div className="options-grid">
                  {q.options.map((option, j) => (
                    <div 
                      key={j} 
                      className={`option-card ${answers[i] === option ? 'selected' : ''}`}
                      onClick={() => setAnswers(prev => ({ ...prev, [i]: option }))}
                    >
                      <div className="option-circle"></div>
                      <div className="option-text">{option}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleSurveySubmit}
            disabled={loading || Object.values(answers).some(a => !a)}
            className="submit-button"
          >
            {loading ? (
              <>
                <span className="spinner"></span> Generating Your Path...
              </>
            ) : (
              'Get My Learning Path'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default HomePage;