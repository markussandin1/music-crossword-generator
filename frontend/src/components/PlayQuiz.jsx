import React, { useState, useRef, useEffect } from 'react';
import { Check, RotateCcw, ArrowRightLeft } from 'lucide-react';

const PlayQuiz = ({ crosswordData, onReset }) => {
  const [userAnswers, setUserAnswers] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [direction, setDirection] = useState('across');
  const [isComplete, setIsComplete] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [checkResults, setCheckResults] = useState(null);
  
  // Initialize user answers based on the data structure
  useEffect(() => {
    if (!crosswordData || !crosswordData.entries) return;
    
    const initialAnswers = {};
    // Initialize empty answers for each entry using the same ID structure the other components use
    crosswordData.entries.forEach(entry => {
      // Create a unique ID for each entry
      const entryId = getEntryId(entry);
      initialAnswers[entryId] = Array(entry.answer.length).fill('');
    });
    
    setUserAnswers(initialAnswers);
    
    // Select the first entry by default
    if (crosswordData.entries.length > 0) {
      const firstEntry = crosswordData.entries[0];
      setSelectedEntry(firstEntry);
      setSelectedCell({ 
        row: firstEntry.position.row, 
        col: firstEntry.position.col 
      });
      setDirection(firstEntry.direction);
    }
  }, [crosswordData]);
  
  // Helper function to get a consistent entry ID
  const getEntryId = (entry) => {
    return `${entry.position.row}-${entry.position.col}-${entry.direction}`;
  };
  
  // Check if the puzzle is complete
  useEffect(() => {
    if (!userAnswers || Object.keys(userAnswers).length === 0) return;
    
    const complete = Object.values(userAnswers).every(
      answerArray => answerArray.every(letter => letter !== '')
    );
    
    setIsComplete(complete);
    if (checkResults) setCheckResults(null);
  }, [userAnswers]);
  
  // Find entries containing a specific cell
  const getEntriesAtCell = (row, col) => {
    if (!crosswordData) return [];
    
    return crosswordData.entries.filter(entry => {
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
  };
  
  const handleCellSelect = (row, col) => {
    // Check if we're clicking the same cell - toggle direction
    if (selectedCell?.row === row && selectedCell?.col === col) {
      toggleDirection();
      return;
    }
    
    setSelectedCell({ row, col });
    
    // Find all entries that contain this cell
    const entriesAtCell = getEntriesAtCell(row, col);
    
    if (entriesAtCell.length === 0) return;
    
    // Try to find an entry in the current direction
    let selectedEntry = entriesAtCell.find(e => e.direction === direction);
    
    // If no entry in current direction, use the first available
    if (!selectedEntry) {
      selectedEntry = entriesAtCell[0];
      setDirection(selectedEntry.direction);
    }
    
    setSelectedEntry(selectedEntry);
  };
  
  const toggleDirection = () => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    const entriesAtCell = getEntriesAtCell(row, col);
    
    // Try to find an entry in the opposite direction
    const newDirection = direction === 'across' ? 'down' : 'across';
    const newEntry = entriesAtCell.find(e => e.direction === newDirection);
    
    if (newEntry) {
      setDirection(newDirection);
      setSelectedEntry(newEntry);
    }
  };
  
  const handleKeyDown = (e) => {
    if (!selectedCell || !selectedEntry) return;
    
    const { row, col } = selectedCell;
    
    switch (e.key) {
      case 'Tab':
      case 'Enter':
        e.preventDefault();
        toggleDirection();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0 && crosswordData.grid.grid[row - 1][col] !== '') {
          handleCellSelect(row - 1, col);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (row < crosswordData.grid.grid.length - 1 && crosswordData.grid.grid[row + 1][col] !== '') {
          handleCellSelect(row + 1, col);
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0 && crosswordData.grid.grid[row][col - 1] !== '') {
          handleCellSelect(row, col - 1);
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        if (col < crosswordData.grid.grid[0].length - 1 && crosswordData.grid.grid[row][col + 1] !== '') {
          handleCellSelect(row, col + 1);
        }
        break;
        
      case 'Backspace':
        e.preventDefault();
        handleBackspace();
        break;
        
      default:
        // Only handle single letter keys
        if (/^[a-zA-Z]$/.test(e.key)) {
          e.preventDefault();
          handleLetterInput(e.key);
        }
        break;
    }
  };
  
  const handleLetterInput = (letter) => {
    if (!selectedEntry || !selectedCell) return;
    
    const { row, col } = selectedCell;
    const entryId = getEntryId(selectedEntry);
    
    // Calculate the position within the entry
    let index;
    if (selectedEntry.direction === 'across') {
      index = col - selectedEntry.position.col;
    } else {
      index = row - selectedEntry.position.row;
    }
    
    // Update the answer
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      const answerArray = [...(newAnswers[entryId] || [])];
      answerArray[index] = letter.toUpperCase();
      newAnswers[entryId] = answerArray;
      return newAnswers;
    });
    
    // Move to next cell in entry
    moveToNextCellInEntry();
  };
  
  const handleBackspace = () => {
    if (!selectedEntry || !selectedCell) return;
    
    const { row, col } = selectedCell;
    const entryId = getEntryId(selectedEntry);
    
    // Calculate index within entry
    let index;
    if (selectedEntry.direction === 'across') {
      index = col - selectedEntry.position.col;
    } else {
      index = row - selectedEntry.position.row;
    }
    
    const currentAnswer = userAnswers[entryId] || [];
    const currentValue = currentAnswer[index] || '';
    
    if (currentValue) {
      // Clear current cell
      setUserAnswers(prev => {
        const newAnswers = { ...prev };
        const answerArray = [...(newAnswers[entryId] || [])];
        answerArray[index] = '';
        newAnswers[entryId] = answerArray;
        return newAnswers;
      });
    } else {
      // Move to previous cell within the entry
      moveToPreviousCellInEntry();
    }
  };
  
  const moveToNextCellInEntry = () => {
    if (!selectedEntry || !selectedCell) return;
    
    const { row, col } = selectedCell;
    let nextRow = row;
    let nextCol = col;
    
    if (selectedEntry.direction === 'across') {
      nextCol++;
      // Check if we're still within the entry bounds
      if (nextCol < selectedEntry.position.col + selectedEntry.answer.length) {
        handleCellSelect(nextRow, nextCol);
      }
    } else { // down
      nextRow++;
      // Check if we're still within the entry bounds
      if (nextRow < selectedEntry.position.row + selectedEntry.answer.length) {
        handleCellSelect(nextRow, nextCol);
      }
    }
  };
  
  const moveToPreviousCellInEntry = () => {
    if (!selectedEntry || !selectedCell) return;
    
    const { row, col } = selectedCell;
    let prevRow = row;
    let prevCol = col;
    
    if (selectedEntry.direction === 'across') {
      prevCol--;
      // Check if we're still within the entry bounds
      if (prevCol >= selectedEntry.position.col) {
        handleCellSelect(prevRow, prevCol);
      }
    } else { // down
      prevRow--;
      // Check if we're still within the entry bounds
      if (prevRow >= selectedEntry.position.row) {
        handleCellSelect(prevRow, prevCol);
      }
    }
  };
  
  const getCellValue = (row, col) => {
    // Find all entries that contain this cell and return the user's input
    const entries = getEntriesAtCell(row, col);
    
    for (const entry of entries) {
      const entryId = getEntryId(entry);
      const answers = userAnswers[entryId] || [];
      
      let index;
      if (entry.direction === 'across') {
        index = col - entry.position.col;
      } else {
        index = row - entry.position.row;
      }
      
      const value = answers[index];
      if (value) return value;
    }
    
    return '';
  };
  
  const checkAnswers = () => {
    if (!isComplete) return;
    
    const results = crosswordData.entries.map(entry => {
      const entryId = getEntryId(entry);
      const userAnswer = userAnswers[entryId]?.join('') || '';
      
      return {
        entryId,
        clue: entry.clue,
        number: entry.number,
        direction: entry.direction,
        userAnswer,
        correctAnswer: entry.answer,
        isCorrect: userAnswer.toUpperCase() === entry.answer.toUpperCase()
      };
    });
    
    setCheckResults(results);
  };
  
  const isContinuousPath = (selectedCell, currentCell, direction) => {
    if (!selectedCell || !crosswordData?.grid?.grid) return false;
    
    const grid = crosswordData.grid.grid;
    
    if (direction === 'across' && selectedCell.row === currentCell.row) {
      // Check if there's an unbroken path of valid cells between selected and current
      const start = Math.min(selectedCell.col, currentCell.col);
      const end = Math.max(selectedCell.col, currentCell.col);
      
      for (let col = start; col <= end; col++) {
        if (grid[currentCell.row][col] === '') return false; // Black cell breaks the path
      }
      return true;
    }
    
    if (direction === 'down' && selectedCell.col === currentCell.col) {
      // Check if there's an unbroken path of valid cells between selected and current
      const start = Math.min(selectedCell.row, currentCell.row);
      const end = Math.max(selectedCell.row, currentCell.row);
      
      for (let row = start; row <= end; row++) {
        if (grid[row][currentCell.col] === '') return false; // Black cell breaks the path
      }
      return true;
    }
    
    return false;
  };
  
  const renderCell = (row, col) => {
    if (!crosswordData?.grid?.grid) return null;
    
    // Check if this cell exists in the grid
    const gridCellValue = crosswordData.grid.grid[row]?.[col];
    if (gridCellValue === undefined) return null;
    
    // Check if this cell is part of the crossword (not empty)
    const isValidCell = gridCellValue !== '';
    
    // Return black cell for empty positions (same as Editor)
    if (!isValidCell) {
      return (
        <div
          key={`${row}-${col}`}
          className="w-10 h-10 bg-black border border-black"
        />
      );
    }
    
    // Check if this is the start of an entry
    const isStartOfEntry = crosswordData.entries.some(
      entry => entry.position.row === row && entry.position.col === col
    );
    
    // Get the entry number if this is the start of an entry
    const entryNumber = isStartOfEntry 
      ? crosswordData.entries.find(
          entry => entry.position.row === row && entry.position.col === col
        )?.number
      : null;
    
    // Check if this cell is selected (active cell)
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
    
    // Check if this cell is part of the selected entry
    const isInSelectedEntry = selectedEntry && (
      (selectedEntry.direction === 'across' && 
       selectedEntry.position.row === row && 
       col >= selectedEntry.position.col && 
       col < selectedEntry.position.col + selectedEntry.answer.length) ||
      (selectedEntry.direction === 'down' && 
       selectedEntry.position.col === col && 
       row >= selectedEntry.position.row && 
       row < selectedEntry.position.row + selectedEntry.answer.length)
    );
    
    // Check if this cell should be highlighted for path indication (only if there's an unbroken path)
    const isInPath = selectedCell && !isInSelectedEntry && 
      isContinuousPath(selectedCell, { row, col }, direction);
    
    const userCellValue = getCellValue(row, col);
    const correctLetter = showAnswers ? gridCellValue : '';
    
    return (
      <div
        key={`${row}-${col}`}
        className={`
          w-10 h-10 border border-gray-300 relative cursor-pointer
          ${isSelected ? 'bg-blue-300 border-blue-600' : 
            isInSelectedEntry ? 'bg-blue-100' : 
            isInPath ? 'bg-blue-50' : 
            'bg-white'}
        `}
        onClick={() => handleCellSelect(row, col)}
      >
        {entryNumber && (
          <span className="absolute top-0 left-0 text-xs p-0.5 font-semibold">
            {entryNumber}
          </span>
        )}
        <span className="flex items-center justify-center h-full text-lg font-semibold relative">
          {showAnswers ? correctLetter : userCellValue}
          {isSelected && !userCellValue && !showAnswers && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="border-l-2 border-blue-700 h-6 animate-blink" />
            </span>
          )}
        </span>
      </div>
    );
  };
  
  if (!crosswordData || !crosswordData.grid?.grid || !crosswordData.entries) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-xl font-medium text-red-700">Error loading crossword</h3>
        <p className="mt-2">The crossword data is invalid or incomplete. Please try again.</p>
        <button 
          onClick={onReset}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div 
      className="flex flex-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Crossword Puzzle
        </h2>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleDirection}
            className={`px-3 py-1 rounded flex items-center text-sm ${
              direction === 'across' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-600 text-white'
            }`}
          >
            <ArrowRightLeft className="mr-1" size={16} />
            {direction === 'across' ? 'Across' : 'Down'}
          </button>
          
          <button 
            onClick={onReset}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded flex items-center text-sm"
          >
            <RotateCcw className="mr-1" size={16} />
            Reset
          </button>
          
          <button 
            onClick={checkAnswers}
            className={`px-3 py-1 rounded flex items-center text-sm ${
              isComplete 
                ? 'bg-primary-500 hover:bg-primary-600 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isComplete}
          >
            <Check className="mr-1" size={16} />
            Check Answers
          </button>
          
          <button 
            onClick={() => setShowAnswers(!showAnswers)}
            className="px-3 py-1 bg-secondary-500 hover:bg-secondary-600 text-white rounded text-sm"
          >
            {showAnswers ? 'Hide Answers' : 'Show Answers'}
          </button>
        </div>
      </div>
      
      {/* Current clue indicator */}
      {selectedEntry && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800">
            Current clue ({direction === 'across' ? 'Across' : 'Down'}):
          </h3>
          <p className="text-blue-900">
            {selectedEntry.number}. {selectedEntry.clue}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Press Tab/Enter to switch between across/down. Click the same cell to toggle direction.
          </p>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Crossword Grid */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="overflow-auto">
            <div className="grid gap-px bg-gray-300 inline-block">
              {crosswordData.grid.grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Clues List */}
        <div className="flex-1 border rounded-lg p-4">
          <h3 className="font-medium mb-3">Clues</h3>
          
          <div className="space-y-6">
            {/* Across Clues */}
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-2">Across</h4>
              <ul className="space-y-2">
                {crosswordData.entries
                  .filter(entry => entry.direction === 'across')
                  .sort((a, b) => a.number - b.number)
                  .map(entry => {
                    const entryId = getEntryId(entry);
                    const isEntrySelected = selectedEntry?.number === entry.number && 
                                           selectedEntry?.direction === 'across';
                    const isEntryComplete = userAnswers[entryId]?.every(char => char !== '');
                    
                    const result = checkResults?.find(r => 
                      r.direction === entry.direction && r.number === entry.number
                    );
                    
                    return (
                      <li 
                        key={`across-${entry.number}`}
                        className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${
                          isEntrySelected ? 'bg-blue-50' : ''
                        } ${result?.isCorrect ? 'bg-green-50' : ''}
                        ${result && !result.isCorrect ? 'bg-red-50' : ''}`}
                        onClick={() => {
                          setSelectedEntry(entry);
                          setSelectedCell({
                            row: entry.position.row,
                            col: entry.position.col
                          });
                          setDirection('across');
                        }}
                      >
                        <span className="font-medium">{entry.number}.</span> {entry.clue}
                        <span className="text-xs text-gray-500 ml-1">({entry.answer.length})</span>
                        
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
                {crosswordData.entries
                  .filter(entry => entry.direction === 'down')
                  .sort((a, b) => a.number - b.number)
                  .map(entry => {
                    const entryId = getEntryId(entry);
                    const isEntrySelected = selectedEntry?.number === entry.number && 
                                           selectedEntry?.direction === 'down';
                    const isEntryComplete = userAnswers[entryId]?.every(char => char !== '');
                    
                    const result = checkResults?.find(r => 
                      r.direction === entry.direction && r.number === entry.number
                    );
                    
                    return (
                      <li 
                        key={`down-${entry.number}`}
                        className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${
                          isEntrySelected ? 'bg-blue-50' : ''
                        } ${result?.isCorrect ? 'bg-green-50' : ''}
                        ${result && !result.isCorrect ? 'bg-red-50' : ''}`}
                        onClick={() => {
                          setSelectedEntry(entry);
                          setSelectedCell({
                            row: entry.position.row,
                            col: entry.position.col
                          });
                          setDirection('down');
                        }}
                      >
                        <span className="font-medium">{entry.number}.</span> {entry.clue}
                        <span className="text-xs text-gray-500 ml-1">({entry.answer.length})</span>
                        
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
        </div>
      </div>
      
      {/* Completion and results feedback */}
      {isComplete && !checkResults && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <Check className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-green-800">
                Crossword Complete!
              </h3>
              <p className="text-sm text-green-700">
                You've filled in all the answers. Click "Check Answers" to see if they're correct!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {checkResults && (
        <div className={`mt-6 p-4 border rounded-lg ${
          checkResults.every(r => r.isCorrect) ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {checkResults.every(r => r.isCorrect) ? (
                <Check className="h-8 w-8 text-green-500" />
              ) : (
                <span className="h-8 w-8 flex items-center justify-center rounded-full bg-yellow-200 text-yellow-800 font-bold">
                  !
                </span>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium">
                {checkResults.every(r => r.isCorrect) 
                  ? 'Perfect! All answers are correct!' 
                  : 'Almost there! Some answers need correction.'}
              </h3>
              <div className="mt-2 text-sm">
                <p>
                  {checkResults.filter(r => r.isCorrect).length} of {checkResults.length} answers correct
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