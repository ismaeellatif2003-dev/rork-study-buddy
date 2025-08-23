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
import { Play, CheckCircle, XCircle, Trophy, Clock, Target, ArrowRight, RotateCcw } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useStudy } from '@/hooks/study-store';
import type { TestSession, TestAnswer, TestResult, NoteTestResult, Flashcard } from '@/types/study';

type TestMode = 'selection' | 'testing' | 'results';

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
    const isCorrect = currentAnswer.toLowerCase().trim() === currentFlashcard.answer.toLowerCase().trim();

    const answer: TestAnswer = {
      flashcardId: currentFlashcard.id,
      userAnswer: currentAnswer,
      isCorrect,
      timeSpent,
    };

    const updatedSession = {
      ...currentSession,
      answers: [...currentSession.answers, answer],
      score: currentSession.score + (isCorrect ? 1 : 0),
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
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentSession.currentIndex + 1} of {currentSession.totalQuestions}
            </Text>
          </View>
          <Text style={styles.scoreText}>Score: {currentSession.score}</Text>
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
                {currentSession.answers[currentSession.answers.length - 1]?.isCorrect ? (
                  <>
                    <CheckCircle size={32} color={colors.success} />
                    <Text style={styles.resultText}>Correct!</Text>
                  </>
                ) : (
                  <>
                    <XCircle size={32} color={colors.error} />
                    <Text style={styles.resultText}>Incorrect</Text>
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
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  noteCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  noteSelectedText: {
    color: colors.primary,
  },
  noteFlashcardCount: {
    fontSize: 14,
    color: colors.textSecondary,
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
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  startButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  testHeader: {
    padding: 20,
    paddingBottom: 16,
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
    paddingHorizontal: 20,
  },
  questionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
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