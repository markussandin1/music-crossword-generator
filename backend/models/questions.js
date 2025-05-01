const { db } = require('../db');

class Question {
  static tableName = 'questions';
  
  /**
   * Find a question by ID
   * @param {number} id - Question ID
   * @returns {Promise<Object>} - Question object
   */
  static async findById(id) {
    return db(this.tableName)
      .where({ id })
      .first();
  }
  
  /**
   * Get questions for a quiz
   * @param {number} quizId - Quiz ID
   * @returns {Promise<Array>} - Array of question objects
   */
  static async getByQuizId(quizId) {
    return db(this.tableName)
      .where({ quiz_id: quizId })
      .orderBy('number', 'asc');
  }
  
  /**
   * Create a new question
   * @param {Object} questionData - Question data
   * @returns {Promise<Object>} - Created question object with ID
   */
  static async create(questionData) {
    const [id] = await db(this.tableName)
      .insert(questionData)
      .returning('id');
      
    return this.findById(id);
  }
  
  /**
   * Create multiple questions
   * @param {Array} questionsData - Array of question data objects
   * @returns {Promise<Array>} - Array of created question IDs
   */
  static async createBulk(questionsData) {
    return db(this.tableName)
      .insert(questionsData)
      .returning('id');
  }
  
  /**
   * Update a question
   * @param {number} id - Question ID
   * @param {Object} questionData - Question data to update
   * @returns {Promise<Object>} - Updated question object
   */
  static async update(id, questionData) {
    await db(this.tableName)
      .where({ id })
      .update(questionData);
      
    return this.findById(id);
  }
  
  /**
   * Delete a question
   * @param {number} id - Question ID
   * @returns {Promise<boolean>} - Success indicator
   */
  static async delete(id) {
    const result = await db(this.tableName)
      .where({ id })
      .delete();
      
    return result > 0;
  }
}

module.exports = Question;