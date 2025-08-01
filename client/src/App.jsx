import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import SurveyPage from './pages/SurveyPage';
import SubtopicsPage from './pages/SubtopicsPage';
import axios from 'axios';
import PersonalityQuestions from './pages/personalityquestions';

const ProtectedRoute = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/protected', { withCredentials: true });
        if (response.data.success) {
          setIsAuthenticated(true);
        } else {
          throw new Error('Not authenticated');
        }
      } catch (err) {
        setIsAuthenticated(false);
        navigate('/login');
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, [navigate]);

  if (!authChecked) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Verifying session...</p>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/personality" element={<PersonalityQuestions onComplete={() => navigate('/home')} />} />

        {/* ✅ Added Personality Questions Route */}
        <Route path="/personalityquestions" element={
          <ProtectedRoute>
            <PersonalityQuestions />
          </ProtectedRoute>
        } />

        {/* Default route: redirect to survey if authenticated */}
        <Route path="/" element={<Navigate to="/survey" replace />} />

        {/* Protected pages */}
        <Route path="/survey" element={
          <ProtectedRoute>
            <SurveyPage />
          </ProtectedRoute>
        } />

        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />

        <Route path="/subtopics" element={
          <ProtectedRoute>
            <SubtopicsPage />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
