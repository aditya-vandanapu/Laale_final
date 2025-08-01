import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SurveyPage() {
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get('/api/questions');
        setQuestions(response.data);
        
        // Initialize responses object
        const initialResponses = {};
        response.data.forEach(q => {
          initialResponses[q.id] = q.questionType === 'multiple-choice' ? '' : [];
        });
        setResponses(initialResponses);
      } catch (err) {
        setError("Failed to load survey questions. Please try again later.");
        console.error("Fetch questions error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, []);

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Validate all questions are answered
      const unanswered = questions.filter(q => 
        !responses[q.id] || 
        (Array.isArray(responses[q.id]) && responses[q.id].length === 0)
      );
      
      if (unanswered.length > 0) {
        throw new Error(`Please answer all questions. ${unanswered.length} remaining.`);
      }

      // Submit responses
      await axios.post('/api/save-personality', { responses });
      
      // Redirect to homepage after successful submission
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Submission failed. Please try again.");
      console.error("Survey submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading survey...</div>;
  
  return (
    <div className="survey-container">
      <h2>Personality Analysis Survey</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {questions.map((question) => (
            <div key={question.id} className="question-block">
                <p><strong>{question.question}</strong></p>
                {renderQuestionInput(question, responses[question.id], handleResponseChange)}
            </div>
        ))}

        
        <button 
          type="submit" 
          disabled={submitting}
          className={submitting ? 'submitting' : ''}
        >
          {submitting ? 'Submitting...' : 'Complete Survey'}
        </button>
      </form>
    </div>
  );
}

function renderQuestionInput(question, value, onChange) {
  switch (question.type) {
    case 'text':
      return (
        <input 
          type="text" 
          value={value || ''}
          onChange={(e) => onChange(question.id, e.target.value)}
          required
        />
      );
    //case 'multiple-choice':
    case 'radio':
      return (
        <div>
          {question.options.map((option) => (
            <label key={option} style={{ display: 'block', marginBottom: '0.5rem' }}>
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={String(value) === String(option)}
                onChange={(e) => onChange(question.id, e.target.value)}
                style={{ marginRight: '0.5rem' }}
              />
              {option}
            </label>
          ))}
        </div>
      );

    case 'scale':
      return (
        <div className="scale">
          {[1, 2, 3, 4, 5].map(num => (
            <label key={num}>
              <input 
                type="radio" 
                name={question.id} 
                value={num}
                checked={Number(value) === num}
                onChange={() => onChange(question.id, num)}
                required
              />
              {num}
            </label>
          ))}
        </div>
      );

    default:
      return <p>Unsupported question type</p>;
  }
return (
    <div className="survey-container">
      <h2>Personality Analysis Survey</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            className="question-block"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <p><strong>{question.question}</strong></p>
            {renderQuestionInput(question, responses[question.id], handleResponseChange)}
          </motion.div>
        ))}
        
        <button 
          type="submit" 
          disabled={submitting}
          className={submitting ? 'submitting' : ''}
        >
          {submitting ? 'Submitting...' : 'Complete Survey'}
        </button>
      </form>
    </div>
  );
}
export default SurveyPage;