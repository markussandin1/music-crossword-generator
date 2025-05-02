/**
 * Improved Crossword Service for generating crossword puzzles
 */

/**
 * Build a crossword grid from a set of questions and answers
 * @param {Array} questions - Array of question objects with answer property
 * @returns {Object} Crossword grid and entry data
 */
const buildCrossword = (questions) => {
  // Validate input
  if (!questions || !Array.isArray(questions) || questions.length < 3) {
    throw new Error('At least 3 questions are required to build a crossword');
  }

  // Extract answers from questions and ensure they are uppercase
  let words = questions.map(q => ({
    word: q.answer.toUpperCase().replace(/[^A-Z]/g, ''), // Remove non-letter characters
    question: q.question,
    originalAnswer: q.answer // Keep the original answer for reference
  }));

  console.log('Processing words:', words);

  // Filter out words that don't match our criteria
  words = words.filter(wordData => {
    // Ensure the word has only letters A-Z
    if (!/^[A-Z]+$/.test(wordData.word)) {
      console.warn(`Skipping word "${wordData.word}" because it contains non-letter characters`);
      return false;
    }
    
    // Ensure the word has at least 3 characters
    if (wordData.word.length < 3) {
      console.warn(`Skipping word "${wordData.word}" because it is too short`);
      return false;
    }
    
    return true;
  });

  // If we don't have enough valid words, throw an error
  if (words.length < 3) {
    throw new Error('Not enough valid words to build a crossword. Words must contain only letters and be at least 3 characters long.');
  }

  console.log(`Building crossword with ${words.length} valid words`);

  // Sort words by length (longest first) for better grid construction
  words.sort((a, b) => b.word.length - a.word.length);

  // Multiple attempts to create a better crossword
  const attempts = 3;
  let bestCrossword = null;
  let bestScore = -1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} to build crossword`);
      
      // Try with different arrangements of words
      const startingPositions = [
        { row: 10, col: 10 },  // Center
        { row: 5, col: 5 },    // Top-left
        { row: 5, col: 15 }    // Top-right
      ];
      
      const position = startingPositions[attempt % startingPositions.length];
      
      // Initialize grid with the first word
      const grid = initializeEmptyGrid(30, 30); // Larger grid to allow more words
      const entries = [];
      
      // Place first word horizontally
      const firstWordData = words[0];
      const firstEntry = {
        answer: firstWordData.word,
        clue: firstWordData.question,
        position: { row: position.row, col: position.col },
        direction: attempt % 2 === 0 ? 'across' : 'down',  // Alternate directions
        number: 1
      };
      
      placeWordInGrid(grid, firstWordData.word, {
        row: position.row,
        col: position.col,
        direction: firstEntry.direction
      });
      
      entries.push(firstEntry);
      
      // Track used words to avoid duplicates
      const usedWords = new Set([firstWordData.word]);
      
      // Try to place remaining words
      let entryNumber = 2;
      let placedWords = 1;
      
      // Shuffle remaining words slightly to get different arrangements
      const remainingWords = words.slice(1);
      if (attempt > 0) {
        // Simple Fisher-Yates shuffle
        for (let i = remainingWords.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remainingWords[i], remainingWords[j]] = [remainingWords[j], remainingWords[i]];
        }
      }
      
      // Try multiple times to place words
      for (let i = 0; i < remainingWords.length; i++) {
        const wordData = remainingWords[i];
        if (usedWords.has(wordData.word)) continue; // Skip duplicates
        
        const placement = findBestPlacement(grid, wordData.word);
        if (placement) {
          placeWordInGrid(grid, wordData.word, placement);
          entries.push({
            answer: wordData.word,
            clue: wordData.question,
            position: { row: placement.row, col: placement.col },
            direction: placement.direction,
            number: entryNumber++
          });
          usedWords.add(wordData.word);
          placedWords++;
          console.log(`Placed word: ${wordData.word} (${placedWords} of ${words.length})`);
        } else {
          console.log(`Could not place word: ${wordData.word}`);
        }
      }
      
      // Require at least 3 words to be placed for a valid crossword
      if (placedWords < 3) {
        console.log(`Only placed ${placedWords} words, need at least 3`);
        continue;
      }
      
      // Score this crossword
      const score = scoreGrid(grid, placedWords, words.length);
      console.log(`Attempt ${attempt + 1} score: ${score} (placed ${placedWords}/${words.length} words)`);
      
      if (score > bestScore) {
        console.log(`New best score: ${score}`);
        
        // Trim the grid to remove empty rows and columns
        const trimmedGrid = trimGrid(grid);
        
        // Adjust entry positions based on trimmed grid
        const trimmedEntries = adjustEntryPositions(entries, grid, trimmedGrid);
        
        // Number entries correctly
        numberEntries(trimmedEntries);
        
        bestCrossword = {
          grid: trimmedGrid,
          entries: trimmedEntries
        };
        bestScore = score;
      }
      
      // If we've placed all words, no need to try more iterations
      if (placedWords === words.length) {
        console.log('Placed all words, breaking early');
        break;
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
    }
  }

  if (bestCrossword && bestCrossword.entries.length >= 3) {
    console.log(`Successfully built crossword with ${bestCrossword.entries.length} entries`);
    return bestCrossword;
  }

  throw new Error('Failed to create a valid crossword with the provided words. Try different questions.');
};

/**
 * Score a grid based on various factors
 * @param {Array} grid - 2D grid array
 * @param {number} placedWords - Number of words placed in the grid
 * @param {number} totalWords - Total number of words attempted
 * @returns {number} Score
 */
const scoreGrid = (grid, placedWords, totalWords) => {
  // Basic score is the percentage of words placed
  const placementScore = (placedWords / totalWords) * 100;
  
  // Count filled cells and grid dimensions
  let filledCells = 0;
  let totalCells = 0;
  let minRow = grid.length;
  let maxRow = 0;
  let minCol = grid[0].length;
  let maxCol = 0;
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col] !== '') {
        filledCells++;
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
  }
  
  // Calculate used grid area
  const usedArea = (maxRow - minRow + 1) * (maxCol - minCol + 1);
  
  // Density score is the percentage of filled cells in the used area
  const densityScore = (filledCells / usedArea) * 20;  // Weight less than word placement
  
  // Shape score favors more square-like grids
  const aspectRatio = Math.max(
    (maxRow - minRow + 1) / (maxCol - minCol + 1),
    (maxCol - minCol + 1) / (maxRow - minRow + 1)
  );
  const shapeScore = (1 / aspectRatio) * 10;  // Better when closer to 1
  
  // Combine scores
  return placementScore + densityScore + shapeScore;
};

/**
 * Initialize an empty grid of specified dimensions
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {Array} 2D grid array
 */
const initializeEmptyGrid = (rows, cols) => {
  return Array(rows).fill().map(() => Array(cols).fill(''));
};

/**
 * Find the best placement for a word in the grid
 * @param {Array} grid - 2D grid array
 * @param {string} word - Word to place
 * @returns {Object|null} Placement information or null if no placement found
 */
const findBestPlacement = (grid, word) => {
  const rows = grid.length;
  const cols = grid[0].length;
  let bestScore = -1;
  let bestPlacement = null;
  
  // Check each cell in the grid
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Try placing horizontally
      const horizontalPlacement = canPlaceWordHorizontally(grid, word, row, col);
      if (horizontalPlacement.canPlace && horizontalPlacement.intersections > bestScore) {
        bestScore = horizontalPlacement.intersections;
        bestPlacement = { row, col, direction: 'across' };
      }
      
      // Try placing vertically
      const verticalPlacement = canPlaceWordVertically(grid, word, row, col);
      if (verticalPlacement.canPlace && verticalPlacement.intersections > bestScore) {
        bestScore = verticalPlacement.intersections;
        bestPlacement = { row, col, direction: 'down' };
      }
    }
  }
  
  return bestPlacement;
};

/**
 * Check if a word can be placed horizontally
 * @param {Array} grid - 2D grid array
 * @param {string} word - Word to place
 * @param {number} row - Starting row
 * @param {number} col - Starting column
 * @returns {Object} Object with canPlace and intersections properties
 */
const canPlaceWordHorizontally = (grid, word, row, col) => {
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Check if the word would go out of bounds
  if (col + word.length > cols) {
    return { canPlace: false, intersections: 0 };
  }
  
  // Check if the cell before the word is empty or out of bounds
  if (col > 0 && grid[row][col - 1] !== '') {
    return { canPlace: false, intersections: 0 };
  }
  
  // Check if the cell after the word is empty or out of bounds
  if (col + word.length < cols && grid[row][col + word.length] !== '') {
    return { canPlace: false, intersections: 0 };
  }
  
  let intersections = 0;
  let intersectionFound = false;
  
  // Check each letter of the word
  for (let i = 0; i < word.length; i++) {
    const currentCol = col + i;
    const currentCell = grid[row][currentCol];
    
    if (currentCell !== '' && currentCell !== word[i]) {
      // Cell is occupied by a different letter
      return { canPlace: false, intersections: 0 };
    }
    
    if (currentCell === word[i]) {
      // Intersection with existing letter
      intersections++;
      
      // Check if there's a vertical word at this intersection
      const hasVerticalWord = 
        (row > 0 && grid[row - 1][currentCol] !== '') || 
        (row < rows - 1 && grid[row + 1][currentCol] !== '');
      
      if (hasVerticalWord) {
        intersectionFound = true;
      }
    } else {
      // Check if there are adjacent letters above or below
      if (row > 0 && grid[row - 1][currentCol] !== '') {
        return { canPlace: false, intersections: 0 };
      }
      if (row < rows - 1 && grid[row + 1][currentCol] !== '') {
        return { canPlace: false, intersections: 0 };
      }
    }
  }
  
  // Valid placement if word has at least one intersection or it's the first word
  if (intersections > 0) {
    intersectionFound = true;
  }
  
  return { canPlace: intersectionFound, intersections };
};

/**
 * Check if a word can be placed vertically
 * @param {Array} grid - 2D grid array
 * @param {string} word - Word to place
 * @param {number} row - Starting row
 * @param {number} col - Starting column
 * @returns {Object} Object with canPlace and intersections properties
 */
const canPlaceWordVertically = (grid, word, row, col) => {
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Check if the word would go out of bounds
  if (row + word.length > rows) {
    return { canPlace: false, intersections: 0 };
  }
  
  // Check if the cell before the word is empty or out of bounds
  if (row > 0 && grid[row - 1][col] !== '') {
    return { canPlace: false, intersections: 0 };
  }
  
  // Check if the cell after the word is empty or out of bounds
  if (row + word.length < rows && grid[row + word.length][col] !== '') {
    return { canPlace: false, intersections: 0 };
  }
  
  let intersections = 0;
  let intersectionFound = false;
  
  // Check each letter of the word
  for (let i = 0; i < word.length; i++) {
    const currentRow = row + i;
    const currentCell = grid[currentRow][col];
    
    if (currentCell !== '' && currentCell !== word[i]) {
      // Cell is occupied by a different letter
      return { canPlace: false, intersections: 0 };
    }
    
    if (currentCell === word[i]) {
      // Intersection with existing letter
      intersections++;
      
      // Check if there's a horizontal word at this intersection
      const hasHorizontalWord = 
        (col > 0 && grid[currentRow][col - 1] !== '') || 
        (col < cols - 1 && grid[currentRow][col + 1] !== '');
      
      if (hasHorizontalWord) {
        intersectionFound = true;
      }
    } else {
      // Check if there are adjacent letters to the left or right
      if (col > 0 && grid[currentRow][col - 1] !== '') {
        return { canPlace: false, intersections: 0 };
      }
      if (col < cols - 1 && grid[currentRow][col + 1] !== '') {
        return { canPlace: false, intersections: 0 };
      }
    }
  }
  
  // Valid placement if word has at least one intersection or it's the first word
  if (intersections > 0) {
    intersectionFound = true;
  }
  
  return { canPlace: intersectionFound, intersections };
};

/**
 * Place a word in the grid
 * @param {Array} grid - 2D grid array
 * @param {string} word - Word to place
 * @param {Object} placement - Placement information
 */
const placeWordInGrid = (grid, word, placement) => {
  const { row, col, direction } = placement;
  
  if (direction === 'across') {
    for (let i = 0; i < word.length; i++) {
      grid[row][col + i] = word[i];
    }
  } else { // down
    for (let i = 0; i < word.length; i++) {
      grid[row + i][col] = word[i];
    }
  }
};

/**
 * Trim the grid to remove empty rows and columns
 * @param {Array} grid - 2D grid array
 * @returns {Object} Trimmed grid with bounds information
 */
const trimGrid = (grid) => {
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Find the bounds of the filled grid
  let minRow = rows;
  let maxRow = 0;
  let minCol = cols;
  let maxCol = 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] !== '') {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
  }
  
  // Add padding of 1 cell around the grid
  minRow = Math.max(0, minRow - 1);
  maxRow = Math.min(rows - 1, maxRow + 1);
  minCol = Math.max(0, minCol - 1);
  maxCol = Math.min(cols - 1, maxCol + 1);
  
  // Create the trimmed grid
  const trimmedRows = maxRow - minRow + 1;
  const trimmedCols = maxCol - minCol + 1;
  
  const trimmedGrid = Array(trimmedRows).fill().map(() => Array(trimmedCols).fill(''));
  
  // Fill the trimmed grid
  for (let row = 0; row < trimmedRows; row++) {
    for (let col = 0; col < trimmedCols; col++) {
      trimmedGrid[row][col] = grid[minRow + row][minCol + col];
    }
  }
  
  return {
    grid: trimmedGrid,
    bounds: { minRow, minCol, maxRow, maxCol }
  };
};

/**
 * Adjust entry positions based on trimmed grid
 * @param {Array} entries - Array of entry objects
 * @param {Array} originalGrid - Original grid
 * @param {Object} trimmedGrid - Trimmed grid with bounds
 * @returns {Array} Adjusted entries
 */
const adjustEntryPositions = (entries, originalGrid, trimmedGridData) => {
  const { bounds } = trimmedGridData;
  
  return entries.map(entry => {
    const newPosition = {
      row: entry.position.row - bounds.minRow,
      col: entry.position.col - bounds.minCol
    };
    
    return {
      ...entry,
      position: newPosition
    };
  });
};

/**
 * Number entries correctly in crossword order
 * @param {Array} entries - Array of entry objects
 */
const numberEntries = (entries) => {
  // Sort entries by position (top to bottom, left to right)
  entries.sort((a, b) => {
    if (a.position.row !== b.position.row) {
      return a.position.row - b.position.row;
    }
    return a.position.col - b.position.col;
  });
  
  // Keep track of positions that already have a number
  const numberedPositions = new Map();
  let nextNumber = 1;
  
  // Assign numbers
  entries.forEach(entry => {
    const posKey = `${entry.position.row},${entry.position.col}`;
    
    if (numberedPositions.has(posKey)) {
      // Position already has a number
      entry.number = numberedPositions.get(posKey);
    } else {
      // Assign a new number
      entry.number = nextNumber++;
      numberedPositions.set(posKey, entry.number);
    }
  });
};

module.exports = {
  buildCrossword
};