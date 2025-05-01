import React, { useRef, useEffect } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import useCrossword from '../hooks/useCrossword';

const PlayQuiz = ({ crosswordData }) => {
  const {
    crossword,
    userAnswers,
    selectedCell,
    selectedEntry,
    isComplete,
    selectCell,
    updateAnswer,
    getCellValue
  } = useCrossword(crosswordData);
  
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
      }
      
      // Check if the new cell is within the grid and not a black square
      if (crossword && 
          newRow >= 0 && newRow < crossword.grid.length && 
          newCol >= 0 && newCol < crossword.grid[0].length && 
          crossword.grid[newRow][newCol] !== '') {
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
  };
  
  // Reset the crossword
  const handleReset = () => {
    window.location.reload();
  };
  
  // Check if all answers are correct
  const checkAnswers = () => {
    if (!crossword) return false;
    
    // Check each entry
    for (const entry of crossword.entries) {
      const entryId = entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`;
      const userAnswer = (userAnswers[entryId] || []).join('');
      
      if (userAnswer.toUpperCase() !== entry.answer.toUpperCase()) {
        return false;
      }
    }
    
    return true;
  };
  
  // Render a cell in the crossword grid
  const renderCell = (row, col) => {
    // If we don't have crossword data yet, render empty cells
    if (!crossword) {
      return (
        <div 
          key={`${row}-${col}`} 
          className="crossword-cell w-10 h-10"
        />
      );
    }
    
    // Check if this cell is part of the grid
    const isCellInGrid = crossword.grid[row][col] !== '';
    
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
    
    return (
      <div
        key={`${row}-${col}`}
        className={`
          crossword-cell w-10 h-10 relative
          ${!isCellInGrid ? 'crossword-cell-black' : ''}
          ${isSelected ? 'crossword-cell-selected' : ''}
          ${isHighlighted && !isSelected ? 'crossword-cell-highlight' : ''}
        `}
        onClick={() => isCellInGrid && selectCell(row, col)}
      >
        {isCellInGrid && (
          <>
            {entryNumber && (
              <span className="crossword-number">{entryNumber}</span>
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
              <span>
                {getCellValue(row, col)}
              </span>
            )}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Crossword Grid */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="overflow-auto">
            {crossword && crossword.grid ? (
              <div className="grid gap-px bg-gray-300 inline-block">
                {crossword.grid.map((row, rowIndex) => (
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
        <div className="flex-1 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Clues</h3>
            
            <button
              onClick={handleReset}
              className="btn btn-outline btn-sm flex items-center"
            >
              <RotateCcw className="mr-1" size={14} />
              Reset
            </button>
          </div>
          
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
                      
                      return (
                        <li 
                          key={`across-${entry.number}`}
                          className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${
                            selectedEntry && selectedEntry.number === entry.number && 
                            selectedEntry.direction === 'across' ? 'bg-primary-50' : ''
                          }`}
                          onClick={() => selectCell(entry.position.row, entry.position.col)}
                        >
                          <span className="font-medium">{entry.number}.</span> {entry.clue}
                          <span className="text-xs text-gray-500 ml-1">({entry.answer.length})</span>
                          
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
                      
                      return (
                        <li 
                          key={`down-${entry.number}`}
                          className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${
                            selectedEntry && selectedEntry.number === entry.number && 
                            selectedEntry.direction === 'down' ? 'bg-primary-50' : ''
                          }`}
                          onClick={() => selectCell(entry.position.row, entry.position.col)}
                        >
                          <span className="font-medium">{entry.number}.</span> {entry.clue}
                          <span className="text-xs text-gray-500 ml-1">({entry.answer.length})</span>
                          
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
      
      {/* Completion State */}
      {isComplete && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">
                {checkAnswers() ? 'Congratulations! All answers are correct!' : 'Crossword Complete!'}
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  {checkAnswers() 
                    ? 'You\'ve successfully completed the music crossword puzzle with all correct answers!'
                    : 'You\'ve filled in all the answers, but some might not be correct. Double-check your answers.'}
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