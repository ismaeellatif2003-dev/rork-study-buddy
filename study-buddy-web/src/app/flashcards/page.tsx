'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Shuffle, CheckCircle, XCircle, Zap, BookOpen, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { mockFlashcards } from '@/data/mockData';
import { updateUserStats } from '@/utils/userStats';
import { getFlashcardSets, normalizeFlashcardSet } from '@/utils/flashcardSets';
import { flashcardsApi } from '@/services/dataService';
import { useAuth } from '@/hooks/useAuth';
import { useFlashcardSets } from '@/hooks/useFlashcardSets';
import type { Flashcard } from '@/types/study';
import type { FlashcardSet } from '@/utils/flashcardSets';

type StudyMode = 'study' | 'results';

// Mock flashcard sets with their actual flashcards - in a real app, these would come from the backend
const mockFlashcardSets = [
  {
    id: '1',
    name: 'Biology Basics',
    description: 'Basic biology concepts and terminology',
    cardCount: 8,
    createdAt: '2024-01-15',
    flashcards: [
      {
        id: 'bio-1',
        front: 'What is photosynthesis?',
        back: 'The process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen.',
        category: 'Biology',
        difficulty: 'Easy',
        createdAt: '2024-01-15',
      },
      {
        id: 'bio-2',
        front: 'What is the powerhouse of the cell?',
        back: 'The mitochondria, which produces ATP (adenosine triphosphate) for cellular energy.',
        category: 'Biology',
        difficulty: 'Easy',
        createdAt: '2024-01-15',
      },
      {
        id: 'bio-3',
        front: 'What is DNA?',
        back: 'Deoxyribonucleic acid - the molecule that carries genetic instructions for development and function.',
        category: 'Biology',
        difficulty: 'Medium',
        createdAt: '2024-01-15',
      },
      {
        id: 'bio-4',
        front: 'What is the difference between mitosis and meiosis?',
        back: 'Mitosis produces identical diploid cells for growth and repair, while meiosis produces haploid gametes for reproduction.',
        category: 'Biology',
        difficulty: 'Hard',
        createdAt: '2024-01-15',
      },
    ],
  },
  {
    id: '2', 
    name: 'React Fundamentals',
    description: 'Core React concepts and hooks',
    cardCount: 6,
    createdAt: '2024-01-20',
    flashcards: [
      {
        id: 'react-1',
        front: 'What is JSX?',
        back: 'JSX is a syntax extension for JavaScript that allows you to write HTML-like code in React components.',
        category: 'React',
        difficulty: 'Easy',
        createdAt: '2024-01-20',
      },
      {
        id: 'react-2',
        front: 'What is the useState hook?',
        back: 'useState is a React hook that allows you to add state to functional components.',
        category: 'React',
        difficulty: 'Easy',
        createdAt: '2024-01-20',
      },
      {
        id: 'react-3',
        front: 'What is the useEffect hook?',
        back: 'useEffect is a React hook that allows you to perform side effects in functional components, like data fetching or subscriptions.',
        category: 'React',
        difficulty: 'Medium',
        createdAt: '2024-01-20',
      },
      {
        id: 'react-4',
        front: 'What is the difference between props and state?',
        back: 'Props are data passed down from parent components (immutable), while state is internal component data that can change.',
        category: 'React',
        difficulty: 'Medium',
        createdAt: '2024-01-20',
      },
      {
        id: 'react-5',
        front: 'What is a React component?',
        back: 'A React component is a reusable piece of UI that can accept props and return JSX elements.',
        category: 'React',
        difficulty: 'Easy',
        createdAt: '2024-01-20',
      },
      {
        id: 'react-6',
        front: 'What is the virtual DOM?',
        back: 'The virtual DOM is a JavaScript representation of the real DOM that React uses to optimize updates and rendering.',
        category: 'React',
        difficulty: 'Hard',
        createdAt: '2024-01-20',
      },
    ],
  },
  {
    id: '3',
    name: 'History Timeline',
    description: 'Important historical events and dates',
    cardCount: 5,
    createdAt: '2024-01-25',
    flashcards: [
      {
        id: 'hist-1',
        front: 'When did World War II end?',
        back: 'World War II ended on September 2, 1945, with the formal surrender of Japan.',
        category: 'History',
        difficulty: 'Easy',
        createdAt: '2024-01-25',
      },
      {
        id: 'hist-2',
        front: 'When was the Declaration of Independence signed?',
        back: 'The Declaration of Independence was signed on July 4, 1776.',
        category: 'History',
        difficulty: 'Easy',
        createdAt: '2024-01-25',
      },
      {
        id: 'hist-3',
        front: 'When did the Berlin Wall fall?',
        back: 'The Berlin Wall fell on November 9, 1989, marking the beginning of German reunification.',
        category: 'History',
        difficulty: 'Medium',
        createdAt: '2024-01-25',
      },
      {
        id: 'hist-4',
        front: 'When did the Renaissance begin?',
        back: 'The Renaissance began in the 14th century in Italy, marking a period of cultural and intellectual rebirth.',
        category: 'History',
        difficulty: 'Medium',
        createdAt: '2024-01-25',
      },
      {
        id: 'hist-5',
        front: 'When did the Industrial Revolution start?',
        back: 'The Industrial Revolution began in the late 18th century in Britain, around 1760-1840.',
        category: 'History',
        difficulty: 'Hard',
        createdAt: '2024-01-25',
      },
    ],
  },
];

export default function FlashcardsPage() {
  const { isAuthenticated } = useAuth();
  const { deleteFlashcardFromSet } = useFlashcardSets();
  const [flashcards] = useState<Flashcard[]>(mockFlashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState<StudyMode>('study');
  const [correctAnswers, setCorrectAnswers] = useState<Set<string>>(new Set());
  const [incorrectAnswers, setIncorrectAnswers] = useState<Set<string>>(new Set());
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>(mockFlashcards);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [showSetSelector, setShowSetSelector] = useState(false);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [userFlashcardSets, setUserFlashcardSets] = useState<FlashcardSet[]>([]);
  const [allFlashcardSets, setAllFlashcardSets] = useState<FlashcardSet[]>([]);

  // Load user-generated flashcard sets and backend flashcards
  const loadFlashcardSets = async () => {
      // Load local flashcard sets
      const userSets = getFlashcardSets();
      console.log('🔍 Loaded user sets from localStorage:', userSets);
      let backendSets: FlashcardSet[] = [];
      
      // Load from backend if authenticated
      if (isAuthenticated) {
        try {
          console.log('🔄 Loading flashcards from backend...');
          const response = await flashcardsApi.getAll();
          console.log('📄 Backend response:', response);
          if (response.success && response.flashcards) {
            console.log('✅ Backend flashcards loaded:', response.flashcards.length);
            // Group backend flashcards by set
            interface FlashcardSetData {
              id: string;
              name: string;
              description: string;
              cardCount: number;
              createdAt: string;
              source: string;
              flashcards: Array<{
                id: string;
                front: string;
                back: string;
                category: string;
                difficulty: string;
                createdAt: string;
              }>;
            }
            const setMap = new Map<string, FlashcardSetData>();
            
            response.flashcards.forEach((card: Record<string, unknown>) => {
              const setId = card.set_id as string;
              if (!setMap.has(setId)) {
                setMap.set(setId, {
                  id: setId,
                  name: card.set_name as string,
                  description: (card.set_description as string) || '',
                  cardCount: 0,
                  createdAt: card.created_at as string,
                  source: 'backend',
                  flashcards: [],
                });
              }
              
              const set = setMap.get(setId);
              if (set) {
              set.flashcards.push({
                id: (card.id as number).toString(),
                front: card.front as string,
                back: card.back as string,
                category: card.set_name as string,
                difficulty: (card.difficulty as string) || 'Medium',
                createdAt: card.created_at as string,
              });
                set.cardCount++;
              }
            });
            
            backendSets = Array.from(setMap.values());
          }
        } catch (error) {
          console.error('Failed to load flashcards from backend:', error);
        }
      }
      
      // Normalize all sets to ensure consistent format
      const normalizedBackendSets = backendSets.map(set => normalizeFlashcardSet(set as unknown as Record<string, unknown>, 'backend'));
      const normalizedUserSets = userSets.map(set => normalizeFlashcardSet(set as unknown as Record<string, unknown>, 'user'));
      const normalizedMockSets = mockFlashcardSets.map(set => normalizeFlashcardSet(set as unknown as Record<string, unknown>, 'mock'));
      
      const allSets = [...normalizedBackendSets, ...normalizedUserSets, ...normalizedMockSets];
      console.log('🔍 Setting user flashcard sets:', normalizedUserSets);
      console.log('🔍 Setting all flashcard sets:', allSets);
      setUserFlashcardSets(normalizedUserSets);
      setAllFlashcardSets(allSets);
    };

  // Load flashcards on component mount and when authentication changes
  useEffect(() => {
    loadFlashcardSets();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh flashcards when page becomes visible (user switches back from mobile app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log('🔄 Page became visible, refreshing flashcards...');
        loadFlashcardSets();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for flashcard set updates
  useEffect(() => {
    const handleFlashcardSetsUpdate = (e: CustomEvent) => {
      const userSets = e.detail as Record<string, unknown>[];
      const normalizedUserSets = userSets.map((set: Record<string, unknown>) => normalizeFlashcardSet(set, 'user'));
      const normalizedMockSets = mockFlashcardSets.map(set => normalizeFlashcardSet(set, 'mock'));
      const allSets = [...normalizedUserSets, ...normalizedMockSets];
      setUserFlashcardSets(normalizedUserSets);
      setAllFlashcardSets(allSets);
    };

    window.addEventListener('flashcardSetsUpdated', handleFlashcardSetsUpdate as EventListener);

    return () => {
      window.removeEventListener('flashcardSetsUpdated', handleFlashcardSetsUpdate as EventListener);
    };
  }, []);

  const currentCard = shuffledCards[currentIndex];
  const isLastCard = currentIndex === shuffledCards.length - 1;
  const isFirstCard = currentIndex === 0;

  const handleNext = () => {
    if (!isLastCard) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirstCard) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
    setCorrectAnswers(new Set());
    setIncorrectAnswers(new Set());
  };

  const handleReset = () => {
    // Reset to the original set of flashcards for the selected set
    let cardsToLoad: Flashcard[];
    if (!selectedSetId) {
      // "All Flashcards" - use the original mock flashcards
      cardsToLoad = mockFlashcards;
    } else {
      // Find the selected set and use its flashcards
      const selectedSet = allFlashcardSets.find(set => set.id === selectedSetId);
      cardsToLoad = selectedSet ? selectedSet.flashcards : mockFlashcards;
    }
    
    setShuffledCards(cardsToLoad);
    setCurrentIndex(0);
    setShowAnswer(false);
    setCorrectAnswers(new Set());
    setIncorrectAnswers(new Set());
  };

  const handleSelectSet = (setId: string) => {
    setSelectedSetId(setId);
    setShowSetSelector(false);
    
    // Load flashcards based on selected set
    let cardsToLoad: Flashcard[];
    if (setId === '') {
      // "All Flashcards" - use the original mock flashcards
      cardsToLoad = mockFlashcards;
    } else {
      // Find the selected set and use its flashcards (from user-generated or mock sets)
      const selectedSet = allFlashcardSets.find(set => set.id === setId);
      cardsToLoad = selectedSet ? selectedSet.flashcards : mockFlashcards;
    }
    
    setShuffledCards(cardsToLoad);
    setCurrentIndex(0);
    setShowAnswer(false);
    setCorrectAnswers(new Set());
    setIncorrectAnswers(new Set());
    setSelectedCardIds(new Set()); // Clear individual card selections
  };

  const getSelectedSetName = () => {
    if (!selectedSetId) return 'All Flashcards';
    const set = allFlashcardSets.find(s => s.id === selectedSetId);
    return set ? set.name : 'All Flashcards';
  };

  const handleCardSelection = (cardId: string) => {
    setSelectedCardIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleSelectAllCards = () => {
    setSelectedCardIds(new Set(shuffledCards.map(card => card.id)));
  };

  const handleDeselectAllCards = () => {
    setSelectedCardIds(new Set());
  };

  const handleStudySelectedCards = () => {
    if (selectedCardIds.size === 0) {
      alert('Please select at least one card to study');
      return;
    }
    
    const filteredCards = shuffledCards.filter(card => selectedCardIds.has(card.id));
    setShuffledCards(filteredCards);
    setCurrentIndex(0);
    setShowAnswer(false);
    setCorrectAnswers(new Set());
    setIncorrectAnswers(new Set());
    setShowCardSelector(false);
  };

  const getSelectedCardsCount = () => {
    return selectedCardIds.size;
  };

  const handleDeleteFlashcard = (cardId: string) => {
    if (!selectedSetId) {
      alert('Cannot delete cards from "All Flashcards" view. Please select a specific flashcard set first.');
      return;
    }

    if (confirm('Are you sure you want to delete this flashcard? This action cannot be undone.')) {
      // Find which set this card belongs to
      const setContainingCard = allFlashcardSets.find(set => 
        set.flashcards.some(card => card.id === cardId)
      );
      
      if (setContainingCard) {
        // Only allow deletion from user-generated sets, not mock sets
        if (userFlashcardSets.some(userSet => userSet.id === setContainingCard.id)) {
          deleteFlashcardFromSet(setContainingCard.id, cardId);
          
          // Remove the card from current study session if it's selected
          setSelectedCardIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(cardId);
            return newSet;
          });
          
          // If this card is currently being studied, move to next card
          if (currentCard && currentCard.id === cardId) {
            if (shuffledCards.length > 1) {
              const currentCardIndex = shuffledCards.findIndex(card => card.id === cardId);
              if (currentCardIndex < shuffledCards.length - 1) {
                setCurrentIndex(currentCardIndex);
              } else {
                setCurrentIndex(Math.max(0, currentCardIndex - 1));
              }
            }
          }
          
          // Reload the flashcard sets to reflect the deletion
          loadFlashcardSets();
        } else {
          alert('Cannot delete cards from default flashcard sets. You can only delete cards from sets you created.');
        }
      }
    }
  };

  const handleCorrect = () => {
    setCorrectAnswers(prev => new Set([...prev, currentCard.id]));
    setIncorrectAnswers(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentCard.id);
      return newSet;
    });
    if (!isLastCard) {
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  };

  const handleIncorrect = () => {
    setIncorrectAnswers(prev => new Set([...prev, currentCard.id]));
    setCorrectAnswers(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentCard.id);
      return newSet;
    });
    if (!isLastCard) {
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  };

  const handleFinishStudy = () => {
    setStudyMode('results');
  };

  const handleStartNewStudy = () => {
    setStudyMode('study');
    setCurrentIndex(0);
    setShowAnswer(false);
    setCorrectAnswers(new Set());
    setIncorrectAnswers(new Set());
  };

  const accuracy = flashcards.length > 0 ? Math.round((correctAnswers.size / flashcards.length) * 100) : 0;

  if (studyMode === 'results') {
    return (
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Complete!</h1>
                <p className="text-gray-600">Here&apos;s how you did:</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 p-6 rounded-lg">
                  <CheckCircle size={32} className="mx-auto text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-600">{correctAnswers.size}</div>
                  <div className="text-sm text-green-700">Correct</div>
                </div>
                <div className="bg-red-50 p-6 rounded-lg">
                  <XCircle size={32} className="mx-auto text-red-600 mb-2" />
                  <div className="text-2xl font-bold text-red-600">{incorrectAnswers.size}</div>
                  <div className="text-sm text-red-700">Incorrect</div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg mb-8">
                <div className="text-4xl font-bold text-blue-600 mb-2">{accuracy}%</div>
                <div className="text-sm text-blue-700">Accuracy</div>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button onClick={handleStartNewStudy} className="bg-blue-600 text-white hover:bg-blue-700">
                  Study Again
                </Button>
                <Button onClick={handleShuffle} className="bg-green-600 text-white hover:bg-green-700">
                  <Shuffle size={16} className="mr-2" />
                  Shuffle & Study
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-600 mt-1">Study your flashcards and test your knowledge</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              loadFlashcardSets();
            }} 
            variant="outline"
            className="flex items-center gap-2"
            title="Refresh flashcards from backend"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowSetSelector(true)} 
            className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
          >
            <BookOpen size={16} />
            {getSelectedSetName()}
          </Button>
          <Button 
            onClick={() => setShowCardSelector(true)} 
            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
          >
            <Zap size={16} />
            Select Cards ({getSelectedCardsCount()})
          </Button>
          <Button onClick={handleShuffle} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
            <Shuffle size={16} />
            Shuffle
          </Button>
          <Button onClick={handleReset} className="flex items-center gap-2 bg-gray-600 text-white hover:bg-gray-700">
            <RotateCcw size={16} />
            Reset
          </Button>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Zap size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No flashcards yet</h2>
            <p className="text-gray-600 mb-6">
              Create notes first, then generate flashcards from them
            </p>
            <Button onClick={() => window.location.href = '/notes'} className="bg-blue-600 text-white hover:bg-blue-700">
              Go to Notes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Card {currentIndex + 1} of {shuffledCards.length}</span>
              <span>{Math.round(((currentIndex + 1) / shuffledCards.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Flashcard */}
          <Card className="mb-6 min-h-64">
            <CardContent className="p-8 text-center flex flex-col justify-center min-h-64">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {showAnswer ? 'Answer' : 'Question'}
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {showAnswer ? currentCard.back : currentCard.front}
                </p>
              </div>
              
              {!showAnswer && (
                <Button onClick={() => setShowAnswer(true)} size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                  Show Answer
                </Button>
              )}
              
              {showAnswer && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">
                    How well did you know this?
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={handleIncorrect}
                      className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
                    >
                      <XCircle size={16} />
                      Incorrect
                    </Button>
                    <Button
                      onClick={handleCorrect}
                      className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle size={16} />
                      Correct
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              disabled={isFirstCard}
              className="flex items-center gap-2 bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300"
            >
              <ArrowLeft size={16} />
              Previous
            </Button>
            
            <div className="flex gap-2">
              {correctAnswers.has(currentCard.id) && (
                <span className="text-green-600 text-sm font-medium">✓ Correct</span>
              )}
              {incorrectAnswers.has(currentCard.id) && (
                <span className="text-red-600 text-sm font-medium">✗ Incorrect</span>
              )}
            </div>
            
            {isLastCard ? (
              <Button onClick={handleFinishStudy} className="bg-blue-600 text-white hover:bg-blue-700">
                Finish Study
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                Next
                <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Flashcard Set Selector Modal */}
      {showSetSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Select Flashcard Set</h2>
                <button
                  onClick={() => setShowSetSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleSelectSet('')}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    !selectedSetId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">All Flashcards</div>
                  <div className="text-sm text-gray-600">Study all available flashcards</div>
                </button>
                
                {allFlashcardSets.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => handleSelectSet(set.id)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                      selectedSetId === set.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{set.name}</div>
                          {userFlashcardSets.some(userSet => userSet.id === set.id) && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Your Set
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{set.description}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          {set.flashcards.length} cards • Created {new Date(set.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-500">{set.flashcards.length}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowSetSelector(false)}
                  className="bg-gray-600 text-white hover:bg-gray-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Card Selector Modal */}
      {showCardSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Select Cards to Study</h2>
                {/* Debug info */}
                <div className="text-xs text-gray-500">
                  User sets: {userFlashcardSets.length} | All sets: {allFlashcardSets.length}
                </div>
                <button
                  onClick={() => setShowCardSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4 flex gap-2">
                <Button
                  onClick={handleSelectAllCards}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  size="sm"
                >
                  Select All
                </Button>
                <Button
                  onClick={handleDeselectAllCards}
                  className="bg-gray-600 text-white hover:bg-gray-700"
                  size="sm"
                >
                  Deselect All
                </Button>
                <div className="flex items-center text-sm text-gray-600">
                  {getSelectedCardsCount()} of {shuffledCards.length} cards selected
                </div>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {shuffledCards.map((card, index) => {
                  // Check if this card belongs to a user-generated set
                  const setContainingCard = allFlashcardSets.find(set => 
                    set.flashcards.some(c => c.id === card.id)
                  );
                  
                  // Debug logging
                  console.log('Card:', card.id, 'Set containing card:', setContainingCard?.id, 'User sets:', userFlashcardSets.map(s => s.id));
                  
                  // Check if this is a user-generated set (not mock or backend)
                  const canDelete = setContainingCard && (
                    userFlashcardSets.some(userSet => userSet.id === setContainingCard.id) ||
                    (setContainingCard as any).source === 'user' ||
                    !(setContainingCard as any).source // If no source, assume it's user-generated
                  );
                  
                  // TEMPORARY: Show delete for all cards to test UI
                  const canDeleteTest = true;
                  
                  return (
                    <div
                      key={card.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedCardIds.has(card.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCardSelection(card.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                          selectedCardIds.has(card.id)
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedCardIds.has(card.id) && (
                            <CheckCircle size={12} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900">
                                Card {index + 1}
                              </div>
                              {canDeleteTest && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                  Can Delete (TEST)
                                </span>
                              )}
                            </div>
                            {canDeleteTest && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card selection when clicking delete
                                  handleDeleteFlashcard(card.id);
                                }}
                                className="text-red-500 hover:text-red-700 p-1 rounded flex items-center gap-1"
                                title="Delete this flashcard"
                              >
                                <Trash2 size={14} />
                                <span className="text-xs">Delete (TEST)</span>
                              </button>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Q:</strong> {card.front}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>A:</strong> {card.back}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button
                  onClick={() => setShowCardSelector(false)}
                  className="bg-gray-600 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStudySelectedCards}
                  disabled={getSelectedCardsCount() === 0}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Study Selected Cards ({getSelectedCardsCount()})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
