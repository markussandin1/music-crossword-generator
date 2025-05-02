import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

export interface Placement {
  clue: string;
  answer: string;
  startx: number;
  starty: number;
  orientation: 'across' | 'down';
  position: number;
}

interface Props {
  table: string[][];
  result: Placement[];
  onComplete?: () => void;
  onSave?: (answers: Record<string, string>) => void;
  onShare?: () => void;
  initialAnswers?: Record<string, string>;
}

export const CrosswordGrid: React.FC<Props> = ({ 
  table, 
  result, 
  onComplete, 
  onSave, 
  onShare,
  initialAnswers = {} 
}) => {
  // State for tracking user input
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(initialAnswers);
  const [currentCell, setCurrentCell] = useState<{ x: number, y: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [completed, setCompleted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [highlightedClue, setHighlightedClue] = useState<{ orientation: 'across' | 'down', position: number } | null>(null);
  
  // Reference to input elements
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Create a number map for cell positions
  const numberMap = new Map<string, number>();
  result.forEach(({ startx, starty, position }) => {
    numberMap.set(`${starty},${startx}`, position);
  });

  // Group clues by orientation
  const acrossClues = result.filter(p => p.orientation === 'across')
    .sort((a, b) => a.position - b.position);
  const downClues = result.filter(p => p.orientation === 'down')
    .sort((a, b) => a.position - b.position);

  // Initialize empty answers
  useEffect(() => {
    const initialState = { ...initialAnswers };
    
    // Fill in any empty cells
    for (let y = 0; y < table.length; y++) {
      for (let x = 0; x < table[y].length; x++) {
        if (table[y][x] !== '-') {
          const key = `${y},${x}`;
          if (!initialState[key]) {
            initialState[key] = '';
          }
        }
      }
    }
    
    setUserAnswers(initialState);
  }, [table, initialAnswers]);

  // Handle highlighting active clue
  useEffect(() => {
    if (currentCell) {
      // Find the clue that contains the current cell
      const { x, y } = currentCell;
      
      // Find clues that include this cell
      const relevantClues = result.filter(clue => {
        if (clue.orientation === 'across') {
          return y === clue.starty && x >= clue.startx && x < clue.startx + clue.answer.length;
        } else {
          return x === clue.startx && y >= clue.starty && y < clue.starty + clue.answer.length;
        }
      });
      
      // Find the appropriate clue based on the direction
      const clue = relevantClues.find(c => c.orientation === direction) || relevantClues[0];
      
      if (clue) {
        setHighlightedClue({
          orientation: clue.orientation,
          position: clue.position
        });
      }
    }
  }, [currentCell, direction, result]);

  // Check if the crossword is completed
  useEffect(() => {
    const allCellsFilled = Object.entries(userAnswers).every(([key, value]) => {
      // Only check cells that correspond to actual crossword squares
      const [y, x] = key.split(',').map(Number);
      return table[y][x] === '-' || value !== '';
    });
    
    setCompleted(allCellsFilled);
    
    if (!allCellsFilled) {
      setIsCorrect(null);
    }
  }, [userAnswers, table]);

  // Get clue that contains the current cell
  const getClueAtCell = (x: number, y: number, orientation: 'across' | 'down') => {
    return result.find(clue => {
      if (clue.orientation === orientation) {
        if (orientation === 'across') {
          return y === clue.starty && x >= clue.startx && x < clue.startx + clue.answer.length;
        } else {
          return x === clue.startx && y >= clue.starty && y < clue.starty + clue.answer.length;
        }
      }
      return false;
    });
  };

  // Handle input change
  const handleInputChange = (y: number, x: number, value: string) => {
    // Only allow letters
    if (/^[a-zA-Z]?$/.test(value)) {
      const newValue = value.toUpperCase();
      
      setUserAnswers(prev => ({
        ...prev,
        [`${y},${x}`]: newValue
      }));
      
      // Move to next cell if a letter was entered
      if (newValue !== '') {
        moveToNextCell(x, y);
      }
    }
  };

  // Move to the next cell in the current word
  const moveToNextCell = (x: number, y: number) => {
    const clue = getClueAtCell(x, y, direction);
    
    if (!clue) return;
    
    // Calculate next cell position
    if (direction === 'across') {
      if (x < clue.startx + clue.answer.length - 1) {
        focusCell(x + 1, y);
      }
    } else {
      if (y < clue.starty + clue.answer.length - 1) {
        focusCell(x, y + 1);
      }
    }
  };

  // Move to the previous cell in the current word
  const moveToPrevCell = (x: number, y: number) => {
    const clue = getClueAtCell(x, y, direction);
    
    if (!clue) return;
    
    // Calculate previous cell position
    if (direction === 'across') {
      if (x > clue.startx) {
        focusCell(x - 1, y);
      }
    } else {
      if (y > clue.starty) {
        focusCell(x, y - 1);
      }
    }
  };

  // Focus a specific cell
  const focusCell = (x: number, y: number) => {
    const key = `${y},${x}`;
    const cellRef = cellRefs.current[key];
    
    if (cellRef) {
      cellRef.focus();
      setCurrentCell({ x, y });
    }
  };

  // Handle keydown events
  const handleKeyDown = (e: React.KeyboardEvent, y: number, x: number) => {
    // Set the current cell when focused
    setCurrentCell({ x, y });
    
    switch (e.key) {
      case 'Tab':
        // Toggle direction on tab
        e.preventDefault();
        setDirection(prev => prev === 'across' ? 'down' : 'across');
        break;
        
      case 'Backspace':
      case 'Delete':
        if (userAnswers[`${y},${x}`] === '') {
          // Move to previous cell if current cell is empty
          e.preventDefault();
          moveToPrevCell(x, y);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (y > 0 && table[y - 1][x] !== '-') {
          focusCell(x, y - 1);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (y < table.length - 1 && table[y + 1][x] !== '-') {
          focusCell(x, y + 1);
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        if (x > 0 && table[y][x - 1] !== '-') {
          focusCell(x - 1, y);
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        if (x < table[y].length - 1 && table[y][x + 1] !== '-') {
          focusCell(x + 1, y);
        }
        break;
        
      default:
        // When a letter key is pressed, it will be handled by onChange
        break;
    }
  };

  // Handle clicking on a cell
  const handleCellClick = (y: number, x: number) => {
    // Toggle direction when clicking on the already focused cell
    if (currentCell && currentCell.x === x && currentCell.y === y) {
      setDirection(prev => prev === 'across' ? 'down' : 'across');
    }
    
    setCurrentCell({ x, y });
  };

  // Handle clicking on a clue
  const handleClueClick = (orientation: 'across' | 'down', position: number) => {
    // Find the clue that matches
    const clue = result.find(
      c => c.orientation === orientation && c.position === position
    );
    
    if (clue) {
      // Focus on the first cell of the word
      focusCell(clue.startx, clue.starty);
      setDirection(orientation);
    }
  };

  // Check if all answers are correct
  const checkAnswers = () => {
    if (!completed) return;
    
    // Check each word against the correct answer
    const allCorrect = result.every(clue => {
      let userAnswer = '';
      
      // Collect the user's answer for this clue
      if (clue.orientation === 'across') {
        for (let x = 0; x < clue.answer.length; x++) {
          userAnswer += userAnswers[`${clue.starty},${clue.startx + x}`] || '';
        }
      } else {
        for (let y = 0; y < clue.answer.length; y++) {
          userAnswer += userAnswers[`${clue.starty + y},${clue.startx}`] || '';
        }
      }
      
      return userAnswer === clue.answer.toUpperCase();
    });
    
    setIsCorrect(allCorrect);
    
    if (allCorrect && onComplete) {
      onComplete();
    }
  };

  // Handle save button click
  const handleSave = () => {
    if (onSave) {
      onSave(userAnswers);
    }
  };

  // Handle share button click
  const handleShare = () => {
    if (onShare) {
      onShare();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:gap-8 w-full">
        <div className="md:w-1/2">
          <h3 className="text-lg font-semibold mb-2">Across</h3>
          <ul className="space-y-1">
            {acrossClues.map((clue) => (
              <li 
                key={`across-${clue.position}`}
                onClick={() => handleClueClick('across', clue.position)}
                className={`cursor-pointer p-1 rounded ${
                  highlightedClue && 
                  highlightedClue.orientation === 'across' && 
                  highlightedClue.position === clue.position 
                    ? 'bg-blue-100 font-medium' 
                    : ''
                }`}
              >
                <span className="font-medium">{clue.position}.</span> {clue.clue}
              </li>
            ))}
          </ul>
        </div>
        <div className="md:w-1/2">
          <h3 className="text-lg font-semibold mb-2">Down</h3>
          <ul className="space-y-1">
            {downClues.map((clue) => (
              <li 
                key={`down-${clue.position}`}
                onClick={() => handleClueClick('down', clue.position)}
                className={`cursor-pointer p-1 rounded ${
                  highlightedClue && 
                  highlightedClue.orientation === 'down' && 
                  highlightedClue.position === clue.position 
                    ? 'bg-blue-100 font-medium' 
                    : ''
                }`}
              >
                <span className="font-medium">{clue.position}.</span> {clue.clue}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-8 border-2 border-gray-800">
        <div
          className="grid gap-[2px] bg-gray-800 p-1"
          style={{
            gridTemplateColumns: `repeat(${table[0].length}, 40px)`
          }}
        >
          {table.map((row, y) =>
            row.map((cell, x) => {
              const key = `${y},${x}`;
              const isFilled = cell !== '-';
              const number = numberMap.get(key);
              
              // Determine if this cell is part of the highlighted word
              const isHighlighted = currentCell && (() => {
                if (!highlightedClue) return false;
                
                const activeClue = result.find(
                  c => c.orientation === highlightedClue.orientation && 
                       c.position === highlightedClue.position
                );
                
                if (!activeClue) return false;
                
                if (activeClue.orientation === 'across') {
                  return y === activeClue.starty && 
                         x >= activeClue.startx && 
                         x < activeClue.startx + activeClue.answer.length;
                } else {
                  return x === activeClue.startx && 
                         y >= activeClue.starty && 
                         y < activeClue.starty + activeClue.answer.length;
                }
              })();
              
              // Determine if this is the current cell
              const isCurrent = currentCell && 
                               currentCell.x === x && 
                               currentCell.y === y;

              return !isFilled ? (
                <div 
                  key={key} 
                  className="w-10 h-10 bg-black"
                />
              ) : (
                <div 
                  key={key} 
                  className={`relative w-10 h-10 bg-white border border-gray-500 ${
                    isHighlighted ? 'bg-blue-50' : ''
                  } ${
                    isCurrent ? 'bg-blue-200' : ''
                  }`}
                  onClick={() => handleCellClick(y, x)}
                >
                  {number && (
                    <div className="absolute text-[10px] top-[1px] left-[2px] text-gray-600 font-normal">
                      {number}
                    </div>
                  )}
                  <input
                    ref={el => cellRefs.current[key] = el}
                    type="text"
                    maxLength={1}
                    value={userAnswers[key] || ''}
                    onChange={(e) => handleInputChange(y, x, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, y, x)}
                    className="w-full h-full text-center text-lg font-bold uppercase focus:outline-none bg-transparent"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={checkAnswers}
          disabled={!completed}
          className={`px-4 py-2 rounded-md flex items-center gap-2 ${
            completed 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Check className="h-5 w-5" />
          Check Answers
        </button>
        
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Save Progress
        </button>
        
        <button
          onClick={handleShare}
          className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Share Crossword
        </button>
        
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