import React, { useState } from 'react';

/**
 * A component to visually inspect crossword data and state
 * Place this inside your PlayQuiz component to see what's happening
 */
const CrosswordInspector = ({ 
  crosswordData,
  userAnswers,
  selectedCell,
  selectedClue
}) => {
  const [showInspector, setShowInspector] = useState(true);
  const [activeTab, setActiveTab] = useState('structure');

  if (!showInspector) {
    return (
      <button
        onClick={() => setShowInspector(true)}
        className="fixed top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded text-sm z-50"
      >
        Show Inspector
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-gray-800 text-white rounded-lg shadow-lg z-50 w-96 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center p-2 border-b border-gray-700">
        <h3 className="font-semibold">Crossword Inspector</h3>
        <button
          onClick={() => setShowInspector(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="flex border-b border-gray-700">
        <button
          className={`px-4 py-2 ${activeTab === 'structure' ? 'bg-gray-700' : ''}`}
          onClick={() => setActiveTab('structure')}
        >
          Structure
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'state' ? 'bg-gray-700' : ''}`}
          onClick={() => setActiveTab('state')}
        >
          State
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'grid' ? 'bg-gray-700' : ''}`}
          onClick={() => setActiveTab('grid')}
        >
          Grid
        </button>
      </div>
      
      <div className="p-4">
        {activeTab === 'structure' && (
          <div>
            <h4 className="font-semibold mb-2">Crossword Data Structure</h4>
            <div className="mb-2">
              <span className="text-gray-400">Has grid object:</span> {crosswordData?.grid ? '✓' : '✗'}
            </div>
            <div className="mb-2">
              <span className="text-gray-400">Has grid array:</span> {crosswordData?.grid?.grid ? '✓' : '✗'}
            </div>
            <div className="mb-2">
              <span className="text-gray-400">Has entries array:</span> {Array.isArray(crosswordData?.entries) ? '✓' : '✗'}
            </div>
            <div className="mb-2">
              <span className="text-gray-400">Grid dimensions:</span> 
              {crosswordData?.grid?.grid 
                ? `${crosswordData.grid.grid.length}×${crosswordData.grid.grid[0]?.length || 0}`
                : 'N/A'
              }
            </div>
            <div className="mb-2">
              <span className="text-gray-400">Number of entries:</span> {crosswordData?.entries?.length || 0}
            </div>
            {crosswordData?.entries?.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold mb-2">First entry sample:</h5>
                <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto">
                  {JSON.stringify(crosswordData.entries[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'state' && (
          <div>
            <h4 className="font-semibold mb-2">Component State</h4>
            <div className="mb-2">
              <span className="text-gray-400">Selected cell:</span>
              <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto mt-1">
                {JSON.stringify(selectedCell, null, 2) || 'null'}
              </pre>
            </div>
            <div className="mb-2">
              <span className="text-gray-400">Selected clue:</span>
              <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto mt-1">
                {selectedClue 
                  ? `#${selectedClue.number} ${selectedClue.direction}: ${selectedClue.clue}`
                  : 'none'
                }
              </pre>
            </div>
            <div className="mb-2">
              <span className="text-gray-400">User answers:</span>
              <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto mt-1 max-h-32">
                {JSON.stringify(userAnswers, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {activeTab === 'grid' && crosswordData?.grid?.grid && (
          <div>
            <h4 className="font-semibold mb-2">Grid Preview</h4>
            <div className="overflow-auto">
              <div className="grid gap-px bg-gray-600 inline-block p-1">
                {crosswordData.grid.grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`w-6 h-6 flex items-center justify-center text-xs font-medium
                          ${cell === '' ? 'bg-black' : 'bg-white text-black'}`}
                      >
                        {cell !== '' && cell}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="font-semibold mb-2">Across Clues:</h5>
              <ul className="text-xs space-y-1 ml-2">
                {crosswordData.entries
                  .filter(entry => entry.direction === 'across')
                  .sort((a, b) => a.number - b.number)
                  .map(entry => (
                    <li key={`across-${entry.number}`}>
                      <span className="font-medium">{entry.number}.</span> {entry.clue} ({entry.answer})
                    </li>
                  ))
                }
              </ul>
            </div>
            
            <div className="mt-4">
              <h5 className="font-semibold mb-2">Down Clues:</h5>
              <ul className="text-xs space-y-1 ml-2">
                {crosswordData.entries
                  .filter(entry => entry.direction === 'down')
                  .sort((a, b) => a.number - b.number)
                  .map(entry => (
                    <li key={`down-${entry.number}`}>
                      <span className="font-medium">{entry.number}.</span> {entry.clue} ({entry.answer})
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-2 border-t border-gray-700 text-xs">
        <div className="flex space-x-2">
          <button 
            onClick={() => console.log('Crossword Data:', crosswordData)}
            className="px-2 py-1 bg-blue-700 rounded hover:bg-blue-600"
          >
            Log Data
          </button>
          <button 
            onClick={() => console.log('User Answers:', userAnswers)}
            className="px-2 py-1 bg-blue-700 rounded hover:bg-blue-600"
          >
            Log Answers
          </button>
          <button 
            onClick={() => console.log('Selected:', { cell: selectedCell, clue: selectedClue })}
            className="px-2 py-1 bg-blue-700 rounded hover:bg-blue-600"
          >
            Log Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrosswordInspector;