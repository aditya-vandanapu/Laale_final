import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/survey.css';

function SubtopicsPage() {
  const navigate = useNavigate();
  const subtopics = JSON.parse(localStorage.getItem('subtopics') || []);
  const topic = localStorage.getItem('surveyTopic') || 'your topic';

  const handleNewSurvey = () => {
    localStorage.removeItem('subtopics');
    localStorage.removeItem('surveyTopic');
    navigate('/home');
  };
  return (
    <div className="subtopics-container">
      <div className="results-card">
        <h2>Your Personalized Learning Path for {topic}</h2>
        <p className="subtitle">Based on your survey answers, we recommend focusing on:</p>
        
        <div className="subtopics-list">
          {subtopics.map((subtopic, index) => (
            <div key={index} className="subtopic-card">
              <div className="subtopic-number">{index + 1}</div>
              <div className="subtopic-content">
                <h3>{subtopic}</h3>
                <p>Recommended resources and exercises for this topic</p>
              </div>
            </div>
          ))}
        </div>

        <div className="actions">
          <button 
            onClick={() => navigate('/survey')}
            className="back-btn"
          >
            Back to Survey
          </button>
          <button 
            onClick={() => navigate('/')}
            className="new-survey-btn"
          >
            Start New Survey
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubtopicsPage;
