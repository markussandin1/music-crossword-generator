import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, SkipForward, Volume2, Award, Clock, Users, Mic, Zap, Settings, VolumeX } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import { ttsApi } from '../services/api';

/**
 * Component to display clues related to a song group
 */
const RelatedCluesContent = ({ 
    selectedGroup, 
    crosswordData, 
    revealedAnswers, 
    handleRevealAnswer, 
    handleHint,
    getGroupEntries // Add this prop
  }) => {
    // Remove the duplicate getGroupEntries function from here

    // Add this function inside the RelatedCluesContent component
    const getEntryId = (entry) => entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`;
    const entries = getGroupEntries();
    
    if (entries.length === 0) {
      return (
        <div className="p-4 bg-gray-50 border rounded-lg text-center text-gray-500">
          No crossword clues are associated with this song.
        </div>
      );
    }
  
    return (
      <div className="space-y-3">
        {entries.map((entry) => {
          const entryId = getEntryId(entry);
          const isRevealed = revealedAnswers[entryId];

        return (
          <div 
            key={entryId}
            className={`p-3 border rounded-lg transition-colors ${
              isRevealed
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-gray-800">
                  <span className="text-purple-600 font-bold mr-1">{entry.number}</span>
                  <span className="text-xs uppercase text-gray-500 mr-1">
                    {entry.direction}:
                  </span>
                  {entry.clue}
                </p>

                <p className="mt-2">
                  {isRevealed ? (
                    <span className="font-mono font-bold text-green-600 tracking-widest">
                      {entry.answer.split('').join(' ')}
                    </span>
                  ) : (
                    <span className="font-mono">
                      {Array(entry.answer.length).fill('_').join(' ')}
                    </span>
                  )}
                  <span className="ml-1 text-xs text-gray-500">
                    ({entry.answer.length} letters)
                  </span>
                </p>
              </div>

              <div className="flex flex-col space-y-1 ml-2">
                <button
                  onClick={() => handleRevealAnswer(entry)}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    isRevealed 
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                </button>

                {!isRevealed && (
                  <button
                    onClick={() => handleHint(entry)}
                    className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-medium"
                  >
                    Hint
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Host Mode interface for presenting the crossword as a quiz game
 * Uses song grouping data to organize questions by tracks
 */
const HostModeInterface = ({ 
  crosswordData, 
  onExit,
  onTogglePlayMode
}) => {
  // Console logs INSIDE the component
  console.log('Received crossword data:', crosswordData);
  console.log('Song groups:', crosswordData?.songGroups);

  // State
  const [activeTab, setActiveTab] = useState('songGroups');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isSongPlaying, setIsSongPlaying] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [teams, setTeams] = useState([
    { id: 1, name: 'Team 1', score: 0, color: 'bg-red-500' },
    { id: 2, name: 'Team 2', score: 0, color: 'bg-blue-500' }
  ]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // seconds
  const [quizMasterActive, setQuizMasterActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  // TTS specific states
  const [useOpenAITTS, setUseOpenAITTS] = useState(true);
  const [ttsVoice, setTtsVoice] = useState('coral');
  const [ttsModel, setTtsModel] = useState('gpt-4o-mini-tts');
  const [ttsInstructions, setTtsInstructions] = useState('Speak in a clear, engaging tone suitable for a quiz host');
  const [audioElement, setAudioElement] = useState(null);
  const [audioCache, setAudioCache] = useState({});
  const [volume, setVolume] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [ttsAvailable, setTTSAvailable] = useState(false);
  const [trackGroups, setTrackGroups] = useState([]);
  
  // Refs
  const timerRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  const handleRevealAnswer = (entry) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [`${entry.position.row}-${entry.position.col}-${entry.direction}`]: !prev[`${entry.position.row}-${entry.position.col}-${entry.direction}`]
    }));
  };
  
  const handleHint = (entry) => {
    // Simple hint implementation
    alert(`Hint: The answer starts with "${entry.answer[0]}" and ends with "${entry.answer[entry.answer.length-1]}"`);
  };
  
  // Initialization
  useEffect(() => {
    // Check if we have song groups
    if (crosswordData?.songGroups?.length > 0) {
      setSelectedGroup(crosswordData.songGroups[0]);
    }
    
    // Initialize speech synthesis if available
    if (window.speechSynthesis) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
    
    // Create audio element for playback
    const audio = new Audio();
    audio.onended = () => setIsSpeaking(false);
    audio.volume = volume;
    setAudioElement(audio);
    
    // Cleanup on unmount
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
      
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      
      // Clear audio cache
      Object.values(audioCache).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);
  
  // Update volume when it changes
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume;
    }
  }, [volume, audioElement]);
  
  // Check if TTS service is available
  useEffect(() => {
    const checkTTSAvailability = async () => {
      try {
        const response = await ttsApi.checkStatus();
        setTTSAvailable(response.data.success);
      } catch (error) {
        console.error('Error checking TTS status:', error);
        setTTSAvailable(false);
      }
    };
    
    checkTTSAvailability();
  }, []);
  
  // Get available voices
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const response = await ttsApi.getVoices();
        setAvailableVoices(response.data.data.voices);
        
        // Set a recommended voice for quizzes
        if (response.data.data.recommendedForQuiz.includes('coral')) {
          setTtsVoice('coral');
        }
      } catch (error) {
        console.error('Error loading voices:', error);
      }
    };
    
    if (useOpenAITTS) {
      loadVoices();
    }
  }, [useOpenAITTS]);

  // Add this with your other useEffect hooks in HostModeInterface
useEffect(() => {
    // Debug song groups
    if (crosswordData?.songGroups) {
      console.log("Song Groups Analysis:");
      crosswordData.songGroups.forEach(group => {
        console.log(`Group: ${group.name} (ID: ${group.id})`);
        console.log(`Questions in group: ${group.questions?.length || 0}`);
        
        // Check if any entries mention this song
        const relatedEntries = crosswordData.entries.filter(entry => 
          entry.clue.toLowerCase().includes(group.name.toLowerCase())
        );
        console.log(`Entries mentioning "${group.name}": ${relatedEntries.length}`);
        
        if (relatedEntries.length > 0) {
          console.log("Sample entry:", relatedEntries[0]);
        }
      });
    }
  }, [crosswordData]);

  useEffect(() => {
    if (crosswordData) {
      console.log('Host Mode received crossword data:', crosswordData);
      console.log('Song groups available:', crosswordData.songGroups?.length || 0);
      
      // Check track-to-entry associations
      const entriesWithTrackId = crosswordData.entries.filter(e => e.trackId);
      console.log(`Entries with trackId: ${entriesWithTrackId.length} of ${crosswordData.entries.length}`);
      
      if (crosswordData.songGroups && crosswordData.songGroups.length > 0) {
        // Log associations for each song group
        crosswordData.songGroups.forEach(group => {
          const entriesForGroup = crosswordData.entries.filter(entry => entry.trackId === group.id);
          console.log(`Track "${group.name}" (ID: ${group.id}) has ${entriesForGroup.length} associated entries`);
        });
      }
    }
  }, [crosswordData]);

useEffect(() => {
    if (crosswordData && crosswordData.entries) {
      console.log('Creating song groups from entry trackIds');
      
      const groupsByTrack = {};
      
      crosswordData.entries.forEach(entry => {
        if (!entry.trackId) {
          if (!groupsByTrack['general']) {
            groupsByTrack['general'] = {
              id: 'general',
              name: 'General Knowledge',
              artists: [],
              entries: []
            };
          }
          groupsByTrack['general'].entries.push(entry);
          return;
        }
        
        if (!groupsByTrack[entry.trackId]) {
          groupsByTrack[entry.trackId] = {
            id: entry.trackId,
            name: entry.trackName || 'Unknown Track',
            artists: entry.artists || [],
            entries: [],
            imageUrl: entry.albumImageUrl || null,
            previewUrl: entry.previewUrl
          };
        }
        
        groupsByTrack[entry.trackId].entries.push(entry);
      });
      
      const groups = Object.values(groupsByTrack);
      groups.sort((a, b) => b.entries.length - a.entries.length);
      
      setTrackGroups(groups);
      
      if (!crosswordData.songGroups) {
        crosswordData.songGroups = groups;
      }
      
      if (groups.length > 0 && !selectedGroup) {
        setSelectedGroup(groups[0]);
      }
    }
  }, [crosswordData]);

const getGroupEntries = () => {
  if (!selectedGroup || !crosswordData?.entries) return [];

  if (selectedGroup.entries && selectedGroup.entries.length > 0) {
    return selectedGroup.entries;
  }
  
  console.log("Finding entries for group:", selectedGroup.id);
  const matchingEntries = crosswordData.entries.filter(entry => 
    entry.trackId === selectedGroup.id
  );
  
  console.log(`Found ${matchingEntries.length} entries for track "${selectedGroup.name}" (ID: ${selectedGroup.id})`);
  return matchingEntries;
};

useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
}, [timerRunning]);
  
  // Enhanced speak function with caching
  const speak = async (text) => {
    if (!quizMasterActive || !text) return;
    
    // If already speaking, stop current speech
    if (isSpeaking) {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      setIsSpeaking(false);
    }
    
    try {
      setIsSpeaking(true);
      
      // Use browser's TTS as fallback if useOpenAITTS is false
      if (!useOpenAITTS) {
        if (!speechSynthesisRef.current) return;
        
        if (speechSynthesisRef.current.speaking) {
          speechSynthesisRef.current.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = volume;
        
        const voices = speechSynthesisRef.current.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || voice.name.includes('Female')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => setIsSpeaking(false);
        
        speechSynthesisRef.current.speak(utterance);
        return;
      }
      
      // Check if we've already synthesized this text with these settings
      const cacheKey = `${text}-${ttsVoice}-${ttsModel}-${ttsInstructions}`;
      
      // Play from cache if available
      if (audioCache[cacheKey]) {
        audioElement.src = audioCache[cacheKey];
        audioElement.play().catch(err => {
          console.error('Error playing cached audio:', err);
          setIsSpeaking(false);
        });
        return;
      }
      
      // Generate speech using OpenAI API
      console.log('Generating speech with OpenAI:', text.substring(0, 30) + (text.length > 30 ? '...' : ''));
      
      const options = {
        voice: ttsVoice,
        model: ttsModel,
        responseFormat: 'mp3',
        instructions: ttsInstructions
      };
      
      const response = await ttsApi.generateSpeech(text, options);
      
      // Create audio URL from the blob response
      const audioUrl = URL.createObjectURL(response.data);
      
      // Cache the audio
      setAudioCache(prev => ({
        ...prev,
        [cacheKey]: audioUrl
      }));
      
      // Play the audio
      audioElement.src = audioUrl;
      audioElement.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsSpeaking(false);
      });
      
    } catch (error) {
      console.error('Error with speech synthesis:', error);
      setIsSpeaking(false);
      alert('There was an error with the text-to-speech service. Please try again.');
    }
  };
  
  // Function to stop currently playing speech
  const stopSpeaking = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    
    if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
    
    setIsSpeaking(false);
  };
  
  // Play/pause the selected song
  const togglePlaySong = () => {
    if (!selectedGroup?.previewUrl) {
      // No preview available
      alert('No preview available for this song');
      return;
    }
    
    if (!audioPlayer) {
      // Create new audio player
      const audio = new Audio(selectedGroup.previewUrl);
      audio.onended = () => setIsSongPlaying(false);
      setAudioPlayer(audio);
      audio.play();
      setIsSongPlaying(true);
    } else {
      // Toggle existing player
      if (isSongPlaying) {
        audioPlayer.pause();
      } else {
        // If the selected group changed, update the source
        if (audioPlayer.src !== selectedGroup.previewUrl) {
          audioPlayer.src = selectedGroup.previewUrl;
        }
        audioPlayer.play();
      }
      setIsSongPlaying(!isSongPlaying);
    }
  };
  
  // Handle team score updates
  const updateTeamScore = (teamId, points) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId 
          ? { ...team, score: Math.max(0, team.score + points) } 
          : team
      )
    );
  };
  
  // Timer controls
  const startTimer = (seconds = 30) => {
    setTimeLeft(seconds);
    setTimerRunning(true);
    
    if (quizMasterActive) {
      speak(`You have ${seconds} seconds to answer!`);
    }
  };
  
  const stopTimer = () => {
    setTimerRunning(false);
  };
  
  const resetTimer = () => {
    stopTimer();
    setTimeLeft(30);
  };
  
  // Play timer end sound
  const playTimerEndSound = () => {
    const audio = new Audio('/sounds/timer-end.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => {
      console.error('Error playing timer end sound:', err);
    });
  };
  
  // AI Quiz Master functions
  const toggleQuizMaster = () => {
    setQuizMasterActive(!quizMasterActive);
    
    if (!quizMasterActive) {
      speak("Hello! I'm your Quiz Master for tonight. Let's have some fun with music crosswords!");
    } else {
      stopSpeaking();
    }
  };
  
  // Quiz master intro for a song
  const introduceCurrentSong = () => {
    if (!selectedGroup || !quizMasterActive) return;
    
    const artistNames = selectedGroup.artists.map(a => a.name).join(', ');
    
    let intro = `Let's solve clues about "${selectedGroup.name}" by ${artistNames}. `;
    
    if (selectedGroup.questions && selectedGroup.questions.length === 1) {
      intro += `There is 1 question about this song.`;
    } else if (selectedGroup.questions) {
      intro += `There are ${selectedGroup.questions.length} questions about this song.`;
    }
    
    speak(intro);
  };
  
  
  // Get entry ID from position and direction
  const getEntryId = (entry) => entry.id || `${entry.position.row}-${entry.position.col}-${entry.direction}`;
  
  // TTS Settings component
  const TTSSettings = () => {
    const [showSettings, setShowSettings] = useState(false);
    
    return (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-700">Voice Settings</h4>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-700"
            title={showSettings ? "Hide settings" : "Show settings"}
          >
            <Settings size={18} />
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-600">OpenAI TTS:</label>
          <label className="inline-flex items-center cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={useOpenAITTS} 
                onChange={() => setUseOpenAITTS(!useOpenAITTS)}
              />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-500"></div>
              <div className="absolute left-1 top-[2px] bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-4"></div>
            </div>
          </label>
        </div>
        
        <div className="flex items-center mb-3">
          <label className="text-sm text-gray-600 mr-2">Volume:</label>
          <div className="flex items-center flex-1">
            <button 
              onClick={() => setVolume(prev => Math.max(0, prev - 0.1))}
              className="text-gray-500 hover:text-gray-700"
            >
              <VolumeX size={16} />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 mx-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <button 
              onClick={() => setVolume(prev => Math.min(1, prev + 0.1))}
              className="text-gray-500 hover:text-gray-700"
            >
              <Volume2 size={16} />
            </button>
          </div>
        </div>
        
        {showSettings && useOpenAITTS && (
          <div className="bg-gray-50 p-3 rounded border space-y-2 mb-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Voice:</label>
              <select
                className="w-full p-1.5 text-sm border border-gray-300 rounded"
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
              >
                {availableVoices.length > 0 ? (
                  availableVoices.map(voice => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} - {voice.description}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="alloy">Alloy (Neutral)</option>
                    <option value="ash">Ash (Clear voice)</option>
                    <option value="ballad">Ballad (Calm)</option>
                    <option value="coral">Coral (Warm)</option>
                    <option value="echo">Echo (Deep)</option>
                    <option value="fable">Fable (Storytelling)</option>
                    <option value="nova">Nova (Female)</option>
                    <option value="onyx">Onyx (Authoritative)</option>
                    <option value="sage">Sage (Gentle)</option>
                    <option value="shimmer">Shimmer (Cheerful)</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Speaking Style:</label>
              <select
                className="w-full p-1.5 text-sm border border-gray-300 rounded"
                onChange={(e) => {
                  // Preset speaking styles
                  switch(e.target.value) {
                    case 'quiz-host':
                      setTtsInstructions('Speak in a clear, engaging tone suitable for a quiz host');
                      break;
                    case 'excited':
                      setTtsInstructions('Speak with enthusiasm and excitement, like a game show host');
                      break;
                    case 'dramatic':
                      setTtsInstructions('Speak with dramatic emphasis, pausing for effect');
                      break;
                    case 'friendly':
                      setTtsInstructions('Speak in a friendly, conversational tone');
                      break;
                    case 'custom':
                      // Don't change the instructions for custom
                      break;
                    default:
                      setTtsInstructions('Speak in a clear, engaging tone');
                  }
                }}
              >
                <option value="quiz-host">Quiz Host</option>
                <option value="excited">Excited</option>
                <option value="dramatic">Dramatic</option>
                <option value="friendly">Friendly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Custom Instructions:</label>
              <textarea
                className="w-full p-1.5 text-sm border border-gray-300 rounded h-20"
                value={ttsInstructions}
                onChange={(e) => setTtsInstructions(e.target.value)}
                placeholder="Instructions for how the voice should speak..."
              />
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={() => speak("Hello! I'm your quiz master for tonight's music crossword challenge. Let's have some fun!")}
            className="flex-1 py-1.5 bg-purple-100 text-purple-800 rounded text-sm font-medium hover:bg-purple-200 flex items-center justify-center"
            disabled={isSpeaking}
          >
            {isSpeaking ? "Speaking..." : "Test Voice"}
          </button>
          
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="py-1.5 px-3 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Render UI
  return (
    <div className="bg-gray-50 rounded-lg border shadow-lg overflow-hidden">
      {/* Header with controls */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Mic className={`mr-2 ${quizMasterActive ? 'text-yellow-300' : 'text-white'}`} size={24} />
            <h2 className="text-xl font-bold">
              Music Quiz Host Mode
            </h2>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={toggleQuizMaster}
              className={`px-3 py-1 rounded flex items-center text-sm font-medium ${
                quizMasterActive 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <Mic className="mr-1" size={16} />
              {quizMasterActive ? 'Quiz Master: ON' : 'Quiz Master: OFF'}
            </button>
            
            <button
              onClick={onTogglePlayMode}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center text-sm font-medium"
            >
              Switch to Play Mode
            </button>
            
            <button
              onClick={onExit}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-medium"
            >
              Exit Quiz
            </button>
          </div>
        </div>
        
        {/* Quiz metadata */}
        <div className="mt-2 text-sm text-gray-200">
          {crosswordData?.playlist && (
            <p>
              Playlist: {crosswordData.playlist.name} • 
              {crosswordData.entries.length} Clues • 
              {crosswordData.songGroups?.length || 0} Song Groups
            </p>
          )}
        </div>
      </div>
      
      {/* Main content with tabs */}
      <div className="flex">
        {/* Left sidebar */}
        <div className="w-1/4 bg-gray-100 p-4 border-r min-h-[550px]">
          {/* Tab selector */}
          <div className="flex border-b border-gray-300 mb-4">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'songGroups' 
                  ? 'border-b-2 border-purple-600 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('songGroups')}
            >
              <div className="flex items-center">
                <Music size={16} className="mr-1" />
                Song Groups
              </div>
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'teams' 
                  ? 'border-b-2 border-purple-600 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('teams')}
            >
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                Teams
              </div>
            </button>
          </div>
          
          {/* Tab content */}
          {activeTab === 'songGroups' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-2">
                Select a song to focus on its related clues:
              </p>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {(trackGroups.length > 0 ? trackGroups : (crosswordData?.songGroups || [])).map((group) => {
                  const actualClueCount = group.entries?.length || 
                    crosswordData.entries.filter(entry => entry.trackId === group.id).length;
                  
                  return (
                    <button
                      key={group.id}
                      className={`block w-full text-left p-3 rounded border transition-colors ${
                        selectedGroup?.id === group.id
                          ? 'bg-purple-100 border-purple-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedGroup(group);
                        // Stop current audio if playing
                        if (audioPlayer && isSongPlaying) {
                          audioPlayer.pause();
                          setIsSongPlaying(false);
                        }
                        
                        // Announce the song if AI Quiz Master is active
                        if (quizMasterActive) {
                          setTimeout(() => introduceCurrentSong(), 500);
                        }
                      }}
                    >
                      <div className="flex">
                        {group.imageUrl ? (
                          <img 
                            src={group.imageUrl} 
                            alt={group.name}
                            className="w-12 h-12 object-cover rounded mr-3" 
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center mr-3">
                            <Music size={20} className="text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1">{group.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {group.artists?.map(a => a.name).join(', ') || 'General Knowledge'}
                          </p>
                          <div className="mt-1 flex items-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {actualClueCount} clues
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
            
          {activeTab === 'teams' && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Keep track of team scores:
              </p>
              
              {teams.map((team) => (
                <div key={team.id} className="mb-4 bg-white border rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full ${team.color} mr-2`}></div>
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => {
                          setTeams(prevTeams => 
                            prevTeams.map(t => 
                              t.id === team.id ? { ...t, name: e.target.value } : t
                            )
                          );
                        }}
                        className="font-medium border-none focus:ring-0 p-0 bg-transparent"
                      />
                    </div>
                    <div className="text-xl font-bold">
                      {team.score}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => updateTeamScore(team.id, -1)}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => updateTeamScore(team.id, 1)}
                      className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-sm font-medium"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateTeamScore(team.id, 3)}
                      className="px-2 py-1 bg-green-200 hover:bg-green-300 text-green-800 rounded text-sm font-medium"
                    >
                      +3
                    </button>
                    <button
                      onClick={() => updateTeamScore(team.id, 5)}
                      className="px-2 py-1 bg-green-300 hover:bg-green-400 text-green-800 rounded text-sm font-medium"
                    >
                      +5
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const newId = Math.max(...teams.map(t => t.id)) + 1;
                  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                  const newColor = colors[teams.length % colors.length];
                  
                  setTeams([...teams, {
                    id: newId,
                    name: `Team ${newId}`,
                    score: 0,
                    color: newColor
                  }]);
                }}
                className="w-full py-2 border border-dashed border-gray-400 text-gray-500 rounded hover:bg-gray-50 text-sm"
              >
                + Add Team
              </button>
            </div>
          )}
        </div>
        
        {/* Main content area */}
        <div className="w-1/2 p-4 min-h-[550px] overflow-y-auto">
          {selectedGroup ? (
            <div>
              {/* Song details and controls */}
              <div className="flex mb-6 bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex-shrink-0 mr-4">
                  {selectedGroup.imageUrl ? (
                    <img 
                      src={selectedGroup.imageUrl} 
                      alt={selectedGroup.name}
                      className="w-24 h-24 object-cover rounded-md" 
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center">
                      <Music size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-800">{selectedGroup.name}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedGroup.artists?.map(a => a.name).join(', ') || 'General Knowledge'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedGroup.album?.name && `From: ${selectedGroup.album.name}`}
                  </p>
                  
                  <div className="mt-3 flex space-x-2">
                    {selectedGroup.previewUrl && (
                      <button
                        onClick={togglePlaySong}
                        className={`px-3 py-1 rounded-full flex items-center text-sm font-medium ${
                          isSongPlaying
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {isSongPlaying ? (
                          <>
                            <Pause size={16} className="mr-1" />
                            Pause Preview
                          </>
                        ) : (
                          <>
                            <Play size={16} className="mr-1" />
                            Play Preview
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => introduceCurrentSong()}
                      className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full flex items-center text-sm font-medium"
                      disabled={!quizMasterActive || isSpeaking}
                    >
                      <Mic size={16} className="mr-1" />
                      Introduce
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Questions related to this group */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-800">Related Crossword Clues</h3>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startTimer(30)}
                      className="px-2 py-1 bg-blue-600 text-white rounded-full flex items-center text-xs font-medium hover:bg-blue-700"
                      disabled={timerRunning}
                    >
                      <Clock size={14} className="mr-1" />
                      Start Timer
                    </button>
                    
                    {timerRunning && (
                      <button
                        onClick={stopTimer}
                        className="px-2 py-1 bg-red-600 text-white rounded-full flex items-center text-xs font-medium hover:bg-red-700"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                </div>

                {/* RelatedCluesContent component */}
                <RelatedCluesContent 
                  selectedGroup={selectedGroup}
                  crosswordData={crosswordData}
                  revealedAnswers={revealedAnswers}
                  handleRevealAnswer={handleRevealAnswer}
                  handleHint={handleHint}
                  getGroupEntries={getGroupEntries} // Pass the function as a prop
                />
              </div>

              {/* Timer indicator */}
              {(timerRunning || timeLeft < 30) && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        timeLeft > 10 
                          ? 'bg-green-600' 
                          : timeLeft > 5 
                            ? 'bg-yellow-500'
                            : 'bg-red-600'
                      }`}
                      style={{ width: `${(timeLeft / 30) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Time remaining</span>
                    <span className="font-medium">{timeLeft} seconds</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Music size={48} className="mx-auto mb-2 text-gray-400" />
                <p>Select a song group from the sidebar to view related clues</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right sidebar for AI Quiz Master */}
        <div className="w-1/4 bg-gray-100 p-4 border-l min-h-[550px]">
          <div className="mb-4 pb-4 border-b border-gray-300">
            <h3 className="font-medium mb-3 flex items-center">
              <Mic className="mr-2 text-purple-600" size={18} />
              AI Quiz Master
            </h3>
            
            <div className={`p-3 rounded-lg mb-3 ${quizMasterActive ? 'bg-purple-100' : 'bg-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Quiz Master Assistant</span>
                <div className={`w-3 h-3 rounded-full ${quizMasterActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              <p className="text-xs text-gray-600">
                {quizMasterActive 
                  ? 'I will guide the quiz with voice announcements and hints!' 
                  : 'Turn me on to add voice announcements to your quiz!'}
              </p>
            </div>
            
            <button
              onClick={toggleQuizMaster}
              className={`w-full py-2 px-3 rounded flex items-center justify-center text-sm font-medium ${
                quizMasterActive 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {quizMasterActive ? 'Turn Off Quiz Master' : 'Turn On Quiz Master'}
            </button>
          </div>
          
          {quizMasterActive && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Quick Announcements</h4>
              
              <div className="grid gap-2">
                <button
                  onClick={() => speak("Welcome to our music quiz! Today we'll be testing your music knowledge with questions based on this playlist.")}
                  className="w-full py-2 px-3 bg-indigo-100 text-indigo-700 rounded-md text-sm hover:bg-indigo-200 text-left"
                  disabled={isSpeaking}
                >
                  Welcome
                </button>
                
                <button
                  onClick={() => speak("It's time for our next question! Listen carefully...")}
                  className="w-full py-2 px-3 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 text-left"
                  disabled={isSpeaking}
                >
                  Next Question
                </button>
                
                <button
                  onClick={() => speak("Great job! That's the correct answer!")}
                  className="w-full py-2 px-3 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 text-left"
                  disabled={isSpeaking}
                >
                  Correct Answer
                </button>
                
                <button
                  onClick={() => speak("Sorry, that's not right. Let's see if another team knows!")}
                  className="w-full py-2 px-3 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 text-left"
                  disabled={isSpeaking}
                >
                  Wrong Answer
                </button>
                
                <button
                  onClick={() => speak("Let's check the scoreboard! Which team is in the lead?")}
                  className="w-full py-2 px-3 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200 text-left"
                  disabled={isSpeaking}
                >
                  Check Scores
                </button>
                
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="w-full py-2 px-3 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                  >
                    Stop Speaking
                  </button>
                )}
              </div>
              
              <div className="pt-3 mt-3 border-t border-gray-300">
                <h4 className="font-medium text-sm mb-2">Custom Announcement</h4>
                <textarea
                  placeholder="Type a custom announcement for Quiz Master to say..."
                  className="w-full p-2 border border-gray-300 rounded text-sm h-20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      speak(e.target.value);
                      // Don't clear the text to allow for quick adjustments/resends
                    }
                  }}
                ></textarea>
                <button
                  onClick={(e) => {
                    const textarea = e.target.previousSibling;
                    if (textarea.value) {
                      speak(textarea.value);
                    }
                  }}
                  className="w-full mt-2 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                  disabled={isSpeaking}
                >
                  Say It (or press Ctrl+Enter)
                </button>
              </div>
              
              {/* TTS Settings */}
              <TTSSettings />
            </div>
          )}
          
          {!quizMasterActive && (
            <div className="text-center py-8">
              <Mic size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">
                Turn on Quiz Master to enable voice announcements and guided gameplay
              </p>
              <button
                onClick={toggleQuizMaster}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Enable Quiz Master
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component wrapper with error boundary
const WrappedHostMode = (props) => (
  <ErrorBoundary>
    <HostModeInterface {...props} />
  </ErrorBoundary>
);

export default WrappedHostMode;