import React, { useState, useRef, useEffect } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import useCrossword from '../hooks/useCrossword';

/**
 * PlayQuiz component for interactive crossword puzzles
 * @param {Object} props - Component props
 * @param {Object} props.crosswordData - Crossword data
 * @param {Function} props.onReset - Function to reset the quiz
 */
const PlayQuiz = ({ crosswordData, onReset }) => {
  const {
    crossword,
    userAnswers,
    selectedCell,
    selectedEntry,
    isComplete,
    selectCell,
    updateAnswer,
    getCellValue,
    getSubmissionAnswers
  } = useCrossword(crosswordData);
  
  const [showAnswers, setShowAnswers] = useState(false);
  const [checkResults, setCheckResults] = useState(null);
  
  // Reference to input cells for focus management
  const inputRefs = useRef({});
  
  // When a cell is selected, focus the input
  useEffect(() => {
    if (selectedCell && selectedEntry) {
      const { row, col } = selectedCell;
      const entryId = selectedEntry.id || `${selectedEntry.position.row}-${selectedEntry.position.col}-${selectedEntry.direction}`;
      
      // Calculate the index in the entry
      let index = 0;
      if (selectedEntry.direction === 'across') {
        index = col - selectedEntry.position.col;
      } else { // down
        index = row - selectedEntry.position.row;
      }
      
      // Focus the input
      const inputId = `${entryId}-${index}`;
      const inputElement = inputRefs.current[inputId];
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [selectedCell, selectedEntry]);
  
  // Handle input change
  const handleInputChange = (entryId, index, value) => {
    // Only allow single letter inputs
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }
    
    // Only allow letters
    if (value && !/^[A-Za-z]$/.test(value)) {
      return;
    }
    
    // Update the answer
    updateAnswer(entryId, index, value);
    
    // Clear check results when user makes changes
    if (checkResults) {
      setCheckResults(null);
    }
    
    // Auto-advance to next cell if a letter was entered
    if (value && selectedEntry) {
      const { direction } = selectedEntry;
      
      // Get the next cell position
      let nextRow = selectedCell.row;
      let nextCol = selectedCell.col;
      
      if (direction === 'across') {
        nextCol += 1;
      } else { // down
        nextRow += 1;
      }
      
      // Check if the next cell is within the entry
      const isWithinEntry = 
        (direction === 'across' && 
         nextCol < selectedEntry.position.col + selectedEntry.answer.length) ||
        (direction === 'down' && 
         nextRow < selectedEntry.position.row + selectedEntry.answer.length);
      
      // Move to the next cell if it's within the entry
      if (isWithinEntry) {
        selectCell(nextRow, nextCol);
      }
    }
  };
  
  // Handle key press
  const handleKeyDown = (e) => {
    if (!selectedCell || !selectedEntry) return;
    
    // Handle arrow keys
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      
      let newRow = selectedCell.row;
      let newCol = selectedCell.col;
      
      switch (e.key) {
        case 'ArrowUp':
          newRow -= 1;
          break;
        case 'ArrowDown':
          newRow += 1;
          break;
        case 'ArrowLeft':
          newCol -= 1;
          break;
        case 'ArrowRight':
          newCol += 1;
          break;
        default:
          break;
      }
      
      // Check if the new cell is within the grid and not a black square
      if (crossword && 
          newRow >= 0 && newRow < crossword.grid.grid.length && 
          newCol >= 0 && newCol < crossword.grid.grid[0].length && 
          crossword.grid.grid[newRow][newCol] !== '') {
        selectCell(newRow, newCol);
      }
    }
    
    // Handle backspace
    if (e.key === 'Backspace') {
      const entryId = selectedEntry.id || `${selectedEntry.position.row}-${selectedEntry.position.col}-${selectedEntry.direction}`;
      
      // Calculate the index in the entry
      let index = 0;
      if (selectedEntry.direction === 'across') {
        index = selectedCell.col - selectedEntry.position.col;
      } else { // down
        index = selectedCell.row - selectedEntry.position.row;
      }
      
      // Get the current value
      const currentValue = userAnswers[entryId]?.[index] || '';
      
      if (currentValue) {
        // Clear the current cell
        updateAnswer(entryId, index, '');
        
        // Clear check results when user makes changes
        if (checkResults) {
          setCheckResults(null);
        }
      } else {
        // Move to the previous cell if the current cell is empty
        const { direction } = selectedEntry;
        
        // Get the previous cell position
        let prevRow = selectedCell.row;
        let prevCol = selectedCell.col;
        
        if (direction === 'across') {
          prevCol -= 1;
        } else { // down
          prevRow -= 1;
        }
        
        // Check if the previous cell is within the entry
        const isWithinEntry = 
          (direction === 'across' && 
           prevCol >= selectedEntry.position.col) ||
          (direction === 'down' && 
           prevRow >= selectedEntry.position.row);
        
        // Move to the previous cell if it's within the entry
        if (isWithinEntry) {
          selectCell(prevRow, prevCol);
        }
      }
    }
    
    // Handle tab and shift+tab for navigating between entries
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // Get all entries
      const entries = [...crossword.entries];
      
      // Sort entries by number
      entries.sort((a, b) => {
        if (a.number !== b.number) {
          return a.number - b.number;
        }
        // If same number, across comes before down
        return a.direction === 'across' ? -1 : 1;
      });
      
      // Find the current entry's index
      const currentIndex = entries.findIndex(entry => 
        entry.number === selectedEntry.number && 
        entry.direction === selectedEntry.direction
      );
      
      // Calculate the next entry index
      let nextIndex;
      if (e.shiftKey) {
        // Shift+Tab: go to previous entry
        nextIndex = (currentIndex - 1 + entries.length) % entries.length;
      } else {
        // Tab: go to next entry
        nextIndex = (currentIndex + 1) % entries.length;
      }
      
      // Select the first cell of the next entry
      const nextEntry = entries[nextIndex];
      selectCell(nextEntry.position.row, nextEntry.position.col);
    }
  };
  
  // Check if answers are correct
  const checkAnswers = () => {
    if (!crossword) return;
    
    // Get all answers
    const answers = getSubmissionAnswers();
    
    // Check each answer
    const results = answers.map(submission => {
      const entry = crossword.entries.find(e => {
        const entryId = e.id || `${e.position.row}-${e.position.col}-${e.direction}`;
        return entryId === submission.entryId;
      });
      
      if (!entry) return { correct: false };
      
      return {
        entryId: submission.entryId,
        userAnswer: submission.answer,
        correctAnswer: entry.answer,
        correct: submission.answer.toUpperCase() === entry.answer.toUpperCase(),
        direction: entry.direction,
        number: entry.number
      };
    });
    
    // Set check results
    setCheckResults(results);
    
    // Return overall result
    return results.every(result => result.correct);
  };
  
  // Reset the crossword
  const handleReset = () => {
    // If there's a custom reset handler, use it
    if (onReset) {
      onReset();
    } else {
      // Otherwise, just reload the page
      window.location.reload();
    }
  };
  
  // Toggle showing answers
  const handleShowAnswers = () => {
    setShowAnswers(!showAnswers);
  };
  
  // Render a cell in the crossword grid
  const renderCell = (row, col) => {
    // If we don't have crossword data yet, render empty cells
    if (!crossword) {
      return (
        <div 
          key={`${row}-${col}`} 
          className="w-10 h-10 border border-gray-300"
        />
      );
    }
    
    // Check if this cell is part of the grid
    const isCellInGrid = crossword.grid.grid[row][col] !== '';
    
    // Check if this cell is the start of an entry
    const isStartOfEntry = crossword.entries.some(
      entry => entry.position.row === row && entry.position.col === col
    );
    
    // Get the entry number if this is the start of an entry
    const entryNumber = isStartOfEntry 
      ? crossword.entries.find(
          entry => entry.position.row === row && entry.position.col === col
        )?.number
      : null;
    
    // Find which entry(s) this cell belongs to
    const entriesForCell = crossword.entries.filter(entry => {
      if (entry.direction === 'across') {
        return entry.position.row === row && 
               col >= entry.position.col && 
               col < entry.position.col + entry.answer.length;
      } else { // down
        return entry.position.col === col && 
               row >= entry.position.row && 
               row < entry.position.row + entry.answer.length;
      }
    });
    
    // If this cell is part of selected entry, we need the index and entry ID
    let selectedEntryId = null;
    let indexInSelectedEntry = null;
    
    if (selectedEntry && entriesForCell.some(e => 
      e.direction === selectedEntry.direction && e.number === selectedEntry.number
    )) {
      selectedEntryId = selectedEntry.id || 
        `${selectedEntry.position.row}-${selectedEntry.position.col}-${selectedEntry.direction}`;
      
      if (selectedEntry.direction === 'across') {
        indexInSelectedEntry = col - selectedEntry.position.col;
      } else { // down
        indexInSelectedEntry = row - selectedEntry.position.row;
      }
    }
    
    // Check if this cell is selected or part of the selected entry
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
    const isHighlighted = selectedEntry && entriesForCell.some(e => 
      e.direction === selectedEntry.direction && e.number === selectedEntry.number
    );
    
    // Get correct answer for the cell if showAnswers is true
    const correctLetter = showAnswers ? crossword.grid.grid[row][col] : '';
    
    // Determine if this cell's answer is correct
    let isCorrect = false;
    let isIncorrect = false;
    
    if (checkResults && entriesForCell.length > 0) {
      // Get the current value from user answers
      const actualValue = getCellValue(row, col);
      
      // This cell is correct if all entries it belongs to have correct answers at this position
      isCorrect = entriesForCell.every(entry => {
        const entryId = entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`;
        const result = checkResults.find(r => r.entryId === entryId);
        if (!result) return false;
        
        // Calculate index in the entry
        let index;
        if (entry.direction === 'across') {
          index = col - entry.position.col;
        } else { // down
          index = row - entry.position.row;
        }
        
        // Check if the letter at this index is correct
        return result.correctAnswer[index] === actualValue.toUpperCase();
      });
      
      // Cell is incorrect if it has a value but is not correct
      isIncorrect = !isCorrect && actualValue !== '';
    }
    
    return (
      <div
        key={`${row}-${col}`}
        className={`
          w-10 h-10 relative border border-gray-300
          ${!isCellInGrid ? 'bg-black border-black' : 'bg-white'}
          ${isSelected ? 'bg-blue-200 border-blue-500' : ''}
          ${isHighlighted && !isSelected ? 'bg-blue-50' : ''}
          ${isCorrect ? 'bg-green-100' : ''}
          ${isIncorrect ? 'bg-red-100' : ''}
        `}
        onClick={() => isCellInGrid && selectCell(row, col)}
      >
        {isCellInGrid && (
          <>
            {entryNumber && (
              <span className="absolute top-0 left-0 text-xs p-0.5">
                {entryNumber}
              </span>
            )}
            
            {isSelected && selectedEntryId && indexInSelectedEntry !== null ? (
              <input
                ref={el => {
                  inputRefs.current[`${selectedEntryId}-${indexInSelectedEntry}`] = el;
                }}
                className="w-full h-full text-center bg-transparent focus:outline-none uppercase"
                value={userAnswers[selectedEntryId]?.[indexInSelectedEntry] || ''}
                onChange={(e) => handleInputChange(selectedEntryId, indexInSelectedEntry, e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={1}
                autoComplete="off"
                spellCheck="false"
              />
            ) : (
              <span className="flex items-center justify-center h-full text-lg font-semibold">
                {showAnswers ? correctLetter : getCellValue(row, col)}
              </span>
            )}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Crossword Puzzle
        </h2>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleReset}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded flex items-center text-sm"
          >
            <RotateCcw className="mr-1" size={16} />
            Reset
          </button>
          
          <button 
            onClick={checkAnswers}
            className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded flex items-center text-sm"
            disabled={!isComplete}
          >
            <Check className="mr-1" size={16} />
            Check Answers
          </button>
          
          <button 
            onClick={handleShowAnswers}
            className="px-3 py-1 bg-secondary-500 hover:bg-secondary-600 text-white rounded text-sm"
          >
            {showAnswers ? 'Hide Answers' : 'Show Answers'}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Crossword Grid */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="overflow-auto">
            {crossword && crossword.grid.grid ? (
              <div className="grid gap-px bg-gray-300 inline-block">
                {crossword.grid.grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 w-64 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">Loading crossword...</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Clues List */}
        <div className="flex-1 border rounded-lg p-4 overflow-y-auto max-h-[500px]">
          <h3 className="font-medium mb-3">Clues</h3>
          
          {crossword && crossword.entries ? (
            <div className="space-y-6">
              {/* Across Clues */}
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-2">Across</h4>
                <ul className="space-y-2">
                  {crossword.entries
                    .filter(entry => entry.direction === 'across')
                    .sort((a, b) => a.number - b.number)
                    .map(entry => {
                      const entryId = entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`;
                      const isEntryComplete = userAnswers[entryId]?.every(char => char !== '');
                      
                      // Get the check result for this entry
                      const checkResult = checkResults?.find(r => r.entryId === entryId);
                      const isCorrect = checkResult?.correct;
                      
                      return (
                        <li 
                          key={`across-${entry.number}`}
                          className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${
                            selectedEntry && selectedEntry.number === entry.number && 
                            selectedEntry.direction === 'across' ? 'bg-primary-50' : ''
                          } ${isCorrect ? 'bg-green-50' : ''} 
                          ${checkResult && !isCorrect ? 'bg-red-50' : ''}`}
                          onClick={() => selectCell(entry.position.row, entry.position.col)}
                        >
                          <span className="font-medium">{entry.number}.</span> {entry.clue}
                          <span className="text-xs text-gray-500 ml-1">({entry.answer.length})</span>
                          
                          {/* Show the correct answer if showAnswers is true */}
                          {showAnswers && (
                            <span className="text-green-600 ml-2 font-medium">
                              {entry.answer}
                            </span>
                          )}
                          
                          {isEntryComplete && (
                            <span className="float-right text-green-500">
                              <Check size={16} />
                            </span>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>
              
              {/* Down Clues */}
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-2">Down</h4>
                <ul className="space-y-2">
                  {crossword.entries
                    .filter(entry => entry.direction === 'down')
                    .sort((a, b) => a.number - b.number)
                    .map(entry => {
                      const entryId = entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`;
                      const isEntryComplete = userAnswers[entryId]?.every(char => char !== '');
                      
                      // Get the check result for this entry
                      const checkResult = checkResults?.find(r => r.entryId === entryId);
                      const isCorrect = checkResult?.correct;
                      
                      return (
                        <li 
                          key={`down-${entry.number}`}
                          className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${
                            selectedEntry && selectedEntry.number === entry.number && 
                            selectedEntry.direction === 'down' ? 'bg-primary-50' : ''
                          } ${isCorrect ? 'bg-green-50' : ''} 
                          ${checkResult && !isCorrect ? 'bg-red-50' : ''}`}
                          onClick={() => selectCell(entry.position.row, entry.position.col)}
                        >
                          <span className="font-medium">{entry.number}.</span> {entry.clue}
                          <span className="text-xs text-gray-500 ml-1">({entry.answer.length})</span>
                          
                          {/* Show the correct answer if showAnswers is true */}
                          {showAnswers && (
                            <span className="text-green-600 ml-2 font-medium">
                              {entry.answer}
                            </span>
                          )}
                          
                          {isEntryComplete && (
                            <span className="float-right text-green-500">
                              <Check size={16} />
                            </span>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Clues will appear here</p>
          )}
        </div>
      </div>
      
      {/* Completion Feedback */}
      {isComplete && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">
                Crossword Complete!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  You've filled in all the answers. Click "Check Answers" to see if they're correct!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Check Results Feedback */}
      {checkResults && (
        <div className={`mt-6 p-4 border rounded-lg ${
          checkResults.every(r => r.correct) ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {checkResults.every(r => r.correct) ? (
                <Check className="h-8 w-8 text-green-500" />
              ) : (
                <span className="h-8 w-8 flex items-center justify-center rounded-full bg-yellow-200 text-yellow-800 font-bold">
                  !
                </span>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium">
                {checkResults.every(r => r.correct) 
                  ? 'Perfect! All answers are correct!' 
                  : 'Almost there! Some answers need correction.'}
              </h3>
              <div className="mt-2 text-sm">
                <p>
                  {checkResults.filter(r => r.correct).length} of {checkResults.length} answers correct
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayQuiz;