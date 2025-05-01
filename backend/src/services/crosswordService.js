/**
 * Crossword Service for generating crossword puzzles
 */

/**
 * Build a crossword grid from a set of questions and answers
 * @param {Array} questions - Array of question objects with answer property
 * @returns {Object} Crossword grid and entry data
 */
const buildCrossword = (questions) => {
  // Validate input
  if (!questions || !Array.isArray(questions) || questions.length < 5) {
    throw new Error('At least 5 questions are required to build a crossword');
  }

  // Extract answers from questions and ensure they are uppercase
  const words = questions.map(q => ({
    word: q.answer.toUpperCase(),
    question: q.question
  }));

  console.log(`Building crossword with ${words.length} words`);

  // Sort words by length (longest first) for better grid construction
  words.sort((a, b) => b.word.length - a.word.length);

  // Initialize grid with the first (longest) word horizontally
  const grid = initializeGrid(words[0]);
  
  // Place remaining words
  const entries = [];
  const firstEntry = {
    answer: words[0].word,
    clue: words[0].question,
    position: { row: 0, col: 0 },
    direction: 'across',
    number: 1
  };
  
  entries.push(firstEntry);
  
  // Track used words to avoid duplicates
  const usedWords = new Set([words[0].word]);
  
  // Try to place remaining words
  let entryNumber = 2;
  for (let i = 1; i < words.length; i++) {
    const wordData = words[i];
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
    }
  }
  
  // Trim the grid to remove empty rows and columns
  const trimmedGrid = trimGrid(grid);
  
  // Adjust entry positions based on trimmed grid
  const trimmedEntries = adjustEntryPositions(entries, grid, trimmedGrid);
  
  // Number entries correctly
  numberEntries(trimmedEntries);
  
  return {
    grid: trimmedGrid,
    entries: trimmedEntries
  };
};

/**
 * Initialize a grid with the first word placed horizontally
 * @param {Object} wordData - Word data object with word and question
 * @returns {Array} 2D grid with the word placed
 */
const initializeGrid = (wordData) => {
  const word = wordData.word;
  // Create a grid with some padding around the word
  const rows = 50;
  const cols = 50;
  const grid = Array(rows).fill().map(() => Array(cols).fill(''));
  
  // Place the first word horizontally in the middle of the grid
  const middleRow = Math.floor(rows / 2);
  const startCol = Math.floor((cols - word.length) / 2);
  
  for (let i = 0; i < word.length; i++) {
    grid[middleRow][startCol + i] = word[i];
  }
  
  return grid;
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
  let validPlacement = false;
  
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
        validPlacement = true;
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
    validPlacement = true;
  }
  
  return { canPlace: validPlacement, intersections };
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
  let validPlacement = false;
  
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
        validPlacement = true;
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
    validPlacement = true;
  }
  
  return { canPlace: validPlacement, intersections };
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
 * @returns {Array} Trimmed grid
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