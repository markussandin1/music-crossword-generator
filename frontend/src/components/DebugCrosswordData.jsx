import React from 'react';

/**
 * Utility component to debug crossword data structure
 * @param {Object} props - Component props
 * @param {Object} props.crosswordData - Crossword data to debug
 */
const DebugCrosswordData = ({ crosswordData }) => {
  if (!crosswordData) {
    return (
      <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
        <h3 className="font-bold text-yellow-800">Debug: No Crossword Data</h3>
        <p>No crossword data is available to debug.</p>
      </div>
    );
  }

  // Check for basic structure
  const hasGrid = crosswordData.grid && Array.isArray(crosswordData.grid.grid);
  const hasEntries = Array.isArray(crosswordData.entries);
  const gridSize = hasGrid ? `${crosswordData.grid.grid.length}x${crosswordData.grid.grid[0]?.length || 0}` : 'N/A';
  const entriesCount = hasEntries ? crosswordData.entries.length : 0;

  // Check for specific structural issues
  const issues = [];
  
  if (!hasGrid) {
    issues.push('Missing or invalid grid structure');
  }
  
  if (!hasEntries) {
    issues.push('Missing entries array');
  } else if (entriesCount === 0) {
    issues.push('Entries array is empty');
  }

  // Check entries for common issues
  if (hasEntries && entriesCount > 0) {
    const entriesWithMissingProps = crosswordData.entries.filter(
      entry => !entry.answer || !entry.clue || !entry.position || !entry.direction
    );
    
    if (entriesWithMissingProps.length > 0) {
      issues.push(`${entriesWithMissingProps.length} entries have missing properties`);
    }
    
    // Check for invalid position values
    const entriesWithInvalidPos = crosswordData.entries.filter(
      entry => typeof entry.position?.row !== 'number' || typeof entry.position?.col !== 'number'
    );
    
    if (entriesWithInvalidPos.length > 0) {
      issues.push(`${entriesWithInvalidPos.length} entries have invalid position values`);
    }
  }

  return (
    <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6 text-sm font-mono">
      <h3 className="font-bold mb-2">Debug: Crossword Data</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white p-2 rounded">
          <span className="font-bold">Grid Size:</span> {gridSize}
        </div>
        <div className="bg-white p-2 rounded">
          <span className="font-bold">Entries:</span> {entriesCount}
        </div>
      </div>
      
      {issues.length > 0 && (
        <div className="bg-red-50 p-2 rounded border border-red-200 mb-4">
          <h4 className="font-bold text-red-700 mb-1">Issues Found:</h4>
          <ul className="list-disc pl-5 text-red-600">
            {issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      
      <details>
        <summary className="cursor-pointer font-bold">Raw Data (click to expand)</summary>
        <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto text-xs">
          {JSON.stringify(crosswordData, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default DebugCrosswordData;