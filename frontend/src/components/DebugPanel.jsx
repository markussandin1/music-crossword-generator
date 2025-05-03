import React from 'react';
import { RefreshCw, Bug, Zap } from 'lucide-react';

/**
 * Debug panel for development and testing
 * @param {Object} props
 * @param {Function} props.onLoadMockPlaylist - Function to load mock playlist data
 * @param {Function} props.onLoadMockQuestions - Function to load mock questions
 * @param {Function} props.onLoadMockCrossword - Function to load mock crossword
 * @param {Function} props.onReset - Function to reset the app state
 * @param {boolean} props.isVisible - Whether the panel is visible
 */
const DebugPanel = ({ 
  onLoadMockPlaylist, 
  onLoadMockQuestions, 
  onLoadMockCrossword, 
  onReset,
  isVisible = true
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg p-4 w-64">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold flex items-center">
            <Bug className="mr-2" size={16} />
            Developer Tools
          </h3>
          <div className="px-2 py-1 bg-yellow-500 text-black text-xs rounded">
            Testing
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-1">
            Quick Load Test Data:
          </div>
          
          <button
            onClick={onLoadMockPlaylist}
            className="w-full bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-2 rounded flex items-center justify-between text-sm"
          >
            <span>Load Test Playlist</span>
            <Zap size={14} />
          </button>
          
          <button
            onClick={onLoadMockQuestions}
            className="w-full bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded flex items-center justify-between text-sm"
          >
            <span>Load Test Questions</span>
            <Zap size={14} />
          </button>
          // Add this to your debug panel
<button 
  onClick={() => {
    console.log('Crossword Data Structure:', crosswordData);
    console.log('Grid Structure:', crosswordData?.grid);
    console.log('Entries:', crosswordData?.entries);
  }}
  className="w-full bg-blue-700 hover:bg-blue-600 text-white px-3 py-2 rounded flex items-center justify-between text-sm"
>
  <span>Debug Crossword Structure</span>
  <span>🔍</span>
</button>
          <button
            onClick={onLoadMockCrossword}
            className="w-full bg-purple-700 hover:bg-purple-600 text-white px-3 py-2 rounded flex items-center justify-between text-sm"
          >
            <span>Load Test Crossword</span>
            <Zap size={14} />
          </button>
          
          <div className="border-t border-gray-700 my-2 pt-2">
            <button
              onClick={onReset}
              className="w-full bg-red-700 hover:bg-red-600 text-white px-3 py-2 rounded flex items-center justify-between text-sm"
            >
              <span>Reset State</span>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-400">
          Press F8 to toggle this panel
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;