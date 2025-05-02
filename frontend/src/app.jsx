import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { Music, RefreshCw, Check, Play, Edit } from 'lucide-react';
import { spotifyApi, questionApi, crosswordApi } from './services/api';
import { CrosswordEditor, CrosswordEditorLoading } from './components/CrosswordEditor';
import PlayQuiz from './components/PlayQuiz';
import DebugCrosswordData from './components/DebugCrosswordData';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary-600 text-white p-4 shadow-md">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">Music Crossword Generator</h1>
            <p className="text-sm">Create crossword puzzles from your Spotify playlists</p>
          </div>
        </header>
        
        <main className="container mx-auto p-4">
          <MusicCrossword />
        </main>
        
        <footer className="bg-gray-100 p-4 border-t">
          <div className="container mx-auto text-center text-gray-500 text-sm">
            <p>Music Crossword Generator &copy; {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

function MusicCrossword() {
  const [step, setStep] = useState(1);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistData, setPlaylistData] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [crosswordData, setCrosswordData] = useState(null);
  const [playMode, setPlayMode] = useState(false);
  
  // Add debug mode state
  const [debugMode, setDebugMode] = useState(false);
  
  // Mutation for fetching playlist data
  const playlistMutation = useMutation({
    mutationFn: (url) => spotifyApi.getPlaylistData(url),
    onSuccess: (response) => {
      setPlaylistData(response.data.data);
      setStep(2);
    }
  });
  
  // Mutation for generating questions
  const questionsMutation = useMutation({
    mutationFn: (tracks) => questionApi.generateQuestions(tracks),
    onSuccess: (response) => {
      setGeneratedQuestions(response.data.data.questions);
      setStep(3);
    }
  });
  
  // Mutation for building crossword
  const crosswordMutation = useMutation({
    mutationFn: (questions) => crosswordApi.buildCrossword(questions),
    onSuccess: (response) => {
      console.log('Crossword data received:', response.data.data);
      setCrosswordData(response.data.data);
      setStep(4);
    },
    onError: (error) => {
      console.error('Error building crossword:', error);
      // Keep the user on the questions page to select different questions
      alert('Could not build a crossword with these questions. Try selecting different questions.');
    }
  });
  
  const handlePlaylistSubmit = (e) => {
    e.preventDefault();
    if (!playlistUrl) return;
    playlistMutation.mutate(playlistUrl);
  };
  
  const handleGenerateQuestions = () => {
    if (!playlistData?.tracks) return;
    questionsMutation.mutate(playlistData.tracks);
  };
  
  const toggleQuestionSelection = (question) => {
    setSelectedQuestions(prev => {
      const isSelected = prev.some(q => q.answer === question.answer);
      
      if (isSelected) {
        return prev.filter(q => q.answer !== question.answer);
      } else {
        return [...prev, question];
      }
    });
  };
  
  const handleBuildCrossword = () => {
    if (selectedQuestions.length < 5) return;
    setCrosswordData(null); // Reset previous data
    crosswordMutation.mutate(selectedQuestions);
  };
  
  const handleBackToQuestions = () => {
    setStep(3);
    setPlayMode(false);
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };
  
  const togglePlayMode = () => {
    setPlayMode(!playMode);
  };
  
  // Sanitize questions for compatible answers
  const validateQuestion = (question) => {
    if (!question.answer) return false;
    const answer = question.answer.toUpperCase().replace(/[^A-Z]/g, '');
    return answer.length >= 3 && /^[A-Z]+$/.test(answer);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Developer Tools (hide in production) */}
      <div className="mb-4 text-right">
        <button
          onClick={toggleDebugMode}
          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          {debugMode ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>
      
      {/* Debug Data (Only shown in debug mode) */}
      {debugMode && step === 4 && (
        <DebugCrosswordData crosswordData={crosswordData} />
      )}
      
      {/* Progress Steps (Only show if not in play mode) */}
      {!playMode && (
        <div className="flex justify-between mb-8">
          {[
            { num: 1, text: 'Select Playlist' },
            { num: 2, text: 'Generate Questions' },
            { num: 3, text: 'Select Questions' },
            { num: 4, text: 'Build Crossword' }
          ].map(s => (
            <div 
              key={s.num} 
              className={`flex flex-col items-center w-1/4 ${step >= s.num ? 'text-primary-600' : 'text-gray-400'}`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                step > s.num ? 'bg-primary-600 text-white' : 
                step === s.num ? 'border-2 border-primary-600' : 
                'border-2 border-gray-300'
              }`}>
                {step > s.num ? <Check size={20} /> : s.num}
              </div>
              <span className="text-sm text-center">{s.text}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Step 1: Enter Spotify playlist */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Enter a Spotify Playlist URL</h2>
          
          <form onSubmit={handlePlaylistSubmit} className="space-y-4">
            <div>
              <label htmlFor="playlist-url" className="label">
                Spotify Playlist URL
              </label>
              <div className="flex">
                <input
                  id="playlist-url"
                  type="text"
                  className="input flex-1"
                  placeholder="https://open.spotify.com/playlist/..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  required
                />
                <button 
                  type="submit" 
                  className="btn btn-primary ml-2 flex items-center"
                  disabled={playlistMutation.isPending}
                >
                  {playlistMutation.isPending ? (
                    <RefreshCw className="animate-spin mr-2" size={18} />
                  ) : (
                    <Music className="mr-2" size={18} />
                  )}
                  Load Playlist
                </button>
              </div>
              {playlistMutation.isError && (
                <p className="text-red-500 mt-2">
                  {playlistMutation.error.response?.data?.error || 'Failed to load playlist'}
                </p>
              )}
            </div>
          </form>
          
          <div className="mt-6 text-gray-500 text-sm">
            <p className="mb-2">Example playlist URLs:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M</li>
              <li>spotify:playlist:37i9dQZF1DXcBWIGoYBM5M</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Step 2: Playlist loaded, generate questions */}
      {step === 2 && playlistData && (
        <div>
          <div className="flex items-start mb-6">
            {playlistData.images?.[0]?.url && (
              <img 
                src={playlistData.images[0].url} 
                alt={playlistData.name} 
                className="w-32 h-32 object-cover rounded-md mr-4"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold">{playlistData.name}</h2>
              <p className="text-gray-600">{playlistData.description}</p>
              <p className="mt-2">
                <span className="font-medium">{playlistData.tracksCount}</span> tracks
              </p>
              <p className="text-sm text-gray-500">
                By {playlistData.owner.displayName || playlistData.owner.id}
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Generate Questions</h3>
            <p className="text-gray-600 mb-4">
              We'll use AI to generate crossword questions based on this playlist.
              This might take a minute or two depending on the playlist size.
            </p>
            
            <button
              onClick={handleGenerateQuestions}
              className="btn btn-primary w-full"
              disabled={questionsMutation.isPending}
            >
              {questionsMutation.isPending ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={18} />
                  Generating Questions...
                </>
              ) : (
                'Generate Questions'
              )}
            </button>
            
            {questionsMutation.isError && (
              <p className="text-red-500 mt-2">
                {questionsMutation.error.response?.data?.error || 'Failed to generate questions'}
              </p>
            )}
            
            <button 
              onClick={() => setStep(1)} 
              className="mt-4 text-primary-600 hover:underline"
              disabled={questionsMutation.isPending}
            >
              ← Back to playlist selection
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Select questions for crossword */}
      {step === 3 && generatedQuestions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Questions for Your Crossword</h2>
          
          <p className="text-gray-600 mb-4">
            Select at least 5 questions to include in your crossword puzzle.
          </p>
          
          {/* Info box about answer requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h3 className="font-medium text-blue-800">Answer Requirements</h3>
            <p className="text-sm text-blue-700">
              For best results, select answers that:
            </p>
            <ul className="list-disc pl-5 text-sm text-blue-700 mt-1">
              <li>Contain only letters (A-Z)</li>
              <li>Are at least 3 characters long</li>
              <li>Have no spaces or special characters</li>
            </ul>
          </div>
          
          <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
            {generatedQuestions.map((question, index) => {
              const isValid = validateQuestion(question);
              
              return (
                <div 
                  key={index}
                  className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                    !isValid ? 'opacity-50 bg-gray-50' : 
                    selectedQuestions.some(q => q.answer === question.answer) ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => isValid && toggleQuestionSelection(question)}
                >
                  <div>
                    <p className="font-medium">{question.question}</p>
                    <p className="text-sm text-gray-500">
                      Answer: {question.answer}
                      {!isValid && (
                        <span className="text-red-500 ml-2">
                          (Not usable in crossword)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                    selectedQuestions.some(q => q.answer === question.answer) 
                      ? 'bg-primary-600 border-primary-600 text-white' 
                      : 'border-gray-300'
                  }`}>
                    {selectedQuestions.some(q => q.answer === question.answer) && (
                      <Check size={16} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {selectedQuestions.length} of {generatedQuestions.length} selected
              {selectedQuestions.length < 5 && (
                <span className="text-red-500 ml-2">(minimum 5 required)</span>
              )}
            </p>
            
            <div className="space-x-2">
              <button 
                onClick={() => setStep(2)} 
                className="btn btn-outline"
              >
                Back
              </button>
              
              <button
                onClick={handleBuildCrossword}
                className="btn btn-primary"
                disabled={selectedQuestions.length < 5 || crosswordMutation.isPending}
              >
                {crosswordMutation.isPending ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={18} />
                    Building...
                  </>
                ) : (
                  'Build Crossword'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 4: Crossword Editor/Player */}
      {step === 4 && (
        crosswordMutation.isPending ? (
          <CrosswordEditorLoading onBack={handleBackToQuestions} />
        ) : crosswordData ? (
          <>
            {/* Toggle between edit and play mode */}
            <div className="flex justify-end mb-4">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium ${!playMode 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'} 
                    rounded-l-lg border border-gray-200 flex items-center`}
                  onClick={() => setPlayMode(false)}
                >
                  <Edit className="mr-2" size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium ${playMode 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'} 
                    rounded-r-lg border border-gray-200 flex items-center`}
                  onClick={() => setPlayMode(true)}
                >
                  <Play className="mr-2" size={16} />
                  Play
                </button>
              </div>
            </div>
            
            {playMode ? (
              <PlayQuiz 
                crosswordData={crosswordData} 
                onReset={() => setPlayMode(false)} 
              />
            ) : (
              <CrosswordEditor 
                crosswordData={crosswordData} 
                onBack={handleBackToQuestions} 
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-red-500">
              Failed to build crossword. Please try again with different questions.
            </p>
            <button 
              onClick={handleBackToQuestions}
              className="mt-4 btn btn-primary"
            >
              Back to Questions
            </button>
          </div>
        )
      )}
    </div>
  );
}

export default App;