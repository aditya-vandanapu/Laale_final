
const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');


// Protected routes (require authentication)
router.post('/generate-questions', surveyController.generateQuestions);
router.post('/subtopics', surveyController.generateSubtopics);


module.exports = router;