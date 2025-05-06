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
    
    // Prepare track data for the prompt, including track IDs
    const tracksForPrompt = trackData.map(track => ({
      id: track.id, // Include the track ID
      title: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      year: track.album.releaseDate?.split('-')[0] || 'Unknown'
    }));

    console.log('Track data for prompt:', JSON.stringify(tracksForPrompt));

    // Modified system prompt with strong emphasis on trackId requirement
    const systemPrompt = `You are an AI assistant specialized in creating music-themed crossword puzzles. Generate ${maxQuestions} unique questions based on the provided songs. 
    
Follow these rules:
1. Each answer must be a SINGLE WORD between ${minAnswerLength} and ${maxAnswerLength} characters
2. Answers should be nouns, music terms, or artist names (no articles, pronouns)
3. Don't only focus on general knowledge about these songs, artists, genres, or music terminology. It should also be questions about things in the song, stuff related to the artist, i dont mind if it's a bit far fetched question. 
4. Create questions of varying difficulty levels
5. Each answer should be unique and not repeated
6. Ensure answers can be clearly inferred from the clues
7. Answers must contain only letters A-Z (no numbers, spaces, or special characters)
8. Make all answers UPPERCASE
9. CRITICAL: Every question MUST include the exact trackId field from the provided song data

Your response should be in JSON format with an array of objects, where each object contains "question", "answer", and "trackId" fields, like this:
[
  {
    "question": "Beatles drummer who narrated Thomas the Tank Engine",
    "answer": "STARR",
    "trackId": "track-123"
  },
  {
    "question": "Musical term for very loud",
    "answer": "FORTISSIMO",
    "trackId": "track-456"
  }
]`;

    console.log('Sending request to OpenAI...');
    
    // Modified API call to strongly emphasize track ID inclusion
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'o4-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Generate crossword questions based on these tracks, making sure to include the EXACT trackId for each question. Every question MUST have the correct trackId from this data: ${JSON.stringify(tracksForPrompt)}` 
        }
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
        
        // Validate each question has a valid trackId
        const validQuestions = parsedContent.filter(question => {
          if (!question.trackId) {
            console.error(`Rejecting question missing trackId: ${question.question}`);
            return false;
          }
          
          // Verify the trackId exists in our original track data
          const validTrackId = trackData.some(track => track.id === question.trackId);
          if (!validTrackId) {
            console.error(`Rejecting question with invalid trackId ${question.trackId}: ${question.question}`);
            return false;
          }
          
          return true;
        });
        
        console.log(`${validQuestions.length} of ${parsedContent.length} questions have valid track IDs`);
        
        if (validQuestions.length < 3) {
          throw new Error('Not enough questions with valid track IDs generated. Need at least 3.');
        }
        
        return validQuestions;
      } 
      // If it's an object with a questions property
      else if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
        console.log(`Successfully parsed ${parsedContent.questions.length} questions from object`);
        
        // Validate each question has a valid trackId
        const validQuestions = parsedContent.questions.filter(question => {
          if (!question.trackId) {
            console.error(`Rejecting question missing trackId: ${question.question}`);
            return false;
          }
          
          // Verify the trackId exists in our original track data
          const validTrackId = trackData.some(track => track.id === question.trackId);
          if (!validTrackId) {
            console.error(`Rejecting question with invalid trackId ${question.trackId}: ${question.question}`);
            return false;
          }
          
          return true;
        });
        
        console.log(`${validQuestions.length} of ${parsedContent.questions.length} questions have valid track IDs`);
        
        if (validQuestions.length < 3) {
          throw new Error('Not enough questions with valid track IDs generated. Need at least 3.');
        }
        
        return validQuestions;
      }
      else {
        console.error('Parsed content is not an array or doesn\'t have questions property');
        // Try to find and extract a JSON array in the content
        const jsonArrayMatch = content.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonArrayMatch) {
          const extractedJson = jsonArrayMatch[0];
          const extractedQuestions = JSON.parse(extractedJson);
          console.log(`Extracted ${extractedQuestions.length} questions from content`);
          
          // Validate each question has a valid trackId
          const validQuestions = extractedQuestions.filter(question => {
            if (!question.trackId) {
              console.error(`Rejecting question missing trackId: ${question.question}`);
              return false;
            }
            
            // Verify the trackId exists in our original track data
            const validTrackId = trackData.some(track => track.id === question.trackId);
            if (!validTrackId) {
              console.error(`Rejecting question with invalid trackId ${question.trackId}: ${question.question}`);
              return false;
            }
            
            return true;
          });
          
          console.log(`${validQuestions.length} of ${extractedQuestions.length} questions have valid track IDs`);
          
          if (validQuestions.length < 3) {
            throw new Error('Not enough questions with valid track IDs generated. Need at least 3.');
          }
          
          return validQuestions;
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
          
          // Validate each question has a valid trackId
          const validQuestions = extractedQuestions.filter(question => {
            if (!question.trackId) {
              console.error(`Rejecting question missing trackId: ${question.question}`);
              return false;
            }
            
            // Verify the trackId exists in our original track data
            const validTrackId = trackData.some(track => track.id === question.trackId);
            if (!validTrackId) {
              console.error(`Rejecting question with invalid trackId ${question.trackId}: ${question.question}`);
              return false;
            }
            
            return true;
          });
          
          console.log(`${validQuestions.length} of ${extractedQuestions.length} questions have valid track IDs`);
          
          if (validQuestions.length < 3) {
            throw new Error('Not enough questions with valid track IDs generated. Need at least 3.');
          }
          
          return validQuestions;
        } catch (extractError) {
          console.error('Error extracting JSON array:', extractError);
        }
      }
    }
    
    // If we reach here, we couldn't extract valid questions
    console.error('Could not extract questions with valid track IDs from OpenAI response');
    throw new Error('Failed to generate questions with valid track IDs');
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

module.exports = {
  generateQuestions
};