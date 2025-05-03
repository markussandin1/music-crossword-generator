// A very simple music-themed crossword with no conflicts
export const mockCrosswordData = {
  entries: [
    // Across entries
    {
      answer: 'JAZZ',
      clue: 'Musical genre known for improvisation',
      direction: 'across',
      number: 1,
      position: { row: 0, col: 0 }
    },
    {
      answer: 'ROCK',
      clue: 'Music popular for electric guitars',
      direction: 'across',
      number: 2,
      position: { row: 2, col: 0 }
    },
    {
      answer: 'BEAT',
      clue: 'Rhythmic pulse in music',
      direction: 'across',
      number: 3,
      position: { row: 4, col: 0 }
    },
    
    // Down entries
    {
      answer: 'JAM',
      clue: 'Musicians playing together informally',
      direction: 'down',
      number: 1,
      position: { row: 0, col: 0 }
    },
    {
      answer: 'BAND',
      clue: 'Group of musicians playing together',
      direction: 'down',
      number: 4,
      position: { row: 0, col: 3 }
    },
    {
      answer: 'KEYS',
      clue: 'Piano or other keyboard instruments',
      direction: 'down',
      number: 5,
      position: { row: 1, col: 1 }
    }
  ]
};

/**
 * Generate a formatted grid with the crossword entries
 * @returns {Object}
 */
export const getFormattedMockData = () => {
  // Create a 5x5 grid filled with dashes (empty cells)
  const gridSize = 5;
  const gridData = Array(gridSize).fill().map(() => Array(gridSize).fill('-'));
  
  // Set of positions that have been filled
  const filledPositions = new Set();
  
  // Place each entry in the grid
  mockCrosswordData.entries.forEach(entry => {
    const { position, direction, answer } = entry;
    const { row, col } = position;
    
    for (let i = 0; i < answer.length; i++) {
      const currentRow = direction === 'across' ? row : row + i;
      const currentCol = direction === 'across' ? col + i : col;
      const cellKey = `${currentRow},${currentCol}`;
      
      // Place the letter
      gridData[currentRow][currentCol] = answer[i];
      
      // Remember that we've filled this position
      filledPositions.add(cellKey);
    }
  });
  
  // Print grid to console for verification
  console.log("Generated crossword grid:");
  console.log(gridData.map(row => row.join(' ')).join('\\n'));
  
  // Now verify it manually
  let hasConflicts = false;
  mockCrosswordData.entries.forEach(entry => {
    const { position, direction, answer } = entry;
    const { row, col } = position;
    
    for (let i = 0; i < answer.length; i++) {
      const currentRow = direction === 'across' ? row : row + i;
      const currentCol = direction === 'across' ? col + i : col;
      
      if (gridData[currentRow][currentCol] !== answer[i]) {
        console.error(`❌ Conflict at [${currentRow},${currentCol}]: Expected '${answer[i]}' but found '${gridData[currentRow][currentCol]}'`);
        hasConflicts = true;
      }
    }
  });
  
  if (!hasConflicts) {
    console.log("✅ Crossword verification passed - no conflicts!");
  }
  
  // Return the crossword data
  return {
    grid: gridData,
    entries: mockCrosswordData.entries
  };
};