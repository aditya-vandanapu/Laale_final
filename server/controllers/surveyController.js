const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const surveyController = {
  generateQuestions: async (req, res) => {
    try {
      const { topic } = req.body;
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Generate a learning assessment survey with 5 multiple choice questions about the given topic. Return JSON format with questions and options."
          },
          { 
            role: "user", 
            content: `Create a 5-question survey about ${topic} to assess a learner's background and preferences. Include questions about:
            - Prior knowledge/experience level
            - Learning goals
            - Preferred learning methods
            - Time availability
            - Specific interests within the topic
            
            Return in this format:
            {
              "questions": [
                {
                  "question": "Question text",
                  "options": ["Option 1", "Option 2", "Option 3"]
                }
              ]
            }`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(response.choices[0].message.content);
      return res.json({ success: true, questions: content.questions });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  generateSubtopics: async (req, res) => {
    try {
      const { topic, answers, questions } = req.body;
      
      const prompt = `Based on these survey responses about learning ${topic}:
      
      ${questions.map((q, i) => `Q: ${q.question}\nA: ${answers[i]}`).join('\n\n')}
      
      Analyze the learner's responses and generate 5 personalized subtopics they should focus on, ordered by priority. Return as a JSON array:
      
      ["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4", "Subtopic 5"]`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a learning advisor. Analyze survey responses and recommend personalized subtopics."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(response.choices[0].message.content);
      const subtopics = content.subtopics || content;

      return res.json({ success: true, subtopics: ["Subtopic 1", "Subtopic 2"] });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = surveyController;