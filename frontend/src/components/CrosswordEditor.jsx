import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

/**
 * CrosswordEditor component for displaying and editing a crossword grid
 * @param {Object} props - Component props
 * @param {Object} props.crosswordData - Crossword data
 * @param {Function} props.onBack - Function to go back
 */
const CrosswordEditor = ({ crosswordData, onBack }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  // Select a cell and determine the selected entry
  const selectCell = (row, col) => {
    setSelectedCell({ row, col });
    
    // Find entries that include this cell
    const entriesAtCell = crosswordData.entries.filter(entry => {
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
    
    if (entriesAtCell.length > 0) {
      // If we already have a selected entry and it's at this position, toggle direction
      if (selectedEntry && entriesAtCell.length > 1) {
        const currentDirection = selectedEntry.direction;
        const nextEntry = entriesAtCell.find(e => e.direction !== currentDirection);
        if (nextEntry) {
          setSelectedEntry(nextEntry);
          return;
        }
      }
      
      // Default to the first entry at this cell
      setSelectedEntry(entriesAtCell[0]);
    }
  };
  
  // Render a cell in the crossword grid
  const renderCell = (row, col) => {
    // Check if this cell is part of the grid
    const hasLetter = crosswordData.grid.grid[row][col] !== '';
    
    // Check if this cell is the start of an entry
    const isStartOfEntry = crosswordData.entries.some(
      entry => entry.position.row === row && entry.position.col === col
    );
    
    // Get the entry number if this is the start of an entry
    const entryNumber = isStartOfEntry 
      ? crosswordData.entries.find(
          entry => entry.position.row === row && entry.position.col === col
        )?.number
      : null;
    
    // Check if this cell is selected or part of the selected entry
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
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
    
    return (
      <div
        key={`${row}-${col}`}
        className={`
          w-10 h-10 border border-gray-300 relative
          ${!hasLetter ? 'bg-black border-black' : 'bg-white'}
          ${isSelected ? 'bg-blue-200 border-blue-500' : ''}
          ${isHighlighted && !isSelected ? 'bg-blue-50' : ''}
        `}
        onClick={() => hasLetter && selectCell(row, col)}
      >
        {hasLetter && (
          <>
            {entryNumber && (
              <span className="absolute top-0 left-0 text-xs p-0.5">
                {entryNumber}
              </span>
            )}
            <span className="flex items-center justify-center h-full text-lg font-semibold">
              {crosswordData.grid.grid[row][col]}
            </span>
          </>
        )}
      </div>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Crossword Preview
        </h2>
        
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center"
        >
          <ArrowLeft className="mr-2" size={18} />
          Back to Questions
        </button>
      </div>
      
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
                  .map(entry => (
                    <li 
                      key={`across-${entry.number}`}
                      className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${
                        selectedEntry && selectedEntry.number === entry.number && 
                        selectedEntry.direction === 'across' ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => selectCell(entry.position.row, entry.position.col)}
                    >
                      <span className="font-medium">{entry.number}.</span> {entry.clue}
                      <span className="text-xs text-gray-500 ml-1">({entry.answer.length})</span>
                    </li>
                  ))}
              </ul>
            </div>
            
            {/* Down Clues */}
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-2">Down</h4>
              <ul className="space-y-2">
                {crosswordData.entries
                  .filter(entry => entry.direction === 'down')
                  .sort((a, b) => a.number - b.number)
                  .map(entry => (
                    <li 
                      key={`down-${entry.number}`}
                      className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${
                        selectedEntry && selectedEntry.number === entry.number && 
                        selectedEntry.direction === 'down' ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => selectCell(entry.position.row, entry.position.col)}
                    >
                      <span className="font-medium">{entry.number}.</span> {entry.clue}
                      <span className="text-xs text-gray-500 ml-1">({entry.answer.length})</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading state for CrosswordEditor
 * @param {Object} props - Component props
 * @param {Function} props.onBack - Function to go back
 */
const CrosswordEditorLoading = ({ onBack }) => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">
        Building Crossword
      </h2>
      
      <button 
        onClick={onBack}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center"
      >
        <ArrowLeft className="mr-2" size={18} />
        Back to Questions
      </button>
    </div>
    
    <div className="flex flex-col items-center justify-center py-12">
      <RefreshCw className="animate-spin mb-4" size={32} />
      <p>Building your crossword puzzle...</p>
      <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
    </div>
  </div>
);

export { CrosswordEditor, CrosswordEditorLoading };