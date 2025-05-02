import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing crossword puzzle state
 * @param {Object} initialCrossword - Initial crossword data
 * @returns {Object} - Crossword state and helper functions
 */
const useCrossword = (initialCrossword = null) => {
  // State for crossword data
  const [crossword, setCrossword] = useState(initialCrossword);
  
  // State for user's current answers
  const [userAnswers, setUserAnswers] = useState({});
  
  // State for the currently selected cell and entry
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  // State for whether the puzzle is complete
  const [isComplete, setIsComplete] = useState(false);
  
  // Initialize the crossword
  useEffect(() => {
    if (initialCrossword) {
      setCrossword(initialCrossword);
      
      // Initialize empty user answers
      const initialAnswers = {};
      initialCrossword.entries.forEach(entry => {
        initialAnswers[entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`] = 
          Array(entry.answer.length).fill('');
      });
      setUserAnswers(initialAnswers);
      
      // Select first entry by default
      if (initialCrossword.entries.length > 0) {
        const firstEntry = initialCrossword.entries[0];
        setSelectedEntry(firstEntry);
        setSelectedCell({
          row: firstEntry.position.row,
          col: firstEntry.position.col
        });
      }
    }
  }, [initialCrossword]);
  
  // Select a cell and its corresponding entry
  const selectCell = useCallback((row, col) => {
    setSelectedCell({ row, col });
    
    // Find the entry that contains this cell
    if (crossword) {
      // Find all entries that include this cell
      const entriesAtCell = crossword.entries.filter(entry => {
        if (entry.direction === 'across') {
          return entry.position.row === row && 
                 col >= entry.position.col && 
                 col < (entry.position.col + entry.answer.length);
        } else { // down
          return entry.position.col === col && 
                 row >= entry.position.row && 
                 row < (entry.position.row + entry.answer.length);
        }
      });
      
      if (entriesAtCell.length > 0) {
        // If we already have a selected entry at this position, toggle direction
        if (selectedEntry && entriesAtCell.length > 1) {
          // Find if the selected entry is at this position
          const isSelectedEntryAtCell = entriesAtCell.some(
            e => e.number === selectedEntry.number && e.direction === selectedEntry.direction
          );
          
          if (isSelectedEntryAtCell) {
            // Toggle to the other direction
            const currentDirection = selectedEntry.direction;
            const nextEntry = entriesAtCell.find(e => e.direction !== currentDirection);
            if (nextEntry) {
              setSelectedEntry(nextEntry);
              return;
            }
          }
        }
        
        // Default to the first entry that contains this cell
        setSelectedEntry(entriesAtCell[0]);
      }
    }
  }, [crossword, selectedEntry]);
  
  // Update a user answer
  const updateAnswer = useCallback((entryId, index, value) => {
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      const answerArray = [...(newAnswers[entryId] || [])];
      answerArray[index] = value.toUpperCase();
      newAnswers[entryId] = answerArray;
      return newAnswers;
    });
  }, []);
  
  // Get the current value of a cell
  const getCellValue = useCallback((row, col) => {
    if (!crossword) return '';
    
    // Find the entry that contains this cell
    for (const entry of crossword.entries) {
      const entryId = entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`;
      const answers = userAnswers[entryId] || [];
      
      if (entry.direction === 'across') {
        if (entry.position.row === row && 
            col >= entry.position.col && 
            col < (entry.position.col + entry.answer.length)) {
          const index = col - entry.position.col;
          return answers[index] || '';
        }
      } else { // down
        if (entry.position.col === col && 
            row >= entry.position.row && 
            row < (entry.position.row + entry.answer.length)) {
          const index = row - entry.position.row;
          return answers[index] || '';
        }
      }
    }
    
    return '';
  }, [crossword, userAnswers]);
  
  // Check if all answers are filled in
  useEffect(() => {
    if (!crossword || !userAnswers) return;
    
    const allFilled = Object.values(userAnswers).every(answer => 
      answer.every(char => char !== '')
    );
    
    setIsComplete(allFilled);
  }, [crossword, userAnswers]);
  
  // Get all user answers in a format suitable for submission
  const getSubmissionAnswers = useCallback(() => {
    if (!crossword) return [];
    
    return crossword.entries.map(entry => {
      const entryId = entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`;
      return {
        entryId,
        answer: (userAnswers[entryId] || []).join('')
      };
    });
  }, [crossword, userAnswers]);
  
  // Reset all user answers
  const resetAnswers = useCallback(() => {
    if (!crossword) return;
    
    const initialAnswers = {};
    crossword.entries.forEach(entry => {
      initialAnswers[entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`] = 
        Array(entry.answer.length).fill('');
    });
    setUserAnswers(initialAnswers);
  }, [crossword]);
  
  // Fill in a specific answer (for "Show Answers" feature)
  const fillAnswer = useCallback((entryId, answer) => {
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      const answerArray = Array.from(answer.toUpperCase());
      newAnswers[entryId] = answerArray;
      return newAnswers;
    });
  }, []);
  
  // Fill in all answers
  const fillAllAnswers = useCallback(() => {
    if (!crossword) return;
    
    const completeAnswers = {};
    crossword.entries.forEach(entry => {
      const entryId = entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`;
      completeAnswers[entryId] = Array.from(entry.answer.toUpperCase());
    });
    setUserAnswers(completeAnswers);
  }, [crossword]);
  
  return {
    crossword,
    userAnswers,
    selectedCell,
    selectedEntry,
    isComplete,
    selectCell,
    updateAnswer,
    getCellValue,
    getSubmissionAnswers,
    resetAnswers,
    fillAnswer,
    fillAllAnswers
  };
};

export default useCrossword;