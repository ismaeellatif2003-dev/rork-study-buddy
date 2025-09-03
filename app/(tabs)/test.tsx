import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, CheckCircle, XCircle, Trophy, Clock, Target, ArrowRight, RotateCcw, ChevronLeft } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useStudy } from '@/hooks/study-store';
import type { TestSession, TestAnswer, TestResult, NoteTestResult, Flashcard } from '@/types/study';

type TestMode = 'selection' | 'testing' | 'results';

// Enhanced answer checking function that's more flexible
const checkAnswer = (userAnswer: string, correctAnswer: string): { isCorrect: boolean; confidence: number; reason: string } => {
  const user = userAnswer.toLowerCase().trim();
  const correct = correctAnswer.toLowerCase().trim();
  
  // Exact match (highest confidence)
  if (user === correct) {
    return { isCorrect: true, confidence: 1.0, reason: 'Exact match!' };
  }
  
  // Check if user answer contains key words from correct answer
  const correctWords = correct.split(/\s+/).filter(word => word.length > 2);
  const userWords = user.split(/\s+/);
  
  let matchingWords = 0;
  let totalKeyWords = correctWords.length;
  
  for (const word of correctWords) {
    if (userWords.some(userWord => userWord.includes(word) || word.includes(userWord))) {
      matchingWords++;
    }
  }
  
  // Calculate confidence based on word matching
  const wordConfidence = totalKeyWords > 0 ? matchingWords / totalKeyWords : 0;
  
  // Bonus for concise answers that contain key concepts
  let conciseBonus = 0;
  if (user.split(/\s+/).length <= 3 && wordConfidence >= 0.5) {
    conciseBonus = 0.1; // 10% bonus for concise but accurate answers
  }
  
  // Check for partial matches (e.g., "photosynthesis" vs "photo synthesis")
  const userNormalized = user.replace(/\s+/g, '');
  const correctNormalized = correct.replace(/\s+/g, '');
  
  let partialConfidence = 0;
  if (userNormalized.length > 0 && correctNormalized.length > 0) {
    const longer = Math.max(userNormalized.length, correctNormalized.length);
    const shorter = Math.min(userNormalized.length, correctNormalized.length);
    
    // Check if one is contained within the other
    if (userNormalized.includes(correctNormalized) || correctNormalized.includes(userNormalized)) {
      partialConfidence = shorter / longer;
    }
  }
  
  // Check for synonym-like matches (common variations)
  let synonymConfidence = 0;
  const commonSynonyms = [
    ['photosynthesis', 'photo synthesis', 'photo-synthesis'],
    ['mitochondria', 'mitochondrion'],
    ['nucleus', 'nuclei'],
    ['cell', 'cells'],
    ['process', 'processes'],
    ['function', 'functions'],
    ['structure', 'structures'],
    ['energy', 'energetic'],
    ['molecule', 'molecular'],
    ['atom', 'atomic'],
    ['chemical', 'chemistry'],
    ['biological', 'biology'],
    ['physical', 'physics'],
    ['mathematical', 'mathematics'],
    ['historical', 'history'],
    ['geographical', 'geography'],
    ['political', 'politics'],
    ['economic', 'economics'],
    ['social', 'society'],
    ['cultural', 'culture'],
    // Common abbreviations and variations
    ['dna', 'deoxyribonucleic acid'],
    ['rna', 'ribonucleic acid'],
    ['atp', 'adenosine triphosphate'],
    ['adp', 'adenosine diphosphate'],
    ['nad', 'nicotinamide adenine dinucleotide'],
    ['fad', 'flavin adenine dinucleotide'],
    ['co2', 'carbon dioxide'],
    ['h2o', 'water'],
    ['o2', 'oxygen'],
    ['n2', 'nitrogen'],
    ['ph', 'ph level', 'acidity'],
    ['temp', 'temperature'],
    ['vol', 'volume'],
    ['wt', 'weight'],
    ['amt', 'amount'],
    ['qty', 'quantity'],
    ['info', 'information'],
    ['calc', 'calculation', 'calculate'],
    ['eq', 'equation', 'equal'],
    ['formula', 'formulae', 'formulas']
  ];
  
  for (const [syn1, syn2, syn3] of commonSynonyms) {
    if ((user.includes(syn1) && (correct.includes(syn2) || correct.includes(syn3))) ||
        (user.includes(syn2) && correct.includes(syn1)) ||
        (user.includes(syn3) && correct.includes(syn1))) {
      synonymConfidence = 0.8;
      break;
    }
  }
  
  // Use the highest confidence between word matching, partial matching, and synonyms
  let confidence = Math.max(wordConfidence, partialConfidence, synonymConfidence);
  
  // Apply concise bonus
  confidence = Math.min(1.0, confidence + conciseBonus);
  
  // Mark as correct if confidence is above threshold (lowered to 50% for more flexibility)
  const isCorrect = confidence >= 0.5; // 50% threshold for being "along the right lines"
  
  let reason = '';
  if (isCorrect) {
    if (confidence >= 0.9) {
      reason = 'Excellent answer! Very close to perfect.';
    } else if (confidence >= 0.8) {
      reason = 'Great answer! You understand the key concepts.';
    } else if (confidence >= 0.7) {
      reason = 'Good answer! You\'re on the right track.';
    } else if (confidence >= 0.5) {
      reason = 'Good answer! You captured the main ideas.';
    }
  } else {
    if (confidence >= 0.4) {
      reason = 'Close! Try to include more key concepts.';
    } else if (confidence >= 0.2) {
      reason = 'You have some right ideas, but need more details.';
    } else {
      reason = 'Try to focus on the key concepts from the question.';
    }
  }
  
  return { isCorrect, confidence, reason };
};

export default function TestScreen() {
  const { notes, flashcards } = useStudy();
  const [mode, setMode] = useState<TestMode>('selection');
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [fadeAnim] = useState(new Animated.Value(1));
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; confidence: number; reason: string } | null>(null);

  const availableNotes = useMemo(() => {
    return notes.filter(note => {
      const noteFlashcards = flashcards.filter(card => card.noteId === note.id);
      return noteFlashcards.length > 0;
    });
  }, [notes, flashcards]);

  const selectedFlashcards = useMemo(() => {
    return flashcards.filter(card => selectedNoteIds.includes(card.noteId));
  }, [flashcards, selectedNoteIds]);

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const startTest = () => {
    if (selectedNoteIds.length === 0) {
      Alert.alert('No Notes Selected', 'Please select at least one note to test.');
      return;
    }

    const shuffledFlashcards = [...selectedFlashcards].sort(() => Math.random() - 0.5);
    
    const session: TestSession = {
      id: Date.now().toString(),
      selectedNoteIds,
      flashcards: shuffledFlashcards,
      currentIndex: 0,
      score: 0,
      totalQuestions: shuffledFlashcards.length,
      startTime: new Date(),
      answers: [],
    };

    setCurrentSession(session);
    setQuestionStartTime(new Date());
    setMode('testing');
    setCurrentAnswer('');
    setShowAnswer(false);
  };

  const submitAnswer = () => {
    if (!currentSession) return;

    const currentFlashcard = currentSession.flashcards[currentSession.currentIndex];
    const timeSpent = Date.now() - questionStartTime.getTime();
    
    // Use enhanced answer checking
    const feedback = checkAnswer(currentAnswer, currentFlashcard.answer);
    setAnswerFeedback(feedback);

    const answer: TestAnswer = {
      flashcardId: currentFlashcard.id,
      userAnswer: currentAnswer,
      isCorrect: feedback.isCorrect,
      timeSpent,
    };

    const updatedSession = {
      ...currentSession,
      answers: [...currentSession.answers, answer],
      score: currentSession.score + (feedback.isCorrect ? 1 : 0),
    };

    setCurrentSession(updatedSession);
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (!currentSession) return;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentSession.currentIndex + 1 >= currentSession.totalQuestions) {
      finishTest();
    } else {
      const updatedSession = {
        ...currentSession,
        currentIndex: currentSession.currentIndex + 1,
      };
      setCurrentSession(updatedSession);
      setCurrentAnswer('');
      setShowAnswer(false);
      setQuestionStartTime(new Date());
    }
  };

  const finishTest = () => {
    if (!currentSession) return;

    const endTime = new Date();
    const totalTimeSpent = endTime.getTime() - currentSession.startTime.getTime();
    const percentage = Math.round((currentSession.score / currentSession.totalQuestions) * 100);

    const noteResults: NoteTestResult[] = selectedNoteIds.map(noteId => {
      const note = notes.find(n => n.id === noteId)!;
      const noteAnswers = currentSession.answers.filter(answer => {
        const flashcard = currentSession.flashcards.find(f => f.id === answer.flashcardId);
        return flashcard?.noteId === noteId;
      });
      const correct = noteAnswers.filter(a => a.isCorrect).length;
      const total = noteAnswers.length;
      
      return {
        noteId,
        noteTitle: note.title,
        correct,
        total,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      };
    });

    const result: TestResult = {
      sessionId: currentSession.id,
      score: currentSession.score,
      totalQuestions: currentSession.totalQuestions,
      percentage,
      timeSpent: totalTimeSpent,
      noteResults,
    };

    setTestResult(result);
    setMode('results');
  };

  const resetTest = () => {
    setMode('selection');
    setSelectedNoteIds([]);
    setCurrentSession(null);
    setCurrentAnswer('');
    setShowAnswer(false);
    setTestResult(null);
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (mode === 'selection') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Test Your Knowledge</Text>
          <Text style={styles.subtitle}>Select notes to create a mixed test</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {availableNotes.length === 0 ? (
            <View style={styles.emptyState}>
              <Target size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Flashcards Available</Text>
              <Text style={styles.emptySubtitle}>
                Create some flashcards from your notes first to start testing your knowledge.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.selectionHeader}>
                <Text style={styles.selectionTitle}>Available Notes</Text>
                <Text style={styles.selectionCount}>
                  {selectedFlashcards.length} flashcards selected
                </Text>
              </View>

              {availableNotes.map(note => {
                const noteFlashcards = flashcards.filter(card => card.noteId === note.id);
                const isSelected = selectedNoteIds.includes(note.id);
                
                return (
                  <TouchableOpacity
                    key={note.id}
                    style={[styles.noteCard, isSelected && styles.noteCardSelected]}
                    onPress={() => toggleNoteSelection(note.id)}
                  >
                    <View style={styles.noteCardContent}>
                      <View style={styles.noteInfo}>
                        <Text style={[styles.noteTitle, isSelected && styles.noteSelectedText]}>
                          {note.title}
                        </Text>
                        <Text style={[styles.noteFlashcardCount, isSelected && styles.noteSelectedSubtext]}>
                          {noteFlashcards.length} flashcard{noteFlashcards.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <CheckCircle size={20} color={colors.primary} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {selectedNoteIds.length > 0 && (
                <TouchableOpacity style={styles.startButton} onPress={startTest}>
                  <Play size={20} color="white" />
                  <Text style={styles.startButtonText}>Start Test</Text>
                  <Text style={styles.startButtonSubtext}>
                    {selectedFlashcards.length} questions
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode === 'testing' && currentSession) {
    const currentFlashcard = currentSession.flashcards[currentSession.currentIndex];
    const progress = ((currentSession.currentIndex + 1) / currentSession.totalQuestions) * 100;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.testHeader}>
          <View style={styles.testHeaderTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                Alert.alert(
                  'Exit Test?',
                  'Are you sure you want to exit? Your progress will be lost.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Exit', style: 'destructive', onPress: resetTest }
                  ]
                );
              }}
            >
              <ChevronLeft color={colors.primary} size={24} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            
            <Text style={styles.scoreText}>Score: {currentSession.score}</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentSession.currentIndex + 1} of {currentSession.totalQuestions}
            </Text>
          </View>
        </View>

        <Animated.View style={[styles.testContent, { opacity: fadeAnim }]}>
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>Question</Text>
            <Text style={styles.questionText}>{currentFlashcard.question}</Text>
          </View>

          {!showAnswer ? (
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Your Answer</Text>
              <TextInput
                style={styles.answerInput}
                value={currentAnswer}
                onChangeText={setCurrentAnswer}
                placeholder="Type your answer here..."
                placeholderTextColor={colors.textSecondary}
                multiline
                autoFocus
              />
              <TouchableOpacity 
                style={[styles.submitButton, !currentAnswer.trim() && styles.submitButtonDisabled]} 
                onPress={submitAnswer}
                disabled={!currentAnswer.trim()}
              >
                <Text style={styles.submitButtonText}>Submit Answer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultSection}>
              <View style={styles.answerComparison}>
                <View style={styles.userAnswerCard}>
                  <Text style={styles.answerComparisonLabel}>Your Answer</Text>
                  <Text style={styles.userAnswerText}>{currentAnswer}</Text>
                </View>
                
                <View style={styles.correctAnswerCard}>
                  <Text style={styles.answerComparisonLabel}>Correct Answer</Text>
                  <Text style={styles.correctAnswerText}>{currentFlashcard.answer}</Text>
                </View>
              </View>

              <View style={styles.resultIndicator}>
                {answerFeedback?.isCorrect ? (
                  <>
                    <CheckCircle size={32} color={colors.success} />
                    <Text style={styles.resultText}>Correct!</Text>
                    <Text style={styles.feedbackText}>{answerFeedback.reason}</Text>
                    {answerFeedback.confidence < 1.0 && (
                      <View style={styles.confidenceContainer}>
                        <Text style={styles.confidenceLabel}>Accuracy:</Text>
                        <Text style={styles.confidenceValue}>
                          {Math.round(answerFeedback.confidence * 100)}%
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle size={32} color={colors.error} />
                    <Text style={styles.resultText}>Incorrect</Text>
                    <Text style={styles.feedbackText}>{answerFeedback?.reason}</Text>
                    <View style={styles.confidenceContainer}>
                      <Text style={styles.confidenceLabel}>Accuracy:</Text>
                      <Text style={styles.confidenceValue}>
                        {Math.round((answerFeedback?.confidence || 0) * 100)}%
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
                <Text style={styles.nextButtonText}>
                  {currentSession.currentIndex + 1 >= currentSession.totalQuestions ? 'Finish Test' : 'Next Question'}
                </Text>
                <ArrowRight size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (mode === 'results' && testResult) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsHeader}>
            <Trophy size={64} color={colors.primary} />
            <Text style={styles.resultsTitle}>Test Complete!</Text>
            <Text style={styles.resultsScore}>
              {testResult.score} / {testResult.totalQuestions}
            </Text>
            <Text style={styles.resultsPercentage}>{testResult.percentage}%</Text>
          </View>

          <View style={styles.resultsStats}>
            <View style={styles.statCard}>
              <Clock size={24} color={colors.primary} />
              <Text style={styles.statValue}>{formatTime(testResult.timeSpent)}</Text>
              <Text style={styles.statLabel}>Time Spent</Text>
            </View>
            <View style={styles.statCard}>
              <Target size={24} color={colors.primary} />
              <Text style={styles.statValue}>{testResult.percentage}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>

          <View style={styles.noteResultsSection}>
            <Text style={styles.noteResultsTitle}>Results by Note</Text>
            {testResult.noteResults.map(noteResult => (
              <View key={noteResult.noteId} style={styles.noteResultCard}>
                <Text style={styles.noteResultTitle}>{noteResult.noteTitle}</Text>
                <View style={styles.noteResultStats}>
                  <Text style={styles.noteResultScore}>
                    {noteResult.correct} / {noteResult.total}
                  </Text>
                  <Text style={styles.noteResultPercentage}>
                    {noteResult.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.retestButton} onPress={resetTest}>
            <RotateCcw size={20} color="white" />
            <Text style={styles.retestButtonText}>Take Another Test</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  selectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  noteCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  noteCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  noteCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 24,
  },
  noteSelectedText: {
    color: colors.primary,
  },
  noteFlashcardCount: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  noteSelectedSubtext: {
    color: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: 'white',
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 19,
    fontWeight: '700',
    marginLeft: 10,
    marginRight: 10,
  },
  startButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  testHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  testHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  testContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 24,
  },
  answerSection: {
    flex: 1,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultSection: {
    flex: 1,
  },
  answerComparison: {
    marginBottom: 24,
  },
  userAnswerCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  correctAnswerCard: {
    backgroundColor: colors.successLight,
    borderRadius: 12,
    padding: 16,
  },
  answerComparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userAnswerText: {
    fontSize: 16,
    color: colors.text,
  },
  correctAnswerText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: '500',
  },
  resultIndicator: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    color: colors.text,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  confidenceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 6,
    fontWeight: '500',
  },
  confidenceValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  resultsHeader: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  resultsScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  resultsPercentage: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  resultsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    minWidth: 120,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteResultsSection: {
    marginBottom: 32,
  },
  noteResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  noteResultCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteResultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  noteResultStats: {
    alignItems: 'flex-end',
  },
  noteResultScore: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  noteResultPercentage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  retestButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  retestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});