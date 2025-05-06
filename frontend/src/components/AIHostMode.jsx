import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Volume2, Award, VolumeX, ChevronRight, Mic } from 'lucide-react';
import { ttsApi } from '../services/api';
import ErrorBoundary from './ErrorBoundary';

/**
 * AI Host Mode - presents an existing crossword as an automated quiz
 * 
 * Place this file in: frontend/src/components/AIHostMode.jsx
 */
const AIHostMode = ({ 
  crosswordData, 
  onExit,
  onSwitchToManual 
}) => {
  // Core quiz state
  const [quizState, setQuizState] = useState('setup'); // 'setup', 'playing', 'paused', 'completed'
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [teams, setTeams] = useState([
    { id: 1, name: 'Team 1', score: 0, color: 'bg-red-500' },
    { id: 2, name: 'Team 2', score: 0, color: 'bg-blue-500' }
  ]);
  
  // Audio & TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [songAudioElement, setSongAudioElement] = useState(null);
  const [isSongPlaying, setIsSongPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [ttsVoice, setTtsVoice] = useState('nova');
  
  // Refs for timers
  const timerRef = useRef(null);
  const quizFlowTimeoutRef = useRef(null);
  const songGroups = crosswordData?.songGroups || [];
  
  // Debug logging
  useEffect(() => {
    console.log('AIHostMode mounted with crossword data:', crosswordData);
    console.log('Song groups:', songGroups);
  }, []);
  
  // Initialize audio on mount
  useEffect(() => {
    const audio = new Audio();
    audio.onended = () => {
      setIsSpeaking(false);
      // Call any registered onComplete callback stored in the audio element
      if (audio.onCompleteCallback) {
        audio.onCompleteCallback();
        audio.onCompleteCallback = null;
      }
    };
    audio.volume = volume;
    setAudioElement(audio);
    
    const songAudio = new Audio();
    songAudio.onended = () => {
      setIsSongPlaying(false);
      // Call any registered onComplete callback stored in the audio element
      if (songAudio.onCompleteCallback) {
        songAudio.onCompleteCallback();
        songAudio.onCompleteCallback = null;
      }
    };
    songAudio.volume = volume;
    setSongAudioElement(songAudio);
    
    return () => {
      // Clean up audio elements
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      
      if (songAudio) {
        songAudio.pause();
        songAudio.src = '';
      }
      
      // Clear all timeouts on unmount
      if (timerRef.current) clearInterval(timerRef.current);
      if (quizFlowTimeoutRef.current) clearTimeout(quizFlowTimeoutRef.current);
    };
  }, []);
  
  // Update volume when it changes
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume;
    }
    if (songAudioElement) {
      songAudioElement.volume = volume;
    }
  }, [volume, audioElement, songAudioElement]);

  useEffect(() => {
    if (crosswordData?.entries && crosswordData?.songGroups?.length > 0) {
      const entriesWithoutTrackId = crosswordData.entries.filter(e => !e.trackId);
  
      if (entriesWithoutTrackId.length > 0) {
        console.log(`Found ${entriesWithoutTrackId.length} entries without trackId - fixing`);
        const updatedCrosswordData = {
          ...crosswordData,
          entries: [...crosswordData.entries]
        };
  
        entriesWithoutTrackId.forEach((entry, index) => {
          const groupIndex = index % crosswordData.songGroups.length;
          const targetGroup = crosswordData.songGroups[groupIndex];
  
          const entryIndex = updatedCrosswordData.entries.findIndex(e =>
            e.clue === entry.clue && e.answer === entry.answer
          );
  
          if (entryIndex !== -1) {
            updatedCrosswordData.entries[entryIndex] = {
              ...updatedCrosswordData.entries[entryIndex],
              trackId: targetGroup.id
            };
          }
        });
  
        setCrosswordData(updatedCrosswordData);
      }
    }
  }, [crosswordData]);

  useEffect(() => {
    console.log('AIHostMode mounted with crossword data:', crosswordData); // Debug log
    console.log('Song groups:', crosswordData.songGroups); // Verify song groups
    if (!crosswordData.songGroups || crosswordData.songGroups.length === 0) {
      console.error('No song groups found in crossword data'); // Log error
    }
  }, [crosswordData]);
  
  // Text to speech function 
  const speak = async (text, onComplete) => {
    if (!text) return;
    
    try {
      setIsSpeaking(true);
      
      // Stop current audio if playing
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      
      // Store the completion callback for later
      if (audioElement) {
        audioElement.onCompleteCallback = onComplete;
      }
      
      // Generate speech using OpenAI API
      const options = {
        voice: ttsVoice,
        model: 'gpt-4o-mini-tts',
        responseFormat: 'mp3',
        instructions: 'Speak in a clear, engaging tone suitable for a quiz host'
      };
      
      console.log('Generating speech for:', text.substring(0, 30) + '...');
      const response = await ttsApi.generateSpeech(text, options);
      
      // Create audio URL from the blob response
      const audioUrl = URL.createObjectURL(response.data);
      
      // Play the audio
      audioElement.src = audioUrl;
      try {
        await audioElement.play();
      } catch (playError) {
        console.error('Error playing audio:', playError);
        setIsSpeaking(false);
        if (onComplete) onComplete(); // Continue flow despite error
      }
      
    } catch (error) {
      console.error('Error with speech synthesis:', error);
      setIsSpeaking(false);
      if (onComplete) onComplete(); // Continue the flow even if speech fails
    }
  };
  
  // Play song preview
  const playSongPreview = (previewUrl, onComplete) => {
    if (!previewUrl || !songAudioElement) {
      if (onComplete) onComplete();
      return;
    }
    
    try {
      setIsSongPlaying(true);
      
      // Store callback for when song ends
      songAudioElement.onCompleteCallback = onComplete;
      
      // Set source and play
      songAudioElement.src = previewUrl;
      songAudioElement.play().catch(err => {
        console.error('Error playing song preview:', err);
        setIsSongPlaying(false);
        if (onComplete) onComplete();
      });
      
    } catch (error) {
      console.error('Error playing song preview:', error);
      setIsSongPlaying(false);
      if (onComplete) onComplete();
    }
  };
  
  // Stop song preview
  const stopSongPreview = () => {
    if (songAudioElement) {
      songAudioElement.pause();
      setIsSongPlaying(false);
    }
  };
  
  // Stop all audio
  const stopAllAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      setIsSpeaking(false);
    }
    
    if (songAudioElement) {
      songAudioElement.pause();
      songAudioElement.src = '';
      setIsSongPlaying(false);
    }
  };
  
  // Start the quiz flow
  const startQuiz = () => {
    setQuizState('playing');
    setCurrentSongIndex(0);
    setCurrentQuestionIndex(0);
    setIsRevealed(false);
    
    // Begin with welcome message
    welcomeIntroduction();
  };
  
  // Welcome and introduction
  const welcomeIntroduction = () => {
    const welcomeText = `Welcome to the Music Crossword Quiz! We'll be exploring ${songGroups.length} different songs and testing your knowledge with crossword clues. I'll be your automated quiz host for today. Let's get started!`;
    
    speak(welcomeText, () => {
      // Move to the first song after introduction
      quizFlowTimeoutRef.current = setTimeout(() => {
        startSongGroup(0);
      }, 1000);
    });
  };
  
  // Start presenting a song group
  const startSongGroup = (index) => {
    if (index >= songGroups.length) {
      // End of quiz
      endQuiz();
      return;
    }
    
    setCurrentSongIndex(index);
    setCurrentQuestionIndex(0);
    setIsRevealed(false);
    
    const songGroup = songGroups[index];
    
    // Introduce the song
    const songIntro = getSongIntroduction(songGroup);
    speak(songIntro, () => {
      // Play song preview if available
      if (songGroup.previewUrl) {
        // Play for 10 seconds then move to questions
        playSongPreview(songGroup.previewUrl, () => {
          // This will be called when the song ends or after timeout
          startQuestions(index);
        });
        
        // Set timeout to cut song preview short after 10 seconds
        quizFlowTimeoutRef.current = setTimeout(() => {
          stopSongPreview();
          startQuestions(index);
        }, 10000);
      } else {
        // No preview, go straight to questions
        startQuestions(index);
      }
    });
  };
  
  // Get song introduction text
  const getSongIntroduction = (songGroup) => {
    if (!songGroup) return "Let's continue with our music quiz!";
    
    const artistNames = songGroup.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
    
    if (songGroup.id === 'general') {
      return `Now let's test your general music knowledge with some crossword clues!`;
    }
    
    return `Now let's listen to "${songGroup.name}" by ${artistNames}. Here's a short preview before we tackle some crossword clues related to this song.`;
  };
  
  // Start presenting questions for current song
  const startQuestions = (songIndex) => {
    const songGroup = songGroups[songIndex];
    const entries = getEntriesForSongGroup(songGroup);
    
    if (!entries || entries.length === 0) {
      // No questions for this song, move to next song
      quizFlowTimeoutRef.current = setTimeout(() => {
        startSongGroup(songIndex + 1);
      }, 1000);
      return;
    }
    
    // Start with first question
    presentQuestion(songIndex, 0);
  };
  
  // Present a specific question
  const presentQuestion = (songIndex, questionIndex) => {
    const songGroup = songGroups[songIndex];
    const entries = getEntriesForSongGroup(songGroup);
    
    if (!entries || questionIndex >= entries.length) {
      // No more questions for this song, move to next song
      quizFlowTimeoutRef.current = setTimeout(() => {
        const transitionText = "That's all for this song! Let's move on to the next one.";
        speak(transitionText, () => {
          startSongGroup(songIndex + 1);
        });
      }, 1000);
      return;
    }
    
    setCurrentQuestionIndex(questionIndex);
    setIsRevealed(false);
    
    const entry = entries[questionIndex];
    const questionText = `Question ${questionIndex + 1} of ${entries.length}: ${entry.clue}. This is a ${entry.answer.length} letter word.`;
    
    speak(questionText, () => {
      // Start timer after question is read
      startTimer(30, () => {
        // Timer completed, reveal answer
        revealAnswer(songIndex, questionIndex);
      });
    });
  };
  
  // Start a timer
  const startTimer = (seconds, onComplete) => {
    setTimeRemaining(seconds);
    
    // Clear existing timer if any
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Create new timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up
          clearInterval(timerRef.current);
          
          // Play time's up sound
          const timeUpAudio = new Audio('/sounds/timer-end.mp3');
          timeUpAudio.volume = volume;
          timeUpAudio.play().catch(err => console.error('Error playing timer sound:', err));
          
          if (onComplete) onComplete();
          return 0;
        }
        
        // Announce time remaining at certain intervals
        if (prev === 10) {
          speak("10 seconds remaining!");
        } else if (prev === 5) {
          speak("5 seconds left!");
        }
        
        return prev - 1;
      });
    }, 1000);
  };
  
  // Reveal the answer to a question
  const revealAnswer = (songIndex, questionIndex) => {
    const songGroup = songGroups[songIndex];
    const entries = getEntriesForSongGroup(songGroup);
    
    if (!entries || !entries[questionIndex]) {
      // Skip to next song if entry is missing
      startSongGroup(songIndex + 1);
      return;
    }
    
    const entry = entries[questionIndex];
    
    setIsRevealed(true);
    
    // Generate answer reveal text
    let answerText = `Time's up! The answer is ${entry.answer}.`;
    
    speak(answerText, () => {
      // Move to next question after a short delay
      quizFlowTimeoutRef.current = setTimeout(() => {
        presentQuestion(songIndex, questionIndex + 1);
      }, 2000);
    });
  };
  
  // End the quiz
  const endQuiz = () => {
    setQuizState('completed');
    
    // Sort teams by score
    const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
    const winner = sortedTeams[0];
    
    let endText = `That's the end of our music crossword quiz! `;
    
    if (teams.length > 1) {
      if (sortedTeams[0].score > sortedTeams[1].score) {
        endText += `${winner.name} wins with ${winner.score} points! Congratulations! `;
      } else if (sortedTeams[0].score === sortedTeams[1].score) {
        endText += `We have a tie! ${sortedTeams[0].name} and ${sortedTeams[1].name} both scored ${sortedTeams[0].score} points! `;
      }
    }
    
    endText += `Thanks for playing!`;
    
    speak(endText);
  };
  
  // Pause or resume the quiz
  const togglePauseQuiz = () => {
    if (quizState === 'playing') {
      // Pause the quiz
      setQuizState('paused');
      
      // Pause any audio
      stopAllAudio();
      
      // Pause any timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Pause any scheduled events
      if (quizFlowTimeoutRef.current) {
        clearTimeout(quizFlowTimeoutRef.current);
      }
      
      speak("Quiz paused! Take a break and resume when you're ready.");
    } else if (quizState === 'paused') {
      // Resume the quiz
      setQuizState('playing');
      speak("Quiz resumed! Let's continue.", () => {
        // Resume the quiz flow where we left off
        // This is a simplified resume - a full implementation would need more state tracking
        if (timeRemaining > 0) {
          // Resume timer if it was active
          startTimer(timeRemaining, () => {
            revealAnswer(currentSongIndex, currentQuestionIndex);
          });
        } else {
          // Otherwise just continue from current question
          presentQuestion(currentSongIndex, currentQuestionIndex);
        }
      });
    }
  };
  
  // Skip to the next question or song
  const skipForward = () => {
    // Clear any timers or timeouts
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (quizFlowTimeoutRef.current) {
      clearTimeout(quizFlowTimeoutRef.current);
    }
    
    // Stop any audio
    stopAllAudio();
    
    // If not revealed yet, reveal the current answer
    if (!isRevealed && quizState === 'playing') {
      revealAnswer(currentSongIndex, currentQuestionIndex);
    } else {
      // Move to the next question or song
      const songGroup = songGroups[currentSongIndex];
      const entries = getEntriesForSongGroup(songGroup);
      
      if (entries && currentQuestionIndex < entries.length - 1) {
        // Move to next question
        presentQuestion(currentSongIndex, currentQuestionIndex + 1);
      } else {
        // Move to next song
        startSongGroup(currentSongIndex + 1);
      }
    }
  };
  
  // Update team score
  const updateTeamScore = (teamId, points) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId 
          ? { ...team, score: Math.max(0, team.score + points) } 
          : team
      )
    );
    
    // Don't announce score update if currently speaking
    if (isSpeaking) return;
    
    // Announce score update
    const team = teams.find(t => t.id === teamId);
    if (team) {
      const newScore = team.score + points;
      const pointsText = points > 0 ? `gained ${points}` : `lost ${Math.abs(points)}`;
      speak(`${team.name} ${pointsText} points! Their score is now ${newScore}.`);
    }
  };
  
  // Helper function to get entries for a song group
  const getEntriesForSongGroup = (songGroup) => {
    if (!songGroup || !crosswordData?.entries) return [];
    console.log(`Getting entries for song: ${songGroup.name} (ID: ${songGroup.id})`);
  
    const entries = crosswordData.entries.filter(entry => entry.trackId === songGroup.id);
    console.log(`Found ${entries.length} entries for song ${songGroup.name}`);
  
    return entries;
  };

  // Get current song group
  const getCurrentSongGroup = () => {
    return songGroups[currentSongIndex] || null;
  };
  
  // Get current entry
  const getCurrentEntry = () => {
    const songGroup = getCurrentSongGroup();
    if (!songGroup) return null;
    
    const entries = getEntriesForSongGroup(songGroup);
    return entries[currentQuestionIndex] || null;
  };
  
  // Render Setup Screen
  const renderSetupScreen = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
          <Mic className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">AI Quiz Master</h2>
        <p className="text-gray-600">
          Let me host the music crossword quiz for you!
        </p>
      </div>
      
      <div className="mb-8 bg-purple-50 rounded-lg p-4">
        <h3 className="font-bold text-purple-800 mb-3">How It Works:</h3>
        <ul className="space-y-2 text-purple-700">
          <li className="flex items-start">
            <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0 text-purple-500" />
            <span>I'll introduce each song and play a preview</span>
          </li>
          <li className="flex items-start">
            <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0 text-purple-500" />
            <span>I'll read crossword clues with a 30-second timer</span>
          </li>
          <li className="flex items-start">
            <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0 text-purple-500" />
            <span>After the timer, I'll reveal the answer</span>
          </li>
          <li className="flex items-start">
            <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0 text-purple-500" />
            <span>You can award points to teams during the quiz</span>
          </li>
          <li className="flex items-start">
            <ChevronRight className="h-5 w-5 mr-1 flex-shrink-0 text-purple-500" />
            <span>Use pause or skip controls if needed</span>
          </li>
        </ul>
      </div>
      
      <div className="mb-8">
        <h3 className="font-bold mb-3">Teams</h3>
        <div className="space-y-2 mb-3">
          {teams.map(team => (
            <div key={team.id} className="flex items-center bg-gray-50 p-3 rounded-lg border">
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
                className="border rounded px-3 py-1.5 flex-1"
                placeholder="Team name"
              />
            </div>
          ))}
        </div>
        
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
          className="w-full py-2 border border-dashed border-gray-400 text-gray-500 rounded hover:bg-gray-50 text-sm flex items-center justify-center"
        >
          <span className="mr-1">+</span> Add Team
        </button>
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={onSwitchToManual}
          className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800"
        >
          Manual Mode
        </button>
        
        <button
          onClick={startQuiz}
          className="flex-1 py-3 px-4 bg-purple-600 text-white hover:bg-purple-700 rounded-lg flex items-center justify-center"
        >
          <Play className="mr-2" size={20} />
          Start AI Quiz
        </button>
      </div>
    </div>
  );
  
  // Render Playing Screen
  const renderPlayingScreen = () => {
    const songGroup = getCurrentSongGroup();
    const currentEntry = getCurrentEntry();
    
    return (
      <div className="bg-gradient-to-b from-purple-100 to-indigo-50 rounded-lg shadow-md overflow-hidden">
        {/* Header with controls */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Mic className="mr-2" size={20} />
              <h2 className="text-xl font-bold">AI Quiz Master</h2>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePauseQuiz}
                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center"
                title={quizState === 'playing' ? 'Pause Quiz' : 'Resume Quiz'}
              >
                {quizState === 'playing' ? (
                  <Pause size={20} />
                ) : (
                  <Play size={20} />
                )}
              </button>
              
              <button
                onClick={skipForward}
                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center"
                disabled={quizState !== 'playing'}
                title="Skip Forward"
              >
                <SkipForward size={20} />
              </button>
              
              <div className="relative group">
                <button
                  onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                  className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center"
                  title={volume === 0 ? 'Unmute' : 'Mute'}
                >
                  {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                
                <div className="absolute top-12 right-0 bg-white rounded-md shadow-lg p-3 w-40 z-10 hidden group-hover:block">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-3 grid grid-cols-12 gap-1">
            {Array.from({ length: songGroups.length }).map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full ${
                  index < currentSongIndex 
                    ? 'bg-green-400' 
                    : index === currentSongIndex 
                      ? 'bg-white' 
                      : 'bg-white bg-opacity-20'
                }`}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Current song & question */}
        <div className="p-6">
          {/* Song info */}
          {songGroup && (
            <div className="flex mb-6 bg-white rounded-lg p-4 shadow-sm">
              <div className="flex-shrink-0 mr-4">
                {songGroup.imageUrl ? (
                  <img 
                    src={songGroup.imageUrl} 
                    alt={songGroup.name}
                    className="w-20 h-20 object-cover rounded-md" 
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                    <Award size={24} className="text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{songGroup.name}</h3>
                <p className="text-sm text-gray-600">
                  {songGroup.artists?.map(a => a.name).join(', ') || 'General Knowledge'}
                </p>
                
                <div className="mt-2 flex items-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Song {currentSongIndex + 1} of {songGroups.length}
                  </span>
                  
                  {isSongPlaying && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Play size={12} className="mr-1" /> 
                      Now Playing
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Current question */}
          {currentEntry && (
            <div className="bg-white p-5 rounded-lg shadow mb-6">
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold text-gray-700 mb-2">Current Clue:</h4>
                
                {timeRemaining > 0 && (
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    timeRemaining > 10
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {timeRemaining}s
                  </span>
                )}
              </div>
              
              <div className="border-l-4 border-purple-400 pl-3 py-1 mb-4">
                <p className="text-xl">{currentEntry.clue}</p>
              </div>
              
              <div className="flex items-center mt-4">
                <p className="font-mono tracking-widest text-xl">
                  {isRevealed 
                    ? currentEntry.answer.split('').join(' ')
                    : Array(currentEntry.answer.length).fill('_').join(' ')}
                </p>
                <span className="ml-2 text-sm text-gray-500">
                  ({currentEntry.answer.length} letters)
                </span>
              </div>
            </div>
          )}
          
          {/* Timer bar */}
          {timeRemaining > 0 && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    timeRemaining > 10 
                      ? 'bg-green-600' 
                      : timeRemaining > 5 
                        ? 'bg-yellow-500'
                        : 'bg-red-600'
                  }`}
                  style={{ width: `${(timeRemaining / 30) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Team scores */}
          <h4 className="font-bold mb-3 flex items-center">
            <Award className="mr-2 text-purple-600" size={18} />
            Team Scores
          </h4>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg p-3 shadow">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${team.color} mr-2`}></div>
                    <span className="font-medium">{team.name}</span>
                  </div>
                  <span className="text-xl font-bold">{team.score}</span>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => updateTeamScore(team.id, -1)}
                    className="flex-1 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => updateTeamScore(team.id, 1)}
                    className="flex-1 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs font-medium"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => updateTeamScore(team.id, 3)}
                    className="flex-1 py-1 bg-green-200 hover:bg-green-300 text-green-800 rounded text-xs font-medium"
                  >
                    +3
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="fixed bottom-4 right-4 bg-purple-700 text-white px-4 py-2 rounded-full flex items-center shadow-lg">
            <div className="mr-2 flex space-x-1">
              <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
              <div className="w-1 h-5 bg-white rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
              <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '600ms'}}></div>
              <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{animationDelay: '900ms'}}></div>
            </div>
            <span>AI Speaking...</span>
          </div>
        )}
      </div>
    );
  };
  
  // Render Completed Screen
  const renderCompletedScreen = () => {
    const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-6">Quiz Completed!</h2>
        
        <div className="mb-8">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award size={48} className="text-yellow-500" />
          </div>
          
          <p className="text-lg">Thanks for playing the Music Crossword Quiz!</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold mb-4">Final Scores</h3>
          
          <div className="space-y-3">
            {sortedTeams.map((team, index) => (
              <div 
                key={team.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-white border'
                }`}
              >
                <div className="flex items-center">
                  {index === 0 && (
                    <div className="mr-2 text-yellow-500">🏆</div>
                  )}
                  <div className={`w-3 h-3 rounded-full ${team.color} mr-2`}></div>
                  <span className="font-medium">{team.name}</span>
                </div>
                <span className="text-xl font-bold">{team.score}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              setQuizState('setup');
              setTeams(teams.map(team => ({ ...team, score: 0 })));
            }}
            className="px-6 py-3 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg"
          >
            Start New Quiz
          </button>
          
          <button
            onClick={onExit}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Exit
          </button>
        </div>
      </div>
    );
  };
  
  // Main render
  return (
    <div className="max-w-3xl mx-auto">
      {quizState === 'setup' && renderSetupScreen()}
      {(quizState === 'playing' || quizState === 'paused') && renderPlayingScreen()}
      {quizState === 'completed' && renderCompletedScreen()}
    </div>
  );
};

// Component wrapper with error boundary
const WrappedAIHostMode = (props) => (
  <ErrorBoundary>
    <AIHostMode {...props} />
  </ErrorBoundary>
);

export default WrappedAIHostMode;