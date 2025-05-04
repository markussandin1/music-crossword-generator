// backend/src/controllers/ttsController.js

const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

/**
 * Convert text to speech using OpenAI's TTS API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateSpeech = async (req, res) => {
  try {
    const { 
      text, 
      voice = 'coral', 
      model = 'gpt-4o-mini-tts',
      responseFormat = 'mp3',
      instructions = ''
    } = req.body;
    
    console.log(`Generating speech for text: "${text.substring(0, 50)}..."${text.length > 50 ? '...' : ''}`);
    
    if (!text) {
      return res.status(400).json({ 
        error: 'Missing required parameter: text' 
      });
    }
    
    // Available voices
    const validVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'];
    if (!validVoices.includes(voice)) {
      return res.status(400).json({
        error: `Invalid voice. Must be one of: ${validVoices.join(', ')}`
      });
    }
    
    // Valid response formats
    const validFormats = ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'];
    if (!validFormats.includes(responseFormat)) {
      return res.status(400).json({
        error: `Invalid response format. Must be one of: ${validFormats.join(', ')}`
      });
    }
    
    // Generate speech using OpenAI API
    const mp3 = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      response_format: responseFormat,
      instructions: instructions
    });
    
    // Convert to Buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Set content type based on format
    const contentTypes = {
      mp3: 'audio/mpeg',
      opus: 'audio/opus',
      aac: 'audio/aac',
      flac: 'audio/flac',
      wav: 'audio/wav',
      pcm: 'audio/pcm'
    };
    
    // Send audio as response
    res.set('Content-Type', contentTypes[responseFormat] || 'audio/mpeg');
    res.set('Content-Length', buffer.length);
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating speech:', error);
    
    // Handle specific OpenAI errors
    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: 'OpenAI API error',
        message: error.response.data?.error?.message || error.message,
        code: error.response.data?.error?.code
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to generate speech',
      message: error.message 
    });
  }
};

/**
 * Get available TTS voices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getVoices = async (req, res) => {
  try {
    // Return the list of available voices with descriptions
    const voices = [
      { id: 'alloy', name: 'Alloy', description: 'Neutral voice with a balanced tone' },
      { id: 'ash', name: 'Ash', description: 'Clear voice with a direct delivery' },
      { id: 'ballad', name: 'Ballad', description: 'Calm voice with a melodic quality' },
      { id: 'coral', name: 'Coral', description: 'Warm voice with an inviting tone' },
      { id: 'echo', name: 'Echo', description: 'Deep voice with resonance and authority' },
      { id: 'fable', name: 'Fable', description: 'Storytelling voice with expressive range' },
      { id: 'nova', name: 'Nova', description: 'Female voice with a clear, precise delivery' },
      { id: 'onyx', name: 'Onyx', description: 'Authoritative voice with a commanding presence' },
      { id: 'sage', name: 'Sage', description: 'Gentle voice with a thoughtful quality' },
      { id: 'shimmer', name: 'Shimmer', description: 'Cheerful voice with a bright, uplifting tone' }
    ];
    
    return res.status(200).json({
      success: true,
      data: {
        voices,
        recommendedForQuiz: ['coral', 'echo', 'nova', 'shimmer']
      }
    });
  } catch (error) {
    console.error('Error getting voices:', error);
    return res.status(500).json({ 
      error: 'Failed to get voices',
      message: error.message 
    });
  }
};

/**
 * Check TTS service status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkStatus = async (req, res) => {
  try {
    // Attempt to create a minimal speech snippet to verify the service is working
    const testText = "Testing text-to-speech functionality.";
    
    try {
      await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: testText,
      });
      
      // If no error was thrown, the service is available
      return res.status(200).json({
        success: true,
        status: 'available',
        message: 'TTS service is working correctly'
      });
    } catch (apiError) {
      // If there was an API error, the service is not available
      return res.status(200).json({
        success: false,
        status: 'unavailable',
        message: 'TTS service is currently unavailable',
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('Error checking TTS status:', error);
    return res.status(500).json({ 
      error: 'Failed to check TTS status',
      message: error.message 
    });
  }
};

module.exports = {
  generateSpeech,
  getVoices,
  checkStatus
};