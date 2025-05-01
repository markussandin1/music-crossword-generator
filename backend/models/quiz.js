const { db } = require('../db');

class Quiz {
  static tableName = 'quizzes';
  
  /**
   * Find a quiz by ID
   * @param {number} id - Quiz ID
   * @returns {Promise<Object>} - Quiz object
   */
  static async findById(id) {
    return db(this.tableName)
      .where({ id })
      .first();
  }
  
  /**
   * Get a complete quiz with questions
   * @param {number} id - Quiz ID
   * @returns {Promise<Object>} - Quiz object with questions
   */
  static async getComplete(id) {
    // Get the quiz
    const quiz = await this.findById(id);
    if (!quiz) return null;
    
    // Get the questions
    const questions = await db('questions')
      .where({ quiz_id: id })
      .orderBy('number', 'asc');
    
    return {
      ...quiz,
      questions
    };
  }
  
  /**
   * Get public quizzes
   * @param {Object} options - Query options (limit, offset)
   * @returns {Promise<Array>} - Array of quiz objects
   */
  static async getPublic(options = {}) {
    const { limit = 10, offset = 0 } = options;
    
    return db(this.tableName)
      .where({ is_public: true })
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc');
  }
  
  /**
   * Create a new quiz with questions
   * @param {Object} quizData - Quiz data
   * @param {Array} questions - Array of question objects
   * @returns {Promise<Object>} - Created quiz object with ID
   */
  static async create(quizData, questions = []) {
    // Begin transaction
    return db.transaction(async (trx) => {
      // Insert quiz
      const [quizId] = await trx(this.tableName)
        .insert(quizData)
        .returning('id');
      
      // Insert questions if provided
      if (questions.length > 0) {
        const questionsWithQuizId = questions.map(q => ({
          ...q,
          quiz_id: quizId
        }));
        
        await trx('questions').insert(questionsWithQuizId);
      }
      
      // Return complete quiz
      return this.getComplete(quizId);
    });
  }
  
  /**
   * Update a quiz
   * @param {number} id - Quiz ID
   * @param {Object} quizData - Quiz data to update
   * @returns {Promise<Object>} - Updated quiz object
   */
  static async update(id, quizData) {
    await db(this.tableName)
      .where({ id })
      .update(quizData);
      
    return this.findById(id);
  }
  
  /**
   * Delete a quiz
   * @param {number} id - Quiz ID
   * @returns {Promise<boolean>} - Success indicator
   */
  static async delete(id) {
    const result = await db(this.tableName)
      .where({ id })
      .delete();
      
    return result > 0;
  }
  
  /**
   * Record a quiz attempt
   * @param {Object} attemptData - Attempt data
   * @returns {Promise<Object>} - Created attempt object with ID
   */
  static async recordAttempt(attemptData) {
    const [id] = await db('attempts')
      .insert(attemptData)
      .returning('id');
      
    return db('attempts')
      .where({ id })
      .first();
  }
}

module.exports = Quiz;