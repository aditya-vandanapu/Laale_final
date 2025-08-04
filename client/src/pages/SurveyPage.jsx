/*import React, { useState, useEffect } from 'react';
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
*/
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SurveyPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState('');
  const navigate = useNavigate();

  // Load questions and verify topic
  useEffect(() => {
    const loadSurveyData = async () => {
      try {
        const currentTopic = localStorage.getItem('currentTopic');
        if (!currentTopic) {
          throw new Error('No topic selected');
        }
        setTopic(currentTopic);

        // Verify topic exists in backend
        const verifyRes = await axios.get(
          `api/verify-topic/${encodeURIComponent(currentTopic)}`,
          { withCredentials: true }
        );

        if (!verifyRes.data.exists) {
          throw new Error('Topic not found in database');
        }

        // Get questions
        const questionsRes = await axios.get(
          `api/topic-questions/${encodeURIComponent(currentTopic)}`,
          { withCredentials: true }
        );

        if (questionsRes.data.success) {
          setQuestions(questionsRes.data.questions);
          setAnswers(questionsRes.data.questions.reduce((acc, _, i) => ({ ...acc, [i]: '' }), {}));
        } else {
          throw new Error('Failed to load questions');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to initialize survey');
        // Optionally store the error in localStorage for debugging
        localStorage.setItem('surveyError', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSurveyData();
  }, [navigate]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      // First ensure topic is properly stored
      const storeRes = await axios.post(
        'api/store-topic',
        { topic },
        { withCredentials: true }
      );

      if (!storeRes.data.success) {
        throw new Error('Failed to verify topic storage');
      }

      // Then submit survey responses
      const submitRes = await axios.post(
        'api/submit-topic-survey',
        {
          topic,
          answers: Object.entries(answers).map(([index, value]) => ({
            questionId: questions[parseInt(index)].id || index,
            answer: value
          }))
        },
        { withCredentials: true }
      );

      if (submitRes.data.success) {
        localStorage.setItem('subtopics', JSON.stringify(submitRes.data.subtopics));
        localStorage.removeItem('surveyError'); // Clear any previous errors
        navigate('/subtopics');
      } else {
        throw new Error(submitRes.data.message || 'Survey submission failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Survey processing failed');
      console.error('Survey submission error:', err);
      // Store error details for debugging
      localStorage.setItem('surveyError', JSON.stringify({
        error: err.message,
        timestamp: new Date().toISOString(),
        topic
      }));
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading survey for {localStorage.getItem('currentTopic') || 'your topic'}...</p>
      </div>
    );
  }

  // Render error state
  if (error || !questions.length) {
    return (
      <div className="error-container">
        <h3>Survey Setup Failed</h3>
        <p>{error || 'Unable to load survey questions'}</p>
        <div className="error-actions">
          <button onClick={() => navigate('/home')}>Choose Different Topic</button>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-container">
      <header className="survey-header">
        <h2>{topic} Learning Assessment</h2>
        <p>Please answer these questions to personalize your learning path</p>
      </header>

      <div className="questions-container">
        {questions.map((question, index) => (
          <div key={`question-${index}`} className="question-card">
            <h3>
              <span className="question-number">Q{index + 1}:</span>
              {question.question || question}
            </h3>
            
            {question.options ? (
              <div className="options-container">
                {question.options.map((option, optIndex) => (
                  <div
                    key={`option-${optIndex}`}
                    className={`option ${answers[index] === option ? 'selected' : ''}`}
                    onClick={() => setAnswers(prev => ({ ...prev, [index]: option }))}
                  >
                    <input
                      type="radio"
                      id={`option-${index}-${optIndex}`}
                      checked={answers[index] === option}
                      onChange={() => {}}
                    />
                    <label htmlFor={`option-${index}-${optIndex}`}>{option}</label>
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[index] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                placeholder="Type your answer here..."
                rows={4}
              />
            )}
          </div>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="survey-footer">
        <button
          onClick={() => navigate('/home')}
          className="secondary-button"
          disabled={submitting}
        >
          Back to Topics
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.values(answers).some(a => !a)}
          className="primary-button"
        >
          {submitting ? (
            <>
              <span className="spinner"></span> Generating Your Path...
            </>
          ) : (
            'Get My Learning Path'
          )}
        </button>
      </div>
    </div>
  );
}

export default SurveyPage;