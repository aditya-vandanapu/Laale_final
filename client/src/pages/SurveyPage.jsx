import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SurveyPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Load questions
  useEffect(() => {
    const loadQuestions = () => {
      try {
        const storedQuestions = localStorage.getItem('questions');
        if (!storedQuestions) throw new Error('No questions found');
        
        const parsed = JSON.parse(storedQuestions);
        if (!Array.isArray(parsed)) throw new Error('Invalid questions format');
        
        setQuestions(parsed);
        // Initialize empty answers
        setAnswers(parsed.reduce((acc, _, i) => ({ ...acc, [i]: '' }), {}));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await axios.post(
        'http://localhost:5001/api/submit-survey', 
        {
          answers,
          topic: localStorage.getItem('surveyTopic')
        },
        {
          withCredentials: true, // Crucial for sessions
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.data.success) {
        localStorage.setItem('subtopics', JSON.stringify(res.data.subtopics));
        navigate('/subtopics');
      } else {
        throw new Error(res.data.message || 'Submission failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Submission error');
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading questions...</div>;

  if (error || !questions.length) return (
    <div className="error-container">
      <h3>Error loading survey</h3>
      <p>{error || 'No questions available'}</p>
      <button onClick={() => navigate('/')}>Return Home</button>
    </div>
  );

  return (
    <div className="survey-container">
      <h2>Survey Questions</h2>
      
      {questions.map((q, i) => (
        <div key={i} className="question-card">
          <h4>Question {i+1}: {q}</h4>
          <textarea
            value={answers[i] || ''}
            onChange={(e) => setAnswers(prev => ({
              ...prev,
              [i]: e.target.value
            }))}
            placeholder="Your answer..."
            rows={3}
          />
        </div>
      ))}

      {error && <div className="error-message">{error}</div>}

      <button 
        onClick={handleSubmit}
        disabled={submitting}
        className="submit-btn"
      >
        {submitting ? 'Submitting...' : 'Submit Survey'}
      </button>
    </div>
  );
}

export default SurveyPage;