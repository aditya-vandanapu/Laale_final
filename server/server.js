// server.js - Improved version
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const surveyController = require('./controllers/surveyController');
const app = express();
const bcrypt = require('bcryptjs');
const { usersContainer } = require('./cosmosdb');
const { v4: uuidv4 } = require('uuid');
const { questionsContainer } = require('./cosmosdb'); // NEW LINE

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Enhanced session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev-only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  }
}));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  next();
};
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    session: !!req.session.user,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }

  try {
    // Query Cosmos DB for user
    const { resources: users } = await usersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }]
      })
      .fetchAll();

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = users[0];
    
    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Create session
    req.session.user = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// Enhanced signup endpoint
app.post('/api/signup', async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "All fields are required" 
    });
  }

  try {
    // Check if user already exists
    const { resources: existingUsers } = await usersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email OR c.username = @username",
        parameters: [
          { name: "@email", value: email },
          { name: "@username", value: username }
        ]
      })
      .fetchAll();

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Email or username already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user document
    const newUser = {
      id: uuidv4(),
      email,
      username,
      passwordHash: hashedPassword,
      profile: {
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        createdAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Cosmos DB
    const { resource: createdUser } = await usersContainer.items.create(newUser);

    res.status(201).json({ 
      success: true,
      message: 'Account created successfully',
      user: {
        id: createdUser.id,
        email: createdUser.email,
        username: createdUser.username
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Account creation failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});
// Protected endpoint example
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ 
    success: true,
    message: 'Protected data',
    user: req.session.user 
  });
});
// Fetch personality questions
// Replace the existing /api/personality-questions endpoint with this improved version
/*app.get('/api/personality-questions', requireAuth, async (req, res) => {
  try {
    // Check if questionsContainer is properly initialized
    if (!questionsContainer) {
      throw new Error('Questions container not initialized');
    }

    // Query only active questions with proper error handling
    const { resources: questions, requestCharge } = await questionsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.isActive = true ORDER BY c.order ASC",
      })
      .fetchAll();

    // Log some debug information
    console.log(`Fetched ${questions.length} questions (${requestCharge} RUs)`);

    if (questions.length === 0) {
      console.warn('No active questions found in database');
      return res.status(404).json({ 
        success: false, 
        message: 'No survey questions available' 
      });
    }

    // Transform questions for the frontend if needed
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.questionText,
      type: q.questionType,
      options: q.options || [],
      category: q.category,
      required: q.required !== false // default to true if not specified
    }));

    res.json({
      success: true,
      questions: formattedQuestions,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to fetch questions:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load questions',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
*/
app.get('/api/questions', async (req, res) => {
  try {
    const { resources: questions } = await questionsContainer.items
      .query('SELECT * FROM c')
      .fetchAll();

    res.json(questions); // ✅ Respond with questions
  } catch (error) {
    console.error('Error fetching questions:', error.message);
    res.status(500).json({ message: 'Failed to load questions' });
  }
});

app.post('/api/save-personality', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const {responses} = req.body;

  try {
    const { resource: user } = await usersContainer.item(userId, userId).read();
 
    if (!user.learningPreferences) {
      user.learningPreferences = {};
    }
    for (const [key, value] of Object.entries(responses)) {
      switch (key) {
        case 'style':
        case 'language':
        case 'difficulty':
        case 'sessionDurationMin':
        case 'notifications':
        case 'theme':
        case 'timeOfDay': 
          user.learningPreferences = {
            ...user.learningPreferences,
            [key]: value
          };
          break;
        default:
          console.warn(`Unknown personality key: ${key}`);
      }
    }

    user.updatedAt = new Date().toISOString();

   const { resource: updatedUser } = await usersContainer.item(userId, userId).replace(user);
    console.log('User updated:', updatedUser);

    res.json({ success: true, message: 'Responses saved' });
  } catch (err) {
    console.error('Failed to save personality answers:', err);
    res.status(500).json({ success: false, message: 'Failed to save answers' });
  }
});
// Add this after your existing routes but before the error handling middleware

// Check if user has completed survey
app.get('/api/check-survey-status', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { resource: user } = await usersContainer.item(userId, userId).read();
    
    res.json({
      success: true,
      completed: !!user.surveyCompleted,
      redirectTo: user.surveyCompleted ? '/home' : '/survey'
    });
  } catch (err) {
    console.error('Survey status check error:', err);
    res.status(500).json({ success: false, message: 'Failed to check survey status' });
  }
});

// Mark survey as completed
app.post('/api/complete-survey', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { resource: user } = await usersContainer.item(userId, userId).read();
    
    user.surveyCompleted = true;
    user.surveyCompletedAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    
    await usersContainer.item(userId, userId).replace(user);
    
    res.json({ 
      success: true,
      redirectTo: '/home'
    });
  } catch (err) {
    console.error('Survey completion error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark survey as complete' });
  }
});

// Get user's learning preferences (for homepage)
app.get('/api/user-preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { resource: user } = await usersContainer.item(userId, userId).read();
    
    res.json({
      success: true,
      preferences: user.learningPreferences || {}
    });
  } catch (err) {
    console.error('Preferences fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
  }
});
// Survey endpoints
app.post('/api/generate-questions', requireAuth, surveyController.generateQuestions);
app.post('/api/submit-survey', requireAuth, surveyController.generateSubtopics);



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Login: POST http://localhost:${PORT}/api/login`);
  console.log(`🔗 Generate questions: POST http://localhost:${PORT}/api/generate-questions`);
});