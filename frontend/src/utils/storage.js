/**
 * Utilities for saving and loading crossword progress
 * and generating shareable links
 */

const STORAGE_PREFIX = 'music-crossword-';

/**
 * Save data to localStorage with the given key
 * 
 * @param {string} key - Storage key
 * @param {Object} data - Data to save
 */
export const saveToLocalStorage = (key, data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedData);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * Get data from localStorage by key
 * 
 * @param {string} key - Storage key
 * @returns {Object|null} Retrieved data or null if not found
 */
export const getFromLocalStorage = (key) => {
  try {
    const serializedData = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (serializedData === null) {
      return null;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('Error retrieving from localStorage:', error);
    return null;
  }
};

/**
 * Remove data from localStorage by key
 * 
 * @param {string} key - Storage key
 */
export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

/**
 * Get all saved crosswords from localStorage
 * 
 * @returns {Array} Array of saved crossword keys
 */
export const getAllSavedCrosswords = () => {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key.replace(STORAGE_PREFIX, ''));
      }
    }
    return keys;
  } catch (error) {
    console.error('Error listing saved crosswords:', error);
    return [];
  }
};

/**
 * Generate a shareable link for a crossword
 * 
 * @param {string} playlistId - Spotify playlist ID
 * @param {Object} options - Additional options
 * @returns {string} Shareable link
 */
export const generateShareableLink = (playlistId, options = {}) => {
  const baseUrl = window.location.origin;
  let url = `${baseUrl}/crossword/${playlistId}`;
  
  // Add any additional parameters
  if (Object.keys(options).length > 0) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      params.append(key, value);
    });
    url += `?${params.toString()}`;
  }
  
  return url;
};
/**
 * Save a crossword's state for sharing
 * 
 * @param {string} playlistId - Spotify playlist ID
 * @param {Object} crosswordData - Crossword grid and clues
 * @param {Object} answers - User's current answers
 * @returns {string} Unique share ID
 */
export const saveSharedCrossword = (playlistId, crosswordData, answers) => {
    // Create a unique ID for sharing
    const shareId = `share-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    // Save the shared crossword data
    saveToLocalStorage(shareId, {
      playlistId,
      crosswordData,
      answers,
      createdAt: new Date().toISOString()
    });
    
    return shareId;
  };
  
  /**
   * Load a shared crossword
   * 
   * @param {string} shareId - Share ID
   * @returns {Object|null} Shared crossword data
   */
  export const loadSharedCrossword = (shareId) => {
    return getFromLocalStorage(shareId);
  };
  
  /**
   * Format percentage of completion
   * 
   * @param {Object} answers - User's answers
   * @param {number} totalCells - Total number of cells in crossword
   * @returns {string} Formatted percentage
   */
  export const getCompletionPercentage = (answers, totalCells) => {
    if (!answers || !totalCells) return '0%';
    
    const filledCells = Object.values(answers).filter(val => val !== '').length;
    const percentage = Math.round((filledCells / totalCells) * 100);
    
    return `${percentage}%`;
  };