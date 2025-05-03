import React, { useState, useRef, useEffect } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

const CrosswordPlayer = ({ crosswordData, onBack }) => {
  // Initialize state only when we have valid crossword data
  const [userAnswers, setUserAnswers] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [currentDirection, setCurrentDirection] = useState('across');
  const [isComplete, setIsComplete] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const inputRefs = useRef({});
  
  // Initialize the crossword and user answers when data is available
  useEffect(() => {
    if (crosswordData && crosswordData.grid && crosswordData.entries) {
      // Initialize empty user answers using grid structure
      const initialAnswers = {};
      
      // Iterate through the grid and create entries for valid cells
      for (let row = 0; row < crosswordData.grid.grid.length; row++) {
        for (let col = 0; col < crosswordData.grid.grid[row].length; col++) {
          if (crosswordData.grid.grid[row][col] !== '') {
            const key = `${row},${col}`;
            initialAnswers[key] = '';
          }
        }
      }
      
      setUserAnswers(initialAnswers);
      
      // Select first entry by default
      if (crosswordData.entries.length > 0) {
        const firstEntry = crosswordData.entries[0];
        setSelectedEntry(firstEntry);
        setSelectedCell({
          row: firstEntry.position.row,
          col: firstEntry.position.col
        });
        setCurrentDirection(firstEntry.direction);
      }
    }
  }, [crosswordData]);
  
  // Get cell key helper function
  const getCellKey = (row, col) => {
    return `${row},${col}`;
  };
  
  // Focus on the selected cell
  useEffect(() => {
    if (selectedCell && selectedEntry) {
      const key = getCellKey(selectedCell.row, selectedCell.col);
      const inputElement = inputRefs.current[key];
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [selectedCell, selectedEntry]);
  
  // Check for puzzle completion
  useEffect(() => {
    if (!crosswordData) return;
    
    // Check if all cells have values
    let allFilled = true;
    for (let row = 0; row < crosswordData.grid.grid.length; row++) {
      for (let col = 0; col < crosswordData.grid.grid[row].length; col++) {
        if (crosswordData.grid.grid[row][col] !== '') {
          const key = getCellKey(row, col);
          if (!userAnswers[key]) {
            allFilled = false;
            break;
          }
        }
      }
      if (!allFilled) break;
    }
    
    setIsComplete(allFilled);
  }, [userAnswers, crosswordData]);
  
  // Get entries at a cell position
  const getEntriesAtCell = (row, col) => {
    if (!crosswordData?.entries) return [];
    
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
  
  // Find an entry at a cell with specific direction
  const findEntryInDirection = (row, col, direction) => {
    const entries = getEntriesAtCell(row, col);
    return entries.find(entry => entry.direction === direction);
  };
  
  // Select a cell and determine the appropriate entry
  const selectCell = (row, col) => {
    if (!crosswordData?.grid?.grid) return;
    
    // Check if cell is valid
    if (crosswordData.grid.grid[row][col] === '') return;
    
    // Set the selected cell
    setSelectedCell({ row, col });
    
    // Find entries at this cell
    const entriesAtCell = getEntriesAtCell(row, col);
    if (entriesAtCell.length === 0) return;
    
    // If clicking on the same cell, toggle direction
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      toggleDirection();
      return;
    }
    
    // First, try to find an entry in the current direction
    let newEntry = entriesAtCell.find(entry => entry.direction === currentDirection);
    
    // If no entry in current direction, use the first entry
    if (!newEntry) {
      newEntry = entriesAtCell[0];
      setCurrentDirection(newEntry.direction);
    }
    
    setSelectedEntry(newEntry);
  };
  
  // Handle cell input change
  const handleInputChange = (row, col, value) => {
    // Only accept letters
    if (value && !/^[a-zA-Z]$/i.test(value)) {
      return;
    }
    
    // Update the answer
    const key = getCellKey(row, col);
    const newAnswers = {...userAnswers};
    newAnswers[key] = value.toUpperCase();
    setUserAnswers(newAnswers);
    
    // Move to next cell if a letter was entered
    if (value && selectedEntry) {
      moveToNextCell(row, col);
    }
  };
  
  // Move to next cell
  const moveToNextCell = (row, col) => {
    if (!selectedEntry) return;
    
    let nextRow = row;
    let nextCol = col;
    
    if (selectedEntry.direction === 'across') {
      nextCol += 1;
    } else {
      nextRow += 1;
    }
    
    // Check if next cell is within the entry
    const withinEntry = 
      (selectedEntry.direction === 'across' && 
       nextCol < selectedEntry.position.col + selectedEntry.answer.length) ||
      (selectedEntry.direction === 'down' && 
       nextRow < selectedEntry.position.row + selectedEntry.answer.length);
    
    if (withinEntry) {
      moveToCell(nextRow, nextCol, selectedEntry.direction);
    }
  };
  
  // Move to a cell
  const moveToCell = (row, col, direction) => {
    if (!crosswordData?.grid?.grid) return;
    
    // Check if cell is valid
    if (row < 0 || row >= crosswordData.grid.grid.length || 
        col < 0 || col >= crosswordData.grid.grid[0].length ||
        crosswordData.grid.grid[row][col] === '') {
      return;
    }
    
    // Set the direction explicitly
    setCurrentDirection(direction);
    
    // Set the cell and entry
    setSelectedCell({ row, col });
    const entries = getEntriesAtCell(row, col);
    const entry = entries.find(e => e.direction === direction) || entries[0];
    if (entry) {
      setSelectedEntry(entry);
    }
  };
  
  // Toggle direction at the current cell
  const toggleDirection = () => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    const newDirection = currentDirection === 'across' ? 'down' : 'across';
    const entry = findEntryInDirection(row, col, newDirection);
    
    if (entry) {
      setCurrentDirection(newDirection);
      setSelectedEntry(entry);
    }
  };
  
  // Handle key presses
  const handleKeyDown = (e) => {
    if (!selectedCell || !selectedEntry) return;
    
    const { row, col } = selectedCell;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveToCell(row - 1, col, 'down');
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        moveToCell(row + 1, col, 'down');
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        moveToCell(row, col - 1, 'across');
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        moveToCell(row, col + 1, 'across');
        break;
        
      case 'Backspace':
        e.preventDefault();
        handleBackspace();
        break;
        
      case 'Tab':
        e.preventDefault();
        toggleDirection();
        break;
        
      case ' ': // Space
        e.preventDefault();
        toggleDirection();
        break;
    }
  };
  
  // Handle backspace key
  const handleBackspace = () => {
    if (!selectedCell || !selectedEntry) return;
    
    const { row, col } = selectedCell;
    const key = getCellKey(row, col);
    
    // Get current value
    const currentValue = userAnswers[key] || '';
    
    if (currentValue) {
      // Clear the current cell
      const newAnswers = {...userAnswers};
      newAnswers[key] = '';
      setUserAnswers(newAnswers);
    } else {
      // Move to previous cell if current is empty
      if (selectedEntry.direction === 'across' && col > selectedEntry.position.col) {
        moveToCell(row, col - 1, 'across');
      } else if (selectedEntry.direction === 'down' && row > selectedEntry.position.row) {
        moveToCell(row - 1, col, 'down');
      }
    }
  };
  
  // Get the value of a cell
  const getCellValue = (row, col) => {
    const key = getCellKey(row, col);
    return userAnswers[key] || '';
  };
  
  // Check if all answers are correct
  const checkAnswers = () => {
    if (!crosswordData?.entries || !isComplete) return false;
    
    for (const entry of crosswordData.entries) {
      let userAnswer = '';
      
      if (entry.direction === 'across') {
        for (let col = entry.position.col; col < entry.position.col + entry.answer.length; col++) {
          const key = getCellKey(entry.position.row, col);
          userAnswer += userAnswers[key] || '';
        }
      } else {
        for (let row = entry.position.row; row < entry.position.row + entry.answer.length; row++) {
          const key = getCellKey(row, entry.position.col);
          userAnswer += userAnswers[key] || '';
        }
      }
      
      if (userAnswer.toUpperCase() !== entry.answer.toUpperCase()) {
        return false;
      }
    }
    
    return true;
  };
  
  // Reset the crossword
  const handleReset = () => {
    if (!crosswordData?.grid?.grid) return;
    
    // Reset user answers
    const emptyAnswers = {};
    for (let row = 0; row < crosswordData.grid.grid.length; row++) {
      for (let col = 0; col < crosswordData.grid.grid[row].length; col++) {
        if (crosswordData.grid.grid[row][col] !== '') {
          emptyAnswers[getCellKey(row, col)] = '';
        }
      }
    }
    
    setUserAnswers(emptyAnswers);
    setIsCorrect(null);
    
    // Reset selection to first entry
    if (crosswordData?.entries?.length > 0) {
      const firstEntry = crosswordData.entries[0];
      setSelectedEntry(firstEntry);
      setSelectedCell({
        row: firstEntry.position.row,
        col: firstEntry.position.col
      });
      setCurrentDirection(firstEntry.direction);
    }
  };
  
  // Check answers function
  const handleCheckAnswers = () => {
    if (!isComplete) return;
    const correct = checkAnswers();
    setIsCorrect(correct);
  };
  
  // Render a cell in the grid
  cconst renderCell = (row, col) => {
    if (!crosswordData?.grid?.grid) return null;
    
    // Check if this cell is valid - IMPORTANT: Use the same logic as Editor
    const cellValue = crosswordData.grid.grid[row][col];
    const isValidCell = cellValue !== ''; // This is the key fix
    
    if (!isValidCell) {
      return (
        <div 
          key={getCellKey(row, col)} 
          className="w-10 h-10 bg-black border border-black" // Black for empty cells
        />
      );
    }
    
    // Check if this cell is the start of an entry
    const isStartOfEntry = crosswordData.entries?.some(
        entry => entry.position.row === row && entry.position.col === col
      );
      
      const entryNumber = isStartOfEntry 
        ? crosswordData.entries?.find(
            entry => entry.position.row === row && entry.position.col === col
          )?.number 
        : null;
      
      const isSelected = selectedCell && 
                        selectedCell.row === row && 
                        selectedCell.col === col;
      
      const isHighlighted = selectedEntry && (
        (selectedEntry.direction === 'across' && 
         selectedEntry.position.row === row && 
         col >= selectedEntry.position.col && 
         col < selectedEntry.position.col + selectedEntry.answer.length) ||
        (selectedEntry.direction === 'down' && 
         selectedEntry.position.col === col && 
         row >= selectedEntry.position.row && 
         row < selectedEntry.position.row + selectedEntry.answer.length)
      );
      
      const cellKey = getCellKey(row, col);
      
      return (
        <div
          key={cellKey}
          className={`
            w-10 h-10 relative border border-gray-300 bg-white
            ${isSelected ? 'bg-blue-200 border-blue-500' : ''}
            ${!isSelected && isHighlighted ? 'bg-blue-50' : ''}
          `}
          onClick={() => selectCell(row, col)}
        >
          {entryNumber && (
            <span className="absolute top-0 left-0 text-xs p-0.5">
              {entryNumber}
            </span>
          )}
          
          {isSelected ? (
            <input
              ref={el => {
                inputRefs.current[cellKey] = el;
              }}
              type="text"
              maxLength="1"
              value={getCellValue(row, col)}
              onChange={(e) => handleInputChange(row, col, e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-full text-center bg-transparent focus:outline-none uppercase font-semibold"
              autoComplete="off"
            />
          ) : (
            <span className="flex items-center justify-center h-full text-lg font-semibold">
              {getCellValue(row, col)}
            </span>
          )}
        </div>
      );
    };
  
  // Render clues
  const renderClues = () => {
    if (!crosswordData?.entries) return null;
    
    const acrossClues = crosswordData.entries
      .filter(entry => entry.direction === 'across')
      .sort((a, b) => a.number - b.number);
      
    const downClues = crosswordData.entries
      .filter(entry => entry.direction === 'down')
      .sort((a, b) => a.number - b.number);
    
    return (
      <div className="space-y-6">
        {/* Across clues */}
        <div>
          <h4 className="font-medium text-sm text-gray-500 mb-2">Across</h4>
          <ul className="space-y-2">
            {acrossClues.map(entry => {
              const isSelected = selectedEntry && 
                              selectedEntry.number === entry.number && 
                              selectedEntry.direction === 'across';
              
              return (
                <li 
                  key={`across-${entry.number}`}
                  className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setCurrentDirection('across');
                    setSelectedCell({
                      row: entry.position.row,
                      col: entry.position.col
                    });
                    setSelectedEntry(entry);
                  }}
                >
                  <span className="font-medium">{entry.number}.</span> {entry.clue}
                  <span className="text-xs text-gray-500 ml-1">({entry.answer.length})</span>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Down clues */}
        <div>
          <h4 className="font-medium text-sm text-gray-500 mb-2">Down</h4>
          <ul className="space-y-2">
            {downClues.map(entry => {
              const isSelected = selectedEntry && 
                              selectedEntry.number === entry.number && 
                              selectedEntry.direction === 'down';
              
              return (
                <li 
                  key={`down-${entry.number}`}
                  className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setCurrentDirection('down');
                    setSelectedCell({
                      row: entry.position.row,
                      col: entry.position.col
                    });
                    setSelectedEntry(entry);
                  }}
                >
                  <span className="font-medium">{entry.number}.</span> {entry.clue}
                  <span className="text-xs text-gray-500 ml-1">({entry.answer.length})</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  };
  
  // Loading state
  if (!crosswordData?.grid?.grid) {
    return (
      <div className="h-64 w-full bg-gray-100 flex items-center justify-center rounded">
        <p className="text-gray-400">Loading crossword...</p>
      </div>
    );
  }
  
  return (
    <div>
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
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Current Direction: <span className="font-medium">{currentDirection === 'across' ? 'Across' : 'Down'}</span></p>
            <p>Press Space or Tab to toggle direction. Use arrow keys to navigate.</p>
          </div>
        </div>
        
        {/* Clues */}
        <div className="flex-1 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Clues</h3>
            
            <div className="space-x-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Back
                </button>
              )}
              
              <button
                onClick={handleReset}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded flex items-center text-sm"
              >
                <RotateCcw className="mr-1" size={14} />
                Reset
              </button>
            </div>
          </div>
          
          {renderClues()}
        </div>
      </div>
      
      {/* Controls and status */}
      <div className="mt-6 flex justify-center items-center gap-4">
        {isComplete && (
          <button
            onClick={handleCheckAnswers}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded flex items-center"
          >
            <Check className="mr-2" size={16} />
            Check Answers
          </button>
        )}
        
        {isCorrect !== null && (
          <div className={`flex items-center gap-2 ${
            isCorrect ? 'text-green-600' : 'text-red-600'
          }`}>
            {isCorrect ? (
              <>
                <Check className="h-5 w-5" />
                <span>Correct! Well done!</span>
              </>
            ) : (
              <>
                <X className="h-5 w-5" />
                <span>Not quite right. Try again!</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrosswordPlayer;