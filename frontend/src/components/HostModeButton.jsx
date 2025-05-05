// frontend/src/components/HostModeButton.jsx

import React from 'react';
import { UsersRound, Music } from 'lucide-react';

/**
 * Button component for toggling Host Mode in the Music Crossword app
 * @param {Object} props - Component props
 * @param {boolean} props.isHostMode - Whether host mode is active
 * @param {Function} props.onClick - Click handler for the button
 * @param {boolean} props.disabled - Whether the button is disabled
 */
const HostModeButton = ({ isHostMode, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-md flex items-center gap-2 transition-colors
        ${isHostMode 
          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={isHostMode ? 'Switch to regular play mode' : 'Switch to quiz host mode'}
    >
      {isHostMode ? (
        <>
          <Music className="h-5 w-5" />
          <span>Play Mode</span>
        </>
      ) : (
        <>
          <UsersRound className="h-5 w-5" />
          <span>Host Quiz</span>
        </>
      )}
    </button>
  );
};

export default HostModeButton;