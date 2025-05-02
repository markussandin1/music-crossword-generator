import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CrosswordGrid } from './CrosswordGrid';
import { 
  saveToLocalStorage, 
  getFromLocalStorage, 
  generateShareableLink, 
  saveSharedCrossword,
  getCompletionPercentage
} from '../utils/storage';
import { spotifyApi, questionApi, crosswordApi } from '../services/api';

const CrosswordPlayer = () => {
  const { playlistId } = useParams();
  const [crosswordData, setCrosswordData] = useState(null);
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [savedAnswers, setSavedAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the playlist and create the crossword
  useEffect(() => {
    const loadCrossword = async () => {
      try {
        setIsLoading(true);
        
        // Check for saved progress
        const savedProgress = getFromLocalStorage(`crossword-${playlistId}`);
        if (savedProgress) {
          setSavedAnswers(savedProgress);
        }
        
        // Get saved crossword data if it exists
        const savedCrosswordData = getFromLocalStorage(`crossword-data-${playlistId}`);
        if (savedCrosswordData) {
          setCrosswordData(savedCrosswordData);
          
          // Also load playlist info if available
          const savedPlaylistInfo = getFromLocalStorage(`playlist-info-${playlistId}`);
          if (savedPlaylistInfo) {
            setPlaylistInfo(savedPlaylistInfo);
          }
          
          setIsLoading(false);
          return;
        }
        
        // Fetch playlist data from Spotify
        const playlistResponse = await spotifyApi.getPlaylistData(playlistId);
        const playlist = playlistResponse.data;
        
        const playlistInfoData = {
          name: playlist.name,
          description: playlist.description || '',
          owner: playlist.owner?.display_name || 'Unknown',
          imageUrl: playlist.images?.[0]?.url || '',
        };
        
        setPlaylistInfo(playlistInfoData);
        
        // Extract track data for question generation
        const trackData = playlist.tracks.items.map(item => ({
          name: item.track.name,
          artist: item.track.artists[0].name,
          album: item.track.album.name,
        }));
        
        // Generate questions
        const questionResponse = await questionApi.generateQuestions(trackData, {
          count: 15, // Number of questions to generate
          difficulty: 'medium',
        });
        
        // Build crossword
        const crosswordResponse = await crosswordApi.buildCrossword(questionResponse.data);
        const crosswordDataResult = crosswordResponse.data;
        
        setCrosswordData(crosswordDataResult);
        
        // Save the crossword data to localStorage to avoid regenerating it
        saveToLocalStorage(`crossword-data-${playlistId}`, crosswordDataResult);
        saveToLocalStorage(`playlist-info-${playlistId}`, playlistInfoData);
        
      } catch (err) {
        console.error('Error loading crossword:', err);
        setError(err.message || 'Failed to load crossword');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (playlistId) {
      loadCrossword();
    }
  }, [playlistId]);

  // Handle completing the crossword
  const handleComplete = () => {
    // Show a success message
    alert('Congratulations! You completed the crossword!');
    
    // Mark as completed in localStorage
    const completedAnswers = {...savedAnswers, completed: true};
    saveToLocalStorage(`crossword-${playlistId}`, completedAnswers);
    setSavedAnswers(completedAnswers);
  };
  
  // Save progress to localStorage
  const handleSave = (answers) => {
    if (saveToLocalStorage(`crossword-${playlistId}`, answers)) {
      // Also save playlist info for future reference
      if (playlistInfo) {
        saveToLocalStorage(`playlist-info-${playlistId}`, playlistInfo);
      }
      
      // Update the local state
      setSavedAnswers(answers);
      
      alert('Progress saved successfully!');
    } else {
      alert('Error saving progress');
    }
  };
  
  // Generate and share a link
  const handleShare = () => {
    if (crosswordData) {
      // Save the current state for sharing
      const shareId = saveSharedCrossword(playlistId, crosswordData, savedAnswers);
      
      // Generate a link with the share ID
      const shareableLink = generateShareableLink(playlistId, { share: shareId });
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareableLink)
        .then(() => {
          alert('Link copied to clipboard!');
        })
        .catch(() => {
          alert(`Share this link: ${shareableLink}`);
        });
    }
  };

  // Calculate completion percentage for display
  const getCompletion = () => {
    if (!crosswordData || !savedAnswers) return null;
    
    // Count total non-empty cells in the crossword
    let totalCells = 0;
    crosswordData.table.forEach(row => {
      row.forEach(cell => {
        if (cell !== '-') totalCells++;
      });
    });
    
    return getCompletionPercentage(savedAnswers, totalCells);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Crossword</h2>
        <p className="text-gray-600 text-center mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!crosswordData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Crossword Data Available</h2>
        <p className="text-gray-600 text-center">Unable to generate a crossword from this playlist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with playlist info */}
      {playlistInfo && (
        <div className="mb-6 flex items-center gap-4">
          {playlistInfo.imageUrl && (
            <img 
              src={playlistInfo.imageUrl} 
              alt={playlistInfo.name} 
              className="w-16 h-16 object-cover rounded-md shadow-md"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{playlistInfo.name}</h1>
            <p className="text-gray-600">By {playlistInfo.owner}</p>
            {savedAnswers?.completed && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed
              </span>
            )}
            {!savedAnswers?.completed && getCompletion() && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getCompletion()} Complete
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Crossword grid */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <CrosswordGrid 
          table={crosswordData.table}
          result={crosswordData.result}
          initialAnswers={savedAnswers}
          onComplete={handleComplete}
          onSave={handleSave}
          onShare={handleShare}
        />
      </div>
    </div>
  );
};

export default CrosswordPlayer;