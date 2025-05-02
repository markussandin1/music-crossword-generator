const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

/**
 * Generate music-related questions for crossword puzzle
 * @param {Array} trackData - Array of track objects from Spotify
 * @param {Object} options - Generation options
 * @returns {Promise<Array>} - Array of generated questions
 */
const generateQuestions = async (trackData, options = {}) => {
  try {
    const { maxQuestions = 15, minAnswerLength = 3, maxAnswerLength = 12 } = options;
    
    // Prepare track data for the prompt
    const tracksForPrompt = trackData.map(track => ({
      title: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      year: track.album.releaseDate?.split('-')[0] || 'Unknown'
    }));

    console.log('Track data for prompt:', JSON.stringify(tracksForPrompt));

    // System prompt for the OpenAI API
    const systemPrompt = `You are an AI assistant specialized in creating music-themed crossword puzzles. Generate ${maxQuestions} unique questions based on the provided songs. 
    
Follow these rules:
1. Each answer must be a SINGLE WORD between ${minAnswerLength} and ${maxAnswerLength} characters
2. Answers should be nouns, music terms, or artist names (no articles, pronouns)
3. Don't only focus on general knowledge about these songs, artists, genres, or music terminology. It should also be questions about things in the song, stuff related to the artist, i dont mind if it's a bit far fetched question. 
4. Create questions of varying difficulty levels
6. Each answer should be unique and not repeated
8. Ensure answers can be clearly inferred from the clues
9. Answers must contain only letters A-Z (no numbers, spaces, or special characters)
10. Make all answers UPPERCASE

Your response should be in JSON format with an array of objects, where each object contains "question" and "answer" fields, like this:
[
  {
    "question": "Beatles drummer who narrated Thomas the Tank Engine",
    "answer": "STARR"
  },
  {
    "question": "Musical term for very loud",
    "answer": "FORTISSIMO"
  }
]`;

    console.log('Sending request to OpenAI...');
    
    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'o4-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate crossword questions based on these tracks: ${JSON.stringify(tracksForPrompt)}` }
      ],
      temperature: 1
    });

    console.log('Received response from OpenAI');
    
    // Get the response content
    const content = response.choices[0].message.content;
    console.log('Raw response:', content);
    
    // Try to parse the JSON
    try {
      // First try to parse the whole content as JSON
      const parsedContent = JSON.parse(content);
      
      // Check if the result is an array
      if (Array.isArray(parsedContent)) {
        console.log(`Successfully parsed ${parsedContent.length} questions`);
        return parsedContent;
      } 
      // If it's an object with a questions property
      else if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
        console.log(`Successfully parsed ${parsedContent.questions.length} questions from object`);
        return parsedContent.questions;
      }
      else {
        console.error('Parsed content is not an array or doesn\'t have questions property');
        // Try to find and extract a JSON array in the content
        const jsonArrayMatch = content.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonArrayMatch) {
          const extractedJson = jsonArrayMatch[0];
          const extractedQuestions = JSON.parse(extractedJson);
          console.log(`Extracted ${extractedQuestions.length} questions from content`);
          return extractedQuestions;
        }
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      
      // Attempt to extract a JSON array from the content
      const jsonArrayMatch = content.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonArrayMatch) {
        try {
          const extractedJson = jsonArrayMatch[0];
          const extractedQuestions = JSON.parse(extractedJson);
          console.log(`Extracted ${extractedQuestions.length} questions from content`);
          return extractedQuestions;
        } catch (extractError) {
          console.error('Error extracting JSON array:', extractError);
        }
      }
    }
    
    // If we reach here, we couldn't extract questions
    console.error('Could not extract questions from OpenAI response');
    throw new Error('Invalid response format from OpenAI');
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

module.exports = {
  generateQuestions
};