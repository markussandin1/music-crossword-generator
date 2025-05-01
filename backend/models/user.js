const { db } = require('../db');

class User {
  static tableName = 'users';
  
  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object>} - User object
   */
  static async findById(id) {
    return db(this.tableName)
      .where({ id })
      .first();
  }
  
  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} - User object
   */
  static async findByEmail(email) {
    return db(this.tableName)
      .where({ email })
      .first();
  }
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user object with ID
   */
  static async create(userData) {
    const [id] = await db(this.tableName)
      .insert(userData)
      .returning('id');
      
    return this.findById(id);
  }
  
  /**
   * Update a user
   * @param {number} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} - Updated user object
   */
  static async update(id, userData) {
    await db(this.tableName)
      .where({ id })
      .update(userData);
      
    return this.findById(id);
  }
  
  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} - Success indicator
   */
  static async delete(id) {
    const result = await db(this.tableName)
      .where({ id })
      .delete();
      
    return result > 0;
  }
  
  /**
   * Get user's quizzes
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of quiz objects
   */
  static async getQuizzes(userId) {
    return db('quizzes')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
  }
}

module.exports = User;