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
    }
  }, [initialCrossword]);
  
  // Select a cell and its corresponding entry
  const selectCell = useCallback((row, col) => {
    setSelectedCell({ row, col });
    
    // Find the entry that contains this cell
    if (crossword) {
      const entry = crossword.entries.find(e => {
        // Check if the cell is part of this entry
        if (e.direction === 'across') {
          return e.position.row === row && 
                 col >= e.position.col && 
                 col < (e.position.col + e.answer.length);
        } else {
          return e.position.col === col && 
                 row >= e.position.row && 
                 row < (e.position.row + e.answer.length);
        }
      });
      
      if (entry) {
        setSelectedEntry(entry);
      }
    }
  }, [crossword]);
  
  // Update a user answer
  const updateAnswer = useCallback((entryId, index, value) => {
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      const answerArray = [...newAnswers[entryId]];
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
  
  return {
    crossword,
    userAnswers,
    selectedCell,
    selectedEntry,
    isComplete,
    selectCell,
    updateAnswer,
    getCellValue,
    getSubmissionAnswers
  };
};

export default useCrossword;